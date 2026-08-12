# PawGo Supabase 建表指南

## 30 秒建表

1. 登录 [supabase.com](https://supabase.com) → 进入你的项目
2. 左侧菜单 **SQL Editor** → **New query**
3. 全量打开并复制 [`./schema.sql`](./schema.sql) 文件内容（约 215 行）
4. 粘贴到 SQL Editor → 点击右下角 **Run**
5. 看到 `Success. No rows returned` 即建表完成

## 建了什么

| 对象 | 类型 | 说明 |
|------|------|------|
| `user_role` / `pet_type` / `order_status` | enum | 角色、宠物类型、订单状态机枚举 |
| `profiles` | table | 所有用户（客户/美容师）的身份档案 |
| `groomers` | table | 美容师扩展资料（评分、价格、位置、接单开关等） |
| `orders` | table | 订单主表，状态机核心 |
| `chat_messages` | table | 临时聊天记录（受 RLS 强制隐私规则） |
| `match_groomers(order_id)` | function | 匹配函数（硬过滤+排序权重） |
| RLS policies | - | 强制聊天状态机：仅 confirmed/in_progress 可写 |
| `admin_orders` | view | 后台订单视图（供管理端读取） |

## 执行后验证

SQL Editor 跑：

```sql
select tablename from pg_tables where schemaname = 'public' order by tablename;
```

应看到：`chat_messages`, `groomers`, `orders`, `profiles` 四张表。

## 关联前端

回到项目根目录，编辑 `app.json` 的 `extra` 段填入你 Supabase 项目的 URL 与 anon key：

```json
{
  "extra": {
    "SUPABASE_URL": "https://xxxx.supabase.co",
    "SUPABASE_ANON_KEY": "eyJhbGciOi...",
    "USE_DEMO_MODE": "false"
  }
}
```

### Project URL 怎么拼

控制台地址形如 `https://supabase.com/dashboard/project/<project-ref>/settings/api-keys`，
其中 `<project-ref>` 就是项目 ID。代码里要填的 **Project URL** 为：

```
https://<project-ref>.supabase.co
```

例如 project-ref 为 `qyskgaoyhinibkwqqdko`，则 URL 为 `https://qyskgaoyhinibkwqqdko.supabase.co`。

### key 选哪个

- **publishable / anon key**（前端用，受 RLS 限制）：可安全写进 `app.json`
- **secret / service_role key**（绕过 RLS，管理员）：**切勿**进前端代码或提交仓库

`anon / publishable key` 在 Supabase 控制台 **Settings → API → Project API keys** 获取（点眼睛图标展开复制完整 JWT）。

## 可选：测试种子数据（TEST DATA）

> 原则：测试环境用**格式与真实完全一致、内容为测试**的假数据跑通闭环；真上线后清掉重灌真实数据。

建表后想立刻有可匹配的美容师 + 测试订单，运行 [`seed.sql`](./seed.sql)：

1. 项目 → **SQL Editor → New query**
2. 全选粘贴 `seed.sql` 内容（含 3 个测试美容师、1 个测试客户、2 条测试订单、聊天记录）
3. **Run**

种子包含：
- 3 个测试美容师（`+6598000001/2/3`，密码 `test1234`）：Asha / Wei Jie 在线，Mei Ling 离线（演示在线过滤）
- 1 个测试客户（`+6598000010`）
- 订单 A：`confirmed`（聊天开启中，可演示临时聊天）
- 订单 B：`completed`（聊天已自动关闭，可演示隐私关闭 + 后台纠纷查看）
- 对应 `chat_messages`

> 注意：`seed.sql` 会向 `auth.users` 插入测试登录账号（绕过外键）。SQL Editor 是管理员上下文可执行；**用 anon key 的 REST API 无法执行此文件**（权限不足）。运行后测试账号即可在 App 用对应手机号登录。

### 备选：不想碰 auth.users 时用 API 灌

[`scripts/seed-via-api.mjs`](./seed-via-api.mjs) 通过 Supabase Auth signUp 创建账号再插 groomers。前提：项目 Phone 登录配置允许 signUp（当前项目要求密码，需脚本内补 `password` 字段，且 signUp 后需 verifyOtp 才能写 groomers）。适合已配置好 Test OTP 的场景。

### 清空测试数据（上线前）

```sql
delete from public.chat_messages;
delete from public.orders;
delete from public.groomers;
delete from public.profiles;
delete from auth.users where phone like '+65980000%';
```

## 不在 schema 里的事

- **不会创建 Auth 用户**：手机号 OTP 需要在 Supabase 控制台 **Authentication → Providers → Phone** 开启并配置短信服务商（Twilio 等）。`seed.sql` 是测试环境手动灌的例外。
- **不会自动插入 demo 数据**：上线初期由美容师注册申请，前端调用 `profiles` upsert 完成。
- **不会建 Storage bucket**：聊天图片（如启用）需在 Storage 里建一个私有 bucket 并配置上传策略。