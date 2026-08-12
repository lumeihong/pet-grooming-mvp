-- ============================================================
-- PawGo 测试种子数据（TEST DATA）
-- 用途：测试环境跑通完整闭环。字段结构与真实数据完全一致，
--       内容均为测试账号/测试美容师/测试订单。真上线后清掉重灌真实数据。
--
-- 运行：项目 SQL Editor -> New query -> 全选粘贴 -> Run
-- 前置：已运行 schema.sql 建表
--
-- 说明：profiles / groomers 的 id 是 auth.users 外键。
--       下面先向 auth.users 插入测试登录账号（固定 uuid + 测试密码 test1234），
--       再插 profiles / groomers / 测试订单 / 测试聊天。
-- ============================================================

-- 1) 测试登录账号（auth.users）
insert into auth.users (id, phone, encrypted_password, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('11111111-1111-1111-1111-111111111101', '+6598000001', crypt('test1234', gen_salt('bf')),
   '{"provider":"phone"}', '{"role":"groomer","name":"Asha"}', now(), now()),
  ('11111111-1111-1111-1111-111111111102', '+6598000002', crypt('test1234', gen_salt('bf')),
   '{"provider":"phone"}', '{"role":"groomer","name":"Wei Jie"}', now(), now()),
  ('11111111-1111-1111-1111-111111111103', '+6598000003', crypt('test1234', gen_salt('bf')),
   '{"provider":"phone"}', '{"role":"groomer","name":"Mei Ling"}', now(), now()),
  ('11111111-1111-1111-1111-111111111201', '+6598000010', crypt('test1234', gen_salt('bf')),
   '{"provider":"phone"}', '{"role":"client","name":"Test Owner"}', now(), now())
on conflict (id) do nothing;

-- 2) profiles（身份档案，与真实结构一致）
insert into public.profiles (id, phone, role, name, created_at)
values
  ('11111111-1111-1111-1111-111111111101', '+6598000001', 'groomer', 'Asha', now()),
  ('11111111-1111-1111-1111-111111111102', '+6598000002', 'groomer', 'Wei Jie', now()),
  ('11111111-1111-1111-1111-111111111103', '+6598000003', 'groomer', 'Mei Ling', now()),
  ('11111111-1111-1111-1111-111111111201', '+6598000010', 'client', 'Test Owner', now())
on conflict (id) do nothing;

-- 3) groomers（测试美容师，格式与真实一致）
insert into public.groomers (id, name, rating, reviews_count, base_price, services, area, lat, lng, online, completion_rate, response_min, bio, paynow, approved)
values
  ('11111111-1111-1111-1111-111111111101', 'Asha', 4.9, 132, 45,
   array['bath','haircut','nails'], 'Tanjong Pagar', 1.2766, 103.8450,
   true, 0.96, 8, '5年经验，擅长小型犬造型', 'asha@paynow', true),
  ('11111111-1111-1111-1111-111111111102', 'Wei Jie', 4.7, 88, 38,
   array['bath','haircut'], 'Outram', 1.2829, 103.8370,
   true, 0.91, 12, '猫狗通吃，温和耐心', 'weijie@paynow', true),
  ('11111111-1111-1111-1111-111111111103', 'Mei Ling', 5.0, 54, 55,
   array['bath','haircut','nails','spa'], 'Bugis', 1.3006, 103.8559,
   false, 0.99, 6, '高端全套护理', 'meiling@paynow', true)
on conflict (id) do nothing;

-- 4) 测试订单 A：confirmed（聊天开启中，用于演示临时聊天）
insert into public.orders
  (id, client_id, groomer_id, pet_type, pet_size, services, preferred_date, time_window,
   lat, lng, address, budget_max, note, status, deposit_paid, deposit_amount, created_at)
values
  ('aaaaaaaa-0000-0000-0000-0000000000a1',
   '11111111-1111-1111-1111-111111111201', '11111111-1111-1111-1111-111111111101',
   'dog', 'medium', array['bath','haircut'], current_date, '09:00-12:00',
   1.2868, 103.8545, 'Tanjong Pagar (测试)', 60, '测试备注：狗狗较怕生',
   'confirmed', true, 10, now())
on conflict (id) do nothing;

-- 5) 测试订单 B：completed（聊天已自动关闭，用于演示隐私关闭）
insert into public.orders
  (id, client_id, groomer_id, pet_type, pet_size, services, preferred_date, time_window,
   lat, lng, address, budget_max, note, status, deposit_paid, deposit_amount, final_amount, review, created_at)
values
  ('bbbbbbbb-0000-0000-0000-0000000000b1',
   '11111111-1111-1111-1111-111111111201', '11111111-1111-1111-1111-111111111102',
   'cat', 'small', array['bath'], current_date - 1, '14:00-17:00',
   1.2868, 103.8545, 'Outram (测试)', 50, '测试备注',
   'completed', true, 10, 38, '{"rating":5,"comment":"测试评价：很满意","at":"' || now() || '"}', now())
on conflict (id) do nothing;

-- 6) 测试聊天记录（订单 A 开启中，有消息；订单 B 已完成，也有历史消息用于后台纠纷查看）
insert into public.chat_messages (order_id, from_user, text, at) values
  ('aaaaaaaa-0000-0000-0000-0000000000a1', '11111111-1111-1111-1111-111111111201', '你好，狗狗已准备好', now() - interval '30 min'),
  ('aaaaaaaa-0000-0000-0000-0000000000a1', '11111111-1111-1111-1111-111111111101', '好的，我30分钟后到', now() - interval '25 min'),
  ('bbbbbbbb-0000-0000-0000-0000000000b1', '11111111-1111-1111-1111-111111111201', '谢谢，服务很好', now() - interval '1 day');

-- ============================================================
-- 验证查询（跑完看结果）
-- ============================================================
-- select name, area, online, approved from public.groomers order by name;
-- select id, pet_type, status from public.orders order by created_at desc;
-- select order_id, count(*) as msgs from public.chat_messages group by order_id;
