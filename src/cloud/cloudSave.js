import { getUID } from './auth';
import { supabase } from './supabaseConfig';
import { CURRENT_VERSION } from '../store/migrations';

// Keep cloud saves tagged with the SAME schema version the local migrations use, so the
// restore path can migrate() an older cloud save up to the current shape correctly.
const SCHEMA_VERSION = CURRENT_VERSION;

const SAVE_FIELDS = [
  'schemaVersion', 'gems', 'gold', 'pity', 'playerUid', 'playerUidSecret',
  'ownedHeroes', 'heroCollection', 'team', 'savedTeams', 'activeTeamPreset',
  'completedChapters', 'milestonesClaimed',
  'lastClaimDate', 'dailyStreak', 'dailyQuests',
  'towerHighestFloor', 'towerWeeklyBest', 'towerCurrentFloor', 'towerWeekResetDate', 'towerCoins',
  'ascensionInventory',
  'pullHistory', 'achievements', 'pendingAchievementUnlocks',
  'eventPity', 'eventGuarantee',
  'playerProfile', 'settings',
  'hasSeenOnboarding', 'hasSeenBattleTutorial',
  'practiceBonusClaimed', 'pendingMilestoneRewards',
  // Synced so re-auth can't reset an IAP entitlement cap or refill daily dungeon attempts.
  'shopPurchases', 'dungeonAttemptsUsed', 'dungeonResetDate', 'processedIapTransactionIds',
];

function pickSaveFields(state) {
  const save = {};
  for (const key of SAVE_FIELDS) {
    if (state[key] !== undefined) save[key] = state[key];
  }
  // Supabase JSONB handles nested arrays natively — no serialization needed.
  return save;
}

export async function uploadSave(state, uid = null) {
  try {
    const effectiveUid = uid ?? await getUID();
    if (!effectiveUid) return { ok: false, error: new Error('Not signed in') };

    const { error } = await supabase
      .from('game_saves')
      .upsert(
        {
          user_id: effectiveUid,
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

export async function downloadSave(uid = null) {
  try {
    const effectiveUid = uid ?? await getUID();
    if (!effectiveUid) return { ok: false, error: new Error('Not signed in') };

    const { data, error } = await supabase
      .from('game_saves')
      .select('data')
      .eq('user_id', effectiveUid)
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

// Per-pack purchase counts — max-merge so a sign-out/in cannot reset an IAP purchase cap.
function mergeShopPurchases(local, cloud) {
  const merged = { ...(cloud || {}) };
  for (const [id, qty] of Object.entries(local || {})) {
    merged[id] = Math.max(merged[id] || 0, qty || 0);
  }
  return merged;
}

// Daily dungeon-attempt counter: keep the most recent local date; on the same day keep
// the higher used-count so re-authenticating can't hand the player a free attempt refill.
function mergeDungeonAttempts(local, cloud) {
  const lDate = local.dungeonResetDate || '';
  const cDate = cloud.dungeonResetDate || '';
  if (lDate === cDate) {
    return { dungeonResetDate: lDate, dungeonAttemptsUsed: Math.max(local.dungeonAttemptsUsed || 0, cloud.dungeonAttemptsUsed || 0) };
  }
  return lDate > cDate
    ? { dungeonResetDate: lDate, dungeonAttemptsUsed: local.dungeonAttemptsUsed || 0 }
    : { dungeonResetDate: cDate, dungeonAttemptsUsed: cloud.dungeonAttemptsUsed || 0 };
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
  const pick = (key) => (useLocal ? local[key] : cloud[key]);
  const dungeon = mergeDungeonAttempts(local, cloud);

  return {
    ...cloud,

    // Spendable balances use TRUE last-writer-wins (not Math.max). Max-merging let
    // spent gems/gold reappear on the next multi-device sync — a duplication exploit.
    // Trade-off without server authority: the older device's unsynced earnings are lost,
    // which is correct LWW behaviour and far safer than resurrecting spent currency.
    gems:       pick('gems') || 0,
    gold:       pick('gold') || 0,
    pity:       pick('pity') || 0,
    towerCoins: pick('towerCoins') || 0,

    // Monotonic high-water records — safe to max-merge.
    towerHighestFloor: Math.max(local.towerHighestFloor || 0, cloud.towerHighestFloor || 0),
    towerWeeklyBest:   Math.max(local.towerWeeklyBest || 0, cloud.towerWeeklyBest || 0),

    // Point-in-time daily/progress state → newest writer wins.
    dailyStreak:       pick('dailyStreak') || 0,
    lastClaimDate:     pick('lastClaimDate'),
    dailyQuests:       pick('dailyQuests'),
    towerCurrentFloor: pick('towerCurrentFloor'),

    // Additive collections — union/merge so owned progress is never lost.
    ownedHeroes:       [...new Set([...(local.ownedHeroes || []), ...(cloud.ownedHeroes || [])])],
    completedChapters: [...new Set([...(local.completedChapters || []), ...(cloud.completedChapters || [])])],
    milestonesClaimed: [...new Set([...(local.milestonesClaimed || []), ...(cloud.milestonesClaimed || [])])],
    // Never drop a processed transaction ID on merge — losing one would let the
    // CustomerInfo listener re-grant an already-granted real-money purchase.
    processedIapTransactionIds: [...new Set([...(local.processedIapTransactionIds || []), ...(cloud.processedIapTransactionIds || [])])],

    heroCollection:     mergeHeroCollection(local.heroCollection, cloud.heroCollection),
    ascensionInventory: mergeAscensionInventory(local.ascensionInventory, cloud.ascensionInventory),
    achievements:       mergeAchievements(local.achievements, cloud.achievements),
    pullHistory:        mergePullHistory(local.pullHistory, cloud.pullHistory),
    eventPity:          mergeEventPity(local.eventPity, cloud.eventPity),
    eventGuarantee:     mergeEventGuarantee(local.eventGuarantee, cloud.eventGuarantee),

    // IAP caps and daily dungeon attempts — merged so re-auth can't reset either.
    shopPurchases:       mergeShopPurchases(local.shopPurchases, cloud.shopPurchases),
    dungeonResetDate:    dungeon.dungeonResetDate,
    dungeonAttemptsUsed: dungeon.dungeonAttemptsUsed,

    team:             useLocal ? local.team             : cloud.team,
    savedTeams:       useLocal ? local.savedTeams       : cloud.savedTeams,
    activeTeamPreset: useLocal ? local.activeTeamPreset : cloud.activeTeamPreset,
    playerProfile:    useLocal ? local.playerProfile    : cloud.playerProfile,
    settings:         useLocal ? local.settings         : cloud.settings,

    // Carry the winning timestamp forward so the merged result compares correctly next time.
    updatedAt: Math.max(cloudTs, localTs),
  };
}
