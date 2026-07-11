-- ============================================================================
-- Aetheria: Legends Unbound — Force-update remote config
-- Run after 0001-0005 (SQL Editor or `supabase db push`). Idempotent.
--
-- Problem this fixes: there was no way to require players on an old build to
-- update before continuing — a critical bug fix or balance change shipped to
-- the store had no way to actually reach installed clients.
--
-- Design: a tiny public read-only table holding the lowest app version still
-- allowed to play (Android / Google Play only — this game does not ship on
-- iOS). On launch, LoadingScreen compares Application.nativeApplicationVersion
-- (the installed native version) against this row via
-- src/cloud/versionCheck.js. If the installed version is older, the player is
-- routed to ForceUpdateScreen instead of Home/Onboarding, with no way to
-- dismiss it, until they update from store_url.
--
-- This table holds no secrets and no per-player data, so unlike
-- player_uids/player_names it does NOT need a SECURITY DEFINER RPC — a plain
-- public SELECT policy is enough. Writes are left to the Supabase dashboard
-- (or service-role scripts) only; anon/authenticated never get insert/update.
--
-- Kept keyed by `platform` (rather than a single hardcoded row) in case a
-- second store config is ever needed, but only 'android' is seeded/queried
-- today.
--
-- To force an update after shipping a new Play Store build: update min_version
-- to that build's version string (must match app.base.json "version", e.g.
-- "1.1.0"). Any installed client below that version is blocked on next
-- launch. Leave min_version at (or below) the current shipped version to
-- leave force-update inactive.
--
-- Client references:
--   src/cloud/versionCheck.js -> checkForceUpdate()
--   src/screens/ForceUpdateScreen.js
--   src/screens/LoadingScreen.js
-- ============================================================================

create table if not exists public.app_config (
  platform       text primary key,
  min_version    text not null,
  store_url      text not null,
  update_message text,
  updated_at     timestamptz not null default now()
);

alter table public.app_config enable row level security;

drop policy if exists "app_config_public_read" on public.app_config;
create policy "app_config_public_read"
  on public.app_config
  for select
  to anon, authenticated
  using (true);

-- No insert/update/delete policies on purpose — anon/authenticated can only
-- read. Bump min_version from the Supabase dashboard (or a service-role
-- script) when you actually want to force an update.
revoke insert, update, delete on public.app_config from anon, authenticated;

-- min_version starts equal to the current shipped version so force-update is
-- inactive until you deliberately raise it.
insert into public.app_config (platform, min_version, store_url, update_message)
values
  ('android', '1.0.0',
   'https://play.google.com/store/apps/details?id=aetheria_legends.unbound',
   'A new version of Aetheria: Legends Unbound is available with fixes and improvements. Please update to continue playing.')
on conflict (platform) do nothing;
