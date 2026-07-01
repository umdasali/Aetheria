-- ============================================================================
-- Aetheria: Legends Unbound — Player name lifecycle (rename / release)
-- Run after 0001-0003 (SQL Editor or `supabase db push`). Idempotent, additive.
--
-- Problem this fixes: 0003_player_names.sql only ever let a client CLAIM a name
-- once, during onboarding. There was no way to change it afterwards or to give
-- it up, so:
--   1. src/screens/EditProfileScreen.js could not honour uniqueness at all — it
--      wrote playerProfile.name straight into the store with no server check,
--      letting any player "rename" to a name someone else already claimed.
--   2. Deleting an account (public.delete_account()) cascades game_saves and
--      leaderboards via FK, but player_names has no link to auth.users, so a
--      deleted account's claimed name stayed locked forever with no owner.
--
-- Fix: track a lightweight owner token per row and add rename_name()/
-- release_name() RPCs scoped to that owner. The app has no per-device auth
-- session for anon players (onboarding claims a name BEFORE any sign-in), so
-- the owner token is the client-generated playerUid already used elsewhere in
-- the app as a persistent per-install display id (see generatePlayerUID() in
-- src/store/gameStore.js) — a 9-character code from a 32-symbol alphabet
-- (~3.5×10^13 combinations), passed by the client and checked server-side.
-- This is a soft trust model, consistent with claim_name()/is_name_available()
-- already being open to the anon role with no stronger credential available.
--
-- Backward compatible: the existing 1-arg claim_name(text) is left in place
-- (PostgREST/Postgres resolve overloads by argument count/names), so older
-- installed app builds that haven't picked up this change keep working.
--
-- Client references:
--   src/cloud/nameService.js -> claimName() / renameName() / releaseName()
-- ============================================================================

alter table public.player_names
  add column if not exists owner_uid text;

-- Existing rows (claimed before this migration) have owner_uid = null, meaning
-- "no recorded owner" — rename_name()/release_name() below treat a null
-- owner_uid as claimable/releasable by anyone presenting a matching old name,
-- since there is no prior owner token to check against.


-- ── claim_name(name, owner_uid) — new 2-arg overload ─────────────────────────
-- Same behaviour as the original claim_name(text), but also records which
-- playerUid claimed the name so it can be renamed/released later.
create or replace function public.claim_name(p_name text, p_owner_uid text)
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
  insert into public.player_names (name_key, display_name, owner_uid)
  values (v_key, v_display, nullif(btrim(coalesce(p_owner_uid, '')), ''))
  on conflict (name_key) do nothing
  returning display_name into v_claimed;

  if v_claimed is null then
    raise exception 'name_taken';
  end if;

  return v_claimed;
end;
$$;

revoke all      on function public.claim_name(text, text) from public;
grant  execute  on function public.claim_name(text, text) to anon, authenticated;


-- ── rename_name(old_name, new_name, owner_uid) ───────────────────────────────
-- Atomically releases p_old_name (only if it is unowned or owned by
-- p_owner_uid) and claims p_new_name for the same owner. Raises 'not_owner' if
-- p_old_name belongs to a different owner, 'name_taken' if p_new_name is
-- already claimed by someone else, or 'invalid_format' if p_new_name itself is
-- malformed.
--
-- p_old_name is intentionally NOT hard-validated the way p_new_name is: a
-- legacy playerProfile.name saved locally through the client bug this RPC
-- exists to fix (EditProfileScreen writing names with no server validation at
-- all) may not match the name pattern — e.g. wrong length or characters. Such
-- a name could never have been successfully claimed via claim_name() in the
-- first place, so there is no player_names row for it; we treat that case as
-- "nothing to release" instead of raising, so those exact affected players
-- aren't the ones permanently unable to fix their name.
create or replace function public.rename_name(p_old_name text, p_new_name text, p_owner_uid text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old_key  text;
  v_new_key  text := public._player_name_key(p_new_name);
  v_owner    text := nullif(btrim(coalesce(p_owner_uid, '')), '');
  v_old_row  public.player_names;
  v_display  text := btrim(p_new_name);
  v_claimed  text;
begin
  begin
    v_old_key := public._player_name_key(p_old_name);
  exception when others then
    v_old_key := null;
  end;

  if v_old_key is not null then
    select * into v_old_row from public.player_names where name_key = v_old_key;
  end if;

  -- IS DISTINCT FROM (not <>) so a caller who omits owner_uid can't bypass
  -- this by relying on NULL <> x evaluating to NULL (falsy in an IF), which
  -- would silently skip the check instead of raising. Checked once, up front,
  -- so it also covers the same-key "casing change" branch below — that branch
  -- used to skip ownership verification entirely and let anyone overwrite
  -- another owner's row just by resubmitting their name with different casing.
  if v_old_row.name_key is not null
     and v_old_row.owner_uid is not null
     and v_old_row.owner_uid is distinct from v_owner then
    raise exception 'not_owner';
  end if;

  if v_old_key is not null and v_old_key = v_new_key then
    -- Same underlying name (casing/whitespace change only) — re-stamp display
    -- text and owner in place, no free/claim cycle needed.
    update public.player_names
       set display_name = v_display,
           owner_uid    = coalesce(v_owner, owner_uid)
     where name_key = v_old_key
    returning display_name into v_claimed;
    return coalesce(v_claimed, v_display);
  end if;

  insert into public.player_names (name_key, display_name, owner_uid)
  values (v_new_key, v_display, v_owner)
  on conflict (name_key) do nothing
  returning display_name into v_claimed;

  if v_claimed is null then
    raise exception 'name_taken';
  end if;

  if v_old_row.name_key is not null then
    delete from public.player_names where name_key = v_old_key;
  end if;

  return v_claimed;
end;
$$;

revoke all      on function public.rename_name(text, text, text) from public;
grant  execute  on function public.rename_name(text, text, text) to anon, authenticated;


-- ── release_name(name, owner_uid) ────────────────────────────────────────────
-- Frees a claimed name, e.g. when an account is deleted. Only releases if the
-- row is unowned or owned by p_owner_uid. Returns true if a row was deleted,
-- false if the name wasn't claimed at all; raises 'not_owner' otherwise.
create or replace function public.release_name(p_name text, p_owner_uid text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key   text := public._player_name_key(p_name);
  v_owner text := nullif(btrim(coalesce(p_owner_uid, '')), '');
  v_row   public.player_names;
begin
  select * into v_row from public.player_names where name_key = v_key;

  if v_row.name_key is null then
    return false;
  end if;

  -- IS DISTINCT FROM, not <> — see rename_name() above for why a plain <>
  -- comparison against a possibly-NULL v_owner would silently fail open.
  if v_row.owner_uid is not null and v_row.owner_uid is distinct from v_owner then
    raise exception 'not_owner';
  end if;

  delete from public.player_names where name_key = v_key;
  return true;
end;
$$;

revoke all      on function public.release_name(text, text) from public;
grant  execute  on function public.release_name(text, text) to anon, authenticated;
