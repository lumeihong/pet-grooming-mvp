import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? Constants.manifest?.extra ?? {};

export const SUPABASE_URL = extra.SUPABASE_URL || 'https://your-project.supabase.co';
export const SUPABASE_ANON_KEY = extra.SUPABASE_ANON_KEY || 'your-anon-key';
export const USE_DEMO_MODE = String(extra.USE_DEMO_MODE ?? 'true') === 'true';

let client = null;
if (
  !USE_DEMO_MODE &&
  typeof SUPABASE_URL === 'string' &&
  SUPABASE_URL.startsWith('https://') &&
  typeof SUPABASE_ANON_KEY === 'string' &&
  SUPABASE_ANON_KEY.startsWith('ey')
) {
  client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      // RN 端用 AsyncStorage 持久化登录态；RN 无浏览器 URL，关闭 URL 检测
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

export const supabase = client;
export const isDemo = USE_DEMO_MODE || !client;
