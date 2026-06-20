-- ============================================================================
-- Aetheria: Legends Unbound — Server-authoritative leaderboard scores
-- Run after 0001_init.sql (SQL Editor or `supabase db push`). Idempotent.
--
-- Problem this fixes: submitScore() previously upserted a CLIENT-SUPPLIED score
-- straight into public.leaderboards, so any player could post an arbitrary number
-- and the board was trivially spoofable.
--
-- Fix: scores are now derived SERVER-SIDE from the player's own game_saves row by
-- the submit_score() SECURITY DEFINER RPC, and direct client writes to the table
-- are revoked (only the RPC can write). Reads stay public.
-- ============================================================================

-- 1. Remove the client write path. Without a write policy, RLS denies direct
--    INSERT/UPDATE for the authenticated role; the SECURITY DEFINER RPC below
--    bypasses RLS and becomes the ONLY way to write a score.
drop policy if exists "users can upsert own scores" on public.leaderboards;

-- Public read stays (recreated idempotently in case 0001 wasn't applied first).
drop policy if exists "anyone can read leaderboard" on public.leaderboards;
create policy "anyone can read leaderboard"
  on public.leaderboards for select
  using (true);

-- Belt-and-braces: revoke table-level write grants from client roles.
revoke insert, update, delete on public.leaderboards from anon, authenticated;

-- 2. Defensive integrity constraint — scores can never be out of range even if a
--    future code path tries to write one.
alter table public.leaderboards
  drop constraint if exists leaderboards_score_range;
alter table public.leaderboards
  add  constraint leaderboards_score_range check (score >= 0 and score <= 100000);

-- 3. submit_score(category, player_name): derive the score from the caller's own
--    save and upsert it. Ignores any client-claimed value entirely.
create or replace function public.submit_score(p_category text, p_player_name text)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_save  jsonb;
  v_score int := 0;
  v_name  text;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if p_category not in ('tower_weekly', 'tower_alltime', 'collection') then
    raise exception 'Invalid category: %', p_category;
  end if;

  select data into v_save from public.game_saves where user_id = v_uid;

  -- Derive the score from authoritative save data. Type-guard every read so a
  -- malformed/missing field yields 0 instead of raising.
  if v_save is null then
    v_score := 0;
  elsif p_category = 'collection' then
    v_score := case when jsonb_typeof(v_save->'ownedHeroes') = 'array'
                    then jsonb_array_length(v_save->'ownedHeroes') else 0 end;
  elsif p_category = 'tower_weekly' then
    v_score := case when jsonb_typeof(v_save->'towerWeeklyBest') = 'number'
                    then (v_save->>'towerWeeklyBest')::int else 0 end;
  else -- tower_alltime
    v_score := case when jsonb_typeof(v_save->'towerHighestFloor') = 'number'
                    then (v_save->>'towerHighestFloor')::int else 0 end;
  end if;

  -- Clamp to sane ranges (tower floors 0-200, collection 0-1000).
  if p_category = 'collection' then
    v_score := greatest(0, least(v_score, 1000));
  else
    v_score := greatest(0, least(v_score, 200));
  end if;

  -- Sanitize the display name: trim, fall back, cap length.
  v_name := nullif(btrim(coalesce(p_player_name, '')), '');
  v_name := left(coalesce(v_name, 'Aetherian'), 24);

  insert into public.leaderboards (user_id, player_name, category, score, updated_at)
  values (v_uid, v_name, p_category, v_score, now())
  on conflict (user_id, category)
  do update set score = excluded.score, player_name = excluded.player_name, updated_at = now();

  return v_score;
end;
$$;

revoke all     on function public.submit_score(text, text) from public, anon;
grant  execute on function public.submit_score(text, text) to authenticated;
