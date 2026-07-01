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
  // Use the in-memory cache first — avoids a network round-trip when the user is
  // already signed in (e.g. right after signInWithPassword resolves).
  if (_cachedUser) return _cachedUser.id;
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

  // Delete the auth user via the server-side RPC — this alone is enough. Both
  // game_saves and leaderboards have `on delete cascade` FKs to auth.users
  // (see 0001_init.sql), so deleting the auth row is one atomic server-side
  // operation that removes everything. Deliberately NOT doing a separate
  // client-side `game_saves` delete first: that used to create a window where
  // the save could be wiped while the auth record (and thus the account)
  // survived a subsequent failure, misleading the "deletion failed" message
  // into implying nothing had happened.
  const { error: rpcErr } = await supabase.rpc('delete_account');
  if (rpcErr) throw rpcErr;

  // Clear the local session/token cache.
  await supabase.auth.signOut();
}
