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

## 可选：种子数据

建表后想立刻有可匹配的美容师，运行 [`seed.sql`](./seed.sql)：

1. 先用 App 以"美容师"角色注册 2~3 个账号（手机号 OTP）
2. **Authentication → Users** 复制这些用户 id
3. 把 `seed.sql` 里的 `<GROOMER_AUTH_UUID_1/2/3>` 替换后，在 SQL Editor 运行

> 注意：`groomers.id` 是 `auth.users` 的外键，种子必须对应真实注册用户，否则会因 FK 失败。

## 不在 schema 里的事

- **不会创建 Auth 用户**：手机号 OTP 需要在 Supabase 控制台 **Authentication → Providers → Phone** 开启并配置短信服务商（Twilio 等）。
- **不会自动插入 demo 数据**：上线初期由美容师注册申请，前端调用 `profiles` upsert 完成。
- **不会建 Storage bucket**：聊天图片（如启用）需在 Storage 里建一个私有 bucket 并配置上传策略。