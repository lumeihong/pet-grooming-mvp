// 真实 Supabase 端到端验证：用 seed 测试账号连真实库跑通完整闭环。
// 流程：登录 -> 发单 -> 匹配 -> 选人 -> 付定金 -> 美容师接单列表 -> 双向聊天
//       -> 开始服务 -> 完成服务 -> 验证聊天被 RLS 关闭。
// 运行：node scripts/verify-supabase-e2e.js
const { createClient } = require('@supabase/supabase-js');
const appJson = require('../app.json');

const { SUPABASE_URL, SUPABASE_ANON_KEY } = appJson.expo.extra;

const CLIENT_PHONE = '+6598000010'; // 测试客户 Test Owner
const GROOMER_PHONE = '+6598000001'; // 测试美容师 Asha
const PASSWORD = 'test1234';
const GROOMER_ID = '11111111-1111-1111-1111-111111111101';

// 两个独立 client（各自维护 session，模拟两台设备）
const newConn = () =>
  createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
const clientDb = newConn();
const groomerDb = newConn();

const assert = (c, m) => {
  if (!c) {
    console.error('❌ FAIL:', m);
    process.exit(1);
  }
  console.log('✅', m);
};

(async () => {
  // 1. 双方登录（手机号 + 密码，Supabase Auth）
  const cLogin = await clientDb.auth.signInWithPassword({ phone: CLIENT_PHONE, password: PASSWORD });
  assert(!cLogin.error, `客户登录 (${cLogin.error?.message || 'ok'})`);
  const clientId = cLogin.data.user.id;

  const gLogin = await groomerDb.auth.signInWithPassword({ phone: GROOMER_PHONE, password: PASSWORD });
  assert(!gLogin.error, `美容师登录 (${gLogin.error?.message || 'ok'})`);
  assert(gLogin.data.user.id === GROOMER_ID, '美容师身份 = seed Asha');

  // 2. 客户发布需求（格式与真实一致）
  const createRes = await clientDb
    .from('orders')
    .insert({
      client_id: clientId,
      pet_type: 'dog',
      pet_size: 'medium',
      services: ['bath', 'haircut'],
      preferred_date: new Date().toISOString().slice(0, 10),
      time_window: '09:00-12:00',
      lat: 1.2868,
      lng: 103.8545,
      address: 'Tanjong Pagar (e2e测试)',
      budget_max: 60,
      note: 'e2e 验证订单',
    })
    .select()
    .single();
  assert(!createRes.error, `发布需求 (${createRes.error?.message || 'ok'})`);
  const order = createRes.data;
  assert(order.status === 'matching', '订单进入 matching');

  // 3. 匹配（数据库函数 match_groomers）
  const matchRes = await clientDb.rpc('match_groomers', { p_order_id: order.id });
  const matches = matchRes.data || [];
  assert(!matchRes.error && matches.length > 0, `匹配到 ${matches.length} 位美容师`);
  assert(matches.some((g) => g.id === GROOMER_ID), '匹配结果包含 Asha（在线+已审核）');
  assert(!matches.some((g) => g.name === 'Mei Ling'), '离线美容师被硬过滤（Mei Ling）');

  // 4. 隐私规则：未付定金前聊天不可写（RLS chat_write 拦截）
  const blocked = await clientDb
    .from('chat_messages')
    .insert({ order_id: order.id, from_user: clientId, text: 'hello' });
  assert(!!blocked.error, `未支付前聊天被 RLS 阻止 (${blocked.error?.code || 'ok'})`);

  // 5. 客户选定美容师 -> awaiting_deposit
  const pickRes = await clientDb
    .from('orders')
    .update({ groomer_id: GROOMER_ID, status: 'awaiting_deposit' })
    .eq('id', order.id)
    .select()
    .single();
  assert(!pickRes.error && pickRes.data.status === 'awaiting_deposit', '选定美容师 -> awaiting_deposit');

  // 6. 客户支付定金 -> confirmed，聊天开启
  const payRes = await clientDb
    .from('orders')
    .update({ status: 'confirmed', deposit_paid: true, deposit_amount: 10 })
    .eq('id', order.id)
    .select()
    .single();
  assert(!payRes.error && payRes.data.status === 'confirmed', '支付定金 -> confirmed');

  // 7. 绑定模式：美容师"派给我的订单"可见
  const assigned = await groomerDb
    .from('orders')
    .select('*')
    .eq('groomer_id', GROOMER_ID)
    .in('status', ['awaiting_deposit', 'confirmed', 'in_progress']);
  assert(!assigned.error && assigned.data.some((o) => o.id === order.id), '美容师可见指派订单（绑定模式）');

  // 8. 双向临时聊天（confirmed 可写）
  const m1 = await clientDb
    .from('chat_messages')
    .insert({ order_id: order.id, from_user: clientId, text: '你好，狗狗已准备好' })
    .select()
    .single();
  assert(!m1.error, '客户发消息成功');
  const m2 = await groomerDb
    .from('chat_messages')
    .insert({ order_id: order.id, from_user: GROOMER_ID, text: '好的，准时到' })
    .select()
    .single();
  assert(!m2.error, '美容师回消息成功');
  const msgs = await groomerDb.from('chat_messages').select('*').eq('order_id', order.id);
  assert(msgs.data.length >= 2, `双方可读聊天记录（${msgs.data.length} 条）`);

  // 9. 美容师开始服务 -> in_progress
  const startRes = await groomerDb
    .from('orders')
    .update({ status: 'in_progress' })
    .eq('id', order.id)
    .select()
    .single();
  assert(!startRes.error && startRes.data.status === 'in_progress', '开始服务 -> in_progress');

  // 10. 美容师完成服务 -> completed
  const doneRes = await groomerDb
    .from('orders')
    .update({ status: 'completed', final_amount: 45 })
    .eq('id', order.id)
    .select()
    .single();
  assert(!doneRes.error && doneRes.data.status === 'completed', '完成服务 -> completed');

  // 11. 隐私规则：完成后聊天自动关闭（RLS 拦截）
  const afterClose = await clientDb
    .from('chat_messages')
    .insert({ order_id: order.id, from_user: clientId, text: '还能发吗' });
  assert(!!afterClose.error, `完成后聊天被 RLS 关闭 (${afterClose.error?.code || 'ok'})`);

  // 12. 客户评价
  const reviewRes = await clientDb
    .from('orders')
    .update({ review: { rating: 5, comment: 'e2e 测试评价', at: new Date().toISOString() } })
    .eq('id', order.id)
    .select()
    .single();
  assert(!reviewRes.error && reviewRes.data.review?.rating === 5, '评价已写入');

  console.log('\n🎉 真实 Supabase 端到端闭环验证全部通过');
  console.log(`   测试订单 id: ${order.id}（completed，可在后台查看）`);
  process.exit(0);
})().catch((e) => {
  console.error('运行异常', e);
  process.exit(1);
});
