-- ============================================================
-- 修复补丁：seed 测试账号无法登录（Invalid login credentials）
-- 原因：直接 INSERT 进 auth.users 时缺少 aud / role / instance_id，
--       GoTrue 登录按 aud='authenticated' 过滤，NULL 会导致找不到用户。
-- 运行：SQL Editor 全量粘贴执行（幂等，可重复跑）
-- ============================================================
update auth.users
set aud = 'authenticated',
    role = 'authenticated',
    instance_id = coalesce(instance_id, '00000000-0000-0000-0000-000000000000'),
    phone_confirmed_at = coalesce(phone_confirmed_at, now()),
    raw_app_meta_data = raw_app_meta_data || '{"provider":"phone","providers":["phone"]}'::jsonb
where phone in ('+6598000001', '+6598000002', '+6598000003', '+6598000010');

-- 验证：应返回 4 行，且 aud/role 均为 authenticated、phone_confirmed_at 非空
-- select phone, aud, role, phone_confirmed_at is not null as confirmed,
--        encrypted_password is not null as has_pwd
-- from auth.users where phone like '+65980000%';
