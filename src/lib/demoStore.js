// 本地内存模拟数据层：在 USE_DEMO_MODE=true 时替代 Supabase，
// 保证整套"发布需求 -> 匹配 -> 支付定金 -> 临时聊天 -> 完成评价"闭环可离线演示。
// 真实接入 Supabase 后，由 supabaseApi 层对接，UI 层无需改动。

let idc = 1000;
const uid = () => `demo_${++idc}`;

const now = () => new Date().toISOString();

// ---------- 内存状态 ----------
const state = {
  users: [
    {
      id: 'u_client_demo',
      phone: '+6599999999',
      role: 'client',
      name: 'Demo Owner',
      created_at: now(),
    },
    {
      id: 'u_groomer_demo',
      phone: '+6588888888',
      role: 'groomer',
      name: 'Demo Groomer',
      created_at: now(),
    },
  ],
  groomers: [
    {
      id: 'u_groomer_demo',
      name: 'Asha',
      rating: 4.9,
      reviews_count: 132,
      base_price: 45,
      services: ['bath', 'haircut', 'nails'],
      area: 'Tanjong Pagar',
      lat: 1.2766,
      lng: 103.8450,
      online: true,
      completion_rate: 0.96,
      response_min: 8,
      bio: '5年经验，擅长小型犬造型',
      paynow: 'asha@paynow',
    },
    {
      id: 'g_2',
      name: 'Wei Jie',
      rating: 4.7,
      reviews_count: 88,
      base_price: 38,
      services: ['bath', 'haircut'],
      area: 'Outram',
      lat: 1.2829,
      lng: 103.8370,
      online: true,
      completion_rate: 0.91,
      response_min: 12,
      bio: '猫狗通吃，温和耐心',
      paynow: 'weijie@paynow',
    },
    {
      id: 'g_3',
      name: 'Mei Ling',
      rating: 5.0,
      reviews_count: 54,
      base_price: 55,
      services: ['bath', 'haircut', 'nails', 'spa'],
      area: 'Bugis',
      lat: 1.3006,
      lng: 103.8559,
      online: false,
      completion_rate: 0.99,
      response_min: 6,
      bio: '高端全套护理',
      paynow: 'meiling@paynow',
    },
  ],
  orders: [],
  messages: {}, // orderId -> [{from, text, image?, at}]
  reviews: [],
};

// ---------- 工具 ----------
function haversineKm(aLat, aLng, bLat, bLng) {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) *
      Math.cos((bLat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

function groomerById(id) {
  return state.groomers.find((g) => g.id === id);
}

// ---------- 匹配逻辑（与计划书 3.5 一致）----------
// 硬过滤：服务匹配 / 在线可接单 / 距离半径(8-12km) / 时间窗重叠
// 排序权重：距离 > 评分 > 价格(在预算内更优) > 完成率/响应速度
export function matchGroomers(order) {
  const radius = 12; // km
  const candidates = state.groomers.filter((g) => {
    if (!g.online) return false;
    const serviceOk = order.services.every((s) => g.services.includes(s));
    if (!serviceOk) return false;
    const dist = haversineKm(order.lat, order.lng, g.lat, g.lng);
    if (dist > radius) return false;
    // 时间窗重叠：演示中假定全部可接
    return true;
  });

  const scored = candidates
    .map((g) => {
      const dist = haversineKm(order.lat, order.lng, g.lat, g.lng);
      const inBudget = !order.budget_max || g.base_price <= order.budget_max;
      const score =
        dist * 1.0 -
        g.rating * 2 -
        (inBudget ? 3 : 0) -
        g.completion_rate * 1.5 -
        (20 - Math.min(g.response_min, 20)) * 0.05;
      return { ...g, dist, inBudget, score };
    })
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

  return scored;
}

// ---------- API 模拟 ----------
export const demoApi = {
  // 认证
  async signIn(phone, role) {
    let u = state.users.find((x) => x.phone === phone && x.role === role);
    if (!u) {
      u = { id: uid(), phone, role, name: role === 'groomer' ? 'New Groomer' : 'New Owner', created_at: now() };
      state.users.push(u);
    }
    return { user: u };
  },
  async signOut() {},

  // 美容师资料
  async getGroomerProfile(id) {
    return groomerById(id) || null;
  },
  async updateGroomerProfile(id, patch) {
    const g = groomerById(id);
    if (g) Object.assign(g, patch);
    return g;
  },

  // 接单大厅（附近订单，未接单）
  async listOpenOrders(groomerLat, groomerLng) {
    return state.orders
      .filter((o) => o.status === 'matching' || o.status === 'pending')
      .map((o) => ({ ...o, dist: haversineKm(groomerLat, groomerLng, o.lat, o.lng) }))
      .sort((a, b) => a.dist - b.dist);
  },

  // 绑定模式：派给我的待确认/进行中订单
  async listAssignedOrders(groomerId) {
    return state.orders
      .filter((o) => o.groomer_id === groomerId && ['awaiting_deposit', 'confirmed', 'in_progress'].includes(o.status))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  // 美容师确认接单：awaiting_deposit -> confirmed
  async acceptOrder(orderId) {
    const o = state.orders.find((x) => x.id === orderId);
    if (o) o.status = 'confirmed';
    return o;
  },

  // 发布需求 -> 匹配
  async createOrder(orderInput) {
    const order = {
      id: uid(),
      ...orderInput,
      status: 'matching',
      created_at: now(),
    };
    state.orders.push(order);
    order.matches = matchGroomers(order);
    return order;
  },

  // 客户确认某美容师 -> 进入待支付定金
  async confirmGroomer(orderId, groomerId) {
    const o = state.orders.find((x) => x.id === orderId);
    if (o) {
      o.groomer_id = groomerId;
      o.status = 'awaiting_deposit';
    }
    return o;
  },

  // 支付定金 -> 已确认，聊天开启
  async payDeposit(orderId) {
    const o = state.orders.find((x) => x.id === orderId);
    if (o) {
      o.status = 'confirmed';
      o.deposit_paid = true;
      state.messages[orderId] = [];
    }
    return o;
  },

  async getOrder(orderId) {
    return state.orders.find((x) => x.id === orderId) || null;
  },

  async listMyOrders(userId, role) {
    return state.orders
      .filter((o) => (role === 'client' ? o.client_id === userId : o.groomer_id === userId))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  // 状态推进（美容师操作）
  async advanceStatus(orderId, next) {
    const o = state.orders.find((x) => x.id === orderId);
    if (o) o.status = next;
    return o;
  },

  // 聊天：仅在 confirmed / in_progress 时可发送
  async sendMessage(orderId, from, text, image) {
    const o = state.orders.find((x) => x.id === orderId);
    if (!o) return null;
    if (!(o.status === 'confirmed' || o.status === 'in_progress')) return null; // 隐私规则：未开启/已关闭不可发
    const msg = { id: uid(), from, text, image: image || null, at: now() };
    (state.messages[orderId] = state.messages[orderId] || []).push(msg);
    return msg;
  },
  async getMessages(orderId) {
    return state.messages[orderId] || [];
  },
  // 聊天是否开启
  chatOpen(order) {
    return order.status === 'confirmed' || order.status === 'in_progress';
  },

  // 完成 + 评价
  async completeOrder(orderId) {
    const o = state.orders.find((x) => x.id === orderId);
    if (o) {
      o.status = 'completed';
      state.messages[orderId] = state.messages[orderId] || [];
    }
    return o;
  },
  async addReview(orderId, rating, comment) {
    const o = state.orders.find((x) => x.id === orderId);
    if (o) {
      o.review = { rating, comment, at: now() };
      state.reviews.push({ orderId, rating, comment });
    }
    return o;
  },

  // 后台
  async adminOverview() {
    const done = state.orders.filter((o) => o.status === 'completed').length;
    return {
      total: state.orders.length,
      completed: done,
      completion_rate: state.orders.length ? done / state.orders.length : 0,
      groomers: state.groomers.length,
    };
  },
  async adminGroomers() {
    return state.groomers.map((g) => ({ ...g, approved: g.online }));
  },
  async adminOrders() {
    return state.orders;
  },
  async adminChat(orderId) {
    return state.messages[orderId] || [];
  },
};

export const demoState = state;
