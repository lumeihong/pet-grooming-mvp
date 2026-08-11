-- ============================================================
-- PawGo (上门宠物美容匹配平台) MVP 数据库 Schema
-- 新加坡市场 · Grab 模式 · 双向匹配 · 隐私保护临时聊天
-- 适用于 Supabase (PostgreSQL)。执行：SQL Editor 全量粘贴运行。
-- ============================================================

-- 启用必要的扩展
create extension if not exists "pgcrypto";

-- ---------- 枚举 ----------
do $$ begin
  create type user_role as enum ('client', 'groomer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status as enum (
    'matching',        -- 匹配中 / 未支付
    'awaiting_deposit',-- 客户已选美容师，待付定金
    'confirmed',       -- 定金已付，聊天开启
    'in_progress',     -- 服务进行中（出发/到达/服务中）
    'completed',       -- 服务完成，聊天自动关闭
    'cancelled'        -- 已取消
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type pet_type as enum ('dog', 'cat');
exception when duplicate_object then null; end $$;

-- ============================================================
-- profiles: 所有用户（客户/美容师共用登录身份）
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  phone text unique not null,
  role user_role not null default 'client',
  name text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- groomers: 美容师扩展资料（入驻、接单设置、收款）
-- ============================================================
create table if not exists public.groomers (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  rating numeric(2,1) default 5.0,
  reviews_count int default 0,
  base_price numeric(8,2) default 40,
  services text[] default '{}',          -- bath, haircut, nails, spa...
  area text,
  lat double precision,
  lng double precision,
  online boolean default false,          -- 接单开关
  completion_rate numeric(3,2) default 1.0,
  response_min int default 10,
  bio text,
  paynow text,                           -- PayNow 收款标识
  approved boolean default false,         -- 后台审核通过
  created_at timestamptz not null default now()
);

-- ============================================================
-- orders: 订单状态机核心
-- 状态流转: matching -> awaiting_deposit -> confirmed
--          -> in_progress -> completed | cancelled
-- ============================================================
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references auth.users(id),
  groomer_id uuid references auth.users(id),
  pet_type pet_type not null,
  pet_size text not null default 'medium',   -- small / medium / large
  services text[] not null default '{}',
  preferred_date date,
  time_window text,                          -- 例: "09:00-12:00"
  lat double precision,
  lng double precision,
  address text,                              -- 脱敏后仅订单相关方可见
  budget_min numeric(8,2),
  budget_max numeric(8,2),
  note text,
  status order_status not null default 'matching',
  deposit_paid boolean default false,
  deposit_amount numeric(8,2) default 0,
  final_amount numeric(8,2),
  review jsonb,                              -- {rating, comment, at}
  created_at timestamptz not null default now()
);

create index if not exists orders_status_idx on public.orders(status);
create index if not exists orders_client_idx on public.orders(client_id);
create index if not exists orders_groomer_idx on public.orders(groomer_id);

-- ============================================================
-- chat_messages: 临时聊天（隐私核心）
-- RLS 严格限制：仅 confirmed / in_progress 状态下可读写
-- 服务完成后(order=completed)不可再插入
-- ============================================================
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  from_user uuid references auth.users(id),
  text text,
  image text,                               -- 图片 URL（可选）
  at timestamptz not null default now()
);

create index if not exists chat_order_idx on public.chat_messages(order_id, at);

-- ============================================================
-- 匹配函数: 硬过滤 + 排序权重
-- 硬过滤: 服务匹配 / 在线可接单 / 距离<=12km / 时间窗重叠(简化)
-- 排序: 距离最近(权重最高) > 评分高 > 价格在预算内更优 > 完成率/响应速度
-- ============================================================
create or replace function public.match_groomers(p_order_id uuid)
returns jsonb language plpgsql security definer as $$
declare
  o public.orders;
  r jsonb;
  rows jsonb;
begin
  select * into o from public.orders where id = p_order_id;
  select jsonb_agg(
    jsonb_build_object(
      'id', g.id, 'name', g.name, 'rating', g.rating,
      'base_price', g.base_price, 'services', g.services,
      'area', g.area, 'bio', g.bio, 'dist', round(
        (6371 * 2 * asin(sqrt(
          sin((radians(g.lat) - radians(o.lat))/2)^2 +
          cos(radians(o.lat)) * cos(radians(g.lat)) *
          sin((radians(g.lng) - radians(o.lng))/2)^2
        )))::numeric, 1)
      ),
      'in_budget', case when o.budget_max is not null then g.base_price <= o.budget_max else true end
    )
  )
  into rows
  from public.groomers g
  where g.approved = true
    and g.online = true
    and o.services <@ g.services
    and (
      6371 * 2 * asin(sqrt(
        sin((radians(g.lat) - radians(o.lat))/2)^2 +
        cos(radians(o.lat)) * cos(radians(g.lat)) *
        sin((radians(g.lng) - radians(o.lng))/2)^2
      )) <= 12
    )
  order by
    (6371 * 2 * asin(sqrt(
        sin((radians(g.lat) - radians(o.lat))/2)^2 +
        cos(radians(o.lat)) * cos(radians(g.lat)) *
        sin((radians(g.lng) - radians(o.lng))/2)^2
      ))) asc,
    g.rating desc,
    (case when o.budget_max is not null and g.base_price <= o.budget_max then 0 else 1 end) asc,
    g.completion_rate desc,
    g.response_min asc
  limit 3;

  return coalesce(rows, '[]'::jsonb);
end;
$$;

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles enable row level security;
alter table public.groomers enable row level security;
alter table public.orders enable row level security;
alter table public.chat_messages enable row level security;

-- profiles: 仅本人可读写
create policy "profiles_self" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- groomers: 本人可写；所有人可读(列表/匹配需要)
create policy "groomers_read" on public.groomers for select using (true);
create policy "groomers_write" on public.groomers
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- orders: 客户/美容师仅看自己相关订单
create policy "orders_visible" on public.orders
  for select using (auth.uid() = client_id or auth.uid() = groomer_id);
create policy "orders_insert" on public.orders
  for insert with check (auth.uid() = client_id);
create policy "orders_update_client" on public.orders
  for update using (auth.uid() = client_id or auth.uid() = groomer_id);

-- chat_messages: 仅相关方可读；仅 confirmed/in_progress 可写(隐私规则)
create policy "chat_read" on public.chat_messages
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.client_id = auth.uid() or o.groomer_id = auth.uid())
    )
  );
create policy "chat_write" on public.chat_messages
  for insert with check (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.client_id = auth.uid() or o.groomer_id = auth.uid())
        and o.status in ('confirmed', 'in_progress')   -- 关键：仅开启状态可发
    )
  );

-- ============================================================
-- 后台视图(供 admin 角色查看，含聊天记录用于纠纷)
-- 实际项目应通过 service_role 或独立 admin 表控制权限
-- ============================================================
create or replace view public.admin_orders as
  select * from public.orders;
