// ─── Leaderboard Service ──────────────────────────────────────────────────────
// Schema and policies live in supabase/migrations:
//   0001_init.sql                              -> public.leaderboards table + public read
//   0002_leaderboard_server_authoritative.sql  -> submit_score() RPC; client writes revoked
//
// Scores are server-authoritative: clients call the submit_score() RPC, which derives
// the score from the caller's own game_saves row. Direct INSERT/UPDATE on the table is
// revoked, so a client cannot spoof its rank. Reads remain public.

import { supabase } from './supabaseConfig';
import { syncNow } from './syncQueue';

export const CATEGORIES = {
  TOWER_WEEKLY:   'tower_weekly',
  TOWER_ALLTIME:  'tower_alltime',
  COLLECTION:     'collection',
};

/**
 * Submit the caller's score for a category.
 *
 * The score is NOT supplied by the client — it is derived SERVER-SIDE from the
 * player's own game_saves row by the submit_score() SECURITY DEFINER RPC (see
 * supabase/migrations/0002_leaderboard_server_authoritative.sql). Direct table
 * writes are revoked, so a client can no longer spoof its rank. Make sure the
 * latest save has been uploaded (cloudSave) before calling this.
 *
 * No-ops gracefully when the user is not signed in. Returns { score, error }.
 */
export async function submitScore(category, playerName) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'not_signed_in' };

  // Flush the latest local state to the cloud first, so the server derives the score
  // from current data (otherwise a just-cleared floor wouldn't count until the next
  // debounced sync). Best-effort — a failed flush just means a slightly stale score.
  try { await syncNow(); } catch (_) {}

  const { data, error } = await supabase.rpc('submit_score', {
    p_category: category,
    p_player_name: playerName ?? 'Aetherian',
  });

  return { score: data ?? null, error };
}

/**
 * Fetch the top N rows for a category, ordered descending by score.
 * Returns { data: Array<{ rank, user_id, player_name, score }>, error }.
 */
export async function fetchTopN(category, limit = 50) {
  const { data, error } = await supabase
    .from('leaderboards')
    .select('user_id, player_name, score')
    .eq('category', category)
    .order('score', { ascending: false })
    .limit(limit);

  if (error) return { data: [], error };

  // Dense rank: tied scores receive the same rank number.
  let rank = 0;
  let prevScore = null;
  const ranked = (data ?? []).map(row => {
    if (row.score !== prevScore) { rank++; prevScore = row.score; }
    return { ...row, rank };
  });
  return { data: ranked, error: null };
}

/**
 * The currently signed-in user's id, or null when signed out.
 */
export async function getCurrentUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/**
 * Fetch the signed-in user's rank and score for a category.
 * Returns { rank, score, userId, error }.
 *
 * Rank uses DENSE ranking (tied scores share a rank) so it stays consistent with
 * fetchTopN — e.g. scores [100,100,90] rank the 90 as #2, not #3. This is the
 * fallback used only when the player is outside the fetched top-N window; inside
 * it the screen derives the rank directly from the listed row.
 */
export async function fetchOwnRank(category) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { rank: null, score: null, userId: null, error: 'not_signed_in' };

  // Get own score
  const { data: ownRow, error: ownErr } = await supabase
    .from('leaderboards')
    .select('score')
    .eq('user_id', user.id)
    .eq('category', category)
    .single();

  if (ownErr || !ownRow) return { rank: null, score: null, userId: user.id, error: ownErr };

  // Dense rank = 1 + number of DISTINCT scores strictly higher than ours.
  const { data: higher, error: higherErr } = await supabase
    .from('leaderboards')
    .select('score')
    .eq('category', category)
    .gt('score', ownRow.score);

  if (higherErr) return { rank: null, score: ownRow.score, userId: user.id, error: higherErr };

  const distinctHigher = new Set((higher ?? []).map(r => r.score)).size;
  return { rank: distinctHigher + 1, score: ownRow.score, userId: user.id, error: null };
}
