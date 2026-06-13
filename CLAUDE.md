@AGENTS.md

---

# Aetheria: Legends Unbound — Full Codebase Reference

Landscape-only React Native RPG built with Expo 56. Card-battling with story progression, hero collection (53 heroes, 5 factions, 5 ranks), gacha summoning, endless tower, daily quests, and turn-based battle with status effects.

---

## Tech Stack

| Layer | Library | Version |
|---|---|---|
| UI | React Native | 0.85.3 |
| Build | Expo | ~56.0.4 |
| State | Zustand + AsyncStorage | 5.0.13 |
| Navigation | @react-navigation/native-stack | 7.x |
| Navigation | @react-navigation/bottom-tabs | 7.x |
| Gradients | expo-linear-gradient | 56.0.4 |
| Audio | expo-audio | ~56.0.11 |
| Video | expo-video | ~56.1.2 |
| Icons | @expo/vector-icons (Ionicons) | 15.1.1 |
| Gesture | react-native-gesture-handler | 2.31.2 |
| Animation | react-native-reanimated | 4.3.1 |
| Persistence | @react-native-async-storage/async-storage | 2.2.0 |
| Screenshot | react-native-view-shot | 5.1.0 |
| File access | expo-file-system | ^56.0.7 |
| Sharing | expo-sharing | ~56.0.15 |

> Always read https://docs.expo.dev/versions/v56.0.0/ before writing Expo-specific code.

---

## File Map

```
App.js                         Navigation root (17 screens) + hardware back handler
app.json                       Expo config (landscape, dark, bundle ID com.trumpcard.game)
index.js                       Entry point
src/
  theme/
    colors.js                  C.* tokens + RANK badge colors — single source of truth
  data/
    heroes.js                  53 hero definitions + FACTIONS map + helpers
    enemies.js                 Enemy groups for story stages + ENEMY_IMAGES map
    story.js                   25 chapters × 3 parts = 75 stages + STAGE_ORDER + CHAPTER_DEFS
    backgrounds.js             WEATHER_BACKGROUNDS + BACKGROUNDS arrays
    dailyQuests.js             QUEST_DEFS (5 quests) + TOTAL_DAILY_GEMS/GOLD
    dailyRewards.js            DAILY_REWARDS (7-day login cycle)
    towerData.js               Tower constants + getTowerEnemyGroup + getTowerFloorReward
  store/
    gameStore.js               Zustand store — full game state + all actions
  utils/
    battleEngine.js            Damage formula, status effects, Trump Card logic, AI decisions
    AudioManager.js            BGM/SFX management via expo-audio
    playerLevel.js             XP system + level calculation (99 cap)
  screens/
    LoadingScreen.js           Splash → asset preload → animated progress bar → Home/Onboarding
    OnboardingScreen.js        4-step tutorial (one-time, skip flag stored)
    HomeScreen.js              Main hub (sidebar, featured hero, quick stats, daily rewards)
    StoryScreen.js             25-chapter × 3-part stage selector
    NarrationScreen.js         Pre-battle typewriter dialogue with boss preview
    BattleScreen.js            Turn-based battle (energy, skills, Trump Card, status effects)
    VictoryScreen.js           Post-win rewards (gems, gold, hero drops, XP, level-up)
    DailyRewardScreen.js       7-day login streak reward cycle
    DailyQuestScreen.js        5 daily quests with progress bars + claim
    CollectionScreen.js        Hero gallery (faction filter, sort, 5-col grid)
    TeamBuildScreen.js         3-hero team builder with 3 saved presets
    SummonScreen.js            Gacha (×1 / ×10, pity at 90, card flip reveal)
    HeroDetailScreen.js        Hero profile: level up, fusion (rank up), transcendence, share
    ProfileScreen.js           Player profile: name, avatar, showcase, level/XP, stats
    SettingsScreen.js          Music/SFX volume sliders + mute toggles
    WorldMapScreen.js          Faction world map: lore, rulers, heroes by faction
    TowerScreen.js             Endless Tower (200 floors, boss every 10, weekly reset)
    CloudAuthScreen.js         Firebase authentication — cloud save sync (accessible from Settings)
    TowerShopScreen.js         Tower coin shop — buy ascension items and bundles (accessible from Tower)
  components/
    HeroCard.js                Reusable hero card (portrait, stats bar, rank badge)
    WeatherEffect.js           Animated rain/wind/fog/thunder overlay
    FactionParticles.js        Faction-specific ambient particles (fire/snow/stars/leaves/void)
    ErrorBoundary.js           React error boundary — wraps entire app
```

---

## Navigation

Stack navigator, **all headers hidden**, fade animation between screens.

```
Loading ──► Onboarding (first run) ──► Home
Loading ──────────────────────────────► Home (returning)

Home ──► Story ──► Narration ──► Battle ──► Victory ──► Home
     ├──► Collection ──► HeroDetail ──► Collection
     ├──► TeamBuild
     ├──► Summon
     ├──► DailyReward
     ├──► DailyQuests
     ├──► Profile
     ├──► Settings ──► CloudAuth
     ├──► WorldMap
     └──► Tower ──► Battle ──► Victory ──► Tower
          └──► TowerShop
```

**Passing data via route.params:**

| Route | Params |
|---|---|
| Story → Narration | `{ stageId, chapterId }` |
| Narration → Battle | `{ stageEnemies, stageId, chapterId, stageRewards: {gems, gold, heroId} }` |
| Tower → Battle | `{ stageEnemies, floor, isBoss, rewards }` |
| Collection → HeroDetail | `{ heroId }` |
| Battle win → Victory | `{ rewards, stageId?, floor? }` |
| Victory / Battle loss → Home/Tower | `navigation.navigate(...)` |

---

## State (gameStore.js)

Persisted to AsyncStorage under key `trump-card-game-storage`.

```js
{
  // Currencies
  gems: number,
  gold: number,
  pity: number,           // gacha pity counter, resets to 0 at 90 pulls

  // Heroes
  ownedHeroes: string[],  // hero ID strings
  team: string[],         // up to 3 hero IDs (active deploy)
  heroCollection: {       // { [heroId]: { level, copies, effectiveRank, transcendence } }
    [heroId]: { level: number, copies: number, effectiveRank: string, transcendence: number }
  },

  // Progress
  completedChapters: number[],   // stageIds (e.g. 101, 102, 103, 201, ...)
  milestonesClaimed: number[],   // every 5 chapters
  pendingMilestoneReward: { hero, milestone } | null,

  // Teams
  savedTeams: [string[], string[], string[]],  // 3 presets
  activeTeamPreset: number,                    // -1 if custom

  // Daily
  dailyStreak: number,
  lastClaimDate: string,     // ISO date string
  dailyQuests: { date: string, progress: {}, claimed: {} },

  // Tower
  towerHighestFloor: number,
  towerCurrentFloor: number,
  towerWeekResetDate: string,
  towerCoins: number,

  // Profile
  playerProfile: {
    name: string,
    signature: string,
    avatarHeroId: string,
    showcaseIds: string[],   // 3 slots
    favoriteFaction: string,
  },

  // Settings
  settings: { musicVolume: number, sfxVolume: number, musicMute: boolean, sfxMute: boolean },

  // Flags
  hasSeenOnboarding: boolean,
  hasSeenBattleTutorial: boolean,
  practiceBonusClaimed: boolean,
}
```

**Actions:**

| Method | Signature | Notes |
|---|---|---|
| `addHero` | `(heroId)` | Adds to ownedHeroes or increments copies |
| `setTeam` | `(heroIds[])` | Replace entire active team |
| `addToTeam` | `(heroId)` | Toggle hero on/off team (max 3) |
| `spendGems` | `(amount) → boolean` | Returns false if insufficient |
| `addGems` | `(amount)` | |
| `addGold` | `(amount)` | |
| `spendGold` | `(amount) → boolean` | Returns false if insufficient |
| `claimDailyReward` | `() → { reward, streak, dayIdx }` | |
| `completeChapter` | `(stageId, gems, heroId?)` | Marks complete + grants rewards + checks milestones |
| `isChapterCompleted` | `(stageId) → boolean` | |
| `levelUpHero` | `(heroId)` | Costs gold, respects max level |
| `fuseHero` | `(heroId)` | Rank up (C→B→A→S), S is the fusion cap — SOVEREIGN is not obtainable via fusion, requires 3 copies + gold |
| `transcendHero` | `(heroId)` | Extend level cap (up to L30 max), requires 5 copies + gold |
| `getHeroData` | `(heroId) → {level, copies, effectiveRank, transcendence}` | |
| `claimQuestReward` | `(questId, gems, gold)` | |
| `completeTowerFloor` | `(floor, rewards)` | Updates towerHighestFloor if new record |
| `saveTeamPreset` | `(idx, heroIds)` | |
| `deployPreset` | `(idx)` | Sets team from savedTeams[idx] |
| `updateProfile` | `(patch)` | Partial update of playerProfile |
| `updateSettings` | `(patch)` | Partial update of settings |

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
  hp: number,   // 2800–8000
  atk: number,  // 260–840
  def: number,  // 150–640
  crit: number, // 170–700
  skills: [
    { name, cost, description, damage },  // cost × 20 = energy cost
    { name, cost, description, damage },
  ],
  trumpCard: { name, description, damage, effect },
}
```

**Effect → Battle mechanic mapping:**

| Effect | Mechanic |
|---|---|
| PARALYSIS | stun (skip turn) |
| BURN | 2-turn DOT (8% ATK/turn) |
| TOXIN | 3-turn DOT (5% maxHP/turn) |
| CHILL | 2 turns, 50% speed reduction |
| SHATTER | 2 turns, 25% DEF reduction |
| VOID_CURSE | 2 turns, 20% ATK reduction (weaken) |
| SHADOW | evasion (passive 20% dodge) |
| LIFEDRAIN | lifedrain passive |
| THORNSTRIKE | thornstrike passive |
| BLESSING | regen (5% maxHP heal/turn) |
| BARKSKIN | fortify (−15% damage taken) |
| SMITE | smite (2.0× crit multiplier) |

**Factions (FACTIONS map):**

| Key | Color | Role |
|---|---|---|
| EMBERVEIL | #FF4500 | Fire |
| GLACIARA | #00B4D8 | Ice |
| SUNSPIRE | #FFD700 | Holy |
| VERDANIA | #2ECC71 | Nature |
| VOIDMARK | #9B59B6 | Void |

> Faction colors come from `FACTIONS[hero.faction].color` — the only raw-hex exception.

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

HP ranges by tier: mob 1200–5000, mini-boss 2400–9000, boss 6000–11000.

**Helpers:** `getEnemyImage(imageKey)`

---

### Story (src/data/story.js)

Structure: **25 chapters × 3 parts = 75 stages**. Stage IDs: 101–103, 201–203, …, 2501–2503.

```js
// STAGE_ORDER — ordered array of all 75 stageIds
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
  rewards: { gems: 50, gold: 50, heroId: null }
}
```

Stage gold rewards by part: part 1 → 50g, part 2 → 150g, part 3 → 400g.

Unlock rule: stages unlock sequentially — stage N requires stage N-1 completed.

**Helper:** `isStageUnlocked(stageId, completedChapters)`

---

### Daily Quests (src/data/dailyQuests.js)

5 quests reset at midnight. Total if all claimed: 140 gems + 2200 gold.

| Quest | Target | Reward |
|---|---|---|
| win_battles | Win 3 battles | gems |
| use_trump | Use Trump Card 5× | gems |
| clear_stage | Clear 1 story stage | gems |
| hero_summon | Summon 1 hero | gems |
| hero_level | Level up 1 hero | gold |

---

### Daily Rewards (src/data/dailyRewards.js)

7-day login cycle. Day 7 bonus: 200 gems + 2000 gold.

---

### Tower (src/data/towerData.js)

```js
TOWER_MAX_FLOOR = 200
TOWER_BOSS_INTERVAL = 10      // boss every 10th floor
STAT_SCALE_PER_FLOOR = 0.10   // enemy stats +10% per floor

isBossFloor(floor)             // floor % 10 === 0
isMilestoneFloor(floor)        // floor % 50 === 0
getTowerEnemyGroup(floor)      // scaled enemy group for this floor
getTowerFloorReward(floor)     // { coins, gems, gold }
```

Weekly reset on Sunday. Progress tracked in store (`towerHighestFloor`, `towerCurrentFloor`).

---

## Battle Engine (src/utils/battleEngine.js)

### Damage Formula

```
base      = attacker.atk × skillMultiplier
defFactor = 1 + (defender.def / (defender.def + 500)) × 1.5   // asymptotic, caps near 1.5
isCrit    = Math.random() < (attacker.crit / 1000)
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

1. If skill[1] estimated damage ≥ target HP → use skill[1] (one-shot)
2. 60% chance to use a skill (45% picks skill[1], 55% picks skill[0])
3. Otherwise: basic attack

Targets player with lowest HP ratio. Respects stun (skip turn, decrement counter).

### Energy Constants

| Action | Energy |
|---|---|
| Normal attack | +15 |
| Use skill | +10 |
| Per turn (passive) | +20 |
| Trump card | resets to 0 |
| Trump card cost | 100 (full bar) |
| Skill cost | `skill.cost × 20` |

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
  hero={heroObject}     // required
  width={220}           // optional, default 220; scales all internals
  compact={false}       // optional; hides bottom lore bar when true
/>
```

Fixed aspect ratio: width × (320/220). All internal sizes scale proportionally.

**Visual layers (top → bottom):**
1. Portrait image (cover fill)
2. Top black fade gradient (40% height)
3. Bottom faction-colored fade gradient (58% height)
4. Four corner decorations (faction-colored, 2px borders)
5. Top-left: hero name (uppercase white) + frame label (faction color)
6. Top-right: rank badge (`RANK[effectiveRank]`)
7. Left side tags: element (emoji+value) + effect (✦+value) — hidden when compact
8. Faction icon badge (top-right interior)
9. Stats row (dark bg): HP ♥ ATK ✕ DEF ⊙ CRIT ◎ with `C.HP/ATK/DEF/CRIT` colors
10. Bottom bar (if not compact): class icon+name (left) + about snippet (right)
11. Card ID footer (small, muted, bottom-right) — gold if SOVEREIGN rank

**Class icons:** Attacker ⚔️ Defender 🛡️ Support ✨ Mage 🔮

**Element icons:** Fire 🔥 Ice ❄️ Lightning ⚡ Wind 🌪️ Nature 🌿 Void 🌀 Holy ☀️ Physical 💪

---

### WeatherEffect (`src/components/WeatherEffect.js`)

```jsx
<WeatherEffect type="rain" />   // 'rain' | 'thunder' | 'wind' | 'fog' | 'clear'
```

- `pointerEvents: 'none'` — never blocks input
- Returns null for `'clear'`

---

### FactionParticles (`src/components/FactionParticles.js`)

```jsx
<FactionParticles faction="EMBERVEIL" />
```

- `pointerEvents: 'none'` — absolute fill, never blocks input
- EMBERVEIL: 22 rising embers | GLACIARA: 26 drifting snowflakes
- SUNSPIRE: 18 twinkling stars | VERDANIA: 16 diagonal leaves | VOIDMARK: 20 pulsing orbs

---

### ErrorBoundary (`src/components/ErrorBoundary.js`)

```jsx
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

Wraps the entire app in App.js. Catches render errors and logs gracefully.

---

## Screen Layouts

### HomeScreen

Landscape layout with sidebar + center + featured hero panel.
- **Left sidebar**: menu items (Heroes, Daily, Quests, Team, World)
- **Center**: faction particles, latest chapter info, quick action buttons
- **HUD** (top): avatar + player name + level + XP bar + gems/gold
- FactionParticles rendered for user's favorite faction

### CollectionScreen

Landscape split:
- **Sidebar** (148px): faction filter buttons + sort dropdown (Default/Rank/Name)
- **Grid** (remaining): 5-column ScrollView

```
SIDEBAR_W = 148
COLS = 5, GRID_PAD = 10, GAP = 7
CARD_W = floor((W - 148 - 20 - 28) / 5)
CARD_H = floor(CARD_W × 1.42)
```

Card overlays: faction badge top-left, rank badge top-right, lock overlay (not owned), green dot bottom-right (on team).

### TeamBuildScreen

3-hero team builder. Left panel: current team slots (drag-to-fill). Right panel: hero roster filtered by faction. Supports 3 saved presets + active deploy.

### BattleScreen

```
SIDE_PAD = 8, CARD_GAP = 6
SIDE_W = floor(W / 2 - SIDE_PAD × 2)
CARD_W = floor((SIDE_W - CARD_GAP × 2) / 3 × 0.80)
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
BODY_PAD = 14
CARD_W = floor((H - BODY_PAD × 2) × (220 / 320))
```

- **Left col**: HeroCard + floating back button (absolute, z-index 20)
- **Right col** (ScrollView): name → faction strip → tags → about → 4 stat blocks → 2 skills → trump card → level-up button → fusion button → transcendence button → team toggle → share button

Hero progression:
- **Level up**: costs gold, max level 10 (base), extended to 30 via transcendence
- **Fusion**: 3 copies + gold → rank up (C→B→A→S). S is the hard cap. SOVEREIGN is a pre-defined rarity (1 per faction, 5 total) identified by `hero.sovereign = true` — it cannot be reached through fusion.
- **Transcendence**: 5 copies + gold → +5 level cap per transcendence (up to L30, 4 transcendences max)
- **Share**: captures HeroCard via react-native-view-shot + expo-sharing

### SummonScreen

Landscape split (40/60):
- **Left** (40%): banner art + rank odds display
- **Right** (60%): ×1 (50 gems) + ×10 (450 gems) buttons + rank guide

Gacha rates: S 4% / A 22% / B 30% / C 44% — **pity system: guaranteed S at 90 pulls** (tracked in `store.pity`).

Card flip animation: scale 0→1 (spring friction:6 tension:100) + opacity 0→1 + rotateY flip, staggered 150ms per card.
Screen flash (`C.FLASH_GOLD`) if S pulled, (`C.FLASH_PURPLE`) if A pulled.

Results modal: 4-column grid, rank badge + faction border per card, summary count row, "Collect & Close".

### StoryScreen

Scrollable grid of chapter cards (25 chapters). Each chapter expands to show 3 part stages. Unlock rule enforced visually (lock icon + 50% opacity). Tapping unlocked part → NarrationScreen.

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

Faction world map — 5 factions displayed with:
- Faction banner art + lore text
- Ruler/champion info
- Climate & element tags
- Scrollable hero grid (5 columns) filtered by faction

### TowerScreen

Endless Tower (200 floors):
- Floor progress display with current/highest floor
- Boss floors (every 10th) highlighted
- Milestone markers (every 50th)
- Weekly reset countdown
- Reward preview per floor (coins/gems/gold)
- "Enter Floor" starts battle via Tower → Battle flow

### LoadingScreen

Progress bar: `BAR_W = W × 0.52`, cubic easing, 3400ms total.
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
14. Stage IDs are 3-digit numbers: first digit = chapter (1–25 → 100s–2500s), last digit = part (1/2/3).
