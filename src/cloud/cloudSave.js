import { supabase } from './supabaseConfig';

const SCHEMA_VERSION = 1;

const SAVE_FIELDS = [
  'schemaVersion', 'gems', 'gold', 'pity', 'playerUid',
  'ownedHeroes', 'heroCollection', 'team', 'savedTeams', 'activeTeamPreset',
  'completedChapters', 'milestonesClaimed',
  'lastClaimDate', 'dailyStreak', 'dailyQuests',
  'towerHighestFloor', 'towerCurrentFloor', 'towerWeekResetDate', 'towerCoins',
  'ascensionInventory',
  'playerProfile', 'settings',
  'hasSeenOnboarding', 'hasSeenBattleTutorial',
];

function pickSaveFields(state) {
  const save = {};
  for (const key of SAVE_FIELDS) {
    if (state[key] !== undefined) save[key] = state[key];
  }
  // Supabase JSONB handles nested arrays natively — no serialization needed.
  return save;
}

async function getUid() {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}

export async function uploadSave(state) {
  try {
    const uid = await getUid();
    if (!uid) return { ok: false, error: new Error('Not signed in') };

    const { error } = await supabase
      .from('game_saves')
      .upsert(
        { user_id: uid, data: { ...pickSaveFields(state), schemaVersion: SCHEMA_VERSION } },
        { onConflict: 'user_id' }
      );

    if (error) {
      console.warn('[CloudSave] Upload failed:', error.message);
      return { ok: false, error };
    }
    return { ok: true };
  } catch (err) {
    console.warn('[CloudSave] Upload error:', err.message);
    return { ok: false, error: err };
  }
}

export async function downloadSave() {
  try {
    const uid = await getUid();
    if (!uid) return { ok: false, error: new Error('Not signed in') };

    const { data, error } = await supabase
      .from('game_saves')
      .select('data')
      .eq('user_id', uid)
      .maybeSingle();

    if (error) {
      console.warn('[CloudSave] Download failed:', error.message);
      return { ok: false, error };
    }
    return { ok: true, data: data?.data ?? null };
  } catch (err) {
    console.warn('[CloudSave] Download error:', err.message);
    return { ok: false, error: err };
  }
}

// ── Conflict resolution (unchanged logic) ────────────────────────────────────

function higherRank(a, b) {
  const ORDER = [null, 'C', 'B', 'A', 'S', 'SOVEREIGN'];
  return ORDER.indexOf(a) >= ORDER.indexOf(b) ? a : b;
}

function mergeHeroCollection(local, cloud) {
  const merged = { ...(cloud || {}) };
  for (const [id, data] of Object.entries(local || {})) {
    if (!merged[id]) {
      merged[id] = data;
    } else {
      merged[id] = {
        ...merged[id],
        level:         Math.max(merged[id].level || 1, data.level || 1),
        copies:        (merged[id].copies || 0) + (data.copies || 0),
        transcendence: Math.max(merged[id].transcendence || 0, data.transcendence || 0),
        effectiveRank: higherRank(merged[id].effectiveRank, data.effectiveRank),
      };
    }
  }
  return merged;
}

export function resolveConflict(local, cloud) {
  const cloudTs  = cloud.updatedAt?.toMillis?.() ?? cloud.updatedAt ?? 0;
  const localTs  = local.updatedAt ?? 0;
  const useLocal = localTs > cloudTs;

  return {
    ...cloud,
    gems:              Math.max(local.gems  || 0, cloud.gems  || 0),
    gold:              Math.max(local.gold  || 0, cloud.gold  || 0),
    towerHighestFloor: Math.max(local.towerHighestFloor || 0, cloud.towerHighestFloor || 0),
    dailyStreak:       Math.max(local.dailyStreak || 0, cloud.dailyStreak || 0),

    ownedHeroes:       [...new Set([...(local.ownedHeroes || []), ...(cloud.ownedHeroes || [])])],
    completedChapters: [...new Set([...(local.completedChapters || []), ...(cloud.completedChapters || [])])],
    milestonesClaimed: [...new Set([...(local.milestonesClaimed || []), ...(cloud.milestonesClaimed || [])])],

    heroCollection: mergeHeroCollection(local.heroCollection, cloud.heroCollection),

    team:          useLocal ? local.team          : cloud.team,
    savedTeams:    useLocal ? local.savedTeams    : cloud.savedTeams,
    playerProfile: useLocal ? local.playerProfile : cloud.playerProfile,
    settings:      useLocal ? local.settings      : cloud.settings,
  };
}
