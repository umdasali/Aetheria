// ─── Force-Update Version Check ──────────────────────────────────────────────
// Schema lives in supabase/migrations/0006_app_config.sql:
//   public.app_config  -> RLS, public SELECT only
//
// Compares the installed native app version against the 'android' row's
// min_version (this game is Android / Google Play only — no iOS build). If
// the install is older, the caller (LoadingScreen) routes to
// ForceUpdateScreen instead of Home/Onboarding, with no way to bypass it.
//
// This must never hang or crash the launch flow for a player with no network
// or if Supabase is unreachable — checkForceUpdate() always resolves (never
// rejects) and fails OPEN (required: false) on any error or timeout, so an
// outage never blocks people who are already on a fine version.

import Constants from 'expo-constants';
import * as Application from 'expo-application';
import { supabase } from './supabaseConfig';

const CHECK_TIMEOUT_MS = 4000;

/** Compares dotted version strings numerically. Returns -1, 0, or 1. */
export function compareVersions(a, b) {
  const partsA = String(a ?? '').split('.');
  const partsB = String(b ?? '').split('.');
  const len = Math.max(partsA.length, partsB.length);
  for (let i = 0; i < len; i++) {
    const numA = parseInt(partsA[i], 10) || 0;
    const numB = parseInt(partsB[i], 10) || 0;
    if (numA !== numB) return numA < numB ? -1 : 1;
  }
  return 0;
}

function getInstalledVersion() {
  return Application.nativeApplicationVersion ?? Constants.expoConfig?.version ?? '0.0.0';
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise(resolve => setTimeout(() => resolve({ data: null, error: { message: 'timeout' } }), ms)),
  ]);
}

/**
 * Returns { required, storeUrl, message, installedVersion }.
 * required is only ever true when app_config was reachable AND the installed
 * version is genuinely below min_version.
 */
export async function checkForceUpdate() {
  const installedVersion = getInstalledVersion();

  try {
    const { data, error } = await withTimeout(
      supabase
        .from('app_config')
        .select('min_version, store_url, update_message')
        .eq('platform', 'android')
        .maybeSingle(),
      CHECK_TIMEOUT_MS
    );

    if (error || !data?.min_version || !data?.store_url) {
      return { required: false, storeUrl: null, message: null, installedVersion };
    }

    const required = compareVersions(installedVersion, data.min_version) < 0;
    return {
      required,
      storeUrl: data.store_url,
      message: data.update_message ?? null,
      installedVersion,
    };
  } catch (_err) {
    return { required: false, storeUrl: null, message: null, installedVersion };
  }
}
