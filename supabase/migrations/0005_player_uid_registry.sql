-- ============================================================================
-- Aetheria: Legends Unbound — Globally-unique player UID registry
-- Run after 0001-0004 (SQL Editor or `supabase db push`). Idempotent.
--
-- Problem this fixes: generatePlayerUID() in src/store/gameStore.js has always
-- generated the player's display UID (format "J8M-LW6-2FS") with pure
-- Math.random() on-device, with NO server-side uniqueness check at all. Two
-- installs could, in principle, land on the same UID (the keyspace is
-- ~3.5×10^13, so collisions are astronomically unlikely by chance — but this
-- UID is now also used as the `owner_uid` trust token for the player_names
-- rename/release RPCs added in 0004_name_lifecycle.sql. If two players ever
-- did share a UID, either could rename or release the other's claimed name.
-- Making the UID server-verified-unique closes that gap for good instead of
-- just relying on "the odds are low."
--
-- Design: the client still generates a candidate UID locally first (instant,
-- works offline, matches the existing UX of showing a UID immediately). It
-- then calls claim_player_uid(candidate, secret) to register it. If the
-- candidate is free, the server confirms it as-is (existing installs keep the
-- UID they already display). If it's taken (collision) or malformed, the
-- server generates a fresh one itself — server-side generation retries
-- against the unique constraint until an insert actually succeeds, so the
-- *returned* value is guaranteed globally unique, unlike a client-only guess.
--
-- Ownership (p_secret): a second, opaque, high-entropy token the client
-- generates once and persists locally alongside its uid (never shown to the
-- player). This is what lets the server tell "this device re-confirming its
-- own uid" apart from "a different device that happens to collide with this
-- uid" — a plain ON CONFLICT DO NOTHING/DO UPDATE can't make that
-- distinction, since both cases look identical (a row that already exists).
-- Rows claimed before this secret existed have owner_secret = null; the first
-- caller to present a secret for such a row adopts it going forward — the
-- same trust-on-first-use model claim_name() already uses for legacy
-- owner_uid-less rows in 0004_name_lifecycle.sql.
--
-- Client references:
--   src/cloud/uidService.js -> claimPlayerUid()
--   src/store/gameStore.js  -> claimPlayerUid action, playerUidClaimed flag,
--                              playerUidSecret
-- ============================================================================

create table if not exists public.player_uids (
  uid          text primary key,
  owner_secret text,
  claimed_at   timestamptz not null default now()
);

alter table public.player_uids
  add column if not exists owner_secret text;

alter table public.player_uids enable row level security;

-- No select/insert/update policies on purpose: RLS denies ALL direct client
-- access. claim_player_uid() below is SECURITY DEFINER and bypasses RLS, so
-- it remains the only way to read or write this table — same model as
-- public.player_names in 0003_player_names.sql.
revoke all on public.player_uids from anon, authenticated;


-- ── claim_player_uid(uid, secret) ────────────────────────────────────────────
-- Registers p_uid if it's well-formed and (a) free or (b) already owned by
-- p_secret; otherwise (missing, malformed, or owned by a DIFFERENT secret)
-- generates a fresh globally-unique uid+secret pair server-side and registers
-- that instead. Returns { uid, secret } as jsonb — callers must persist BOTH,
-- since either may differ from what they proposed.
create or replace function public.claim_player_uid(p_uid text default null, p_secret text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  -- Matches generatePlayerUID()'s alphabet in src/store/gameStore.js: no I, O,
  -- 0, or 1, to avoid characters players could visually confuse with each other.
  v_alphabet     text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_secret_chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  v_normalized   text;
  v_secret       text := nullif(btrim(coalesce(p_secret, '')), '');
  v_existing     text;
  v_claimed      text;
  v_raw          text;
  v_candidate    text;
  v_attempt      int;
  v_char_idx     int;
begin
  v_normalized := upper(btrim(coalesce(p_uid, '')));

  if v_normalized ~ '^[A-HJ-NP-Z2-9]{3}-[A-HJ-NP-Z2-9]{3}-[A-HJ-NP-Z2-9]{3}$' then
    -- ON CONFLICT DO NOTHING (not DO UPDATE): a real collision must actually
    -- surface as "no row returned" so it falls through to fresh generation
    -- below, instead of being silently accepted as if this caller owned it.
    insert into public.player_uids (uid, owner_secret) values (v_normalized, v_secret)
    on conflict (uid) do nothing
    returning uid into v_claimed;

    if v_claimed is not null then
      return jsonb_build_object('uid', v_claimed, 'secret', v_secret);
    end if;

    -- Row already exists — this is either the same device re-confirming a
    -- UID it already registered (idempotent, expected on every app launch)
    -- or a genuine collision with a different device. Only the owner_secret
    -- can tell them apart.
    select owner_secret into v_existing from public.player_uids where uid = v_normalized;

    if v_existing is null then
      -- Legacy row with no recorded secret — adopt this caller's secret so
      -- future re-confirms are verified from here on.
      update public.player_uids set owner_secret = v_secret
       where uid = v_normalized and owner_secret is null;
      return jsonb_build_object('uid', v_normalized, 'secret', v_secret);
    elsif v_secret is not null and v_existing = v_secret then
      return jsonb_build_object('uid', v_normalized, 'secret', v_secret);
    end if;
    -- Different secret (or none supplied against an owned row) — real
    -- collision. Fall through to minting a fresh uid below.
  end if;

  if v_secret is null then
    v_raw := '';
    for v_char_idx in 1..24 loop
      v_raw := v_raw || substr(v_secret_chars, (floor(random() * length(v_secret_chars)) + 1)::int, 1);
    end loop;
    v_secret := v_raw;
  end if;

  -- No candidate given, it was malformed, or it collided with another
  -- device's uid — generate a fresh one and retry until the unique
  -- constraint actually lets an insert through. 20 attempts against a
  -- ~3.5×10^13 keyspace is enormous headroom; genuinely exhausting it would
  -- mean the table is nearly full, not a run of bad luck.
  for v_attempt in 1..20 loop
    v_raw := '';
    for v_char_idx in 1..9 loop
      v_raw := v_raw || substr(v_alphabet, (floor(random() * length(v_alphabet)) + 1)::int, 1);
    end loop;
    v_candidate := substr(v_raw, 1, 3) || '-' || substr(v_raw, 4, 3) || '-' || substr(v_raw, 7, 3);

    insert into public.player_uids (uid, owner_secret) values (v_candidate, v_secret)
    on conflict (uid) do nothing
    returning uid into v_claimed;

    if v_claimed is not null then
      return jsonb_build_object('uid', v_claimed, 'secret', v_secret);
    end if;
  end loop;

  raise exception 'could_not_generate_uid';
end;
$$;

revoke all      on function public.claim_player_uid(text, text) from public;
grant  execute  on function public.claim_player_uid(text, text) to anon, authenticated;
