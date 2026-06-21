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
