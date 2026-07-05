import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { DAILY_REWARDS } from '../data/dailyRewards';
import { QUEST_DEFS } from '../data/dailyQuests';
import { HEROES } from '../data/heroes';
import { CHAPTER_DEFS, stageGoldReward } from '../data/story';
import { getCurrentWeekKey, isBossFloor, TOWER_MAX_FLOOR } from '../data/towerData';
import {
  ASCENSION_ITEMS, ASCENSION_MAX, RANK_TO_ASCENSION_ITEM_ID,
} from '../data/ascensionItems';
import { getShopPackById, getShopPackByProductId } from '../data/shopPacks';
import { DAILY_DUNGEON_ATTEMPTS, DUNGEON_REFILL_COST, DUNGEON_REFILL_AMOUNT } from '../data/resourceDungeons';
import { CURRENT_VERSION, migrate } from './migrations';
import { DEFAULT_AVATAR_ID } from '../data/avatars';
import { ACHIEVEMENT_DEFS } from '../data/achievements';
import { sanitizeState } from './sanitizeState';
import { initSyncQueue, triggerSync } from '../cloud/syncQueue';
import { claimPlayerUid as registerPlayerUid } from '../cloud/uidService';
import { claimName, renameName } from '../cloud/nameService';

// Copies consumed per upgrade. Kept low so progression is reachable for F2P players via
// recurring featured banners + pity, instead of requiring an unreachable pile of dupes of
// one specific hero. Exported so the HeroDetail forge UI shows the same numbers.
export const FUSION_COPIES    = 2;  // C→B→A→S rank-up
export const TRANSCEND_COPIES = 3;  // +5 level cap per transcendence (×4 to reach L30)

function localDateStr(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function generatePlayerUID() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = '';
  for (let i = 0; i < 9; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  // Format as XXX-XXX-XXX
  return `${id.slice(0, 3)}-${id.slice(3, 6)}-${id.slice(6)}`;
}

// Opaque ownership proof paired with playerUid — never shown to the player.
// Lets claim_player_uid() tell "this device re-confirming its own uid" apart
// from "a different device that collided with this uid" (see
// supabase/migrations/0005_player_uid_registry.sql).
function generatePlayerUidSecret() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let secret = '';
  for (let i = 0; i < 24; i++) {
    secret += chars[Math.floor(Math.random() * chars.length)];
  }
  return secret;
}

// Droppable ascension items (excludes aetheria_core / SOVEREIGN — too rare to drop freely)
const DROP_POOL = [
  { id: 'broken_wing',    weight: 65 },
  { id: 'lost_butterfly', weight: 25 },
  { id: 'feather_of_hope', weight: 10 },
];
function pickAscensionDrop(maxQty) {
  const roll = Math.random() * 100;
  let acc = 0;
  let itemId = DROP_POOL[0].id;
  for (const entry of DROP_POOL) {
    acc += entry.weight;
    if (roll < acc) { itemId = entry.id; break; }
  }
  const qty = Math.floor(Math.random() * maxQty) + 1;
  return { itemId, qty };
}

// Single source of truth for "how many chapters are fully cleared (all 3 parts)"
// — used by both the milestone-hero-reward check and achievement tracking, which
// previously recomputed this independently and could silently desync.
function countFullChapters(completedList) {
  return CHAPTER_DEFS.filter(ch => [1, 2, 3].every(p => completedList.includes(ch.id * 100 + p))).length;
}

// Canonical initial state — used both to seed the store and to reset it on account switch.
const INITIAL_STATE = {
  schemaVersion:         CURRENT_VERSION,
  updatedAt:             0,       // last local mutation time (ms) — drives cloud last-writer-wins
  cloudAccountEmail:     null,
  localUserId:           null,   // Supabase user id that owns this local save; null = unclaimed
  playerUid:             null,   // Persistent display UID shown on profile; generated once
  playerUidSecret:       null,   // Opaque ownership proof paired with playerUid; never shown
  playerUidClaimed:      false,  // true once playerUid is confirmed globally-unique server-side
  serverClaimedName:     null,   // last playerProfile.name value confirmed registered server-side
  pendingNameClaim:      null,   // name awaiting server (re)registration after a networkError
  ownedHeroes:           ['hero_002', 'hero_004', 'hero_005', 'hero_016'],
  team:                  ['hero_002', 'hero_004', 'hero_005'],
  gems:                  150,
  gold:                  10000,
  pity:                  0,
  lastClaimDate:         null,
  dailyStreak:           0,
  completedChapters:     [],
  milestonesClaimed:     [],
  // Queue, not a single slot — chaining "Next Stage" across two milestone
  // boundaries without ever returning to Home used to overwrite an unclaimed
  // reward with the next one, silently losing it.
  pendingMilestoneRewards: [],
  hasSeenOnboarding:     false,
  hasSeenBattleTutorial: false,
  practiceBonusClaimed:  false,
  savedTeams:            [[null, null, null], [null, null, null], [null, null, null]],
  activeTeamPreset:      -1,
  dailyQuests:           { date: '', progress: {}, claimed: {} },
  towerHighestFloor:     0,
  towerWeeklyBest:       0,    // highest floor reached in the current week (resets weekly)
  towerCurrentFloor:     1,
  towerWeekResetDate:    '',
  towerCoins:            0,
  dungeonAttemptsUsed:   0,    // resource-dungeon runs used today
  dungeonResetDate:      '',   // local date the attempt count belongs to
  ascensionInventory: {
    aetheria_core:   0,
    feather_of_hope: 0,
    lost_butterfly:  0,
    broken_wing:     0,
  },
  // Shop purchase counts, keyed by pack id (repeatable packs increment).
  shopPurchases: {},
  // RevenueCat transaction IDs already granted — prevents double-granting when
  // the CustomerInfo listener replays the same non-subscription transaction.
  processedIapTransactionIds: [],
  playerProfile: {
    name:            'Commander',
    signature:       '',
    avatarId:        DEFAULT_AVATAR_ID,
    showcaseIds:     [null, null, null],
    favoriteFaction: null,
  },
  settings: {
    musicVolume: 0.65,
    sfxVolume:   0.75,
    musicMute:   false,
    sfxMute:     false,
  },
  heroCollection: {
    hero_002: { level: 1, copies: 1, effectiveRank: null, transcendence: 0 },
    hero_004: { level: 1, copies: 1, effectiveRank: null, transcendence: 0 },
    hero_005: { level: 1, copies: 1, effectiveRank: null, transcendence: 0 },
    hero_016: { level: 1, copies: 1, effectiveRank: null, transcendence: 0 },
  },
  lastKnownTimestamp: 0,

  // ── Feature: Pull History ──────────────────────────────────────────────────
  pullHistory: [],   // newest first, max 300 entries

  // ── Feature: Achievements ─────────────────────────────────────────────────
  achievements:              {},   // { [achievementId]: { progress, claimed } }
  pendingAchievementUnlocks: [],   // IDs queued for toast display

  // ── Feature: Event Banners ────────────────────────────────────────────────
  eventPity:      {},   // { [eventId]: number }
  eventGuarantee: {},   // { [eventId]: boolean } — true = next S on that banner is guaranteed rate-up
};

const useGameStore = create(
  persist(
    (rawSet, get) => {
      // Stamp updatedAt on every mutation so cloud-merge has a real last-writer-wins
      // signal. Previously updatedAt was never set locally → it stayed 0 → cloud always
      // won and local team/profile/settings/currency edits were silently lost on sync
      // (see resolveConflict in cloudSave.js).
      const set = (partial, replace) =>
        rawSet(
          typeof partial === 'function'
            ? (s) => ({ ...partial(s), updatedAt: Date.now() })
            : { ...partial, updatedAt: Date.now() },
          replace,
        );

      return {
      ...INITIAL_STATE,

      // Wipes AsyncStorage and resets Zustand to defaults.
      // Call this when a new or different user signs in to prevent data leakage.
      // Uses rawSet (not the wrapped set) so updatedAt stays 0 — if we used the
      // wrapped set it would stamp Date.now(), making the blank reset state appear
      // newer than the incoming user's cloud save and causing resolveConflict to
      // discard the cloud data in favour of the empty local state.
      resetStore: async () => {
        await AsyncStorage.removeItem('trump-card-game-storage');
        rawSet({ ...INITIAL_STATE });
      },

      addHero: (heroId) => {
        const state = get();
        const collection = { ...state.heroCollection };

        if (collection[heroId]) {
          collection[heroId] = {
            ...collection[heroId],
            copies: collection[heroId].copies + 1,
          };
        } else {
          collection[heroId] = { level: 1, copies: 1, effectiveRank: null, transcendence: 0, ascension: 0 };
        }

        const ownedHeroes = state.ownedHeroes.includes(heroId)
          ? state.ownedHeroes
          : [...state.ownedHeroes, heroId];

        set({ ownedHeroes, heroCollection: collection });
      },

      setTeam: (teamIds) => {
        if (teamIds.length <= 3) {
          set({ team: teamIds });
        }
      },

      addToTeam: (heroId) => {
        const state = get();
        if (state.team.includes(heroId)) {
          set({ team: state.team.filter((id) => id !== heroId) });
        } else if (state.team.length < 3) {
          set({ team: [...state.team, heroId] });
        }
      },

      spendGems: (amount) => {
        const state = get();
        if (state.gems >= amount) {
          set({ gems: state.gems - amount });
          return true;
        }
        return false;
      },

      addGems: (amount) => {
        set((state) => ({ gems: state.gems + amount }));
      },

      addGold: (amount) => set((state) => ({ gold: state.gold + amount })),

      spendGold: (amount) => {
        const state = get();
        if (state.gold >= amount) {
          set({ gold: state.gold - amount });
          return true;
        }
        return false;
      },

      // Returns the reward object on success, null if already claimed today or clock rolled back
      claimDailyReward: () => {
        const now = Date.now();
        const state = get();
        // Rollback detection: reject if clock went back more than 1 minute from the last known time
        if (now < state.lastKnownTimestamp - 60000) return null;

        const today = localDateStr();
        if (state.lastClaimDate === today) return null;

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yest = localDateStr(yesterday);
        const isConsecutive = state.lastClaimDate === yest;

        const newStreak = isConsecutive ? state.dailyStreak + 1 : 1;
        const dayIdx    = (newStreak - 1) % 7;
        const reward    = DAILY_REWARDS[dayIdx];

        set(s => ({
          lastClaimDate:      today,
          dailyStreak:        newStreak,
          gems:               s.gems + (reward.gems || 0),
          gold:               s.gold + (reward.gold || 0),
          lastKnownTimestamp: Math.max(s.lastKnownTimestamp, now),
        }));
        triggerSync();
        return { reward, newStreak, dayIdx };
      },

      completeChapter: (chapterId, rewardGems, rewardHeroId) => {
        const state = get();
        const completed = state.completedChapters || [];
        if (completed.includes(chapterId)) return;

        // ── Core rewards: update FIRST so gems/gold always reflect the win ──
        const part       = chapterId % 10;
        const goldReward = stageGoldReward(part);
        const actualGems = rewardGems || 0;
        const newCompleted = [...completed, chapterId];

        set({
          completedChapters: newCompleted,
          gems: (state.gems || 0) + actualGems,
          gold: (state.gold || 0) + goldReward,
        });

        // ── Hero reward: separate block so any error doesn't block the above ──
        try {
          let actualHeroId = rewardHeroId || null;
          if (actualHeroId) {
            const heroData = HEROES.find(h => h.id === actualHeroId);
            if (heroData?.rank === 'S') {
              // Story stage hero rewards should never be S-rank (S heroes are
              // gacha/fusion-gated) — void it, but compensate so the advertised
              // reward isn't silently smaller than promised.
              actualHeroId = null;
              get().addGems(50);
              get().addGold(500);
            }
          }
          if (actualHeroId) get().addHero(actualHeroId);

          // Every 5 fully completed chapters → bonus A/B/C hero
          if (part === 3) {
            const fullChapterCount = countFullChapters(newCompleted);
            const milestones = Array.from(
              { length: Math.floor(CHAPTER_DEFS.length / 5) },
              (_, i) => (i + 1) * 5,
            );
            const claimed = state.milestonesClaimed || [];
            // >= (not ===) so a milestone skipped by a cloud-restore/merge is
            // still claimable on the next chapter completion (one per win).
            const newMilestone = milestones.find(m => fullChapterCount >= m && !claimed.includes(m));
            if (newMilestone) {
              const currentOwned = get().ownedHeroes || [];
              const eligible = HEROES.filter(h => ['A', 'B', 'C'].includes(h.rank));
              const unowned  = eligible.filter(h => !currentOwned.includes(h.id));
              const pool     = unowned.length > 0 ? unowned : eligible;
              if (pool.length > 0) {
                const pick = pool[Math.floor(Math.random() * pool.length)];
                const { itemId, qty } = pickAscensionDrop(3);
                const currentInv = get().ascensionInventory || {};
                set(s => ({
                  milestonesClaimed: [...claimed, newMilestone],
                  pendingMilestoneRewards: [
                    ...(s.pendingMilestoneRewards || []),
                    { hero: pick, milestone: newMilestone, ascensionDrop: { itemId, qty } },
                  ],
                  ascensionInventory: { ...currentInv, [itemId]: (currentInv[itemId] || 0) + qty },
                }));
                get().addHero(pick.id);
              }
            }
          }
        } catch (e) { console.warn('[GameStore] Chapter reward error:', e); }

        // ── Achievement tracking ─────────────────────────────────────────────
        try {
          // Stage cleared counter (all 3 parts of every chapter)
          get().trackAchievementProgress('stagesCleared', 1);
          // Chapter milestone achievements (fire on part 3 completion)
          if (part === 3) {
            const fullChapterCount = countFullChapters(newCompleted);
            for (const milestone of [5, 10, 15, 20, 25]) {
              if (fullChapterCount >= milestone) {
                get().trackAchievementProgress(`chaptersCleared_${milestone}`, 1);
              }
            }
          }
        } catch (e) { console.warn('[GameStore] Achievement tracking error:', e); }

        triggerSync();
      },

      // True if a single stage ID is done (e.g. stageId 101, 102, 103...)
      isStageCompleted: (stageId) => get().completedChapters.includes(stageId),

      // True if all 3 parts of a chapter are done (chapterId 1-15)
      isChapterCompleted: (chapterId) => {
        const state = get();
        return [1, 2, 3].every((p) => state.completedChapters.includes(chapterId * 100 + p));
      },

      getHeroData: (heroId) => {
        return get().heroCollection[heroId] || { level: 1, copies: 1 };
      },

      levelUpHero: (heroId) => {
        const state = get();
        const data  = state.heroCollection[heroId];
        if (!data) return false;
        const level        = data.level || 1;
        const transcendence = data.transcendence || 0;
        const maxLevel     = 10 + transcendence * 5;
        if (level >= maxLevel) return false;
        // Base cost 100×level for L1-10, then scales for transcended levels
        const cost = level <= 10 ? 100 * level : 200 * (level - 10) + 1000;
        if (state.gold < cost) return false;
        const collection = { ...state.heroCollection, [heroId]: { ...data, level: level + 1 } };
        set({ gold: state.gold - cost, heroCollection: collection });
        triggerSync();
        return true;
      },

      setPity: (n) => set({ pity: n }),

      // Shifts only the head of the queue so a still-unclaimed later reward
      // (from chaining "Next Stage" across two milestones) is never dropped.
      clearMilestoneReward:   () => set(s => ({ pendingMilestoneRewards: (s.pendingMilestoneRewards || []).slice(1) })),
      completeOnboarding:     () => set({ hasSeenOnboarding: true }),
      seenBattleTutorial:     () => set({ hasSeenBattleTutorial: true }),
      claimPracticeBonus:     () => set({ practiceBonusClaimed: true }),

      saveTeamPreset: (idx, heroIds) => {
        const state = get();
        const next  = state.savedTeams.map((t, i) => i === idx ? heroIds : t);
        const valid = heroIds.filter(id => id != null);
        // Keep the live battle team in sync when the edited preset is already deployed
        const teamSync = state.activeTeamPreset === idx && valid.length > 0
          ? { team: valid }
          : {};
        set({ savedTeams: next, ...teamSync });
      },

      deployPreset: (idx) => {
        const preset = get().savedTeams[idx];
        if (!preset) return;
        const valid = preset.filter(id => id != null);
        if (!valid.length) return;
        set({ team: valid, activeTeamPreset: idx });
        triggerSync();
      },

      updateProfile: (patch) => {
        set(state => ({ playerProfile: { ...state.playerProfile, ...patch } }));
        triggerSync();
      },

      updateSettings: (patch) =>
        set(state => ({ settings: { ...state.settings, ...patch } })),

      // Registers the local playerUid with the server so it's actually
      // guaranteed globally unique (see
      // supabase/migrations/0005_player_uid_registry.sql), not just
      // "unlikely to collide" from Math.random() alone. That guarantee
      // matters because playerUid also serves as the owner_uid trust token
      // for the player_names rename/release RPCs — two installs sharing a
      // UID could otherwise rename or release each other's claimed name.
      // Safe to call on every app launch: the RPC is idempotent for an
      // already-registered (uid, secret) pair, and best-effort offline
      // (no-ops on failure).
      claimPlayerUid: async () => {
        const state = get();
        const candidate = state.playerUid || generatePlayerUID();
        const secret = state.playerUidSecret || generatePlayerUidSecret();
        const { uid, secret: confirmedSecret, networkError } = await registerPlayerUid(candidate, secret);
        if (networkError || !uid) return;
        // Skip the wrapped set() (and its updatedAt: Date.now() stamp) when
        // nothing actually changed — this runs on every launch, so calling
        // set() unconditionally would reintroduce the same "cold start bumps
        // updatedAt with no real edit" problem fixed in checkTowerWeekReset,
        // corrupting resolveConflict()'s last-writer-wins merge signal.
        if (uid === state.playerUid && confirmedSecret === state.playerUidSecret && state.playerUidClaimed) return;
        set({ playerUid: uid, playerUidSecret: confirmedSecret, playerUidClaimed: true });
      },

      // Best-effort retry for a name claim/rename that previously failed with
      // a networkError (see OnboardingScreen.js / EditProfileScreen.js). Those
      // screens commit the chosen name to playerProfile.name locally right
      // away (offline-friendly UX) but leave the server registration stuck on
      // whatever serverClaimedName was last confirmed — without this retry,
      // that gap never closes on its own. Safe to call on every app launch:
      // no-ops when there's nothing pending, and best-effort offline.
      retryPendingNameClaim: async () => {
        const state = get();
        const pending = state.pendingNameClaim;
        if (!pending) return;
        const uid = state.playerUid;

        const res = state.serverClaimedName
          ? await renameName(state.serverClaimedName, pending, uid)
          : await claimName(pending, uid);

        if (res.networkError) return; // still offline — leave pendingNameClaim set for next retry

        if (res.claimed || res.renamed) {
          set({ serverClaimedName: res.displayName || pending, pendingNameClaim: null });
        } else {
          // 'taken' or 'not_owner' — this exact retry will never succeed on its
          // own (another player has since claimed it, or ownership can't be
          // verified). Drop it instead of retrying forever; the player can
          // pick a new name from EditProfileScreen if they still want to.
          set({ pendingNameClaim: null });
        }
      },

      // ── Daily Quest actions ─────────────────────────────────────────────────

      trackQuestProgress: (questId, amount = 1) => {
        const now = Date.now();
        // Rollback detection: reject progress update if clock went back more than 1 minute
        if (now < get().lastKnownTimestamp - 60000) return;
        const today = localDateStr();
        set(state => {
          const q      = state.dailyQuests;
          const isNewDay = q.date !== today;
          const base   = isNewDay ? { date: today, progress: {}, claimed: {} } : q;
          const prev   = base.progress[questId] || 0;
          return {
            dailyQuests: {
              ...base,
              progress: { ...base.progress, [questId]: prev + amount },
            },
            // Advance high-water mark when legitimately processing a new day
            lastKnownTimestamp: isNewDay ? Math.max(state.lastKnownTimestamp, now) : state.lastKnownTimestamp,
          };
        });
      },

      claimQuestReward: (questId, rewardGems, rewardGold) => {
        const today = localDateStr();
        const state = get();
        const q     = state.dailyQuests;
        if (q.date !== today || q.claimed[questId]) return false;
        const def = QUEST_DEFS.find(d => d.id === questId);
        if (def && (q.progress[questId] || 0) < def.target) return false;
        set({
          dailyQuests: { ...q, claimed: { ...q.claimed, [questId]: true } },
          gems: state.gems + (rewardGems || 0),
          gold: state.gold + (rewardGold || 0),
        });
        triggerSync();
        return true;
      },

      getDailyQuestProgress: () => {
        const today = localDateStr();
        const q     = get().dailyQuests;
        if (q.date !== today) return { progress: {}, claimed: {} };
        return { progress: q.progress, claimed: q.claimed };
      },

      // ── Tower actions ───────────────────────────────────────────────────────

      completeTowerFloor: (floor, rewards) => {
        // Reject anything but the exact floor the player is currently on: beyond
        // the cap, replaying a floor already cleared (e.g. re-entering floor 200
        // after the tower is conquered — an infinite gem/gold/coin farm), or a
        // stale/forged floor ahead of towerCurrentFloor that would skip floors.
        if (floor > TOWER_MAX_FLOOR || floor !== get().towerCurrentFloor) {
          return { ascensionDrop: null };
        }
        let ascensionDrop = null;
        if (isBossFloor(floor)) {
          const { itemId, qty } = pickAscensionDrop(2);
          ascensionDrop = { itemId, qty };
          set(state => {
            const inv = state.ascensionInventory || {};
            return {
              towerHighestFloor: Math.max(state.towerHighestFloor, floor),
              towerWeeklyBest: Math.max(state.towerWeeklyBest, floor),
              towerCurrentFloor: floor + 1,
              towerCoins: state.towerCoins + (rewards.coins || 0),
              gems: state.gems + (rewards.gems || 0),
              gold: state.gold + (rewards.gold || 0),
              ascensionInventory: { ...inv, [itemId]: (inv[itemId] || 0) + qty },
            };
          });
        } else {
          set(state => ({
            towerHighestFloor: Math.max(state.towerHighestFloor, floor),
            towerWeeklyBest: Math.max(state.towerWeeklyBest, floor),
            towerCurrentFloor: floor + 1,
            towerCoins: state.towerCoins + (rewards.coins || 0),
            gems: state.gems + (rewards.gems || 0),
            gold: state.gold + (rewards.gold || 0),
          }));
        }
        triggerSync();
        return { ascensionDrop };
      },

      checkTowerWeekReset: () => {
        const weekKey = getCurrentWeekKey();
        const current = get().towerWeekResetDate;
        // Already up-to-date for this week — bail out WITHOUT calling set(), which
        // always stamps updatedAt: Date.now(). This runs on every app rehydration
        // (onRehydrateStorage), so touching set() here on a no-op would bump
        // updatedAt on every cold start and make local data spuriously "win"
        // resolveConflict()'s last-writer-wins merge against genuinely newer cloud data.
        if (current === weekKey) return;
        set(
          // First-ever open (no stored key yet) — just stamp the week, don't wipe progress
          !current
            ? { towerWeekResetDate: weekKey }
            // Genuine new-week transition — reset current floor + weekly best, keep all-time record
            : { towerCurrentFloor: 1, towerWeeklyBest: 0, towerWeekResetDate: weekKey }
        );
      },

      // ── Resource Dungeon actions ────────────────────────────────────────────

      // Roll the daily attempt pool over at local midnight.
      checkDungeonReset: () => {
        const today = localDateStr();
        set(state => (state.dungeonResetDate === today
          ? {}
          : { dungeonResetDate: today, dungeonAttemptsUsed: 0 }));
      },

      // Consume one attempt when entering a dungeon. Returns false if none left.
      useDungeonAttempt: () => {
        const today = localDateStr();
        const state = get();
        const used  = state.dungeonResetDate === today ? state.dungeonAttemptsUsed : 0;
        if (used >= DAILY_DUNGEON_ATTEMPTS) return false;
        set({ dungeonResetDate: today, dungeonAttemptsUsed: used + 1 });
        return true;
      },

      // Spend gems to refund attempts (caps at 0 used = full bar).
      refillDungeonAttempts: () => {
        const today = localDateStr();
        const state = get();
        if (state.gems < DUNGEON_REFILL_COST) return false;
        const used = state.dungeonResetDate === today ? state.dungeonAttemptsUsed : 0;
        // Energy already full — never charge gems for a no-op.
        if (used <= 0) return false;
        set({
          gems:                state.gems - DUNGEON_REFILL_COST,
          dungeonResetDate:    today,
          dungeonAttemptsUsed: Math.max(0, used - DUNGEON_REFILL_AMOUNT),
        });
        triggerSync();
        return true;
      },

      // Grant a dungeon's rewards on win (gold + optional gems + ascension material).
      completeDungeon: (rewards) => {
        set(state => {
          const inv = { ...state.ascensionInventory };
          const mat = rewards?.material;
          if (mat?.itemId && mat.qty > 0) {
            inv[mat.itemId] = (inv[mat.itemId] || 0) + mat.qty;
          }
          return {
            gold:               state.gold + (rewards?.gold || 0),
            gems:               state.gems + (rewards?.gems || 0),
            ascensionInventory: inv,
          };
        });
        triggerSync();
      },

      // ── Fusion & Transcendence actions ──────────────────────────────────────

      fuseHero: (heroId) => {
        const state      = get();
        const data       = state.heroCollection[heroId];
        const hero       = HEROES.find(h => h.id === heroId);
        if (!data || !hero) return { ok: false, reason: 'not_owned' };
        // 2 copies (was 3): getting 3+ dupes of a specific hero from a 60-hero pool was
        // effectively unreachable F2P; 2 is attainable via recurring featured banners + pity.
        if ((data.copies ?? 1) < FUSION_COPIES) return { ok: false, reason: 'copies' };

        const RANK_ORDER = ['C', 'B', 'A', 'S'];
        const effectiveRank = data.effectiveRank || hero.rank;
        const idx = RANK_ORDER.indexOf(effectiveRank);
        if (idx < 0 || idx >= 3) return { ok: false, reason: 'max_rank' }; // S+ cannot fuse

        const fusionCosts = [2000, 5000, 10000];
        const cost = fusionCosts[idx];
        if (state.gold < cost) return { ok: false, reason: 'gold' };

        const newRank = RANK_ORDER[idx + 1];
        set({
          gold: state.gold - cost,
          heroCollection: {
            ...state.heroCollection,
            [heroId]: {
              ...data,
              copies:       (data.copies ?? 1) - FUSION_COPIES,
              effectiveRank: newRank,
            },
          },
        });
        triggerSync();
        return { ok: true, newRank };
      },

      transcendHero: (heroId) => {
        const state = get();
        const data  = state.heroCollection[heroId];
        if (!data) return { ok: false, reason: 'not_owned' };
        // 3 copies per transcendence (was 5) — see FUSION_COPIES note. 4 transcendences
        // to reach L30 now costs 12 copies of one hero instead of an unreachable 20.
        if ((data.copies ?? 1) < TRANSCEND_COPIES) return { ok: false, reason: 'copies' };

        const transcendence = data.transcendence || 0;
        if (transcendence >= 4) return { ok: false, reason: 'max' }; // hard cap L30

        const transcendCosts = [8000, 15000, 25000, 40000];
        const cost = transcendCosts[transcendence];
        if (state.gold < cost) return { ok: false, reason: 'gold' };

        set({
          gold: state.gold - cost,
          heroCollection: {
            ...state.heroCollection,
            [heroId]: {
              ...data,
              copies:       (data.copies ?? 1) - TRANSCEND_COPIES,
              transcendence: transcendence + 1,
            },
          },
        });
        triggerSync();
        return { ok: true, newMaxLevel: 10 + (transcendence + 1) * 5 };
      },

      // Atomic summon: deducts gems and grants heroes in a single set() call
      performSummon: (heroIds, cost) => {
        const state = get();
        if (state.gems < cost) return false;
        const collection = { ...state.heroCollection };
        const owned      = [...state.ownedHeroes];
        for (const heroId of heroIds) {
          if (collection[heroId]) {
            collection[heroId] = { ...collection[heroId], copies: collection[heroId].copies + 1 };
          } else {
            collection[heroId] = { level: 1, copies: 1, effectiveRank: null, transcendence: 0, ascension: 0 };
          }
          if (!owned.includes(heroId)) owned.push(heroId);
        }
        set({ gems: state.gems - cost, ownedHeroes: owned, heroCollection: collection });
        triggerSync();
        return true;
      },

      // ── Tower Shop ──────────────────────────────────────────────────────────

      // Spend tower coins to buy a gems or gold bundle
      buyTowerBundle: (type, amount, cost) => {
        const state = get();
        if (state.towerCoins < cost) return { ok: false, reason: 'coins' };
        const update = { towerCoins: state.towerCoins - cost };
        if (type === 'gems') update.gems = state.gems + amount;
        else if (type === 'gold') update.gold = state.gold + amount;
        set(update);
        triggerSync();
        return { ok: true };
      },

      purchaseAscensionItem: (itemId, qty) => {
        const state = get();
        const item  = ASCENSION_ITEMS.find(i => i.id === itemId);
        if (!item) return { ok: false, reason: 'invalid_item' };
        // Store is the validation layer — never trust caller-provided qty
        qty = Math.max(1, Math.floor(Number(qty) || 1));
        const totalCost = item.price * qty;
        if (state.towerCoins < totalCost) return { ok: false, reason: 'coins' };
        const inv = { ...state.ascensionInventory, [itemId]: (state.ascensionInventory[itemId] || 0) + qty };
        set({ towerCoins: state.towerCoins - totalCost, ascensionInventory: inv });
        triggerSync();
        return { ok: true };
      },

      ascendHero: (heroId) => {
        const state = get();
        const data  = state.heroCollection[heroId];
        const hero  = HEROES.find(h => h.id === heroId);
        if (!data || !hero) return { ok: false, reason: 'not_owned' };

        const ascension    = data.ascension || 0;
        if (ascension >= ASCENSION_MAX) return { ok: false, reason: 'max' };

        // Sovereign heroes are stored as rank 'S' + sovereign:true (fusion caps at S,
        // so effectiveRank never becomes 'SOVEREIGN'). Route them to Aetheria's Core
        // explicitly; otherwise the SOVEREIGN→aetheria_core mapping is unreachable.
        const rankForItem = hero.sovereign ? 'SOVEREIGN' : (data.effectiveRank || hero.rank);
        const itemId      = RANK_TO_ASCENSION_ITEM_ID[rankForItem];
        if (!itemId) return { ok: false, reason: 'invalid_rank' };

        const inv = { ...state.ascensionInventory };
        if ((inv[itemId] || 0) < 1) return { ok: false, reason: 'missing_item' };

        inv[itemId] = inv[itemId] - 1;
        set({
          ascensionInventory: inv,
          heroCollection: {
            ...state.heroCollection,
            [heroId]: { ...data, ascension: ascension + 1 },
          },
        });
        triggerSync();
        return { ok: true, newTier: ascension + 1 };
      },

      // Apply a shop pack's rewards atomically. Payment is resolved BEFORE this
      // call by src/shop/purchaseHandler.js (gem-spend or IAP), so this is a pure
      // grant: hero (+1 copy if repeatable/owned), gems, gold, Aetheria's Core.
      grantShopPack: (packId) => {
        const pack = getShopPackById(packId);
        if (!pack) return { ok: false, reason: 'invalid_pack' };

        // addHero handles new-vs-owned (+1 copy) and does its own set().
        if (pack.heroId) get().addHero(pack.heroId);

        const state = get();
        const g     = pack.grant || {};
        const inv   = { ...state.ascensionInventory };
        if (g.cores) inv.aetheria_core = (inv.aetheria_core || 0) + g.cores;

        const counts = { ...(state.shopPurchases || {}) };
        counts[packId] = (counts[packId] || 0) + 1;

        set({
          gems:               state.gems + (g.gems || 0),
          gold:               state.gold + (g.gold || 0),
          ascensionInventory: inv,
          shopPurchases:      counts,
        });
        triggerSync();
        return { ok: true, count: counts[packId] };
      },

      // Recovers a real-money purchase that was charged but never granted —
      // e.g. the app was killed between RevenueCat confirming the charge and
      // ShopScreen calling grantShopPack(). RevenueCat replays every
      // non-subscription transaction on the CustomerInfo listener on every
      // relaunch, so this only needs to grant transactions it hasn't seen yet.
      grantIapTransaction: (customerInfo) => {
        const txns = customerInfo?.nonSubscriptionTransactions || [];
        if (!txns.length) return;
        const processed = new Set(get().processedIapTransactionIds || []);
        const newlyProcessed = [];
        for (const txn of txns) {
          const txnId = txn.transactionIdentifier || txn.transactionId;
          if (!txnId || processed.has(txnId)) continue;
          const pack = getShopPackByProductId(txn.productIdentifier || txn.productId);
          if (!pack) continue;
          get().grantShopPack(pack.id);
          processed.add(txnId);
          newlyProcessed.push(txnId);
        }
        if (newlyProcessed.length > 0) {
          set(s => ({ processedIapTransactionIds: [...(s.processedIapTransactionIds || []), ...newlyProcessed] }));
          triggerSync();
        }
      },

      getEffectiveRank: (heroId) => {
        const data = get().heroCollection[heroId];
        if (!data?.effectiveRank) {
          const hero = HEROES.find(h => h.id === heroId);
          return hero?.rank || 'C';
        }
        return data.effectiveRank;
      },

      // ── Pull History ────────────────────────────────────────────────────────

      // entries: Array<{ heroId, heroName, rank, isPity, bannerType }>
      addToPullHistory: (entries) => {
        const pulledAt = new Date().toISOString();
        set(state => {
          const newEntries = entries.map(e => ({
            heroId:     e.heroId,
            heroName:   e.heroName,
            rank:       e.rank,
            isPity:     e.isPity || false,
            isFeatured: e.isFeatured || false,
            bannerType: e.bannerType || 'standard',
            pulledAt,
          }));
          const combined = [...newEntries, ...(state.pullHistory || [])];
          return { pullHistory: combined.slice(0, 300) };
        });
      },

      // ── Achievements ────────────────────────────────────────────────────────

      // key: trackKey from ACHIEVEMENT_DEFS, delta: amount to add (default 1)
      trackAchievementProgress: (key, delta = 1) => {
        set(state => {
          const defs = ACHIEVEMENT_DEFS.filter(d => d.trackKey === key);
          if (!defs.length) return {};

          const achievements = { ...state.achievements };
          const newUnlocks   = [];

          for (const def of defs) {
            const current = achievements[def.id] || { progress: 0, claimed: false };
            if (current.claimed) continue;

            const newProgress = Math.min(
              (current.progress || 0) + delta,
              def.target,
            );
            const justUnlocked = newProgress >= def.target && (current.progress || 0) < def.target;

            achievements[def.id] = { ...current, progress: newProgress };
            if (justUnlocked) newUnlocks.push(def.id);
          }

          if (!newUnlocks.length) return { achievements };
          return {
            achievements,
            pendingAchievementUnlocks: [
              ...state.pendingAchievementUnlocks,
              ...newUnlocks,
            ],
          };
        });
      },

      // Like trackAchievementProgress but uses Math.max instead of addition.
      // Use for achievements where progress = a high-water mark (e.g. towerHighestFloor).
      setMaxAchievementProgress: (key, value) => {
        set(state => {
          const defs = ACHIEVEMENT_DEFS.filter(d => d.trackKey === key);
          if (!defs.length) return {};

          const achievements = { ...state.achievements };
          const newUnlocks   = [];

          for (const def of defs) {
            const current = achievements[def.id] || { progress: 0, claimed: false };
            if (current.claimed) continue;

            const newProgress = Math.min(
              Math.max(current.progress || 0, value),
              def.target,
            );
            if (newProgress === (current.progress || 0)) continue;

            const justUnlocked = newProgress >= def.target && (current.progress || 0) < def.target;
            achievements[def.id] = { ...current, progress: newProgress };
            if (justUnlocked) newUnlocks.push(def.id);
          }

          if (!newUnlocks.length) return { achievements };
          return {
            achievements,
            pendingAchievementUnlocks: [
              ...state.pendingAchievementUnlocks,
              ...newUnlocks,
            ],
          };
        });
      },

      claimAchievementReward: (achievementId) => {
        const state = get();
        const def   = ACHIEVEMENT_DEFS.find(d => d.id === achievementId);
        if (!def) return false;
        const entry = state.achievements[achievementId];
        if (!entry || entry.progress < def.target || entry.claimed) return false;

        const update = {
          achievements: {
            ...state.achievements,
            [achievementId]: { ...entry, claimed: true },
          },
        };
        if (def.reward?.gems)  update.gems  = state.gems  + def.reward.gems;
        if (def.reward?.gold)  update.gold  = state.gold  + def.reward.gold;
        set(update);
        triggerSync();
        return true;
      },

      clearAchievementUnlocks: () => set({ pendingAchievementUnlocks: [] }),

      // ── Event pity ──────────────────────────────────────────────────────────

      setEventPity: (eventId, n) =>
        set(state => ({ eventPity: { ...state.eventPity, [eventId]: n } })),

      setEventGuarantee: (eventId, guaranteed) =>
        set(state => ({ eventGuarantee: { ...state.eventGuarantee, [eventId]: guaranteed } })),

      // Exchange hero copies for tower coins (rank-tiered rates).
      // C/B copies → modest coins for common progression material.
      // A/S/SOVEREIGN copies → significant coins usable in the Tower Shop.
      convertExcessCopies: (heroId, count) => {
        const COINS_PER_COPY = { SOVEREIGN: 200, S: 80, A: 35, B: 15, C: 8 };
        set(state => {
          const current = state.heroCollection[heroId];
          const hero    = HEROES.find(h => h.id === heroId);
          if (!current || current.copies < count || count <= 0) return state;
          // Sovereign heroes are stored as rank 'S' + sovereign:true — fusion caps
          // at S, so effectiveRank never becomes 'SOVEREIGN'. Without this check
          // every sovereign copy silently converted at the S rate (80) instead of
          // the SOVEREIGN rate (200), a 60% shortfall. Same override as ascendHero.
          const rank    = hero?.sovereign ? 'SOVEREIGN' : (current.effectiveRank || hero?.rank || 'C');
          const rate    = COINS_PER_COPY[rank] ?? COINS_PER_COPY.C;
          return {
            ...state,
            heroCollection: {
              ...state.heroCollection,
              [heroId]: { ...current, copies: current.copies - count },
            },
            towerCoins: state.towerCoins + count * rate,
          };
        });
      },

      // Exchange lower-tier ascension materials for higher-tier ones.
      // Validates the recipe server-side — callers must not trust UI counts alone.
      exchangeAscensionItems: (fromItemId, fromQty, toItemId, toQty) => {
        const state = get();
        const inv   = { ...state.ascensionInventory };
        if ((inv[fromItemId] || 0) < fromQty) return false;
        inv[fromItemId] = inv[fromItemId] - fromQty;
        inv[toItemId]   = (inv[toItemId] || 0) + toQty;
        set({ ascensionInventory: inv });
        triggerSync();
        return true;
      },
      };
    },
    {
      name: 'trump-card-game-storage',
      storage: createJSONStorage(() => AsyncStorage),
      version: CURRENT_VERSION,
      migrate: (persistedState, fromVersion) => migrate(persistedState, fromVersion),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.warn('[GameStore] Hydration error:', error);
          Alert.alert(
            'Save Data Error',
            'Your saved progress could not be loaded. Your game data may have been reset. If this keeps happening, please reinstall the app.',
            [{ text: 'OK' }]
          );
        }
        if (!state) return;
        const clean = sanitizeState(state);
        if (clean) Object.assign(state, clean);
        if (!state.playerUid) state.playerUid = generatePlayerUID();
        state.checkTowerWeekReset();
      },
    }
  )
);

// Wire the sync queue so debounced uploads can read current state
initSyncQueue(() => useGameStore.getState());

export default useGameStore;
