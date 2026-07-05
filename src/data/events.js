// ─── Limited-Time Event Definitions ──────────────────────────────────────────
// type: 'banner'
// Dates are maintained here manually. Update startDate / endDate (YYYY-MM-DD UTC)
// to schedule rotations — no app update needed for dates alone.
//
// getActiveEvents()   — startDate <= today <= endDate
// getUpcomingEvents() — startDate > today   (sorted soonest first)
// getEndedEvents()    — endDate < today     (sorted most-recent first)

// Standard banner featured pool — Genshin-style showcase
export const STANDARD_BANNER = {
  featuredSRankIds:  ['hero_024', 'hero_001', 'hero_003'],
  featuredLowerIds:  ['hero_007', 'hero_009', 'hero_010', 'hero_015', 'hero_006', 'hero_011'],
};

// ── Banner schedule — update startDate / endDate to manage events ─────────────
export const BANNER_POOL = [
  {
    id:               'event_blazing_vanguard',
    type:             'banner',
    name:             'Blazing Vanguard',
    subtitle:         'Limited Summoning Event',
    startDate:        '2026-06-14',   // ← change to schedule
    endDate:          '2026-06-28',   // ← change to schedule
    featuredHeroId:   'hero_043',
    rateUpHeroIds:    ['hero_043'],
    featuredLowerIds: ['hero_002', 'hero_007', 'hero_010', 'hero_021', 'hero_022', 'hero_016'],
    pityLimit:        80,
    bannerImg:        require('../../assets/heroes/hero_043.webp'),
    accentColor:      '#FF4500',
  },
  {
    id:               'event_shadow_descent',
    type:             'banner',
    name:             'Shadow Descent',
    subtitle:         'Limited Summoning Event',
    startDate:        '2026-07-05',   // ← change to schedule
    endDate:          '2026-07-19',   // ← change to schedule
    featuredHeroId:   'hero_008',
    rateUpHeroIds:    ['hero_008'],
    featuredLowerIds: ['hero_013', 'hero_014', 'hero_020', 'hero_034', 'hero_035', 'hero_046'],
    pityLimit:        80,
    bannerImg:        require('../../assets/heroes/hero_008.webp'),
    accentColor:      '#9B59B6',
  },
  {
    id:               'event_celestial_bloom',
    type:             'banner',
    name:             'Celestial Bloom',
    subtitle:         'Limited Summoning Event',
    startDate:        '2026-06-01',   // ← change to schedule
    endDate:          '2026-06-13',   // ← change to schedule
    featuredHeroId:   'hero_012',
    rateUpHeroIds:    ['hero_012'],
    featuredLowerIds: ['hero_009', 'hero_018', 'hero_027', 'hero_028', 'hero_039', 'hero_048'],
    pityLimit:        80,
    bannerImg:        require('../../assets/heroes/hero_012.webp'),
    accentColor:      '#FFD700',
  },
  // ── Next rotation — 8 events, back-to-back, 20 days each ────────────────────
  // Order: non-sovereign, non-sovereign, SOVEREIGN, repeat.
  // Khemara's sovereign (hero_054, Nefertari Shahrzad) is shop-exclusive — excluded.
  // Dates shifted +4 days (2026-07-05 audit) — the original start (07-16) overlapped
  // event_shadow_descent (ends 07-19) by 4 days; this chain now starts the day
  // after shadow_descent ends and keeps every other gap/overlap at zero.
  // featuredLowerIds were also re-diversified — 4 of these 8 originally shared one
  // byte-identical 6-hero list for ~3 months, and 2 more copied their neighbor's
  // list outright.
  {
    id:               'event_thunderstruck_vanguard',
    type:             'banner',
    name:             'Thunderstruck Vanguard',
    subtitle:         'Limited Summoning Event',
    startDate:        '2026-07-20',
    endDate:          '2026-08-08',
    featuredHeroId:   'hero_001',
    rateUpHeroIds:    ['hero_001'],
    featuredLowerIds: ['hero_023', 'hero_062', 'hero_068', 'hero_081', 'hero_006', 'hero_009'],
    pityLimit:        80,
    bannerImg:        require('../../assets/heroes/hero_001.webp'),
    accentColor:      '#FF4500',
  },
  {
    id:               'event_frostmend_vigil',
    type:             'banner',
    name:             'Frostmend Vigil',
    subtitle:         'Limited Summoning Event',
    startDate:        '2026-08-09',
    endDate:          '2026-08-28',
    featuredHeroId:   'hero_003',
    rateUpHeroIds:    ['hero_003'],
    featuredLowerIds: ['hero_011', 'hero_015', 'hero_017', 'hero_025', 'hero_026', 'hero_042'],
    pityLimit:        80,
    bannerImg:        require('../../assets/heroes/hero_003.webp'),
    accentColor:      '#00B4D8',
  },
  {
    id:               'event_verdant_sovereign',
    type:             'banner',
    name:             'Verdant Sovereign',
    subtitle:         'Sovereign Summoning Event',
    startDate:        '2026-08-29',
    endDate:          '2026-09-17',
    featuredHeroId:   'hero_030',
    rateUpHeroIds:    ['hero_030'],
    featuredLowerIds: ['hero_004', 'hero_005', 'hero_019', 'hero_031', 'hero_032', 'hero_044'],
    pityLimit:        80,
    bannerImg:        require('../../assets/heroes/hero_030.webp'),
    accentColor:      '#2ECC71',
  },
  {
    id:               'event_glacial_blade',
    type:             'banner',
    name:             'Glacial Blade',
    subtitle:         'Limited Summoning Event',
    startDate:        '2026-09-18',
    endDate:          '2026-10-07',
    featuredHeroId:   'hero_024',
    rateUpHeroIds:    ['hero_024'],
    featuredLowerIds: ['hero_040', 'hero_073', 'hero_053', 'hero_063', 'hero_050', 'hero_049'],
    pityLimit:        80,
    bannerImg:        require('../../assets/heroes/hero_024.webp'),
    accentColor:      '#00B4D8',
  },
  {
    id:               'event_spiritweave_whispers',
    type:             'banner',
    name:             'Spiritweave Whispers',
    subtitle:         'Limited Summoning Event',
    startDate:        '2026-10-08',
    endDate:          '2026-10-27',
    featuredHeroId:   'hero_036',
    rateUpHeroIds:    ['hero_036'],
    featuredLowerIds: ['hero_013', 'hero_014', 'hero_020', 'hero_034', 'hero_035', 'hero_046'],
    pityLimit:        80,
    bannerImg:        require('../../assets/heroes/hero_036.webp'),
    accentColor:      '#9B59B6',
  },
  {
    id:               'event_abyssal_throne',
    type:             'banner',
    name:             'Abyssal Throne',
    subtitle:         'Sovereign Summoning Event',
    startDate:        '2026-10-28',
    endDate:          '2026-11-16',
    featuredHeroId:   'hero_033',
    rateUpHeroIds:    ['hero_033'],
    featuredLowerIds: ['hero_038', 'hero_045', 'hero_047', 'hero_064', 'hero_071', 'hero_072'],
    pityLimit:        80,
    bannerImg:        require('../../assets/heroes/hero_033.webp'),
    accentColor:      '#9B59B6',
  },
  {
    id:               'event_void_counsel',
    type:             'banner',
    name:             'Void Counsel',
    subtitle:         'Limited Summoning Event',
    startDate:        '2026-11-17',
    endDate:          '2026-12-06',
    featuredHeroId:   'hero_051',
    rateUpHeroIds:    ['hero_051'],
    featuredLowerIds: ['hero_077', 'hero_080', 'hero_083', 'hero_087', 'hero_014', 'hero_020'],
    pityLimit:        80,
    bannerImg:        require('../../assets/heroes/hero_051.webp'),
    accentColor:      '#9B59B6',
  },
  {
    id:               'event_dusk_syndicate',
    type:             'banner',
    name:             'Dusk Syndicate',
    subtitle:         'Limited Summoning Event',
    startDate:        '2026-12-07',
    endDate:          '2026-12-26',
    featuredHeroId:   'hero_079',
    rateUpHeroIds:    ['hero_079'],
    featuredLowerIds: ['hero_013', 'hero_034', 'hero_046', 'hero_038', 'hero_064', 'hero_083'],
    pityLimit:        80,
    bannerImg:        require('../../assets/heroes/hero_079.webp'),
    accentColor:      '#9B59B6',
  },
];

// Back-compat export
export const ALL_EVENTS = BANNER_POOL;

// ── Date-based helpers ────────────────────────────────────────────────────────
function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

export function getActiveEvents() {
  const today = todayUTC();
  return BANNER_POOL.filter(e => e.startDate <= today && e.endDate >= today);
}

export function getUpcomingEvents() {
  const today = todayUTC();
  return BANNER_POOL
    .filter(e => e.startDate > today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}

export function getEndedEvents() {
  const today = todayUTC();
  return BANNER_POOL
    .filter(e => e.endDate < today)
    .sort((a, b) => b.endDate.localeCompare(a.endDate));
}

export function getFeaturedEvent() {
  const active = getActiveEvents();
  if (!active.length) return null;
  return active.sort((a, b) => (a.endDate < b.endDate ? -1 : 1))[0];
}

// Seconds remaining until end of endDate (UTC midnight after the last active day).
export function secondsUntilEnd(event) {
  const end = new Date(event.endDate);
  end.setUTCDate(end.getUTCDate() + 1);
  return Math.max(0, Math.floor((end.getTime() - Date.now()) / 1000));
}

// Seconds until the start of startDate (UTC midnight of startDate).
export function secondsUntilStart(event) {
  const start = new Date(event.startDate).getTime();
  return Math.max(0, Math.floor((start - Date.now()) / 1000));
}
