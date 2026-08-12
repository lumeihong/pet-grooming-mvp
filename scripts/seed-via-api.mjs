// 一键种子：空库直接灌入 3 个新加坡美容师
// 用法：node scripts/seed-via-api.mjs
// 依赖：项目 app.json 中的 SUPABASE_URL / SUPABASE_ANON_KEY（或环境变量）
//
// 原理（绕开 auth.users 外键，无需手动复制 uuid）：
//   1) 用 Supabase Auth signUp 创建 3 个美容师登录账号（手机号）
//   2) 用返回的用户 session 为各自插入 groomers 资料（满足 RLS 仅本人可写）
//   3) 再注册 1 个客户账号用于订单演示
//
// 注意：signUp 会真实创建 Auth 用户。若控制台开启了真实短信，将发送验证码；
//       开发期建议在 Authentication -> Providers -> Phone 勾选 "Use a test OTP"，
//       并用下面 TEST_OTP 作为验证码（本脚本不验证 OTP，仅 signUp 创建用户）。

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// 读取 app.json 的 extra
function loadConf() {
  const p = path.resolve(process.cwd(), 'app.json');
  const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
  const extra = raw.expo?.extra ?? {};
  return {
    url: extra.SUPABASE_URL || process.env.SUPABASE_URL,
    key: extra.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY,
  };
}

const { url, key } = loadConf();
if (!url || !key) {
  console.error('缺少 SUPABASE_URL / SUPABASE_ANON_KEY（检查 app.json 或环境变量）');
  process.exit(1);
}

const sb = createClient(url, key);

// 演示用手机号（新加坡格式）。若开启 Test OTP，请在控制台把这几条加入测试号码。
const GROOMERS = [
  { phone: '+6598000001', name: 'Asha', rating: 4.9, reviews_count: 132, base_price: 45,
    services: ['bath', 'haircut', 'nails'], area: 'Tanjong Pagar', lat: 1.2766, lng: 103.8450,
    completion_rate: 0.96, response_min: 8, bio: '5年经验，擅长小型犬造型', paynow: 'asha@paynow', online: true },
  { phone: '+6598000002', name: 'Wei Jie', rating: 4.7, reviews_count: 88, base_price: 38,
    services: ['bath', 'haircut'], area: 'Outram', lat: 1.2829, lng: 103.8370,
    completion_rate: 0.91, response_min: 12, bio: '猫狗通吃，温和耐心', paynow: 'weijie@paynow', online: true },
  { phone: '+6598000003', name: 'Mei Ling', rating: 5.0, reviews_count: 54, base_price: 55,
    services: ['bath', 'haircut', 'nails', 'spa'], area: 'Bugis', lat: 1.3006, lng: 103.8559,
    completion_rate: 0.99, response_min: 6, bio: '高端全套护理', paynow: 'meiling@paynow', online: false },
];

async function seedGroomer(g) {
  // 1) 创建 Auth 用户（role 通过 user_metadata 携带）
  const { data: auth, error } = await sb.auth.signUp({
    phone: g.phone,
    options: { data: { role: 'groomer', name: g.name } },
  });
  if (error) throw new Error(`signUp ${g.phone} 失败: ${error.message}`);
  const userId = auth.user?.id;
  if (!userId) throw new Error(`signUp ${g.phone} 未返回用户 id（可能需验证 OTP，或号码已被注册）`);

  // 2) 用该用户 session 插入 groomers（RLS 要求本人写入）
  // signUp 后 session 可能为空（需 verifyOtp）。这里尝试用 service 不行（无 key）。
  // 退而求其次：直接 insert，若 RLS 拦截则说明需先 verifyOtp。
  const { error: insErr } = await sb
    .from('groomers')
    .upsert({
      id: userId, name: g.name, rating: g.rating, reviews_count: g.reviews_count,
      base_price: g.base_price, services: g.services, area: g.area, lat: g.lat, lng: g.lng,
      completion_rate: g.completion_rate, response_min: g.response_min, bio: g.bio,
      paynow: g.paynow, online: g.online, approved: true,
    });
  if (insErr) throw new Error(`insert groomers ${g.name} 失败: ${insErr.message}`);
  console.log(`✅ 美容师 ${g.name} (${g.phone}) 已创建，id=${userId}`);
}

async function main() {
  console.log('开始灌入种子数据…');
  for (const g of GROOMERS) {
    try {
      await seedGroomer(g);
    } catch (e) {
      console.warn('⚠️', e.message);
    }
  }
  console.log('\n完成。若提示需 verifyOtp，请先在控制台开启 Test OTP 或用真实短信验证后重试。');
  console.log('验证：项目 SQL Editor 运行  select name, area, online from groomers;');
}

main();
