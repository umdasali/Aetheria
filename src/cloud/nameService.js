// ─── Player Name Service ──────────────────────────────────────────────────────
// Schema and RPCs live in supabase/migrations/0003_player_names.sql and
// 0004_name_lifecycle.sql:
//   public.player_names                          -> RLS-locked, no direct client access
//   is_name_available() / claim_name()           -> SECURITY DEFINER RPCs, callable pre-auth
//   rename_name() / release_name()                -> owner-scoped SECURITY DEFINER RPCs
//
// Onboarding runs before any cloud sign-in, so all RPCs are granted to the
// anon role. Network failures are reported as { networkError: true } so the
// caller can fall back to "allow it locally" — this is an offline-friendly
// game, not one that should be gated on connectivity during first launch.
//
// claimName/renameName/releaseName take an `ownerUid` — the client-generated
// playerUid (see generatePlayerUID() in src/store/gameStore.js), a persistent
// per-install id. There's no per-device auth session available pre-sign-in, so
// this is the only stable token the server can use to scope rename/release to
// the player who originally claimed the name.

import { supabase } from './supabaseConfig';

export const NAME_PATTERN = /^[A-Za-z0-9 _-]{3,16}$/;

/**
 * Checks whether p_name is well-formed and not already claimed.
 * Returns { available, reason, networkError }.
 *   reason: 'ok' | 'invalid_format' | 'taken' | 'error'
 */
export async function checkNameAvailable(name) {
  const trimmed = (name ?? '').trim();
  if (!NAME_PATTERN.test(trimmed)) {
    return { available: false, reason: 'invalid_format', networkError: false };
  }

  const { data, error } = await supabase.rpc('is_name_available', { p_name: trimmed });

  if (error) {
    if (error.message?.includes('invalid_format')) {
      return { available: false, reason: 'invalid_format', networkError: false };
    }
    return { available: false, reason: 'error', networkError: true };
  }

  return { available: !!data, reason: data ? 'ok' : 'taken', networkError: false };
}

/**
 * Atomically claims p_name for ownerUid. Returns { claimed, displayName, reason, networkError }.
 *   reason: 'ok' | 'invalid_format' | 'taken' | 'error'
 *
 * On a network error (RPC unreachable), claimed is false but networkError is
 * true so the caller can choose to proceed offline with the name unclaimed.
 */
export async function claimName(name, ownerUid) {
  const trimmed = (name ?? '').trim();
  if (!NAME_PATTERN.test(trimmed)) {
    return { claimed: false, displayName: trimmed, reason: 'invalid_format', networkError: false };
  }

  const { data, error } = await supabase.rpc('claim_name', { p_name: trimmed, p_owner_uid: ownerUid ?? null });

  if (error) {
    if (error.message?.includes('name_taken')) {
      return { claimed: false, displayName: trimmed, reason: 'taken', networkError: false };
    }
    if (error.message?.includes('invalid_format')) {
      return { claimed: false, displayName: trimmed, reason: 'invalid_format', networkError: false };
    }
    return { claimed: false, displayName: trimmed, reason: 'error', networkError: true };
  }

  return { claimed: true, displayName: data ?? trimmed, reason: 'ok', networkError: false };
}

/**
 * Atomically renames oldName -> newName for ownerUid, releasing oldName and
 * claiming newName in one server-side transaction. Returns
 * { renamed, displayName, reason, networkError }.
 *   reason: 'ok' | 'invalid_format' | 'taken' | 'not_owner' | 'error'
 *
 * If oldName === newName (case/whitespace only), this just re-stamps the
 * display text without a free/claim cycle. On a network error, renamed is
 * false but networkError is true so the caller can choose to save the new
 * name locally anyway and let it reconcile later.
 */
export async function renameName(oldName, newName, ownerUid) {
  const trimmedOld = (oldName ?? '').trim();
  const trimmedNew = (newName ?? '').trim();
  if (!NAME_PATTERN.test(trimmedNew)) {
    return { renamed: false, displayName: trimmedNew, reason: 'invalid_format', networkError: false };
  }

  const { data, error } = await supabase.rpc('rename_name', {
    p_old_name: trimmedOld,
    p_new_name: trimmedNew,
    p_owner_uid: ownerUid ?? null,
  });

  if (error) {
    if (error.message?.includes('name_taken'))     return { renamed: false, displayName: trimmedNew, reason: 'taken',          networkError: false };
    if (error.message?.includes('not_owner'))      return { renamed: false, displayName: trimmedNew, reason: 'not_owner',      networkError: false };
    if (error.message?.includes('invalid_format')) return { renamed: false, displayName: trimmedNew, reason: 'invalid_format', networkError: false };
    return { renamed: false, displayName: trimmedNew, reason: 'error', networkError: true };
  }

  return { renamed: true, displayName: data ?? trimmedNew, reason: 'ok', networkError: false };
}

/**
 * Releases a claimed name so it can be claimed by someone else — used when an
 * account is deleted. Best-effort: callers should not block on this failing.
 * Returns { released, networkError }.
 */
export async function releaseName(name, ownerUid) {
  const trimmed = (name ?? '').trim();
  if (!trimmed) return { released: false, networkError: false };

  const { data, error } = await supabase.rpc('release_name', { p_name: trimmed, p_owner_uid: ownerUid ?? null });

  if (error) {
    return { released: false, networkError: !error.message?.includes('not_owner') };
  }
  return { released: !!data, networkError: false };
}
