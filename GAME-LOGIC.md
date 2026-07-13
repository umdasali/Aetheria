# Aetheria: Legends Unbound — Game & Business Logic Reference

Exact formulas, constants, and invariants for every game system. All values verified against the live source files.

---

## Battle Engine (`src/utils/battleEngine.js`)

### Damage Formula

```
base      = effectiveAtk × skillMultiplier
defFactor = 1 + (effectiveDef / (effectiveDef + 500)) × 1.5    // asymptotic, peaks ~2.5 at infinite DEF
critChance = attacker.crit / 1000                               // enemies without crit → 0.05 (5%)
isCrit    = Math.random() < critChance
critMult  = 2.0 if attacker has SMITE passive, else 1.75
variance  = 0.9 + Math.random() × 0.2                          // 90%–110%
raw       = floor((base / defFactor) × (isCrit ? critMult : 1) × variance)
damage    = max(1, raw)

// Modifiers applied before raw calculation:
//   shatter on defender → effectiveDef = floor(def × 0.75)   (–25%)
//   weaken  on attacker → effectiveAtk = floor(atk × 0.80)   (–20%)
//   fortify on defender → damage       = floor(raw × 0.85)   (–15% after calc)
//   evasion on defender → 20% chance to return damage=0, dodged=true (checked first)
//   shield  on defender → damage=0, blocked=true (checked after evasion)
```

### Rank Stat Multiplier (applied when building combatants, not in formula)

| Rank | Multiplier |
|---|---|
| C | 1.00× |
| B | 1.15× |
| A | 1.32× |
| S | 1.55× |
| SOVEREIGN | 1.85× |

### Status Effects

| Type | Duration | Value | On-hit proc rate | Mechanic |
|---|---|---|---|---|
| `stun` | 1 turn | — | Skill 50%, Attack 25% | Skip next turn |
| `burn` | 3 turns | `floor(hero.atk × 0.08)` / turn | Skill 50%, Attack 25% | DOT tick each turn |
| `poison` | 3 turns | `floor(target.maxHp × 0.05)` / turn | Skill 50%, Attack 25% | DOT tick each turn |
| `chill` | 2 turns | 0.5 (50% speed) | Skill 50%, Attack 25% | Display only currently |
| `shatter` | 2 turns | 0.25 (–25% DEF) | Skill 50%, Attack 25% | Reduces effectiveDef |
| `weaken` | 2 turns | 0.20 (–20% ATK) | Skill 50%, Attack 25% | Reduces effectiveAtk |

Refreshing rule: applying the same effect type re-uses the existing slot, taking `max(existing, new)` duration.

### Passive Mechanics (always-on, no proc)

| Mechanic | Effect |
|---|---|
| `evasion` | 20% chance to dodge each incoming hit |
| `fortify` | –15% incoming damage |
| `regen` | Heal `floor(maxHp × 0.05)` per turn |
| `lifedrain` | (display label — not a separate calc in engine) |
| `thornstrike` | (display label — not a separate calc in engine) |
| `smite` | 2.0× crit multiplier instead of 1.75× |

### EFFECT_MECHANICS Map (hero.effect → mechanic)

**Debuffs:** `PARALYSIS/ENTANGLEMENT → stun` · `BURN/INCINERATE/SCORCH/SOVEREIGN_FLAME/FLAMEDANCE/FLAMEGUARD → burn` · `TOXIN → poison` · `CHILL/GLACIATION/PERMAFROST/BLIZZARD/ICEWALL → chill` · `SHATTER → shatter` · `VOID_CURSE/VOID_OMEN/VOID_PULSE/CORRUPTION/ABYSS/NULLIFY → weaken`

**Passives:** `SHADOW/PHANTOMSTRIKE → evasion` · `LIFEDRAIN → lifedrain` · `THORNSTRIKE → thornstrike` · `BLESSING/SANCTIFY/REJUVENATE/RADIANCE/ILLUMINATE/BLOOM/VOLTMEND/FROSTMEND → regen` · `BARKSKIN/HEATSHIELD/DIVINE_SHIELD/SOVEREIGNTY → fortify` · `SMITE → smite`

### Energy System

| Action | Energy change |
|---|---|
| Normal attack | +15 |
| Use a skill | +10 |
| Per turn (passive) | +20 |
| Use Trump Card | reset to 0 |
| Skill cost | `skill.cost × 20` |
| Trump Card cost | 100 (full bar) |

### Skill Types

| `skill.damage` value | Behavior |
|---|---|
| > 0 | Damage — AOE if description contains "all / enemies / every" |
| 0 | Heal — targets lowest HP-ratio living ally, heals `floor(caster.atk × 2)` |

### Trump Card (`applyTrumpCard`)

Hits **all living enemies** with `trumpCard.damage` multiplier. Parses `trumpCard.effect` string for:
- `"heal X%"` → heals all living allies by X% maxHp (default 20%)
- `"shield N hits"` → gives N shield charges to all living allies
- `"stun N turn"` → stuns all living enemies for N turns

### Enemy AI Priority (`getSmartAIAction`)

1. **Kill focus** (elite only) — any player ≤25% HP → 88–95% chance to skill-finish them
2. **One-shot check** — use skill[1] if `floor(atk × skill[1].damage / defFactor × 0.85) ≥ target.currentHp`
3. **Energy urgency** — energy ≥80 → always spend a skill (never waste a full bar)
4. **Boss burst-save** — hoard energy toward skill[1] when not yet affordable and not raging
5. **Tier-based skill chance** — mob 60%, mini-boss 72%, boss 82%, rage 92%
6. **Basic attack** fallback

**Rage phase** (boss ≤45% HP or `enraged` flag): skill chance jumps to 92%, skill[1] preference 80%, targets highest-ATK player.

**Target selection:** mob → lowest HP ratio · mini-boss → 30% highest ATK · boss → 40% highest ATK · rage → always highest ATK. All elites prefer unshielded targets over shielded ones.

---

## Hero Progression (`src/store/gameStore.js`)

### Level Up

```
maxLevel = 10 + (transcendence × 5)          // 10 base, up to 30 at transcendence 4

cost(level) = level <= 10
  ? 100 × level                               // L1→2 = 100g, L9→10 = 900g
  : 200 × (level - 10) + 1000                 // L10→11 = 1200g, L25→26 = 4000g (example)
```

### Fusion (Rank Up)

Requires **`FUSION_COPIES` = 2 copies** + gold (reduced from 3 — see code comment in `gameStore.js`). Caps at rank **S** — cannot fuse past S via normal play.

| Current Rank | Rank Order Idx | Gold Cost |
|---|---|---|
| C → B | 0 | 2,000 |
| B → A | 1 | 5,000 |
| A → S | 2 | 10,000 |

Returns `{ ok, newRank }` or `{ ok: false, reason: 'copies'|'max_rank'|'gold' }`.

### Transcendence

Requires **`TRANSCEND_COPIES` = 3 copies** + gold (reduced from 5 — see code comment in `gameStore.js`). Max 4 transcendences (hard cap: L30).

| Transcendence # | Gold Cost | New Max Level |
|---|---|---|
| 1st | 8,000 | 15 |
| 2nd | 15,000 | 20 |
| 3rd | 25,000 | 25 |
| 4th | 40,000 | 30 |

Returns `{ ok, newMaxLevel }` or `{ ok: false, reason: 'copies'|'max'|'gold' }`.

### Ascension

Requires 1 ascension item (tier-matched) per level. Max `ASCENSION_MAX` levels.

| Rank | Required Item |
|---|---|
| SOVEREIGN | aetheria_core |
| S | feather_of_hope |
| A | lost_butterfly |
| B | broken_wing |
| C | broken_wing |

### Copy → Tower Coin Conversion

| Rank | Coins per Copy |
|---|---|
| SOVEREIGN | 200 |
| S | 80 |
| A | 35 |
| B | 15 |
| C | 8 |

---

## Gacha / Summon (`src/data/events.js` — rates are data-driven, not hardcoded in SummonScreen)

Standard banner and event banners use **different rate tables**:

| Rank | `STANDARD_RATES` | `EVENT_RATES` |
|---|---|---|
| S | 2% | 2% |
| A | 3% | 50% |
| B | 38% | 20% |
| C | 57% | 28% |

- **Standard banner**: S pulls draw only from `STANDARD_BANNER.featuredSRankIds` (no Sovereign proc). **Pity: guaranteed S at 90 pulls** (tracked in `store.pity`, resets to 0 on S pull).
- **Event banner**: S pulls are a 50/50 — featured hero, or on a loss one of `FIFTY_FIFTY_LOSS_IDS` (next S then guaranteed featured). Pity at 80 pulls, per-banner (`store.eventPity` / `store.eventGuarantee`).

| Action | Cost |
|---|---|
| Single pull (×1) | 50 gems |
| Multi pull (×10) | 450 gems |

---

## Economy / Currency

### Starting State

| Resource | Starting Value |
|---|---|
| Gems | 150 |
| Gold | 10,000 |
| Pity | 0 |
| Tower Coins | 0 |

### Gem Income Sources

| Source | Amount | Frequency |
|---|---|---|
| Daily quests (all 5) | 74 gems | Daily |
| Daily login — day 2 | 30 gems | Per cycle (7 days) |
| Daily login — day 4 | 50 gems | Per cycle |
| Daily login — day 6 | 60 gems | Per cycle |
| Daily login — day 7 | 120 gems | Per cycle |
| Story stage part 1 | 50 gems | One-time |
| Story stage part 2 | 75 gems | One-time |
| Story stage part 3 | 100 gems | One-time |
| Tower boss floor | `30 + floor(floor/10) × 5` gems | Per floor |

### Gold Income Sources

| Source | Amount | Frequency |
|---|---|---|
| Daily quests (all 5) | 2,200 gold | Daily |
| Daily login — day 1 | 400 gold | Per cycle |
| Daily login — day 3 | 800 gold | Per cycle |
| Daily login — day 5 | 1,500 gold | Per cycle |
| Daily login — day 7 | 3,000 gold | Per cycle |
| Story part 1 | 50 gold | One-time |
| Story part 2 | 150 gold | One-time |
| Story part 3 | 400 gold | One-time |
| Tower floor | `200 + floor × 80` gold | Per floor |

### Daily Quest Details

| Quest ID | Target | Gems | Gold |
|---|---|---|---|
| `win_battles` | Win 3 battles | 12 | 500 |
| `use_trump` | Use Trump Card 3× | 18 | 0 |
| `clear_stage` | Clear 1 story stage | 12 | 1,000 |
| `hero_summon` | Summon 1 hero | 22 | 500 |
| `hero_level` | Level up 1 hero | 10 | 200 |
| **Total** | | **74 gems** | **2,200 gold** |

### 7-Day Login Cycle

| Day | Gems | Gold |
|---|---|---|
| 1 | 0 | 400 |
| 2 | 30 | 0 |
| 3 | 0 | 800 |
| 4 | 50 | 0 |
| 5 | 0 | 1,500 |
| 6 | 60 | 0 |
| 7 ★ | 120 | 3,000 |
| **7-day total** | **260 gems** | **5,700 gold** |

### Major Gem Costs

| Action | Cost |
|---|---|
| Single summon (×1) | 50 gems |
| Multi summon (×10) | 450 gems |

---

## Tower (`src/data/towerData.js`)

### Enemy Scaling

```
mult = 1 + sqrt(max(0, floor - 1)) × 0.30

// Floor 1  → 1.00×  |  Floor 10 → ~1.90×
// Floor 50 → ~3.10× |  Floor 100 → ~3.98×
// Floor 200 → ~5.23×
```

### Reward Formula

Gold and coins scale on the **same sqrt curve** as enemy stats (`mult = 1 + sqrt(max(0, floor-1)) × STAT_SCALE_PER_FLOOR`) — gems remain flat and only drop on boss floors:

```js
mult  = 1 + Math.sqrt(Math.max(0, floor - 1)) * STAT_SCALE_PER_FLOOR   // 0.30
gold  = Math.round(100 * mult)
gems  = isBossFloor ? 30 + Math.floor(floor / 10) * 5 : 0
coins = Math.round(4 * mult) + (isBossFloor ? 5 : 0)
// A full 1→300 climb totals ~5,495 coins — sized against the tower shop's own economy
```

### Floor Types

| Floor # | Type |
|---|---|
| `floor % 10 === 0` | Boss floor (gems rewarded) |
| 10, 50, 100, 150, 200, 250, 300 (`FLOOR_MILESTONES`) | Milestone boss |
| All others | Regular floor |

### Weekly Reset

Reset key (`getCurrentWeekKey()`) = local-date string of the current week's Monday. On a genuine new-week transition, `towerCurrentFloor` resets to 1 and `towerWeeklyBest` resets to 0 — `towerHighestFloor` (all-time record) is never reset.

### Difficulty Labels (`getFloorDifficulty(floor)` in towerData.js)

| Floor Range | Label | Color |
|---|---|---|
| 1–24 | EASY | `#059669` |
| 25–49 | NORMAL | `#0891B2` |
| 50–74 | HARD | `#E11D48` |
| 75–99 | EPIC | `#9B59B6` |
| 100–149 | LEGENDARY | `#F72585` |
| 150–199 | ASCENDANT | `#38BDF8` |
| 200–249 | MYTHIC | `#FFD700` |
| 250–300 | TRANSCENDENT | `#FFFFFF` |

---

## Player Level System (`src/utils/playerLevel.js`)

### XP-to-Next-Level Formula

```js
xpToNextLevel(level) = 200 + level × 80

// L1→2: 280  |  L10→11: 1000  |  L50→51: 4200  |  L98→99: 8040
```

### XP Sources

| Source | XP per Unit |
|---|---|
| Stage part 1 cleared | 200 |
| Stage part 2 cleared | 350 |
| Stage part 3 cleared | 600 |
| Hero owned — rank C | 80 |
| Hero owned — rank B | 200 |
| Hero owned — rank A | 400 |
| Hero owned — rank S | 800 |
| Hero level-up (each level above 1) | 150 |
| Daily streak (each day) | 80 |

Player level cap: **99**.

---

## Store Actions — Quick Reference (`src/store/gameStore.js`)

| Action | Signature | Returns | Notes |
|---|---|---|---|
| `addGems` | `(amount)` | void | |
| `spendGems` | `(amount)` | `boolean` | false = insufficient |
| `addGold` | `(amount)` | void | |
| `spendGold` | `(amount)` | `boolean` | false = insufficient |
| `addHero` | `(heroId)` | void | Creates entry or increments copies |
| `levelUpHero` | `(heroId)` | `boolean` | false = max level or no gold |
| `fuseHero` | `(heroId)` | `{ok, newRank?}` or `{ok:false, reason}` | reason: `copies\|max_rank\|gold` |
| `transcendHero` | `(heroId)` | `{ok, newMaxLevel?}` or `{ok:false, reason}` | reason: `copies\|max\|gold` |
| `ascendHero` | `(heroId)` | `{ok}` or `{ok:false, reason}` | reason: `not_owned\|max\|missing_item\|invalid_rank` |
| `convertExcessCopies` | `(heroId, count)` | void | Copies → tower coins |
| `completeTowerFloor` | `(floor, rewards)` | `{ascensionDrop}` | Drops item on boss floors; rejects unless `floor === currentFloor` |
| `claimDailyReward` | `()` | `{reward, newStreak, dayIdx}` or null | null = already claimed today |
| `claimQuestReward` | `(questId, gems, gold)` | `boolean` | false = not completed or already claimed |
| `performSummon` | `(heroIds[], cost)` | `boolean` | false = insufficient gems |
| `buyTowerBundle` | `(type, amount, cost)` | `{ok}` or `{ok:false, reason}` | type: `gems\|gold` |
| `purchaseAscensionItem` | `(itemId, qty)` | `{ok}` or `{ok:false, reason}` | |
| `trackAchievementProgress` | `(key, delta?)` | void | delta defaults to 1 |
| `setMaxAchievementProgress` | `(key, value)` | void | Only increases, never decreases |
| `claimAchievementReward` | `(achievementId)` | `boolean` | |

### Zustand Patterns — Invariants

```js
// CORRECT — reading state inside a set() updater
set(state => ({ gold: state.gold - cost }))

// WRONG — stale closure (state from outer scope may be outdated)
const state = get();
set({ gold: state.gold - cost });   // only safe for synchronous, single-field updates

// Always call triggerSync() after any economy-affecting change
// (gems, gold, towerCoins, heroCollection, completedChapters)
```

### completeTowerFloor Guard

```js
// Rejects (returns { ascensionDrop: null }, grants nothing) unless BOTH:
//   floor <= TOWER_MAX_FLOOR (300)
//   floor === towerCurrentFloor   ← strict equality, not just "not less than":
//                                    blocks replay-farming an already-cleared floor
//                                    AND blocks skipping/forging ahead of the current floor
// This guard is the ONLY anti-farm protection for tower rewards.
```

---

## Common Invariants / Gotchas

| Rule | Why it matters |
|---|---|
| `effectiveRank ?? hero.rank` everywhere | Fusion changes effectiveRank; base rank never changes |
| `skill.cost × 20` = energy cost | CLAUDE.md #11 — the data stores raw multiplier |
| Summon pity resets to 0 on any S pull | Don't forget to reset pity counter in `performSummon` |
| Stage IDs are `chapterId × 100 + part` | `stageId % 10 = part`, `floor(stageId / 100) = chapter` |
| Tower floor guard requires `floor === currentFloor` (and `<= 300`) | Remove or bypass this only for testing — it prevents infinite farming |
| `localDateStr()` uses local time, not UTC | Tower weekly key and quest reset must also use local dates |
| `SOVEREIGN` heroes: `hero.sovereign = true`, rank stays `'S'` | Fusion caps at S; SOVEREIGN rank is display-only via effectiveRank logic |
| Enemy images loaded via `require()` at data-file level | Never construct image paths dynamically — Metro bundler can't resolve them |
