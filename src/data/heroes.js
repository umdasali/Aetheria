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
    image: require('../../assets/faction/SUNSPIRE.webp'),
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
    image: require('../../assets/faction/VOIDMARK.webp'),
  },
  // Sand-and-moon dynasty realm - Egyptian-inspired desert kingdom of dunes,
  // moonlit nights, and the honored dead. (NOT sun-aligned - sand & moon.)
  // NOTE: KHEMARA.png is a placeholder copy - swap in the real faction emblem.
  KHEMARA: {
    name: 'KHEMARA',
    color: '#E0912E',
    accentColor: '#F5C16B',
    image: require('../../assets/faction/KHEMARA.png'),
  },
};


export const HEROES = [
  // ── hero_001 · EMBERVEIL · S · Female ─────────────────────────────────────
  {
    id: 'hero_001',
    name: 'Marisol',
    frame: 'STORMCALLER',
    faction: 'EMBERVEIL',
    rank: 'S',
    element: 'Lightning',
    effect: 'PARALYSIS',
    class: 'Attacker',
    cardId: 'EMB-01-MARISOL',
    image: require('../../assets/heroes/hero_001.webp'),
    about: 'A relentless thunder mage who channels raw storm energy into devastating chain strikes. She was exiled from EMBERVEIL for refusing orders and now fights entirely on her own terms. She held the ember throne through three cycles of dark silence - and stepped aside the moment its true sovereign returned, without a word asked or given.',
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
    name: 'Valentina Ardente',
    frame: 'BLAZEGUARD',
    faction: 'EMBERVEIL',
    rank: 'A',
    element: 'Fire',
    effect: 'INCINERATE',
    class: 'Attacker',
    cardId: 'EMB-02-VALENTINA',
    image: require('../../assets/heroes/hero_002.webp'),
    about: 'Elite vanguard of EMBERVEIL. Valentina\'s sword is perpetually wreathed in solar flames capable of melting through any barrier. Born in the volcanic highlands, she fights without hesitation.',
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
    name: 'Zimara',
    frame: 'FROSTMEND',
    faction: 'GLACIARA',
    rank: 'S',
    element: 'Ice',
    effect: 'GLACIATION',
    class: 'Mage',
    cardId: 'GLA-01-ZIMARA',
    image: require('../../assets/heroes/hero_003.webp'),
    about: 'Supreme ice mage of GLACIARA. Zimara channels glacial frost into devastating arcane constructs - her crystalline spell-towers and blizzard barriers are considered masterpieces of the frozen battlefield.',
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
    name: 'Aisling Doyle',
    frame: 'BLOOMWEAVE',
    faction: 'VERDANIA',
    rank: 'A',
    element: 'Nature',
    effect: 'BLOOM',
    class: 'Mage',
    cardId: 'VRD-01-AISLING',
    image: require('../../assets/heroes/hero_004.webp'),
    about: 'Nature mage of VERDANIA. Aisling commands living flora with arcane precision, weaving vines and blossoms into devastating spell constructs that overwhelm enemies with uncontrolled growth.',
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
    name: 'Maeve Boyle',
    frame: 'ROOTGUARD',
    faction: 'VERDANIA',
    rank: 'B',
    element: 'Wind',
    effect: 'ENTANGLEMENT',
    class: 'Defender',
    cardId: 'VRD-02-MAEVE',
    image: require('../../assets/heroes/hero_005.webp'),
    about: 'Guardian of the VERDANIA woodlands. Maeve\'s body is hardened by years of forest training, allowing her to withstand tremendous punishment while ensnaring enemies with enchanted roots and vines.',
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
    name: 'Diego Lucero',
    frame: 'SOLARBOW',
    faction: 'SUNSPIRE',
    rank: 'B',
    element: 'Holy',
    effect: 'BLESSING',
    class: 'Support',
    cardId: 'SUN-01-DIEGO',
    image: require('../../assets/heroes/hero_006.webp'),
    about: 'A sacred herald of SUNSPIRE who fires blessed light arrows that both weaken foes and restore allies. His aim is guided by solar energy - once released, his arrows never miss.',
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
    name: 'Dario Ferraro',
    frame: 'FLAMEBLADE',
    faction: 'EMBERVEIL',
    rank: 'A',
    element: 'Fire',
    effect: 'INCINERATE',
    class: 'Attacker',
    cardId: 'EMB-03-DARIO',
    image: require('../../assets/heroes/hero_007.webp'),
    about: 'Champion of EMBERVEIL\'s warrior order. Dario\'s blade is perpetually wreathed in volcanic flame, cutting through armor as if it were paper. He hunts the corruption spreading from beyond the veil.',
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
    name: 'Mirei',
    frame: 'VOIDPHANTOM',
    faction: 'VOIDMARK',
    rank: 'S',
    element: 'Void',
    effect: 'CORRUPTION',
    class: 'Attacker',
    cardId: 'VMK-01-MIREI',
    image: require('../../assets/heroes/hero_008.webp'),
    about: 'Shadow phantom of VOIDMARK. Mirei strikes before enemies can perceive her presence, vanishing into void space between hits. Her every movement tears small rifts in reality itself.',
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
    name: 'Marcus Aurelio',
    frame: 'IRONSPIRE',
    faction: 'SUNSPIRE',
    rank: 'B',
    element: 'Holy',
    effect: 'BLESSING',
    class: 'Defender',
    cardId: 'SUN-02-MARCUS',
    image: require('../../assets/heroes/hero_009.webp'),
    about: 'Iron bulwark of SUNSPIRE. Marcus\'s sacred armor has never been breached in over 300 battles. He stands between his allies and annihilation without flinching.',
    hp: 8000, atk: 380, def: 620, crit: 220,
    skills: [
      { name: 'Holy Guard', cost: 1, description: 'Raises sacred defense reducing incoming damage.', damage: 0 },
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
    name: 'Carmen Vidal',
    frame: 'EMBERDANCER',
    faction: 'EMBERVEIL',
    rank: 'A',
    element: 'Fire',
    effect: 'FLAMEDANCE',
    class: 'Support',
    cardId: 'EMB-04-CARMEN',
    image: require('../../assets/heroes/hero_010.webp'),
    about: 'EMBERVEIL\'s fire-dancing sentinel. Carmen amplifies her allies with volcanic energy while her own movements flow like living flame - impossible to track and lethal to approach.',
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
    name: 'Vera Zimina',
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
      { name: 'Frost Wall',   cost: 1, description: 'Raises an ice wall to absorb enemy attacks.', damage: 0 },
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
    name: 'Aurelia',
    frame: 'SOLARMAGE',
    faction: 'SUNSPIRE',
    rank: 'S',
    element: 'Holy',
    effect: 'RADIANCE',
    class: 'Mage',
    cardId: 'SUN-03-AURELIA',
    image: require('../../assets/heroes/hero_012.webp'),
    about: 'The Radiant Sovereign of SUNSPIRE - chosen not by bloodline or election but by the light itself during the Ceremony of Ascension. Aurelia commands solar energy and sacred flame at a level no mage born of training can replicate. Her brilliance on the battlefield is not considered divine. It is.',
    hp: 3400, atk: 760, def: 175, crit: 700, sovereign: true,
    skills: [
      { name: 'Solar Rend',   cost: 2, description: 'Channels concentrated sovereign solar energy that ignores elemental resistances.', damage: 2.6 },
      { name: 'Sacred Drain', cost: 3, description: 'Draws upon holy light to devastate enemies and restore all allies simultaneously.', damage: 2.2 },
    ],
    trumpCard: {
      name: 'Divine Radiance',
      description: 'Calls down the full sovereign power of SUNSPIRE\'s sacred flame - absolute holy light consuming all enemies at once and restoring the team.',
      damage: 6.0,
      effect: 'Stuns all enemies 2 turns; heals entire team 30% HP; removes all debuffs from allies',
    },
  },

  // ── hero_013 · VOIDMARK · A · Female ──────────────────────────────────────
  {
    id: 'hero_013',
    name: 'Kaori Adachi',
    frame: 'VOIDOMEN',
    faction: 'VOIDMARK',
    rank: 'A',
    element: 'Void',
    effect: 'VOID_OMEN',
    class: 'Mage',
    cardId: 'VMK-03-KAORI',
    image: require('../../assets/heroes/hero_013.webp'),
    about: 'A void scholar who has spent decades studying entities older than recorded history. Kaori perceives abyss energy the way others perceive sound - as constant, layered information. She left VOIDMARK\'s inner court when she realized the court feared what she knew more than they feared the void itself.',
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
    name: 'Reika Kurosawa',
    frame: 'DARKSTEP',
    faction: 'VOIDMARK',
    rank: 'B',
    element: 'Void',
    effect: 'SHADOW',
    class: 'Attacker',
    cardId: 'VMK-02-REIKA',
    image: require('../../assets/heroes/hero_014.webp'),
    about: 'Assassin of the VOIDMARK faction. Reika strikes from angles that don\'t exist in normal space. Her targets are erased before they can register the attack.',
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
    name: 'Irina Kholodova',
    frame: 'FROSTWALL',
    faction: 'GLACIARA',
    rank: 'B',
    element: 'Ice',
    effect: 'CHILL',
    class: 'Defender',
    cardId: 'GLA-03-IRINA',
    image: require('../../assets/heroes/hero_015.webp'),
    about: 'A warrior tempered by GLACIARA\'s most brutal winters. Irina feels no cold and channels frozen energy through her body, converting incoming force into devastating ice-charged counterstrikes.',
    hp: 6600, atk: 380, def: 530, crit: 220,
    skills: [
      { name: 'Frost Absorb', cost: 1, description: 'Absorbs incoming attack converting it to frozen energy.', damage: 0 },
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
    name: 'Tomás Herrero',
    frame: 'EMBERWALL',
    faction: 'EMBERVEIL',
    rank: 'C',
    element: 'Fire',
    effect: 'HEATSHIELD',
    class: 'Defender',
    cardId: 'EMB-05-TOMAS',
    image: require('../../assets/heroes/hero_016.webp'),
    about: 'A battle-hardened shield-bearer of EMBERVEIL who uses his body as a living wall, absorbing volcanic strikes and redirecting that raw heat into explosive counterattacks. He has survived more than any other soldier in the faction.',
    hp: 7200, atk: 350, def: 580, crit: 200,
    skills: [
      { name: 'Ember Block',    cost: 1, description: 'Raises a flaming barrier absorbing the next attack.', damage: 0 },
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
    name: 'Mikhail Zimin',
    frame: 'SNOWMENDER',
    faction: 'GLACIARA',
    rank: 'C',
    element: 'Ice',
    effect: 'FROSTMEND',
    class: 'Support',
    cardId: 'GLA-04-MIKHAIL',
    image: require('../../assets/heroes/hero_017.webp'),
    about: 'A field medic of GLACIARA who channels glacial energy to seal wounds and freeze bleeding in real time. Mikhail has never lost a patient on the battlefield and his presence alone stabilises allied morale under siege.',
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
  

  // ── hero_018 · KHEMARA · A · Female · Attacker ─────────────────────────────
  // Uncomment when assets/heroes/hero_018.webp is ready
  
  {
    id: 'hero_018',
    name: 'Nefret Sahar',
    frame: 'MOONFANG',
    faction: 'KHEMARA',
    rank: 'A',
    element: 'Moon',
    effect: 'SMITE',
    class: 'Attacker',
    cardId: 'KHE-01-NEFRET',
    image: require('../../assets/heroes/hero_018.webp'),
    about: 'A moonlit huntress of KHEMARA who stalks the dunes after dark, running down corrupted things with twin blades that drink the night sky. Nefret strikes with blinding speed and is gone before her quarry can register the attack - only a settling of cold sand where she stood remains.',
    hp: 3500, atk: 530, def: 200, crit: 480,
    skills: [
      { name: 'Moon Fang',      cost: 1, description: 'A swift moon-edged strike that bites deeper than the dark it came from.', damage: 1.5 },
      { name: 'Crescent Lunge', cost: 3, description: 'Carves a crescent of silver light through all enemies in a single charge.', damage: 2.4 },
    ],
    trumpCard: {
      name: 'Lunar Execution',
      description: 'Channels the full weight of the desert moon into one annihilating strike that mends her allies.',
      damage: 4.8,
      effect: 'Heals all allies 25% HP; stuns all enemies 1 turn',
    },
  },
  

  // ── hero_019 · VERDANIA · C · Male · Attacker ──────────────────────────────
  // Uncomment when assets/heroes/hero_019.webp is ready
 
  {
    id: 'hero_019',
    name: 'Bryn Gallagher',
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
    name: 'Kael Ashworth',
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
    name: 'Renata Ceniza',
    frame: 'ASHCALLER',
    faction: 'EMBERVEIL',
    rank: 'B',
    element: 'Fire',
    effect: 'SCORCH',
    class: 'Mage',
    cardId: 'EMB-06-RENATA',
    image: require('../../assets/heroes/hero_021.webp'),
    about: 'A volatile mage of EMBERVEIL who weaponises wildfire in its purest form. Renata refuses to contain her power - she simply feeds it. Enemies who survive her opening blast rarely last long enough to regret it.',
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
    name: 'Rubén Coraza',
    frame: 'IRONVEIL',
    faction: 'EMBERVEIL',
    rank: 'A',
    element: 'Fire',
    effect: 'FLAMEGUARD',
    class: 'Defender',
    cardId: 'EMB-07-RUBEN',
    image: require('../../assets/heroes/hero_022.webp'),
    about: 'Steel-willed guardian of EMBERVEIL\'s inner fortress. Rubén\'s armour was forged in active volcanic vents and redirects incoming damage as superheated steam capable of blinding and burning attackers.',
    hp: 6800, atk: 370, def: 560, crit: 210,
    skills: [
      { name: 'Cinder Guard',  cost: 1, description: 'Hardens volcanic armour, reducing the next hit taken.', damage: 0 },
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
    name: 'Paloma Chispa',
    frame: 'SPARKWEAVE',
    faction: 'EMBERVEIL',
    rank: 'C',
    element: 'Lightning',
    effect: 'VOLTMEND',
    class: 'Support',
    cardId: 'EMB-08-PALOMA',
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
    name: 'Volkov',
    frame: 'GLACIALBLADE',
    faction: 'GLACIARA',
    rank: 'S',
    element: 'Ice',
    effect: 'SHATTER',
    class: 'Attacker',
    cardId: 'GLA-05-VOLKOV',
    image: require('../../assets/heroes/hero_024.webp'),
    about: 'The lone wolf hunter of GLACIARA - an anomaly among the faction\'s warrior elite. Volkov moves through frozen terrain like a living shadow, shattering targets with strikes that exploit the brittleness extreme cold creates in both armour and flesh.',
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
    name: 'Snezhana Buran',
    frame: 'WINTERMAGE',
    faction: 'GLACIARA',
    rank: 'A',
    element: 'Ice',
    effect: 'BLIZZARD',
    class: 'Mage',
    cardId: 'GLA-06-SNEZHANA',
    image: require('../../assets/heroes/hero_025.webp'),
    about: 'A storm-class mage of GLACIARA who conjures blizzards on command. Snezhana prefers overwhelming area coverage over precision - her philosophy is simple: if enough ice falls, nothing survives.',
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
    name: 'Boris Kamenev',
    frame: 'FROSTBARK',
    faction: 'GLACIARA',
    rank: 'B',
    element: 'Ice',
    effect: 'ICEWALL',
    class: 'Defender',
    cardId: 'GLA-07-BORIS',
    image: require('../../assets/heroes/hero_026.webp'),
    about: 'A colossus of GLACIARA who has spent decades hardening his body against arctic extremes. Boris\'s skin crystallises under sustained cold, forming natural ice-plate armour that grows denser with every hit he absorbs.',
    hp: 6900, atk: 345, def: 550, crit: 195,
    skills: [
      { name: 'Ice Armour',    cost: 1, description: 'Crystallises the skin reducing incoming damage for 1 turn.', damage: 0 },
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
    name: 'Cassius Lux',
    frame: 'PRISMWEAVE',
    faction: 'SUNSPIRE',
    rank: 'A',
    element: 'Holy',
    effect: 'ILLUMINATE',
    class: 'Mage',
    cardId: 'SUN-05-CASSIUS',
    image: require('../../assets/heroes/hero_027.webp'),
    about: 'A prism mage of SUNSPIRE who treats combat as a geometry problem. Cassius refracts raw sunlight into precision arcane beams - find the correct angle and a single ray can pass through an entire enemy formation.',
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
    name: 'Livia Santoro',
    frame: 'HOLYMEND',
    faction: 'SUNSPIRE',
    rank: 'B',
    element: 'Holy',
    effect: 'SANCTIFY',
    class: 'Support',
    cardId: 'SUN-06-LIVIA',
    image: require('../../assets/heroes/hero_028.webp'),
    about: 'A gentle but unyielding cleric of SUNSPIRE who channels divine light into restorative energy. Livia believes no wound is beyond healing and will exhaust herself entirely before allowing an ally to fall.',
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
    name: 'Leona Solare',
    frame: 'SOLARSTRIKE',
    faction: 'SUNSPIRE',
    rank: 'C',
    element: 'Holy',
    effect: 'SMITE',
    class: 'Attacker',
    cardId: 'SUN-07-LEONA',
    image: require('../../assets/heroes/hero_029.webp'),
    about: 'A young zealot of SUNSPIRE still proving herself on the battlefield. Leona\'s technique is raw and forward, compensating for inexperience with relentless aggression and an unshakeable conviction that sunlight favours the bold.',
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
    name: 'Fiadh',
    frame: 'VERDANTFANG',
    faction: 'VERDANIA',
    rank: 'S',
    element: 'Nature',
    effect: 'THORNSTRIKE',
    class: 'Attacker',
    cardId: 'VRD-05-FIADH',
    image: require('../../assets/heroes/hero_030.webp'),
    about: 'The Thornborn Queen of VERDANIA - crowned by the jungle itself during the Night of Blossoming when the eldest trees flowered for the first time in a thousand years. Fiadh feels every wound dealt to her forest as if carved into her own skin. On the battlefield she is the forest: she does not hunt her targets, she becomes the terrain they are standing on.',
    hp: 4000, atk: 780, def: 225, crit: 720, sovereign: true,
    skills: [
      { name: 'Thorn Blitz',      cost: 2, description: 'Launches a sovereign volley of tracking thorns that pierce through elemental defenses.', damage: 2.4 },
      { name: 'Predator\'s Mark', cost: 3, description: 'Marks an enemy - all subsequent attacks deal massively increased damage to them.', damage: 3.0 },
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
    name: 'Niamh Quinn',
    frame: 'BLOOMKEEP',
    faction: 'VERDANIA',
    rank: 'B',
    element: 'Nature',
    effect: 'REJUVENATE',
    class: 'Support',
    cardId: 'VRD-06-NIAMH',
    image: require('../../assets/heroes/hero_031.webp'),
    about: 'A wandering herbalist of VERDANIA carrying centuries of forest medicine. Niamh can accelerate a fighter\'s natural healing to impossible rates, closing critical wounds mid-combat using only what grows underfoot.',
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
    name: 'Rhona Byrne',
    frame: 'VERDANSHIELD',
    faction: 'VERDANIA',
    rank: 'A',
    element: 'Nature',
    effect: 'BARKSKIN',
    class: 'Defender',
    cardId: 'VRD-07-RHONA',
    image: require('../../assets/heroes/hero_032.webp'),
    about: 'A sentinel of VERDANIA who has merged her body with living bark and vine. Rhona\'s skin is reinforced by constantly regenerating plant-matter - the longer a fight lasts, the harder she becomes to damage.',
    hp: 6500, atk: 330, def: 545, crit: 180,
    skills: [
      { name: 'Bark Shield',  cost: 1, description: 'Hardens bark armour around self or an ally absorbing the next attack.', damage: 0 },
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
    name: 'Titania',
    frame: 'ABYSSALTHRONE',
    faction: 'VOIDMARK',
    rank: 'S',
    element: 'Void',
    effect: 'ABYSS',
    class: 'Defender',
    cardId: 'VMK-04-TITANIA',
    image: require('../../assets/heroes/hero_033.webp'),
    about: 'The unopposed sovereign of VOIDMARK - a void-forged empress whose body has merged with the abyss itself and been reborn stronger. Titania does not debate authority; in a realm where reality tears without warning, she is the only constant. Three challenger factions dissolved attempting to dethrone her. Their names are no longer spoken in VOIDMARK, which here is a fate more feared than death.',
    hp: 9500, atk: 500, def: 800, crit: 300, sovereign: true,
    skills: [
      { name: 'Void Absorb',   cost: 1, description: 'Pulls an incoming attack into sovereign void space, nullifying damage and storing energy for a counter-burst.', damage: 0 },
      { name: 'Abyss Release', cost: 3, description: 'Detonates all accumulated void energy in a sovereign-class area blast that ignores DEF.', damage: 2.6 },
    ],
    trumpCard: {
      name: 'Void Sovereignty',
      description: 'Asserts absolute dominion over the void - opens a sovereign rift beneath all enemies and detonates the dimensional collapse inward.',
      damage: 5.8,
      effect: 'Stuns all enemies 2 turns; heals self 25% HP',
    },
  },

  // ── hero_034 · VOIDMARK · A · Female · Support ─────────────────────────────

  {
    id: 'hero_034',
    name: 'Nerissa Marlowe',
    frame: 'SOULBIND',
    faction: 'VOIDMARK',
    rank: 'A',
    element: 'Void',
    effect: 'LIFEDRAIN',
    class: 'Support',
    cardId: 'VMK-05-NERISSA',
    image: require('../../assets/heroes/hero_034.webp'),
    about: 'A void medium of VOIDMARK who siphons life force from the battlefield and redistributes it among her allies. Nerissa walks the thin line between healing and corruption - her methods work, and she stopped asking whether they should.',
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
    name: 'Vesper',
    frame: 'SPIRITWEAVE',
    faction: 'VOIDMARK',
    rank: 'S',
    element: 'Void',
    effect: 'VOID_CURSE',
    class: 'Mage',
    cardId: 'VMK-07-VESPER',
    image: require('../../assets/heroes/hero_036.webp'),
    about: 'A supreme void mage of VOIDMARK whose consciousness partially inhabits the space between dimensions. Vesper doesn\'t merely cast spells - she rewrites the rules of engagement at will, cursing entire formations and bending dimensional law to her design.',
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
    name: 'Davina Blackwood',
    frame: 'DARKBLADE',
    faction: 'VOIDMARK',
    rank: 'B',
    element: 'Void',
    effect: 'PHANTOMSTRIKE',
    class: 'Attacker',
    cardId: 'VMK-06-DAVINA',
    image: require('../../assets/heroes/hero_035.webp'),
    about: 'A reckless void-brawler who has partially phased herself into the void to strike from inside the space between moments. Davina hits targets from angles that do not exist, making her virtually impossible to guard against.',
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
    name: 'Zimoslava',
    frame: 'FROZENTHRONE',
    faction: 'GLACIARA',
    rank: 'S',
    element: 'Ice',
    effect: 'SOVEREIGNTY',
    class: 'Mage',
    cardId: 'GLA-08-ZIMOSLAVA',
    image: require('../../assets/heroes/hero_037.webp'),
    about: 'The original sovereign who built GLACIARA from nothing and sacrificed her throne to seal an elder darkness that would have consumed the realm. Crystallized into legend for centuries, she has awakened to find pretenders sitting her seat. Her power does not ask for recognition - it simply makes every other ice mage in the world feel like they are standing in snow while she commands the glacier itself.',
    hp: 3500, atk: 780, def: 185, crit: 710, sovereign: true,
    skills: [
      { name: 'Sovereign Frost', cost: 2, description: 'Releases ice of absolute sovereign authority, freezing and shattering target defenses simultaneously.', damage: 2.6 },
      { name: 'Glacial Decree',  cost: 3, description: 'Issues a sovereign decree in absolute zero - all enemies take ice damage and have DEF reduced 30%.', damage: 2.2 },
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
    name: 'Veyra Sorin',
    frame: 'VOIDWEAVE',
    faction: 'VOIDMARK',
    rank: 'A',
    element: 'Void',
    effect: 'VOID_PULSE',
    class: 'Mage',
    cardId: 'VMK-08-VEYRA',
    image: require('../../assets/heroes/hero_038.webp'),
    about: 'A former scholar of forbidden void texts who crossed the line between knowledge and corruption. Veyra no longer reads the void - she channels it directly through her nervous system, making her spells faster and more unpredictable than any trained mage alive.',
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
    name: 'Caelan Doria',
    frame: 'DAWNGUARD',
    faction: 'SUNSPIRE',
    rank: 'A',
    element: 'Holy',
    effect: 'DIVINE_SHIELD',
    class: 'Defender',
    cardId: 'SUN-08-CAELAN',
    image: require('../../assets/heroes/hero_039.webp'),
    about: 'A veteran paladin of SUNSPIRE who has survived more campaigns than any other active knight on the line. Caelan fights from the front with practiced precision - his sacred shield has absorbed blows that would have ended entire battles, and he has never once lost a comrade under his watch.',
    hp: 6800, atk: 350, def: 580, crit: 220,
    skills: [
      { name: 'Sacred Guard',   cost: 1, description: 'Raises a divine barrier blocking the next attack targeting any ally.', damage: 0 },
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
    name: 'Fiorenza',
    frame: 'EMBRATHRONE',
    faction: 'EMBERVEIL',
    rank: 'S',
    element: 'Fire',
    effect: 'SOVEREIGN_FLAME',
    class: 'Mage',
    cardId: 'EMB-09-FIORENZA',
    image: require('../../assets/heroes/hero_041.webp'),
    about: 'The original sovereign of EMBERVEIL - swallowed by a dimensional rift three cycles of the volcanic moon ago while sealing a catastrophic breach in the realm. She has returned carrying fire from the other side of dimensions, fire that burns even those immune to ordinary flame. Marisol surrendered the throne the moment Fiorenza crossed the border. Neither of them had to say a word.',
    hp: 4200, atk: 820, def: 235, crit: 750, sovereign: true,
    skills: [
      { name: 'Sovereign Flame',   cost: 2, description: 'Channels fire from beyond dimensions - pierces all resistances and burns through elemental defenses.', damage: 2.6 },
      { name: 'Dimensional Pyre',  cost: 3, description: 'Opens a rift of sovereign fire that scorches all enemies simultaneously, ignoring barriers.', damage: 2.2 },
    ],
    trumpCard: {
      name: 'Emberveil Apocalypse',
      description: 'Unleashes the full sovereign fire of EMBERVEIL - dimensional flame consuming all enemies in a cataclysm nothing was built to resist.',
      damage: 6.2,
      effect: 'Stuns all enemies 2 turns; heals all allies 25% HP',
    },
  },

  // ── hero_040 · GLACIARA · A · Female · Attacker ────────────────────────────
  {
    id: 'hero_040',
    name: 'Larisa Ledova',
    frame: 'FROSTDANCER',
    faction: 'GLACIARA',
    rank: 'A',
    element: 'Ice',
    effect: 'SHATTER',
    class: 'Attacker',
    cardId: 'GLA-09-LARISA',
    image: require('../../assets/heroes/hero_040.webp'),
    about: 'A blade-dancer of GLACIARA who incorporates ice formation into her fighting style mid-combat. Larisa conjures frost platforms and ice constructs as she moves, using the environment she creates against her opponents in the same unbroken fluid motion.',
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
    name: 'Oksana Khrustaleva',
    frame: 'FROSTPULSE',
    faction: 'GLACIARA',
    rank: 'A',
    element: 'Ice',
    effect: 'CHILL',
    class: 'Mage',
    cardId: 'GLA-10-OKSANA',
    image: require('../../assets/heroes/hero_042.webp'),
    about: 'A crystallomancer from GLACIARA\'s deep research halls who spent three years studying the mathematical patterns of ice formation before ever casting her first offensive spell. Oksana treats combat like a theorem - isolate the variable, reduce it to zero. Her precision is unnerving, her frost constructs are flawless, and she has never once needed to improvise.',
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
    about: 'A nine-tailed kitsune swordswoman from EMBERVEIL\'s volcanic highlands who inherited her fox spirit bloodline\'s fire through every one of her tails - each one a different harmonic of the same impossible blaze. Kitsuri fights with the fluidity of fox spirit and the lethality of a blade master. Her enemies rarely live long enough to notice they saw the same move twice. When her ninth tail ignites, the battle is already over.',
    hp: 4100, atk: 730, def: 248, crit: 665,
    skills: [
      { name: 'Fox Blaze',       cost: 2, description: 'Dashes through the enemy with a fire-wreathed blade strike, leaving a burning trail across the field.', damage: 2.2 },
      { name: 'Nine-Tail Slash', cost: 3, description: 'Channels all nine tails into a devastatingly fast multi-hit sword combo that cannot be blocked.', damage: 2.8 },
    ],
    trumpCard: {
      name: 'Kitsune Inferno',
      description: 'All nine tails ignite simultaneously - the kitsune vanishes and reappears behind every enemy at once in a single catastrophic firestorm.',
      damage: 5.2,
      effect: 'Burns all enemies 3 turns; 50% chance to stun each target; heals all allies 20% HP',
    },
  },

  // ── hero_044 · VERDANIA · A · Female · Mage · Fox Girl ─────────────────────
  {
    id: 'hero_044',
    name: 'Fenella Sloane',
    frame: 'WINDSPRITE',
    faction: 'VERDANIA',
    rank: 'A',
    element: 'Wind',
    effect: 'SHATTER',
    class: 'Mage',
    cardId: 'VRD-08-FENELLA',
    image: require('../../assets/heroes/hero_044.webp'),
    about: 'A fox-spirit mage from VERDANIA\'s windswept canopy who draws power from the boundary between forest gale and root-bound earth. Rivals claim she doesn\'t cast magic - she simply asks the forest and sky to agree, and they always do. Her spells cross wind and nature with a fluidity that feels less like power and more like the forest itself changing its mind at speed.',
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
    name: 'Umbra Nightingale',
    frame: 'DARKWEAVE',
    faction: 'VOIDMARK',
    rank: 'B',
    element: 'Void',
    effect: 'VOID_CURSE',
    class: 'Mage',
    cardId: 'VMK-09-UMBRA',
    image: require('../../assets/heroes/hero_045.webp'),
    about: 'A void-dark dual-channeler of VOIDMARK who has learned to weaponize the tension between dark energy and void space - the interference pattern between two incompatible forces, turned into a controlled detonation. Umbra doesn\'t choose between darkness and void; she operates in the frequency where they cancel each other out, and that frequency is the most destructive thing in either spectrum.',
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
    name: 'Kaidan Voss',
    frame: 'VOIDCANNON',
    faction: 'VOIDMARK',
    rank: 'A',
    element: 'Void',
    effect: 'SHADOW',
    class: 'Attacker',
    cardId: 'VMK-10-KAIDAN',
    image: require('../../assets/heroes/hero_046.webp'),
    about: 'Commander of VOIDMARK\'s void-elite rapid response force - a unit that operates beyond formal orders, answering only to the sovereign\'s silence and its own doctrine of absolute superiority. Kaidan leads through example and ends debates with results. His void-enhanced firearms don\'t fire conventional rounds; they fire collapsed dimensional points that arrive before they are shot.',
    hp: 4400, atk: 498, def: 258, crit: 445,
    skills: [
      { name: 'Void Round',          cost: 1, description: 'Fires a collapsed dimensional point that bypasses physical armour entirely.', damage: 1.5 },
      { name: 'Commander\'s Volley', cost: 3, description: 'Signals the elite force for a synchronized void-round volley striking all enemies at once.', damage: 2.2 },
    ],
    trumpCard: {
      name: 'Sovereign\'s Command',
      description: 'Issues the ultimate elite force command - every void-round in the arsenal fires simultaneously across all targets.',
      damage: 4.2,
      effect: 'Stuns all enemies 1 turn; heals all allies 20% HP',
    },
  },

  // ── hero_047 · VOIDMARK · A · Male · Mage ──────────────────────────────────
  {
    id: 'hero_047',
    name: 'Morvan Delacroix',
    frame: 'ABYSSSCRIBE',
    faction: 'VOIDMARK',
    rank: 'A',
    element: 'Void',
    effect: 'LIFEDRAIN',
    class: 'Mage',
    cardId: 'VMK-11-MORVAN',
    image: require('../../assets/heroes/hero_047.webp'),
    about: 'A dark arts scholar of VOIDMARK who decided that understanding darkness was insufficient - immersion was required. Morvan has spent more time inside theoretical dark-space constructs than in the physical world, which has given his spells a depth that most dark mages cannot reach from the outside. He still writes detailed academic papers on every spell he casts. After the battle.',
    hp: 3300, atk: 545, def: 185, crit: 495,
    skills: [
      { name: 'Dark Codex',    cost: 2, description: 'Channels a textbook-precise dark energy sequence that drains the target\'s life force.', damage: 1.9 },
      { name: 'Abyss Theorem', cost: 3, description: 'Applies a theoretically perfect dark-space formula to all enemies simultaneously.', damage: 2.4 },
    ],
    trumpCard: {
      name: 'Living Dissertation',
      description: 'Releases a complete academic dark-energy construct - every formula, every derivation, detonated at once across all enemies.',
      damage: 4.5,
      effect: 'Drains life from all enemies healing self 30% max HP; stuns all enemies 1 turn',
    },
  },

  // ── hero_048 · SUNSPIRE · A · Male · Attacker · Dual Sword ─────────────────
  {
    id: 'hero_048',
    name: 'Aeron Lucente',
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
      description: 'Both blades ignite with pure divine radiance - Aeron performs a continuous sanctification slash across every enemy on the field.',
      damage: 4.6,
      effect: 'Stuns all enemies 1 turn; heals all allies 20% HP',
    },
  },

  // ── hero_049 · SUNSPIRE · B · Female · Support · Triplet Sister ─────────────
  {
    id: 'hero_049',
    name: 'Celia Faro',
    frame: 'HOLYFLAME',
    faction: 'SUNSPIRE',
    rank: 'B',
    element: 'Holy',
    effect: 'BLESSING',
    class: 'Support',
    cardId: 'SUN-10-CELIA',
    image: require('../../assets/heroes/hero_049.webp'),
    about: 'One of three fire-born sisters - born beside Renata Ceniza of EMBERVEIL and Brigid Fallon of VERDANIA, and uniquely blessed with holy light where her sisters carry fire and earth. Celia joined SUNSPIRE not to leave her family behind but because the light pulled in a direction she could not ignore. She has spent years learning that illumination and fire have always had the same source, just different forms.',
    hp: 3500, atk: 345, def: 242, crit: 292,
    skills: [
      { name: 'Holy Warmth',    cost: 1, description: 'Channels holy light into the most wounded ally, restoring HP and granting brief damage resistance.', damage: 0 },
      { name: 'Flame Blessing', cost: 2, description: 'Weaves holy light with the ember warmth of her bloodline, healing all allies and boosting their next strike.', damage: 0 },
    ],
    trumpCard: {
      name: 'Threefold Radiance',
      description: 'Calls upon the bond of three sisters - fire, earth, and holy light combined - flooding the battlefield with restorative sacred energy.',
      damage: 1.8,
      effect: 'Heals all allies 35% max HP; stuns all enemies 1 turn',
    },
  },

  // ── hero_050 · VERDANIA · B · Female · Mage · Triplet Sister ───────────────
  {
    id: 'hero_050',
    name: 'Brigid Fallon',
    frame: 'EARTHFLAME',
    faction: 'VERDANIA',
    rank: 'B',
    element: 'Nature',
    effect: 'TOXIN',
    class: 'Mage',
    cardId: 'VRD-09-BRIGID',
    image: require('../../assets/heroes/hero_050.webp'),
    about: 'One of three fire-born sisters - born alongside Renata Ceniza of EMBERVEIL and Celia Faro of SUNSPIRE, and drawn from birth toward the root rather than the flame. Brigid watched one sister burn everything she touches and another illuminate it, and chose instead to grow things. She is gentle in three languages and devastating in all of them.',
    hp: 3700, atk: 435, def: 218, crit: 388,
    skills: [
      { name: 'Root Surge',    cost: 2, description: 'Calls roots from the earth to bind and poison a single target, draining their vitality into the soil.', damage: 1.8 },
      { name: 'Bloom Cascade', cost: 3, description: 'Unleashes a wave of toxic bloom spores across all enemies, poisoning everything they touch.', damage: 2.2 },
    ],
    trumpCard: {
      name: 'Earthfire Bloom',
      description: 'Draws on the fire of her bloodline through earth and root - a volcanic bloom erupts across the entire field, healing allies and stunning all enemies.',
      damage: 3.8,
      effect: 'Heals allies 20% max HP; stuns all enemies 1 turn',
    },
  },

  // ── hero_051 · VOIDMARK · S · Female · Mage · Sovereign's Advisor ──────────
  {
    id: 'hero_051',
    name: 'Corvina',
    frame: 'VOIDCOUNSEL',
    faction: 'VOIDMARK',
    rank: 'S',
    element: 'Void',
    effect: 'VOID_CURSE',
    class: 'Mage',
    cardId: 'VMK-12-CORVINA',
    image: require('../../assets/heroes/hero_051.webp'),
    about: 'VOIDMARK\'s sovereign Titania keeps no inner council - except one. Corvina is not royal by blood, not second in command, not a general; she is simply the one person in VOIDMARK whose counsel Titania listens to without exception or question. No one knows what was said between them the day that arrangement began. No one has dared to ask. Corvina\'s void magic is quiet and absolute - exactly like the trust that grants her access to the abyss throne.',
    hp: 3400, atk: 640, def: 202, crit: 580,
    skills: [
      { name: 'Counsel of Void', cost: 2, description: 'Delivers a precise void curse drawn from sovereign-level void doctrine, reducing the target\'s power at its source.', damage: 2.1 },
      { name: 'Abyss Edict',     cost: 3, description: 'Issues a void edict of sovereign authority, collapsing an enemy\'s dimensional integrity entirely.', damage: 2.6 },
    ],
    trumpCard: {
      name: 'Sovereign\'s Will',
      description: 'Channels the full weight of Titania\'s sovereign void authority - a devastating edict that stuns all enemies and restores the caster.',
      damage: 5.2,
      effect: 'Stuns all enemies 2 turns; heals self 20% HP',
    },
  },

  // ── hero_052 · SUNSPIRE · B · Female · Mage ────────────────────────────────
  {
    id: 'hero_052',
    name: 'Lucia Solano',
    frame: 'SOLARWEAVE',
    faction: 'SUNSPIRE',
    rank: 'B',
    element: 'Holy',
    effect: 'BLESSING',
    class: 'Mage',
    cardId: 'SUN-11-LUCIA',
    image: require('../../assets/heroes/hero_052.webp'),
    about: 'A solar-channeling mage of SUNSPIRE who built her entire magical vocabulary out of concentrated sunlight before she learned a single offensive spell. Lucia is an expert in the healing science of light frequency and a moderate expert in reducing everything that opposes her to ash. She is considerably more effective at the latter than her academic background suggests.',
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
    name: 'Aveline Kerr',
    frame: 'PLUMEWARDEN',
    faction: 'VERDANIA',
    rank: 'A',
    element: 'Nature',
    effect: 'THORNSTRIKE',
    class: 'Mage',
    cardId: 'VRD-10-AVELINE',
    image: require('../../assets/heroes/hero_053.webp'),
    about: 'A nature mage of VERDANIA who arrived at her magical specialty by accident - she was trying to communicate with a wounded crow and ended up channeling the entire forest\'s awareness through the bird\'s dying perception. She has never been the same since. Aveline\'s bird companions function as extensions of her senses, her range, and her power; every spell she casts arrives from an angle that shouldn\'t be possible.',
    hp: 3200, atk: 542, def: 188, crit: 492,
    skills: [
      { name: 'Feather Storm', cost: 2, description: 'Sends a flock of nature-infused birds to strike from impossible angles no defence can anticipate.', damage: 1.9 },
      { name: 'Raptor Dive',   cost: 3, description: 'Channels power through her largest bird companion for a devastating nature-force plunge strike at the target.', damage: 2.5 },
    ],
    trumpCard: {
      name: 'Murder of Crows',
      description: 'Calls upon every bird companion at once - a dark tempest of nature-infused wings and thorns descends on all enemies from every direction.',
      damage: 4.6,
      effect: 'Stuns all enemies 1 turn; heals all allies 20% HP',
    },
  },

  // ── hero_054 · KHEMARA · S · Female · Mage · SOVEREIGN · SHOP-EXCLUSIVE ─────
  // Marquee shop-only Sovereign - the moon-queen who rules the new sand-and-moon
  // realm of KHEMARA. shopExclusive:true keeps her out of every gacha pool (see
  // SummonScreen). Ascends with Aetheria's Core (sovereign routing).
  // NOTE: hero_054.webp is currently a placeholder copy - swap in the real art.
  {
    id: 'hero_054',
    name: 'Nefertari',
    frame: 'MOONTHRONE',
    faction: 'KHEMARA',
    rank: 'S',
    element: 'Moon',
    effect: 'MOONLIGHT',
    class: 'Mage',
    cardId: 'KHE-EX-NEFERTARI',
    image: require('../../assets/heroes/hero_054.webp'),
    about: 'The living moon-queen of KHEMARA - a sand dominion of obelisks, shifting dunes, and silver nights that bows to no other sovereign. Crowned not by daylight but by the full desert moon, Nefertari rules as goddess and pharaoh in one, her word law from the cooling sands to the deepest dunes. She cannot be summoned or won in battle; she descends only for those who seek her court directly, trailing a veil of moonlit dust that turns the night air to silver. To stand before her is to be weighed in the dark.',
    hp: 4300, atk: 800, def: 240, crit: 740, sovereign: true, shopExclusive: true,
    skills: [
      { name: 'Lunar Verdict', cost: 2, description: 'Brands a single enemy under the cold light of the moon - silver judgment that pierces every resistance.', damage: 2.7 },
      { name: 'Duneshroud',    cost: 3, description: 'Raises a blinding veil of moonlit sand that scours all enemies at once.', damage: 2.2 },
    ],
    trumpCard: {
      name: 'Dominion of the Moon',
      description: 'Nefertari draws the full desert moon down over the battlefield - a tide of silver light and singing sand that buries every enemy while its glow mends her court.',
      damage: 6.3,
      effect: 'Stuns all enemies 2 turns; heals all allies 30% HP',
    },
  },

  // ── hero_055 · KHEMARA · C · Male · Mage ───────────────────────────────────
  {
    id: 'hero_055',
    name: 'Karim Hosni',
    frame: 'DUNECONJURER',
    faction: 'KHEMARA',
    rank: 'C',
    element: 'Sand',
    effect: 'SANDFLAY',
    class: 'Mage',
    cardId: 'KHE-02-KARIM',
    image: require('../../assets/heroes/hero_055.webp'),
    about: 'A street-born sand conjurer who taught himself the old desert magic from half-buried scrolls salvaged out of collapsed tombs. Raw, untrained, and reckless - but the dunes answer him all the same, and KHEMARA has learned not to mock the boy who can turn an entire street into a swallowing pit of sand.',
    hp: 2850, atk: 500, def: 150, crit: 470,
    skills: [
      { name: 'Grit Scrawl',     cost: 1, description: 'Hurls a hastily-drawn glyph that flays a single enemy with razor-edged sand.', damage: 1.4 },
      { name: 'Sandscour Burst', cost: 3, description: 'Whips up a sweeping wall of abrasive sand that scours all enemies at once.', damage: 2.0 },
    ],
    trumpCard: {
      name: 'Tomb of Dunes',
      description: 'Collapses the battlefield into a churning grave of sand, dragging every enemy under.',
      damage: 4.2,
      effect: 'Stuns all enemies 1 turn',
    },
  },

  // ── hero_056 · KHEMARA · A · Female · Mage · Richest woman of Khemara ───────
  {
    id: 'hero_056',
    name: 'Zubaida Farouk',
    frame: 'GILDEDMATRON',
    faction: 'KHEMARA',
    rank: 'A',
    element: 'Moon',
    effect: 'LIFEDRAIN',
    class: 'Mage',
    cardId: 'KHE-03-ZUBAIDA',
    image: require('../../assets/heroes/hero_056.webp'),
    about: 'The richest woman in KHEMARA - her vaults outshine the royal treasury and her gilded sigils turn an enemy\'s own vitality into tribute. Wealth, to Zubaida, is simply life that has not yet been collected. She funds the throne, owns half the delta, and has never once been told no.',
    hp: 3050, atk: 600, def: 165, crit: 560,
    skills: [
      { name: 'Gilded Siphon', cost: 2, description: 'Brands a target with a gold sigil that bleeds its life away to the caster.', damage: 1.9 },
      { name: 'Tribute Due',   cost: 3, description: 'Calls in every debt at once, draining all enemies in cold, reclaiming moonlight.', damage: 2.2 },
    ],
    trumpCard: {
      name: 'Midas Reckoning',
      description: 'Encases every enemy in molten gold and reclaims their vitality as tribute to the throne.',
      damage: 4.8,
      effect: 'Heals all allies 25% HP',
    },
  },

  // ── hero_057 · KHEMARA · B · Female · Mage · Profound dancer ───────────────
  {
    id: 'hero_057',
    name: 'Hathor Amara',
    frame: 'MIRAGEDANCER',
    faction: 'KHEMARA',
    rank: 'B',
    element: 'Sand',
    effect: 'PARALYSIS',
    class: 'Mage',
    cardId: 'KHE-04-HATHOR',
    image: require('../../assets/heroes/hero_057.webp'),
    about: 'A temple dancer whose movements are a language older than KHEMARA itself. Those who watch her dance too long forget how to move at all - and by then the sand has already coiled around their ankles. The court calls her art devotion. Her enemies call it the last thing they saw.',
    hp: 2950, atk: 545, def: 158, crit: 510,
    skills: [
      { name: 'Veil Step',    cost: 2, description: 'A hypnotic spin that mesmerizes a single enemy as sand coils tight around it.', damage: 1.7 },
      { name: 'Mirage Waltz', cost: 3, description: 'Whirls into a storm of sand and silk that disorients all enemies at once.', damage: 2.0 },
    ],
    trumpCard: {
      name: 'Dance of the Forgotten',
      description: 'Performs the final movement no enemy can look away from - a desert trance that roots them where they stand.',
      damage: 4.4,
      effect: 'Stuns all enemies 1 turn',
    },
  },

  // ── hero_058 · KHEMARA · A · Male · Defender · Sovereign advisor ───────────
  {
    id: 'hero_058',
    name: 'Imhotep Rashid',
    frame: 'THRONEWARDEN',
    faction: 'KHEMARA',
    rank: 'A',
    element: 'Sand',
    effect: 'SOVEREIGNTY',
    class: 'Defender',
    cardId: 'KHE-05-IMHOTEP',
    image: require('../../assets/heroes/hero_058.webp'),
    about: 'First advisor and living shield of the moon-throne. Imhotep has counseled three regents and outlived two, and he places himself between KHEMARA\'s ruler and all harm as a matter of plain arithmetic: the realm needs her, and she needs time. He has never raised his voice. He has never had to.',
    hp: 7000, atk: 320, def: 575, crit: 180,
    skills: [
      { name: 'Aegis Decree', cost: 1, description: 'Raises a hardened sandstone ward that absorbs the next blow aimed at the line.', damage: 0 },
      { name: 'Throneguard',  cost: 2, description: 'Slams a ceremonial staff to the earth, repelling all enemies with a wall of warding force.', damage: 1.3 },
    ],
    trumpCard: {
      name: 'Unbroken Counsel',
      description: 'Raises the full weight of the sovereign\'s aegis - shielding the court and burying those who dare approach the throne beneath the sand.',
      damage: 3.8,
      effect: 'Shields the team against the next hit; heals all allies 20% HP',
    },
  },

  // ── hero_059 · KHEMARA · A · Female · Attacker · Assassin ──────────────────
  {
    id: 'hero_059',
    name: 'Nitocris Sabbagh',
    frame: 'DUNESHADE',
    faction: 'KHEMARA',
    rank: 'A',
    element: 'Moon',
    effect: 'PHANTOMSTRIKE',
    class: 'Attacker',
    cardId: 'KHE-06-NITOCRIS',
    image: require('../../assets/heroes/hero_059.webp'),
    about: 'KHEMARA\'s quietest law - the blade the throne never admits to owning. Nitocris moves through the dunes like a rumor and leaves only a settling of sand where a target used to breathe. The court does not speak of her. That is precisely how she prefers it.',
    hp: 3400, atk: 560, def: 195, crit: 600,
    skills: [
      { name: 'Scorpion\'s Kiss',  cost: 1, description: 'A lightning-fast khopesh slash that lands before it can be seen.', damage: 1.6 },
      { name: 'Duneshade Ambush',  cost: 3, description: 'Vanishes into the moonless dark and reappears mid-strike for a devastating blow.', damage: 2.6 },
    ],
    trumpCard: {
      name: 'Verdict of the Sands',
      description: 'Delivers the throne\'s unspoken sentence - a flurry of unseen strikes that buries the battlefield in settling sand.',
      damage: 4.9,
      effect: 'Stuns all enemies 1 turn',
    },
  },

  // ── hero_060 · KHEMARA · B · Male · Mage · Lawmaker ────────────────────────
  {
    id: 'hero_060',
    name: 'Thoth Haddad',
    frame: 'EDICTBEARER',
    faction: 'KHEMARA',
    rank: 'B',
    element: 'Moon',
    effect: 'SHATTER',
    class: 'Mage',
    cardId: 'KHE-07-THOTH',
    image: require('../../assets/heroes/hero_060.webp'),
    about: 'KHEMARA\'s lawgiver - keeper of the great scales and the edicts carved into obelisk-stone, sworn to the moon under which all verdicts are weighed. When Thoth reads a judgment aloud, the guilty feel their defenses crack like moon-bleached clay long before the sentence ever lands. The law, he insists, is not cruelty. It is simply weight, applied evenly.',
    hp: 3000, atk: 555, def: 162, crit: 515,
    skills: [
      { name: 'Edict of Ruin',      cost: 2, description: 'Pronounces a verdict that fractures a single enemy\'s defenses with a sentence of cold moonlight.', damage: 1.8 },
      { name: 'Scales of Judgment', cost: 3, description: 'Weighs all enemies and finds them wanting - answering with a cascade of silver moonfire.', damage: 2.1 },
    ],
    trumpCard: {
      name: 'Final Decree',
      description: 'Carves the last law into the night sky; a storm of silver judgment-light shatters and consumes every enemy at once.',
      damage: 4.6,
      effect: 'Stuns all enemies 1 turn',
    },
  },

  // ── hero_061 · VERDANIA · B · Female · Attacker · Thornvine duelist ─────────
  {
    id: 'hero_061',
    name: 'Brianna Fenwick',
    frame: 'BRIARFANG',
    faction: 'VERDANIA',
    rank: 'B',
    element: 'Nature',
    effect: 'THORNSTRIKE',
    class: 'Attacker',
    cardId: 'VRD-11-BRIANNA',
    image: require('../../assets/heroes/hero_061.webp'),
    about: 'A vine-warrior of the deep VERDANIA thickets who fights with a whip of living briar that answers every strike with a hundred thorns of its own. She grew up wrestling brambles for territory before she ever held a blade, and the forest still remembers her as one of its own.',
    hp: 3450, atk: 520, def: 210, crit: 480,
    skills: [
      { name: 'Bramble Lash',  cost: 1, description: 'Whips a barbed vine across a single enemy, thorns catching flesh.', damage: 1.5 },
      { name: 'Thicket Snare', cost: 3, description: 'Drags a wall of thorned bramble through the enemy line.', damage: 2.2 },
    ],
    trumpCard: {
      name: 'Bramble Reckoning',
      description: 'Calls every root and thorn in reach to converge on the enemy line at once.',
      damage: 4.3,
      effect: 'Stuns all enemies 1 turn',
    },
  },

  // ── hero_062 · EMBERVEIL · A · Female · Mage · Spider lily witch ────────────
  {
    id: 'hero_062',
    name: 'Amara Solís',
    frame: 'CRIMSONBLOOM',
    faction: 'EMBERVEIL',
    rank: 'A',
    element: 'Fire',
    effect: 'SCORCH',
    class: 'Mage',
    cardId: 'EMB-11-AMARA',
    image: require('../../assets/heroes/hero_062.webp'),
    about: 'Named for the red spider lily that blooms only where the dead have passed, Amara carries that same quiet finality into battle - her flame doesn\'t rage, it simply arrives, and by the time it\'s noticed the outcome is already decided. EMBERVEIL keeps her at arm\'s length; even fire respects an ending.',
    hp: 3150, atk: 565, def: 180, crit: 525,
    skills: [
      { name: 'Higanbana Bloom', cost: 2, description: 'Unfurls a blossom of scorching petals across a single target.', damage: 1.8 },
      { name: 'Crimson Requiem', cost: 3, description: 'Sets the ground itself alight in a spreading field of red flame.', damage: 2.4 },
    ],
    trumpCard: {
      name: 'Equinox of Ash',
      description: 'Every petal she has ever scattered ignites at once, consuming the battlefield in red fire.',
      damage: 4.7,
      effect: 'Stuns all enemies 1 turn; heals all allies 20% HP',
    },
  },

  // ── hero_063 · SUNSPIRE · A · Female · Attacker · Cathedral lancer ──────────
  {
    id: 'hero_063',
    name: 'Solenne Marchetti',
    frame: 'SOLARLANCE',
    faction: 'SUNSPIRE',
    rank: 'A',
    element: 'Holy',
    effect: 'SMITE',
    class: 'Attacker',
    cardId: 'SUN-12-SOLENNE',
    image: require('../../assets/heroes/hero_063.webp'),
    about: 'A cathedral-forged lancer who carries a shard of the sun itself in the head of her spear. Solenne was never chosen by prophecy or bloodline - she simply walked into the light one day and it never let her leave.',
    hp: 4150, atk: 545, def: 245, crit: 575,
    skills: [
      { name: 'Radiant Thrust', cost: 1, description: 'A blazing lance strike aimed straight through an enemy\'s guard.', damage: 1.6 },
      { name: 'Solar Impale',   cost: 3, description: 'Drives the lance down like a falling star onto a single target.', damage: 2.7 },
    ],
    trumpCard: {
      name: 'Zenith Descent',
      description: 'Calls the noonday sun down as a single searing spear that scours every enemy caught beneath it.',
      damage: 4.9,
      effect: 'Stuns all enemies 1 turn',
    },
  },

  // ── hero_064 · VOIDMARK · A · Female · Attacker · Masterless swordswoman ────
  {
    id: 'hero_064',
    name: 'Suzu Kagenami',
    frame: 'SHADOWKATANA',
    faction: 'VOIDMARK',
    rank: 'A',
    element: 'Void',
    effect: 'PHANTOMSTRIKE',
    class: 'Attacker',
    cardId: 'VMK-13-SUZU',
    image: require('../../assets/heroes/hero_064.webp'),
    about: 'A masterless blade who trained under VOIDMARK\'s silent dueling halls until her katana strokes stopped casting shadows of their own. She speaks rarely and fights less - one clean draw is usually all she allows an opponent to see.',
    hp: 3550, atk: 585, def: 220, crit: 615,
    skills: [
      { name: 'Iaijutsu Flicker', cost: 1, description: 'A single draw-cut faster than the eye can track.', damage: 1.6 },
      { name: 'Void Kesa-giri',   cost: 3, description: 'A diagonal cut through the fabric of shadow itself.', damage: 2.6 },
    ],
    trumpCard: {
      name: 'Thousand Shadow Cut',
      description: 'Draws and sheathes her blade a thousand times in the space of one breath, striking every enemy before the sound of the first cut arrives.',
      damage: 4.8,
      effect: 'Stuns all enemies 1 turn',
    },
  },

  // ── hero_065 · VERDANIA · B · Female · Attacker · Wandering katana duelist ──
  {
    id: 'hero_065',
    name: 'Roisin Leary',
    frame: 'BLOSSOMBLADE',
    faction: 'VERDANIA',
    rank: 'B',
    element: 'Nature',
    effect: 'SHATTER',
    class: 'Attacker',
    cardId: 'VRD-12-ROISIN',
    image: require('../../assets/heroes/hero_065.webp'),
    about: 'A wandering swordswoman who fell in love with her katana before she ever fell in love with a person, and VERDANIA\'s groves taught her to carve through wood, stone, and armor alike with the same unhurried grace. She sharpens the blade with river stones and nothing else.',
    hp: 3600, atk: 505, def: 225, crit: 460,
    skills: [
      { name: 'Falling Petal Cut',  cost: 1, description: 'A precise sword strike that drifts in like a falling blossom before it lands.', damage: 1.5 },
      { name: 'Hollow Grove Slash', cost: 2, description: 'A wide arcing cut that cleaves straight through an enemy\'s defenses.', damage: 2.0 },
    ],
    trumpCard: {
      name: 'Bloomfall Execution',
      description: 'A single perfect draw-cut released in a shower of falling petals that shatters every guard in its path.',
      damage: 4.4,
      effect: 'Stuns all enemies 1 turn',
    },
  },

  // ── hero_066 · SUNSPIRE · A · Female · Support · Temple healer ──────────────
  {
    id: 'hero_066',
    name: 'Xian Meiying',
    frame: 'JADELOTUS',
    faction: 'SUNSPIRE',
    rank: 'A',
    element: 'Holy',
    effect: 'RADIANCE',
    class: 'Support',
    cardId: 'SUN-13-XIAN',
    image: require('../../assets/heroes/hero_066.webp'),
    about: 'A temple healer from the sunlit terraces beyond SUNSPIRE\'s eastern gate, Meiying carries a folding fan painted with lotus blossoms that glow warm gold whenever she calls on it. Her chants are older than the temple itself, borrowed from a homeland she still hums the songs of.',
    hp: 3900, atk: 420, def: 260, crit: 350,
    skills: [
      { name: 'Lotus Ward',        cost: 1, description: 'Blesses the lowest-HP ally with warm restorative light.', damage: 0 },
      { name: 'Golden Fan Strike', cost: 2, description: 'A sweeping fan gust that carries sunlit force into an enemy.', damage: 1.5 },
    ],
    trumpCard: {
      name: 'Jade Lotus Dawn',
      description: 'Unfolds her fan fully, filling the field with restorative dawn-light while radiant petals bind every enemy in place.',
      damage: 3.4,
      effect: 'Stuns all enemies 1 turn; heals all allies 30% HP',
    },
  },

  // ── hero_067 · KHEMARA · A · Female · Attacker · Cat-goddess huntress ───────
  {
    id: 'hero_067',
    name: 'Bastet Nour',
    frame: 'PANTHERVEIL',
    faction: 'KHEMARA',
    rank: 'A',
    element: 'Moon',
    effect: 'SHADOW',
    class: 'Attacker',
    cardId: 'KHE-08-BASTET',
    image: require('../../assets/heroes/hero_067.webp'),
    about: 'Bastet moves through KHEMARA\'s moonlit alleys like a shadow given claws - silent, sure-footed, and never quite where you last looked. She keeps no court and answers to no throne, only the hunt.',
    hp: 3450, atk: 575, def: 205, crit: 590,
    skills: [
      { name: 'Claw Rake',      cost: 1, description: 'A blur of raking claws across a single target.', damage: 1.5 },
      { name: 'Moonlit Pounce', cost: 2, description: 'Leaps from the shadow of the moon to strike unseen.', damage: 2.1 },
    ],
    trumpCard: {
      name: 'Nine Lives Reckoning',
      description: 'Strikes as though every life she has ever spent converges into one relentless assault on every enemy.',
      damage: 4.6,
      effect: 'Stuns all enemies 1 turn',
    },
  },

  // ── hero_068 · EMBERVEIL · B · Female · Mage · Flame-rite priestess ─────────
  {
    id: 'hero_068',
    name: 'Inés Flores',
    frame: 'SINDOORFLAME',
    faction: 'EMBERVEIL',
    rank: 'B',
    element: 'Fire',
    effect: 'BURN',
    class: 'Mage',
    cardId: 'EMB-12-INES',
    image: require('../../assets/heroes/hero_068.webp'),
    about: 'Named for the Sanskrit word for fire, Inés carries the sacred flame-craft of her homeland into EMBERVEIL\'s ranks, painting sigils of living ember across the air with a fingertip. The old rites she was taught as a child still hold - the flame answers her like family.',
    hp: 3100, atk: 515, def: 168, crit: 470,
    skills: [
      { name: 'Ember Sigil',       cost: 1, description: 'Draws a burning sigil that scorches a single enemy.', damage: 1.4 },
      { name: 'Flamewreath Chant', cost: 2, description: 'Chants an old rite that wreathes a target in climbing fire.', damage: 2.0 },
    ],
    trumpCard: {
      name: 'Rite of the Undying Flame',
      description: 'Completes the oldest fire-rite she knows, wreathing every enemy in flame that refuses to be extinguished.',
      damage: 4.3,
      effect: 'Stuns all enemies 1 turn; heals all allies 20% HP',
    },
  },

  // ── hero_069 · KHEMARA · A · Male · Attacker · Frontier war-god's heir ──────
  {
    id: 'hero_069',
    name: 'Montu Anwar',
    frame: 'WARBRAND',
    faction: 'KHEMARA',
    rank: 'A',
    element: 'Sand',
    effect: 'SHATTER',
    class: 'Attacker',
    cardId: 'KHE-09-MONTU',
    image: require('../../assets/heroes/hero_069.webp'),
    about: 'Montu carries a sand-forged khopesh said to have broken more shields than any weapon in KHEMARA\'s armory. He was a border soldier before the throne ever noticed him, and he still fights like the border is all that matters.',
    hp: 4300, atk: 555, def: 255, crit: 470,
    skills: [
      { name: 'Sandforged Cleave', cost: 1, description: 'A heavy khopesh cleave backed by grinding sand.', damage: 1.6 },
      { name: 'Warbrand Sunder',   cost: 3, description: 'A two-handed strike meant to break shields, not just flesh.', damage: 2.6 },
    ],
    trumpCard: {
      name: 'Frontier\'s Reckoning',
      description: 'Channels every border battle he has ever survived into one shield-shattering advance across the entire enemy line.',
      damage: 4.8,
      effect: 'Stuns all enemies 1 turn',
    },
  },

  // ── hero_070 · KHEMARA · A · Female · Mage · Assassin mage ──────────────────
  {
    id: 'hero_070',
    name: 'Serqet Ashkar',
    frame: 'SHADOWSCARAB',
    faction: 'KHEMARA',
    rank: 'A',
    element: 'Moon',
    effect: 'LIFEDRAIN',
    class: 'Mage',
    cardId: 'KHE-10-SERQET',
    image: require('../../assets/heroes/hero_070.webp'),
    about: 'Trained in KHEMARA\'s hidden scarab cults, Serqet kills with a whispered verse rather than a blade - a curse that drinks a target\'s strength before they even register the wound. The throne has used her twice. Both times, no one else was told.',
    hp: 3050, atk: 570, def: 175, crit: 540,
    skills: [
      { name: 'Scarab\'s Whisper', cost: 2, description: 'A murmured curse that siphons vitality from a single enemy.', damage: 1.8 },
      { name: 'Hollowing Verse',   cost: 3, description: 'A deeper curse that drains the life from all enemies at once.', damage: 2.2 },
    ],
    trumpCard: {
      name: 'Requiem of the Scarab',
      description: 'Speaks the final verse of the old cult, drawing the life from every enemy on the field into herself.',
      damage: 4.5,
      effect: 'Heals all allies 25% HP',
    },
  },

  // ── hero_071 · VOIDMARK · B · Female · Support · Blindfolded oracle ─────────
  {
    id: 'hero_071',
    name: 'Nyxa Hollis',
    frame: 'BLINDSEER',
    faction: 'VOIDMARK',
    rank: 'B',
    element: 'Void',
    effect: 'REJUVENATE',
    class: 'Support',
    cardId: 'VMK-14-NYXA',
    image: require('../../assets/heroes/hero_071.webp'),
    about: 'Blindfolded since the day VOIDMARK\'s oracles found her staring too long into the dark between stars, Nyxa sees nothing and everything at once. She guides her allies not by sight but by the shape of the silence around them.',
    hp: 3650, atk: 360, def: 235, crit: 300,
    skills: [
      { name: 'Veiled Guidance', cost: 1, description: 'Murmurs an unseen blessing that mends the lowest-HP ally.', damage: 0 },
      { name: 'Whispering Dark', cost: 2, description: 'Reaches through the blindfold\'s dark to unsettle a single enemy.', damage: 1.4 },
    ],
    trumpCard: {
      name: 'Eyes of the Unseen',
      description: 'Opens her sight fully for one terrible instant, mending every ally with what she finds in the dark between worlds.',
      damage: 3.0,
      effect: 'Heals all allies 35% HP; shields team against next 1 hit each',
    },
  },

  // ── hero_072 · VOIDMARK · B · Female · Mage · Silver-haired rift mage ───────
  {
    id: 'hero_072',
    name: 'Selvira Marrow',
    frame: 'SILVERVEIL',
    faction: 'VOIDMARK',
    rank: 'B',
    element: 'Void',
    effect: 'VOID_PULSE',
    class: 'Mage',
    cardId: 'VMK-15-SELVIRA',
    image: require('../../assets/heroes/hero_072.webp'),
    about: 'Her silver hair is said to have turned that color the night she first opened a rift into VOIDMARK\'s deep current - and never quite closed it all the way. She speaks softly, but the space around her never stops humming.',
    hp: 3150, atk: 510, def: 172, crit: 480,
    skills: [
      { name: 'Silver Rift',      cost: 1, description: 'Opens a small tear in the void that lashes a single enemy.', damage: 1.5 },
      { name: 'Duskharrow Pulse', cost: 2, description: 'Sends a pulse of unraveling dark through the enemy line.', damage: 1.9 },
    ],
    trumpCard: {
      name: 'Unclosing Rift',
      description: 'Widens the rift she has never fully sealed, letting the void itself pour out over every enemy.',
      damage: 4.2,
      effect: 'Stuns all enemies 1 turn',
    },
  },

  // ── hero_073 · GLACIARA · A · Female · Mage · White-haired frost mage ───────
  {
    id: 'hero_073',
    name: 'Yuliana Belova',
    frame: 'FROSTGAZE',
    faction: 'GLACIARA',
    rank: 'A',
    element: 'Ice',
    effect: 'BLIZZARD',
    class: 'Mage',
    cardId: 'GLA-11-YULIANA',
    image: require('../../assets/heroes/hero_073.webp'),
    about: 'Her white hair and pale blue eyes have led more than one traveler to mistake her for a spirit of the GLACIARA peaks rather than a living mage. She has stopped correcting them - it makes the blizzards she calls a little easier to explain.',
    hp: 3050, atk: 590, def: 182, crit: 555,
    skills: [
      { name: 'Frostgaze Lance', cost: 2, description: 'A piercing shard of ice loosed with a single cold stare.', damage: 1.9 },
      { name: 'Whiteout Veil',   cost: 3, description: 'Buries a target in a sudden, blinding blizzard.', damage: 2.3 },
    ],
    trumpCard: {
      name: 'Eternal Whiteout',
      description: 'Calls the full fury of the high peaks down in a blizzard that swallows the entire battlefield.',
      damage: 4.9,
      effect: 'Stuns all enemies 2 turns; heals all allies 20% HP',
    },
  },

  // ── hero_074 · GLACIARA · B · Female · Defender · Frontier ice guard ────────
  {
    id: 'hero_074',
    name: 'Katarina Studenova',
    frame: 'ICEBASTION',
    faction: 'GLACIARA',
    rank: 'B',
    element: 'Ice',
    effect: 'CHILL',
    class: 'Defender',
    cardId: 'GLA-12-KATARINA',
    image: require('../../assets/heroes/hero_074.webp'),
    about: 'A frontier guard who packed her shield with lake-ice each winter until, over enough winters, the ice simply stopped melting. GLACIARA\'s border villages sleep easier knowing Katarina\'s shield is between them and the cold beyond.',
    hp: 6600, atk: 330, def: 555, crit: 200,
    skills: [
      { name: 'Frostwall Guard', cost: 1, description: 'Raises a wall of packed ice that absorbs the next blow aimed at the line.', damage: 0 },
      { name: 'Glacial Slam',    cost: 2, description: 'Slams her ice-bound shield into an enemy, chilling them to the bone.', damage: 1.3 },
    ],
    trumpCard: {
      name: 'Frostmere Bulwark',
      description: 'Anchors the full weight of the frozen lake behind her shield and drives it through the enemy line.',
      damage: 3.7,
      effect: 'Stuns all enemies 1 turn',
    },
  },

  // ── hero_075 · VERDANIA · B · Female · Support · Flower maid healer ─────────
  {
    id: 'hero_075',
    name: 'Sorcha Fitzgerald',
    frame: 'PETALKEEPER',
    faction: 'VERDANIA',
    rank: 'B',
    element: 'Nature',
    effect: 'BLOOM',
    class: 'Support',
    cardId: 'VRD-13-SORCHA',
    image: require('../../assets/heroes/hero_075.webp'),
    about: 'A flower-tender from VERDANIA\'s terraced gardens who learned that the right bloom, pressed to a wound at the right moment, heals faster than any potion. She still wears fresh petals in her hair, even into battle.',
    hp: 3700, atk: 355, def: 245, crit: 305,
    skills: [
      { name: 'Petal Mend',   cost: 1, description: 'Presses a healing blossom to the lowest-HP ally.', damage: 0 },
      { name: 'Garden\'s Bite', cost: 2, description: 'Sends a flurry of thorned petals at a single enemy.', damage: 1.4 },
    ],
    trumpCard: {
      name: 'Full Bloom Benediction',
      description: 'Calls every flower in the garden to open at once, mending the whole team in a wave of fragrant petals.',
      damage: 2.8,
      effect: 'Heals all allies 40% HP; shields team against next 1 hit each',
    },
  },

  // ── hero_076 · VERDANIA · A · Female · Mage · Court illusionist ─────────────
  {
    id: 'hero_076',
    name: 'Fiona Blake',
    frame: 'MIRAGEBLOOM',
    faction: 'VERDANIA',
    rank: 'A',
    element: 'Nature',
    effect: 'ENTANGLEMENT',
    class: 'Mage',
    cardId: 'VRD-14-FIONA',
    image: require('../../assets/heroes/hero_076.webp'),
    about: 'VERDANIA\'s court illusionist, Faelira weaves living vines and false light so seamlessly that even she sometimes loses track of which grove is real. Enemies who chase her mirages usually find the vines were never an illusion at all.',
    hp: 3200, atk: 550, def: 185, crit: 505,
    skills: [
      { name: 'Mirage Bloom',      cost: 2, description: 'Conjures a false blossoming grove that lashes out at a single enemy.', damage: 1.8 },
      { name: 'Vinebound Illusion', cost: 3, description: 'Ensnares the battlefield itself in illusion-woven vines.', damage: 2.1 },
    ],
    trumpCard: {
      name: 'Grand Illusion of the Grove',
      description: 'Unveils an entire phantom forest around the enemy line, roots and all, before it closes in for real.',
      damage: 4.4,
      effect: 'Stuns all enemies 2 turns',
    },
  },

  // ── hero_077 · VOIDMARK · A · Female · Attacker · Shadow walker ─────────────
  {
    id: 'hero_077',
    name: 'Noctura Ashby',
    frame: 'SHADOWTREAD',
    faction: 'VOIDMARK',
    rank: 'A',
    element: 'Void',
    effect: 'SHADOW',
    class: 'Attacker',
    cardId: 'VMK-16-NOCTURA',
    image: require('../../assets/heroes/hero_077.webp'),
    about: 'Noctura learned to walk between shadows before she learned to walk in daylight, slipping from one patch of dark to the next until distance stopped meaning anything to her. VOIDMARK\'s deepest corridors are the only place she has ever felt fully seen.',
    hp: 3500, atk: 580, def: 215, crit: 605,
    skills: [
      { name: 'Shadowtread Strike',   cost: 1, description: 'Steps through a patch of shadow to land a blow from an unexpected angle.', damage: 1.6 },
      { name: 'Veilshade Cross-cut',  cost: 2, description: 'A crossing double-strike delivered from two shadows at once.', damage: 2.1 },
    ],
    trumpCard: {
      name: 'Endless Shadow Walk',
      description: 'Steps through every shadow on the battlefield at once, striking each enemy before any of them see her move.',
      damage: 4.7,
      effect: 'Stuns all enemies 1 turn',
    },
  },

  // ── hero_078 · KHEMARA · A · Female · Mage · Sand-and-time chronomancer ─────
  {
    id: 'hero_078',
    name: 'Sopdet Karam',
    frame: 'HOURGLASSTHRONE',
    faction: 'KHEMARA',
    rank: 'A',
    element: 'Sand',
    effect: 'SHATTER',
    class: 'Mage',
    cardId: 'KHE-11-SOPDET',
    image: require('../../assets/heroes/hero_078.webp'),
    about: 'Named for the faint star her grandmother taught her to find in the dark, Sopdet commands sand the way others command clocks - pouring it forward, backward, or simply still, until an enemy\'s defenses erode like a shore under an unseen tide.',
    hp: 3150, atk: 560, def: 178, crit: 530,
    skills: [
      { name: 'Hourglass Fracture', cost: 2, description: 'Reverses a moment of time around a single enemy, cracking their guard.', damage: 1.8 },
      { name: 'Eroding Tide',       cost: 3, description: 'Pours a slow, relentless tide of sand through the enemy line.', damage: 2.2 },
    ],
    trumpCard: {
      name: 'Turn of the Endless Hour',
      description: 'Empties the last grain of an hourglass older than KHEMARA itself, burying every enemy under centuries of settling sand.',
      damage: 4.7,
      effect: 'Stuns all enemies 1 turn',
    },
  },

  // ── hero_079 · VOIDMARK · S · Male · Mage · Underworld syndicate boss ───────
  {
    id: 'hero_079',
    name: 'Varek',
    frame: 'DUSKSYNDICATE',
    faction: 'VOIDMARK',
    rank: 'S',
    element: 'Dark',
    effect: 'INTIMIDATION',
    class: 'Mage',
    cardId: 'VMK-17-VAREK',
    image: require('../../assets/heroes/hero_079.webp'),
    about: 'Varek built VOIDMARK\'s underworld syndicate from a single debt collected in the dark, and now every favor owed in the city eventually comes due to him. He speaks softly because he has never needed to raise his voice - the shadows do the negotiating for him.',
    hp: 3600, atk: 660, def: 195, crit: 615,
    skills: [
      { name: 'Backroom Deal',  cost: 1, description: 'Makes a single enemy an offer they cannot refuse, striking hard enough to press the point home.', damage: 1.5 },
      { name: 'Omerta Decree',  cost: 3, description: 'Calls in every debt VOIDMARK owes him at once, crushing a target beneath the weight of obligation.', damage: 2.6 },
    ],
    trumpCard: {
      name: 'The Whole Family Answers',
      description: 'Summons every shadow in his employ to strike all enemies at once, freezing the battlefield in fear.',
      damage: 4.6,
      effect: 'Stuns all enemies 1 turn',
    },
  },

  // ── hero_080 · VOIDMARK · A · Female · Mage · Witch, girlfriend of hero_079 ─
  {
    id: 'hero_080',
    name: 'Selene Noir',
    frame: 'NIGHTHEX',
    faction: 'VOIDMARK',
    rank: 'A',
    element: 'Dark',
    effect: 'WITCHBANE',
    class: 'Mage',
    cardId: 'VMK-18-SELENE',
    image: require('../../assets/heroes/hero_080.webp'),
    about: 'Selene brews her curses in the same kitchen where she cooks dinner for Varek, the two of them splitting VOIDMARK\'s underworld between his contracts and her hexes without ever needing to argue about it. She jokes that she fell for him the moment he didn\'t flinch at one of her poisons.',
    hp: 3050, atk: 585, def: 170, crit: 545,
    skills: [
      { name: 'Cursed Sip',    cost: 1, description: 'Slips a bitter hex into a single enemy, poisoning them from the inside out.', damage: 1.4 },
      { name: 'Widow\'s Bloom', cost: 3, description: 'Blooms a toxic hex across a single enemy that spreads with every heartbeat.', damage: 2.3 },
    ],
    trumpCard: {
      name: 'Coven\'s Last Word',
      description: 'Unleashes every curse she has ever brewed at once, poisoning the entire enemy line.',
      damage: 4.3,
      effect: 'Stuns all enemies 1 turn',
    },
  },

  // ── hero_081 · EMBERVEIL · A · Male · Attacker · Heavy sword ────────────────
  {
    id: 'hero_081',
    name: 'Rafael Infierno',
    frame: 'INFERNOBLADE',
    faction: 'EMBERVEIL',
    rank: 'A',
    element: 'Fire',
    effect: 'INFERNOEDGE',
    class: 'Attacker',
    cardId: 'EMB-13-RAFAEL',
    image: require('../../assets/heroes/hero_081.webp'),
    about: 'Rafael carries a greatsword too heavy for most EMBERVEIL warriors to lift, tempered in a forge fire that has never once been allowed to go out. He measures a fight\'s difficulty by how many strikes it takes before the blade starts to glow.',
    hp: 3400, atk: 605, def: 205, crit: 500,
    skills: [
      { name: 'Cleaving Ember', cost: 1, description: 'A heavy, sweeping slash that leaves a trail of embers burning across the target.', damage: 1.5 },
      { name: 'Forgebreaker',   cost: 3, description: 'Swings his greatsword through molten momentum, splitting a single enemy\'s guard wide open.', damage: 2.7 },
    ],
    trumpCard: {
      name: 'The Furnace Never Cools',
      description: 'Swings his blade in a full molten arc, catching every enemy in the resulting firestorm.',
      damage: 4.5,
      effect: 'Stuns all enemies 1 turn',
    },
  },

  // ── hero_082 · VERDANIA · A · Male · Defender · Living oak tank ─────────────
  {
    id: 'hero_082',
    name: 'Eamon Thorne',
    frame: 'OAKWARDEN',
    faction: 'VERDANIA',
    rank: 'A',
    element: 'Wood',
    effect: 'OAKWARD',
    class: 'Defender',
    cardId: 'VRD-15-EAMON',
    image: require('../../assets/heroes/hero_082.webp'),
    about: 'Thorne planted himself between VERDANIA\'s oldest grove and every threat that has come for it, and centuries of bark have grown over the scars to prove he never once stepped aside. Enemies describe hitting him as swinging at a mountain that remembers being a tree.',
    hp: 6900, atk: 350, def: 565, crit: 195,
    skills: [
      { name: 'Rootbound Guard', cost: 1, description: 'Plants his shield like a root, hardening his stance against the next attack.', damage: 0 },
      { name: 'Timberfall Slam', cost: 2, description: 'Drives his shield into the ground like a falling trunk, rattling every enemy nearby.', damage: 1.4 },
    ],
    trumpCard: {
      name: 'The Grove Remembers',
      description: 'Calls on centuries of rooted patience, slamming his shield down hard enough to shake the whole battlefield.',
      damage: 2.8,
      effect: 'Stuns all enemies 1 turn',
    },
  },

  // ── hero_083 · VOIDMARK · A · Male · Attacker · Swordmaster ─────────────────
  {
    id: 'hero_083',
    name: 'Riven Castellane',
    frame: 'VOIDREAVER',
    faction: 'VOIDMARK',
    rank: 'A',
    element: 'Void',
    effect: 'ABYSSEDGE',
    class: 'Attacker',
    cardId: 'VMK-19-RIVEN',
    image: require('../../assets/heroes/hero_083.webp'),
    about: 'Riven\'s blade was forged in a rift that never fully closed, and it still hums with the void it was pulled from. He duels alone by choice, having long since run out of VOIDMARK swordsmen willing to face him twice.',
    hp: 3150, atk: 615, def: 185, crit: 560,
    skills: [
      { name: 'Rift Cut',           cost: 1, description: 'A single slash drawn from the still-open rift in his blade.', damage: 1.6 },
      { name: 'Voidedge Requiem',   cost: 3, description: 'Channels the abyss through his blade for a strike meant to end the duel outright.', damage: 2.7 },
    ],
    trumpCard: {
      name: 'The Rift Remembers Me',
      description: 'Opens the wound in his blade fully, cutting every enemy on the field with a single motion.',
      damage: 4.6,
      effect: 'Stuns all enemies 1 turn',
    },
  },

  // ── hero_084 · KHEMARA · S · Male · Mage · Chronomancer ─────────────────────
  {
    id: 'hero_084',
    name: 'Thutmose',
    frame: 'CHRONOVEIL',
    faction: 'KHEMARA',
    rank: 'S',
    element: 'Time',
    effect: 'TIMEDILATION',
    class: 'Mage',
    cardId: 'KHE-12-THUTMOSE',
    image: require('../../assets/heroes/hero_084.webp'),
    about: 'Thutmose reads KHEMARA\'s history the way others read a clock face, and has learned to bend the space between one second and the next just enough to win a fight before it starts. He insists he isn\'t rewinding time - he\'s simply refusing to let it catch up.',
    hp: 3500, atk: 670, def: 200, crit: 605,
    skills: [
      { name: 'Fractured Second',   cost: 2, description: 'Splits a single moment in two, striking before the enemy\'s reaction ever arrives.', damage: 1.8 },
      { name: 'Borrowed Hourglass', cost: 3, description: 'Steals a stretch of time from a single enemy, slowing them to a crawl as he strikes.', damage: 2.5 },
    ],
    trumpCard: {
      name: 'The Hour That Never Was',
      description: 'Unwinds time across the entire battlefield just long enough to land a blow on everyone in it.',
      damage: 4.6,
      effect: 'Stuns all enemies 1 turn',
    },
  },

  // ── hero_085 · KHEMARA · A · Female · Attacker · Sand dancer ────────────────
  {
    id: 'hero_085',
    name: 'Meret Al-Zahir',
    frame: 'DUNEWALTZ',
    faction: 'KHEMARA',
    rank: 'A',
    element: 'Sand',
    effect: 'SANDVEIL',
    class: 'Attacker',
    cardId: 'KHE-13-MERET',
    image: require('../../assets/heroes/hero_085.webp'),
    about: 'Meret moves across KHEMARA\'s dunes like the sand itself is dancing with her, each spin kicking up a blade-edge of grit sharp enough to part armor. She has never lost a duel fought on open sand.',
    hp: 2950, atk: 595, def: 165, crit: 565,
    skills: [
      { name: 'Whirling Dune Step', cost: 1, description: 'A spinning strike that kicks up a blade-edge of sand against a single enemy.', damage: 1.5 },
      { name: 'Sirocco Waltz',      cost: 3, description: 'A dizzying dance through a sandstorm of her own making, cracking a single enemy\'s armor.', damage: 2.4 },
    ],
    trumpCard: {
      name: 'Dance of the Open Dunes',
      description: 'Spins through the entire battlefield at once, scouring every enemy\'s defenses to grit.',
      damage: 4.5,
      effect: 'Stuns all enemies 1 turn',
    },
  },

  // ── hero_086 · KHEMARA · B · Female · Support · Fortune teller ──────────────
  {
    id: 'hero_086',
    name: 'Seshat Najm',
    frame: 'FATEWEAVER',
    faction: 'KHEMARA',
    rank: 'B',
    element: 'Moon',
    effect: 'FATEBIND',
    class: 'Support',
    cardId: 'KHE-14-SESHAT',
    image: require('../../assets/heroes/hero_086.webp'),
    about: 'Seshat reads a person\'s fate in the shift of moonlight across scattered bones, and has never once told a client the whole truth of what she saw. KHEMARA\'s court fears her prophecies more than its enemies\' armies.',
    hp: 3850, atk: 300, def: 280, crit: 250,
    skills: [
      { name: 'Bone Reading',  cost: 1, description: 'Scatters moonlit bones to read a single enemy\'s fate, and nudges it toward misfortune.', damage: 1.1 },
      { name: 'Foretold Ruin', cost: 2, description: 'Speaks a single enemy\'s downfall aloud, weakening their resolve before it even happens.', damage: 1.6 },
    ],
    trumpCard: {
      name: 'The Ending I Already Saw',
      description: 'Reveals every enemy\'s fate at once, and none of them like how the story ends.',
      damage: 3.2,
      effect: 'Stuns all enemies 2 turns',
    },
  },

  // ── hero_087 · VOIDMARK · A · Female · Attacker · Katana assassin ───────────
  {
    id: 'hero_087',
    name: 'Yume Kurogane',
    frame: 'MOONLESSBLADE',
    faction: 'VOIDMARK',
    rank: 'A',
    element: 'Dark',
    effect: 'NIGHTBLADE',
    class: 'Attacker',
    cardId: 'VMK-20-YUME',
    image: require('../../assets/heroes/hero_087.webp'),
    about: 'Yume trained in VOIDMARK\'s darkest hours until she could cross a moonless room without a single footstep landing loud enough to hear. Her katana has a name, but she has never told anyone what it is.',
    hp: 2900, atk: 610, def: 160, crit: 575,
    skills: [
      { name: 'Silent Draw', cost: 1, description: 'A soundless katana draw that lands before the target registers she has moved.', damage: 1.6 },
      { name: 'Moonless Cut', cost: 2, description: 'Vanishes into shadow and reappears mid-strike, blade first.', damage: 2.1 },
    ],
    trumpCard: {
      name: 'One Name, One Cut',
      description: 'Crosses the entire battlefield in a single silent motion, cutting down every enemy in her path.',
      damage: 4.7,
      effect: 'Stuns all enemies 1 turn',
    },
  },

  // ── hero_088 · VERDANIA · A · Male · Attacker · Dagger master ───────────────
  {
    id: 'hero_088',
    name: 'Lorcan Quill',
    frame: 'SWIFTFANG',
    faction: 'VERDANIA',
    rank: 'A',
    element: 'Wind',
    effect: 'SWIFTTHORN',
    class: 'Attacker',
    cardId: 'VRD-16-LORCAN',
    image: require('../../assets/heroes/hero_088.webp'),
    about: 'Lorcan carries a dagger for every leaf that ever fell in his corner of VERDANIA\'s forest, or so the story goes - no one has ever moved fast enough to count him drawing them. He treats a duel as a conversation best finished before the other side realizes it started.',
    hp: 3050, atk: 600, def: 170, crit: 555,
    skills: [
      { name: 'Falling Leaf Strike',  cost: 1, description: 'A quick dagger flick timed to a falling leaf, striking a single enemy before it hits the ground.', damage: 1.5 },
      { name: 'Thousand-Leaf Flurry', cost: 2, description: 'A blur of dagger throws that catches a single enemy from every angle at once.', damage: 2.0 },
    ],
    trumpCard: {
      name: 'The Whole Forest Falls',
      description: 'Throws every dagger he carries at once, raining thorned steel across the entire enemy line.',
      damage: 4.4,
      effect: 'Stuns all enemies 1 turn',
    },
  },

  // ── hero_089 · VERDANIA · B · Female · Support · Healer ─────────────────────
  {
    id: 'hero_089',
    name: 'Elowen Doherty',
    frame: 'BLOOMWARDEN',
    faction: 'VERDANIA',
    rank: 'B',
    element: 'Nature',
    effect: 'HEARTBLOOM',
    class: 'Support',
    cardId: 'VRD-17-ELOWEN',
    image: require('../../assets/heroes/hero_089.webp'),
    about: 'Elowen tends VERDANIA\'s wounded the way she tends her garden, patient enough to coax life back into anything that still has a single green shoot left in it. Soldiers say her hands smell like spring no matter the season.',
    hp: 4050, atk: 275, def: 295, crit: 215,
    skills: [
      { name: 'Petal Mend',    cost: 1, description: 'Coaxes a bloom of healing petals over the lowest-HP ally.', damage: 0 },
      { name: 'Garden\'s Grace', cost: 2, description: 'Wraps an ally in living vines that knit their wounds shut.', damage: 0 },
    ],
    trumpCard: {
      name: 'Full Bloom',
      description: 'Blankets the entire team in a wave of restorative spring growth, mending every wound at once.',
      damage: 0,
      effect: 'Heals all allies 35% HP; shields team against next 1 hit each',
    },
  },

  // ── hero_090 · VOIDMARK · S · Male · Attacker · The Last Child of the Rift ──
  {
    id: 'hero_090',
    name: 'Valen',
    frame: 'RIFTWALKER',
    faction: 'VOIDMARK',
    rank: 'S',
    element: 'Void',
    effect: 'ECLIPSEDGE',
    class: 'Attacker',
    cardId: 'VMK-21-VALEN',
    image: require('../../assets/heroes/hero_090.webp'),
    about: 'Found as a newborn at the center of a frozen crater nineteen years before the first recorded breach - the first thing to ever cross between worlds, long before anyone had a name for what a rift even was. His green eyes see fractures in reality no one else can, and his broken black katana repairs itself one rune at a time with every threat he puts down. He never wanted to be a legend. He just wanted something worth protecting.',
    hp: 3600, atk: 660, def: 195, crit: 600,
    skills: [
      { name: 'Eclipsed Cut',   cost: 2, description: 'A single riftborn slash that cuts through armor and dimension alike.', damage: 2.0 },
      { name: 'Fracture Line',  cost: 3, description: 'Opens a line of unstable rift-space beneath all enemies, tearing through their defenses at once.', damage: 2.6 },
    ],
    trumpCard: {
      name: 'The Last Answer',
      description: 'Every crack in the Eclipsed Edge opens at once - a single riftwalking strike across all enemies, answering for everything he has ever protected.',
      damage: 5.0,
      effect: 'Stuns all enemies 1 turn; heals all allies 25% HP',
    },
  },

  // ── hero_091 · VOIDMARK · A · Female · Attacker ────────────────────────────
  {
    id: 'hero_091',
    name: 'Kessa Renfield',
    frame: 'CIRCUITFANG',
    faction: 'VOIDMARK',
    rank: 'A',
    element: 'Void',
    effect: 'CIRCUIT_RIP',
    class: 'Attacker',
    cardId: 'VMK-22-KESSA',
    image: require('../../assets/heroes/hero_091.webp'),
    about: 'Rebuilt from the wreckage of a VOIDMARK research accident that should have killed her twice, Kessa\'s arm was replaced with a rift-forged blade limb that cuts along fault lines invisible to the naked eye. She remembers neither her old name nor her old face, only the sister who still calls her by both.',
    hp: 4300, atk: 545, def: 235, crit: 475,
    skills: [
      { name: 'Fault Cut',  cost: 1, description: 'A precise rift-blade slash that finds structural weak points in armor.', damage: 1.4 },
      { name: 'Sheer Line', cost: 3, description: 'Drives her blade along an invisible fault line, rending defenses wide open.', damage: 2.5 },
    ],
    trumpCard: {
      name: 'Absolute Fracture',
      description: 'Channels her full rift-forged limb into one line that splits every enemy formation at once.',
      damage: 4.6,
      effect: 'Stuns all enemies 1 turn; heals all allies 20% HP',
    },
  },

  // ── hero_092 · VOIDMARK · A · Female · Mage ────────────────────────────────
  {
    id: 'hero_092',
    name: 'Vhalla Corvane',
    frame: 'HELLWEAVE',
    faction: 'VOIDMARK',
    rank: 'A',
    element: 'Void',
    effect: 'DEMON_BRAND',
    class: 'Mage',
    cardId: 'VMK-23-VHALLA',
    image: require('../../assets/heroes/hero_092.webp'),
    about: 'A demon-blooded conjurer born in the collapsed sublevels beneath VOIDMARK\'s capital, Vhalla treats every curse as a conversation and every enemy as an argument she intends to win. Her horns hum faintly whenever a lie is spoken nearby - which, in VOIDMARK, is often.',
    hp: 2950, atk: 600, def: 160, crit: 545,
    skills: [
      { name: 'Brand of Ruin',     cost: 2, description: 'Marks an enemy with a demonic sigil that saps their strength.', damage: 2.0 },
      { name: 'Infernal Verdict',  cost: 3, description: 'Passes demonic judgment on a target in a burst of hellfire-void energy.', damage: 2.5 },
    ],
    trumpCard: {
      name: 'Grimhorn\'s Reckoning',
      description: 'Opens a chorus of demonic voices that curse every enemy on the field at once.',
      damage: 4.8,
      effect: 'Stuns all enemies 1 turn; heals all allies 20% HP',
    },
  },

  // ── hero_093 · VOIDMARK · A · Male · Mage ──────────────────────────────────
  {
    id: 'hero_093',
    name: 'Emeric Thurstan',
    frame: 'DREAMWALKER',
    faction: 'VOIDMARK',
    rank: 'A',
    element: 'Void',
    effect: 'DREAM_SNARE',
    class: 'Mage',
    cardId: 'VMK-24-EMERIC',
    image: require('../../assets/heroes/hero_093.webp'),
    about: 'A dream walker who slips into enemy minds mid-battle, planting nightmares that lag a heartbeat behind reality. Emeric has not slept in his own dreams for years, preferring to wander other people\'s instead.',
    hp: 3000, atk: 585, def: 158, crit: 535,
    skills: [
      { name: 'Nightmare Seed', cost: 2, description: 'Plants a waking nightmare in the target\'s mind.', damage: 1.9 },
      { name: 'Dream Collapse', cost: 3, description: 'Collapses a fabricated dreamscape onto the enemy all at once.', damage: 2.4 },
    ],
    trumpCard: {
      name: 'The Unwaking Hour',
      description: 'Draws every enemy into one shared nightmare that refuses to end.',
      damage: 4.5,
      effect: 'Stuns all enemies 2 turns; heals all allies 20% HP',
    },
  },

  // ── hero_094 · VERDANIA · A · Female · Support ─────────────────────────────
  {
    id: 'hero_094',
    name: 'Saoirse Kavanagh',
    frame: 'WILDFLARE',
    faction: 'VERDANIA',
    rank: 'A',
    element: 'Nature',
    effect: 'SPRING_ZEAL',
    class: 'Support',
    cardId: 'VRD-18-SAOIRSE',
    image: require('../../assets/heroes/hero_094.webp'),
    about: 'An elf of VERDANIA\'s outer canopy whose temperament runs hotter than her forest kin ever expected from something bound to root and leaf. She mends wounds the way she argues - fast, fierce, and impossible to refuse.',
    hp: 3900, atk: 305, def: 265, crit: 285,
    skills: [
      { name: 'Kindled Bloom',   cost: 1, description: 'A flare of restorative warmth mends an ally\'s wounds.', damage: 0 },
      { name: 'Wildheart Surge', cost: 2, description: 'Fans an ember of vitality through an ally, boosting their resilience.', damage: 0 },
    ],
    trumpCard: {
      name: 'Everbloom Wildfire',
      description: 'Releases a surge of fierce, life-giving warmth across the whole team.',
      damage: 0,
      effect: 'Heals all allies 35% HP; shields team against next 1 hit each',
    },
  },

  // ── hero_095 · VOIDMARK · A · Female · Mage · Kessa Renfield's sister ───────
  {
    id: 'hero_095',
    name: 'Aiko Shiraishi',
    frame: 'NEUROSPARK',
    faction: 'VOIDMARK',
    rank: 'A',
    element: 'Void',
    effect: 'NEURAL_OVERLOAD',
    class: 'Mage',
    cardId: 'VMK-25-AIKO',
    image: require('../../assets/heroes/hero_095.webp'),
    about: 'The other survivor of the same VOIDMARK lab accident that remade her sister Kessa, Aiko\'s mind was rewired instead of her body - she now perceives probability the way others perceive color. She keeps a countdown of every day since the lab burned; she has never told anyone what number it is on.',
    hp: 2950, atk: 590, def: 155, crit: 540,
    skills: [
      { name: 'Probability Snap', cost: 2, description: 'Overloads a target\'s reactions with cascading calculated feedback.', damage: 1.9 },
      { name: 'Cascade Fault',    cost: 3, description: 'Forces an error-cascade through the enemy\'s every function.', damage: 2.4 },
    ],
    trumpCard: {
      name: 'Full System Overload',
      description: 'Floods every enemy\'s mind with impossible calculations all at once.',
      damage: 4.6,
      effect: 'Stuns all enemies 1 turn; heals all allies 20% HP',
    },
  },

  // ── hero_096 · KHEMARA · A · Female · Mage ─────────────────────────────────
  {
    id: 'hero_096',
    name: 'Kaia Nasser',
    frame: 'MOONHOWL',
    faction: 'KHEMARA',
    rank: 'A',
    element: 'Moon',
    effect: 'MOON_HOWL',
    class: 'Mage',
    cardId: 'KHE-15-KAIA',
    image: require('../../assets/heroes/hero_096.webp'),
    about: 'Queen of the beastman White Fang clan and KHEMARA\'s most feared war-caster, Kaia calls down the hunting moon itself to freeze her enemies mid-stride. Her tribe has not lost a border skirmish since she took the crown from her own mother in single combat.',
    hp: 3050, atk: 605, def: 165, crit: 545,
    skills: [
      { name: 'Lunar Cry',     cost: 2, description: 'A tribal howl amplified by moonlight that freezes enemies in place.', damage: 1.9 },
      { name: 'Fangmoon Rite', cost: 3, description: 'Calls the full hunting moon down upon a single target.', damage: 2.5 },
    ],
    trumpCard: {
      name: 'White Fang Ascendant',
      description: 'Summons her entire clan\'s ancestral howl beneath a blood moon, binding every enemy at once.',
      damage: 4.7,
      effect: 'Stuns all enemies 2 turns; heals all allies 20% HP',
    },
  },

  // ── hero_097 · SUNSPIRE · B · Female · Mage ────────────────────────────────
  {
    id: 'hero_097',
    name: 'Marielle Alba',
    frame: 'ARCHIVEMAGE',
    faction: 'SUNSPIRE',
    rank: 'B',
    element: 'Holy',
    effect: 'SCRIPTBIND',
    class: 'Mage',
    cardId: 'SUN-14-MARIELLE',
    image: require('../../assets/heroes/hero_097.webp'),
    about: 'Keeper of SUNSPIRE\'s forbidden archive wing, Marielle weaponises knowledge nobody else was brave enough to read. Her spells are recitations - every incantation quoted word-for-word from a text she alone remembers correctly.',
    hp: 2950, atk: 560, def: 162, crit: 515,
    skills: [
      { name: 'Forbidden Verse', cost: 2, description: 'Recites a passage that unravels an enemy\'s resolve.', damage: 1.7 },
      { name: 'Bound Chapter',   cost: 3, description: 'Seals a target within a passage of binding script.', damage: 2.1 },
    ],
    trumpCard: {
      name: 'The Last Unread Page',
      description: 'Recites the archive\'s final forbidden chapter over the entire enemy line.',
      damage: 4.0,
      effect: 'Stuns all enemies 1 turn; heals all allies 20% HP',
    },
  },

  // ── hero_098 · EMBERVEIL · B · Female · Mage ───────────────────────────────
  {
    id: 'hero_098',
    name: 'Morgaine',
    frame: 'CINDERWITCH',
    faction: 'EMBERVEIL',
    rank: 'B',
    element: 'Fire',
    effect: 'HEXFLAME',
    class: 'Mage',
    cardId: 'EMB-14-MORGAINE',
    image: require('../../assets/heroes/hero_098.webp'),
    about: 'A hedge-witch who wandered into EMBERVEIL territory chasing a rumor of a flame that burns backward through time, and stayed once she found it. Morgaine\'s hexes smell faintly of woodsmoke and old regret.',
    hp: 3000, atk: 548, def: 168, crit: 500,
    skills: [
      { name: 'Cinder Hex',      cost: 2, description: 'A backward-burning curse that smolders long after contact.', damage: 1.7 },
      { name: 'Woodsmoke Curse', cost: 3, description: 'Wreathes a target in smoke that ignites from the inside out.', damage: 2.1 },
    ],
    trumpCard: {
      name: 'Backward Blaze',
      description: 'Unleashes flame that burns against time itself, consuming every enemy at once.',
      damage: 4.1,
      effect: 'Burns all enemies 2 turns; heals all allies 20% HP',
    },
  },

  // ── hero_099 · GLACIARA · B · Female · Mage ────────────────────────────────
  {
    id: 'hero_099',
    name: 'Zoya Ledovska',
    frame: 'RIMEWEAVE',
    faction: 'GLACIARA',
    rank: 'B',
    element: 'Ice',
    effect: 'RIME_TOUCH',
    class: 'Mage',
    cardId: 'GLA-13-ZOYA',
    image: require('../../assets/heroes/hero_099.webp'),
    about: 'A GLACIARA mage who learned her craft from ice that predates the faction itself, Zoya speaks to glaciers the way others speak to old friends. She is in no hurry - the cold, she says, always wins eventually.',
    hp: 3000, atk: 558, def: 165, crit: 505,
    skills: [
      { name: 'Rime Whisper',      cost: 2, description: 'A touch of ancient frost slows a target to a crawl.', damage: 1.7 },
      { name: 'Glacier\'s Patience', cost: 3, description: 'Calls down the weight of a slow-moving glacier.', damage: 2.2 },
    ],
    trumpCard: {
      name: 'The Cold Always Wins',
      description: 'Lets the ancient ice have its way with the entire enemy line.',
      damage: 4.2,
      effect: 'Stuns all enemies 1 turn; heals all allies 20% HP',
    },
  },

  // ── hero_100 · VOIDMARK · A · Female · Attacker ────────────────────────────
  {
    id: 'hero_100',
    name: 'Morrigan Sorrel',
    frame: 'VOIDSCYTHE',
    faction: 'VOIDMARK',
    rank: 'A',
    element: 'Void',
    effect: 'SOULREAP',
    class: 'Attacker',
    cardId: 'VMK-26-MORRIGAN',
    image: require('../../assets/heroes/hero_100.webp'),
    about: 'A scythe-wielding reaper who serves no banner but her own ledger, tallying debts in VOIDMARK\'s name and collecting them personally. Nothing she has ever marked for collection has escaped.',
    hp: 3600, atk: 545, def: 205, crit: 500,
    skills: [
      { name: 'Ledger Cut',     cost: 1, description: 'A scythe strike that marks the target\'s debt in void ink.', damage: 1.5 },
      { name: 'Collection Due', cost: 3, description: 'Collects on every debt owed with one sweeping reap.', damage: 2.6 },
    ],
    trumpCard: {
      name: 'Final Tally',
      description: 'Closes every open ledger on the battlefield in a single void-scythe arc.',
      damage: 4.9,
      effect: 'Stuns all enemies 1 turn; heals all allies 20% HP',
    },
  },

  // ── hero_101 · VERDANIA · B · Male · Attacker ──────────────────────────────
  {
    id: 'hero_101',
    name: 'Garrick Boland',
    frame: 'WILDHALBERD',
    faction: 'VERDANIA',
    rank: 'B',
    element: 'Nature',
    effect: 'BRAMBLE_REND',
    class: 'Attacker',
    cardId: 'VRD-19-GARRICK',
    image: require('../../assets/heroes/hero_101.webp'),
    about: 'A VERDANIA halberdier who trained his weapon-arm by clearing deadfall in the deep wilds before he ever swung it at a person. Garrick fights the way he chops wood - patient, exact, and utterly without mercy on the follow-through.',
    hp: 3700, atk: 495, def: 200, crit: 440,
    skills: [
      { name: 'Deadfall Swing', cost: 1, description: 'A heavy halberd arc that leaves thorned splinters in the wound.', damage: 1.4 },
      { name: 'Thicket Cleave', cost: 2, description: 'Clears a wide arc of enemies like brush, leaving festering wounds.', damage: 1.8 },
    ],
    trumpCard: {
      name: 'The Deep Wilds\' Due',
      description: 'Fells everything in reach with one patient, exact swing.',
      damage: 3.8,
      effect: 'Stuns all enemies 1 turn; heals all allies 20% HP',
    },
  },

  // ── hero_102 · GLACIARA · A · Male · Attacker ──────────────────────────────
  {
    id: 'hero_102',
    name: 'Dmitri',
    frame: 'GLACIALGAUNTLET',
    faction: 'GLACIARA',
    rank: 'A',
    element: 'Ice',
    effect: 'PERMAFROST_FIST',
    class: 'Attacker',
    cardId: 'GLA-14-DMITRI',
    image: require('../../assets/heroes/hero_102.webp'),
    about: 'A GLACIARA brawler whose gauntlets were forged in a glacier crevasse and have never fully thawed since. Dmitri doesn\'t block hits so much as absorb them personally, then return the favor with interest.',
    hp: 4500, atk: 520, def: 255, crit: 440,
    skills: [
      { name: 'Glacier Jab',   cost: 1, description: 'A crushing gauntlet strike that cracks frozen armor.', damage: 1.4 },
      { name: 'Crevasse Hook', cost: 3, description: 'A brutal uppercut that shatters whatever it connects with.', damage: 2.7 },
    ],
    trumpCard: {
      name: 'Absolute Thaw',
      description: 'Releases every ounce of banked cold in one earth-shaking flurry of blows.',
      damage: 5.0,
      effect: 'Stuns all enemies 2 turns; heals all allies 20% HP',
    },
  },

  // ── hero_103 · VOIDMARK · B · Female · Mage · The Tech-Shaman Catalyst ─────
  {
    id: 'hero_103',
    name: 'Yuna Kitagawa',
    frame: 'TECHSHAMAN',
    faction: 'VOIDMARK',
    rank: 'B',
    element: 'Lightning',
    effect: 'CIRCUIT_CURSE',
    class: 'Mage',
    cardId: 'VMK-27-YUNA',
    image: require('../../assets/heroes/hero_103.webp'),
    about: 'VOIDMARK\'s Tech-Shaman Catalyst, Yuna fuses salvaged circuitry with old rite-magic that predates the faction\'s written history. Her constructs spark and chant in the same breath, and nobody has fully explained why that works.',
    hp: 2950, atk: 552, def: 160, crit: 505,
    skills: [
      { name: 'Rite of Sparks',  cost: 2, description: 'A chanted circuit-rune that shorts out an enemy\'s defenses.', damage: 1.7 },
      { name: 'Salvage Surge',   cost: 3, description: 'Overdrives a jury-rigged construct into a single devastating discharge.', damage: 2.2 },
    ],
    trumpCard: {
      name: 'Old Rite, New Circuit',
      description: 'Fuses chant and current into one field-wide discharge that shorts out every enemy at once.',
      damage: 4.1,
      effect: 'Stuns all enemies 1 turn; heals all allies 20% HP',
    },
  },

  // ── hero_104 · EMBERVEIL · S · Male · Attacker · The Havoc Specter ─────────
  {
    id: 'hero_104',
    name: 'Salvador',
    frame: 'HAVOCSPECTER',
    faction: 'EMBERVEIL',
    rank: 'S',
    element: 'Fire',
    effect: 'SPECTERFLAME',
    class: 'Attacker',
    cardId: 'EMB-15-SALVADOR',
    image: require('../../assets/heroes/hero_104.webp'),
    about: 'Known across EMBERVEIL only as the Havoc Specter, Salvador appears in the worst moment of a battle and leaves nothing standing behind him. Soldiers on both sides have learned not to look directly at the flame trailing his blade.',
    hp: 3650, atk: 665, def: 205, crit: 605,
    skills: [
      { name: 'Specter Slash', cost: 2, description: 'A blurring strike trailing spectral flame.', damage: 2.0 },
      { name: 'Havoc\'s Wake', cost: 3, description: 'Leaves a trail of devastation through everything in his path.', damage: 2.8 },
    ],
    trumpCard: {
      name: 'The Worst Moment',
      description: 'Appears at the exact worst possible instant and ends the fight before anyone can react.',
      damage: 5.2,
      effect: 'Stuns all enemies 1 turn; heals all allies 20% HP',
    },
  },

  // ── hero_105 · VERDANIA · S · Female · Support · Tech-Botanist Support ─────
  {
    id: 'hero_105',
    name: 'Wisteria',
    frame: 'TECHBOTANIST',
    faction: 'VERDANIA',
    rank: 'S',
    element: 'Nature',
    effect: 'BIOSYNTH_BLOOM',
    class: 'Support',
    cardId: 'VRD-20-WISTERIA',
    image: require('../../assets/heroes/hero_105.webp'),
    about: 'VERDANIA\'s Tech-Botanist Support, Wisteria grafts living circuitry into vine and root systems, letting the forest itself route her healing energy across the battlefield. She insists the plants she augments are happier for it; nobody has found a way to ask them.',
    hp: 4200, atk: 420, def: 285, crit: 380,
    skills: [
      { name: 'Circuit Graft',    cost: 1, description: 'Threads living current through root and vine to mend an ally.', damage: 0 },
      { name: 'Photosynth Pulse', cost: 2, description: 'Channels a burst of engineered growth-energy through the team.', damage: 0 },
    ],
    trumpCard: {
      name: 'Full Canopy Bloom',
      description: 'Routes every root and wire on the field into one field-wide surge of restoration.',
      damage: 0,
      effect: 'Heals all allies 40% HP; shields team against next 1 hit each',
    },
  },

  // ── hero_106 · VOIDMARK · A · Female · Attacker · Echo-Mimic Assassin ──────
  {
    id: 'hero_106',
    name: 'Sable Renwick',
    frame: 'ECHOMIMIC',
    faction: 'VOIDMARK',
    rank: 'A',
    element: 'Void',
    effect: 'MIRRORSTEP',
    class: 'Attacker',
    cardId: 'VMK-28-SABLE',
    image: require('../../assets/heroes/hero_106.webp'),
    about: 'An Echo-Mimic Assassin of VOIDMARK, Sable copies the last motion an enemy made a half-second before striking with it herself, turning a foe\'s own technique back on them. She has never needed a signature move - she simply borrows everyone else\'s.',
    hp: 3700, atk: 535, def: 215, crit: 495,
    skills: [
      { name: 'Borrowed Step', cost: 1, description: 'Mimics an enemy\'s last motion and strikes with it first.', damage: 1.5 },
      { name: 'Echo Flurry',   cost: 2, description: 'Repeats a stolen technique in rapid succession.', damage: 2.0 },
    ],
    trumpCard: {
      name: 'Every Move At Once',
      description: 'Mimics every technique she has ever copied in one overwhelming barrage.',
      damage: 4.4,
      effect: 'Stuns all enemies 1 turn; heals all allies 20% HP',
    },
  },

  // ── hero_107 · VOIDMARK · A · Female · Attacker · Glitch Master Assassin ───
  {
    id: 'hero_107',
    name: 'Ryna Ashcombe',
    frame: 'GLITCHMASTER',
    faction: 'VOIDMARK',
    rank: 'A',
    element: 'Void',
    effect: 'SYSTEM_FREEZE',
    class: 'Attacker',
    cardId: 'VMK-29-RYNA',
    image: require('../../assets/heroes/hero_107.webp'),
    about: 'A glitch-master infiltrator who treats reality\'s rendering errors as tools rather than flaws, Ryna freezes enemies mid-frame and slips past them before the world finishes loading. VOIDMARK\'s engineers still don\'t know if she\'s found a bug or become one.',
    hp: 3550, atk: 540, def: 200, crit: 510,
    skills: [
      { name: 'Frame Skip',        cost: 1, description: 'Slips between rendered frames to land an impossible strike.', damage: 1.5 },
      { name: 'Corrupted Packet',  cost: 3, description: 'Force-feeds a target a burst of malformed reality data.', damage: 2.6 },
    ],
    trumpCard: {
      name: 'World Still Loading',
      description: 'Freezes every enemy mid-frame while she moves through the gaps.',
      damage: 4.7,
      effect: 'Stuns all enemies 2 turns; heals all allies 20% HP',
    },
  },
];

export const getHeroById        = (id)      => HEROES.find((h) => h.id === id);
export const getHeroesByFaction = (faction) => HEROES.filter((h) => h.faction === faction);
export const getHeroesByRank    = (rank)    => HEROES.filter((h) => h.rank === rank);
export const getHeroesByClass   = (cls)     => HEROES.filter((h) => h.class === cls);
