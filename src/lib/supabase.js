import { createClient } from '@supabase/supabase-js';
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
  client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export const supabase = client;
export const isDemo = USE_DEMO_MODE || !client;
