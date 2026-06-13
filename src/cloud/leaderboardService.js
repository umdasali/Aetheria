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
 * Fetch the signed-in user's rank and score for a category.
 * Returns { rank, score, error }.
 */
export async function fetchOwnRank(category) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { rank: null, score: null, error: 'not_signed_in' };

  // Get own score
  const { data: ownRow, error: ownErr } = await supabase
    .from('leaderboards')
    .select('score')
    .eq('user_id', user.id)
    .eq('category', category)
    .single();

  if (ownErr || !ownRow) return { rank: null, score: null, error: ownErr };

  // Count how many scores are strictly higher
  const { count, error: countErr } = await supabase
    .from('leaderboards')
    .select('*', { count: 'exact', head: true })
    .eq('category', category)
    .gt('score', ownRow.score);

  if (countErr) return { rank: null, score: ownRow.score, error: countErr };

  return { rank: (count ?? 0) + 1, score: ownRow.score, error: null };
}
