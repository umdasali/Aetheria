# Trump Card — Complete Game Audit
> Last audited: 2026-06-04 · Auditor: Claude Sonnet 4.6

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Current State — What's Built](#2-current-state--whats-built)
3. [Architecture Deep-Dive](#3-architecture-deep-dive)
4. [Critical Issues — Security & Data Integrity](#4-critical-issues--security--data-integrity)
5. [AsyncStorage Safeguards — Detailed Plan](#5-asyncstorage-safeguards--detailed-plan)
6. [Cloud Save System — Detailed Plan](#6-cloud-save-system--detailed-plan)
7. [Battle Engine Analysis](#7-battle-engine-analysis)
8. [State Management Audit](#8-state-management-audit)
9. [Missing Features & Gaps](#9-missing-features--gaps)
10. [Performance Issues](#10-performance-issues)
11. [Bug Report](#11-bug-report)
12. [Implementation Roadmap](#12-implementation-roadmap)
13. [Priority Matrix](#13-priority-matrix)

---

## 1. Executive Summary

The game is architecturally solid — 17 screens, 36 heroes, 20 chapters × 3 stages, Endless Tower, gacha with pity, daily rewards, daily quests, team presets, hero fusion/transcendence, status effects, and a fully animated battle engine. The codebase follows consistent patterns (C.* tokens, no TypeScript, no bare hex).

**Three critical issues before anything else:**

| Issue | Severity | Impact |
|---|---|---|
| All save data is local-only (AsyncStorage) | HIGH | Player progress wiped on uninstall |
| No integrity checks on stored data | HIGH | Easy to edit gems/heroes via ADB/jailbreak |
| No schema versioning | MEDIUM | Future migrations will be fragile |

---

## 2. Current State — What's Built

### Screens (17 total — all implemented)

| Screen | Status | Notes |
|---|---|---|
| `LoadingScreen` | ✅ Complete | Animated progress + tips, holds splash |
| `OnboardingScreen` | ✅ Complete | First-launch onboarding |
| `HomeScreen` | ✅ Complete | Hub with sidebar, action panels, HUD, weather |
| `StoryScreen` | ✅ Complete | 20 chapters, 3 stages each, sidebar nav |
| `NarrationScreen` | ✅ Complete | Pre-battle dialogue with chapter lore |
| `BattleScreen` | ✅ Complete | Turn-based, status effects, AI, animations |
| `VictoryScreen` | ✅ Complete | Win/lose with XP, rewards, particles |
| `DailyRewardScreen` | ✅ Complete | 7-day streak system |
| `CollectionScreen` | ✅ Complete | 5-col grid, faction filter, sort |
| `TeamBuildScreen` | ✅ Complete | 3 presets, deploy, faction filter |
| `SummonScreen` | ✅ Complete | Gacha ×1/×10, pity@90, video animation |
| `HeroDetailScreen` | ✅ Complete | Stats, skills, trump card, level info |
| `ProfileScreen` | ✅ Complete | Avatar, showcase, name, faction |
| `SettingsScreen` | ✅ Complete | Music/SFX sliders, mute |
| `WorldMapScreen` | ✅ Complete | Faction lore, rulers, hero browser |
| `DailyQuestScreen` | ✅ Complete | Quest tracking, gem/gold rewards |
| `TowerScreen` | ✅ Complete | 200-floor tower, weekly reset, rewards |

### Data Layers

| Layer | Heroes | Chapters | Enemies | Status |
|---|---|---|---|---|
| `heroes.js` | **36 heroes**, 5 factions, 4 ranks | — | — | ✅ |
| `story.js` | — | **20 chapters × 3 stages = 60 stages** | — | ✅ |
| `enemies.js` | — | — | Multiple groups by chapter | ✅ |
| `towerData.js` | — | — | 200 floors, boss every 10 | ✅ |
| `dailyRewards.js` | — | 7-day cycle | — | ✅ |
| `dailyQuests.js` | — | Rotating quests | — | ✅ |
| `backgrounds.js` | — | Weather backgrounds | — | ✅ |

### State (Zustand + AsyncStorage)

| Field | Type | Purpose |
|---|---|---|
| `gems` | number | Primary premium currency |
| `gold` | number | Secondary currency |
| `pity` | number | Gacha pity counter (resets at 90) |
| `ownedHeroes` | string[] | Hero ID list |
| `heroCollection` | object | Per-hero `{level, copies, effectiveRank, transcendence}` |
| `team` | string[] | Active battle team (max 3) |
| `savedTeams` | [3][3] | 3 presets × 3 slots |
| `activeTeamPreset` | number | Which preset is live (-1 = none) |
| `completedChapters` | number[] | Stage IDs (e.g. 101, 102…) |
| `milestonesClaimed` | number[] | Milestone chapter counts |
| `pendingMilestoneReward` | object | Hero reward awaiting display |
| `lastClaimDate` | string | ISO date of last daily claim |
| `dailyStreak` | number | Consecutive daily claim count |
| `dailyQuests` | object | `{date, progress{}, claimed{}}` |
| `towerHighestFloor` | number | All-time best floor |
| `towerCurrentFloor` | number | Current week's floor |
| `towerWeekResetDate` | string | Week key for reset detection |
| `towerCoins` | number | Tower shop currency (display only) |
| `playerProfile` | object | Name, avatar, showcase, faction |
| `settings` | object | Music/SFX volumes |
| `hasSeenOnboarding` | bool | First-run gate |
| `hasSeenBattleTutorial` | bool | Battle tutorial gate |
| `practiceBonusClaimed` | bool | One-time practice bonus |

### Battle Engine Features

- Damage formula: `(atk × multiplier) / (1 + def/500) × crit_mult × variance(0.9–1.1)`
- **Passives**: evasion (20% dodge), lifedrain (15% reflect), thornstrike (15% reflect), regen (5% HP/turn), fortify (15% damage reduction), smite (2.0× crit vs 1.75×)
- **Debuffs**: burn (ATK×0.08 DOT/turn), poison (5% maxHP DOT/turn), chill (50% energy reduction), shatter (DEF -25%), weaken (ATK -20%), stun (skip turn)
- **AOE detection**: regex `/all|enemies|every/i` on skill description
- **Trump Card**: hits all enemies + parses heal%/shield/stun from effect string
- **AI**: prioritises one-shot → 60% skill chance → basic attack; targets lowest HP ratio

---

## 3. Architecture Deep-Dive

### Navigation Flow

```
Loading → (hasSeenOnboarding ? Home : Onboarding) → Home
Home → Story → Narration → Battle → Victory → Home
Home → Battle (practice) → Victory → Home
Home → Summon
Home → Collection → HeroDetail
Home → TeamBuild
Home → Profile
Home → Settings
Home → WorldMap
Home → DailyReward
Home → DailyQuests
Home → Tower → Battle (tower mode) → Victory → Tower
```

**Issue**: `Loading → Onboarding` transition is handled inside `LoadingScreen` — it reads `hasSeenOnboarding` and navigates. This is correct but means if state rehydration fails, the user never leaves the loading screen.

### State Flow

```
AsyncStorage (persist)
    ↓ rehydrate
Zustand (in-memory)
    ↓ hook subscription
Screen components (re-render on slice change)
```

**Key concern**: There is NO validation step between AsyncStorage read and Zustand hydration. A tampered value (e.g. `gems: 999999999`) passes straight through.

### Audio Architecture

`AudioManager` is a singleton module (not a React context). It manages:
- Home BGM loop
- Story BGM loop
- Battle BGM (separate track)
- SFX: button, attack, card flip

Volume is read from `settings` in the store on each playback call — this means settings changes take effect immediately without reload. ✅

---

## 4. Critical Issues — Security & Data Integrity

### 4.1 How a Player Can Cheat Today

On **Android (any device with ADB or USB debugging enabled)**:
```bash
adb shell run-as com.trumpcard.game
cat ./files/RCTAsyncLocalStorage_V1/trump-card-game-storage
# → plain JSON, fully readable
# Edit gems/ownedHeroes/completedChapters freely
```

On **iOS (jailbroken) or via iMazing/3uTools**:
- Navigate to app sandbox → Documents/AsyncStorage
- Edit the JSON file directly

Even without device access, if a player runs the app on an emulator:
- Android emulator + Chrome DevTools → inspect AsyncStorage via Flipper
- Expo Go dev build → Flipper sidebar → clear/set any key

**What can be manipulated:**
- Set `gems` to 999,999
- Set `gold` to 999,999
- Set `ownedHeroes` to all 36 hero IDs
- Set `completedChapters` to all 60 stage IDs
- Set `towerHighestFloor` to 200
- Set `pity` to 0 (never need to worry about pity)
- Reset `lastClaimDate` to claim daily rewards every session

### 4.2 No Schema Version

The store has no `schemaVersion` field. When you:
- Add a new state field in the future
- Rename an existing field
- Change the structure of `heroCollection`

...there is no migration path. Zustand `persist` will load whatever is in AsyncStorage and silently miss new fields (they fall back to `initialState`) or crash if you try to access a field that was renamed.

### 4.3 Daily Reward Time Manipulation

```js
// gameStore.js:119
const today = new Date().toISOString().split('T')[0];
```

This uses the **device clock**. A player can:
1. Claim daily reward
2. Set phone clock forward 1 day
3. Claim again
4. Repeat infinitely

This affects `lastClaimDate`, `dailyStreak`, `dailyQuests.date`.

### 4.4 No Rehydration Timeout / Error Recovery

```js
// gameStore.js:394-398
onRehydrateStorage: () => (state, error) => {
  if (error) console.warn('[GameStore] Hydration error:', error);
  if (state) state.checkTowerWeekReset();
},
```

If AsyncStorage **hangs** (can happen on Android low-memory devices), the app waits indefinitely. `BattleScreen.js` handles this partially with a `hydrated` guard + spinner, but `HomeScreen`, `StoryScreen` and others do not — they render with empty/default state silently.

---

## 5. AsyncStorage Safeguards — Detailed Plan

### 5.1 Schema Versioning

Add `schemaVersion: 1` to the initial state. On rehydration, check the version and run migration functions.

```js
// src/store/migrations.js
export const CURRENT_VERSION = 1;

export function migrate(persistedState, version) {
  let state = persistedState;
  
  // v0 → v1: add towerCoins field
  if (version < 1) {
    state = { ...state, towerCoins: state.towerCoins ?? 0 };
  }
  
  // Future: v1 → v2: rename field X → Y
  // if (version < 2) { ... }
  
  return state;
}
```

```js
// In persist config:
{
  name: 'trump-card-game-storage',
  storage: createJSONStorage(() => AsyncStorage),
  version: CURRENT_VERSION,
  migrate: (persistedState, version) => migrate(persistedState, version),
}
```

### 5.2 Integrity Hash

Before writing to AsyncStorage, compute a lightweight hash of critical fields. On read, verify the hash.

```js
// src/utils/saveIntegrity.js
const CHECKSUM_KEY = 'trump-card-game-checksum';
const CRITICAL_FIELDS = ['gems', 'gold', 'ownedHeroes', 'completedChapters', 'pity'];

function computeChecksum(state) {
  const payload = CRITICAL_FIELDS.reduce((obj, key) => {
    obj[key] = state[key];
    return obj;
  }, {});
  // Simple djb2 hash — not cryptographic, but detects naive edits
  const str = JSON.stringify(payload);
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash |= 0; // Convert to 32-bit int
  }
  return (hash >>> 0).toString(36);
}

export async function writeChecksum(state) {
  const cs = computeChecksum(state);
  await AsyncStorage.setItem(CHECKSUM_KEY, cs);
}

export async function verifyChecksum(state) {
  const stored = await AsyncStorage.getItem(CHECKSUM_KEY);
  if (!stored) return true; // First install — no checksum yet
  return stored === computeChecksum(state);
}
```

**Important caveat**: This is a deterrent, not unbreakable security. A determined player can edit both the save and the checksum. The only true security is **server-side validation** (Cloud Save section below).

### 5.3 Value Clamping on Rehydration

After rehydration, clamp all numeric values to legal ranges:

```js
// src/store/sanitizeState.js
import { HEROES } from '../data/heroes';

const VALID_HERO_IDS = new Set(HEROES.map(h => h.id));

export function sanitizeState(raw) {
  if (!raw || typeof raw !== 'object') return null;
  
  return {
    ...raw,
    // Clamp currencies to reasonable max
    gems:  Math.min(Math.max(0, raw.gems  || 0), 9_999_999),
    gold:  Math.min(Math.max(0, raw.gold  || 0), 99_999_999),
    pity:  Math.min(Math.max(0, raw.pity  || 0), 90),
    
    // Filter invalid hero IDs
    ownedHeroes: (raw.ownedHeroes || []).filter(id => VALID_HERO_IDS.has(id)),
    team:        (raw.team        || []).filter(id => VALID_HERO_IDS.has(id)).slice(0, 3),
    
    // Clamp tower
    towerHighestFloor: Math.min(Math.max(0, raw.towerHighestFloor || 0), 200),
    towerCurrentFloor: Math.min(Math.max(1, raw.towerCurrentFloor || 1), 201),
    
    // Sanitize heroCollection: only keep entries for valid owned heroes
    heroCollection: Object.fromEntries(
      Object.entries(raw.heroCollection || {})
        .filter(([id]) => VALID_HERO_IDS.has(id))
        .map(([id, data]) => [id, {
          level:         Math.min(Math.max(1, data.level        || 1), 30),
          copies:        Math.max(0, data.copies       || 1),
          effectiveRank: ['C','B','A','S',null].includes(data.effectiveRank) ? data.effectiveRank : null,
          transcendence: Math.min(Math.max(0, data.transcendence || 0), 4),
        }])
    ),
  };
}
```

### 5.4 Rehydration Timeout Guard

Wrap the rehydration in a timeout so the app never hangs:

```js
// src/utils/hydrateWithTimeout.js
export async function hydrateWithTimeout(timeoutMs = 5000) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      console.warn('[GameStore] Rehydration timed out — starting fresh');
      resolve({ timedOut: true });
    }, timeoutMs);

    useGameStore.persist.rehydrate().then(() => {
      clearTimeout(timer);
      resolve({ timedOut: false });
    }).catch((err) => {
      clearTimeout(timer);
      console.error('[GameStore] Rehydration error:', err);
      resolve({ timedOut: true, error: err });
    });
  });
}
```

### 5.5 Corruption Recovery

If the save is detected as corrupted (hash mismatch or parse error), show the player a choice:

```
┌─────────────────────────────────────────┐
│  ⚠️  SAVE DATA ISSUE                     │
│                                         │
│  Your save file appears to have been    │
│  modified. This may cause issues.       │
│                                         │
│  [ RESTORE CLOUD SAVE ]  [ RESET SAVE ] │
└─────────────────────────────────────────┘
```

---

## 6. Cloud Save System — Detailed Plan

### 6.1 Recommended Stack: Firebase

**Why Firebase:**
- Free tier: 1GB storage, 50k reads/day, 20k writes/day — plenty for a game this size
- Expo-compatible (`@react-native-firebase/app`)
- Anonymous auth out of the box (no email/password required)
- Offline persistence built-in
- Real-time sync if needed

**Alternative: Supabase** (open-source Firebase alternative, REST-based, simpler setup)

### 6.2 Architecture

```
Local (fast, offline-first)              Cloud (backup, cross-device)
AsyncStorage (Zustand persist)  ←sync→   Firestore / Supabase
        ↑                                      ↑
   Immediate writes                    Debounced writes (30s)
   Read on launch                      Read on launch if local missing
```

**Data flow:**
1. All game writes → AsyncStorage immediately (no latency)
2. After each significant event (complete chapter, summon, spend gems), queue a cloud sync
3. Cloud sync is debounced (30 second window) to avoid write spam
4. On app launch, if local save is missing or older than cloud, load from cloud

### 6.3 File Structure

```
src/
  cloud/
    firebaseConfig.js       # Firebase app init
    auth.js                 # Anonymous auth, get/set UID
    cloudSave.js            # uploadSave(), downloadSave(), resolveConflict()
    syncQueue.js            # Debounced sync, retry on failure
  store/
    gameStore.js            # (modified) triggers sync after writes
    migrations.js           # Schema version + migrate()
    sanitizeState.js        # Value clamping
  utils/
    saveIntegrity.js        # Checksum read/write/verify
```

### 6.4 Cloud Save Data Shape

Store minimal data — only what cannot be recomputed:

```js
// Firestore document: users/{uid}/save
{
  schemaVersion: 1,
  updatedAt:     serverTimestamp(),
  deviceId:      '<UUID>',

  // Currencies
  gems:  number,
  gold:  number,
  pity:  number,

  // Progress
  ownedHeroes:       string[],
  heroCollection:    { [heroId]: { level, copies, effectiveRank, transcendence } },
  team:              string[],
  savedTeams:        [3][3],
  activeTeamPreset:  number,
  completedChapters: number[],
  milestonesClaimed: number[],

  // Daily systems
  lastClaimDate: string,
  dailyStreak:   number,
  dailyQuests:   { date, progress, claimed },

  // Tower
  towerHighestFloor:  number,
  towerCurrentFloor:  number,
  towerWeekResetDate: string,
  towerCoins:         number,

  // Profile & Settings
  playerProfile: object,
  settings:      object,
  hasSeenOnboarding:     bool,
  hasSeenBattleTutorial: bool,
}
```

**Excluded from cloud**: `practiceBonusClaimed` (one-time bonus, not worth syncing), `pendingMilestoneReward` (transient UI state).

### 6.5 Conflict Resolution

When a player has saves on two devices:

```
Cloud: { gems: 800, completedChapters: [101,102,103,201] }
Local: { gems: 950, completedChapters: [101,102,103] }
```

**Strategy**: "Most Progress Wins"
- Take the higher `gems`, `gold`, `towerHighestFloor`
- Take the **union** of `ownedHeroes`, `completedChapters`, `milestonesClaimed`
- Take the higher `dailyStreak`
- For `heroCollection`, take max `level` + sum `copies` per hero
- For `team`, `savedTeams`, `playerProfile`: take the one with the more recent `updatedAt`

```js
// src/cloud/cloudSave.js
export function resolveConflict(local, cloud) {
  return {
    ...cloud,                       // cloud as base
    gems:              Math.max(local.gems,  cloud.gems),
    gold:              Math.max(local.gold,  cloud.gold),
    towerHighestFloor: Math.max(local.towerHighestFloor, cloud.towerHighestFloor),
    dailyStreak:       Math.max(local.dailyStreak,       cloud.dailyStreak),
    
    ownedHeroes: [...new Set([...local.ownedHeroes, ...cloud.ownedHeroes])],
    completedChapters: [...new Set([...local.completedChapters, ...cloud.completedChapters])],
    milestonesClaimed: [...new Set([...local.milestonesClaimed, ...cloud.milestonesClaimed])],
    
    heroCollection: mergeHeroCollection(local.heroCollection, cloud.heroCollection),
    
    // Use whichever was updated more recently for profile/team
    team:          local.updatedAt > cloud.updatedAt ? local.team          : cloud.team,
    savedTeams:    local.updatedAt > cloud.updatedAt ? local.savedTeams    : cloud.savedTeams,
    playerProfile: local.updatedAt > cloud.updatedAt ? local.playerProfile : cloud.playerProfile,
  };
}

function mergeHeroCollection(local, cloud) {
  const merged = { ...cloud };
  for (const [id, data] of Object.entries(local)) {
    if (!merged[id]) {
      merged[id] = data;
    } else {
      merged[id] = {
        ...merged[id],
        level:         Math.max(merged[id].level,  data.level),
        copies:        merged[id].copies + data.copies,  // sum copies
        transcendence: Math.max(merged[id].transcendence, data.transcendence),
        effectiveRank: higherRank(merged[id].effectiveRank, data.effectiveRank),
      };
    }
  }
  return merged;
}
```

### 6.6 Sync Trigger Points

The following store actions should trigger a debounced cloud sync:

| Action | Why |
|---|---|
| `completeChapter` | High-value progress event |
| `addHero` (from summon) | Inventory change |
| `spendGems` | Currency change |
| `addGems` | Currency change |
| `levelUpHero` | Progression change |
| `fuseHero` | Progression change |
| `transcendHero` | Progression change |
| `claimDailyReward` | Daily system |
| `claimQuestReward` | Daily system |
| `completeTowerFloor` | Progression change |
| `updateProfile` | Profile change |
| `deployPreset` | Team change |

**NOT** worth syncing immediately: `setSelectedEnemy`, `setStatusMsg`, any mid-battle state.

### 6.7 Implementation Steps

```
Step 1: Install dependencies
  npx expo install @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore

Step 2: Configure Firebase project
  - Create project at console.firebase.google.com
  - Enable Anonymous Authentication
  - Enable Firestore
  - Download google-services.json → android/app/
  - Download GoogleService-Info.plist → ios/

Step 3: Create src/cloud/auth.js
  - signInAnonymously() on first launch
  - store UID in AsyncStorage (separate key)
  - expose getUID()

Step 4: Create src/cloud/cloudSave.js
  - uploadSave(uid, state): setDoc with merge
  - downloadSave(uid): getDoc
  - resolveConflict(local, cloud): merge strategy above

Step 5: Create src/cloud/syncQueue.js
  - debounced sync (30s window, max 5 min delay)
  - retry queue for offline scenarios

Step 6: Modify gameStore.js
  - Add schemaVersion to initial state
  - Add migrate() to persist config
  - Add sanitizeState() to onRehydrateStorage
  - Add syncQueue.trigger() after significant writes

Step 7: Add save integrity
  - writeChecksum() after every persist write
  - verifyChecksum() on rehydration
  - Show corruption dialog if mismatch

Step 8: Add UI in SettingsScreen
  - "Cloud Save: Connected / Not Connected" status
  - "Sync Now" button
  - "Restore from Cloud" button with confirmation
  - "Sign in with Google" (optional — anonymous by default)
```

---

## 7. Battle Engine Analysis

### 7.1 What's Working Well

- **Status effects** are fully implemented: burn/poison DOTs, chill/shatter/weaken stat debuffs, stun skip
- **Passive mechanics**: evasion, lifedrain, thornstrike reflect, regen, fortify, smite — all wired
- **AOE detection** via regex on skill description — works but is fragile (see 7.2)
- **Trump Card** parses heal%/shield/stun from the `effect` string — elegant but fragile (see 7.2)
- **Thornstrike reflect** is correctly implemented in the enemy AI path too (not just player path)
- **Stun** correctly applies to both player heroes and enemies, energy tracking is consistent
- **Energy reset** on trump card use is consistent (`newEnergy = 0`)
- **Shield blocks AOE** correctly — each shield charge absorbs one hit

### 7.2 Issues Found

**Issue 1: AOE regex is fragile**
```js
const isAoe = /all|enemies|every/i.test(skill.description || '');
```
The word "all" appears in skill descriptions like "Calls a devastating force to crush all courage" (single target intended). This could incorrectly make a skill AOE. Solution: add an explicit `isAoe: true/false` boolean to skill objects in heroes.js.

**Issue 2: Trump Card effect string parsing is fragile**
```js
const eff = (tc.effect || '').toLowerCase();
if (eff.includes('heal')) { ... }
if (eff.includes('shield')) { ... }
if (eff.includes('stun')) { ... }
```
Hero trump card effects are parsed by scanning English text. If an effect says "Reduces all enemy ATK — no healing intended" this won't accidentally trigger, but it's brittle. A structured `trumpCard.mechanics` array would be more robust.

**Issue 3: Enemy AI energy isn't shown in UI**
Enemy energy is tracked internally (`ENEMY_ENERGY_TURN = 25`, `ENEMY_SKILL_COSTS = [30, 50]`) but never shown to the player. This means players can't predict when enemies will use skills. This is actually fine for a mystery/tension mechanic, but the design intent should be documented.

**Issue 4: No battle turn limit**
A battle where enemies can't kill the player (very high DEF + regen) and the player can't kill enemies can run indefinitely. This should have a turn limit (e.g. 50 turns → auto-lose) to prevent stalling.

**Issue 5: AI `aiRunning` ref is never reset on component mount**
```js
const aiRunning = useRef(false);
```
If the battle component mounts with `isEnemyTurn = false` (it does) this is fine. But if `retryBattle()` is called while `aiRunning.current = true` (e.g. mid-AI-turn), the AI is reset: `aiRunning.current = false` is in `retryBattle()`. ✅ Actually this is handled.

**Issue 6: `checkEnd` has stale closure risk**
`checkEnd` is called inside `useEffect` for the enemy AI turn, but the `useEffect` only depends on `[isEnemyTurn, battleResult]`. Inside that effect, `checkEnd` is called with the latest `np`/`ne` values passed as arguments, so the closure issue doesn't apply. ✅ Correct.

**Issue 7: `executeAction` has a double `setIsAnimating(false)` on skill energy check**
```js
if (newEnergy < cost) {
  setStatusMsg('Not enough energy!');
  setIsAnimating(false);  // ← sets false
  return;
}
// ... later ...
setIsAnimating(true);  // ← already set true above
```
Wait — `setIsAnimating(true)` is called BEFORE the energy check. So the sequence is:
```
setIsAnimating(true)
→ energy check fails
→ setIsAnimating(false) ← correct, restores state
→ return
```
This is correct. ✅

### 7.3 Enhancement Opportunities

1. Add `isAoe: boolean` to skill data instead of regex detection
2. Add `mechanics: string[]` to trump cards instead of parsing effect strings
3. Add a 50-turn battle limit → auto-defeat
4. Add an optional "Fast Battle" mode (skip animations, auto-resolve)
5. Add battle log (last 5 actions) above the action bar

---

## 8. State Management Audit

### 8.1 Race Conditions

**`completeChapter` is not atomic:**
```js
// gameStore.js:141-193
completeChapter: (chapterId, rewardGems, rewardHeroId) => {
  // ... set completedChapters, gems, gold
  // ... then separately call addHero
  // ... then check milestone
}
```
If the user closes the app between the first `set({...})` and `get().addHero(pick.id)`, the milestone is recorded but the hero isn't added. The `try/catch` around the hero block means the milestone *is* saved but no hero was granted. This is a rare edge case but could produce silent data corruption.

**Fix**: Move all changes into a single `set()` call.

**`spendGems` is not atomic with the action it enables:**
```js
// SummonScreen: 
if (!spendGems(cost)) return;
// ... gems are now deducted
// ... but heroes haven't been added yet
heroes.forEach(h => addHero(h.id));
```
If the app crashes between `spendGems` and `addHero`, gems are lost with no heroes gained. With cloud save, this is recoverable (the cloud snapshot before the crash would have the gems). Without cloud save, it's a permanent loss.

**Fix**: Batch the gem spend and hero grant into a single store action: `performSummon(count)`.

### 8.2 `savedTeams` / `deployPreset` Sync Logic

```js
saveTeamPreset: (idx, heroIds) => {
  const valid = heroIds.filter(id => id != null);
  const teamSync = state.activeTeamPreset === idx && valid.length > 0
    ? { team: valid }
    : {};
  set({ savedTeams: next, ...teamSync });
},
```

This auto-syncs the live `team` when editing the deployed preset. This is correct. But `TeamBuildScreen` detects "modified" vs "active" by comparing sorted preset IDs against live team IDs. This comparison is correct.

One gap: if the player deploys preset I, then goes to TeamBuild and edits preset II, the `activeTeamPreset` stays as I (preset I is still deployed). When they switch back to preset I tab, it correctly shows ACTIVE. ✅

### 8.3 `getEffectiveRank` vs `heroCollection.effectiveRank`

```js
getEffectiveRank: (heroId) => {
  const data = get().heroCollection[heroId];
  if (!data?.effectiveRank) {
    const hero = HEROES.find(h => h.id === heroId);
    return hero?.rank || 'C';
  }
  return data.effectiveRank;
},
```

This falls back to the hero's base rank if `effectiveRank` is null. The initial state sets `effectiveRank: null` for all heroes. So before any fusion, `getEffectiveRank('hero_001')` returns `'S'` (the base rank). After a C→B fusion, it returns `'B'`. ✅

### 8.4 Missing Store Actions

| Action | Where Needed | Status |
|---|---|---|
| `purchaseGems(amount, cost)` | Shop screen | ❌ Missing |
| `purchaseGold(amount, gemCost)` | Shop screen | ❌ Missing |
| `earnAchievement(achievementId)` | Achievement system | ❌ Missing |
| `redeemCode(code)` | Promo codes | ❌ Missing |
| `resetProgress()` | Settings → Reset save | ❌ Missing (needed for corrupted saves) |

---

## 9. Missing Features & Gaps

### 9.1 Shop / Monetisation

The `CurrencyChip` component in `HomeScreen` has a `+` button that renders but has no `onPress`. There is no shop screen. The `SummonScreen` shows an "insufficient gems" state but has no way to get more gems besides:
- Completing story chapters (75% of listed reward)
- Daily rewards
- Daily quests

**Missing**: A shop screen where players can buy gem bundles (IAP) or watch ads for free gems.

### 9.2 Achievement System

No achievements/trophies at all. This is a major engagement driver for mobile games.

**Suggested achievements**: "First Blood" (complete first battle), "Collector" (own 10 heroes), "S-Hunter" (pull first S-rank), "Tower Climber" (reach floor 50), "Completionist" (complete all 60 stages).

### 9.3 Push Notifications

No push notifications. Players who leave the game won't be reminded about daily rewards.

**Needed**: `expo-notifications` for:
- "Your daily reward is ready!" (24h after last claim)
- "New week — Tower resets today!"
- "You have unclaimed quest rewards!"

### 9.4 Hero Equipment/Gear System

Heroes have level, copies, fusion rank, transcendence — but no equipment. An equipment system (weapons, accessories) would extend the progression system significantly.

### 9.5 Shop Currency (Tower Coins)

`towerCoins` is tracked and displayed in `TowerScreen` but there is no shop to spend them. The Tower screen mentions "TOWER SHOP" but it's not implemented.

### 9.6 Notification Inbox / Mailbox

Commented-out mail icon in `HomeScreen`:
```js
// <TouchableOpacity style={styles.topIconBtn}>
//   <Ionicons name="mail-outline" size={17} color="rgba(255,255,255,0.8)" />
// </TouchableOpacity>
```
System messages, gift codes, and reward deliveries need a mailbox screen.

### 9.7 Battle Practice Team Selection

Practice battle (`Battle: { practiceMode: true }`) uses whatever `team` is currently deployed. There's no way to quickly try a different team for practice without going to TeamBuild first.

### 9.8 Hero Comparison

No side-by-side hero comparison screen. Players can't easily evaluate whether to level hero A or hero B.

### 9.9 Offline Indication

No network status indicator. When cloud save is implemented, players need to know if their save is synced or pending.

### 9.10 News Ticker is Static

```js
// HomeScreen.js:298-301
v1.0 Launch — Welcome to Aetheria: Legends Unbound! Complete story chapters to unlock heroes and earn rare rewards.
```

This is hardcoded. It should be fetched from a remote config (Firebase Remote Config or a simple JSON endpoint) so it can be updated without an app release.

---

## 10. Performance Issues

### 10.1 `HEROES.find()` on Every Render

Multiple screens call `HEROES.find(h => h.id === id)` inside components without memoization:
- `BattleScreen.buildPlayers()` — called on mount and retry (fine, it's inside useCallback)
- `HomeScreen.teamHeroes` — memoized ✅
- `CollectionScreen` — uses FlatList with memoized renderItem ✅
- `TeamBuildScreen.slotHeroes` — memoized ✅

However, `getHeroById` in `heroes.js` is a linear scan. With 36 heroes this is negligible, but worth noting for future scaling.

**Fix**: Export a `HEROES_MAP = new Map(HEROES.map(h => [h.id, h]))` for O(1) lookups.

### 10.2 Animated Values Created in Module Scope

```js
// SummonScreen.js:73-80
const STARS = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  xPct: Math.random(),
  ...
}));
```

`Math.random()` calls at module load time are fine. But the `starYAnims` in the component creates 14 Animated.Value objects. These are in `useRef` which is correct.

The bigger issue: **`OrnateWishBtn`** creates 5 particle `Animated.Value` pairs (10 total animated values) per button, and there are 2 buttons. That's 20 animated values running looped animations simultaneously, plus the `glowAnim` per button. On low-end Android this could cause jank.

**Recommended**: Use `react-native-reanimated` (already installed, v4.3.1) for these particle animations. Reanimated runs on the UI thread, eliminating JS bridge overhead.

### 10.3 `BattleScreen` Re-renders

The custom `_cardEqual` memo function is well-thought-out — it prevents re-renders when only energy/turn changes. However, `executeAction` captures many state variables in its `useCallback` dependency array, which means every time any of those changes, a new function reference is created. This triggers `PillBtn` re-renders (PillBtn uses `React.memo` but receives `onPress` which changes).

**Fix**: Move `executeAction` to a reducer pattern or use `useRef` for stable callback.

### 10.4 Large Images

Hero images are `.webp` format (efficient ✅). Enemy images in `ENEMY_IMAGES` map are also `.webp`. Background images should be checked for size — large background images loaded on HomeScreen can cause memory pressure on low-RAM devices.

---

## 11. Bug Report

### BUG-001: `practiceBonusClaimed` is Never Reset

```js
// gameStore.js:226
claimPracticeBonus: () => set({ practiceBonusClaimed: true }),
```

Once claimed, it's never reset. This is intentional (one-time bonus). But it's persisted to AsyncStorage, so even a force-close and reopen won't give it again. ✅ Working as intended.

### BUG-002: `savedTeams` Can Contain Hero IDs Not in `ownedHeroes`

If a player owns hero_001, adds it to preset I, then their data is manipulated to remove hero_001 from `ownedHeroes`, the saved preset still references hero_001. In `TeamBuildScreen`:
```js
const slotHeroes = useMemo(
  () => preset.map(id => (id ? HEROES.find(h => h.id === id) ?? null : null)),
  [preset],
);
```
`HEROES.find` would return the hero object (it's in the static HEROES array). The hero would appear in the slot despite not being owned. In battle, `buildPlayers()` uses `team` (which is derived from deployed presets), and HEROES.find would also return it.

**Severity**: Low in normal use. Higher if manipulation occurs.
**Fix**: Add ownership check in `slotHeroes` memo: `HEROES.find(h => h.id === id && ownedSet.has(id))`.

### BUG-003: `VictoryScreen` Gold Reward Computed Twice

```js
// VictoryScreen.js:59-61
const part       = stageId ? stageId % 10 : 0;
const goldReward = towerMode
  ? (towerRewards?.gold || 0)
  : stageGoldReward(part);
```

`stageGoldReward(part)` is also called in `gameStore.completeChapter()` and the result is already applied to the store. `VictoryScreen` is only *displaying* the reward, not re-applying it. ✅ No double-grant. The display is correct.

### BUG-004: Stale `chapterId` in `BattleScreen.showResult`

```js
const showResult = useCallback((r, meta = {}) => {
  setBattleResult(r);
  resultTimerRef.current = setTimeout(() => {
    navigation.replace('Victory', {
      stageId: chapterId,
      ...
    });
  }, 750);
}, [navigation, chapterId, chapterRewards, ...]);
```

`chapterId` is from `route.params` which never changes during a battle. ✅ No staleness issue.

### BUG-005: Energy Bar Shows `energy/100` but Can Be 100 Mid-Animation

When the player uses a trump card, `newEnergy = 0`, but `setEnergy(0)` is batched with other state updates. The energy bar renders `0/100` correctly after the state update. ✅

### BUG-006: `DailyQuestScreen` — Quest Progress Not Reset When Date Changes

```js
getDailyQuestProgress: () => {
  const today = new Date().toISOString().split('T')[0];
  const q     = get().dailyQuests;
  if (q.date !== today) return { progress: {}, claimed: {} };
  return { progress: q.progress, claimed: q.claimed };
},
```

This returns empty progress if the date changed, but `dailyQuests.date` in the store still holds yesterday's date. The store isn't updated until `trackQuestProgress` is called with today's date. So between midnight and the first quest action, `dailyQuests.date !== today` but `dailyQuests.progress` still holds yesterday's data in storage. The UI shows `{}` progress (correct display) but the stored data is stale.

**Impact**: Low — cosmetic only. Progress is displayed correctly.

---

## 12. Implementation Roadmap

### Phase 1: Data Safety (Do First — Before Anything Else)

**Estimated effort: 2–3 days**

```
[ ] 1.1 Add schemaVersion to initial state
[ ] 1.2 Create src/store/migrations.js with migrate() function
[ ] 1.3 Create src/store/sanitizeState.js with value clamping
[ ] 1.4 Wire migrate() into Zustand persist config
[ ] 1.5 Wire sanitizeState() into onRehydrateStorage callback
[ ] 1.6 Create src/utils/saveIntegrity.js (checksum write/verify)
[ ] 1.7 Add rehydration timeout (5s) with graceful error UI
[ ] 1.8 Add corruption dialog modal (show on checksum mismatch)
[ ] 1.9 Fix BUG-002 (ownership check in slotHeroes)
[ ] 1.10 Batch completeChapter into single set() call
[ ] 1.11 Create performSummon store action (atomic gems + heroes)
```

### Phase 2: Cloud Save

**Estimated effort: 3–5 days**

```
[ ] 2.1 Set up Firebase project (or Supabase)
[ ] 2.2 Create src/cloud/auth.js (anonymous sign-in)
[ ] 2.3 Create src/cloud/cloudSave.js (upload/download/resolve)
[ ] 2.4 Create src/cloud/syncQueue.js (debounced sync, retry)
[ ] 2.5 Integrate sync triggers in gameStore.js actions
[ ] 2.6 Add cloud save UI to SettingsScreen
[ ] 2.7 On launch: local vs cloud timestamp comparison
[ ] 2.8 Conflict resolution UI (if needed)
[ ] 2.9 "Restore from Cloud" button with confirmation dialog
```

### Phase 3: Battle Engine Hardening

**Estimated effort: 1 day**

```
[ ] 3.1 Add isAoe: boolean to skill objects in heroes.js
[ ] 3.2 Replace AOE regex with isAoe flag in BattleScreen
[ ] 3.3 Add mechanics: string[] to trumpCard objects
[ ] 3.4 Replace trump card effect string parsing with mechanics array
[ ] 3.5 Add 50-turn battle limit → auto-defeat
```

### Phase 4: Missing Features

**Priority order:**

```
[ ] 4.1 Tower Shop (spend towerCoins on items/heroes)
[ ] 4.2 Shop Screen (gem packages, gold packages)
[ ] 4.3 Achievement System (15-20 achievements)
[ ] 4.4 Push Notifications (expo-notifications)
[ ] 4.5 Dynamic News Ticker (Firebase Remote Config)
[ ] 4.6 Hero Comparison screen
[ ] 4.7 Mailbox / Inbox screen
[ ] 4.8 Equipment System
[ ] 4.9 PvP / Arena mode
[ ] 4.10 Guild System
```

---

## 13. Priority Matrix

```
         HIGH IMPACT          |        LOW IMPACT
         ─────────────────────┼────────────────────────────
HIGH  │  Cloud Save           │  Equipment System
EFFORT│  AsyncStorage Guards  │  PvP Arena
      │  Achievement System   │  Guild System
      │                       │
      ├───────────────────────┼────────────────────────────
LOW   │  Schema Version       │  Dynamic News Ticker
EFFORT│  Value Clamping       │  Hero Comparison
      │  Turn Limit           │  Mailbox
      │  Push Notifications   │  Battle Log
      │  Tower Shop           │
```

**Start with the bottom-left quadrant (low effort, high impact):**

1. Schema versioning + value clamping (1 day)
2. Turn limit in battle (30 min)
3. Tower Shop UI (1 day)
4. Push Notifications (1 day)

**Then tackle top-left (high effort, high impact):**

5. Cloud Save with Firebase (3-5 days)
6. AsyncStorage integrity layer (2 days)
7. Achievement System (2 days)

---

## Appendix A: Files That Need Changes

| File | Change |
|---|---|
| `src/store/gameStore.js` | Add schemaVersion, migrations, sanitize, sync triggers, performSummon action |
| `src/store/migrations.js` | NEW — version + migration functions |
| `src/store/sanitizeState.js` | NEW — value clamping |
| `src/utils/saveIntegrity.js` | NEW — checksum |
| `src/cloud/auth.js` | NEW — Firebase anonymous auth |
| `src/cloud/cloudSave.js` | NEW — upload/download/resolve |
| `src/cloud/syncQueue.js` | NEW — debounced sync |
| `src/data/heroes.js` | Add `isAoe` to skills, `mechanics` to trumpCards |
| `src/screens/BattleScreen.js` | Use `isAoe` flag, add turn limit |
| `src/screens/SettingsScreen.js` | Add cloud save UI section |
| `src/screens/TeamBuildScreen.js` | Fix BUG-002 ownership check |

---

## Appendix B: Environment Setup for Cloud Save

```bash
# Install Firebase
npx expo install @react-native-firebase/app
npx expo install @react-native-firebase/auth
npx expo install @react-native-firebase/firestore

# OR Supabase (simpler, no native module)
npx expo install @supabase/supabase-js
npx expo install react-native-url-polyfill
```

**If using Expo Go**: Supabase is the better choice because it's pure JS (no native build required). Firebase requires a development build (`eas build`).

**If using EAS Build**: Firebase is recommended for its offline persistence and mature RN SDK.

---

*Document auto-generated from full codebase audit on 2026-06-04.*
