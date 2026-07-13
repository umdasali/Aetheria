@AGENTS.md

---

# Aetheria: Legends Unbound — Full Codebase Reference

Landscape-only React Native RPG built with Expo 56. Card-battling with story progression, hero collection (90 heroes, 6 factions incl. KHEMARA, 6 ranks incl. SOVEREIGN), gacha summoning, endless tower, daily quests, limited-time events, real-money IAP via RevenueCat, and turn-based battle with status effects.

---

## Tech Stack

| Layer | Library | Version |
|---|---|---|
| UI | React Native | 0.85.3 |
| Build | Expo | ~56.0.11 |
| State | Zustand + AsyncStorage | 5.0.13 |
| Navigation | @react-navigation/native-stack | 7.x |
| Navigation | @react-navigation/bottom-tabs | 7.x |
| Gradients | expo-linear-gradient | 56.0.4 |
| Audio | expo-audio | ~56.0.12 |
| Video | expo-video | ~56.1.3 |
| Icons | @expo/vector-icons (Ionicons) | 15.1.1 |
| Gesture | react-native-gesture-handler | 2.31.2 |
| Animation | react-native-reanimated | 4.3.1 |
| Persistence | @react-native-async-storage/async-storage | 2.2.0 |
| Screenshot | react-native-view-shot | 5.1.0 |
| File access | expo-file-system | ~56.0.8 |
| Sharing | expo-sharing | ~56.0.17 |
| IAP | react-native-purchases (RevenueCat) | see package.json |
| Cloud | @supabase/supabase-js | see package.json |
| Layout | react-native-safe-area-context, react-native-screens | see package.json |
| Misc Expo | expo-splash-screen, expo-navigation-bar, expo-blur, expo-clipboard, expo-application, expo-asset, expo-build-properties, expo-constants, expo-font, expo-gl, expo-media-library, expo-status-bar | see package.json |
| Rendering extras | react-native-svg, three, react-native-worklets, react-native-web | see package.json |

> Always read https://docs.expo.dev/versions/v56.0.0/ before writing Expo-specific code.
> This table lists the notable dependencies, not the exhaustive `package.json`. Check `package.json` directly for exact pinned versions.

---

## File Map

```
App.js                         Navigation root (29 screens) + hardware back handler
app.json                       Expo config (landscape, dark, bundle ID com.trumpcard.game)
index.js                       Entry point
src/
  theme/
    colors.js                  C.* tokens + RANK/RANK_COLORS badge colors + FACTION_MATRIX/FACTION_PARTICLES — single source of truth
    scale.js                   rs()/rf() responsive-scale helpers used across screens/components
  constants/
    appInfo.js                 App version/build metadata (used by ForceUpdate/version-check flow)
  data/
    heroes.js                  90 hero definitions + FACTIONS map + helpers
    enemies.js                 Enemy groups for story stages + ENEMY_IMAGES map
    story.js                   30 chapters × 3 parts = 90 stages + STAGE_ORDER + CHAPTER_DEFS
    events.js                  BANNER_POOL (limited-time gacha events) + STANDARD_BANNER + date helpers
    shopPacks.js               GEM_PACKS/BUNDLES (real-money IAP) + HERO_PACKS (gem-priced exclusives)
    achievements.js            ACHIEVEMENT_DEFS — tracked progress + claim rewards
    ascensionItems.js          ASCENSION_ITEMS — hero ascension materials by rank
    avatars.js                 Selectable profile avatar images
    resourceDungeons.js        Ascension-material farming dungeons + MATERIAL_EXCHANGE_RECIPES
    backgrounds.js             WEATHER_BACKGROUNDS + BACKGROUNDS arrays
    dailyQuests.js             QUEST_DEFS (5 quests) + TOTAL_DAILY_GEMS/GOLD
    dailyRewards.js            DAILY_REWARDS (7-day login cycle)
    towerData.js               Tower constants + getTowerEnemyGroup + getTowerFloorReward
    bestiary.js                Codex "bestiary" entries + getNewlyIntroducedImageKeys
    chronicle.js               Codex "chronicle" (lore) entries
    collectionVideos.js        Per-hero showcase video sources for CollectionScreen/CodexScreen
    worldMapVideos.js          Per-faction ambient video sources for WorldMapScreen
  store/
    gameStore.js               Zustand store — full game state + all actions
    migrations.js              Versioned persisted-state migrations (CURRENT_VERSION = 6)
    sanitizeState.js           Defensive fixups applied to hydrated/restored state
  shop/
    purchaseHandler.js         Single seam between Shop UI and payment logic (gems vs IAP)
  cloud/
    supabaseConfig.js          Supabase client init
    auth.js                    Supabase auth (sign in/out, account deletion)
    cloudSave.js               Cloud save upload/restore + resolveConflict (LWW + additive merges)
    syncQueue.js                Debounced/queued cloud sync trigger
    leaderboardService.js      Server-authoritative score submission (submit_score RPC)
    nameService.js             Display-name reservation/lookup
    uidService.js               Player UID generation/lookup
    versionCheck.js            checkForceUpdate() — store-version gate driving the ForceUpdate screen
  utils/
    battleEngine.js            Damage formula, status effects, Trump Card logic, AI decisions
    AudioManager.js            BGM/SFX management via expo-audio
    playerLevel.js             XP system + level calculation
    RevenueCatManager.js       RevenueCat SDK wrapper — configure/purchase/restore/transaction listener
    profanityFilter.js         Display-name/signature filter (leetspeak-normalised blocklist)
  screens/
    LoadingScreen.js           Splash → asset preload → animated progress bar → ForceUpdate/Onboarding/Home
    ForceUpdateScreen.js       Blocking screen shown when checkForceUpdate() requires a store update
    OnboardingScreen.js        4-step tutorial (one-time, skip flag stored)
    HomeScreen.js              Main hub (sidebar, featured hero, quick stats, daily rewards)
    StoryScreen.js             30-chapter × 3-part stage selector
    NarrationScreen.js         Pre-battle typewriter dialogue with boss preview
    BattleScreen.js            Turn-based battle (energy, skills, Trump Card, status effects)
    VictoryScreen.js           Post-win rewards (gems, gold, hero drops, XP, level-up)
    DailyRewardScreen.js       7-day login streak reward cycle
    DailyQuestScreen.js        5 daily quests with progress bars + claim
    CollectionScreen.js        Hero gallery (faction filter, sort, 5-col grid)
    TeamBuildScreen.js         3-hero team builder with 3 saved presets
    SummonScreen.js            Gacha (×1 / ×10, pity, card flip reveal)
    HeroDetailScreen.js        Hero profile: level up, fusion (rank up), transcendence, share
    ProfileScreen.js           Player profile: name, avatar, showcase, level/XP, stats
    EditProfileScreen.js       Edit display name/signature (profanity-filtered)
    SettingsScreen.js          Music/SFX volume sliders + mute toggles
    WorldMapScreen.js          Faction world map: lore, rulers, heroes by faction
    TowerScreen.js             Endless Tower (300 floors, boss every 10, weekly reset)
    TowerShopScreen.js         Tower coin shop — buy ascension items and bundles (accessible from Tower)
    ResourceDungeonScreen.js   Ascension-material farming dungeons (daily attempts + refills)
    ShopScreen.js              Real-money IAP storefront (gems/bundles) + gem-priced exclusive packs
    EventScreen.js             Limited-time banner events (active/upcoming/ended)
    PullHistoryScreen.js       Gacha pull log (rank/pity/featured filters)
    AchievementScreen.js       Achievement list with progress + claim
    LeaderboardScreen.js       Tower/story/dungeon leaderboards (server-authoritative)
    CloudAuthScreen.js         Supabase authentication — cloud save sync (accessible from Settings)
    CodexScreen.js             Bestiary/chronicle codex index (unlocked entries)
    CodexDetailScreen.js       Single codex entry detail (bestiary or chronicle)
  components/
    HeroCard.js                Reusable hero card (portrait, stats bar, rank badge, sovereign shimmer tier)
    WeatherEffect.js           Animated rain/wind/fog/thunder overlay
    FactionParticles.js        Faction-specific matrix-style falling-character rain overlay
    DriftingClouds.js          Drifting cloud layer used by WeatherEffect's fog mode
    EnemyParticles.js          Ambient particle overlay for enemy-side battle cards
    ErrorBoundary.js           React error boundary — wraps entire app, includes "Try Again" reset
    ui/                        Shared HUD-styled primitives (GlassPanel, GlowButton, HudFrame, HudScreen, HudTitle, CornerBrackets, ForgeViz, NeuralNetworkViz, InfiniteCarousel, OrnateCard) + index.js barrel
```

---

## Navigation

Stack navigator, **all headers hidden**, fade animation between screens.

App.js registers 29 `<Stack.Screen>` entries. Loading branches to ForceUpdate when a store update is required:

```
Loading ──► ForceUpdate (blocking, if checkForceUpdate() requires an update)
Loading ──► Onboarding (first run) ──► Home
Loading ──────────────────────────────► Home (returning)

Home ──► Story ──► Narration ──► Battle ──► Victory ──► Home
     ├──► Collection ──► HeroDetail ──► Collection
     ├──► Codex ──► CodexDetail ──► Codex
     ├──► TeamBuild
     ├──► Summon ──► PullHistory
     ├──► DailyReward
     ├──► DailyQuests
     ├──► Profile ──► EditProfile
     ├──► Settings ──► CloudAuth
     ├──► WorldMap
     ├──► Events ──► Summon
     ├──► Shop
     ├──► Achievements
     ├──► Leaderboard
     ├──► ResourceDungeon ──► Battle ──► Victory ──► ResourceDungeon
     └──► Tower ──► Battle ──► Victory ──► Tower
          └──► TowerShop
```

**Passing data via route.params:**

| Route | Params |
|---|---|
| Loading → ForceUpdate | `{ storeUrl, message }` |
| Story → Narration | `{ stageId, chapterId }` |
| Narration → Battle | `{ stageEnemies, stageId, chapterId, stageRewards: {gems, gold, heroId} }` |
| Tower → Battle | `{ stageEnemies, floor, isBoss, rewards }` |
| Collection → HeroDetail | `{ heroId }` |
| Codex → CodexDetail | `{ type: 'bestiary' | 'chronicle', key: imageKey | chapterId }` |
| Battle win → Victory | `{ rewards, stageId?, floor? }` |
| Victory / Battle loss → Home/Tower | `navigation.navigate(...)` |

---

## State (gameStore.js)

Persisted to AsyncStorage under key `trump-card-game-storage`. `CURRENT_VERSION = 6` (see `migrations.js`). Every mutation is stamped with `updatedAt: Date.now()` (wrapped `set()`) so cloud sync has a real last-writer-wins signal — `resetStore` deliberately bypasses this via `rawSet`.

```js
{
  // Meta / cloud
  schemaVersion: number,          // = CURRENT_VERSION
  updatedAt: number,               // ms timestamp of last local mutation (cloud LWW signal)
  cloudAccountEmail: string | null,
  localUserId: string | null,      // Supabase user id owning this local save; null = unclaimed
  playerUid: string | null,        // persistent display UID (format XXX-XXX-XXX), generated once
  playerUidSecret: string | null,  // opaque ownership proof paired with playerUid; never shown to player
  playerUidClaimed: boolean,       // true once playerUid confirmed globally-unique server-side
  serverClaimedName: string | null,
  pendingNameClaim: string | null, // name awaiting server (re)registration after a network error

  // Currencies
  gems: number,
  gold: number,
  pity: number,           // standard-banner gacha pity counter, resets to 0 at 90 pulls

  // Heroes
  ownedHeroes: string[],  // hero ID strings
  team: string[],         // up to 3 hero IDs (active deploy)
  heroCollection: {       // { [heroId]: { level, copies, effectiveRank, transcendence, ascension } }
    [heroId]: { level: number, copies: number, effectiveRank: string | null, transcendence: number, ascension: number }
  },

  // Progress
  completedChapters: number[],   // stageIds (e.g. 101, 102, 103, 201, ...)
  milestonesClaimed: number[],   // every 5 chapters
  pendingMilestoneRewards: Array<{ hero, milestone, ascensionDrop }>,  // queue, not a single slot

  // Teams
  savedTeams: [string[], string[], string[]],  // 3 presets
  activeTeamPreset: number,                    // -1 if custom

  // Daily
  dailyStreak: number,
  lastClaimDate: string | null,     // local date string (YYYY-MM-DD)
  dailyQuests: { date: string, progress: {}, claimed: {} },

  // Tower
  towerHighestFloor: number,
  towerWeeklyBest: number,     // highest floor reached in the current week (resets weekly)
  towerCurrentFloor: number,
  towerWeekResetDate: string,
  towerCoins: number,

  // Resource dungeons
  dungeonAttemptsUsed: number,   // runs used today
  dungeonResetDate: string,      // local date the attempt count belongs to
  ascensionInventory: { aetheria_core: number, feather_of_hope: number, lost_butterfly: number, broken_wing: number },

  // Shop / IAP
  shopPurchases: {},                    // { [packId]: count } — repeatable packs increment
  processedIapTransactionIds: string[], // RevenueCat transaction IDs already granted (dedupe)

  // Profile
  playerProfile: {
    name: string,
    signature: string,
    avatarId: string,       // renamed from avatarHeroId in migration v3→v4
    showcaseIds: string[],   // 3 slots
    favoriteFaction: string | null,
  },

  // Settings
  settings: { musicVolume: number, sfxVolume: number, musicMute: boolean, sfxMute: boolean },

  // Flags
  hasSeenOnboarding: boolean,
  hasSeenBattleTutorial: boolean,
  practiceBonusClaimed: boolean,

  lastKnownTimestamp: number,

  // Pull history (Feature)
  pullHistory: Array<{...}>,   // newest first, capped at 300 entries

  // Achievements (Feature)
  achievements: { [achievementId]: { progress: number, claimed: boolean } },
  pendingAchievementUnlocks: string[],   // achievement IDs queued for toast display

  // Codex (Feature) — bestiary/chronicle unlock state is derived on demand from
  // completedChapters/ascensionInventory, not persisted; this queue only tracks
  // just-unlocked entries still awaiting a "New Codex Entry" toast.
  pendingCodexUnlocks: Array<{ type: 'bestiary' | 'chronicle' | 'relic', key }>,

  // Event banners (Feature)
  eventPity: { [eventId]: number },
  eventGuarantee: { [eventId]: boolean },   // true = next S on that banner is guaranteed rate-up
}
```

**Actions** (selected — see `src/store/gameStore.js` for the full list, ~50 actions total):

| Method | Signature | Notes |
|---|---|---|
| `resetStore` | `async ()` | Wipes AsyncStorage + resets to `INITIAL_STATE` — used on account switch |
| `addHero` | `(heroId)` | Adds to ownedHeroes or increments copies |
| `setTeam` | `(heroIds[])` | Replace entire active team |
| `addToTeam` | `(heroId)` | Toggle hero on/off team (max 3) |
| `spendGems` | `(amount) → boolean` | Returns false if insufficient |
| `addGems` | `(amount)` | |
| `addGold` | `(amount)` | |
| `spendGold` | `(amount) → boolean` | Returns false if insufficient |
| `claimDailyReward` | `() → { reward, streak, dayIdx }` | |
| `completeChapter` | `(chapterId, rewardGems, rewardHeroId)` | `chapterId` param is actually a **stage id** — marks complete + grants rewards + checks milestones |
| `isStageCompleted` | `(stageId) → boolean` | Direct membership check on `completedChapters` |
| `isChapterCompleted` | `(chapterId) → boolean` | Chapter number 1–30 — true only if all 3 parts are completed |
| `getHeroData` | `(heroId) → {level, copies, effectiveRank, transcendence, ascension}` | |
| `levelUpHero` | `(heroId)` | Costs gold, respects max level |
| `setPity` | `(n)` | Direct pity override (debug/testing) |
| `saveTeamPreset` | `(idx, heroIds)` | |
| `deployPreset` | `(idx)` | Sets team from savedTeams[idx] |
| `updateProfile` | `(patch)` | Partial update of playerProfile |
| `updateSettings` | `(patch)` | Partial update of settings |
| `clearMilestoneReward` | `()` | Pops the front of `pendingMilestoneRewards` |
| `completeOnboarding` | `()` | Sets `hasSeenOnboarding: true` |
| `seenBattleTutorial` | `()` | Sets `hasSeenBattleTutorial: true` |
| `claimPracticeBonus` | `()` | Sets `practiceBonusClaimed: true` |
| `claimPlayerUid` | `async ()` | Generates + registers a global `playerUid` via Supabase |
| `retryPendingNameClaim` | `async ()` | Re-attempts a display-name registration that previously failed |
| `trackQuestProgress` | `(questId, amount = 1)` | Increments today's quest progress |
| `claimQuestReward` | `(questId, rewardGems, rewardGold)` | |
| `getDailyQuestProgress` | `()` | Returns today's quest progress snapshot |
| `completeTowerFloor` | `(floor, rewards)` | Updates towerHighestFloor/towerWeeklyBest if new record |
| `checkTowerWeekReset` | `()` | Resets weekly tower state if the week key has changed |
| `checkDungeonReset` | `()` | Resets daily dungeon attempts if the local date has changed |
| `useDungeonAttempt` | `()` | Consumes one daily resource-dungeon attempt |
| `refillDungeonAttempts` | `()` | Gem-purchased refill of dungeon attempts |
| `completeDungeon` | `(rewards)` | Grants resource-dungeon rewards (ascension materials) |
| `fuseHero` | `(heroId) → { ok, reason? , newRank? }` | Rank up (C→B→A→S), S is the fusion cap — SOVEREIGN is not obtainable via fusion, requires `FUSION_COPIES` (2) copies + gold |
| `transcendHero` | `(heroId) → { ok, reason?, newMaxLevel? }` | Extend level cap (up to L30 max), requires `TRANSCEND_COPIES` (3) copies + gold |
| `performSummon` | `(heroIds, cost)` | Spends gems/gems-equivalent and grants pulled heroes |
| `buyTowerBundle` | `(type, amount, cost)` | Tower-coin-shop purchase |
| `purchaseAscensionItem` | `(itemId, qty)` | Tower-coin-shop ascension-material purchase |
| `ascendHero` | `(heroId) → { ok, reason? }` | Consumes ascension materials to raise `ascension` tier |
| `grantShopPack` | `(packId)` | Grants a gem-priced shop pack's contents |
| `grantIapTransaction` | `(customerInfo)` | Reconciles a RevenueCat purchase, dedupes via `processedIapTransactionIds` |
| `getEffectiveRank` | `(heroId)` | Computes displayed rank from base rank + fusion state |
| `addToPullHistory` | `(entries)` | Prepends to `pullHistory`, caps at 300 |
| `trackAchievementProgress` | `(key, delta = 1)` | Increments an achievement's progress |
| `setMaxAchievementProgress` | `(key, value)` | Clamps an achievement's progress to at least `value` |
| `claimAchievementReward` | `(achievementId)` | |
| `clearAchievementUnlocks` | `()` | Clears `pendingAchievementUnlocks` |
| `clearCodexUnlocks` | `()` | Clears `pendingCodexUnlocks` |
| `setEventPity` / `setEventGuarantee` | `(eventId, value)` | Per-banner event pity/guarantee state |
| `convertExcessCopies` | `(heroId, count)` | Converts spare hero copies into tower coins |
| `exchangeAscensionItems` | `(fromItemId, fromQty, toItemId, toQty)` | Material Exchange recipe execution |

---

## Data Models

### Hero (src/data/heroes.js)

```js
{
  id: 'hero_001',
  name: 'Kira Voltz',
  frame: 'STORMCALLER',          // class/frame label on card
  faction: 'EMBERVEIL',          // key into FACTIONS map
  rank: 'S' | 'A' | 'B' | 'C',  // base rank (effectiveRank set by fusion)
  element: 'Lightning',
  effect: 'PARALYSIS',           // maps to battle mechanic (see Battle Engine)
  class: 'Attacker' | 'Defender' | 'Mage' | 'Support',
  cardId: 'EMB-01-KIRA',
  image: require(...),
  about: '...',
  hp: number,   // 2800–8000 (the 6 SOVEREIGN-tier heroes intentionally exceed this)
  atk: number,  // 260–840  (same SOVEREIGN exception)
  def: number,  // 150–640  (same SOVEREIGN exception)
  crit: number, // 170–700  (same SOVEREIGN exception)
  skills: [
    { name, cost, description, damage },  // cost × 20 = energy cost
    { name, cost, description, damage },
  ],
  trumpCard: { name, description, damage, effect },
}
```

**Effect → Battle mechanic mapping:**

Hero data uses **~53 distinct `hero.effect` string literals** (e.g. `PARALYSIS`, `INCINERATE`, `SCORCH`, `SOVEREIGN_FLAME`, `FLAMEDANCE`, `PHANTOMSTRIKE`, `ABYSSEDGE`, ...) — these are all funneled through the `EFFECT_MECHANICS` lookup table in `battleEngine.js` down to the same 12 underlying mechanics. The table below shows one representative literal per mechanic — **do not treat it as the exhaustive list of `effect` values**; check `EFFECT_MECHANICS` in `battleEngine.js` for the full literal → mechanic mapping.

| Mechanic | Example literal(s) | Behavior |
|---|---|---|
| stun | `PARALYSIS` | Skip next turn |
| burn | `BURN`, `INCINERATE`, `SCORCH`, `SOVEREIGN_FLAME`, `FLAMEDANCE`, `FLAMEGUARD`, `INFERNOEDGE` | 2-turn DOT (8% ATK/turn) |
| poison | `TOXIN` | 3-turn DOT (5% maxHP/turn) |
| chill | `CHILL` | 2 turns, 50% speed reduction |
| shatter | `SHATTER` | 2 turns, 25% DEF reduction |
| weaken | `VOID_CURSE` | 2 turns, 20% ATK reduction |
| evasion | `SHADOW`, `PHANTOMSTRIKE`, `NIGHTBLADE` | Passive 20% dodge |
| lifedrain | `LIFEDRAIN` | Lifedrain passive |
| thornstrike | `THORNSTRIKE` | Thornstrike passive |
| regen | `BLESSING` | 5% maxHP heal/turn |
| fortify | `BARKSKIN` | −15% damage taken |
| smite | `SMITE`, `ABYSSEDGE`, `ECLIPSEDGE` | 2.0× crit multiplier |

> ⚠️ Known gap: the KHEMARA-only effect literals `MOONLIGHT` and `SANDFLAY` are **not present in `EFFECT_MECHANICS`** — heroes using them currently have no mechanical effect in battle.

**Factions (FACTIONS map):**

| Key | Color | Role |
|---|---|---|
| EMBERVEIL | #FF4500 | Fire |
| GLACIARA | #00B4D8 | Ice |
| SUNSPIRE | #D4A017 | Holy |
| VERDANIA | #2ECC71 | Nature |
| VOIDMARK | #9B59B6 | Void |
| KHEMARA | (see FACTIONS map) | Sand / Moon — desert dominion, shop-exclusive Sovereign (hero_054) |

> Faction colors come from `FACTIONS[hero.faction].color` — the only raw-hex exception. Do not confuse `SUNSPIRE`'s faction color (`#D4A017`) with `C.SOVEREIGN_GOLD` (`#FFD700`, the gacha S-rank flash / sovereign-tier color) — they are visually similar but distinct tokens.

**Helpers:** `getHeroById(id)`, `getHeroesByFaction(faction)`, `getHeroesByRank(rank)`, `getHeroesByClass(class)`

---

### Enemy (src/data/enemies.js)

```js
{
  id: 101,              // stageId
  chapter: 1,
  part: 1,             // 1 | 2 | 3
  name: 'Shadow Vanguard',
  description: '...',
  enemies: [
    { id, name, tier: 'mob'|'mini-boss'|'boss', imageKey, hp, maxHp, atk, def, skills }
  ]
}
```

HP ranges by tier (scale up across all 30 chapters): mob 1000–33000, mini-boss 2800–51500, boss 6000–72000.

**Helpers:** `getEnemyImage(imageKey)`

---

### Story (src/data/story.js)

Structure: **30 chapters × 3 parts = 90 stages**. Stage IDs: 101–103, 201–203, …, 3001–3003.

```js
// STAGE_ORDER — ordered array of all 90 stageIds
export const STAGE_ORDER = [101, 102, 103, 201, 202, 203, ...];

// CHAPTER_DEFS — chapter metadata
{
  id: 1,          // chapter number
  title: '...',
  subtitle: '...',
  color: '...',   // chapter accent color (from FACTIONS or own palette)
  accent: '...',
}

// STORY_STAGES — per-stage data
{
  id: 101,
  chapterId: 1,
  part: 1,
  dialogues: [{ speaker, text }, ...],
  enemyGroupId: 101,
  rewards: { gems: 50, heroId: null }   // gold is NOT stored here — see below
}
```

Stage gold is computed dynamically via `stageGoldReward(part)` in story.js (not a static `rewards.gold` field) — current values: part 1 → 360g, part 2 → 660g, part 3 → 1440g.

Unlock rule: stages unlock sequentially — stage N requires stage N-1 completed.

**Helper:** `isStageUnlocked(stageId, completedChapters)`

---

### Daily Quests (src/data/dailyQuests.js)

5 quests reset at midnight (local time). Total if all claimed: 74 gems + 2200 gold.

| Quest | Target | Reward |
|---|---|---|
| win_battles | Win 3 battles (any mode) | 12 gems + 500 gold |
| use_trump | Use a Trump Card 3× | 18 gems |
| clear_stage | Clear 1 Story stage | 12 gems + 1000 gold |
| hero_summon | Perform 1 summon | 22 gems + 500 gold |
| hero_level | Level up 1 hero | 10 gems + 200 gold |

---

### Daily Rewards (src/data/dailyRewards.js)

7-day login cycle. Day 7 bonus: 120 gems + 3000 gold.

---

### Tower (src/data/towerData.js)

```js
TOWER_MAX_FLOOR = 300
TOWER_BOSS_INTERVAL = 10      // boss every 10th floor
STAT_SCALE_PER_FLOOR = 0.30   // sqrt-scaling coefficient: mult = 1 + sqrt(floor-1) * 0.30

isBossFloor(floor)             // floor % 10 === 0
isMilestoneFloor(floor)        // true for floors in FLOOR_MILESTONES (10/50/100/150/200/250/300)
getTowerEnemyGroup(floor)      // scaled enemy group for this floor
getTowerFloorReward(floor)     // { coins, gems, gold }
```

Weekly reset anchored to Monday (`getCurrentWeekKey()` computes the week's Monday date as its key — the reset boundary is the Sunday-midnight→Monday transition). Progress tracked in store (`towerHighestFloor`, `towerWeeklyBest`, `towerCurrentFloor`).

---

## Battle Engine (src/utils/battleEngine.js)

### Damage Formula

```
base      = attacker.atk × skillMultiplier
defFactor = 1 + (defender.def / (defender.def + 500)) × 1.5   // asymptotic, caps near 1.5
critChance = Math.min(0.85, (attacker.crit || 50) / 1000)   // capped 85%; enemies (no crit stat) get a 5% floor
isCrit    = Math.random() < critChance
critMult  = attacker has SMITE ? 2.0 : 1.75
variance  = 0.9 + Math.random() × 0.2
damage    = Math.max(1, Math.floor((base / defFactor) × (isCrit ? critMult : 1) × variance))
```

- **Evasion** (SHADOW passive): 20% chance to dodge entirely — `dodged = true`
- **Shield**: absorbs 1 hit completely — `damage = 0, blocked = true`
- **Fortify** (BARKSKIN passive): reduces incoming damage by 15%

### Status Effects (applyOnHitDebuff)

Proc rates: 50% on skill hit, 25% on basic attack.

| Effect | Duration | Mechanic |
|---|---|---|
| stun | 1 turn | Skip next turn |
| burn | 2 turns | DOT: 8% attacker.atk per turn |
| poison | 3 turns | DOT: 5% target.maxHp per turn |
| chill | 2 turns | 50% speed reduction |
| shatter | 2 turns | 25% DEF reduction on target |
| weaken | 2 turns | 20% ATK reduction on target |

Status ticks processed each turn via `processStatusEffects(unit)` — returns `{ unit, dotDamage, healAmount, messages }`.

### Skill Types

| Skill `damage` | Behavior |
|---|---|
| > 0 | Damage (AOE if description contains "all / enemies / every") |
| 0 | Heal — targets lowest HP-ratio ally, heals `caster.atk × 2` (capped at maxHp) |

### Trump Card (applyTrumpCard)

Hits **all living enemies** with `trumpCard.damage` multiplier. Parses `effect` string for "heal X%" and applies to all living allies (default 20%). Can also apply shield or stun from effect string.

### Enemy AI (getSmartAIAction)

Meaningfully tier- and phase-dependent, not a flat set of odds. Order of evaluation:

1. **Kill-focus priority**: if any player is ≤25% HP, boss/mini-boss tiers have a 78–95% chance to commit a skill targeting them (a deliberate kill attempt), before the general logic below runs.
2. **Target selection**: prefers unshielded targets. Boss/mini-boss tiers have a 30–50% chance (higher while "raging"/in "phase 2") to target the highest-ATK hero instead of the lowest-HP-ratio hero; otherwise targets lowest HP ratio.
3. **One-shot check**: if `Math.floor(estimatedDamage * 0.85) >= primaryTarget.currentHp` **and** the enemy can afford the skill's energy cost → use skill[1] (one-shot attempt at 85% of estimate, not a plain ≥ check).
4. **Energy-urgency rule**: at ≥80 energy, the enemy always spends a skill rather than basic-attacking.
5. **Boss burst-save**: bosses can deliberately basic-attack (hoarding energy) to bank toward affording skill[1] later.
6. **Tier/phase-based skill chance** (skill-use chance / skill[1]-vs-skill[0] split within that chance):
   - mob: 60% / 45%
   - mini-boss: 72% / 55% (78% / 62% in "phase 2", i.e. at ≤50% of its own HP)
   - boss: 82% / 65%
   - boss "raging" (≤45% of its own HP): 92% / 80%
7. Otherwise: basic attack.

Respects stun (skip turn, decrement counter; stun duration is capped at 2 turns on refresh).

### Energy Constants

These constants live in **`BattleScreen.js`**, not `battleEngine.js` — the engine computes damage/status, the screen drives the turn/energy loop.

| Action | Player energy | Enemy energy |
|---|---|---|
| Normal attack | +15 | n/a (enemies don't attack the player's bar) |
| Use skill | +10 | n/a |
| Per turn (passive) | +20 (`ENERGY_PER_TURN`) | +25 (`ENEMY_ENERGY_TURN`) |
| Under CHILL | half of the above, floored | half of the above, floored |
| Trump card | resets to 0 | — |
| Trump card cost | 100 (`MAX_ENERGY`, full bar) | — |
| Skill cost (hero) | `skill.cost × 20` | — |
| Skill cost (enemy) | — | hardcoded `ENEMY_SKILL_COSTS = [30, 50]` for skill[0]/skill[1], not `cost × 20` |

---

## Audio (src/utils/AudioManager.js)

Manages all sound via `expo-audio`. Volume synced with `gameStore.settings`.

| Function | Plays |
|---|---|
| `startHomeBGM()` | Random home BGM, looping |
| `stopHomeBGM()` | Stop home BGM |
| `startStoryBGM()` | Random story BGM, looping |
| `stopStoryBGM()` | Stop story BGM |
| `playSummonSFX()` | Gacha summon sound |
| `playVictorySFX()` | Victory jingle |
| `playDefeatSFX()` | Defeat sound |
| `playBattleSFX(type)` | Battle hit/skill/trump SFX |

---

## Component API

### HeroCard (`src/components/HeroCard.js`)

```jsx
<HeroCard
  hero={heroObject}      // required
  width={220}            // optional, default 220; scales all internals
  compact={false}        // optional; hides bottom lore bar when true
  effectiveRank={rank}   // optional; overrides the displayed rank badge (e.g. post-fusion preview)
/>
```

Fixed aspect ratio: width × (320/220). All internal sizes scale proportionally.

**Visual layers (top → bottom):**
1. Portrait image (cover fill)
2. Top black fade gradient (40% height)
3. Bottom faction-colored fade gradient (58% height)
4. Four corner decorations (faction-colored, 2px borders)
5. Top-left: hero name (uppercase white) + frame label (faction color)
6. Top-right: rank badge (`RANK[effectiveRank]`) — shows "SOV" instead of "S" for sovereign heroes
7. Left side tags: element (emoji+value) + effect (✦+value) — hidden when compact
8. Faction icon badge (top-right interior)
9. Stats row (dark bg): HP ♥ ATK ✕ DEF ⊙ CRIT ◎ with `C.HP/ATK/DEF/CRIT` colors
10. Bottom bar (if not compact): class icon+name (left) + about snippet (right)
11. Card ID footer (small, muted, bottom-right) — gold if SOVEREIGN rank

**Sovereign-tier extras** (when `hero.sovereign` is true), layered on top of the above: a warm gold background wash, an animated pulsing gold border glow, a looping diagonal shimmer sweep, and a "♛ SOVEREIGN" crown banner above the stats row.

**Class icons:** Attacker ⚔️ Defender 🛡️ Support ✨ Mage 🔮

**Element icons:** Fire 🔥 Ice ❄️ Lightning ⚡ Wind 🌪️ Nature 🌿 Void 🌀 Holy ☀️ Physical 💪 Sand 🏜️ Moon 🌙

---

### WeatherEffect (`src/components/WeatherEffect.js`)

```jsx
<WeatherEffect type="rain" />   // 'rain' | 'thunder' | 'wind' | 'fog' | 'clear'
```

- `pointerEvents: 'none'` — never blocks input
- Returns null for `'clear'`
- `'fog'` actually renders a starfield (`TwinklingStars` + `DriftingClouds` + `ShootingStars`), not literal fog

---

### FactionParticles (`src/components/FactionParticles.js`)

```jsx
<FactionParticles faction="EMBERVEIL" />   // any FACTIONS key, incl. KHEMARA
```

Renders a **Matrix-style falling-character rain** overlay, not organic particles — per-faction character sets (kanji/runes/hex digits) and colors come from `CHAR_SETS` and `FACTION_MATRIX` (`src/theme/colors.js`). Column counts per faction (`FACTION_CFG`): EMBERVEIL 10, GLACIARA 11, SUNSPIRE 9, VERDANIA 10, VOIDMARK 12, KHEMARA 9.

- `pointerEvents: 'none'` — absolute fill, never blocks input

---

### ErrorBoundary (`src/components/ErrorBoundary.js`)

```jsx
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

Wraps the entire app in App.js. Catches render errors, logs gracefully, and renders a "Try Again" button that resets its own error state.

---

## Screen Layouts

### HomeScreen

Landscape layout with sidebar + center + featured hero panel.
- **Left sidebar**, two groups: top group (Events, Quests, Achievements, Rankings) + second group (Heroes, Team, World, Codex). Daily Reward is a top-bar icon, not a sidebar item.
- **Center**: faction particles, latest chapter info, quick action buttons
- **HUD** (top): avatar + player name + level + XP bar + gems/gold
- FactionParticles rendered for user's favorite faction

### CollectionScreen

Landscape split:
- **Sidebar** (148px): faction filter buttons + sort dropdown (Default/Rank/Name)
- **Grid** (remaining): 5-column ScrollView

```
SIDEBAR_W = 148
COLS = 5, GRID_PAD = 12, GAP = 7
CARD_W = floor((W - SIDEBAR_W - GRID_PAD×2 - GAP×(COLS-1)) / COLS)   // i.e. floor((W - 148 - 24 - 28) / 5)
CARD_H = floor(CARD_W × 1.42)
```

Card overlays: faction badge top-left, rank badge top-right, lock overlay (not owned), green dot bottom-right (on team).

### TeamBuildScreen

3-hero team builder. Left panel: current team slots (drag-to-fill). Right panel: hero roster filtered by faction. Supports 3 saved presets + active deploy.

### BattleScreen

```
SIDE_PAD = 8, CARD_GAP = 6
SIDE_W = floor(W / 2 - SIDE_PAD × 2)
CARD_W = floor((SIDE_W - CARD_GAP × 2) / 3 × 0.76)
CARD_H = min(200, max(60, floor(SH × 0.36)))
PILL_H = min(58, max(44, floor(SH × 0.11)))
```

Layout: header bar → arena (enemy cards top, player cards bottom) → action bar (hero tag + 3 buttons: attack / skill / trump).

Status effect icons shown under each combatant's HP bar.

**Battle card animations:**
- Hit: shake 9px L/R (200ms) + flash opacity 0.85→0 (350ms) in parallel
- Attack: scale 1.0→1.09→1.0 (250ms)
- Floating damage: up 70% card height, fade after 440ms delay (380ms duration)
- CRIT: fontSize 18px (vs 13px), gold color, 1.4× scale, 💥 prefix
- Enemy AI delay: 1100ms

### VictoryScreen

Full-screen victory overlay using `C.GRAD_VICTORY`. Displays:
- Gems + gold earned, hero drop (if any)
- XP gained + player level-up notification
- Floating faction particles
- Buttons: Next Stage / Return Home

### HeroDetailScreen

Landscape split:
```
BODY_PAD = 12
CARD_W = min(floor(cardHAvail × (220 / 320)), floor(screenW × 0.34))   // width-capped, not a pure height-derived formula
```

- **Left col**: HeroCard + floating back button (absolute, z-index 20)
- **Right col** (ScrollView): name → faction strip → tags → about → 4 stat blocks → 2 skills → trump card → level-up button → fusion button → transcendence button → team toggle → share button

Hero progression:
- **Level up**: costs gold, max level 10 (base), extended to 30 via transcendence
- **Fusion**: `FUSION_COPIES` (2) copies + gold → rank up (C→B→A→S). S is the hard cap. SOVEREIGN is a pre-defined rarity (1 per faction, 6 total incl. KHEMARA's shop-exclusive) identified by `hero.sovereign = true` — it cannot be reached through fusion.
- **Transcendence**: `TRANSCEND_COPIES` (3) copies + gold → +5 level cap per transcendence (up to L30, 4 transcendences max)
- **Share**: captures HeroCard via react-native-view-shot + expo-sharing

### SummonScreen

Landscape split — not a flex 40/60: the left column (`bannerLeft`) is sized to `CARD_W + BODY_PAD × 2` (content-derived, fixed), the right column (`bannerRight`) takes the remaining flex space.
- **Left**: banner art + rank odds display
- **Right**: ×1 (50 gems) + ×10 (450 gems) buttons + rank guide

Gacha pools & rates are data-driven from `src/data/events.js` (`STANDARD_BANNER`, `FIFTY_FIFTY_LOSS_IDS`, `STANDARD_RATES`, `EVENT_RATES`) — edit there to update manually. A rank with rate 0 never drops on that banner; non-S pulls always draw from ALL heroes of the rolled rank (pool strips and the rates modal adapt automatically).
- **Standard banner** — rates from `STANDARD_RATES`. S pulls come only from `STANDARD_BANNER.featuredSRankIds` (no Sovereign proc). **Pity: guaranteed S at 90 pulls** (tracked in `store.pity`).
- **Event banner** — rates from `EVENT_RATES`. S pulls are a 50/50: featured hero, or on a loss one of `FIFTY_FIFTY_LOSS_IDS` (then next S is guaranteed featured). Pity at 80 pulls, per-banner (`store.eventPity` / `store.eventGuarantee`).
- `shopExclusive` heroes (hero_054) never drop on any banner.

Card flip animation: scale 0→1 (spring friction:6 tension:100) + opacity 0→1 + rotateY flip, staggered 150ms per card.
Screen flash (`C.FLASH_GOLD`) if S pulled, (`C.FLASH_PURPLE`) if A pulled.

Results modal: 4-column grid, rank badge + faction border per card, summary count row, "Collect & Close".

### StoryScreen

Scrollable grid of chapter cards (30 chapters). Each chapter expands to show 3 part stages. Unlock rule enforced visually (lock icon + 50% opacity). Tapping unlocked part → NarrationScreen.

### NarrationScreen

Pre-battle dialogue with typewriter text effect. Shows chapter boss preview image, speaker name badges (gold), and dialogue lines. Last line shows "BEGIN BATTLE" button.

### ProfileScreen

Landscape layout:
- **Left**: large avatar hero card + showcase grid (3 hero slots)
- **Right**: player name + signature, level/XP bar, favorite faction badge, play stats summary

### SettingsScreen

Audio controls:
- Music volume slider (`C.THUMB` on dark track)
- SFX volume slider
- Mute toggles (music / SFX separately)

Volume persisted to `store.settings`.

### WorldMapScreen

Faction world map — 6 factions displayed with:
- Faction banner art + lore text
- Ruler/champion info
- Climate & element tags
- Scrollable hero grid (5 columns) filtered by faction

### TowerScreen

Endless Tower (300 floors):
- Floor progress display with current/highest floor
- Boss floors (every 10th) highlighted
- Milestone markers (10/50/100/150/200/250/300)
- Weekly reset countdown (week boundary anchored to Monday, see Tower data model above)
- Reward preview per floor (coins/gems/gold)
- "Enter Floor" starts battle via Tower → Battle flow

### LoadingScreen

Progress bar: `BAR_W = W × 0.52`, cubic easing, 2400ms fill + 200ms pause (~2600ms total) before navigating.
Tips: rotating hints, fade in/out every 3000ms.
Preloads critical assets. Navigates to Onboarding (first run) or Home.

### OnboardingScreen

4-step tutorial shown once (`hasSeenOnboarding` flag):
1. Welcome / game intro
2. Summon & collect heroes
3. Build your team
4. Battle & Trump Cards

Skip button available at all steps.

---

## Design Patterns

### Glass Panel

```js
<View style={{ borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: C.BORDER }}>
  <LinearGradient
    colors={[C.GLASS_1, C.GLASS_2]}
    style={StyleSheet.absoluteFill}
  />
  {/* content */}
</View>
```

### Badge / Pill

```js
<View style={{
  borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2,
  backgroundColor: color + '18', borderColor: color, borderWidth: 1,
}}>
  <Text style={{ color, fontWeight: '700', fontSize: 9 }}>LABEL</Text>
</View>
```

### Rank Badge

```js
import { RANK } from '../theme/colors';
const r = RANK[hero.effectiveRank ?? hero.rank]; // { bg, text, glow }
<View style={{ backgroundColor: r.bg, shadowColor: r.glow, ... }}>
  <Text style={{ color: r.text }}>{hero.effectiveRank ?? hero.rank}</Text>
</View>
```

### Text on Image (legibility)

```js
style={{
  color: C.TEXT,
  textShadowColor: 'rgba(0,0,0,0.9)',
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 4,
}}
```

### Header Bar

Always use `C.GRAD_HEADER` with `C.TEXT` (white) text.

```js
<LinearGradient colors={C.GRAD_HEADER} style={styles.header}>
  <Text style={{ color: C.TEXT }}>Title</Text>
</LinearGradient>
```

### Button Gradient (horizontal)

```js
<LinearGradient
  colors={C.GRAD_PINK}          // or GRAD_GOLD, GRAD_HEADER
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 0 }}
/>
```

---

## Animation Patterns

Always set `useNativeDriver: true` unless animating layout props (width/height).

```js
// Spring (card reveals, scale pops)
Animated.spring(val, { toValue: 1, friction: 6, tension: 100, useNativeDriver: true })

// Timing (progress bars, fades, slides)
Animated.timing(val, { toValue: 1, duration: 300, useNativeDriver: true })

// Sequences
Animated.sequence([ Animated.delay(100), Animated.timing(...), ... ])

// Parallel
Animated.parallel([ Animated.timing(shake, ...), Animated.timing(flash, ...) ])

// Loop (weather, particles)
Animated.loop(Animated.sequence([...]))

// Interpolation
val.interpolate({ inputRange: [0, 1], outputRange: ['-9deg', '9deg'] })
```

---

## Typography Scale

| Role | fontWeight | fontSize | letterSpacing | Notes |
|---|---|---|---|---|
| Screen title | 900 | 14–18 | 2–4 | All caps |
| Section header | 800 | 11–13 | 1–2 | All caps |
| Button label | 800 | 12–14 | 0.5–1 | |
| Stat value | 700–800 | 14–20 | — | Colored per stat |
| Body / lore | 600 | 11–13 | — | lineHeight 16–20 |
| Small label | 700 | 8–10 | 0.5–1 | Uppercase preferred |
| Footer / ID | 500–600 | 7–9 | 0.5 | Muted color |

---

## Spacing & Sizing Conventions

- **Padding:** prefer multiples of 2; common values: 6, 8, 10, 12, 14
- **Border radius:** 4 (badges/pills), 8 (cards/buttons), 10 (panels), 16 (modals)
- **Touch targets:** minimum 30×30 (accessibility)
- **Dividers:** `C.BORDER_SUBTLE` at 1px

---

## Coding Rules

1. **No bare hex** in screen or component files. Use `C.*` (see AGENTS.md).
2. **No new color declarations** in screen/component files. Add to `src/theme/colors.js` first.
3. **Faction color** only via `FACTIONS[hero.faction].color` from `src/data/heroes.js`.
4. **Rank badge colors** only via `RANK[hero.effectiveRank ?? hero.rank]` from `src/theme/colors.js`.
5. **useNativeDriver: true** on all Animated calls unless animating non-transform/opacity props.
6. **pointerEvents: 'none'** on all overlay components (WeatherEffect, FactionParticles).
7. **Landscape-only** — never assume portrait dimensions. `W > H` always.
8. **No TypeScript** — project is plain JS.
9. **No inline style objects** for frequently-rendered list items — use StyleSheet.create.
10. **Team max = 3** — enforce in UI and store.
11. Skill energy cost is `skill.cost × 20`, not `skill.cost` directly.
12. Enemy/hero images loaded via `require()` at data-file level, never constructed dynamically.
13. Hero progression uses `effectiveRank` (post-fusion) — always prefer over base `rank` when displaying.
14. Stage IDs are `chapter × 100 + part` across all 30 chapters — 3-digit for chapters 1–9 (101–903) and 4-digit for chapters 10–30 (1001–3003); last digit is always the part (1/2/3).
