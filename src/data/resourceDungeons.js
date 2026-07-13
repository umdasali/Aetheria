// ─── Resource Dungeons ────────────────────────────────────────────────────────
// Daily, repeatable farming stages that drop the two core upgrade resources:
//   • Gilded Vault      → Gold  (level-up / fusion / transcendence)
//   • Ascendant Grotto  → Ascension materials, rank-gated
//   • Void Sanctum      → Mixed ascension materials at moderate rate
// Each dungeon has 3 difficulty tiers (I/II/III): tougher enemies, bigger rewards.
// A SHARED daily attempt pool gates how many runs you get per day (see store:
// dungeonAttemptsUsed / dungeonResetDate, reset at local midnight). Out of
// attempts? Refill with gems. Battles reuse the engine via Battle's dungeonMode.

import { ENEMY_GROUPS } from './enemies';
import { getAscensionItemById } from './ascensionItems';
import { C } from '../theme/colors';

export const DAILY_DUNGEON_ATTEMPTS = 6;   // free runs per day (shared across dungeons)
export const DUNGEON_REFILL_COST    = 50;  // gems to refill
export const DUNGEON_REFILL_AMOUNT  = 3;   // attempts granted per refill

export const DUNGEON_DEFS = [
  {
    id:         'gilded_vault',
    name:       'Gilded Vault',
    subtitle:   'Hoarded gold for the taking',
    lore:       'Deep beneath the ruins of the Emberveil war camps, the victors buried their fortune - guarded by greed-driven phantoms who never truly died.',
    rewardType: 'gold',
    accent:     C.GOLD,
    icon:       'cash-outline',
    image:      require('../../assets/dungeons/gilded_vault.webp'),
    gradientColors: ['#7A4500', '#a54e06a6'],
    baseGroupIndex: 8,
    tiers: [
      { tier: 1, label: 'I',   mult: 2.0, diff: 'EASY',   reward: { gold: 7000  } },
      { tier: 2, label: 'II',  mult: 3.5, diff: 'HARD',   reward: { gold: 16000 } },
      { tier: 3, label: 'III', mult: 5.5, diff: 'MYTHIC', reward: { gold: 32000 } },
    ],
  },
  {
    id:         'ascendant_grotto',
    name:       'Ascendant Grotto',
    subtitle:   'Rank-gated ascension materials',
    lore:       'The Grotto pulses with raw aetheria energy - wings, butterflies, and feathers crystallised from fallen champions who gave everything to ascend.',
    rewardType: 'material',
    accent:     C.PRIMARY_LIGHT,
    icon:       'sparkles-outline',
    image:      require('../../assets/dungeons/ascendant_grotto.webp'),
    gradientColors: ['#3B1B6A', '#0E0720'],
    baseGroupIndex: 27,
    tiers: [
      { tier: 1, label: 'I',   mult: 2.5, diff: 'NORMAL', reward: { gold: 2000, material: { itemId: 'broken_wing',    qty: 4 } } },
      { tier: 2, label: 'II',  mult: 4.0, diff: 'HARD',   reward: { gold: 4000, material: { itemId: 'lost_butterfly',  qty: 2 } } },
      { tier: 3, label: 'III', mult: 6.0, diff: 'MYTHIC', reward: { gold: 8000, material: { itemId: 'feather_of_hope', qty: 1 } } },
    ],
  },
  {
    id:         'void_sanctum',
    name:       'Void Sanctum',
    subtitle:   'Mixed materials - all ranks',
    lore:       'Where the five factions\' leylines converge, the Sanctum bleeds all forms of aetheria at once. The void does not discriminate - bring the strongest to claim its bounty.',
    rewardType: 'material',
    accent:     C.CYAN,
    icon:       'planet-outline',
    image:      require('../../assets/dungeons/void_sanctum.webp'),
    gradientColors: ['#003A4A', '#020010'],
    baseGroupIndex: 15,
    tiers: [
      { tier: 1, label: 'I',   mult: 3.0, diff: 'NORMAL', reward: { gold: 1500, material: { itemId: 'broken_wing',    qty: 2 } } },
      { tier: 2, label: 'II',  mult: 5.0, diff: 'HARD',   reward: { gold: 3000, material: { itemId: 'lost_butterfly',  qty: 1 } } },
      { tier: 3, label: 'III', mult: 7.5, diff: 'MYTHIC', reward: { gold: 5000, material: { itemId: 'feather_of_hope', qty: 1 } } },
    ],
  },
];

// ─── Material Exchange Recipes ────────────────────────────────────────────────
// Lower-tier materials can be converted to higher-tier ones.
// Exchange happens in gameStore.exchangeAscensionItems().
export const MATERIAL_EXCHANGE_RECIPES = [
  {
    id:       'wing_to_butterfly',
    from:     { itemId: 'broken_wing',    qty: 8 },
    to:       { itemId: 'lost_butterfly',  qty: 1 },
    label:    '8 Broken Wings → 1 Lost Butterfly',
  },
  {
    id:       'butterfly_to_feather',
    from:     { itemId: 'lost_butterfly', qty: 4 },
    to:       { itemId: 'feather_of_hope', qty: 1 },
    label:    '4 Lost Butterflies → 1 Feather of Hope',
  },
  {
    id:       'feather_to_core',
    from:     { itemId: 'feather_of_hope', qty: 5 },
    to:       { itemId: 'aetheria_core',   qty: 1 },
    label:    '5 Feathers of Hope → 1 Aetheria\'s Core',
  },
];

const DIFF_COLOR = {
  EASY:   C.SUCCESS,
  NORMAL: C.CYAN,
  HARD:   C.DANGER,
  MYTHIC: C.GOLD,
};
export const getDiffColor = (diff) => DIFF_COLOR[diff] || C.TEXT_MUTED;

export function getDungeonById(id) {
  return DUNGEON_DEFS.find(d => d.id === id) || null;
}

export function getDungeonTier(dungeonId, tier) {
  const d = getDungeonById(dungeonId);
  return d ? (d.tiers.find(t => t.tier === tier) || null) : null;
}

// Scaled enemy group for a dungeon tier - mirrors the Tower's stat-scaling approach.
export function getDungeonEnemyGroup(dungeonId, tier) {
  const d = getDungeonById(dungeonId);
  if (!d) return ENEMY_GROUPS[0];
  const t    = d.tiers.find(x => x.tier === tier) || d.tiers[0];
  const base = ENEMY_GROUPS[d.baseGroupIndex % ENEMY_GROUPS.length];
  const mult = t.mult;
  return {
    id:          `dungeon_${dungeonId}_${tier}`,
    name:        `${d.name} - Tier ${t.label}`,
    description: d.subtitle,
    enemies: base.enemies.map(e => ({
      ...e,
      id:    `dgn_${dungeonId}_${tier}_${e.id}`,
      hp:    Math.round(e.hp  * mult),
      maxHp: Math.round(e.hp  * mult),
      atk:   Math.round(e.atk * mult),
      def:   Math.round(e.def * mult),
    })),
  };
}

// Reward object passed to Battle → granted by gameStore.completeDungeon on win.
// Shape: { gold, gems, material: { itemId, qty } | null }
export function getDungeonReward(dungeonId, tier) {
  const t = getDungeonTier(dungeonId, tier);
  if (!t) return { gold: 0, gems: 0, material: null };
  return {
    gold:     t.reward.gold || 0,
    gems:     t.reward.gems || 0,
    material: t.reward.material || null,
  };
}

// Human-readable summary of a tier's drop, for UI labels.
export function getRewardLabel(dungeonId, tier) {
  const t = getDungeonTier(dungeonId, tier);
  if (!t) return '';
  if (t.reward.material) {
    const item = getAscensionItemById(t.reward.material.itemId);
    return `${item?.name ?? 'Material'} ×${t.reward.material.qty}`;
  }
  return `${(t.reward.gold || 0).toLocaleString()} Gold`;
}
