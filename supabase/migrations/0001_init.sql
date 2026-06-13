-- ============================================================================
-- Aetheria: Legends Unbound — Supabase schema
-- Run this once in the Supabase project (SQL Editor, or `supabase db push`).
-- Idempotent: safe to re-run. Provisions the tables the client expects plus
-- the delete_account() RPC that in-app account deletion calls.
--
-- Client references:
--   src/cloud/cloudSave.js          -> public.game_saves
--   src/cloud/leaderboardService.js -> public.leaderboards
--   src/cloud/auth.js (deleteAccount) -> public.delete_account()
-- ============================================================================

-- ── game_saves ──────────────────────────────────────────────────────────────
-- One row per user; cloudSave.js upserts on user_id.
create table if not exists public.game_saves (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.game_saves enable row level security;

drop policy if exists "own save - select" on public.game_saves;
drop policy if exists "own save - modify" on public.game_saves;

create policy "own save - select"
  on public.game_saves for select
  using (auth.uid() = user_id);

create policy "own save - modify"
  on public.game_saves for all
  using      (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ── leaderboards ─────────────────────────────────────────────────────────────
-- One row per (user, category); submitScore upserts on (user_id, category).
create table if not exists public.leaderboards (
  id          bigserial primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  player_name text not null default 'Aetherian',
  category    text not null,            -- 'tower_weekly' | 'tower_alltime' | 'collection'
  score       int  not null default 0,
  updated_at  timestamptz not null default now()
);

create unique index if not exists leaderboards_user_category
  on public.leaderboards (user_id, category);

alter table public.leaderboards enable row level security;

drop policy if exists "anyone can read leaderboard" on public.leaderboards;
drop policy if exists "users can upsert own scores" on public.leaderboards;

-- Public read (leaderboard is shown to everyone).
create policy "anyone can read leaderboard"
  on public.leaderboards for select
  using (true);

-- Each user may write only their own row.
create policy "users can upsert own scores"
  on public.leaderboards for all
  using      (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ── delete_account() RPC ──────────────────────────────────────────────────────
-- Lets a signed-in user permanently delete their own auth record. Deleting the
-- auth.users row cascades to game_saves and leaderboards (FK on delete cascade).
-- SECURITY DEFINER so it can touch auth.users; scoped to auth.uid() so a user
-- can only ever delete themselves.
create or replace function public.delete_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all      on function public.delete_account() from public, anon;
grant  execute  on function public.delete_account() to authenticated;
