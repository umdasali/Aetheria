export const FACTIONS = {
  EMBERVEIL: {
    name: 'EMBERVEIL',
    color: '#FF4500',
    accentColor: '#FF6B35',
    image: require('../../assets/faction/EMBERVEIL.png'),
  },
  GLACIARA: {
    name: 'GLACIARA',
    color: '#00B4D8',
    accentColor: '#90E0EF',
    image: require('../../assets/faction/GLACIARA.png'),
  },
  SUNSPIRE: {
    name: 'SUNSPIRE',
    color: '#D4A017',
    accentColor: '#F5C842',
    image: require('../../assets/faction/SUNSPIRE.png'),
  },
  VERDANIA: {
    name: 'VERDANIA',
    color: '#2ECC71',
    accentColor: '#A8E6CF',
    image: require('../../assets/faction/VERDANIA.png'),
  },
  VOIDMARK: {
    name: 'VOIDMARK',
    color: '#9B59B6',
    accentColor: '#D7BDE2',
    image: require('../../assets/faction/VOIDMARK.png'),
  },
};


export const HEROES = [
  // ── hero_001 · EMBERVEIL · S · Female ─────────────────────────────────────
  {
    id: 'hero_001',
    name: 'Kira Voltz',
    frame: 'STORMCALLER',
    faction: 'EMBERVEIL',
    rank: 'S',
    element: 'Lightning',
    effect: 'PARALYSIS',
    class: 'Attacker',
    cardId: 'EMB-01-KIRA',
    image: require('../../assets/heroes/hero_001.webp'),
    about: 'A relentless thunder mage who channels raw storm energy into devastating chain strikes. She was exiled from EMBERVEIL for refusing orders and now fights entirely on her own terms. She held the ember throne through three cycles of dark silence — and stepped aside the moment its true sovereign returned, without a word asked or given.',
    hp: 3400, atk: 600, def: 185, crit: 550,
    skills: [
      { name: 'Chain Lightning', cost: 2, description: 'Arcs a bolt between all enemies, chaining three times.', damage: 1.8 },
      { name: 'Volt Surge',      cost: 3, description: 'Supercharges a single target with massive shock.', damage: 2.5 },
    ],
    trumpCard: {
      name: 'Thunderstorm Apocalypse',
      description: 'Calls a catastrophic storm striking all enemies 3 times with absolute lightning.',
      damage: 4.8,
      effect: 'Stuns all enemies 1 turn; heals all allies 25% HP',
    },
  },

  // ── hero_002 · EMBERVEIL · A · Female ─────────────────────────────────────
  {
    id: 'hero_002',
    name: 'Ash Renn',
    frame: 'BLAZEGUARD',
    faction: 'EMBERVEIL',
    rank: 'A',
    element: 'Fire',
    effect: 'INCINERATE',
    class: 'Attacker',
    cardId: 'EMB-02-ASH',
    image: require('../../assets/heroes/hero_002.webp'),
    about: 'Elite vanguard of EMBERVEIL. Ash\'s sword is perpetually wreathed in solar flames capable of melting through any barrier. Born in the volcanic highlands, she fights without hesitation.',
    hp: 4200, atk: 520, def: 220, crit: 460,
    skills: [
      { name: 'Crescent Slash', cost: 1, description: 'A swift arc slash dealing moderate damage.', damage: 1.4 },
      { name: 'Dawn Breaker',   cost: 3, description: 'Channels dawn energy for a devastating strike.', damage: 2.8 },
    ],
    trumpCard: {
      name: 'Solar Rending Sword',
      description: 'Channels the power of the sun into an all-destroying blade strike that heals allies.',
      damage: 5.0,
      effect: 'Heals all allies 25% HP',
    },
  },

  // ── hero_003 · GLACIARA · S · Female ──────────────────────────────────────
  {
    id: 'hero_003',
    name: 'Nova Blaine',
    frame: 'FROSTMEND',
    faction: 'GLACIARA',
    rank: 'S',
    element: 'Ice',
    effect: 'GLACIATION',
    class: 'Mage',
    cardId: 'GLA-01-NOVA',
    image: require('../../assets/heroes/hero_003.webp'),
    about: 'Supreme ice mage of GLACIARA. Nova channels glacial frost into devastating arcane constructs — her crystalline spell-towers and blizzard barriers are considered masterpieces of the frozen battlefield.',
    hp: 3000, atk: 640, def: 155, crit: 580,
    skills: [
      { name: 'Frost Lance',    cost: 2, description: 'Hurls razor-sharp ice lances at the enemy.', damage: 2.0 },
      { name: 'Glacial Prison', cost: 3, description: 'Encases a target in an inescapable ice dome.', damage: 2.3 },
    ],
    trumpCard: {
      name: 'Eternal Blizzard',
      description: 'Unleashes a storm of absolute-zero winds that consumes all enemies and heals allies.',
      damage: 5.0,
      effect: 'Stuns all enemies 2 turns; heals all allies 25% HP',
    },
  },

  // ── hero_004 · VERDANIA · A · Female ──────────────────────────────────────
  {
    id: 'hero_004',
    name: 'Lyra Frost',
    frame: 'BLOOMWEAVE',
    faction: 'VERDANIA',
    rank: 'A',
    element: 'Nature',
    effect: 'BLOOM',
    class: 'Mage',
    cardId: 'VRD-01-LYRA',
    image: require('../../assets/heroes/hero_004.webp'),
    about: 'Nature mage of VERDANIA. Lyra commands living flora with arcane precision, weaving vines and blossoms into devastating spell constructs that overwhelm enemies with uncontrolled growth.',
    hp: 2900, atk: 580, def: 160, crit: 540,
    skills: [
      { name: 'Thorn Barrage',  cost: 2, description: 'Launches a volley of enchanted thorns at a target.', damage: 2.0 },
      { name: 'Nature\'s Wrath', cost: 3, description: 'Calls the living forest to crush a single enemy.', damage: 2.3 },
    ],
    trumpCard: {
      name: 'Forest Overgrowth',
      description: 'Summons the fury of VERDANIA\'s ancient forest to consume all enemies and restore allies.',
      damage: 4.0,
      effect: 'Stuns all enemies 1 turn; heals all allies 25% HP',
    },
  },

  // ── hero_005 · VERDANIA · B · Female ──────────────────────────────────────
  {
    id: 'hero_005',
    name: 'Guren Tide',
    frame: 'ROOTGUARD',
    faction: 'VERDANIA',
    rank: 'B',
    element: 'Wind',
    effect: 'ENTANGLEMENT',
    class: 'Defender',
    cardId: 'VRD-02-GUREN',
    image: require('../../assets/heroes/hero_005.webp'),
    about: 'Guardian of the VERDANIA woodlands. Guren\'s body is hardened by years of forest training, allowing her to withstand tremendous punishment while ensnaring enemies with enchanted roots and vines.',
    hp: 6000, atk: 340, def: 470, crit: 260,
    skills: [
      { name: 'Root Bind',   cost: 1, description: 'Ensnares an enemy with enchanted roots.', damage: 0.5 },
      { name: 'Canopy Slam', cost: 2, description: 'Summons tree energy to crash down on all foes.', damage: 1.3 },
    ],
    trumpCard: {
      name: 'Ancient Grove\'s Fury',
      description: 'Calls the ancient forest to crush all enemies beneath roots and trunks.',
      damage: 3.0,
      effect: 'Heals self 20% HP and shields against next 2 hits',
    },
  },

  // ── hero_006 · SUNSPIRE · B · Male ────────────────────────────────────────
  {
    id: 'hero_006',
    name: 'Sol Frost',
    frame: 'SOLARBOW',
    faction: 'SUNSPIRE',
    rank: 'B',
    element: 'Holy',
    effect: 'BLESSING',
    class: 'Support',
    cardId: 'SUN-01-SOL',
    image: require('../../assets/heroes/hero_006.webp'),
    about: 'A sacred herald of SUNSPIRE who fires blessed light arrows that both weaken foes and restore allies. His aim is guided by solar energy — once released, his arrows never miss.',
    hp: 3700, atk: 400, def: 230, crit: 370,
    skills: [
      { name: 'Holy Arrow',   cost: 1, description: 'A sacred arrow that weakens enemy defenses.', damage: 1.2 },
      { name: 'Radiant Mend', cost: 2, description: 'Healing light restores an ally\'s HP.', damage: 0 },
    ],
    trumpCard: {
      name: 'Solar Judgment',
      description: 'A rain of holy arrows descends upon all enemies.',
      damage: 3.5,
      effect: 'Heals team 20% HP and removes all debuffs',
    },
  },

  // ── hero_007 · EMBERVEIL · A · Male ───────────────────────────────────────
  {
    id: 'hero_007',
    name: 'Zane Ember',
    frame: 'FLAMEBLADE',
    faction: 'EMBERVEIL',
    rank: 'A',
    element: 'Fire',
    effect: 'INCINERATE',
    class: 'Attacker',
    cardId: 'EMB-03-ZANE',
    image: require('../../assets/heroes/hero_007.webp'),
    about: 'Champion of EMBERVEIL\'s warrior order. Zane\'s blade is perpetually wreathed in volcanic flame, cutting through armor as if it were paper. He hunts the corruption spreading from beyond the veil.',
    hp: 4400, atk: 490, def: 260, crit: 420,
    skills: [
      { name: 'Flame Slash',     cost: 1, description: 'A searing sword strike igniting the target.', damage: 1.3 },
      { name: 'Eruption Charge', cost: 3, description: 'Charges through enemies wreathed in volcanic flame.', damage: 1.9 },
    ],
    trumpCard: {
      name: 'Volcanic Annihilation',
      description: 'A volcanic explosion of pure flame incinerates everything in range.',
      damage: 4.2,
      effect: 'Stuns all enemies 1 turn; heals all allies 20% HP',
    },
  },

  // ── hero_008 · VOIDMARK · S · Female ──────────────────────────────────────
  {
    id: 'hero_008',
    name: 'Mira Dawn',
    frame: 'VOIDPHANTOM',
    faction: 'VOIDMARK',
    rank: 'S',
    element: 'Void',
    effect: 'CORRUPTION',
    class: 'Attacker',
    cardId: 'VMK-01-MIRA',
    image: require('../../assets/heroes/hero_008.webp'),
    about: 'Shadow phantom of VOIDMARK. Mira strikes before enemies can perceive her presence, vanishing into void space between hits. Her every movement tears small rifts in reality itself.',
    hp: 3300, atk: 610, def: 180, crit: 590,
    skills: [
      { name: 'Void Strike',  cost: 1, description: 'A swift void-infused backstab dealing bonus damage.', damage: 1.6 },
      { name: 'Phantom Step', cost: 2, description: 'Teleports through void and strikes the target three times.', damage: 2.1 },
    ],
    trumpCard: {
      name: 'Void Embrace',
      description: 'Merges with the void and executes a lethal sequence of reality-tearing strikes that heals allies.',
      damage: 5.2,
      effect: 'Heals all allies 25% HP',
    },
  },

  // ── hero_009 · SUNSPIRE · B · Male ────────────────────────────────────────
  {
    id: 'hero_009',
    name: 'Kane Light',
    frame: 'IRONSPIRE',
    faction: 'SUNSPIRE',
    rank: 'B',
    element: 'Holy',
    effect: 'BLESSING',
    class: 'Defender',
    cardId: 'SUN-02-KANE',
    image: require('../../assets/heroes/hero_009.webp'),
    about: 'Iron bulwark of SUNSPIRE. Kane\'s sacred armor has never been breached in over 300 battles. He stands between his allies and annihilation without flinching.',
    hp: 8000, atk: 380, def: 620, crit: 220,
    skills: [
      { name: 'Holy Guard', cost: 1, description: 'Raises sacred defense reducing incoming damage.', damage: 0.6 },
      { name: 'Light Slam', cost: 3, description: 'Slams the ground creating a holy shockwave.', damage: 1.6 },
    ],
    trumpCard: {
      name: 'Fortress Eternal',
      description: 'Transforms into an unbreakable holy fortress that stuns all enemies.',
      damage: 2.0,
      effect: 'Reduces all incoming damage 70% for 2 turns and stuns all enemies 1 turn',
    },
  },

  // ── hero_010 · EMBERVEIL · A · Female ─────────────────────────────────────
  {
    id: 'hero_010',
    name: 'Tara Wind',
    frame: 'EMBERDANCER',
    faction: 'EMBERVEIL',
    rank: 'A',
    element: 'Fire',
    effect: 'FLAMEDANCE',
    class: 'Support',
    cardId: 'EMB-04-TARA',
    image: require('../../assets/heroes/hero_010.webp'),
    about: 'EMBERVEIL\'s fire-dancing sentinel. Tara amplifies her allies with volcanic energy while her own movements flow like living flame — impossible to track and lethal to approach.',
    hp: 3300, atk: 320, def: 260, crit: 340,
    skills: [
      { name: 'Fire Waltz',   cost: 1, description: 'Dances through flames raising team attack power.', damage: 0.8 },
      { name: 'Ember Shield', cost: 2, description: 'Ember aura deflects and absorbs incoming attacks.', damage: 0 },
    ],
    trumpCard: {
      name: 'Eye of the Flame',
      description: 'Becomes the center of a volcanic firestorm devastating all enemies and restoring allies.',
      damage: 3.0,
      effect: 'Heals all allies 25% HP; stuns all enemies 1 turn',
    },
  },

  // ── hero_011 · GLACIARA · A · Female ──────────────────────────────────────
  {
    id: 'hero_011',
    name: 'Vera Grove',
    frame: 'FROSTVEIL',
    faction: 'GLACIARA',
    rank: 'A',
    element: 'Ice',
    effect: 'PERMAFROST',
    class: 'Defender',
    cardId: 'GLA-02-VERA',
    image: require('../../assets/heroes/hero_011.webp'),
    about: 'Ancient guardian of GLACIARA\'s frozen tundra. Vera\'s body has been tempered by centuries of blizzards, making her near-indestructible and capable of regenerating rapidly in freezing conditions.',
    hp: 7000, atk: 310, def: 570, crit: 170,
    skills: [
      { name: 'Frost Wall',   cost: 1, description: 'Raises an ice wall to absorb enemy attacks.', damage: 0.5 },
      { name: 'Glacial Slam', cost: 3, description: 'Slams the ground with glacial force hitting all enemies.', damage: 1.5 },
    ],
    trumpCard: {
      name: 'Permafrost Bastion',
      description: 'Calls the power of the eternal glacier to crush all enemies and stun them in place.',
      damage: 2.0,
      effect: 'Reduces all incoming damage 70% for 2 turns; stuns all enemies 1 turn',
    },
  },

  // ── hero_012 · SUNSPIRE · S · Female ──────────────────────────────────────
  {
    id: 'hero_012',
    name: 'Aura Bloom',
    frame: 'SOLARMAGE',
    faction: 'SUNSPIRE',
    rank: 'S',
    element: 'Holy',
    effect: 'RADIANCE',
    class: 'Mage',
    cardId: 'SUN-03-AURA',
    image: require('../../assets/heroes/hero_012.webp'),
    about: 'The Radiant Sovereign of SUNSPIRE — chosen not by bloodline or election but by the light itself during the Ceremony of Ascension. Aura commands solar energy and sacred flame at a level no mage born of training can replicate. Her brilliance on the battlefield is not considered divine. It is.',
    hp: 3400, atk: 760, def: 175, crit: 700, sovereign: true,
    skills: [
      { name: 'Solar Rend',   cost: 2, description: 'Channels concentrated sovereign solar energy that ignores elemental resistances.', damage: 2.6 },
      { name: 'Sacred Drain', cost: 3, description: 'Draws upon holy light to devastate enemies and restore all allies simultaneously.', damage: 2.2 },
    ],
    trumpCard: {
      name: 'Divine Radiance',
      description: 'Calls down the full sovereign power of SUNSPIRE\'s sacred flame — absolute holy light consuming all enemies at once and restoring the team.',
      damage: 6.0,
      effect: 'Stuns all enemies 2 turns; heals entire team 30% HP; removes all debuffs from allies',
    },
  },

  // ── hero_013 · VOIDMARK · A · Female ──────────────────────────────────────
  {
    id: 'hero_013',
    name: 'Omen Null',
    frame: 'VOIDOMEN',
    faction: 'VOIDMARK',
    rank: 'A',
    element: 'Void',
    effect: 'VOID_OMEN',
    class: 'Mage',
    cardId: 'VMK-03-OMEN',
    image: require('../../assets/heroes/hero_013.webp'),
    about: 'A void scholar who has spent decades studying entities older than recorded history. Omen perceives abyss energy the way others perceive sound — as constant, layered information. She left VOIDMARK\'s inner court when she realized the court feared what she knew more than they feared the void itself.',
    hp: 3000, atk: 580, def: 155, crit: 540,
    skills: [
      { name: 'Void Reading', cost: 2, description: 'Channels dimensional knowledge into a crushing void strike that bypasses barriers.', damage: 2.3 },
      { name: 'Abyss Drain',  cost: 3, description: 'Draws void energy from an enemy, converting it to HP for the caster.', damage: 1.8 },
    ],
    trumpCard: {
      name: 'Verdant Rift',
      description: 'Tears open a dimensional rift beneath all enemies, dragging them through void space.',
      damage: 4.5,
      effect: 'Stuns all enemies 2 turns; heals self 20% HP',
    },
  },

  // ── hero_014 · VOIDMARK · B · Female ──────────────────────────────────────
  {
    id: 'hero_014',
    name: 'Shade Vex',
    frame: 'DARKSTEP',
    faction: 'VOIDMARK',
    rank: 'B',
    element: 'Void',
    effect: 'SHADOW',
    class: 'Attacker',
    cardId: 'VMK-02-SHADE',
    image: require('../../assets/heroes/hero_014.webp'),
    about: 'Assassin of the VOIDMARK faction. Shade strikes from angles that don\'t exist in normal space. Her targets are erased before they can register the attack.',
    hp: 3200, atk: 500, def: 175, crit: 490,
    skills: [
      { name: 'Shadow Strike', cost: 1, description: 'A void-infused backstab dealing bonus damage.', damage: 1.6 },
      { name: 'Void Step',     cost: 2, description: 'Teleports through shadow and strikes three times.', damage: 2.1 },
    ],
    trumpCard: {
      name: 'Death\'s Embrace',
      description: 'Merges with void and executes a lethal sequence that heals allies.',
      damage: 4.8,
      effect: 'Heals all allies 25% HP',
    },
  },

  // ── hero_015 · GLACIARA · B · Female ──────────────────────────────────────
  {
    id: 'hero_015',
    name: 'Vex Hollow',
    frame: 'FROSTWALL',
    faction: 'GLACIARA',
    rank: 'B',
    element: 'Ice',
    effect: 'CHILL',
    class: 'Defender',
    cardId: 'GLA-03-VEX',
    image: require('../../assets/heroes/hero_015.webp'),
    about: 'A warrior tempered by GLACIARA\'s most brutal winters. Vex feels no cold and channels frozen energy through her body, converting incoming force into devastating ice-charged counterstrikes.',
    hp: 6600, atk: 380, def: 530, crit: 220,
    skills: [
      { name: 'Frost Absorb', cost: 1, description: 'Absorbs incoming attack converting it to frozen energy.', damage: 0.5 },
      { name: 'Glacial Slam', cost: 3, description: 'Unleashes absorbed frost energy on all enemies.', damage: 1.9 },
    ],
    trumpCard: {
      name: 'Frost Collapse',
      description: 'Collapses frozen energy pulling all enemies into an ice vortex and heals self.',
      damage: 3.6,
      effect: 'Heals self 30% HP; stuns all enemies 1 turn',
    },
  },

  // ── hero_016 · EMBERVEIL · C · Male · Defender ─────────────────────────────
  // Uncomment when assets/heroes/hero_016.webp is ready

  {
    id: 'hero_016',
    name: 'Brant Forge',
    frame: 'EMBERWALL',
    faction: 'EMBERVEIL',
    rank: 'C',
    element: 'Fire',
    effect: 'HEATSHIELD',
    class: 'Defender',
    cardId: 'EMB-05-BRANT',
    image: require('../../assets/heroes/hero_016.webp'),
    about: 'A battle-hardened shield-bearer of EMBERVEIL who uses his body as a living wall, absorbing volcanic strikes and redirecting that raw heat into explosive counterattacks. He has survived more than any other soldier in the faction.',
    hp: 7200, atk: 350, def: 580, crit: 200,
    skills: [
      { name: 'Ember Block',    cost: 1, description: 'Raises a flaming barrier absorbing the next attack.', damage: 0.4 },
      { name: 'Heat Rebound',   cost: 2, description: 'Releases absorbed fire energy back at all enemies.', damage: 1.4 },
    ],
    trumpCard: {
      name: 'Volcanic Fortress',
      description: 'Transforms into an erupting bastion that stuns all enemies.',
      damage: 2.8,
      effect: 'Shields team against next 2 hits; stuns all enemies 1 turn',
    },
  },


  // ── hero_017 · GLACIARA · C · Male · Support ───────────────────────────────
  // Uncomment when assets/heroes/hero_017.webp is ready
  
  {
    id: 'hero_017',
    name: 'Colt Vane',
    frame: 'SNOWMENDER',
    faction: 'GLACIARA',
    rank: 'C',
    element: 'Ice',
    effect: 'FROSTMEND',
    class: 'Support',
    cardId: 'GLA-04-COLT',
    image: require('../../assets/heroes/hero_017.webp'),
    about: 'A field medic of GLACIARA who channels glacial energy to seal wounds and freeze bleeding in real time. Colt has never lost a patient on the battlefield and his presence alone stabilises allied morale under siege.',
    hp: 4100, atk: 280, def: 310, crit: 220,
    skills: [
      { name: 'Ice Mend',       cost: 1, description: 'Seals an ally\'s wounds with restorative frost.', damage: 0 },
      { name: 'Cryo Barrier',   cost: 2, description: 'Wraps an ally in an icy shield absorbing the next hit.', damage: 0 },
    ],
    trumpCard: {
      name: 'Glacial Renewal',
      description: 'Floods the field with healing cold, restoring the entire team and granting shields.',
      damage: 0,
      effect: 'Heals all allies 35% HP; shields team against next 1 hit each',
    },
  },
  

  // ── hero_018 · SUNSPIRE · A · Female · Attacker ────────────────────────────
  // Uncomment when assets/heroes/hero_018.webp is ready
  
  {
    id: 'hero_018',
    name: 'Lyse Dawn',
    frame: 'SOLARFANG',
    faction: 'SUNSPIRE',
    rank: 'A',
    element: 'Holy',
    effect: 'SMITE',
    class: 'Attacker',
    cardId: 'SUN-04-LYSE',
    image: require('../../assets/heroes/hero_018.webp'),
    about: 'A divine huntress of SUNSPIRE who pursues corrupted entities with holy blades charged by direct sunlight. Lyse strikes with blinding speed and vanishes before her targets can register the attack.',
    hp: 3500, atk: 530, def: 200, crit: 480,
    skills: [
      { name: 'Solar Fang',     cost: 1, description: 'A swift holy-charged strike that burns on impact.', damage: 1.5 },
      { name: 'Radiant Lunge',  cost: 3, description: 'Charges through all enemies in a single solar burst.', damage: 2.4 },
    ],
    trumpCard: {
      name: 'Holy Execution',
      description: 'Channels divine judgment into a single annihilating strike that heals allies.',
      damage: 4.8,
      effect: 'Heals all allies 25% HP; stuns all enemies 1 turn',
    },
  },
  

  // ── hero_019 · VERDANIA · C · Male · Attacker ──────────────────────────────
  // Uncomment when assets/heroes/hero_019.webp is ready
 
  {
    id: 'hero_019',
    name: 'Bryn Thorn',
    frame: 'THORNBLADE',
    faction: 'VERDANIA',
    rank: 'C',
    element: 'Nature',
    effect: 'TOXIN',
    class: 'Attacker',
    cardId: 'VRD-04-BRYN',
    image: require('../../assets/heroes/hero_019.webp'),
    about: 'A scrappy brawler from VERDANIA\'s outer villages who forged his fighting style from the wild itself. Bryn\'s strikes carry venomous thorn energy that lingers long after the blow lands.',
    hp: 3800, atk: 470, def: 190, crit: 420,
    skills: [
      { name: 'Thorn Stab',     cost: 1, description: 'A fast strike that injects a stacking toxin.', damage: 1.3 },
      { name: 'Briar Rush',     cost: 2, description: 'Charges through enemies leaving a trail of poison thorns.', damage: 1.7 },
    ],
    trumpCard: {
      name: 'Toxic Overgrowth',
      description: 'Detonates every toxin on the field in a catastrophic nature burst, stunning all enemies.',
      damage: 3.8,
      effect: 'Stuns all enemies 1 turn; heals all allies 20% HP',
    },
  },


  // ── hero_020 · VOIDMARK · A · Male · Mage ──────────────────────────────────
  // Uncomment when assets/heroes/hero_020.webp is ready

  {
    id: 'hero_020',
    name: 'Kael Rift',
    frame: 'VOIDWEAVER',
    faction: 'VOIDMARK',
    rank: 'A',
    element: 'Void',
    effect: 'NULLIFY',
    class: 'Mage',
    cardId: 'VMK-03-KAEL',
    image: require('../../assets/heroes/hero_020.webp'),
    about: 'A void scholar of VOIDMARK who studies and weaponises dimensional tears. Kael folds space around enemies, trapping them in pocket dimensions where his spells arrive from every angle simultaneously.',
    hp: 3100, atk: 600, def: 165, crit: 555,
    skills: [
      { name: 'Rift Bolt',      cost: 2, description: 'Fires a bolt through folded space hitting twice.', damage: 2.2 },
      { name: 'Null Zone',      cost: 3, description: 'Creates a void field silencing all enemies inside.', damage: 1.6 },
    ],
    trumpCard: {
      name: 'Dimensional Collapse',
      description: 'Collapses pocket dimensions on all enemies simultaneously, stunning them.',
      damage: 4.6,
      effect: 'Stuns all enemies 2 turns; heals all allies 25% HP',
    },
  },


  // ── hero_021 · EMBERVEIL · B · Female · Mage ───────────────────────────────
  // Uncomment when assets/heroes/hero_021.webp is ready
  
  {
    id: 'hero_021',
    name: 'Nyx Flame',
    frame: 'ASHCALLER',
    faction: 'EMBERVEIL',
    rank: 'B',
    element: 'Fire',
    effect: 'SCORCH',
    class: 'Mage',
    cardId: 'EMB-06-NYX',
    image: require('../../assets/heroes/hero_021.webp'),
    about: 'A volatile mage of EMBERVEIL who weaponises wildfire in its purest form. Nyx refuses to contain her power — she simply feeds it. Enemies who survive her opening blast rarely last long enough to regret it.',
    hp: 2900, atk: 555, def: 155, crit: 510,
    skills: [
      { name: 'Scorch',      cost: 2, description: 'Ignites a target in uncontrolled wildfire dealing heavy damage.', damage: 1.8 },
      { name: 'Pyroclasm',   cost: 3, description: 'Releases an explosive burst of ash and flame over all enemies.', damage: 2.4 },
    ],
    trumpCard: {
      name: 'Inferno Bloom',
      description: 'Erupts into a column of pure wildfire consuming all enemies.',
      damage: 4.0,
      effect: 'Burns all enemies 3 turns; heals all allies 20% HP',
    },
  },
  

  // ── hero_022 · EMBERVEIL · A · Male · Defender ─────────────────────────────
  // Uncomment when assets/heroes/hero_022.webp is ready

  {
    id: 'hero_022',
    name: 'Rook Cinder',
    frame: 'IRONVEIL',
    faction: 'EMBERVEIL',
    rank: 'A',
    element: 'Fire',
    effect: 'FLAMEGUARD',
    class: 'Defender',
    cardId: 'EMB-07-ROOK',
    image: require('../../assets/heroes/hero_022.webp'),
    about: 'Steel-willed guardian of EMBERVEIL\'s inner fortress. Rook\'s armour was forged in active volcanic vents and redirects incoming damage as superheated steam capable of blinding and burning attackers.',
    hp: 6800, atk: 370, def: 560, crit: 210,
    skills: [
      { name: 'Cinder Guard',  cost: 1, description: 'Hardens volcanic armour, reducing the next hit taken.', damage: 0.5 },
      { name: 'Molten Rebound',cost: 2, description: 'Releases absorbed heat as a burst of scalding steam at all enemies.', damage: 1.4 },
    ],
    trumpCard: {
      name: 'Slag Fortress',
      description: 'Encases himself in volcanic slag and erupts outward, shielding allies and stunning all enemies.',
      damage: 2.5,
      effect: 'Shields team against next 2 hits; stuns all enemies 1 turn',
    },
  },


  // ── hero_023 · EMBERVEIL · C · Female · Support ────────────────────────────
  {
    id: 'hero_023',
    name: 'Vel Spark',
    frame: 'SPARKWEAVE',
    faction: 'EMBERVEIL',
    rank: 'C',
    element: 'Lightning',
    effect: 'VOLTMEND',
    class: 'Support',
    cardId: 'EMB-08-VEL',
    image: require('../../assets/heroes/hero_023.webp'),
    about: 'A chaotic young field operative of EMBERVEIL who channels electrical surges to disrupt enemies and jolt fallen allies back into action. Her unpredictable energy is difficult to anticipate even for her own team.',
    hp: 3600, atk: 290, def: 230, crit: 240,
    skills: [
      { name: 'Volt Jolt',    cost: 1, description: 'Fires a disruptive electric pulse that delays an enemy\'s next action.', damage: 0.6 },
      { name: 'Static Surge', cost: 2, description: 'Overcharges an ally boosting their ATK and CRIT for 1 turn.', damage: 0 },
    ],
    trumpCard: {
      name: 'Chain Revival',
      description: 'Sends a full electrical surge through all allies restoring momentum and stunning all enemies.',
      damage: 0,
      effect: 'Heals all allies 25% HP; stuns all enemies 1 turn',
    },
  },
  // ── hero_024 · GLACIARA · S · Male · Attacker ──────────────────────────────

  {
    id: 'hero_024',
    name: 'Dusk Vale',
    frame: 'GLACIALBLADE',
    faction: 'GLACIARA',
    rank: 'S',
    element: 'Ice',
    effect: 'SHATTER',
    class: 'Attacker',
    cardId: 'GLA-05-DUSK',
    image: require('../../assets/heroes/hero_024.webp'),
    about: 'The lone wolf hunter of GLACIARA — an anomaly among the faction\'s warrior elite. Dusk moves through frozen terrain like a living shadow, shattering targets with strikes that exploit the brittleness extreme cold creates in both armour and flesh.',
    hp: 3400, atk: 620, def: 200, crit: 570,
    skills: [
      { name: 'Ice Shatter',   cost: 2, description: 'A devastating strike that shatters frozen targets for bonus damage.', damage: 2.1 },
      { name: 'Freeze Point',  cost: 3, description: 'Drops temperature to absolute zero at a single point, obliterating the target.', damage: 2.8 },
    ],
    trumpCard: {
      name: 'Absolute Zero',
      description: 'Flash-freezes all enemies and detonates the crystallised forms.',
      damage: 5.3,
      effect: 'Stuns all enemies 2 turns; heals all allies 20% HP',
    },
  },


  // ── hero_025 · GLACIARA · A · Female · Mage ────────────────────────────────
  
  {
    id: 'hero_025',
    name: 'Sable Hail',
    frame: 'WINTERMAGE',
    faction: 'GLACIARA',
    rank: 'A',
    element: 'Ice',
    effect: 'BLIZZARD',
    class: 'Mage',
    cardId: 'GLA-06-SABLE',
    image: require('../../assets/heroes/hero_025.webp'),
    about: 'A storm-class mage of GLACIARA who conjures blizzards on command. Sable prefers overwhelming area coverage over precision — her philosophy is simple: if enough ice falls, nothing survives.',
    hp: 2950, atk: 595, def: 160, crit: 545,
    skills: [
      { name: 'Hailstorm',    cost: 2, description: 'Conjures a barrage of ice shards striking all enemies.', damage: 1.9 },
      { name: 'Ice Burst',    cost: 3, description: 'Concentrates storm energy into a single devastating ice explosion.', damage: 2.4 },
    ],
    trumpCard: {
      name: 'Blizzard Apex',
      description: 'Summons a catastrophic blizzard that buries the entire enemy formation and heals allies.',
      damage: 4.5,
      effect: 'Stuns all enemies 2 turns; heals all allies 20% HP',
    },
  },
  

  // ── hero_026 · GLACIARA · B · Male · Defender ──────────────────────────────

  {
    id: 'hero_026',
    name: 'Roan Tusk',
    frame: 'FROSTBARK',
    faction: 'GLACIARA',
    rank: 'B',
    element: 'Ice',
    effect: 'ICEWALL',
    class: 'Defender',
    cardId: 'GLA-07-ROAN',
    image: require('../../assets/heroes/hero_026.webp'),
    about: 'A colossus of GLACIARA who has spent decades hardening his body against arctic extremes. Roan\'s skin crystallises under sustained cold, forming natural ice-plate armour that grows denser with every hit he absorbs.',
    hp: 6900, atk: 345, def: 550, crit: 195,
    skills: [
      { name: 'Ice Armour',    cost: 1, description: 'Crystallises the skin reducing incoming damage for 1 turn.', damage: 0.4 },
      { name: 'Tundra Slam',   cost: 2, description: 'Drives a fist of glacial force into the ground stunning nearby enemies.', damage: 1.4 },
    ],
    trumpCard: {
      name: 'Crystal Bastion',
      description: 'Crystallises completely then detonates outward in a storm of ice shrapnel, healing allies and stunning enemies.',
      damage: 2.2,
      effect: 'Heals all allies 25% HP; stuns all enemies 1 turn',
    },
  },


  // ── hero_027 · SUNSPIRE · A · Male · Mage ──────────────────────────────────

  {
    id: 'hero_027',
    name: 'Cyren Halo',
    frame: 'PRISMWEAVE',
    faction: 'SUNSPIRE',
    rank: 'A',
    element: 'Holy',
    effect: 'ILLUMINATE',
    class: 'Mage',
    cardId: 'SUN-05-CYREN',
    image: require('../../assets/heroes/hero_027.webp'),
    about: 'A prism mage of SUNSPIRE who treats combat as a geometry problem. Cyren refracts raw sunlight into precision arcane beams — find the correct angle and a single ray can pass through an entire enemy formation.',
    hp: 3050, atk: 610, def: 160, crit: 560,
    skills: [
      { name: 'Prism Ray',     cost: 2, description: 'Refracts a solar beam through multiple enemies in a line.', damage: 2.2 },
      { name: 'Solar Cascade', cost: 3, description: 'Splits light into a cascade of beams hitting all enemies.', damage: 1.8 },
    ],
    trumpCard: {
      name: 'Divine Prism',
      description: 'Refracts sunlight through every target simultaneously with blinding intensity, stunning all enemies.',
      damage: 5.0,
      effect: 'Stuns all enemies 1 turn; heals all allies 20% HP',
    },
  },


  // ── hero_028 · SUNSPIRE · B · Female · Support ─────────────────────────────

  {
    id: 'hero_028',
    name: 'Wren Gild',
    frame: 'HOLYMEND',
    faction: 'SUNSPIRE',
    rank: 'B',
    element: 'Holy',
    effect: 'SANCTIFY',
    class: 'Support',
    cardId: 'SUN-06-WREN',
    image: require('../../assets/heroes/hero_028.webp'),
    about: 'A gentle but unyielding cleric of SUNSPIRE who channels divine light into restorative energy. Wren believes no wound is beyond healing and will exhaust herself entirely before allowing an ally to fall.',
    hp: 4000, atk: 260, def: 290, crit: 210,
    skills: [
      { name: 'Holy Mend',    cost: 1, description: 'Channels sacred light to restore a significant portion of an ally\'s HP.', damage: 0 },
      { name: 'Sanctify',     cost: 2, description: 'Purges debuffs from an ally and grants a brief damage reduction shield.', damage: 0 },
    ],
    trumpCard: {
      name: 'Aureate Miracle',
      description: 'Floods the battlefield with divine golden light cleansing all allies.',
      damage: 0,
      effect: 'Heals all allies 30% HP; removes all debuffs from team',
    },
  },


  // ── hero_029 · SUNSPIRE · C · Female · Attacker ────────────────────────────
  // Uncomment when assets/heroes/hero_029.webp is ready

  {
    id: 'hero_029',
    name: 'Cade Blaze',
    frame: 'SOLARSTRIKE',
    faction: 'SUNSPIRE',
    rank: 'C',
    element: 'Holy',
    effect: 'SMITE',
    class: 'Attacker',
    cardId: 'SUN-07-CADE',
    image: require('../../assets/heroes/hero_029.webp'),
    about: 'A young zealot of SUNSPIRE still proving herself on the battlefield. Cade\'s technique is raw and forward, compensating for inexperience with relentless aggression and an unshakeable conviction that sunlight favours the bold.',
    hp: 3600, atk: 450, def: 195, crit: 390,
    skills: [
      { name: 'Holy Strike',   cost: 1, description: 'A direct holy-charged blow dealing solid single-target damage.', damage: 1.3 },
      { name: 'Zealot Rush',   cost: 2, description: 'Charges forward with radiant force striking all enemies in a line.', damage: 1.6 },
    ],
    trumpCard: {
      name: 'Righteous Smite',
      description: 'Channels total conviction into a singular devastating holy blow that heals allies.',
      damage: 3.5,
      effect: 'Heals all allies 25% HP; stuns all enemies 1 turn',
    },
  },


  // ── hero_030 · VERDANIA · S · Female · Attacker ────────────────────────────
  // Uncomment when assets/heroes/hero_030.webp is ready
  
  {
    id: 'hero_030',
    name: 'Iris Vale',
    frame: 'VERDANTFANG',
    faction: 'VERDANIA',
    rank: 'S',
    element: 'Nature',
    effect: 'THORNSTRIKE',
    class: 'Attacker',
    cardId: 'VRD-05-IRIS',
    image: require('../../assets/heroes/hero_030.webp'),
    about: 'The Thornborn Queen of VERDANIA — crowned by the jungle itself during the Night of Blossoming when the eldest trees flowered for the first time in a thousand years. Iris feels every wound dealt to her forest as if carved into her own skin. On the battlefield she is the forest: she does not hunt her targets, she becomes the terrain they are standing on.',
    hp: 4000, atk: 780, def: 225, crit: 720, sovereign: true,
    skills: [
      { name: 'Thorn Blitz',      cost: 2, description: 'Launches a sovereign volley of tracking thorns that pierce through elemental defenses.', damage: 2.4 },
      { name: 'Predator\'s Mark', cost: 3, description: 'Marks an enemy — all subsequent attacks deal massively increased damage to them.', damage: 3.0 },
    ],
    trumpCard: {
      name: 'Verdant Fury',
      description: 'Becomes one with the ancient forest and erupts in a sovereign storm of lethal thorns across the entire battlefield.',
      damage: 5.8,
      effect: 'Stuns all enemies 1 turn; heals self 20% HP',
    },
  },
  

  // ── hero_031 · VERDANIA · B · Female · Support ─────────────────────────────

  {
    id: 'hero_031',
    name: 'Sage Burl',
    frame: 'BLOOMKEEP',
    faction: 'VERDANIA',
    rank: 'B',
    element: 'Nature',
    effect: 'REJUVENATE',
    class: 'Support',
    cardId: 'VRD-06-SAGE',
    image: require('../../assets/heroes/hero_031.webp'),
    about: 'A wandering herbalist of VERDANIA carrying centuries of forest medicine. Sage can accelerate a fighter\'s natural healing to impossible rates, closing critical wounds mid-combat using only what grows underfoot.',
    hp: 4200, atk: 270, def: 300, crit: 220,
    skills: [
      { name: 'Herbal Mend',      cost: 1, description: 'Applies a fast-acting herbal compress restoring ally HP over time.', damage: 0 },
      { name: 'Overgrowth Pulse', cost: 2, description: 'Sends a wave of nature energy boosting DEF for all allies.', damage: 0 },
    ],
    trumpCard: {
      name: 'Ancient Remedy',
      description: 'Channels primordial forest healing energy through the entire team.',
      damage: 0,
      effect: 'Heals all allies 40% HP; shields team against next 1 hit each',
    },
  },

  // ── hero_032 · VERDANIA · A · Female · Defender ────────────────────────────
  
  {
    id: 'hero_032',
    name: 'Rae Vine',
    frame: 'VERDANSHIELD',
    faction: 'VERDANIA',
    rank: 'A',
    element: 'Nature',
    effect: 'BARKSKIN',
    class: 'Defender',
    cardId: 'VRD-07-RAE',
    image: require('../../assets/heroes/hero_032.webp'),
    about: 'A sentinel of VERDANIA who has merged her body with living bark and vine. Rae\'s skin is reinforced by constantly regenerating plant-matter — the longer a fight lasts, the harder she becomes to damage.',
    hp: 6500, atk: 330, def: 545, crit: 180,
    skills: [
      { name: 'Bark Shield',  cost: 1, description: 'Hardens bark armour around self or an ally absorbing the next attack.', damage: 0.4 },
      { name: 'Vine Bind',    cost: 2, description: 'Ensnares all enemies with animated vines slowing their attacks.', damage: 0.6 },
    ],
    trumpCard: {
      name: 'Living Fortress',
      description: 'Merges fully with the forest floor and erupts with crushing organic growth, stunning all enemies.',
      damage: 2.8,
      effect: 'Grants a shield equal to 30% max HP; stuns all enemies 1 turn',
    },
  },
  

  // ── hero_033 · VOIDMARK · S · Female · Defender ────────────────────────────

  {
    id: 'hero_033',
    name: 'Nyx Vael',
    frame: 'ABYSSALTHRONE',
    faction: 'VOIDMARK',
    rank: 'S',
    element: 'Void',
    effect: 'ABYSS',
    class: 'Defender',
    cardId: 'VMK-04-NYX',
    image: require('../../assets/heroes/hero_033.webp'),
    about: 'The unopposed sovereign of VOIDMARK — a void-forged empress whose body has merged with the abyss itself and been reborn stronger. Nyx does not debate authority; in a realm where reality tears without warning, she is the only constant. Three challenger factions dissolved attempting to dethrone her. Their names are no longer spoken in VOIDMARK, which here is a fate more feared than death.',
    hp: 9500, atk: 500, def: 800, crit: 300, sovereign: true,
    skills: [
      { name: 'Void Absorb',   cost: 1, description: 'Pulls an incoming attack into sovereign void space, nullifying damage and storing energy for a counter-burst.', damage: 0.8 },
      { name: 'Abyss Release', cost: 3, description: 'Detonates all accumulated void energy in a sovereign-class area blast that ignores DEF.', damage: 2.6 },
    ],
    trumpCard: {
      name: 'Void Sovereignty',
      description: 'Asserts absolute dominion over the void — opens a sovereign rift beneath all enemies and detonates the dimensional collapse inward.',
      damage: 5.8,
      effect: 'Stuns all enemies 2 turns; heals self 25% HP',
    },
  },

  // ── hero_034 · VOIDMARK · A · Female · Support ─────────────────────────────

  {
    id: 'hero_034',
    name: 'Nera Null',
    frame: 'SOULBIND',
    faction: 'VOIDMARK',
    rank: 'A',
    element: 'Void',
    effect: 'LIFEDRAIN',
    class: 'Support',
    cardId: 'VMK-05-NERA',
    image: require('../../assets/heroes/hero_034.webp'),
    about: 'A void medium of VOIDMARK who siphons life force from the battlefield and redistributes it among her allies. Nera walks the thin line between healing and corruption — her methods work, and she stopped asking whether they should.',
    hp: 3800, atk: 350, def: 250, crit: 300,
    skills: [
      { name: 'Life Siphon',   cost: 1, description: 'Drains life energy from an enemy, partially restoring an ally\'s HP.', damage: 0.8 },
      { name: 'Null Transfer', cost: 2, description: 'Extracts void energy from the environment and channels it into ally DEF.', damage: 0 },
    ],
    trumpCard: {
      name: 'Mass Absorption',
      description: 'Drains life simultaneously from all enemies and channels it into the team.',
      damage: 1.8,
      effect: 'Deals damage to all enemies; heals all allies 25% HP',
    },
  },

  // ── hero_036 · VOIDMARK · S · Female · Mage ───────────────────────────────
  {
    id: 'hero_036',
    name: 'Vesper Hex',
    frame: 'SPIRITWEAVE',
    faction: 'VOIDMARK',
    rank: 'S',
    element: 'Void',
    effect: 'VOID_CURSE',
    class: 'Mage',
    cardId: 'VMK-07-VESPER',
    image: require('../../assets/heroes/hero_036.webp'),
    about: 'A supreme void mage of VOIDMARK whose consciousness partially inhabits the space between dimensions. Vesper doesn\'t merely cast spells — she rewrites the rules of engagement at will, cursing entire formations and bending dimensional law to her design.',
    hp: 3400, atk: 640, def: 200, crit: 580,
    skills: [
      { name: 'Void Curse',    cost: 2, description: 'Brands an enemy with a consuming void mark that amplifies all damage they receive for 2 turns.', damage: 2.2 },
      { name: 'Soul Fracture', cost: 3, description: 'Shatters a target\'s connection to reality dealing catastrophic void damage that bypasses barriers.', damage: 2.6 },
    ],
    trumpCard: {
      name: 'Abyssal Dominion',
      description: 'Asserts total dominion over the void, consuming all enemies in dimensional energy.',
      damage: 5.5,
      effect: 'Stuns all enemies 2 turns; heals all allies 25% HP',
    },
  },

  // ── hero_035 · VOIDMARK · B · Female · Attacker ────────────────────────────

  {
    id: 'hero_035',
    name: 'Flux Rend',
    frame: 'DARKBLADE',
    faction: 'VOIDMARK',
    rank: 'B',
    element: 'Void',
    effect: 'PHANTOMSTRIKE',
    class: 'Attacker',
    cardId: 'VMK-06-FLUX',
    image: require('../../assets/heroes/hero_035.webp'),
    about: 'A reckless void-brawler who has partially phased herself into the void to strike from inside the space between moments. Flux hits targets from angles that do not exist, making her virtually impossible to guard against.',
    hp: 3500, atk: 510, def: 180, crit: 470,
    skills: [
      { name: 'Phase Strike',    cost: 1, description: 'Attacks from within the void bypassing standard defences.', damage: 1.5 },
      { name: 'Rend Reality',    cost: 2, description: 'Tears a rift through the target dealing damage across multiple planes.', damage: 2.0 },
    ],
    trumpCard: {
      name: 'Dimensional Assault',
      description: 'Enters full void-phase and delivers a relentless barrage of phased strikes, stunning all enemies.',
      damage: 4.0,
      effect: 'Stuns all enemies 1 turn; heals all allies 20% HP',
    },
  },

  // ── hero_037 · GLACIARA · S · Female · Mage ────────────────────────────────
  {
    id: 'hero_037',
    name: 'Aeloria',
    frame: 'FROZENTHRONE',
    faction: 'GLACIARA',
    rank: 'S',
    element: 'Ice',
    effect: 'SOVEREIGNTY',
    class: 'Mage',
    cardId: 'GLA-08-AELORIA',
    image: require('../../assets/heroes/hero_037.webp'),
    about: 'The original sovereign who built GLACIARA from nothing and sacrificed her throne to seal an elder darkness that would have consumed the realm. Crystallized into legend for centuries, she has awakened to find pretenders sitting her seat. Her power does not ask for recognition — it simply makes every other ice mage in the world feel like they are standing in snow while she commands the glacier itself.',
    hp: 3500, atk: 780, def: 185, crit: 710, sovereign: true,
    skills: [
      { name: 'Sovereign Frost', cost: 2, description: 'Releases ice of absolute sovereign authority, freezing and shattering target defenses simultaneously.', damage: 2.6 },
      { name: 'Glacial Decree',  cost: 3, description: 'Issues a sovereign decree in absolute zero — all enemies take ice damage and have DEF reduced 30%.', damage: 2.2 },
    ],
    trumpCard: {
      name: 'Throne of Eternal Ice',
      description: 'Manifests the original frozen throne of GLACIARA, devastating all enemies with sovereign-class absolute zero that no resistance can reduce.',
      damage: 6.0,
      effect: 'Stuns all enemies 2 turns; heals all allies 25% HP',
    },
  },

  // ── hero_038 · VOIDMARK · A · Female · Mage ────────────────────────────────
  {
    id: 'hero_038',
    name: 'Veyra Null',
    frame: 'VOIDWEAVE',
    faction: 'VOIDMARK',
    rank: 'A',
    element: 'Void',
    effect: 'VOID_PULSE',
    class: 'Mage',
    cardId: 'VMK-08-VEYRA',
    image: require('../../assets/heroes/hero_038.webp'),
    about: 'A former scholar of forbidden void texts who crossed the line between knowledge and corruption. Veyra no longer reads the void — she channels it directly through her nervous system, making her spells faster and more unpredictable than any trained mage alive.',
    hp: 3100, atk: 560, def: 185, crit: 510,
    skills: [
      { name: 'Void Pulse',   cost: 2, description: 'Sends a concentrated burst of void energy that phases through physical defenses entirely.', damage: 2.0 },
      { name: 'Null Cascade', cost: 3, description: 'Cascades void energy through all enemies in a destructive dimensional wave.', damage: 1.7 },
    ],
    trumpCard: {
      name: 'Forbidden Singularity',
      description: 'Collapses void energy into a singularity that implodes outward through all enemies at once.',
      damage: 4.8,
      effect: 'Stuns all enemies 2 turns; heals all allies 25% HP',
    },
  },

  // ── hero_039 · SUNSPIRE · A · Male · Defender ──────────────────────────────
  {
    id: 'hero_039',
    name: 'Caelum Vane',
    frame: 'DAWNGUARD',
    faction: 'SUNSPIRE',
    rank: 'A',
    element: 'Holy',
    effect: 'DIVINE_SHIELD',
    class: 'Defender',
    cardId: 'SUN-08-CAELUM',
    image: require('../../assets/heroes/hero_039.webp'),
    about: 'A veteran paladin of SUNSPIRE who has survived more campaigns than any other active knight on the line. Caelum fights from the front with practiced precision — his sacred shield has absorbed blows that would have ended entire battles, and he has never once lost a comrade under his watch.',
    hp: 6800, atk: 350, def: 580, crit: 220,
    skills: [
      { name: 'Sacred Guard',   cost: 1, description: 'Raises a divine barrier blocking the next attack targeting any ally.', damage: 0.4 },
      { name: 'Holy Judgment',  cost: 2, description: 'Strikes with consecrated force, dealing damage and taunting the target for 1 turn.', damage: 1.5 },
    ],
    trumpCard: {
      name: 'Bastion of Dawn',
      description: 'Erects an impenetrable wall of holy light across the entire team then shatters it outward in a devastating wave.',
      damage: 3.2,
      effect: 'Shields entire team absorbing up to 40% max HP in damage; stuns all enemies 1 turn',
    },
  },

  // ── hero_041 · EMBERVEIL · S · Female · Mage · SOVEREIGN ──────────────────
  {
    id: 'hero_041',
    name: 'Ravenna Blaze',
    frame: 'EMBRATHRONE',
    faction: 'EMBERVEIL',
    rank: 'S',
    element: 'Fire',
    effect: 'SOVEREIGN_FLAME',
    class: 'Mage',
    cardId: 'EMB-09-RAVENNA',
    image: require('../../assets/heroes/hero_041.webp'),
    about: 'The original sovereign of EMBERVEIL — swallowed by a dimensional rift three cycles of the volcanic moon ago while sealing a catastrophic breach in the realm. She has returned carrying fire from the other side of dimensions, fire that burns even those immune to ordinary flame. Kira Voltz surrendered the throne the moment Ravenna crossed the border. Neither of them had to say a word.',
    hp: 4200, atk: 820, def: 235, crit: 750, sovereign: true,
    skills: [
      { name: 'Sovereign Flame',   cost: 2, description: 'Channels fire from beyond dimensions — pierces all resistances and burns through elemental defenses.', damage: 2.6 },
      { name: 'Dimensional Pyre',  cost: 3, description: 'Opens a rift of sovereign fire that scorches all enemies simultaneously, ignoring barriers.', damage: 2.2 },
    ],
    trumpCard: {
      name: 'Emberveil Apocalypse',
      description: 'Unleashes the full sovereign fire of EMBERVEIL — dimensional flame consuming all enemies in a cataclysm nothing was built to resist.',
      damage: 6.2,
      effect: 'Stuns all enemies 2 turns; heals all allies 25% HP',
    },
  },

  // ── hero_040 · GLACIARA · A · Female · Attacker ────────────────────────────
  {
    id: 'hero_040',
    name: 'Sora Rime',
    frame: 'FROSTDANCER',
    faction: 'GLACIARA',
    rank: 'A',
    element: 'Ice',
    effect: 'SHATTER',
    class: 'Attacker',
    cardId: 'GLA-09-SORA',
    image: require('../../assets/heroes/hero_040.webp'),
    about: 'A blade-dancer of GLACIARA who incorporates ice formation into her fighting style mid-combat. Sora conjures frost platforms and ice constructs as she moves, using the environment she creates against her opponents in the same unbroken fluid motion.',
    hp: 3300, atk: 540, def: 195, crit: 490,
    skills: [
      { name: 'Frost Dance',    cost: 2, description: 'A rapid series of ice-enhanced blade strikes hitting a single target multiple times in sequence.', damage: 2.0 },
      { name: 'Shatter Waltz', cost: 3, description: 'Creates an ice formation around the enemy then detonates it for massive concentrated damage.', damage: 2.6 },
    ],
    trumpCard: {
      name: 'Absolute Choreography',
      description: 'Performs a final devastating dance sequence that shatters the entire battlefield in a storm of razor ice.',
      damage: 4.6,
      effect: 'Stuns all enemies 1 turn; heals all allies 20% HP',
    },
  },

  // ── hero_042 · GLACIARA · A · Female · Mage ────────────────────────────────
  {
    id: 'hero_042',
    name: 'Crysta Venn',
    frame: 'FROSTPULSE',
    faction: 'GLACIARA',
    rank: 'A',
    element: 'Ice',
    effect: 'CHILL',
    class: 'Mage',
    cardId: 'GLA-10-CRYSTA',
    image: require('../../assets/heroes/hero_042.webp'),
    about: 'A crystallomancer from GLACIARA\'s deep research halls who spent three years studying the mathematical patterns of ice formation before ever casting her first offensive spell. Crysta treats combat like a theorem — isolate the variable, reduce it to zero. Her precision is unnerving, her frost constructs are flawless, and she has never once needed to improvise.',
    hp: 3100, atk: 520, def: 188, crit: 472,
    skills: [
      { name: 'Frost Pulse',    cost: 2, description: 'Fires a concentrated crystalline pulse that slows movement and shatters enemy armour.', damage: 2.0 },
      { name: 'Blizzard Spike', cost: 3, description: 'Summons a precision barrage of ice spikes raining across all enemies simultaneously.', damage: 2.4 },
    ],
    trumpCard: {
      name: 'Frozen Theorem',
      description: 'Plunges the battlefield into absolute crystalline zero, encasing all enemies in flawless ice constructs.',
      damage: 4.4,
      effect: 'Stuns all enemies 2 turns; heals all allies 25% HP',
    },
  },

  // ── hero_043 · EMBERVEIL · S · Female · Attacker · Kitsune ─────────────────
  {
    id: 'hero_043',
    name: 'Kitsuri',
    frame: 'FOXFLAME',
    faction: 'EMBERVEIL',
    rank: 'S',
    element: 'Fire',
    effect: 'BURN',
    class: 'Attacker',
    cardId: 'EMB-10-KITSURI',
    image: require('../../assets/heroes/hero_043.webp'),
    about: 'A nine-tailed kitsune swordswoman from EMBERVEIL\'s volcanic highlands who inherited her fox spirit bloodline\'s fire through every one of her tails — each one a different harmonic of the same impossible blaze. Kitsuri fights with the fluidity of fox spirit and the lethality of a blade master. Her enemies rarely live long enough to notice they saw the same move twice. When her ninth tail ignites, the battle is already over.',
    hp: 4100, atk: 730, def: 248, crit: 665,
    skills: [
      { name: 'Fox Blaze',       cost: 2, description: 'Dashes through the enemy with a fire-wreathed blade strike, leaving a burning trail across the field.', damage: 2.2 },
      { name: 'Nine-Tail Slash', cost: 3, description: 'Channels all nine tails into a devastatingly fast multi-hit sword combo that cannot be blocked.', damage: 2.8 },
    ],
    trumpCard: {
      name: 'Kitsune Inferno',
      description: 'All nine tails ignite simultaneously — the kitsune vanishes and reappears behind every enemy at once in a single catastrophic firestorm.',
      damage: 5.2,
      effect: 'Burns all enemies 3 turns; 50% chance to stun each target; heals all allies 20% HP',
    },
  },

  // ── hero_044 · VERDANIA · A · Female · Mage · Fox Girl ─────────────────────
  {
    id: 'hero_044',
    name: 'Fennara Gale',
    frame: 'WINDSPRITE',
    faction: 'VERDANIA',
    rank: 'A',
    element: 'Wind',
    effect: 'SHATTER',
    class: 'Mage',
    cardId: 'VRD-08-FENN',
    image: require('../../assets/heroes/hero_044.webp'),
    about: 'A fox-spirit mage from VERDANIA\'s windswept canopy who draws power from the boundary between forest gale and root-bound earth. Rivals claim she doesn\'t cast magic — she simply asks the forest and sky to agree, and they always do. Her spells cross wind and nature with a fluidity that feels less like power and more like the forest itself changing its mind at speed.',
    hp: 3000, atk: 535, def: 182, crit: 485,
    skills: [
      { name: 'Gale Blossom',    cost: 2, description: 'Whips up a vortex of petals and wind energy, striking all enemies in a spinning arc.', damage: 1.9 },
      { name: 'Fox Wind Strike', cost: 3, description: 'Accelerates to wind-speed and delivers a nature-infused strike through defensive barriers.', damage: 2.5 },
    ],
    trumpCard: {
      name: 'Forest Tempest',
      description: 'Unleashes a storm of wind and ancient nature force that sweeps through the entire field without distinction.',
      damage: 4.2,
      effect: 'Heals team 15% max HP; stuns all enemies 1 turn',
    },
  },

  // ── hero_045 · VOIDMARK · B · Female · Mage ────────────────────────────────
  {
    id: 'hero_045',
    name: 'Umbra Shade',
    frame: 'DARKWEAVE',
    faction: 'VOIDMARK',
    rank: 'B',
    element: 'Void',
    effect: 'VOID_CURSE',
    class: 'Mage',
    cardId: 'VMK-09-UMBRA',
    image: require('../../assets/heroes/hero_045.webp'),
    about: 'A void-dark dual-channeler of VOIDMARK who has learned to weaponize the tension between dark energy and void space — the interference pattern between two incompatible forces, turned into a controlled detonation. Umbra doesn\'t choose between darkness and void; she operates in the frequency where they cancel each other out, and that frequency is the most destructive thing in either spectrum.',
    hp: 3200, atk: 500, def: 172, crit: 455,
    skills: [
      { name: 'Dark Void Pulse', cost: 2, description: 'Channels dark and void energy simultaneously, creating a destructive interference burst at the target.', damage: 1.8 },
      { name: 'Shadow Rift',     cost: 3, description: 'Opens a rift between dark and void dimensions, pulling the target through for heavy dimensional damage.', damage: 2.4 },
    ],
    trumpCard: {
      name: 'Interference Collapse',
      description: 'Generates a catastrophic interference pattern between dark and void energy that implodes across the entire field.',
      damage: 4.0,
      effect: 'Stuns all enemies 2 turns; heals all allies 25% HP',
    },
  },

  // ── hero_046 · VOIDMARK · A · Male · Attacker · Commander ──────────────────
  {
    id: 'hero_046',
    name: 'Kaiden Rhayne',
    frame: 'VOIDCANNON',
    faction: 'VOIDMARK',
    rank: 'A',
    element: 'Void',
    effect: 'SHADOW',
    class: 'Attacker',
    cardId: 'VMK-10-KAIDEN',
    image: require('../../assets/heroes/hero_046.webp'),
    about: 'Commander of VOIDMARK\'s void-elite rapid response force — a unit that operates beyond formal orders, answering only to the sovereign\'s silence and its own doctrine of absolute superiority. Kaiden leads through example and ends debates with results. His void-enhanced firearms don\'t fire conventional rounds; they fire collapsed dimensional points that arrive before they are shot.',
    hp: 4400, atk: 498, def: 258, crit: 445,
    skills: [
      { name: 'Void Round',          cost: 1, description: 'Fires a collapsed dimensional point that bypasses physical armour entirely.', damage: 1.5 },
      { name: 'Commander\'s Volley', cost: 3, description: 'Signals the elite force for a synchronized void-round volley striking all enemies at once.', damage: 2.2 },
    ],
    trumpCard: {
      name: 'Sovereign\'s Command',
      description: 'Issues the ultimate elite force command — every void-round in the arsenal fires simultaneously across all targets.',
      damage: 4.2,
      effect: 'Stuns all enemies 1 turn; heals all allies 20% HP',
    },
  },

  // ── hero_047 · VOIDMARK · A · Male · Mage ──────────────────────────────────
  {
    id: 'hero_047',
    name: 'Morvan Hex',
    frame: 'ABYSSSCRIBE',
    faction: 'VOIDMARK',
    rank: 'A',
    element: 'Void',
    effect: 'LIFEDRAIN',
    class: 'Mage',
    cardId: 'VMK-11-MORVAN',
    image: require('../../assets/heroes/hero_047.webp'),
    about: 'A dark arts scholar of VOIDMARK who decided that understanding darkness was insufficient — immersion was required. Morvan has spent more time inside theoretical dark-space constructs than in the physical world, which has given his spells a depth that most dark mages cannot reach from the outside. He still writes detailed academic papers on every spell he casts. After the battle.',
    hp: 3300, atk: 545, def: 185, crit: 495,
    skills: [
      { name: 'Dark Codex',    cost: 2, description: 'Channels a textbook-precise dark energy sequence that drains the target\'s life force.', damage: 1.9 },
      { name: 'Abyss Theorem', cost: 3, description: 'Applies a theoretically perfect dark-space formula to all enemies simultaneously.', damage: 2.4 },
    ],
    trumpCard: {
      name: 'Living Dissertation',
      description: 'Releases a complete academic dark-energy construct — every formula, every derivation, detonated at once across all enemies.',
      damage: 4.5,
      effect: 'Drains life from all enemies healing self 30% max HP; stuns all enemies 1 turn',
    },
  },

  // ── hero_048 · SUNSPIRE · A · Male · Attacker · Dual Sword ─────────────────
  {
    id: 'hero_048',
    name: 'Aeron Sunblade',
    frame: 'DAWNBLADE',
    faction: 'SUNSPIRE',
    rank: 'A',
    element: 'Holy',
    effect: 'SMITE',
    class: 'Attacker',
    cardId: 'SUN-09-AERON',
    image: require('../../assets/heroes/hero_048.webp'),
    about: 'A dual-blade paladin of SUNSPIRE who rejected the shield-and-hammer tradition of his order to develop a faster, more aggressive interpretation of holy combat. Aeron\'s twin blades consecrate everything they touch and cut through dimensional barriers as easily as armour. His superior officers initially objected to his methods. They stopped objecting after the third campaign.',
    hp: 4100, atk: 508, def: 238, crit: 462,
    skills: [
      { name: 'Twin Consecration', cost: 2, description: 'Strikes with both holy blades simultaneously, consecrating the target with concentrated divine force.', damage: 2.0 },
      { name: 'Dawn Crossing',     cost: 3, description: 'Crosses both blades to channel a compressed holy beam that detonates at the target.', damage: 2.6 },
    ],
    trumpCard: {
      name: 'Dual Sanctification',
      description: 'Both blades ignite with pure divine radiance — Aeron performs a continuous sanctification slash across every enemy on the field.',
      damage: 4.6,
      effect: 'Stuns all enemies 1 turn; heals all allies 20% HP',
    },
  },

  // ── hero_049 · SUNSPIRE · B · Female · Support · Triplet Sister ─────────────
  {
    id: 'hero_049',
    name: 'Lyra Flame',
    frame: 'HOLYFLAME',
    faction: 'SUNSPIRE',
    rank: 'B',
    element: 'Holy',
    effect: 'BLESSING',
    class: 'Support',
    cardId: 'SUN-10-LYRA',
    image: require('../../assets/heroes/hero_049.webp'),
    about: 'One of three Flame sisters — born beside Nyx Flame of EMBERVEIL and Terra Flame of VERDANIA, and uniquely blessed with holy light where her sisters carry fire and earth. Lyra joined SUNSPIRE not to leave her family behind but because the light pulled in a direction she could not ignore. She has spent years learning that illumination and fire have always had the same source, just different forms.',
    hp: 3500, atk: 345, def: 242, crit: 292,
    skills: [
      { name: 'Holy Warmth',    cost: 1, description: 'Channels holy light into the most wounded ally, restoring HP and granting brief damage resistance.', damage: 0 },
      { name: 'Flame Blessing', cost: 2, description: 'Weaves holy light with the ember warmth of her bloodline, healing all allies and boosting their next strike.', damage: 0 },
    ],
    trumpCard: {
      name: 'Threefold Radiance',
      description: 'Calls upon the bond of three sisters — fire, earth, and holy light combined — flooding the battlefield with restorative sacred energy.',
      damage: 1.8,
      effect: 'Heals all allies 35% max HP; stuns all enemies 1 turn',
    },
  },

  // ── hero_050 · VERDANIA · B · Female · Mage · Triplet Sister ───────────────
  {
    id: 'hero_050',
    name: 'Terra Flame',
    frame: 'EARTHFLAME',
    faction: 'VERDANIA',
    rank: 'B',
    element: 'Nature',
    effect: 'TOXIN',
    class: 'Mage',
    cardId: 'VRD-09-TERRA',
    image: require('../../assets/heroes/hero_050.webp'),
    about: 'One of three Flame sisters — born alongside Nyx Flame of EMBERVEIL and Lyra Flame of SUNSPIRE, and drawn from birth toward the root rather than the flame. Terra watched one sister burn everything she touches and another illuminate it, and chose instead to grow things. She is gentle in three languages and devastating in all of them.',
    hp: 3700, atk: 435, def: 218, crit: 388,
    skills: [
      { name: 'Root Surge',    cost: 2, description: 'Calls roots from the earth to bind and poison a single target, draining their vitality into the soil.', damage: 1.8 },
      { name: 'Bloom Cascade', cost: 3, description: 'Unleashes a wave of toxic bloom spores across all enemies, poisoning everything they touch.', damage: 2.2 },
    ],
    trumpCard: {
      name: 'Earthfire Bloom',
      description: 'Draws on the fire of her bloodline through earth and root — a volcanic bloom erupts across the entire field, healing allies and stunning all enemies.',
      damage: 3.8,
      effect: 'Heals allies 20% max HP; stuns all enemies 1 turn',
    },
  },

  // ── hero_051 · VOIDMARK · S · Female · Mage · Sovereign's Advisor ──────────
  {
    id: 'hero_051',
    name: 'Mira Vael',
    frame: 'VOIDCOUNSEL',
    faction: 'VOIDMARK',
    rank: 'S',
    element: 'Void',
    effect: 'VOID_CURSE',
    class: 'Mage',
    cardId: 'VMK-12-MIRA',
    image: require('../../assets/heroes/hero_051.webp'),
    about: 'VOIDMARK\'s sovereign Nyx Vael keeps no inner council — except one. Mira Vael is not royal by blood, not second in command, not a general; she is simply the one person in VOIDMARK whose counsel Nyx listens to without exception or question. No one knows what was said between them the day that arrangement began. No one has dared to ask. Mira\'s void magic is quiet and absolute — exactly like the trust that grants her access to the abyss throne.',
    hp: 3400, atk: 640, def: 202, crit: 580,
    skills: [
      { name: 'Counsel of Void', cost: 2, description: 'Delivers a precise void curse drawn from sovereign-level void doctrine, reducing the target\'s power at its source.', damage: 2.1 },
      { name: 'Abyss Edict',     cost: 3, description: 'Issues a void edict of sovereign authority, collapsing an enemy\'s dimensional integrity entirely.', damage: 2.6 },
    ],
    trumpCard: {
      name: 'Sovereign\'s Will',
      description: 'Channels the full weight of Nyx Vael\'s sovereign void authority — a devastating edict that stuns all enemies and restores the caster.',
      damage: 5.2,
      effect: 'Stuns all enemies 2 turns; heals self 20% HP',
    },
  },

  // ── hero_052 · SUNSPIRE · B · Female · Mage ────────────────────────────────
  {
    id: 'hero_052',
    name: 'Lumara Sol',
    frame: 'SOLARWEAVE',
    faction: 'SUNSPIRE',
    rank: 'B',
    element: 'Holy',
    effect: 'BLESSING',
    class: 'Mage',
    cardId: 'SUN-11-LUMARA',
    image: require('../../assets/heroes/hero_052.webp'),
    about: 'A solar-channeling mage of SUNSPIRE who built her entire magical vocabulary out of concentrated sunlight before she learned a single offensive spell. Lumara is an expert in the healing science of light frequency and a moderate expert in reducing everything that opposes her to ash. She is considerably more effective at the latter than her academic background suggests.',
    hp: 3250, atk: 480, def: 185, crit: 432,
    skills: [
      { name: 'Solar Weave',   cost: 2, description: 'Channels precisely tuned sunlight frequency to damage enemies while restoring the most-injured ally.', damage: 1.8 },
      { name: 'Radiant Burst', cost: 3, description: 'Concentrates a full spectrum of solar energy into a singular detonation across all enemies.', damage: 2.4 },
    ],
    trumpCard: {
      name: 'Solar Convergence',
      description: 'Draws every wavelength of solar energy into a single convergence point and releases it all at once across the entire field.',
      damage: 4.2,
      effect: 'Heals all allies 25% max HP; stuns all enemies 1 turn',
    },
  },

  // ── hero_053 · VERDANIA · A · Female · Mage · Bird Lover ───────────────────
  {
    id: 'hero_053',
    name: 'Avara Plume',
    frame: 'PLUMEWARDEN',
    faction: 'VERDANIA',
    rank: 'A',
    element: 'Nature',
    effect: 'THORNSTRIKE',
    class: 'Mage',
    cardId: 'VRD-10-AVARA',
    image: require('../../assets/heroes/hero_053.webp'),
    about: 'A nature mage of VERDANIA who arrived at her magical specialty by accident — she was trying to communicate with a wounded crow and ended up channeling the entire forest\'s awareness through the bird\'s dying perception. She has never been the same since. Avara\'s bird companions function as extensions of her senses, her range, and her power; every spell she casts arrives from an angle that shouldn\'t be possible.',
    hp: 3200, atk: 542, def: 188, crit: 492,
    skills: [
      { name: 'Feather Storm', cost: 2, description: 'Sends a flock of nature-infused birds to strike from impossible angles no defence can anticipate.', damage: 1.9 },
      { name: 'Raptor Dive',   cost: 3, description: 'Channels power through her largest bird companion for a devastating nature-force plunge strike at the target.', damage: 2.5 },
    ],
    trumpCard: {
      name: 'Murder of Crows',
      description: 'Calls upon every bird companion at once — a dark tempest of nature-infused wings and thorns descends on all enemies from every direction.',
      damage: 4.6,
      effect: 'Stuns all enemies 1 turn; heals all allies 20% HP',
    },
  },
];

export const getHeroById        = (id)      => HEROES.find((h) => h.id === id);
export const getHeroesByFaction = (faction) => HEROES.filter((h) => h.faction === faction);
export const getHeroesByRank    = (rank)    => HEROES.filter((h) => h.rank === rank);
export const getHeroesByClass   = (cls)     => HEROES.filter((h) => h.class === cls);
