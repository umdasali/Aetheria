import { HEROES } from '../data/heroes';

const VALID_HERO_IDS   = new Set(HEROES.map(h => h.id));
const VALID_RANKS      = new Set(['C', 'B', 'A', 'S', 'SOVEREIGN', null]);
const ASCENSION_ITEM_IDS = ['aetheria_core', 'feather_of_hope', 'lost_butterfly', 'broken_wing'];

export function sanitizeState(raw) {
  if (!raw || typeof raw !== 'object') return null;

  return {
    ...raw,
    gems:  Math.min(Math.max(0, raw.gems  || 0), 9_999_999),
    gold:  Math.min(Math.max(0, raw.gold  || 0), 99_999_999),
    pity:  Math.min(Math.max(0, raw.pity  || 0), 90),

    ownedHeroes: (raw.ownedHeroes || []).filter(id => VALID_HERO_IDS.has(id)),
    team:        (raw.team        || []).filter(id => VALID_HERO_IDS.has(id)).slice(0, 3),

    towerHighestFloor: Math.min(Math.max(0, raw.towerHighestFloor || 0), 200),
    towerCurrentFloor: Math.min(Math.max(1, raw.towerCurrentFloor || 1), 201),

    heroCollection: Object.fromEntries(
      Object.entries(raw.heroCollection || {})
        .filter(([id]) => VALID_HERO_IDS.has(id))
        .map(([id, data]) => [id, {
          level:         Math.min(Math.max(1, data.level        || 1), 30),
          copies:        Math.max(0, data.copies       || 1),
          effectiveRank: VALID_RANKS.has(data.effectiveRank) ? data.effectiveRank : null,
          transcendence: Math.min(Math.max(0, data.transcendence || 0), 4),
          ascension:     Math.min(Math.max(0, data.ascension    || 0), 3),
        }])
    ),

    ascensionInventory: Object.fromEntries(
      ASCENSION_ITEM_IDS.map(id => [
        id,
        Math.min(Math.max(0, (raw.ascensionInventory?.[id]) || 0), 9999),
      ])
    ),
  };
}
