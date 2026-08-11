// 端到端逻辑验证（不依赖 RN 运行时）：验证闭环与聊天隐私规则
require('@babel/register')({ configFile: false, babelrc: false, presets: ['@babel/preset-env', '@babel/preset-react'], extensions: ['.js'], only: [/src\/lib/] });
const { demoApi } = require('../src/lib/demoStore');

(async () => {
  const assert = (c, m) => { if (!c) { console.error('❌ FAIL:', m); process.exit(1); } else console.log('✅', m); };

  // 1. 客户登录
  const { user } = await demoApi.signIn('+6599999999', 'client');
  assert(user && user.role === 'client', '客户登录');

  // 2. 发布需求
  const order = await demoApi.createOrder({
    client_id: user.id, pet_type: 'dog', pet_size: 'medium',
    services: ['bath', 'haircut'], time_window: '09:00-12:00',
    lat: 1.2868, lng: 103.8545, address: 'Tanjong Pagar', budget_max: 60,
  });
  assert(order.status === 'matching', '订单进入 matching');
  assert(Array.isArray(order.matches) && order.matches.length > 0, `匹配到 ${order.matches.length} 位美容师`);

  // 3. 隐私规则：未支付前聊天不可发
  const blocked = await demoApi.sendMessage(order.id, user.id, 'hi');
  assert(blocked === null, '未支付前聊天被阻止（隐私规则）');

  // 4. 确认美容师 -> 待付定金
  const g = order.matches[0];
  await demoApi.confirmGroomer(order.id, g.id);
  let o = await demoApi.getOrder(order.id);
  assert(o.status === 'awaiting_deposit', '确认后进入 awaiting_deposit');

  // 5. 支付定金 -> 开启聊天
  await demoApi.payDeposit(order.id);
  o = await demoApi.getOrder(order.id);
  assert(o.status === 'confirmed' && o.deposit_paid, '支付后 confirmed + 定金已付');
  assert(demoApi.chatOpen(o) === true, '聊天开启');

  // 6. 聊天可发
  const msg = await demoApi.sendMessage(order.id, user.id, '我住XX小区');
  assert(msg && msg.text === '我住XX小区', '聊天可发送');

  // 7. 美容师推进状态
  await demoApi.advanceStatus(order.id, 'in_progress');
  o = await demoApi.getOrder(order.id);
  assert(o.status === 'in_progress', '进入 in_progress');

  // 8. 完成 -> 聊天自动关闭
  await demoApi.completeOrder(order.id);
  o = await demoApi.getOrder(order.id);
  assert(o.status === 'completed', '完成');
  assert(demoApi.chatOpen(o) === false, '完成后聊天关闭');
  const afterClose = await demoApi.sendMessage(order.id, user.id, '还能发吗');
  assert(afterClose === null, '完成后聊天不可再发（隐私规则）');

  // 9. 评价
  await demoApi.addReview(order.id, 5, '很满意');
  o = await demoApi.getOrder(order.id);
  assert(o.review && o.review.rating === 5, '评价已记录');

  // 10. 后台数据
  const ov = await demoApi.adminOverview();
  assert(ov.total === 1 && ov.completed === 1, `后台统计 ok (total=${ov.total}, done=${ov.completed})`);

  console.log('\n🎉 端到端闭环验证全部通过');
})().catch((e) => { console.error('运行异常', e); process.exit(1); });
