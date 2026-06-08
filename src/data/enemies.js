// Enemy tier types: 'mob' | 'mini-boss' | 'boss'
// Stage IDs: chapter*100+part  (101=Ch1P1, 103=Ch1P3, 1503=Ch15P3)

export const ENEMY_IMAGES = {
  mob_001: require('../../assets/enemy/mob_001.webp'),
  mob_002: require('../../assets/enemy/mob_002.webp'),
  mob_003: require('../../assets/enemy/mob_003.webp'),
  mob_004: require('../../assets/enemy/mob_004.webp'),
  mob_005: require('../../assets/enemy/mob_005.webp'),
  mob_006: require('../../assets/enemy/mob_006.webp'),
  mob_007: require('../../assets/enemy/mob_007.webp'),
  mob_008: require('../../assets/enemy/mob_008.webp'),
  mob_009: require('../../assets/enemy/mob_009.webp'),
  mob_010: require('../../assets/enemy/mob_010.webp'),
  mob_011: require('../../assets/enemy/mob_011.webp'),
  mob_012: require('../../assets/enemy/mob_012.webp'),
  mob_013: require('../../assets/enemy/mob_013.webp'),
  mob_014: require('../../assets/enemy/mob_014.webp'),
  'mini-boss_001': require('../../assets/enemy/mini-boss_001.webp'),
  'mini-boss_002': require('../../assets/enemy/mini-boss_002.webp'),
  'mini-boss_003': require('../../assets/enemy/mini-boss_003.webp'),
  'mini-boss_004': require('../../assets/enemy/mini-boss_004.webp'),
  'mini-boss_005': require('../../assets/enemy/mini-boss_005.webp'),
  'mini-boss_006': require('../../assets/enemy/mini-boss_006.webp'),
  'mini-boss_007': require('../../assets/enemy/mini-boss_007.webp'),
  'mini-boss_008': require('../../assets/enemy/mini-boss_008.webp'),
  'mini-boss_009': require('../../assets/enemy/mini-boss_009.webp'),
  'mini-boss_010': require('../../assets/enemy/mini-boss_010.webp'),
  'mini-boss_011': require('../../assets/enemy/mini-boss_011.webp'),
  'mini-boss_012': require('../../assets/enemy/mini-boss_012.webp'),
  'mini-boss_013': require('../../assets/enemy/mini-boss_013.webp'),
  boss_001: require('../../assets/enemy/boss_001.webp'),
  boss_002: require('../../assets/enemy/boss_002.webp'),
  boss_003: require('../../assets/enemy/boss_003.webp'),
  boss_004: require('../../assets/enemy/boss_004.webp'),
  boss_005: require('../../assets/enemy/boss_005.webp'),
  boss_006: require('../../assets/enemy/boss_006.webp'),
  boss_007: require('../../assets/enemy/boss_007.webp'),
  boss_008: require('../../assets/enemy/boss_008.webp'),
  boss_009: require('../../assets/enemy/boss_009.webp'),
  boss_010: require('../../assets/enemy/boss_010.webp'),
  boss_011: require('../../assets/enemy/boss_011.webp'),
  boss_012: require('../../assets/enemy/boss_012.webp'),
  boss_013: require('../../assets/enemy/boss_013.webp'),
  boss_014: require('../../assets/enemy/boss_014.webp'),
  boss_015: require('../../assets/enemy/boss_015.webp'),
  mob_015: require('../../assets/enemy/mob_015.webp'),
  mob_016: require('../../assets/enemy/mob_016.webp'),
  mob_017: require('../../assets/enemy/mob_017.webp'),
  mob_018: require('../../assets/enemy/mob_018.webp'),
  mob_019: require('../../assets/enemy/mob_019.webp'),
  mob_020: require('../../assets/enemy/mob_020.webp'),
  mob_021: require('../../assets/enemy/mob_021.webp'),
  mob_022: require('../../assets/enemy/mob_022.webp'),
  mob_023: require('../../assets/enemy/mob_023.webp'),
  mob_024: require('../../assets/enemy/mob_024.webp'),
  mob_025: require('../../assets/enemy/mob_025.webp'),
  mob_026: require('../../assets/enemy/mob_026.webp'),
  'mini-boss_014': require('../../assets/enemy/mini-boss_014.webp'),
  'mini-boss_015': require('../../assets/enemy/mini-boss_015.webp'),
  'mini-boss_016': require('../../assets/enemy/mini-boss_016.webp'),
  'mini-boss_017': require('../../assets/enemy/mini-boss_017.webp'),
  'mini-boss_018': require('../../assets/enemy/mini-boss_018.webp'),
  boss_016: require('../../assets/enemy/boss_016.webp'),
  boss_017: require('../../assets/enemy/boss_017.webp'),
  boss_018: require('../../assets/enemy/boss_018.webp'),
  boss_019: require('../../assets/enemy/boss_019.webp'),
  boss_020: require('../../assets/enemy/boss_020.webp'),
  mob_027: require('../../assets/enemy/mob_027.webp'),
  mob_028: require('../../assets/enemy/mob_028.webp'),
  mob_029: require('../../assets/enemy/mob_029.webp'),
  mob_030: require('../../assets/enemy/mob_030.webp'),
  mob_031: require('../../assets/enemy/mob_031.webp'),
  mob_032: require('../../assets/enemy/mob_032.webp'),
  'mini-boss_019': require('../../assets/enemy/mini-boss_019.webp'),
  'mini-boss_020': require('../../assets/enemy/mini-boss_020.webp'),
  'mini-boss_021': require('../../assets/enemy/mini-boss_021.webp'),
  'mini-boss_022': require('../../assets/enemy/mini-boss_022.webp'),
  'mini-boss_023': require('../../assets/enemy/mini-boss_023.webp'),
  boss_021: require('../../assets/enemy/boss_021.webp'),
  boss_022: require('../../assets/enemy/boss_022.webp'),
  boss_023: require('../../assets/enemy/boss_023.webp'),
  boss_024: require('../../assets/enemy/boss_024.webp'),
  boss_025: require('../../assets/enemy/boss_025.webp'),
};

export const ENEMY_GROUPS = [

  // ── CH 1: SHATTERED VEIL — Lysha the Glacial Empress ──────────────────────
  {
    id: 101, chapter: 1, part: 1,
    name: 'Ice Vanguard',
    description: 'Shadow scouts and frost hounds pour from the dimensional rift to test the frontier.',
    enemies: [
      { id: 'e_101_1', name: 'Flame Scout',   tier: 'mob', imageKey: 'mob_001', hp: 1000, maxHp: 1000, atk: 130, def: 80,  skills: [{ name: 'Flame Strike',   damage: 1.2 }, { name: 'Fire Claw',       damage: 1.6 }] },
      { id: 'e_101_2', name: 'Fire Specter',   tier: 'mob', imageKey: 'mob_002', hp: 1200, maxHp: 1200, atk: 140, def: 90,  skills: [{ name: 'Ember Strike',    damage: 1.3 }, { name: 'Blaze Slash',  damage: 1.7 }] },
      { id: 'e_101_3', name: 'Shadow Hound',    tier: 'mob', imageKey: 'mob_003', hp: 1400, maxHp: 1400, atk: 155, def: 100, skills: [{ name: 'Shadow Fang',        damage: 1.3 }, { name: 'Dark Pounce',  damage: 1.8 }] },
    ],
  },
  {
    id: 102, chapter: 1, part: 2,
    name: 'Frost Commander',
    description: 'A void commander marches with elite frost soldiers toward the last standing settlement.',
    enemies: [
      { id: 'e_102_1', name: 'Fire Specter',   tier: 'mob',       imageKey: 'mob_002',       hp: 1200, maxHp: 1200, atk: 140, def: 90,  skills: [{ name: 'Ember Strike',    damage: 1.3 }, { name: 'Blaze Slash',  damage: 1.7 }] },
      { id: 'e_102_2', name: 'Shadow Hound',    tier: 'mob',       imageKey: 'mob_003',       hp: 1400, maxHp: 1400, atk: 155, def: 100, skills: [{ name: 'Shadow Fang',        damage: 1.3 }, { name: 'Dark Pounce',  damage: 1.8 }] },
      { id: 'e_102_3', name: 'Frost Commander', tier: 'mini-boss', imageKey: 'mini-boss_001', hp: 2800, maxHp: 2800, atk: 240, def: 160, skills: [{ name: 'Frost Strike',   damage: 2.0 }, { name: 'Blizzard Surge',      damage: 2.8 }] },
    ],
  },
  {
    id: 103, chapter: 1, part: 3,
    name: "Lysha's Glacier",
    description: 'The Glacial Empress Lysha emerges from the frozen void to claim the realm in eternal ice.',
    enemies: [
      { id: 'e_103_1', name: 'Shadow Hound',              tier: 'mob',       imageKey: 'mob_003',       hp: 1600, maxHp: 1600, atk: 165, def: 105, skills: [{ name: 'Shadow Fang',        damage: 1.4 }, { name: 'Dark Pounce',       damage: 1.9 }] },
      { id: 'e_103_2', name: 'Frost Commander',            tier: 'mini-boss', imageKey: 'mini-boss_001', hp: 3000, maxHp: 3000, atk: 255, def: 170, skills: [{ name: 'Frost Strike',   damage: 2.1 }, { name: 'Blizzard Surge',           damage: 3.0 }] },
      { id: 'e_103_3', name: 'Lysha the Glacial Empress', tier: 'boss',      imageKey: 'boss_001',      hp: 6000, maxHp: 6000, atk: 320, def: 200, skills: [{ name: 'Glacial Prison',   damage: 3.2 }, { name: 'Absolute Zero',        damage: 4.5 }] },
    ],
  },

  // ── CH 2: ASHEN INFERNO — Pyrevex the Ashen Drake ─────────────────────────
  {
    id: 201, chapter: 2, part: 1,
    name: 'Ember Legion',
    description: 'Fire-born wraiths and ember brutes charge from the volcanic rift, scorching everything in sight.',
    enemies: [
      { id: 'e_201_1', name: 'Shadow Wraith',    tier: 'mob', imageKey: 'mob_004', hp: 1400, maxHp: 1400, atk: 160, def: 105, skills: [{ name: 'Shadow Touch',   damage: 1.3 }, { name: 'Dark Wave',        damage: 1.7 }] },
      { id: 'e_201_2', name: 'Emberhorn Brute', tier: 'mob', imageKey: 'mob_008', hp: 1600, maxHp: 1600, atk: 175, def: 115, skills: [{ name: 'Horn Charge',   damage: 1.4 }, { name: 'Inferno Gore',    damage: 1.9 }] },
      { id: 'e_201_3', name: 'Shadow Hound',     tier: 'mob', imageKey: 'mob_003', hp: 1800, maxHp: 1800, atk: 185, def: 120, skills: [{ name: 'Shadow Fang',      damage: 1.4 }, { name: 'Dark Pounce',  damage: 1.9 }] },
    ],
  },
  {
    id: 202, chapter: 2, part: 2,
    name: 'Inferno Warden',
    description: 'An elite inferno warden commands the ember vanguard, burning all who stand in their path.',
    enemies: [
      { id: 'e_202_1', name: 'Shadow Wraith',    tier: 'mob',       imageKey: 'mob_004',       hp: 1500, maxHp: 1500, atk: 165, def: 108, skills: [{ name: 'Shadow Touch',   damage: 1.3 }, { name: 'Dark Wave',        damage: 1.8 }] },
      { id: 'e_202_2', name: 'Emberhorn Brute', tier: 'mob',       imageKey: 'mob_008',       hp: 1700, maxHp: 1700, atk: 180, def: 118, skills: [{ name: 'Horn Charge',   damage: 1.4 }, { name: 'Inferno Gore',    damage: 2.0 }] },
      { id: 'e_202_3', name: 'Inferno Warden',  tier: 'mini-boss', imageKey: 'mini-boss_002', hp: 3600, maxHp: 3600, atk: 280, def: 190, skills: [{ name: 'Inferno Wall',  damage: 2.0 }, { name: 'Blaze Prison',    damage: 2.8 }] },
    ],
  },
  {
    id: 203, chapter: 2, part: 3,
    name: "Pyrevex's Caldera",
    description: 'Pyrevex the Ashen Drake rises from the magma caldera breathing world-consuming dragonfire.',
    enemies: [
      { id: 'e_203_1', name: 'Emberhorn Brute',       tier: 'mob',       imageKey: 'mob_008',       hp: 1900, maxHp: 1900, atk: 190, def: 125, skills: [{ name: 'Horn Charge',    damage: 1.5 }, { name: 'Inferno Gore',   damage: 2.0 }] },
      { id: 'e_203_2', name: 'Inferno Warden',        tier: 'mini-boss', imageKey: 'mini-boss_002', hp: 3900, maxHp: 3900, atk: 295, def: 200, skills: [{ name: 'Inferno Wall',   damage: 2.1 }, { name: 'Blaze Prison',   damage: 3.0 }] },
      { id: 'e_203_3', name: 'Pyrevex the Ashen Drake', tier: 'boss',   imageKey: 'boss_002',      hp: 7500, maxHp: 7500, atk: 370, def: 230, skills: [{ name: 'Ashfire Breath', damage: 3.4 }, { name: 'Drake Inferno',  damage: 4.8 }] },
    ],
  },

  // ── CH 3: DAWN OF RADIANCE — Aurariel the Light Maiden ────────────────────
  {
    id: 301, chapter: 3, part: 1,
    name: 'Fallen Paladins',
    description: 'Corrupted dawn paladins and stone golems guard the defiled light shrines.',
    enemies: [
      { id: 'e_301_1', name: 'Forest Warden', tier: 'mob', imageKey: 'mob_005', hp: 1800, maxHp: 1800, atk: 190, def: 125, skills: [{ name: 'Vine Strike',   damage: 1.3 }, { name: 'Forest Smite',  damage: 1.8 }] },
      { id: 'e_301_2', name: 'Fire Specter', tier: 'mob', imageKey: 'mob_002', hp: 1900, maxHp: 1900, atk: 200, def: 130, skills: [{ name: 'Ember Strike',  damage: 1.3 }, { name: 'Blaze Slash', damage: 1.8 }] },
      { id: 'e_301_3', name: 'Light Golem',  tier: 'mob', imageKey: 'mob_006', hp: 2200, maxHp: 2200, atk: 215, def: 140, skills: [{ name: 'Radiant Slam',   damage: 1.4 }, { name: 'Light Crush',  damage: 1.9 }] },
    ],
  },
  {
    id: 302, chapter: 3, part: 2,
    name: 'Forest Knight',
    description: 'A corrupted celestial knight leads the charge against the sacred temples of radiant light.',
    enemies: [
      { id: 'e_302_1', name: 'Forest Warden',     tier: 'mob',       imageKey: 'mob_005',       hp: 1900, maxHp: 1900, atk: 195, def: 128, skills: [{ name: 'Vine Strike',     damage: 1.4 }, { name: 'Forest Smite',  damage: 1.9 }] },
      { id: 'e_302_2', name: 'Light Golem',      tier: 'mob',       imageKey: 'mob_006',       hp: 2300, maxHp: 2300, atk: 220, def: 145, skills: [{ name: 'Radiant Slam',     damage: 1.4 }, { name: 'Light Crush',  damage: 1.9 }] },
      { id: 'e_302_3', name: 'Forest Knight', tier: 'mini-boss', imageKey: 'mini-boss_003', hp: 4400, maxHp: 4400, atk: 320, def: 220, skills: [{ name: 'Forest Judgment',   damage: 2.0 }, { name: 'Nature Wrath',  damage: 2.8 }] },
    ],
  },
  {
    id: 303, chapter: 3, part: 3,
    name: "Aurariel's Sanctum",
    description: 'Aurariel the Light Maiden descends from the corrupted heavens to judge all of creation.',
    enemies: [
      { id: 'e_303_1', name: 'Light Golem',               tier: 'mob',       imageKey: 'mob_006',       hp: 2500, maxHp: 2500, atk: 230, def: 150, skills: [{ name: 'Radiant Slam',       damage: 1.5 }, { name: 'Light Crush',       damage: 2.0 }] },
      { id: 'e_303_2', name: 'Forest Knight',          tier: 'mini-boss', imageKey: 'mini-boss_003', hp: 4700, maxHp: 4700, atk: 335, def: 232, skills: [{ name: 'Forest Judgment',     damage: 2.1 }, { name: 'Nature Wrath',       damage: 3.0 }] },
      { id: 'e_303_3', name: 'Aurariel the Light Maiden', tier: 'boss',      imageKey: 'boss_003',      hp: 9000, maxHp: 9000, atk: 420, def: 270, skills: [{ name: 'Radiant Judgement', damage: 3.5 }, { name: 'Sacred Annihilation', damage: 4.8 }] },
    ],
  },

  // ── CH 4: THORNWALL — Thornqueen Sylva ────────────────────────────────────
  {
    id: 401, chapter: 4, part: 1,
    name: 'Root Horde',
    description: 'Abyss-corrupted nature beasts swarm the ancient forest, strangling its sacred roots.',
    enemies: [
      { id: 'e_401_1', name: 'Abyss Fang Ravager', tier: 'mob', imageKey: 'mob_007', hp: 2200, maxHp: 2200, atk: 220, def: 145, skills: [{ name: 'Fang Strike',  damage: 1.4 }, { name: 'Abyss Rend',    damage: 1.9 }] },
      { id: 'e_401_2', name: 'Forest Warden',        tier: 'mob', imageKey: 'mob_005', hp: 2300, maxHp: 2300, atk: 230, def: 150, skills: [{ name: 'Vine Strike',  damage: 1.4 }, { name: 'Forest Smite', damage: 1.9 }] },
      { id: 'e_401_3', name: 'Light Golem',         tier: 'mob', imageKey: 'mob_006', hp: 2600, maxHp: 2600, atk: 245, def: 160, skills: [{ name: 'Radiant Slam',  damage: 1.4 }, { name: 'Light Crush', damage: 2.0 }] },
    ],
  },
  {
    id: 402, chapter: 4, part: 2,
    name: 'Crimson Widow',
    description: "The Crimson Widow Queen and her corrupted brood guard the thorn barrier to Sylva's domain.",
    enemies: [
      { id: 'e_402_1', name: 'Abyss Fang Ravager', tier: 'mob',       imageKey: 'mob_007',       hp: 2400, maxHp: 2400, atk: 235, def: 152, skills: [{ name: 'Fang Strike',  damage: 1.4 }, { name: 'Abyss Rend',   damage: 2.0 }] },
      { id: 'e_402_2', name: 'Light Golem',         tier: 'mob',       imageKey: 'mob_006',       hp: 2700, maxHp: 2700, atk: 250, def: 162, skills: [{ name: 'Radiant Slam',  damage: 1.4 }, { name: 'Light Crush', damage: 2.0 }] },
      { id: 'e_402_3', name: 'Crimson Widow Queen', tier: 'mini-boss', imageKey: 'mini-boss_009', hp: 5200, maxHp: 5200, atk: 360, def: 250, skills: [{ name: 'Web of Blood', damage: 2.3 }, { name: 'Crimson Bite', damage: 3.0 }] },
    ],
  },
  {
    id: 403, chapter: 4, part: 3,
    name: "Thornqueen's Grove",
    description: 'Thornqueen Sylva rises from the corrupted World Tree, commanding nature as a weapon of war.',
    enemies: [
      { id: 'e_403_1', name: 'Abyss Fang Ravager', tier: 'mob',       imageKey: 'mob_007',       hp: 2700, maxHp: 2700, atk: 252, def: 165, skills: [{ name: 'Fang Strike',      damage: 1.5 }, { name: 'Abyss Rend',      damage: 2.1 }] },
      { id: 'e_403_2', name: 'Crimson Widow Queen', tier: 'mini-boss', imageKey: 'mini-boss_009', hp: 5600, maxHp: 5600, atk: 378, def: 262, skills: [{ name: 'Web of Blood',     damage: 2.4 }, { name: 'Crimson Bite',    damage: 3.2 }] },
      { id: 'e_403_3', name: 'Thornqueen Sylva',    tier: 'boss',      imageKey: 'boss_004',      hp: 10500, maxHp: 10500, atk: 470, def: 310, skills: [{ name: 'Thorned Dominion', damage: 3.6 }, { name: "Nature's Wrath",  damage: 4.9 }] },
    ],
  },

  // ── CH 5: VERDANT RUIN — Verdara the Bloom Devourer ───────────────────────
  {
    id: 501, chapter: 5, part: 1,
    name: 'Bloom Swarm',
    description: 'Celestial bloom guardians twisted by dark corruption spread devouring bloom spores across the forest.',
    enemies: [
      { id: 'e_501_1', name: 'Water Guardian', tier: 'mob', imageKey: 'mob_014', hp: 2600, maxHp: 2600, atk: 250, def: 165, skills: [{ name: 'Water Surge',  damage: 1.5 }, { name: 'Tidal Strike', damage: 2.0 }] },
      { id: 'e_501_2', name: 'Abyss Fang Ravager',       tier: 'mob', imageKey: 'mob_007', hp: 2700, maxHp: 2700, atk: 265, def: 172, skills: [{ name: 'Fang Strike', damage: 1.5 }, { name: 'Abyss Rend',   damage: 2.0 }] },
      { id: 'e_501_3', name: 'Light Golem',               tier: 'mob', imageKey: 'mob_006', hp: 3000, maxHp: 3000, atk: 278, def: 180, skills: [{ name: 'Radiant Slam', damage: 1.5 }, { name: 'Light Crush', damage: 2.1 }] },
    ],
  },
  {
    id: 502, chapter: 5, part: 2,
    name: 'Frostveil Sorceress',
    description: 'The Frostveil Sorceress channels corrupted bloom energy, turning life itself into a weapon.',
    enemies: [
      { id: 'e_502_1', name: 'Water Guardian', tier: 'mob',       imageKey: 'mob_014',       hp: 2800, maxHp: 2800, atk: 262, def: 170, skills: [{ name: 'Water Surge',    damage: 1.5 }, { name: 'Tidal Strike',  damage: 2.0 }] },
      { id: 'e_502_2', name: 'Abyss Fang Ravager',       tier: 'mob',       imageKey: 'mob_007',       hp: 2900, maxHp: 2900, atk: 272, def: 178, skills: [{ name: 'Fang Strike',    damage: 1.5 }, { name: 'Abyss Rend',    damage: 2.1 }] },
      { id: 'e_502_3', name: 'Frostveil Sorceress',       tier: 'mini-boss', imageKey: 'mini-boss_010', hp: 6000, maxHp: 6000, atk: 400, def: 280, skills: [{ name: 'Frost Nova',     damage: 2.4 }, { name: 'Blizzard Veil', damage: 3.3 }] },
    ],
  },
  {
    id: 503, chapter: 5, part: 3,
    name: "Verdara's Bloom",
    description: 'Verdara the Bloom Devourer unfurls from the dying forest core, consuming all life in her path.',
    enemies: [
      { id: 'e_503_1', name: 'Abyss Fang Ravager',        tier: 'mob',       imageKey: 'mob_007',       hp: 3100, maxHp: 3100, atk: 282, def: 184, skills: [{ name: 'Fang Strike',    damage: 1.6 }, { name: 'Abyss Rend',       damage: 2.2 }] },
      { id: 'e_503_2', name: 'Frostveil Sorceress',        tier: 'mini-boss', imageKey: 'mini-boss_010', hp: 6400, maxHp: 6400, atk: 418, def: 292, skills: [{ name: 'Frost Nova',     damage: 2.5 }, { name: 'Blizzard Veil',    damage: 3.4 }] },
      { id: 'e_503_3', name: 'Verdara the Bloom Devourer', tier: 'boss',      imageKey: 'boss_005',      hp: 12000, maxHp: 12000, atk: 520, def: 350, skills: [{ name: 'Bloom Devour',   damage: 3.8 }, { name: 'Corrupted Garden', damage: 5.0 }] },
    ],
  },

  // ── CH 6: SHADOWBLOOM — Nyx Shadowbloom ───────────────────────────────────
  {
    id: 601, chapter: 6, part: 1,
    name: 'Thorn Wraiths',
    description: 'Rotclaw ghouls and frost sirens march under the dark bloom banner toward the last living forests.',
    enemies: [
      { id: 'e_601_1', name: 'Rotclaw Ghoul',           tier: 'mob', imageKey: 'mob_010', hp: 3100, maxHp: 3100, atk: 292, def: 190, skills: [{ name: 'Decay Strike', damage: 1.4 }, { name: 'Rotting Claw',    damage: 1.9 }] },
      { id: 'e_601_2', name: 'Frostveil Siren',          tier: 'mob', imageKey: 'mob_009', hp: 3200, maxHp: 3200, atk: 302, def: 196, skills: [{ name: 'Frost Song',   damage: 1.4 }, { name: 'Blizzard Aria',   damage: 2.0 }] },
      { id: 'e_601_3', name: 'Forest Marionette', tier: 'mob', imageKey: 'mob_013', hp: 3500, maxHp: 3500, atk: 318, def: 205, skills: [{ name: 'Vine Slash', damage: 1.5 }, { name: 'Root Bind', damage: 2.1 }] },
    ],
  },
  {
    id: 602, chapter: 6, part: 2,
    name: 'Fallen Valkyrie',
    description: "The Celestial Fallen Valkyrie guards the entrance to Nyx's black garden of corruption.",
    enemies: [
      { id: 'e_602_1', name: 'Frostveil Siren',          tier: 'mob',       imageKey: 'mob_009',       hp: 3300, maxHp: 3300, atk: 308, def: 200, skills: [{ name: 'Frost Song',         damage: 1.5 }, { name: 'Blizzard Aria',    damage: 2.1 }] },
      { id: 'e_602_2', name: 'Rotclaw Ghoul',            tier: 'mob',       imageKey: 'mob_010',       hp: 3400, maxHp: 3400, atk: 315, def: 205, skills: [{ name: 'Decay Strike',        damage: 1.5 }, { name: 'Rotting Claw',     damage: 2.1 }] },
      { id: 'e_602_3', name: 'Celestial Fallen Valkyrie', tier: 'mini-boss', imageKey: 'mini-boss_011', hp: 7000, maxHp: 7000, atk: 450, def: 315, skills: [{ name: 'Fallen Judgement',   damage: 2.4 }, { name: 'Corruption Spear', damage: 3.3 }] },
    ],
  },
  {
    id: 603, chapter: 6, part: 3,
    name: "Nyx's Black Garden",
    description: "Nyx Shadowbloom emerges from the corrupted World Tree's heart — darkness wearing nature's crown.",
    enemies: [
      { id: 'e_603_1', name: 'Rotclaw Ghoul',            tier: 'mob',       imageKey: 'mob_010',       hp: 3700, maxHp: 3700, atk: 328, def: 212, skills: [{ name: 'Decay Strike',      damage: 1.6 }, { name: 'Rotting Claw',    damage: 2.2 }] },
      { id: 'e_603_2', name: 'Celestial Fallen Valkyrie', tier: 'mini-boss', imageKey: 'mini-boss_011', hp: 7500, maxHp: 7500, atk: 470, def: 328, skills: [{ name: 'Fallen Judgement',  damage: 2.5 }, { name: 'Corruption Spear', damage: 3.5 }] },
      { id: 'e_603_3', name: 'Nyx Shadowbloom',           tier: 'boss',      imageKey: 'boss_006',      hp: 13500, maxHp: 13500, atk: 575, def: 390, skills: [{ name: 'Shadow Bloom',     damage: 3.8 }, { name: 'Dark Genesis',    damage: 5.0 }] },
    ],
  },

  // ── CH 7: ABYSSAL GATE — The Abyss Sovereign ──────────────────────────────
  {
    id: 701, chapter: 7, part: 1,
    name: 'Void Legions',
    description: 'Armies of the abyss pour through the torn dimensional gate as reality fractures completely.',
    enemies: [
      { id: 'e_701_1', name: 'Frostveil Siren',    tier: 'mob', imageKey: 'mob_009', hp: 3700, maxHp: 3700, atk: 332, def: 215, skills: [{ name: 'Frost Song',  damage: 1.5 }, { name: 'Blizzard Aria', damage: 2.1 }] },
      { id: 'e_701_2', name: 'Rotclaw Ghoul',      tier: 'mob', imageKey: 'mob_010', hp: 3900, maxHp: 3900, atk: 342, def: 222, skills: [{ name: 'Decay Strike', damage: 1.5 }, { name: 'Rotting Claw', damage: 2.1 }] },
      { id: 'e_701_3', name: 'Stormbreaker Titan', tier: 'mob', imageKey: 'mob_011', hp: 4200, maxHp: 4200, atk: 358, def: 232, skills: [{ name: 'Storm Crush',  damage: 1.6 }, { name: 'Thunder Slam', damage: 2.2 }] },
    ],
  },
  {
    id: 702, chapter: 7, part: 2,
    name: 'Abyss Prophet',
    description: 'The Abyss Prophet coordinates the void assault, his dark visions guiding armies through the gate.',
    enemies: [
      { id: 'e_702_1', name: 'Rotclaw Ghoul',      tier: 'mob',       imageKey: 'mob_010',       hp: 4000, maxHp: 4000, atk: 348, def: 226, skills: [{ name: 'Decay Strike',  damage: 1.6 }, { name: 'Rotting Claw',  damage: 2.2 }] },
      { id: 'e_702_2', name: 'Stormbreaker Titan', tier: 'mob',       imageKey: 'mob_011',       hp: 4300, maxHp: 4300, atk: 362, def: 235, skills: [{ name: 'Storm Crush',   damage: 1.6 }, { name: 'Thunder Slam',  damage: 2.2 }] },
      { id: 'e_702_3', name: 'Abyss Prophet',      tier: 'mini-boss', imageKey: 'mini-boss_007', hp: 8200, maxHp: 8200, atk: 500, def: 350, skills: [{ name: 'Dark Prophecy', damage: 2.3 }, { name: 'Abyss Command', damage: 3.1 }] },
    ],
  },
  {
    id: 703, chapter: 7, part: 3,
    name: 'The Abyss Sovereign',
    description: 'The ancient Abyss Sovereign descends from his obsidian throne, reality bending at his command.',
    enemies: [
      { id: 'e_703_1', name: 'Stormbreaker Titan',  tier: 'mob',       imageKey: 'mob_011',       hp: 4600, maxHp: 4600, atk: 375, def: 242, skills: [{ name: 'Storm Crush',     damage: 1.7 }, { name: 'Thunder Slam',    damage: 2.3 }] },
      { id: 'e_703_2', name: 'Abyss Prophet',       tier: 'mini-boss', imageKey: 'mini-boss_007', hp: 8800, maxHp: 8800, atk: 522, def: 365, skills: [{ name: 'Dark Prophecy',   damage: 2.4 }, { name: 'Abyss Command',   damage: 3.3 }] },
      { id: 'e_703_3', name: 'The Abyss Sovereign', tier: 'boss',      imageKey: 'boss_007',      hp: 15500, maxHp: 15500, atk: 640, def: 430, skills: [{ name: 'Abyss Command',  damage: 3.9 }, { name: 'Sovereign Curse', damage: 5.2 }] },
    ],
  },

  // ── CH 8: ECLIPSE RISING — Radiant Dragon Emperor ─────────────────────────
  {
    id: 801, chapter: 8, part: 1,
    name: 'Eclipse Vanguard',
    description: 'Puppet soldiers and venomtail huntresses march as the sky turns black above the realm.',
    enemies: [
      { id: 'e_801_1', name: 'Stormbreaker Titan',       tier: 'mob', imageKey: 'mob_011', hp: 4300, maxHp: 4300, atk: 368, def: 238, skills: [{ name: 'Storm Crush',  damage: 1.6 }, { name: 'Thunder Slam',    damage: 2.2 }] },
      { id: 'e_801_2', name: 'Dark Huntress',       tier: 'mob', imageKey: 'mob_012', hp: 4500, maxHp: 4500, atk: 382, def: 250, skills: [{ name: 'Dark Sting',  damage: 1.6 }, { name: 'Shadow Lash',       damage: 2.2 }] },
      { id: 'e_801_3', name: 'Forest Marionette', tier: 'mob', imageKey: 'mob_013', hp: 4800, maxHp: 4800, atk: 398, def: 260, skills: [{ name: 'Vine Slash', damage: 1.7 }, { name: 'Root Bind', damage: 2.3 }] },
    ],
  },
  {
    id: 802, chapter: 8, part: 2,
    name: 'Void Samurai',
    description: 'The Void Samurai Warlord leads the Eclipse forces, cutting through all resistance with cursed blades.',
    enemies: [
      { id: 'e_802_1', name: 'Dark Huntress',       tier: 'mob',       imageKey: 'mob_012',       hp: 4600, maxHp: 4600, atk: 388, def: 255, skills: [{ name: 'Dark Sting',  damage: 1.7 }, { name: 'Shadow Lash',       damage: 2.3 }] },
      { id: 'e_802_2', name: 'Forest Marionette', tier: 'mob',       imageKey: 'mob_013',       hp: 4900, maxHp: 4900, atk: 402, def: 265, skills: [{ name: 'Vine Slash', damage: 1.7 }, { name: 'Root Bind', damage: 2.3 }] },
      { id: 'e_802_3', name: 'Void Samurai Warlord',     tier: 'mini-boss', imageKey: 'mini-boss_004', hp: 9400, maxHp: 9400, atk: 560, def: 390, skills: [{ name: 'Katana Rain',  damage: 2.5 }, { name: 'Soul Cut',        damage: 3.4 }] },
    ],
  },
  {
    id: 803, chapter: 8, part: 3,
    name: 'Radiant Dragon Emperor',
    description: 'The Radiant Dragon Emperor descends from the heavens, unleashing divine radiance that burns through every shadow.',
    enemies: [
      { id: 'e_803_1', name: 'Forest Marionette', tier: 'mob',       imageKey: 'mob_013',       hp: 5200, maxHp: 5200, atk: 415, def: 272, skills: [{ name: 'Vine Slash',    damage: 1.8 }, { name: 'Root Bind',  damage: 2.4 }] },
      { id: 'e_803_2', name: 'Void Samurai Warlord',     tier: 'mini-boss', imageKey: 'mini-boss_004', hp: 10000, maxHp: 10000, atk: 580, def: 406, skills: [{ name: 'Katana Rain',    damage: 2.6 }, { name: 'Soul Cut',         damage: 3.6 }] },
      { id: 'e_803_3', name: 'Radiant Dragon Emperor',   tier: 'boss',      imageKey: 'boss_008',      hp: 17500, maxHp: 17500, atk: 700, def: 480, skills: [{ name: 'Radiant Breath',  damage: 4.0 }, { name: 'Dragon Radiance',   damage: 5.3 }] },
    ],
  },

  // ── CH 9: CELESTIAL FRACTURE — Celestial Valkor ───────────────────────────
  {
    id: 901, chapter: 9, part: 1,
    name: 'Fractured Celestials',
    description: 'Heaven and abyss collide — twisted bloom guardians and puppet soldiers flood the celestial realm.',
    enemies: [
      { id: 'e_901_1', name: 'Dark Huntress',       tier: 'mob', imageKey: 'mob_012', hp: 5000, maxHp: 5000, atk: 415, def: 275, skills: [{ name: 'Dark Sting',  damage: 1.7 }, { name: 'Shadow Lash',       damage: 2.3 }] },
      { id: 'e_901_2', name: 'Forest Marionette', tier: 'mob', imageKey: 'mob_013', hp: 5200, maxHp: 5200, atk: 425, def: 282, skills: [{ name: 'Vine Slash', damage: 1.7 }, { name: 'Root Bind', damage: 2.3 }] },
      { id: 'e_901_3', name: 'Water Guardian', tier: 'mob', imageKey: 'mob_014', hp: 5500, maxHp: 5500, atk: 438, def: 292, skills: [{ name: 'Water Surge',   damage: 1.7 }, { name: 'Tidal Strike',    damage: 2.4 }] },
    ],
  },
  {
    id: 902, chapter: 9, part: 2,
    name: 'Clockwork Commander',
    description: 'The Clockwork Commander orchestrates the celestial assault, his gears fueled by pure destruction.',
    enemies: [
      { id: 'e_902_1', name: 'Forest Marionette', tier: 'mob',       imageKey: 'mob_013',       hp: 5300, maxHp: 5300, atk: 430, def: 286, skills: [{ name: 'Vine Slash',      damage: 1.8 }, { name: 'Root Bind',   damage: 2.4 }] },
      { id: 'e_902_2', name: 'Water Guardian', tier: 'mob',       imageKey: 'mob_014',       hp: 5600, maxHp: 5600, atk: 442, def: 295, skills: [{ name: 'Water Surge',         damage: 1.7 }, { name: 'Tidal Strike',      damage: 2.4 }] },
      { id: 'e_902_3', name: 'Clockwork Commander',       tier: 'mini-boss', imageKey: 'mini-boss_008', hp: 10800, maxHp: 10800, atk: 620, def: 435, skills: [{ name: 'Gear Blitz',        damage: 2.4 }, { name: 'Overdrive Protocol', damage: 3.2 }] },
    ],
  },
  {
    id: 903, chapter: 9, part: 3,
    name: 'Celestial Valkor',
    description: 'Celestial Valkor descends as the fusion of light and darkness, rewriting the laws of existence itself.',
    enemies: [
      { id: 'e_903_1', name: 'Water Guardian', tier: 'mob',       imageKey: 'mob_014',       hp: 6000, maxHp: 6000, atk: 455, def: 305, skills: [{ name: 'Water Surge',          damage: 1.8 }, { name: 'Tidal Strike',       damage: 2.5 }] },
      { id: 'e_903_2', name: 'Clockwork Commander',       tier: 'mini-boss', imageKey: 'mini-boss_008', hp: 11500, maxHp: 11500, atk: 642, def: 452, skills: [{ name: 'Gear Blitz',          damage: 2.5 }, { name: 'Overdrive Protocol', damage: 3.4 }] },
      { id: 'e_903_3', name: 'Celestial Valkor',           tier: 'boss',      imageKey: 'boss_009',      hp: 19500, maxHp: 19500, atk: 770, def: 530, skills: [{ name: 'Celestial Fracture', damage: 4.0 }, { name: "Valkor's Judgement", damage: 5.3 }] },
    ],
  },

  // ── CH 10: VOID QUEEN'S REIGN — Queen Nythera ─────────────────────────────
  {
    id: 1001, chapter: 10, part: 1,
    name: "Queen's Vanguard",
    description: "Queen Nythera's void-corrupted servants flood the celestial realm, erasing all light from above.",
    enemies: [
      { id: 'e_1001_1', name: 'Rotclaw Ghoul',            tier: 'mob', imageKey: 'mob_010', hp: 5600, maxHp: 5600, atk: 452, def: 305, skills: [{ name: 'Decay Strike', damage: 1.7 }, { name: 'Rotting Claw',    damage: 2.3 }] },
      { id: 'e_1001_2', name: 'Dark Huntress',        tier: 'mob', imageKey: 'mob_012', hp: 5800, maxHp: 5800, atk: 462, def: 312, skills: [{ name: 'Dark Sting',  damage: 1.7 }, { name: 'Shadow Lash',       damage: 2.3 }] },
      { id: 'e_1001_3', name: 'Forest Marionette',  tier: 'mob', imageKey: 'mob_013', hp: 6100, maxHp: 6100, atk: 476, def: 322, skills: [{ name: 'Vine Slash', damage: 1.8 }, { name: 'Root Bind', damage: 2.4 }] },
    ],
  },
  {
    id: 1002, chapter: 10, part: 2,
    name: 'Nature Assassin',
    description: "The Nature Assassin stalks through Nythera's corrupted celestial garden, her natural poisons feeding the corruption.",
    enemies: [
      { id: 'e_1002_1', name: 'Dark Huntress',        tier: 'mob',       imageKey: 'mob_012',       hp: 5900, maxHp: 5900, atk: 468, def: 316, skills: [{ name: 'Dark Sting',  damage: 1.8 }, { name: 'Shadow Lash',    damage: 2.4 }] },
      { id: 'e_1002_2', name: 'Forest Marionette',  tier: 'mob',       imageKey: 'mob_013',       hp: 6200, maxHp: 6200, atk: 482, def: 326, skills: [{ name: 'Vine Slash', damage: 1.8 }, { name: 'Root Bind', damage: 2.4 }] },
      { id: 'e_1002_3', name: 'Nature Assassin',      tier: 'mini-boss', imageKey: 'mini-boss_012', hp: 12000, maxHp: 12000, atk: 680, def: 475, skills: [{ name: 'Nature Lash',  damage: 2.4 }, { name: 'Forest Bloom', damage: 3.2 }] },
    ],
  },
  {
    id: 1003, chapter: 10, part: 3,
    name: "Queen Nythera's Throne",
    description: "Queen Nythera rises from her stolen celestial throne, the void energy of a thousand worlds at her command.",
    enemies: [
      { id: 'e_1003_1', name: 'Forest Marionette', tier: 'mob',       imageKey: 'mob_013',       hp: 6500, maxHp: 6500, atk: 495, def: 335, skills: [{ name: 'Vine Slash',    damage: 1.9 }, { name: 'Root Bind',    damage: 2.5 }] },
      { id: 'e_1003_2', name: 'Nature Assassin',     tier: 'mini-boss', imageKey: 'mini-boss_012', hp: 12800, maxHp: 12800, atk: 705, def: 492, skills: [{ name: 'Nature Lash',      damage: 2.5 }, { name: 'Forest Bloom',       damage: 3.4 }] },
      { id: 'e_1003_3', name: 'Queen Nythera',             tier: 'boss',      imageKey: 'boss_010',      hp: 21000, maxHp: 21000, atk: 830, def: 575, skills: [{ name: 'Void Reign',      damage: 4.0 }, { name: "Queen's Corruption", damage: 5.3 }] },
    ],
  },

  // ── CH 11: TITAN'S MARCH — The Infernal Titan King ────────────────────────
  {
    id: 1101, chapter: 11, part: 1,
    name: "Titan's Vanguard",
    description: 'Emberhorn brutes and titan shock troops storm the burning celestial ruins in endless waves.',
    enemies: [
      { id: 'e_1101_1', name: 'Emberhorn Brute',           tier: 'mob', imageKey: 'mob_008', hp: 6200, maxHp: 6200, atk: 488, def: 332, skills: [{ name: 'Horn Charge',  damage: 1.8 }, { name: 'Inferno Gore',    damage: 2.4 }] },
      { id: 'e_1101_2', name: 'Stormbreaker Titan',        tier: 'mob', imageKey: 'mob_011', hp: 6500, maxHp: 6500, atk: 502, def: 342, skills: [{ name: 'Storm Crush',  damage: 1.8 }, { name: 'Thunder Slam',    damage: 2.4 }] },
      { id: 'e_1101_3', name: 'Forest Marionette',  tier: 'mob', imageKey: 'mob_013', hp: 6900, maxHp: 6900, atk: 518, def: 352, skills: [{ name: 'Vine Slash', damage: 1.8 }, { name: 'Root Bind', damage: 2.5 }] },
    ],
  },
  {
    id: 1102, chapter: 11, part: 2,
    name: 'Infernal Berserker King',
    description: 'The Infernal Berserker King leads the titan advance, his volcanic rage growing with each fallen hero.',
    enemies: [
      { id: 'e_1102_1', name: 'Stormbreaker Titan',       tier: 'mob',       imageKey: 'mob_011',       hp: 6600, maxHp: 6600, atk: 508, def: 346, skills: [{ name: 'Storm Crush',      damage: 1.8 }, { name: 'Thunder Slam',  damage: 2.5 }] },
      { id: 'e_1102_2', name: 'Forest Marionette', tier: 'mob',       imageKey: 'mob_013',       hp: 7000, maxHp: 7000, atk: 522, def: 356, skills: [{ name: 'Vine Slash',      damage: 1.8 }, { name: 'Root Bind', damage: 2.5 }] },
      { id: 'e_1102_3', name: 'Infernal Berserker King',  tier: 'mini-boss', imageKey: 'mini-boss_005', hp: 13500, maxHp: 13500, atk: 740, def: 515, skills: [{ name: 'Berserker Rage',   damage: 2.5 }, { name: 'Titan Fury',    damage: 3.4 }] },
    ],
  },
  {
    id: 1103, chapter: 11, part: 3,
    name: 'The Infernal Titan King',
    description: 'The Infernal Titan King stomps the burning ruins flat, his power threatening to unmake all celestial order.',
    enemies: [
      { id: 'e_1103_1', name: 'Forest Marionette', tier: 'mob',       imageKey: 'mob_013',       hp: 7300, maxHp: 7300, atk: 535, def: 365, skills: [{ name: 'Vine Slash',       damage: 1.9 }, { name: 'Root Bind',    damage: 2.6 }] },
      { id: 'e_1103_2', name: 'Infernal Berserker King',  tier: 'mini-boss', imageKey: 'mini-boss_005', hp: 14200, maxHp: 14200, atk: 765, def: 535, skills: [{ name: 'Berserker Rage',    damage: 2.6 }, { name: 'Titan Fury',         damage: 3.6 }] },
      { id: 'e_1103_3', name: 'The Infernal Titan King',  tier: 'boss',      imageKey: 'boss_011',      hp: 23000, maxHp: 23000, atk: 890, def: 620, skills: [{ name: 'Titan Devastation', damage: 4.0 }, { name: 'Infernal Apocalypse', damage: 5.4 }] },
    ],
  },

  // ── CH 12: TIME'S END — Chronos ───────────────────────────────────────────
  {
    id: 1201, chapter: 12, part: 1,
    name: 'Chrono Soldiers',
    description: 'Puppet soldiers march in perfect synchrony as time itself stutters and skips around them.',
    enemies: [
      { id: 'e_1201_1', name: 'Forest Marionette', tier: 'mob', imageKey: 'mob_013', hp: 6900, maxHp: 6900, atk: 528, def: 360, skills: [{ name: 'Vine Slash', damage: 1.8 }, { name: 'Root Bind', damage: 2.5 }] },
      { id: 'e_1201_2', name: 'Water Guardian', tier: 'mob', imageKey: 'mob_014', hp: 7200, maxHp: 7200, atk: 542, def: 370, skills: [{ name: 'Water Surge',   damage: 1.8 }, { name: 'Tidal Strike',    damage: 2.5 }] },
      { id: 'e_1201_3', name: 'Stormbreaker Titan',       tier: 'mob', imageKey: 'mob_011', hp: 7600, maxHp: 7600, atk: 558, def: 382, skills: [{ name: 'Storm Crush',  damage: 1.9 }, { name: 'Thunder Slam',    damage: 2.5 }] },
    ],
  },
  {
    id: 1202, chapter: 12, part: 2,
    name: 'Frost Revenant Knight',
    description: "The Frost Revenant Knight patrols the temporal rift, his soul bound to Chronos through death itself.",
    enemies: [
      { id: 'e_1202_1', name: 'Forest Marionette', tier: 'mob',       imageKey: 'mob_013',       hp: 7100, maxHp: 7100, atk: 538, def: 368, skills: [{ name: 'Vine Slash',     damage: 1.9 }, { name: 'Root Bind', damage: 2.5 }] },
      { id: 'e_1202_2', name: 'Water Guardian', tier: 'mob',       imageKey: 'mob_014',       hp: 7400, maxHp: 7400, atk: 552, def: 378, skills: [{ name: 'Water Surge',        damage: 1.9 }, { name: 'Tidal Strike',    damage: 2.5 }] },
      { id: 'e_1202_3', name: 'Frost Revenant Knight',    tier: 'mini-boss', imageKey: 'mini-boss_006', hp: 15000, maxHp: 15000, atk: 800, def: 555, skills: [{ name: 'Revenant Frost',   damage: 2.4 }, { name: 'Soul Freeze',     damage: 3.2 }] },
    ],
  },
  {
    id: 1203, chapter: 12, part: 3,
    name: 'Chronos Awakens',
    description: 'Chronos the God of Time steps from the collapsing timeline to unmake all of history.',
    enemies: [
      { id: 'e_1203_1', name: 'Water Guardian', tier: 'mob',       imageKey: 'mob_014',       hp: 7700, maxHp: 7700, atk: 562, def: 386, skills: [{ name: 'Water Surge',       damage: 1.9 }, { name: 'Tidal Strike',      damage: 2.6 }] },
      { id: 'e_1203_2', name: 'Frost Revenant Knight',    tier: 'mini-boss', imageKey: 'mini-boss_006', hp: 15800, maxHp: 15800, atk: 825, def: 572, skills: [{ name: 'Revenant Frost',   damage: 2.5 }, { name: 'Soul Freeze',       damage: 3.4 }] },
      { id: 'e_1203_3', name: 'Chronos',                   tier: 'boss',      imageKey: 'boss_012',      hp: 24500, maxHp: 24500, atk: 940, def: 650, skills: [{ name: 'Time Stop',       damage: 4.0 }, { name: 'Temporal Collapse', damage: 5.4 }] },
    ],
  },

  // ── CH 13: ETERNAL WINTER — The Frostbound Monarch ────────────────────────
  {
    id: 1301, chapter: 13, part: 1,
    name: 'Frozen Legions',
    description: "The Frostbound Monarch's eternal winter army spreads across the land, freezing all who resist.",
    enemies: [
      { id: 'e_1301_1', name: 'Flame Scout',       tier: 'mob', imageKey: 'mob_001', hp: 7600, maxHp: 7600, atk: 568, def: 392, skills: [{ name: 'Flame Strike', damage: 1.8 }, { name: 'Fire Claw',     damage: 2.4 }] },
      { id: 'e_1301_2', name: 'Frostveil Siren',    tier: 'mob', imageKey: 'mob_009', hp: 8000, maxHp: 8000, atk: 582, def: 402, skills: [{ name: 'Frost Song',    damage: 1.9 }, { name: 'Blizzard Aria', damage: 2.5 }] },
      { id: 'e_1301_3', name: 'Stormbreaker Titan', tier: 'mob', imageKey: 'mob_011', hp: 8400, maxHp: 8400, atk: 598, def: 412, skills: [{ name: 'Storm Crush',   damage: 1.9 }, { name: 'Thunder Slam',  damage: 2.6 }] },
    ],
  },
  {
    id: 1302, chapter: 13, part: 2,
    name: 'Storm Siren Empress',
    description: 'The Storm Siren Empress commands weather itself, turning blizzards into weapons of annihilation.',
    enemies: [
      { id: 'e_1302_1', name: 'Frostveil Siren',      tier: 'mob',       imageKey: 'mob_009',       hp: 8100, maxHp: 8100, atk: 588, def: 405, skills: [{ name: 'Frost Song',      damage: 1.9 }, { name: 'Blizzard Aria',  damage: 2.5 }] },
      { id: 'e_1302_2', name: 'Stormbreaker Titan',   tier: 'mob',       imageKey: 'mob_011',       hp: 8500, maxHp: 8500, atk: 602, def: 416, skills: [{ name: 'Storm Crush',     damage: 1.9 }, { name: 'Thunder Slam',   damage: 2.6 }] },
      { id: 'e_1302_3', name: 'Storm Siren Empress',  tier: 'mini-boss', imageKey: 'mini-boss_013', hp: 16500, maxHp: 16500, atk: 860, def: 590, skills: [{ name: 'Tempest Song',   damage: 2.5 }, { name: 'Lightning Aria', damage: 3.4 }] },
    ],
  },
  {
    id: 1303, chapter: 13, part: 3,
    name: 'The Frostbound Monarch',
    description: 'The Frostbound Monarch descends from his frozen throne, his very gaze turning heroes to solid ice.',
    enemies: [
      { id: 'e_1303_1', name: 'Stormbreaker Titan',     tier: 'mob',       imageKey: 'mob_011',       hp: 8800, maxHp: 8800, atk: 615, def: 425, skills: [{ name: 'Storm Crush',       damage: 2.0 }, { name: 'Thunder Slam',     damage: 2.7 }] },
      { id: 'e_1303_2', name: 'Storm Siren Empress',    tier: 'mini-boss', imageKey: 'mini-boss_013', hp: 17200, maxHp: 17200, atk: 882, def: 608, skills: [{ name: 'Tempest Song',      damage: 2.6 }, { name: 'Lightning Aria',    damage: 3.6 }] },
      { id: 'e_1303_3', name: 'The Frostbound Monarch', tier: 'boss',      imageKey: 'boss_013',      hp: 25500, maxHp: 25500, atk: 980, def: 670, skills: [{ name: 'Frozen Kingdom',   damage: 4.0 }, { name: 'Eternal Blizzard',  damage: 5.4 }] },
    ],
  },

  // ── CH 14: CRIMSON EMPIRE — Seraphine the Crimson Empress ─────────────────
  {
    id: 1401, chapter: 14, part: 1,
    name: "Seraphine's Court",
    description: "Seraphine's crimson court enforces blood law across her gothic empire built on stolen power.",
    enemies: [
      { id: 'e_1401_1', name: 'Dark Huntress',       tier: 'mob', imageKey: 'mob_012', hp: 8300, maxHp: 8300, atk: 608, def: 422, skills: [{ name: 'Dark Sting',  damage: 1.9 }, { name: 'Shadow Lash',       damage: 2.5 }] },
      { id: 'e_1401_2', name: 'Forest Marionette', tier: 'mob', imageKey: 'mob_013', hp: 8700, maxHp: 8700, atk: 622, def: 432, skills: [{ name: 'Vine Slash', damage: 1.9 }, { name: 'Root Bind', damage: 2.6 }] },
      { id: 'e_1401_3', name: 'Water Guardian', tier: 'mob', imageKey: 'mob_014', hp: 9100, maxHp: 9100, atk: 638, def: 445, skills: [{ name: 'Water Surge',   damage: 2.0 }, { name: 'Tidal Strike',    damage: 2.6 }] },
    ],
  },
  {
    id: 1402, chapter: 14, part: 2,
    name: 'Crimson Widow Queen',
    description: "The Crimson Widow Queen enforces Seraphine's will, her blood webs ensnaring all who enter the empire.",
    enemies: [
      { id: 'e_1402_1', name: 'Forest Marionette', tier: 'mob',       imageKey: 'mob_013',       hp: 8800, maxHp: 8800, atk: 628, def: 438, skills: [{ name: 'Vine Slash',  damage: 2.0 }, { name: 'Root Bind', damage: 2.6 }] },
      { id: 'e_1402_2', name: 'Water Guardian', tier: 'mob',       imageKey: 'mob_014',       hp: 9200, maxHp: 9200, atk: 642, def: 448, skills: [{ name: 'Water Surge',    damage: 2.0 }, { name: 'Tidal Strike',    damage: 2.7 }] },
      { id: 'e_1402_3', name: 'Crimson Widow Queen',       tier: 'mini-boss', imageKey: 'mini-boss_009', hp: 18000, maxHp: 18000, atk: 920, def: 620, skills: [{ name: 'Web of Blood',  damage: 2.3 }, { name: 'Crimson Bite',    damage: 3.0 }] },
    ],
  },
  {
    id: 1403, chapter: 14, part: 3,
    name: "Seraphine's Domain",
    description: 'Seraphine the Crimson Empress absorbs the power of every battle fought, now at the peak of her terrible glory.',
    enemies: [
      { id: 'e_1403_1', name: 'Water Guardian',     tier: 'mob',       imageKey: 'mob_014',       hp: 9500, maxHp: 9500, atk: 655, def: 458, skills: [{ name: 'Water Surge',         damage: 2.0 }, { name: 'Tidal Strike',     damage: 2.7 }] },
      { id: 'e_1403_2', name: 'Crimson Widow Queen',           tier: 'mini-boss', imageKey: 'mini-boss_009', hp: 18800, maxHp: 18800, atk: 948, def: 640, skills: [{ name: 'Web of Blood',       damage: 2.4 }, { name: 'Crimson Bite',     damage: 3.2 }] },
      { id: 'e_1403_3', name: 'Seraphine the Crimson Empress', tier: 'boss',      imageKey: 'boss_014',      hp: 27000, maxHp: 27000, atk: 1040, def: 700, skills: [{ name: 'Crimson Judgement', damage: 4.2 }, { name: "Empress's Wrath",  damage: 5.5 }] },
    ],
  },

  // ── CH 15: WORLD'S LAST HOUR — The World Eater Leviathan ─────────────────
  {
    id: 1501, chapter: 15, part: 1,
    name: "World Eater's Herald",
    description: "The World Eater's herald forces march as reality dissolves — the final war for all existence begins.",
    enemies: [
      { id: 'e_1501_1', name: 'Stormbreaker Titan',       tier: 'mob', imageKey: 'mob_011', hp: 9000, maxHp: 9000, atk: 648, def: 452, skills: [{ name: 'Storm Crush',  damage: 2.0 }, { name: 'Thunder Slam',    damage: 2.7 }] },
      { id: 'e_1501_2', name: 'Forest Marionette', tier: 'mob', imageKey: 'mob_013', hp: 9400, maxHp: 9400, atk: 662, def: 462, skills: [{ name: 'Vine Slash', damage: 2.0 }, { name: 'Root Bind', damage: 2.7 }] },
      { id: 'e_1501_3', name: 'Water Guardian', tier: 'mob', imageKey: 'mob_014', hp: 9800, maxHp: 9800, atk: 678, def: 472, skills: [{ name: 'Water Surge',   damage: 2.0 }, { name: 'Tidal Strike',    damage: 2.8 }] },
    ],
  },
  {
    id: 1502, chapter: 15, part: 2,
    name: 'Void Samurai of the Abyss',
    description: 'The greatest Void Samurai Warlord stands at the threshold between existence and oblivion.',
    enemies: [
      { id: 'e_1502_1', name: 'Forest Marionette', tier: 'mob',       imageKey: 'mob_013',       hp: 9500, maxHp: 9500, atk: 668, def: 468, skills: [{ name: 'Vine Slash', damage: 2.0 }, { name: 'Root Bind', damage: 2.8 }] },
      { id: 'e_1502_2', name: 'Water Guardian', tier: 'mob',       imageKey: 'mob_014',       hp: 9900, maxHp: 9900, atk: 682, def: 478, skills: [{ name: 'Water Surge',   damage: 2.0 }, { name: 'Tidal Strike',    damage: 2.8 }] },
      { id: 'e_1502_3', name: 'Void Samurai Warlord',     tier: 'mini-boss', imageKey: 'mini-boss_004', hp: 20000, maxHp: 20000, atk: 1000, def: 660, skills: [{ name: 'Katana Rain', damage: 3.5 }, { name: 'Soul Cut',         damage: 4.6 }] },
    ],
  },
  {
    id: 1503, chapter: 15, part: 3,
    name: 'The World Eater Leviathan',
    description: 'The World Eater Leviathan surfaces from the cosmic abyss to consume the last remnants of reality.',
    enemies: [
      { id: 'e_1503_1', name: 'Water Guardian',  tier: 'mob',       imageKey: 'mob_014',       hp: 10200, maxHp: 10200, atk: 695, def: 488, skills: [{ name: 'Water Surge',         damage: 2.1 }, { name: 'Tidal Strike',      damage: 2.9 }] },
      { id: 'e_1503_2', name: 'Void Samurai Warlord',       tier: 'mini-boss', imageKey: 'mini-boss_004', hp: 21000, maxHp: 21000, atk: 1025, def: 680, skills: [{ name: 'Katana Rain',        damage: 3.6 }, { name: 'Soul Cut',          damage: 4.8 }] },
      { id: 'e_1503_3', name: 'The World Eater Leviathan',  tier: 'boss',      imageKey: 'boss_015',      hp: 28000, maxHp: 28000, atk: 1100, def: 720, skills: [{ name: 'World Devour',       damage: 4.2 }, { name: 'Cosmic Extinction', damage: 5.5 }] },
    ],
  },

  // ── CH 16: CATHEDRAL OF CHAINS — Visalia the Crimson ─────────────────────
  {
    id: 1601, chapter: 16, part: 1,
    name: 'Bell Tower Guardians',
    description: 'Iron Shade Knights and Forest Revenants defend the cursed cathedral as an ancient darkness stirs beneath.',
    enemies: [
      { id: 'e_1601_1', name: 'Iron Shade Knight',      tier: 'mob', imageKey: 'mob_015', hp: 10800, maxHp: 10800, atk: 712, def: 500, skills: [{ name: 'Shadow Slash',    damage: 2.0 }, { name: 'Dark Lunge',      damage: 2.7 }] },
      { id: 'e_1601_2', name: 'Forest Revenant',         tier: 'mob', imageKey: 'mob_016', hp: 11100, maxHp: 11100, atk: 725, def: 510, skills: [{ name: 'Forest Strike',    damage: 2.0 }, { name: 'Nature Drain',  damage: 2.7 }] },
      { id: 'e_1601_3', name: 'Earth Sentinel', tier: 'mob', imageKey: 'mob_017', hp: 11400, maxHp: 11400, atk: 738, def: 520, skills: [{ name: 'Earth Smash',     damage: 2.0 }, { name: 'Stone Guard',  damage: 2.8 }] },
    ],
  },
  {
    id: 1602, chapter: 16, part: 2,
    name: 'Stone Keeper',
    description: 'The ancient cathedral guardian rises, every toll of his cursed bell sending shockwaves through reality.',
    enemies: [
      { id: 'e_1602_1', name: 'Forest Revenant',         tier: 'mob',       imageKey: 'mob_016',       hp: 11300, maxHp: 11300, atk: 732, def: 516, skills: [{ name: 'Forest Strike',     damage: 2.1 }, { name: 'Nature Drain',    damage: 2.8 }] },
      { id: 'e_1602_2', name: 'Earth Sentinel', tier: 'mob',       imageKey: 'mob_017',       hp: 11600, maxHp: 11600, atk: 745, def: 526, skills: [{ name: 'Earth Smash',      damage: 2.1 }, { name: 'Stone Guard',   damage: 2.8 }] },
      { id: 'e_1602_3', name: 'Stone Keeper',        tier: 'mini-boss', imageKey: 'mini-boss_014', hp: 22000, maxHp: 22000, atk: 1055, def: 700, skills: [{ name: 'Stone Toll',   damage: 2.6 }, { name: 'Earth Shockwave', damage: 3.5 }] },
    ],
  },
  {
    id: 1603, chapter: 16, part: 3,
    name: 'Visalia the Crimson',
    description: 'The true architect of the Crimson Empire emerges — a demon-vampire hybrid who engineered every war from the shadows.',
    enemies: [
      { id: 'e_1603_1', name: 'Earth Sentinel', tier: 'mob',       imageKey: 'mob_017',       hp: 11800, maxHp: 11800, atk: 752, def: 532, skills: [{ name: 'Earth Smash',       damage: 2.1 }, { name: 'Stone Guard',   damage: 2.9 }] },
      { id: 'e_1603_2', name: 'Stone Keeper',        tier: 'mini-boss', imageKey: 'mini-boss_014', hp: 23000, maxHp: 23000, atk: 1075, def: 715, skills: [{ name: 'Stone Toll',   damage: 2.7 }, { name: 'Earth Shockwave', damage: 3.7 }] },
      { id: 'e_1603_3', name: 'Visalia the Crimson',    tier: 'boss',      imageKey: 'boss_016',      hp: 29500, maxHp: 29500, atk: 1140, def: 742, skills: [{ name: 'Blood Dominion',   damage: 4.2 }, { name: "Demon's Eclipse", damage: 5.6 }] },
    ],
  },

  // ── CH 17: THE HOLLOW CROWN — The Crownless King ──────────────────────────
  {
    id: 1701, chapter: 17, part: 1,
    name: "Lost Kingdom's Dead",
    description: 'Soldiers of an erased kingdom fight with the fury of history that refused to be forgotten.',
    enemies: [
      { id: 'e_1701_1', name: 'Iron Shade Knight',  tier: 'mob', imageKey: 'mob_015', hp: 11600, maxHp: 11600, atk: 748, def: 528, skills: [{ name: 'Shadow Slash',   damage: 2.1 }, { name: 'Dark Lunge',     damage: 2.8 }] },
      { id: 'e_1701_2', name: 'Void Wraith Archer', tier: 'mob', imageKey: 'mob_019', hp: 11900, maxHp: 11900, atk: 762, def: 538, skills: [{ name: 'Wraith Arrow',   damage: 2.1 }, { name: 'Void Volley',   damage: 2.8 }] },
      { id: 'e_1701_3', name: 'Tomb Specter',       tier: 'mob', imageKey: 'mob_020', hp: 12200, maxHp: 12200, atk: 778, def: 548, skills: [{ name: 'Specter Claw',   damage: 2.1 }, { name: 'Haunting Wail', damage: 2.9 }] },
    ],
  },
  {
    id: 1702, chapter: 17, part: 2,
    name: 'Lady Silkgrave',
    description: 'The spider empress of the erased royal tomb commands her silk kingdom from an abandoned throne.',
    enemies: [
      { id: 'e_1702_1', name: 'Void Wraith Archer', tier: 'mob',       imageKey: 'mob_019',       hp: 12100, maxHp: 12100, atk: 770, def: 544, skills: [{ name: 'Wraith Arrow',    damage: 2.2 }, { name: 'Void Volley',     damage: 2.9 }] },
      { id: 'e_1702_2', name: 'Tomb Specter',       tier: 'mob',       imageKey: 'mob_020',       hp: 12400, maxHp: 12400, atk: 785, def: 554, skills: [{ name: 'Specter Claw',    damage: 2.2 }, { name: 'Haunting Wail',   damage: 2.9 }] },
      { id: 'e_1702_3', name: 'Lady Silkgrave',     tier: 'mini-boss', imageKey: 'mini-boss_015', hp: 23000, maxHp: 23000, atk: 1085, def: 720, skills: [{ name: 'Funeral Silk',    damage: 2.6 }, { name: 'Crystal Fang',    damage: 3.5 }] },
    ],
  },
  {
    id: 1703, chapter: 17, part: 3,
    name: 'The Crownless King',
    description: 'An ancient ruler whose kingdom was erased from all history commands darkness from a shattered floating throne.',
    enemies: [
      { id: 'e_1703_1', name: 'Tomb Specter',       tier: 'mob',       imageKey: 'mob_020',       hp: 12600, maxHp: 12600, atk: 792, def: 560, skills: [{ name: 'Specter Claw',    damage: 2.2 }, { name: 'Haunting Wail',    damage: 3.0 }] },
      { id: 'e_1703_2', name: 'Lady Silkgrave',     tier: 'mini-boss', imageKey: 'mini-boss_015', hp: 24000, maxHp: 24000, atk: 1105, def: 735, skills: [{ name: 'Funeral Silk',    damage: 2.7 }, { name: 'Crystal Fang',     damage: 3.7 }] },
      { id: 'e_1703_3', name: 'The Crownless King', tier: 'boss',      imageKey: 'boss_017',      hp: 31000, maxHp: 31000, atk: 1180, def: 765, skills: [{ name: 'Nameless Decree', damage: 4.2 }, { name: 'Void Coronation', damage: 5.6 }] },
    ],
  },

  // ── CH 18: DIVIDED HEAVEN — Mother Eclipse ────────────────────────────────
  {
    id: 1801, chapter: 18, part: 1,
    name: 'Forge Cultists',
    description: 'Dark Golems and Obsidian Sentinels guard the volcanic monastery as a cosmic goddess converges.',
    enemies: [
      { id: 'e_1801_1', name: 'Forest Revenant',      tier: 'mob', imageKey: 'mob_016', hp: 12400, maxHp: 12400, atk: 790, def: 558, skills: [{ name: 'Forest Strike',    damage: 2.2 }, { name: 'Nature Drain',   damage: 2.9 }] },
      { id: 'e_1801_2', name: 'Dark Golem',  tier: 'mob', imageKey: 'mob_021', hp: 12700, maxHp: 12700, atk: 805, def: 568, skills: [{ name: 'Void Strike',    damage: 2.2 }, { name: 'Shadow Slam',     damage: 2.9 }] },
      { id: 'e_1801_3', name: 'Obsidian Sentinel',   tier: 'mob', imageKey: 'mob_022', hp: 13000, maxHp: 13000, atk: 820, def: 578, skills: [{ name: 'Obsidian Guard',  damage: 2.2 }, { name: 'Volcanic Crush',  damage: 3.0 }] },
    ],
  },
  {
    id: 1802, chapter: 18, part: 2,
    name: 'The Furnace Saint',
    description: 'A former holy knight reborn as a living forge stands as the burning threshold between the heroes and a goddess.',
    enemies: [
      { id: 'e_1802_1', name: 'Dark Golem', tier: 'mob',       imageKey: 'mob_021',       hp: 12900, maxHp: 12900, atk: 812, def: 574, skills: [{ name: 'Void Strike',   damage: 2.2 }, { name: 'Shadow Slam',       damage: 3.0 }] },
      { id: 'e_1802_2', name: 'Obsidian Sentinel',  tier: 'mob',       imageKey: 'mob_022',       hp: 13200, maxHp: 13200, atk: 828, def: 584, skills: [{ name: 'Obsidian Guard', damage: 2.3 }, { name: 'Volcanic Crush',    damage: 3.0 }] },
      { id: 'e_1802_3', name: 'The Furnace Saint',  tier: 'mini-boss', imageKey: 'mini-boss_016', hp: 24000, maxHp: 24000, atk: 1115, def: 740, skills: [{ name: 'Cursed Hammer',  damage: 2.7 }, { name: 'Forge Consecration', damage: 3.6 }] },
    ],
  },
  {
    id: 1803, chapter: 18, part: 3,
    name: 'Mother Eclipse',
    description: 'A cosmic goddess of two merged souls — one of divine light, one of consuming darkness — awakens in terrible balance.',
    enemies: [
      { id: 'e_1803_1', name: 'Obsidian Sentinel', tier: 'mob',       imageKey: 'mob_022',       hp: 13400, maxHp: 13400, atk: 835, def: 590, skills: [{ name: 'Obsidian Guard',  damage: 2.3 }, { name: 'Volcanic Crush',    damage: 3.1 }] },
      { id: 'e_1803_2', name: 'The Furnace Saint', tier: 'mini-boss', imageKey: 'mini-boss_016', hp: 25000, maxHp: 25000, atk: 1135, def: 755, skills: [{ name: 'Cursed Hammer',   damage: 2.8 }, { name: 'Forge Consecration', damage: 3.8 }] },
      { id: 'e_1803_3', name: 'Mother Eclipse',    tier: 'boss',      imageKey: 'boss_018',      hp: 32500, maxHp: 32500, atk: 1220, def: 790, skills: [{ name: 'Eclipse Divide',  damage: 4.3 }, { name: 'Dual Genesis',      damage: 5.7 }] },
    ],
  },

  // ── CH 19: THE LIVING ARCHIVE — The Archive Devourer ─────────────────────
  {
    id: 1901, chapter: 19, part: 1,
    name: 'Wayward Scholars',
    description: 'Dimensional wanderers and silk-thread crawlers serve a devouring library that consumes knowledge and knower alike.',
    enemies: [
      { id: 'e_1901_1', name: 'Phantom Silk Crawler',    tier: 'mob', imageKey: 'mob_018', hp: 12800, maxHp: 12800, atk: 808, def: 568, skills: [{ name: 'Silk Ensnare',     damage: 2.1 }, { name: 'Phase Crawl',     damage: 2.8 }] },
      { id: 'e_1901_2', name: 'Star Map Wanderer',       tier: 'mob', imageKey: 'mob_023', hp: 13200, maxHp: 13200, atk: 825, def: 580, skills: [{ name: 'Stellar Strike',   damage: 2.2 }, { name: 'Cosmic Chart',    damage: 2.9 }] },
      { id: 'e_1901_3', name: 'Dimensional Rift Stalker',tier: 'mob', imageKey: 'mob_024', hp: 13600, maxHp: 13600, atk: 842, def: 592, skills: [{ name: 'Rift Slash',       damage: 2.2 }, { name: 'Reality Rend',    damage: 3.0 }] },
    ],
  },
  {
    id: 1902, chapter: 19, part: 2,
    name: 'Void-Touched Navigator',
    description: 'An ancient sailor fused with cosmic energy floats above the archive floors, guarding infinite knowledge for a hungry master.',
    enemies: [
      { id: 'e_1902_1', name: 'Star Map Wanderer',        tier: 'mob',       imageKey: 'mob_023',       hp: 13400, maxHp: 13400, atk: 832, def: 586, skills: [{ name: 'Stellar Strike',    damage: 2.2 }, { name: 'Cosmic Chart',       damage: 3.0 }] },
      { id: 'e_1902_2', name: 'Dimensional Rift Stalker', tier: 'mob',       imageKey: 'mob_024',       hp: 13800, maxHp: 13800, atk: 850, def: 598, skills: [{ name: 'Rift Slash',         damage: 2.3 }, { name: 'Reality Rend',       damage: 3.0 }] },
      { id: 'e_1902_3', name: 'Void-Touched Navigator',   tier: 'mini-boss', imageKey: 'mini-boss_017', hp: 25000, maxHp: 25000, atk: 1148, def: 762, skills: [{ name: 'Dimensional Chart', damage: 2.7 }, { name: 'Rift Compass',       damage: 3.6 }] },
    ],
  },
  {
    id: 1903, chapter: 19, part: 3,
    name: 'The Archive Devourer',
    description: 'A massive dragon-like entity composed of living books, scrolls, and ancient knowledge opens its eyes of magical text.',
    enemies: [
      { id: 'e_1903_1', name: 'Dimensional Rift Stalker', tier: 'mob',       imageKey: 'mob_024',       hp: 14000, maxHp: 14000, atk: 858, def: 605, skills: [{ name: 'Rift Slash',         damage: 2.3 }, { name: 'Reality Rend',        damage: 3.1 }] },
      { id: 'e_1903_2', name: 'Void-Touched Navigator',   tier: 'mini-boss', imageKey: 'mini-boss_017', hp: 26000, maxHp: 26000, atk: 1168, def: 778, skills: [{ name: 'Dimensional Chart', damage: 2.8 }, { name: 'Rift Compass',        damage: 3.8 }] },
      { id: 'e_1903_3', name: 'The Archive Devourer',     tier: 'boss',      imageKey: 'boss_019',      hp: 34000, maxHp: 34000, atk: 1262, def: 818, skills: [{ name: 'Text Obliteration', damage: 4.3 }, { name: "Knowledge's Hunger", damage: 5.7 }] },
    ],
  },

  // ── CH 20: BEFORE THE FIRST BREATH — The First Dream ─────────────────────
  {
    id: 2001, chapter: 20, part: 1,
    name: 'Dream Sentinels',
    description: 'Porcelain guards and celestial string dancers manifest from the subconscious of a sleeping entity older than existence.',
    enemies: [
      { id: 'e_2001_1', name: 'Dimensional Rift Stalker',tier: 'mob', imageKey: 'mob_024', hp: 14200, maxHp: 14200, atk: 865, def: 610, skills: [{ name: 'Rift Slash',        damage: 2.3 }, { name: 'Reality Rend',        damage: 3.1 }] },
      { id: 'e_2001_2', name: 'Porcelain Guard',         tier: 'mob', imageKey: 'mob_025', hp: 14500, maxHp: 14500, atk: 880, def: 622, skills: [{ name: 'Porcelain Strike', damage: 2.3 }, { name: 'Marionette Smash',    damage: 3.1 }] },
      { id: 'e_2001_3', name: 'Celestial String Dancer', tier: 'mob', imageKey: 'mob_026', hp: 14900, maxHp: 14900, atk: 898, def: 636, skills: [{ name: 'String Slash',     damage: 2.4 }, { name: 'Celestial Waltz',     damage: 3.2 }] },
    ],
  },
  {
    id: 2002, chapter: 20, part: 2,
    name: 'The Last Marionette',
    description: 'The First Dream\'s most beloved creation — an elegant puppet queen — performs her final act as an eternal guardian.',
    enemies: [
      { id: 'e_2002_1', name: 'Porcelain Guard',         tier: 'mob',       imageKey: 'mob_025',       hp: 14700, maxHp: 14700, atk: 888, def: 628, skills: [{ name: 'Porcelain Strike',  damage: 2.4 }, { name: 'Marionette Smash',   damage: 3.2 }] },
      { id: 'e_2002_2', name: 'Celestial String Dancer', tier: 'mob',       imageKey: 'mob_026',       hp: 15100, maxHp: 15100, atk: 905, def: 642, skills: [{ name: 'String Slash',      damage: 2.4 }, { name: 'Celestial Waltz',    damage: 3.2 }] },
      { id: 'e_2002_3', name: 'The Last Marionette',     tier: 'mini-boss', imageKey: 'mini-boss_018', hp: 26500, maxHp: 26500, atk: 1180, def: 785, skills: [{ name: 'Puppet Crescendo', damage: 2.8 }, { name: 'Final Curtain',      damage: 3.8 }] },
    ],
  },
  {
    id: 2003, chapter: 20, part: 3,
    name: 'The First Dream',
    description: 'The ancient entity sleeping beneath reality opens its eyes — a being of stars, memories, and shattered worlds that dreamed existence into being.',
    enemies: [
      { id: 'e_2003_1', name: 'Celestial String Dancer', tier: 'mob',       imageKey: 'mob_026',       hp: 15300, maxHp: 15300, atk: 912, def: 648, skills: [{ name: 'String Slash',       damage: 2.4 }, { name: 'Celestial Waltz',    damage: 3.3 }] },
      { id: 'e_2003_2', name: 'The Last Marionette',     tier: 'mini-boss', imageKey: 'mini-boss_018', hp: 27500, maxHp: 27500, atk: 1200, def: 800, skills: [{ name: 'Puppet Crescendo',  damage: 2.9 }, { name: 'Final Curtain',      damage: 4.0 }] },
      { id: 'e_2003_3', name: 'The First Dream',         tier: 'boss',      imageKey: 'boss_020',      hp: 36000, maxHp: 36000, atk: 1320, def: 860, skills: [{ name: 'Dream Collapse',    damage: 4.5 }, { name: 'Origin Unraveling', damage: 6.0 }] },
    ],
  },

  // ── CH 21: SHADOW SOVEREIGN — The Shadow Sovereign ───────────────────────────
  {
    id: 2101, chapter: 21, part: 1,
    name: 'Shadow Vanguard',
    description: 'Shadow felines, void vipers, and dark crowmancers pour from the dark realm as the Shadow Sovereign\'s dominion expands.',
    enemies: [
      { id: 'e_2101_1', name: 'Shadow Feline',   tier: 'mob', imageKey: 'mob_027', hp: 15800, maxHp: 15800, atk: 945,  def: 675, skills: [{ name: 'Shadow Pounce',    damage: 2.4 }, { name: 'Dark Claw Strike', damage: 3.1 }] },
      { id: 'e_2101_2', name: 'Void Viper',       tier: 'mob', imageKey: 'mob_028', hp: 16200, maxHp: 16200, atk: 958,  def: 685, skills: [{ name: 'Venom Lunge',     damage: 2.4 }, { name: 'Void Fang',       damage: 3.2 }] },
      { id: 'e_2101_3', name: 'Dark Crowmancer',  tier: 'mob', imageKey: 'mob_032', hp: 16800, maxHp: 16800, atk: 975,  def: 698, skills: [{ name: 'Dark Feather',    damage: 2.5 }, { name: 'Crow Curse',      damage: 3.2 }] },
    ],
  },
  {
    id: 2102, chapter: 21, part: 2,
    name: 'Kitsune Specter',
    description: 'The fox spirit guardian of the Shadow Sovereign emerges, her phantom tails weaving deadly illusions across the dark realm.',
    enemies: [
      { id: 'e_2102_1', name: 'Void Viper',      tier: 'mob',       imageKey: 'mob_028',       hp: 16400, maxHp: 16400, atk: 965,  def: 688, skills: [{ name: 'Venom Lunge',  damage: 2.4 }, { name: 'Void Fang',       damage: 3.2 }] },
      { id: 'e_2102_2', name: 'Dark Crowmancer', tier: 'mob',       imageKey: 'mob_032',       hp: 17000, maxHp: 17000, atk: 980,  def: 700, skills: [{ name: 'Dark Feather', damage: 2.5 }, { name: 'Crow Curse',      damage: 3.3 }] },
      { id: 'e_2102_3', name: 'Kitsune Specter', tier: 'mini-boss', imageKey: 'mini-boss_019', hp: 29500, maxHp: 29500, atk: 1245, def: 832, skills: [{ name: 'Fox Fire',      damage: 2.8 }, { name: 'Nine Tail Surge', damage: 3.8 }] },
    ],
  },
  {
    id: 2103, chapter: 21, part: 3,
    name: 'The Shadow Sovereign',
    description: 'The Shadow Sovereign herself rises — a dark-power ruler who has consolidated shadow energy since before time had a name.',
    enemies: [
      { id: 'e_2103_1', name: 'Dark Crowmancer',     tier: 'mob',       imageKey: 'mob_032',       hp: 17200, maxHp: 17200, atk: 988,  def: 708, skills: [{ name: 'Dark Feather',    damage: 2.5 }, { name: 'Crow Curse',     damage: 3.3 }] },
      { id: 'e_2103_2', name: 'Kitsune Specter',     tier: 'mini-boss', imageKey: 'mini-boss_019', hp: 30500, maxHp: 30500, atk: 1265, def: 848, skills: [{ name: 'Fox Fire',         damage: 2.9 }, { name: 'Nine Tail Surge', damage: 3.9 }] },
      { id: 'e_2103_3', name: 'The Shadow Sovereign',tier: 'boss',      imageKey: 'boss_021',      hp: 38500, maxHp: 38500, atk: 1385, def: 905, skills: [{ name: 'Dark Dominion',   damage: 4.5 }, { name: 'Shadow Surge',   damage: 5.8 }] },
    ],
  },

  // ── CH 22: THE COSMIC WEAVE — Caelestra the Cosmic Weaver ────────────────────
  {
    id: 2201, chapter: 22, part: 1,
    name: 'Star Crawlers',
    description: 'Bone harpies, crystal drakes, and abyss spiders swarm across the collapsing star field as a cosmic presence stirs within.',
    enemies: [
      { id: 'e_2201_1', name: 'Bone Harpy',    tier: 'mob', imageKey: 'mob_029', hp: 17000, maxHp: 17000, atk: 990,  def: 710, skills: [{ name: 'Bone Dive',      damage: 2.5 }, { name: 'Death Shriek',     damage: 3.3 }] },
      { id: 'e_2201_2', name: 'Crystal Drake', tier: 'mob', imageKey: 'mob_030', hp: 17500, maxHp: 17500, atk: 1005, def: 722, skills: [{ name: 'Crystal Bite',    damage: 2.5 }, { name: 'Gem Shard Blast',  damage: 3.3 }] },
      { id: 'e_2201_3', name: 'Abyss Spider',  tier: 'mob', imageKey: 'mob_031', hp: 18000, maxHp: 18000, atk: 1018, def: 735, skills: [{ name: 'Web Ensnare',     damage: 2.5 }, { name: 'Venom Bite',       damage: 3.4 }] },
    ],
  },
  {
    id: 2202, chapter: 22, part: 2,
    name: 'Obsidian Scholar',
    description: 'A dark mage who has studied the dying memories of stars commands the cosmic field, guarding the passage to her mistress.',
    enemies: [
      { id: 'e_2202_1', name: 'Crystal Drake',    tier: 'mob',       imageKey: 'mob_030',       hp: 17800, maxHp: 17800, atk: 1010, def: 725, skills: [{ name: 'Crystal Bite',   damage: 2.5 }, { name: 'Gem Shard Blast',  damage: 3.4 }] },
      { id: 'e_2202_2', name: 'Abyss Spider',     tier: 'mob',       imageKey: 'mob_031',       hp: 18200, maxHp: 18200, atk: 1022, def: 738, skills: [{ name: 'Web Ensnare',    damage: 2.5 }, { name: 'Venom Bite',       damage: 3.4 }] },
      { id: 'e_2202_3', name: 'Obsidian Scholar', tier: 'mini-boss', imageKey: 'mini-boss_020', hp: 31000, maxHp: 31000, atk: 1290, def: 862, skills: [{ name: 'Dark Lecture',   damage: 2.8 }, { name: 'Void Formula',     damage: 3.9 }] },
    ],
  },
  {
    id: 2203, chapter: 22, part: 3,
    name: 'Caelestra the Cosmic Weaver',
    description: 'Caelestra awakens from within a collapsing star — a mage who absorbed the dying memories of entire worlds and rewove them into herself.',
    enemies: [
      { id: 'e_2203_1', name: 'Abyss Spider',             tier: 'mob',       imageKey: 'mob_031',       hp: 18500, maxHp: 18500, atk: 1030, def: 748, skills: [{ name: 'Web Ensnare',    damage: 2.6 }, { name: 'Venom Bite',      damage: 3.5 }] },
      { id: 'e_2203_2', name: 'Obsidian Scholar',          tier: 'mini-boss', imageKey: 'mini-boss_020', hp: 32000, maxHp: 32000, atk: 1310, def: 878, skills: [{ name: 'Dark Lecture',   damage: 2.9 }, { name: 'Void Formula',    damage: 4.0 }] },
      { id: 'e_2203_3', name: 'Caelestra the Cosmic Weaver', tier: 'boss',   imageKey: 'boss_022',      hp: 41500, maxHp: 41500, atk: 1448, def: 945, skills: [{ name: 'Star Collapse',  damage: 4.5 }, { name: 'Cosmic Weave',    damage: 5.9 }] },
    ],
  },

  // ── CH 23: DEMON GLACIER — Glacidra the Frost Demon ──────────────────────────
  {
    id: 2301, chapter: 23, part: 1,
    name: 'Frozen Underworld',
    description: 'Shadow felines, crystal drakes, and abyss spiders emerge from beneath the frozen underworld as a demon mage breaks the seal.',
    enemies: [
      { id: 'e_2301_1', name: 'Shadow Feline', tier: 'mob', imageKey: 'mob_027', hp: 18200, maxHp: 18200, atk: 1020, def: 738, skills: [{ name: 'Shadow Pounce', damage: 2.5 }, { name: 'Dark Claw Strike', damage: 3.4 }] },
      { id: 'e_2301_2', name: 'Crystal Drake', tier: 'mob', imageKey: 'mob_030', hp: 18700, maxHp: 18700, atk: 1035, def: 750, skills: [{ name: 'Crystal Bite',  damage: 2.6 }, { name: 'Gem Shard Blast', damage: 3.4 }] },
      { id: 'e_2301_3', name: 'Abyss Spider',  tier: 'mob', imageKey: 'mob_031', hp: 19200, maxHp: 19200, atk: 1050, def: 762, skills: [{ name: 'Web Ensnare',   damage: 2.6 }, { name: 'Venom Bite',      damage: 3.5 }] },
    ],
  },
  {
    id: 2302, chapter: 23, part: 2,
    name: 'Lysse the Youngest',
    description: 'The youngest of the Crimson bloodline guards the frozen passage, her ice magic shaped by a lineage older than the empire.',
    enemies: [
      { id: 'e_2302_1', name: 'Crystal Drake',      tier: 'mob',       imageKey: 'mob_030',       hp: 19000, maxHp: 19000, atk: 1038, def: 752, skills: [{ name: 'Crystal Bite',   damage: 2.6 }, { name: 'Gem Shard Blast', damage: 3.5 }] },
      { id: 'e_2302_2', name: 'Abyss Spider',       tier: 'mob',       imageKey: 'mob_031',       hp: 19500, maxHp: 19500, atk: 1052, def: 765, skills: [{ name: 'Web Ensnare',    damage: 2.6 }, { name: 'Venom Bite',      damage: 3.5 }] },
      { id: 'e_2302_3', name: 'Lysse the Youngest', tier: 'mini-boss', imageKey: 'mini-boss_021', hp: 32500, maxHp: 32500, atk: 1330, def: 890, skills: [{ name: 'Blood Lash',     damage: 2.8 }, { name: 'Crimson Fang',    damage: 3.9 }] },
    ],
  },
  {
    id: 2303, chapter: 23, part: 3,
    name: 'Glacidra the Frost Demon',
    description: 'Glacidra emerges from beneath the sealed ice — an ice demon mage whose frost is not natural cold but a demonic absolute that corrodes dimensional matter.',
    enemies: [
      { id: 'e_2303_1', name: 'Abyss Spider',          tier: 'mob',       imageKey: 'mob_031',       hp: 19800, maxHp: 19800, atk: 1060, def: 775, skills: [{ name: 'Web Ensnare',   damage: 2.6 }, { name: 'Venom Bite',      damage: 3.6 }] },
      { id: 'e_2303_2', name: 'Lysse the Youngest',    tier: 'mini-boss', imageKey: 'mini-boss_021', hp: 33500, maxHp: 33500, atk: 1352, def: 906, skills: [{ name: 'Blood Lash',    damage: 2.9 }, { name: 'Crimson Fang',    damage: 4.0 }] },
      { id: 'e_2303_3', name: 'Glacidra the Frost Demon', tier: 'boss',   imageKey: 'boss_023',      hp: 44000, maxHp: 44000, atk: 1512, def: 985, skills: [{ name: 'Demon Frost',   damage: 4.6 }, { name: 'Frozen Hellfire', damage: 6.0 }] },
    ],
  },

  // ── CH 24: THE ELDER CRIMSON — Lady Lyssiel ──────────────────────────────────
  {
    id: 2401, chapter: 24, part: 1,
    name: 'Crimson Canopy',
    description: 'Void vipers, abyss spiders, and dark crowmancers swarm the Elder Crimson\'s ancient domain as the eldest of the bloodline stirs.',
    enemies: [
      { id: 'e_2401_1', name: 'Void Viper',      tier: 'mob', imageKey: 'mob_028', hp: 19500, maxHp: 19500, atk: 1058, def: 768, skills: [{ name: 'Venom Lunge',  damage: 2.6 }, { name: 'Void Fang',    damage: 3.5 }] },
      { id: 'e_2401_2', name: 'Abyss Spider',    tier: 'mob', imageKey: 'mob_031', hp: 20000, maxHp: 20000, atk: 1072, def: 782, skills: [{ name: 'Web Ensnare',  damage: 2.7 }, { name: 'Venom Bite',   damage: 3.5 }] },
      { id: 'e_2401_3', name: 'Dark Crowmancer', tier: 'mob', imageKey: 'mob_032', hp: 20500, maxHp: 20500, atk: 1088, def: 796, skills: [{ name: 'Dark Feather', damage: 2.7 }, { name: 'Crow Curse',   damage: 3.6 }] },
    ],
  },
  {
    id: 2402, chapter: 24, part: 2,
    name: 'The Fae Enchantress',
    description: 'A fairy-type mage of elegant and ruthless power guards the Elder Crimson\'s inner sanctum, her enchantments layered into reality itself.',
    enemies: [
      { id: 'e_2402_1', name: 'Abyss Spider',     tier: 'mob',       imageKey: 'mob_031',       hp: 20200, maxHp: 20200, atk: 1078, def: 784, skills: [{ name: 'Web Ensnare',  damage: 2.7 }, { name: 'Venom Bite',    damage: 3.6 }] },
      { id: 'e_2402_2', name: 'Dark Crowmancer',  tier: 'mob',       imageKey: 'mob_032',       hp: 20800, maxHp: 20800, atk: 1095, def: 798, skills: [{ name: 'Dark Feather', damage: 2.7 }, { name: 'Crow Curse',    damage: 3.6 }] },
      { id: 'e_2402_3', name: 'Fae Enchantress',  tier: 'mini-boss', imageKey: 'mini-boss_022', hp: 34000, maxHp: 34000, atk: 1375, def: 918, skills: [{ name: 'Fae Hex',       damage: 2.9 }, { name: 'Pixie Storm',   damage: 4.0 }] },
    ],
  },
  {
    id: 2403, chapter: 24, part: 3,
    name: 'Lady Lyssiel the Elder Crimson',
    description: 'The eldest of the Crimson bloodline surfaces — more ancient than Visalia, patient beyond measure, bearing both elven grace and the full weight of an undying crimson heritage.',
    enemies: [
      { id: 'e_2403_1', name: 'Dark Crowmancer',            tier: 'mob',       imageKey: 'mob_032',       hp: 21000, maxHp: 21000, atk: 1102, def: 808, skills: [{ name: 'Dark Feather',    damage: 2.8 }, { name: 'Crow Curse',        damage: 3.7 }] },
      { id: 'e_2403_2', name: 'Fae Enchantress',            tier: 'mini-boss', imageKey: 'mini-boss_022', hp: 35000, maxHp: 35000, atk: 1398, def: 934, skills: [{ name: 'Fae Hex',          damage: 3.0 }, { name: 'Pixie Storm',       damage: 4.1 }] },
      { id: 'e_2403_3', name: 'Lady Lyssiel the Elder Crimson', tier: 'boss', imageKey: 'boss_024',      hp: 46500, maxHp: 46500, atk: 1578, def: 1025, skills: [{ name: 'Blood Elegy',     damage: 4.6 }, { name: 'Elven Crimson',     damage: 6.1 }] },
    ],
  },

  // ── CH 25: THE FIRST ENTITY — The Origin ─────────────────────────────────────
  {
    id: 2501, chapter: 25, part: 1,
    name: 'Before History',
    description: 'Void vipers, bone harpies, and dark crowmancers manifest from the primordial dark as the oldest being in Aetheria stirs for the first time.',
    enemies: [
      { id: 'e_2501_1', name: 'Void Viper',      tier: 'mob', imageKey: 'mob_028', hp: 20500, maxHp: 20500, atk: 1098, def: 792, skills: [{ name: 'Venom Lunge',  damage: 2.7 }, { name: 'Void Fang',    damage: 3.6 }] },
      { id: 'e_2501_2', name: 'Bone Harpy',      tier: 'mob', imageKey: 'mob_029', hp: 21000, maxHp: 21000, atk: 1112, def: 806, skills: [{ name: 'Bone Dive',    damage: 2.7 }, { name: 'Death Shriek', damage: 3.6 }] },
      { id: 'e_2501_3', name: 'Dark Crowmancer', tier: 'mob', imageKey: 'mob_032', hp: 21600, maxHp: 21600, atk: 1130, def: 822, skills: [{ name: 'Dark Feather', damage: 2.8 }, { name: 'Crow Curse',   damage: 3.7 }] },
    ],
  },
  {
    id: 2502, chapter: 25, part: 2,
    name: 'Briar the Elder Assassin',
    description: 'The elder sister of the Nature Assassin stands at the threshold of the primordial dark — a hunter older and more lethal than any before her.',
    enemies: [
      { id: 'e_2502_1', name: 'Bone Harpy',      tier: 'mob',       imageKey: 'mob_029',       hp: 21200, maxHp: 21200, atk: 1115, def: 808, skills: [{ name: 'Bone Dive',     damage: 2.7 }, { name: 'Death Shriek',   damage: 3.7 }] },
      { id: 'e_2502_2', name: 'Dark Crowmancer',  tier: 'mob',       imageKey: 'mob_032',       hp: 21800, maxHp: 21800, atk: 1132, def: 825, skills: [{ name: 'Dark Feather',  damage: 2.8 }, { name: 'Crow Curse',     damage: 3.7 }] },
      { id: 'e_2502_3', name: 'Briar the Elder',  tier: 'mini-boss', imageKey: 'mini-boss_023', hp: 35500, maxHp: 35500, atk: 1420, def: 950, skills: [{ name: 'Nature Ambush', damage: 3.0 }, { name: 'Elder Poison',   damage: 4.2 }] },
    ],
  },
  {
    id: 2503, chapter: 25, part: 3,
    name: 'The Origin',
    description: 'The First Entity awakens — the oldest being in Aetheria\'s universe, whose existence predates the gods, the void, and the concept of darkness itself. It does not attack from malice. It simply is, and its mere presence unmakes all things.',
    enemies: [
      { id: 'e_2503_1', name: 'Dark Crowmancer', tier: 'mob',       imageKey: 'mob_032',       hp: 22000, maxHp: 22000, atk: 1145, def: 835, skills: [{ name: 'Dark Feather',      damage: 2.8 }, { name: 'Crow Curse',         damage: 3.8 }] },
      { id: 'e_2503_2', name: 'Briar the Elder', tier: 'mini-boss', imageKey: 'mini-boss_023', hp: 36500, maxHp: 36500, atk: 1445, def: 968, skills: [{ name: 'Nature Ambush',    damage: 3.1 }, { name: 'Elder Poison',       damage: 4.3 }] },
      { id: 'e_2503_3', name: 'The Origin',      tier: 'boss',      imageKey: 'boss_025',      hp: 50000, maxHp: 50000, atk: 1655, def: 1075, skills: [{ name: 'Primordial Crush', damage: 4.8 }, { name: 'First Darkness',     damage: 6.4 }] },
    ],
  },
];

export const getEnemyGroupById      = (id)      => ENEMY_GROUPS.find((g) => g.id === id);
export const getEnemyGroupByChapter = (chapter) => ENEMY_GROUPS.find((g) => g.chapter === chapter && g.part === 1);
export const getEnemyImage          = (imageKey) => ENEMY_IMAGES[imageKey] || null;
