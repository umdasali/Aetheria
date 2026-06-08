import { supabase } from './supabaseConfig';

// ── Cached auth state (updated by onAuthStateChange) ─────────────────────────
// Mirrors Firebase's auth.currentUser pattern — synchronous reads from cache,
// real-time updates via the listener below.

let _cachedUser = null;
const _listeners = new Set();

supabase.auth.onAuthStateChange((_event, session) => {
  _cachedUser = session?.user ?? null;
  _listeners.forEach(fn => fn(_cachedUser));
});

export function getUser()    { return _cachedUser; }
export function isSignedIn() { return _cachedUser !== null; }

export function onAuthChanged(fn) {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

// ── Email / Password ──────────────────────────────────────────────────────────

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: 'https://ziriverse.com/confirm' },
  });
  if (error) throw error;
  return data.user;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

// email is required — Supabase has no "current unverified user" session after signUp
export async function resendVerification(email) {
  const { error } = await supabase.auth.resend({ type: 'signup', email });
  if (error) throw error;
}

export async function reloadUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}

export async function resetPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'https://ziriverse.com/reset-password',
  });
  if (error) throw error;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getUID() {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}
