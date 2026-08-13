// 统一 API 门面：UI 层只调用本文件，底层在 demo(内存) 与 supabase(真实) 间切换。
import { isDemo, supabase } from './supabase';
import { demoApi, demoState } from './demoStore';

export const API_MODE = isDemo ? 'demo' : 'supabase';

// ---------- 真实 Supabase 实现 ----------
// 表结构与 supabase/schema.sql 对应。认证用 Supabase Auth (手机号 OTP)。
const supabaseApi = {
  // 手机号 + 密码登录（Supabase Auth）。优先登录；若账号不存在则自动注册。
  // 密码默认: seed 测试账号为 test1234；新注册用户需自己设置。
  async signIn(phone, role, password = 'test1234') {
    // 1) 尝试登录
    let { data, error } = await supabase.auth.signInWithPassword({ phone, password });
    if (error) {
      // 2) 账号不存在则注册
      const signUpRes = await supabase.auth.signUp({
        phone,
        password,
        options: { data: { role } },
      });
      if (signUpRes.error) throw signUpRes.error;
      if (!signUpRes.data.user) throw new Error('注册未返回用户，请检查手机号');
      data = signUpRes.data;
    }
    const user = data.user;
    const userRole = user.user_metadata?.role || role;
    // 3) 同步 profiles（RLS: auth.uid()=id，此时已有 session）
    const { data: profile, error: pErr } = await supabase
      .from('profiles')
      .upsert({ id: user.id, phone, role: userRole, name: user.user_metadata?.name || '' }, { onConflict: 'id' })
      .select()
      .single();
    if (pErr) throw pErr;
    return { user: { id: user.id, phone, role: userRole, name: profile?.name } };
  },
  async signOut() {
    await supabase.auth.signOut();
  },
  async getGroomerProfile(id) {
    const { data } = await supabase.from('groomers').select('*').eq('id', id).single();
    return data;
  },
  async updateGroomerProfile(id, patch) {
    const { data } = await supabase.from('groomers').update(patch).eq('id', id).select().single();
    return data;
  },
  async createOrder(input) {
    const { data } = await supabase.from('orders').insert(input).select().single();
    // 匹配在数据库函数 match_groomers(order_id) 中计算
    const { data: matches } = await supabase.rpc('match_groomers', { p_order_id: data.id });
    return { ...data, matches: matches || [] };
  },
  async confirmGroomer(orderId, groomerId) {
    const { data } = await supabase
      .from('orders')
      .update({ groomer_id: groomerId, status: 'awaiting_deposit' })
      .eq('id', orderId)
      .select()
      .single();
    return data;
  },
  async payDeposit(orderId) {
    const { data } = await supabase
      .from('orders')
      .update({ status: 'confirmed', deposit_paid: true })
      .eq('id', orderId)
      .select()
      .single();
    return data;
  },
  async getOrder(orderId) {
    const { data } = await supabase.from('orders').select('*').eq('id', orderId).single();
    return data;
  },
  async listMyOrders(userId, role) {
    const col = role === 'client' ? 'client_id' : 'groomer_id';
    const { data } = await supabase.from('orders').select('*').eq(col, userId).order('created_at', { ascending: false });
    return data || [];
  },
  async listOpenOrders() {
    const { data } = await supabase.from('orders').select('*').in('status', ['matching', 'pending']);
    return data || [];
  },
  // 绑定模式：查询派给我的待确认订单（客户已选人+付定金，等待我确认）
  async listAssignedOrders(groomerId) {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('groomer_id', groomerId)
      .in('status', ['awaiting_deposit', 'confirmed', 'in_progress'])
      .order('created_at', { ascending: false });
    return data || [];
  },
  // 美容师确认接单：awaiting_deposit -> confirmed（聊天开启）
  async acceptOrder(orderId) {
    const { data } = await supabase
      .from('orders')
      .update({ status: 'confirmed' })
      .eq('id', orderId)
      .select()
      .single();
    return data;
  },
  async advanceStatus(orderId, next) {
    const { data } = await supabase.from('orders').update({ status: next }).eq('id', orderId).select().single();
    return data;
  },
  async sendMessage(orderId, from, text, image) {
    // 由 RLS 策略保证只有 confirmed/in_progress 可写
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({ order_id: orderId, from_user: from, text, image })
      .select()
      .single();
    if (error) return null;
    return data;
  },
  async getMessages(orderId) {
    const { data } = await supabase.from('chat_messages').select('*').eq('order_id', orderId).order('at', { ascending: true });
    return data || [];
  },
  chatOpen(order) {
    return order.status === 'confirmed' || order.status === 'in_progress';
  },
  async completeOrder(orderId) {
    const { data } = await supabase.from('orders').update({ status: 'completed' }).eq('id', orderId).select().single();
    return data;
  },
  async addReview(orderId, rating, comment) {
    const { data } = await supabase.from('orders').update({ review: { rating, comment } }).eq('id', orderId).select().single();
    return data;
  },
  async adminOverview() {
    const { data } = await supabase.from('orders').select('status');
    const total = data?.length || 0;
    const completed = data?.filter((o) => o.status === 'completed').length || 0;
    return { total, completed, completion_rate: total ? completed / total : 0 };
  },
  async adminGroomers() {
    const { data } = await supabase.from('groomers').select('*');
    return data || [];
  },
  async adminOrders() {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    return data || [];
  },
  async adminChat(orderId) {
    const { data } = await supabase.from('chat_messages').select('*').eq('order_id', orderId);
    return data || [];
  },
};

export const api = isDemo ? demoApi : supabaseApi;
export { demoState };
