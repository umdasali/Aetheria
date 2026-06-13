// ─── Ascension Items — Tower Shop consumables ─────────────────────────────────
// Each item is rank-gated: heroes can only be ascended with the matching item.
// Colors reference RANK keys so TowerShopScreen can derive them from RANK[].bg.

export const ASCENSION_ITEMS = [
  {
    id:        'aetheria_core',
    name:      "Aetheria's Core",
    rankKey:   'SOVEREIGN',
    rankLabel: 'SOVEREIGN',
    forRanks:  ['SOVEREIGN'],
    price:     800,
    image:     require('../../assets/Character-Ascension/aetheria-core.png'),
    lore:      'Born at the convergence of all five factions, this crystallized fragment pulses with the raw heartbeat of the realm itself. Only those who have surpassed all mortal limits may channel it.',
  },
  {
    id:        'feather_of_hope',
    name:      'Feathers of Hope',
    rankKey:   'S',
    rankLabel: 'S RANK',
    forRanks:  ['S'],
    price:     500,
    image:     require('../../assets/Character-Ascension/feather-of-hope.webp'),
    lore:      'Plucked from wings that refused to break. Each feather holds the last breath of a champion who chose to fall standing rather than kneel.',
  },
  {
    id:        'lost_butterfly',
    name:      'The Lost Butterfly',
    rankKey:   'A',
    rankLabel: 'A RANK',
    forRanks:  ['A'],
    price:     300,
    image:     require('../../assets/Character-Ascension/the-lost-butterfly.png'),
    lore:      'A spirit that drifted between worlds for centuries, preserved in amber silence. Even frozen, its wings remember the wind — and the strength it carried.',
  },
  {
    id:        'broken_wing',
    name:      'Broken Wing of Lost Hope',
    rankKey:   'B',
    rankLabel: 'B / C RANK',
    forRanks:  ['B', 'C'],
    price:     150,
    image:     require('../../assets/Character-Ascension/the-lost-hope.png'),
    lore:      'Half a vow. Half a flight. Torn from something greater, yet it refuses to accept the journey is over. Even shattered, its power endures.',
  },
];

// Stat multiplier per ascension tier (index = tier 0..3)
export const ASCENSION_STAT_MULT = [1.0, 1.15, 1.30, 1.50];

export const ASCENSION_MAX = 3;

// Maps hero's effectiveRank → the item id needed for ascension
export const RANK_TO_ASCENSION_ITEM_ID = {
  SOVEREIGN: 'aetheria_core',
  S:         'feather_of_hope',
  A:         'lost_butterfly',
  B:         'broken_wing',
  C:         'broken_wing',
};

export function getAscensionItemById(id) {
  return ASCENSION_ITEMS.find(i => i.id === id) ?? null;
}
