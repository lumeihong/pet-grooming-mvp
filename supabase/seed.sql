-- ============================================================
-- PawGo 种子数据（可选）
-- 前提：先运行 schema.sql 建表。
-- 说明：groomers.id 是 auth.users 的外键（1:1）。
--       因此美容师资料必须对应一个已注册的 Auth 用户。
--       下面示例用 <GROOMER_AUTH_UUID> 占位，
--       请替换为你在 Supabase Auth 里实际创建/注册的美容师用户 id。
--
-- 最简做法（推荐）：
--   1) 在 App 里以"美容师"角色注册 2~3 个账号（手机号 OTP）
--   2) 到 Authentication -> Users 复制这些用户的 id
--   3) 把下面 SQL 里的 <GROOMER_AUTH_UUID_1/2/3> 替换掉后运行
-- ============================================================

-- 示例 1：Asha（Tanjong Pagar，在线）
insert into public.groomers (id, name, rating, reviews_count, base_price, services, area, lat, lng, online, completion_rate, response_min, bio, paynow, approved)
values (
  '<GROOMER_AUTH_UUID_1>'::uuid,
  'Asha', 4.9, 132, 45,
  array['bath','haircut','nails'],
  'Tanjong Pagar', 1.2766, 103.8450,
  true, 0.96, 8, '5年经验，擅长小型犬造型', 'asha@paynow', true
)
on conflict (id) do nothing;

-- 示例 2：Wei Jie（Outram，在线）
insert into public.groomers (id, name, rating, reviews_count, base_price, services, area, lat, lng, online, completion_rate, response_min, bio, paynow, approved)
values (
  '<GROOMER_AUTH_UUID_2>'::uuid,
  'Wei Jie', 4.7, 88, 38,
  array['bath','haircut'],
  'Outram', 1.2829, 103.8370,
  true, 0.91, 12, '猫狗通吃，温和耐心', 'weijie@paynow', true
)
on conflict (id) do nothing;

-- 示例 3：Mei Ling（Bugis，离线，用于测试"在线过滤"）
insert into public.groomers (id, name, rating, reviews_count, base_price, services, area, lat, lng, online, completion_rate, response_min, bio, paynow, approved)
values (
  '<GROOMER_AUTH_UUID_3>'::uuid,
  'Mei Ling', 5.0, 54, 55,
  array['bath','haircut','nails','spa'],
  'Bugis', 1.3006, 103.8559,
  false, 0.99, 6, '高端全套护理', 'meiling@paynow', true
)
on conflict (id) do nothing;
