import Constants from 'expo-constants';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const extra = Constants.expoConfig?.extra ?? {};
const SUPABASE_URL      = extra.supabaseUrl      ?? '';
const SUPABASE_ANON_KEY = extra.supabaseAnonKey  ?? '';

if (!SUPABASE_URL) {
  console.warn('[Supabase] URL not configured — set SUPABASE_URL in your environment. Cloud features will be disabled.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage:            AsyncStorage,
    autoRefreshToken:   true,
    persistSession:     true,
    detectSessionInUrl: false,
  },
});
