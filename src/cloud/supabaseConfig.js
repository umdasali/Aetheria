import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL      = 'https://dipuqgjcswrmqjxowqbq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpcHVxZ2pjc3dybXFqeG93cWJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MDYzNDMsImV4cCI6MjA5NjQ4MjM0M30.TjG_pF_EZMC3XGhziJ4uhgZGET6cb2Okp4gN3vXu250';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage:            AsyncStorage,
    autoRefreshToken:   true,
    persistSession:     true,
    detectSessionInUrl: false,
  },
});
