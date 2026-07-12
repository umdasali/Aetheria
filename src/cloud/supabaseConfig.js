import Constants from 'expo-constants';
import { AppState } from 'react-native';
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

// supabase-js schedules its token refresh with a timer, but React Native
// suspends JS timers while the app is backgrounded — a refresh due mid-
// background gets missed entirely, so the access token is simply expired by
// the time the app is foregrounded again, and the session looks logged out.
// Per Supabase's React Native guidance, auto-refresh must be explicitly
// started/stopped on AppState changes so a foreground resume forces an
// immediate refresh check instead of waiting on a timer that never fired.
AppState.addEventListener('change', (state) => {
  if (state === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});
