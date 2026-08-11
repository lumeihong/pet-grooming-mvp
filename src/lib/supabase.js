import { createClient } from '@supabase/supabase-js';

// 从 expo 配置读取（见 app.json -> extra）
// 本地无真实 Supabase 时，USE_DEMO_MODE=true 走内存模拟，保证端到端可演示。
import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

export const SUPABASE_URL = extra.SUPABASE_URL || 'https://your-project.supabase.co';
export const SUPABASE_ANON_KEY = extra.SUPABASE_ANON_KEY || 'your-anon-key';
export const USE_DEMO_MODE = String(extra.USE_DEMO_MODE ?? 'true') === 'true';

let client = null;
if (!USE_DEMO_MODE && SUPABASE_URL.startsWith('https://') && SUPABASE_ANON_KEY.startsWith('ey')) {
  client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export const supabase = client;
export const isDemo = !client;
