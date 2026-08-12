# PawGo 手机号 OTP 登录配置

App 登录走 Supabase Auth 的 **Phone OTP**（手机号 + 一次性验证码），对应计划书 3.1「手机号 + OTP 一键登录」。

> 当前 `App.js` 在 demo 模式下会预置一个会话跳过登录；切到真实 Supabase（`USE_DEMO_MODE=false`）后，必须由 Supabase Auth 完成真实手机号验证。本文件说明如何在控制台把这条链路打通。

## 一、在 Supabase 控制台开启 Phone 登录

1. 进入项目 → 左侧 **Authentication → Providers**
2. 找到 **Phone** → 点开开关 **Enable**
3. 选择短信服务商。推荐 **Twilio**（Supabase 原生集成）：
   - Account SID
   - Auth Token
   - 发信号码（Messaging Service SID 或 From 号码）
4. 保存

> 新加坡发送短信：Twilio 需在账户里为新加坡号码注册 sender ID / 开通 SG 路由（SG 对 A2P/发信有注册要求，个人测试可用 Twilio 提供的发信号码先验证）。

## 二、App 端登录流程（代码已就绪）

`src/screens/AuthScreen.js` 当前调用 `api.signIn(phone, role)`：
- demo 模式：直接 upsert `profiles`
- 真实模式（`src/lib/api.js` 的 `supabaseApi.signIn`）：目前是 `profiles` upsert

**要让真实 OTP 生效，需把登录改成 Supabase Auth 的 `signInWithOtp`**。在 `src/lib/api.js` 的 `supabaseApi.signIn` 替换为：

```js
async signIn(phone, role) {
  // 1) 发送验证码到手机号
  const { error } = await supabase.auth.signInWithOtp({
    phone,
    options: { channel: 'sms', data: { role } },
  });
  if (error) throw error;
  // 2) 返回"已发送"，由 UI 弹出验证码输入框
  return { sent: true };
}
```

并在 AuthScreen 增加第二步：用户输入 6 位验证码后调用：

```js
const { data, error } = await supabase.auth.verifyOtp({
  phone, type: 'sms', token: code,
});
// data.user 即登录用户；再 upsert profiles(role)
```

> 这是**待补全的真实短信链路**：当前 MVP 代码为了端到端可演示，signIn 直接写了 profiles，并未真正发短信。上线前必须按上面改成 `signInWithOtp` / `verifyOtp`，否则任何人都能用任意手机号伪造登录。

## 三、常见问题排查

| 现象 | 原因 | 处理 |
|------|------|------|
| 登录报 `phone provider not enabled` | 控制台未开启 Phone | 回第一步开启 |
| 收不到短信 | Twilio 未配置 / SG 路由未开 / 余额不足 | 检查 Twilio 控制台日志 |
| `signInWithOtp` 报 429 | 频率限制 | 同一号码 60s 内只能发一次 |
| 验证后 `profiles.role` 为空 | 未在 `data.role` 带入 | `signInWithOtp` 的 `options.data.role` 携带，verify 后 upsert |

## 四、测试建议（不烧短信额度）

Supabase 提供 **Phone OTP 测试模式**（Test OTP）：
- Authentication → Providers → Phone → 勾选 **Use a test OTP**
- 填入测试号码（如 `+6599999999`）与固定验证码（如 `123456`）
- 开发期可免短信验证完整走通登录闭环

> ⚠️ 测试模式仅用于开发，上线前务必关闭并接入真实 Twilio。
