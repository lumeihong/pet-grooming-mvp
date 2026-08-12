# PawGo 数据库 ER 图

上门宠物美容匹配平台 MVP · Supabase (PostgreSQL)

```mermaid
erDiagram
    auth_users {
        uuid id PK "Supabase Auth 用户"
    }

    profiles {
        uuid id PK "FK -> auth.users"
        text phone UK "手机号 OTP"
        user_role role "client / groomer"
        text name
        timestamptz created_at
    }

    groomers {
        uuid id PK "FK -> auth.users"
        text name
        numeric rating "numeric(2,1)"
        int reviews_count
        numeric base_price "numeric(8,2)"
        text services "text[] 数组"
        text area
        double lat
        double lng
        boolean online "接单开关"
        numeric completion_rate "numeric(3,2)"
        int response_min
        text bio
        text paynow
        boolean approved "后台审核"
    }

    orders {
        uuid id PK
        uuid client_id FK "-> auth.users"
        uuid groomer_id FK "-> auth.users"
        pet_type pet_type "dog / cat"
        text pet_size "S/M/L"
        text services "text[]"
        date preferred_date
        text time_window "09:00-12:00"
        double lat
        double lng
        text address
        numeric budget_min "numeric(8,2)"
        numeric budget_max
        text note
        order_status status "状态机"
        boolean deposit_paid
        numeric deposit_amount
        numeric final_amount
        jsonb review "{rating,comment,at}"
        timestamptz created_at
    }

    chat_messages {
        uuid id PK
        uuid order_id FK "-> orders (级联删除)"
        uuid from_user FK "-> auth.users"
        text text
        text image "图片URL"
        timestamptz at
    }

    auth_users ||--|| profiles : "1:1 身份"
    auth_users ||--|| groomers : "1:1 美容师"
    profiles ||--o{ orders : "客户 1:N"
    groomers ||--o{ orders : "美容师 1:N"
    orders ||--o{ chat_messages : "订单 1:N 聊天"
    profiles }o--o{ orders : "groomer_id 关联"
```

## 关系说明

| 关系 | 基数 | 说明 |
|------|------|------|
| auth.users ↔ profiles | 1:1 | 每个登录账号对应一个身份档案 |
| auth.users ↔ groomers | 1:1 | 美容师账号扩展资料 |
| profiles(客户) → orders | 1:N | 一个客户可下多单 |
| groomers → orders | 1:N | 一个美容师可接多单 |
| orders → chat_messages | 1:N | 每单一段临时聊天记录 |
| orders.groomer_id ↔ profiles | N:1 | 接单的美容师 |

## 关键约束

- **order_status 枚举状态机**：`matching → awaiting_deposit → confirmed → in_progress → completed / cancelled`
- **RLS 强制聊天隐私**：`chat_messages` 仅当 `orders.status ∈ (confirmed, in_progress)` 时可 INSERT
- **匹配硬过滤**：`groomers.services @> orders.services` + 距离 ≤ 12km + `online = true`
