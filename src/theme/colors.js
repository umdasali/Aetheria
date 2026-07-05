// ─── Design token source of truth ───────────────────────────────────────────
// NEVER use bare hex values or hardcoded rgba strings in screens or components.
// Always import C and use C.* tokens from this file.

export const C = {
  // ── Backgrounds (dark theme) ───────────────────────────────────────────────
  BG_DEEP:   '#08031A',   // Main body (dark purple-black)
  BG_BASE:   '#0E0720',   // Panels / section rows
  BG_MID:    '#160B2E',   // Slightly deeper panels
  BG_CARD:   '#1C0F38',   // Dark card surface
  BG_RAISED: '#120A2A',   // Dark elevated surface
  BG_STATS:  '#0C0620',   // Stat rows / inset sections
  BG_BOTTOM: '#060214',   // Deepest inset / footer strips

  // ── Borders ────────────────────────────────────────────────────────────────
  BORDER:        'rgba(167,139,250,0.18)',
  BORDER_STRONG: 'rgba(167,139,250,0.42)',
  BORDER_SUBTLE: 'rgba(255,255,255,0.07)',

  // ── Glass / white surface tints (layered dark screens) ─────────────────────
  GLASS_1: 'rgba(255,255,255,0.025)',  // barely-there panel tint
  GLASS_2: 'rgba(255,255,255,0.04)',   // inset bars, inactive dots
  GLASS_3: 'rgba(255,255,255,0.05)',   // idle tab / button bg
  GLASS_4: 'rgba(255,255,255,0.06)',   // chip bg
  GLASS_5: 'rgba(255,255,255,0.08)',   // dividers / cell borders
  GLASS_6: 'rgba(255,255,255,0.10)',   // tab borders
  GLASS_7: 'rgba(255,255,255,0.14)',   // inactive chip border

  // ── Dark compositing overlays ──────────────────────────────────────────────
  OVERLAY_1:     'rgba(0,0,0,0.28)',  // panel bg tint
  OVERLAY_2:     'rgba(0,0,0,0.35)',  // slot / card base
  OVERLAY_3:     'rgba(0,0,0,0.55)',  // badge bg
  OVERLAY_4:     'rgba(0,0,0,0.60)',  // full-coverage dimmer
  OVERLAY_STRONG:'rgba(0,0,0,0.70)',  // heavier full-coverage dimmer
  OVERLAY_MODAL: 'rgba(0,0,0,0.82)',  // full-screen modal backdrop

  // ── White-on-dark text (cinematic / dark screens) ──────────────────────────
  TEXT_ON_DARK_DIM:  'rgba(255,255,255,0.30)',  // de-emphasised labels
  TEXT_ON_DARK_WEAK: 'rgba(255,255,255,0.38)',  // faint text, between DIM and MUTED
  TEXT_ON_DARK_MUTED:'rgba(255,255,255,0.45)',  // secondary text / subtitles
  TEXT_ON_DARK_SOFT: 'rgba(255,255,255,0.52)',  // medium-visibility text
  TEXT_ON_DARK:      'rgba(255,255,255,0.70)',  // standard visible text
  ICON_MUTED:        'rgba(255,255,255,0.65)',  // muted icon on dark bg
  ICON_ON_DARK:      'rgba(255,255,255,0.80)',  // prominent/active icon on dark bg

  // ── Primary – Purple ───────────────────────────────────────────────────────
  PRIMARY:       '#7C3AED',
  PRIMARY_DARK:  '#5B21B6',
  PRIMARY_LIGHT: '#A78BFA',
  PRIMARY_GLOW:  'rgba(124,58,237,0.12)',

  // ── Secondary – Hot Pink ───────────────────────────────────────────────────
  SECONDARY:       '#DB2777',
  SECONDARY_DARK:  '#9D174D',
  SECONDARY_LIGHT: '#FBCFE8',
  SECONDARY_GLOW:  'rgba(219,39,119,0.12)',

  // ── Accent – Cyan ──────────────────────────────────────────────────────────
  CYAN:      '#0891B2',
  CYAN_GLOW: 'rgba(8,145,178,0.12)',

  // ── Gold / currency ────────────────────────────────────────────────────────
  GOLD:      '#D97706',
  GOLD_DARK: '#92400E',
  GOLD_GLOW: 'rgba(217,119,6,0.12)',

  // ── Sovereign hero tier ───────────────────────────────────────────────────
  SOVEREIGN_GOLD:  '#FFD700',               // Card border, crown badge, cardId tint
  SOVEREIGN_AMBER: '#FFA500',               // Bottom gradient warm tint
  SOVEREIGN_GLOW:  'rgba(255,215,0,0.22)',  // Shimmer bar & banner ambient glow
  SOVEREIGN_SHINE: 'rgba(255,255,180,0.48)',// Shimmer centre highlight peak

  // ── Stat colors ────────────────────────────────────────────────────────────
  HP:   '#E11D48',   // Rose-red
  ATK:  '#D97706',   // Amber
  DEF:  '#0891B2',   // Cyan
  CRIT: '#7C3AED',   // Purple

  // ── Status ────────────────────────────────────────────────────────────────
  SUCCESS:     '#059669',
  DANGER:      '#DC2626',
  DANGER_MID:  '#991B1B',   // Mid-dark red — gradient stop between DANGER and DANGER_DARK
  DANGER_DARK: '#7F1D1D',
  WARNING:     '#D97706',

  // ── Text (dark bg → light text) ───────────────────────────────────────────
  TEXT:          '#F0EAFF',   // Light lavender-white
  TEXT_SOFT:     '#C4B5FD',   // Soft lavender
  TEXT_MUTED:    '#8B7EC8',   // Muted purple (unchanged)
  TEXT_DISABLED: '#453870',   // Dark disabled

  // ── Dark cinematic — cinematic/loading screens ────────────────────────────
  BG_SCREEN:    '#06030F',                          // Home/loading dark bg
  BG_VOID:      '#020010',                          // Near-black starfield
  BG_DARK:      '#0A0520',                          // Very dark purple-black
  FLASH_GOLD:   'rgba(255,215,0,0.55)',             // S-rank reveal flash
  FLASH_PURPLE: 'rgba(192,132,252,0.45)',           // A-rank reveal flash
  SHIMMER:      'rgba(255,255,255,0.40)',           // Shimmer sweep highlight
  FLASH_LIGHT:  '#C8D8FF',                         // Lightning flash overlay (WeatherEffect)
  FLASH_WARM:      'rgba(255,240,160,0.9)',   // Warm lightning flash overlay (WeatherEffect)
  FLASH_COOL:      'rgba(180,220,255,0.9)',   // Cool lightning flash overlay (WeatherEffect)
  FLASH_NEUTRAL:   'rgba(255,255,255,0.9)',   // Neutral lightning flash overlay (WeatherEffect)
  RAIN_STREAK:     'rgba(180,225,255,0.35)',  // Rain streak gradient tail (WeatherEffect)
  RAIN_DROP:       'rgba(180,210,255,0.75)',  // Rain drop tint (WeatherEffect)
  SNOW_FLAKE:      'rgba(210,225,255,0.38)',  // Snowflake tint (WeatherEffect)
  FLASH_WHITE:  '#FFFFFF',                          // Crit / Trump impact screen flash (animated opacity)

  // ── Slider / control surface ──────────────────────────────────────────────
  THUMB: 'rgba(255,255,255,0.92)',   // Slider thumb — stands out on dark track

  // ── Extra glass / overlay steps ───────────────────────────────────────────
  GLASS_8:     'rgba(255,255,255,0.25)',  // prominent chip border / semi-visible
  OVERLAY_MID:  'rgba(0,0,0,0.45)',       // video-skip / floating button bg
  OVERLAY_VOID: 'rgba(6,2,18,0.78)',      // deep-purple modal / tutorial overlay

  // ── Frosted-glass panel (real glassmorphism: translucent, backdrop bleeds through) ──
  GLASS_EDGE:   'rgba(255,255,255,0.20)',                          // bright hairline edge that reads as "glass"
  GRAD_GLASS:   ['rgba(255,255,255,0.10)', 'rgba(12,7,30,0.52)'],  // panel fill: top sheen → dark-purple translucent base

  // ── Leaderboard medal palette ─────────────────────────────────────────────
  MEDAL_GOLD:        '#FFD700',                // gold rank (= SOVEREIGN_GOLD value)
  MEDAL_GOLD_DIM:    '#7A5500',                // subdued gold label color
  MEDAL_GOLD_BG:     'rgba(255,215,0,0.08)',   // gold row tint
  MEDAL_GOLD_GLOW:   'rgba(255,215,0,0.35)',   // gold shadow / glow
  MEDAL_GOLD_SHIMMER:'rgba(255,215,0,0.10)',   // shimmer sweep in champion card
  GRAD_CHAMPION:     ['#2A1800', '#1A0E00'],   // champion card dark-gold gradient bg

  MEDAL_SILVER:      '#C8C8D4',
  MEDAL_SILVER_DIM:  '#484860',
  MEDAL_SILVER_BG:   'rgba(200,200,212,0.06)',
  MEDAL_SILVER_GLOW: 'rgba(200,200,212,0.20)',

  MEDAL_BRONZE:      '#E0905A',
  MEDAL_BRONZE_DIM:  '#6B3A1A',
  MEDAL_BRONZE_BG:   'rgba(224,144,90,0.07)',
  MEDAL_BRONZE_GLOW: 'rgba(224,144,90,0.22)',

  // ── Streak fire accent ────────────────────────────────────────────────────
  STREAK_ORANGE:        '#FF6B35',
  STREAK_ORANGE_BG:     'rgba(255,100,0,0.18)',
  STREAK_ORANGE_BORDER: 'rgba(255,100,0,0.38)',

  // ── Deeper overlay (image bottom gradients) ───────────────────────────────
  OVERLAY_DEEP: 'rgba(0,0,0,0.88)',

  // ── Gradients ─────────────────────────────────────────────────────────────
  GRAD_BG:               ['#08031A', '#0E0720', '#08031A'],
  GRAD_HEADER:           ['#5B21B6', '#7C3AED'],            // Dark purple — always use light text on top
  GRAD_PINK:             ['#7C3AED', '#DB2777'],
  GRAD_GOLD:             ['#92400E', '#D97706'],
  GRAD_BATTLE:           ['rgba(6,3,14,0.78)', 'rgba(14,7,32,0.55)', 'rgba(6,3,14,0.78)'],
  GRAD_WIN:              ['#021A0D', '#042B14'],
  GRAD_LOSE:             ['#1A0202', '#2B0404'],
  GRAD_SUMMON:           ['#5B21B6', '#7C3AED', '#1E40AF'],
  GRAD_VOID:             ['#020010', '#0A0520', '#020010'],   // Summon reveal bg
  GRAD_VICTORY:          ['#000508', '#160B00', '#000508'],   // Victory screen — dark amber
  GRAD_DEFEAT:           ['#050003', '#160000', '#050003'],   // Defeat screen  — dark crimson
  GRAD_TOWER:            ['#03001A', '#09032C', '#03001A'],   // Tower normal floor bg
  GRAD_TOWER_BOSS:       ['#140005', '#1C000A', '#140005'],   // Tower boss floor bg
  GRAD_TOWER_MILESTONE:  ['#140A00', '#1E1200', '#140A00'],   // Tower milestone floor bg
  GRAD_PANEL:            ['#0E0525', '#1A0840'],              // Dark modal/card panel gradient

  // ── Shadow base ────────────────────────────────────────────────────────────
  SHADOW: '#000000',   // shadowColor base — opacity controlled by shadowOpacity
  TEXT_SHADOW: 'rgba(0,0,0,0.9)',   // legibility shadow for text over images/glass
};

// ── Rank badge colors — hierarchy: SOVEREIGN > S > A > B > C ─────────────────
export const RANK = {
  SOVEREIGN: { bg: '#FFD700', text: '#1A0A00', glow: '#FFEC6E' },
  S:         { bg: '#F72585', text: '#FFFFFF', glow: '#FF85C2' },
  A:         { bg: '#7B2FBE', text: '#E9D5FF', glow: '#C084FC' },
  B:         { bg: '#e2620d', text: '#E0F2FE', glow: '#ee9f6a' },
  C:         { bg: '#059669', text: '#D1FAE5', glow: '#6EE7B7' },
};

// Alias — import from here, not from data/heroes.js
export const RANK_COLORS = RANK;

// ── Faction matrix rain colors ────────────────────────────────────────────────
// Head = brightest leading character; trail = column body color.
export const FACTION_MATRIX = {
  EMBERVEIL: { head: '#FF6B35', trail: '#FF4500' },
  GLACIARA:  { head: '#E0F7FF', trail: '#81D4FA' },
  SUNSPIRE:  { head: '#FFF9C4', trail: '#FFD700' },
  VERDANIA:  { head: '#A8E6CF', trail: '#2ECC71' },
  VOIDMARK:  { head: '#D7BDE2', trail: '#9B59B6' },
  KHEMARA:   { head: '#FFF3CD', trail: '#C9A84C' },
};

// ── Faction particle palettes ─────────────────────────────────────────────────
// Used by FactionParticles.js — faction-specific ambient color arrays.
export const FACTION_PARTICLES = {
  palettes: {
    fire:    ['#FF4500', '#FF6B35', '#FF8C00', '#FFA500', '#FFD700'],
    snow:    ['#FFFFFF', '#E0F7FF', '#B3E5FC', '#81D4FA', '#90E0EF'],
    sparkle: ['#FFD700', '#FFF9C4', '#FFEE58', '#FFC107', '#FFFFFF'],
    leaf:    ['#2ECC71', '#27AE60', '#A8E6CF', '#52BE80', '#1ABC9C'],
    void:    ['#9B59B6', '#8E44AD', '#D7BDE2', '#BB8FCE', '#C39BD3'],
  },
  glows: {
    fire:    '#FF4500',
    snow:    '#90E0EF',
    sparkle: '#FFD700',
    leaf:    '#2ECC71',
    void:    '#9B59B6',
  },
};
