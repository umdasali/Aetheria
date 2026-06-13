import { getUID } from './auth';
import { supabase } from './supabaseConfig';

const SCHEMA_VERSION = 1;

const SAVE_FIELDS = [
  'schemaVersion', 'gems', 'gold', 'pity', 'playerUid',
  'ownedHeroes', 'heroCollection', 'team', 'savedTeams', 'activeTeamPreset',
  'completedChapters', 'milestonesClaimed',
  'lastClaimDate', 'dailyStreak', 'dailyQuests',
  'towerHighestFloor', 'towerCurrentFloor', 'towerWeekResetDate', 'towerCoins',
  'ascensionInventory',
  'pullHistory', 'achievements', 'pendingAchievementUnlocks',
  'eventPity', 'eventGuarantee',
  'playerProfile', 'settings',
  'hasSeenOnboarding', 'hasSeenBattleTutorial',
  'practiceBonusClaimed', 'pendingMilestoneReward',
];

function pickSaveFields(state) {
  const save = {};
  for (const key of SAVE_FIELDS) {
    if (state[key] !== undefined) save[key] = state[key];
  }
  // Supabase JSONB handles nested arrays natively — no serialization needed.
  return save;
}

export async function uploadSave(state) {
  try {
    const uid = await getUID();
    if (!uid) return { ok: false, error: new Error('Not signed in') };

    const { error } = await supabase
      .from('game_saves')
      .upsert(
        {
          user_id: uid,
          data: { ...pickSaveFields(state), schemaVersion: SCHEMA_VERSION, updatedAt: Date.now() },
        },
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
    const uid = await getUID();
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

// ── Conflict resolution ───────────────────────────────────────────────────────

function mergeAscensionInventory(local, cloud) {
  const merged = { ...(cloud || {}) };
  for (const [id, qty] of Object.entries(local || {})) {
    merged[id] = Math.max(merged[id] || 0, qty || 0);
  }
  return merged;
}

function mergeAchievements(local, cloud) {
  const merged = { ...(cloud || {}) };
  for (const [id, data] of Object.entries(local || {})) {
    if (!merged[id]) {
      merged[id] = data;
    } else {
      merged[id] = {
        ...merged[id],
        progress: Math.max(merged[id].progress || 0, data.progress || 0),
        claimed:  merged[id].claimed || data.claimed,
      };
    }
  }
  return merged;
}

function mergePullHistory(local, cloud) {
  const seen = new Set();
  const all  = [...(local || []), ...(cloud || [])];
  const deduped = [];
  for (const entry of all) {
    const key = `${entry.pulledAt}:${entry.heroId}`;
    if (!seen.has(key)) { seen.add(key); deduped.push(entry); }
  }
  return deduped.sort((a, b) => (b.pulledAt > a.pulledAt ? 1 : -1)).slice(0, 300);
}

function mergeEventPity(local, cloud) {
  const merged = { ...(cloud || {}) };
  for (const [id, count] of Object.entries(local || {})) {
    merged[id] = Math.max(merged[id] || 0, count || 0);
  }
  return merged;
}

function mergeEventGuarantee(local, cloud) {
  const merged = { ...(cloud || {}) };
  for (const [id, val] of Object.entries(local || {})) {
    merged[id] = merged[id] || val;
  }
  return merged;
}

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
        copies:        Math.max(merged[id].copies || 0, data.copies || 0),
        transcendence: Math.max(merged[id].transcendence || 0, data.transcendence || 0),
        effectiveRank: higherRank(merged[id].effectiveRank, data.effectiveRank),
      };
    }
  }
  return merged;
}

export function resolveConflict(local, cloud) {
  const cloudTs = typeof cloud.updatedAt === 'number' ? cloud.updatedAt : 0;
  const localTs = typeof local.updatedAt === 'number' ? local.updatedAt : 0;
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

    heroCollection:     mergeHeroCollection(local.heroCollection, cloud.heroCollection),
    ascensionInventory: mergeAscensionInventory(local.ascensionInventory, cloud.ascensionInventory),
    achievements:       mergeAchievements(local.achievements, cloud.achievements),
    pullHistory:        mergePullHistory(local.pullHistory, cloud.pullHistory),
    eventPity:          mergeEventPity(local.eventPity, cloud.eventPity),
    eventGuarantee:     mergeEventGuarantee(local.eventGuarantee, cloud.eventGuarantee),

    team:          useLocal ? local.team          : cloud.team,
    savedTeams:    useLocal ? local.savedTeams    : cloud.savedTeams,
    playerProfile: useLocal ? local.playerProfile : cloud.playerProfile,
    settings:      useLocal ? local.settings      : cloud.settings,
  };
}
