-- ============================================================================
-- Aetheria: Legends Unbound — Unique player (game) names
-- Run after 0001_init.sql and 0002_leaderboard_server_authoritative.sql
-- (SQL Editor or `supabase db push`). Idempotent.
--
-- Onboarding asks every new player to pick a game name before the tour starts,
-- and needs to enforce global uniqueness. Onboarding runs BEFORE any account
-- exists (cloud sign-in is a separate, optional, later step in Settings), so
-- the availability check and the claim itself must work for the anon role,
-- not just authenticated users. Direct table access stays RLS-locked; the two
-- SECURITY DEFINER RPCs below are the only way in or out.
--
-- Client references:
--   src/cloud/nameService.js -> is_name_available() / claim_name()
-- ============================================================================

create table if not exists public.player_names (
  name_key     text primary key,           -- normalized (trimmed + lowercased) uniqueness key
  display_name text not null,              -- original casing, shown in-game
  claimed_at   timestamptz not null default now()
);

alter table public.player_names enable row level security;

-- No select/insert/update policies on purpose: RLS denies ALL direct client
-- access (anon and authenticated alike). The RPCs below are SECURITY DEFINER
-- and bypass RLS, so they remain the only way to read or write this table.
revoke all on public.player_names from anon, authenticated;


-- ── shared validation ────────────────────────────────────────────────────────
-- Normalizes p_name and returns its uniqueness key, or raises 'invalid_format'.
-- 3-16 chars: letters, digits, spaces, underscores, hyphens (after trimming).
create or replace function public._player_name_key(p_name text)
returns text
language plpgsql
immutable
as $$
declare
  v_trimmed text := btrim(coalesce(p_name, ''));
begin
  if v_trimmed !~ '^[A-Za-z0-9 _-]{3,16}$' then
    raise exception 'invalid_format';
  end if;
  return lower(v_trimmed);
end;
$$;

revoke all on function public._player_name_key(text) from public, anon, authenticated;


-- ── is_name_available(name) ───────────────────────────────────────────────────
-- Returns true if p_name passes format validation and is not already claimed.
-- Raises 'invalid_format' for a malformed name so the client can tell the two
-- cases apart. Safe to call pre-auth (anon) since onboarding precedes sign-in.
create or replace function public.is_name_available(p_name text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key text := public._player_name_key(p_name);
begin
  return not exists (select 1 from public.player_names where name_key = v_key);
end;
$$;

revoke all      on function public.is_name_available(text) from public;
grant  execute  on function public.is_name_available(text) to anon, authenticated;


-- ── claim_name(name) ───────────────────────────────────────────────────────────
-- Atomically claims p_name and returns the stored display name. Raises
-- 'name_taken' if another player claimed it first (race-safe via the primary
-- key + ON CONFLICT, not a check-then-insert). Raises 'invalid_format' for a
-- malformed name.
create or replace function public.claim_name(p_name text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key      text := public._player_name_key(p_name);
  v_display  text := btrim(p_name);
  v_claimed  text;
begin
  insert into public.player_names (name_key, display_name)
  values (v_key, v_display)
  on conflict (name_key) do nothing
  returning display_name into v_claimed;

  if v_claimed is null then
    raise exception 'name_taken';
  end if;

  return v_claimed;
end;
$$;

revoke all      on function public.claim_name(text) from public;
grant  execute  on function public.claim_name(text) to anon, authenticated;
