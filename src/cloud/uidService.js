// ─── Player UID Registry Service ───────────────────────────────────────────────
// Schema and RPC live in supabase/migrations/0005_player_uid_registry.sql:
//   public.player_uids   -> RLS-locked, no direct client access
//   claim_player_uid()   -> SECURITY DEFINER RPC, callable pre-auth
//
// generatePlayerUID() in src/store/gameStore.js produces a candidate UID
// on-device (instant, works offline). This service registers that candidate
// with the server so it's actually guaranteed globally unique — not just
// "unlikely to collide". That guarantee matters because playerUid also serves
// as the owner_uid trust token for the player_names rename/release RPCs (see
// 0004_name_lifecycle.sql): if two installs ever shared a UID, either could
// rename or release the other's claimed name.
//
// Callable pre-auth (anon role), same reasoning as nameService.js — this runs
// at first launch, before any cloud sign-in exists.

import { supabase } from './supabaseConfig';

export const UID_PATTERN = /^[A-HJ-NP-Z2-9]{3}-[A-HJ-NP-Z2-9]{3}-[A-HJ-NP-Z2-9]{3}$/;

/**
 * Registers candidateUid with the server, proving ownership via secret — a
 * second opaque token the client generates once and persists alongside its
 * uid (see playerUidSecret in src/store/gameStore.js). Returns
 * { uid, secret, networkError }.
 *
 * If candidateUid is free, or already owned by this same secret (the common
 * re-confirm-on-every-launch case), the server confirms it as-is — the
 * player's displayed UID doesn't change. If it's missing, malformed, or
 * (astronomically unlikely) owned by a DIFFERENT secret, the server generates
 * a fresh globally-unique uid+secret pair instead; the caller must persist
 * BOTH values returned, not assume they match what was sent.
 *
 * On a network error, uid/secret are null and networkError is true — callers
 * should keep using the local candidate for now and retry this call later
 * rather than blocking the player over it.
 */
export async function claimPlayerUid(candidateUid, secret) {
  const { data, error } = await supabase.rpc('claim_player_uid', {
    p_uid: candidateUid ?? null,
    p_secret: secret ?? null,
  });

  if (error) {
    return { uid: null, secret: null, networkError: true };
  }
  return { uid: data?.uid ?? null, secret: data?.secret ?? null, networkError: false };
}
