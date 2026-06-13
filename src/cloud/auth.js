import { supabase } from './supabaseConfig';

// ── Cached auth state (updated by onAuthStateChange) ─────────────────────────
// Cached so callers can read the current user synchronously; the listener below
// keeps it fresh and notifies subscribers in real time.

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

// ── Account deletion (store-compliance requirement) ───────────────────────────
// Permanently removes the signed-in user's cloud save AND auth record.
// The auth.users row can't be deleted with the anon key, so this calls a
// server-side SECURITY DEFINER RPC named `delete_account` that deletes
// auth.users WHERE id = auth.uid(). That function MUST be provisioned in the
// Supabase project — see supabase/migrations/0001_init.sql. The caller is
// responsible for wiping local state (resetStore) after this resolves.
export async function deleteAccount() {
  const uid = await getUID();
  if (!uid) throw new Error('Not signed in');

  // 1. Delete the cloud save row first (RLS lets a user delete their own row).
  const { error: saveErr } = await supabase.from('game_saves').delete().eq('user_id', uid);
  if (saveErr) throw saveErr;

  // 2. Delete the auth user via the server-side RPC.
  const { error: rpcErr } = await supabase.rpc('delete_account');
  if (rpcErr) throw rpcErr;

  // 3. Clear the local session/token cache.
  await supabase.auth.signOut();
}
