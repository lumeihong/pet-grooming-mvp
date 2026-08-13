# 🐾 PawGo — 上门宠物美容匹配平台 (MVP)

> 「像叫 Grab 一样叫上门宠物理发师」· 新加坡市场 · 双向匹配 · 隐私保护临时聊天

React Native (Expo) + Supabase 的 MVP 实现，覆盖商业计划书中的完整闭环：

**发布需求 → 匹配推荐 → 支付定金 → 临时聊天 → 服务完成 → 评价**

---

## 技术栈

| 层 | 选型 |
|----|------|
| 前端 | React Native (Expo) + React Navigation + React Native Paper |
| 后端 | Supabase（认证 / Postgres / 实时 / RLS） |
| 匹配 | Postgres 函数 `match_groomers`（硬过滤 + 排序权重） |
| 聊天 | 状态机控制（见隐私规则），RLS 强制开闭 |
| 支付 | PayNow / Stripe（预留接入位，演示模式模拟） |
| 地图 | Google Maps（预留，演示用中心点坐标） |

---

## 快速开始

```bash
npm install
npx expo start
```

- 打开 Expo Go 扫码即可体验。当前默认 `USE_DEMO_MODE=false`，直接连真实 Supabase 测试库。
- 想离线演示可改回 `"USE_DEMO_MODE": "true"`（内存模拟数据层，无需后端）。

## 测试账号（seed 已灌入，密码均为 `test1234`）

| 角色 | 手机号 | 说明 |
|------|--------|------|
| 客户 | +6598000010 | Test Owner |
| 美容师 | +6598000001 | Asha（在线） |
| 美容师 | +6598000002 | Wei Jie（在线） |
| 美容师 | +6598000003 | Mei Ling（离线，用于验证硬过滤） |

登录页有「一键体验」按钮。也可在登录页输新手机号注册（走 Supabase Auth signUp）。

## 接入真实 Supabase（一次性配置）

1. 在 [supabase.com](https://supabase.com) 建项目，复制 URL 与 anon key 填入 `app.json` 的 `extra`。
2. SQL Editor 全量执行 `supabase/schema.sql`（建表 + 匹配函数 + RLS 策略）。
3. SQL Editor 全量执行 `supabase/seed.sql`（测试账号 + 测试订单，含 `phone_confirmed_at`）。
4. **Dashboard → Authentication → Providers → Phone**：
   - 打开 Enable Phone provider；
   - SMS provider 为表单必填项，但密码登录不发短信 —— 选 Twilio，三个必填字段填占位值即可
     （如 `AC000...` / `000...` / `MG000...`）；
   - **关闭 "Enable phone confirmations"**，否则新手机号注册会走真实短信（假凭据会失败）。
   真实上线前再换真 Twilio 凭据并打开 confirmations，代码无需改动。
5. `npx expo start` 重开。

## 验证脚本

```bash
npm run verify                        # demo 模式端到端逻辑断言（16 项，无需网络）
node scripts/verify-supabase-e2e.js   # 真实 Supabase 闭环断言（连测试库跑通全流程）
```

---

## 目录结构

```
pet-grooming-mvp/
├── App.js                      # 三端路由（client / groomer / admin）
├── app.json                    # Expo 配置 + Supabase 环境变量
├── babel.config.js
├── supabase/
│   └── schema.sql              # 数据库 schema + 匹配函数 + RLS
└── src/
    ├── theme.js                # 极简高对比主题
    ├── components/ui.js        # 大按钮/卡片/状态进度条
    ├── lib/
    │   ├── supabase.js         # Supabase 客户端（按 demo/supabase 切换）
    │   ├── demoStore.js        # 内存模拟数据层（闭环演示）
    │   └── api.js              # 统一 API 门面
    └── screens/
        ├── AuthScreen.js
        ├── ChatScreen.js        # 隐私核心：状态机控制开闭
        ├── client/              # 客户端（首页/发布/匹配/支付/详情/聊天/评价/我的）
        ├── groomer/             # 美容师端（派单/订单详情/进行中/资料/收入，绑定式无抢单大厅）
        └── admin/               # 极简后台（只读）：数据概览/订单/纠纷聊天记录
```

---

## 订单状态机

```
matching → awaiting_deposit → confirmed → in_progress → completed
                                        ↘ cancelled
```

## 聊天隐私规则（核心）

| 阶段 | 聊天状态 | 说明 |
|------|----------|------|
| 匹配中 / 未支付 | 关闭 | 无法发起聊天 |
| 匹配成功 + 定金支付 | 开启 | 双方可发文字/图片 |
| 服务进行中 | 开启 | 正常沟通 |
| 标记完成 | 自动关闭 | 不可再发送 |
| 结束后 | 永久关闭 | 仅后台可查（纠纷） |

- 双方**不暴露真实手机号与完整地址**（地址仅在订单页可见）。
- Supabase 端由 RLS 策略强制：仅 `confirmed` / `in_progress` 状态可写聊天。

## 匹配逻辑（schema.sql `match_groomers`）

- **硬过滤**：服务匹配 · 在线可接单 · 距离 ≤ 12km · 时间窗重叠
- **排序权重**：距离最近(最高) > 评分 > 价格(预算内更优) > 完成率/响应速度
- 推荐 1–3 位，客户自主选择。

---

## 后续扩展（计划书第 6 节）

复用匹配引擎 / 状态机 / 聊天规则 / 支付流程，仅增加「遛狗 / 陪伴」服务类型，升级为「上门宠物服务匹配平台」。

## 合规

- 美容师入驻需身份与经验审核（`groomers.approved`）。
- 遵守新加坡 PDPA：聊天记录仅纠纷可取，脱敏展示。
