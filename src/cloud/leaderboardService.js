// ─── Leaderboard Service ──────────────────────────────────────────────────────
// Supabase table schema (run once in your Supabase SQL editor):
//
//   create table public.leaderboards (
//     id          bigserial primary key,
//     user_id     uuid not null,
//     player_name text not null default 'Aetherian',
//     category    text not null,          -- 'tower_weekly' | 'tower_alltime' | 'collection'
//     score       int  not null default 0,
//     updated_at  timestamptz not null default now()
//   );
//
//   -- Unique per user + category (upsert key)
//   create unique index leaderboards_user_category on public.leaderboards(user_id, category);
//
//   -- Enable Row Level Security
//   alter table public.leaderboards enable row level security;
//
//   -- Allow authenticated users to upsert their own row
//   create policy "users can upsert own scores"
//     on public.leaderboards for all
//     using  (auth.uid() = user_id)
//     with check (auth.uid() = user_id);
//
//   -- Allow anyone to read (public leaderboard)
//   create policy "anyone can read leaderboard"
//     on public.leaderboards for select
//     using (true);

import { supabase } from './supabaseConfig';

export const CATEGORIES = {
  TOWER_WEEKLY:   'tower_weekly',
  TOWER_ALLTIME:  'tower_alltime',
  COLLECTION:     'collection',
};

/**
 * Upsert the caller's score for the given category.
 * No-ops gracefully when the user is not signed in.
 */
export async function submitScore(category, score, playerName) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'not_signed_in' };

  const { error } = await supabase
    .from('leaderboards')
    .upsert(
      { user_id: user.id, player_name: playerName ?? 'Aetherian', category, score, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,category' },
    );

  return { error };
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
