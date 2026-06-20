// ─── Limited-Time Event Definitions ──────────────────────────────────────────
// type: 'banner' | 'login_bonus'
// For banner events:
//   featuredHeroId  — hero shown on the banner card
//   rateUpHeroIds   — S-rank heroes with boosted chance (50 % of all S pulls)
//   pityLimit       — override pity cap for this event (default 80)
//
// Banners ROTATE on a fixed cadence (see below) rather than expiring on hard-coded
// dates, so there is ALWAYS at least one active event — even years after launch and
// with no app update or server change. startDate / endDate are computed per rotation.

// Standard banner featured pool — Genshin-style showcase
export const STANDARD_BANNER = {
  featuredSRankIds:  ['hero_024', 'hero_001', 'hero_003'],  // Dusk Vale, Kira Voltz, Nova Blaine
  featuredLowerIds:  ['hero_007', 'hero_009', 'hero_010', 'hero_015', 'hero_006', 'hero_011'],  // Zane Ember, Kane Light, Tara Wind, Vex Hollow, Sol Frost, Vera Grove
};

// Pool of rotating banner templates (no fixed dates — those are assigned per rotation).
export const BANNER_POOL = [
  {
    id:              'event_blazing_vanguard',
    type:            'banner',
    name:            'Blazing Vanguard',
    subtitle:        'Limited Summoning Event',
    featuredHeroId:  'hero_043',
    rateUpHeroIds:   ['hero_043'],
    featuredLowerIds: ['hero_002', 'hero_007', 'hero_010', 'hero_021', 'hero_022', 'hero_016'],
    pityLimit:       80,
    bannerImg:       require('../../assets/heroes/hero_043.webp'),
    accentColor:     '#FF4500',
  },
  {
    id:              'event_shadow_descent',
    type:            'banner',
    name:            'Shadow Descent',
    subtitle:        'Limited Summoning Event',
    featuredHeroId:  'hero_008',
    rateUpHeroIds:   ['hero_008'],
    featuredLowerIds: ['hero_013', 'hero_014', 'hero_020', 'hero_034', 'hero_035', 'hero_046'],
    pityLimit:       80,
    bannerImg:       require('../../assets/heroes/hero_008.webp'),
    accentColor:     '#9B59B6',
  },
  {
    id:              'event_celestial_bloom',
    type:            'banner',
    name:            'Celestial Bloom',
    subtitle:        'Limited Summoning Event',
    featuredHeroId:  'hero_012',
    rateUpHeroIds:   ['hero_012'],
    featuredLowerIds: ['hero_009', 'hero_018', 'hero_027', 'hero_028', 'hero_039', 'hero_048'],
    pityLimit:       80,
    bannerImg:       require('../../assets/heroes/hero_012.webp'),
    accentColor:     '#FFD700',
  },
];

// Back-compat export (was an array of dated events; now the rotating pool).
export const ALL_EVENTS = BANNER_POOL;

// ── Rotation engine ───────────────────────────────────────────────────────────
const DAY_MS         = 86_400_000;
const ROTATION_DAYS  = 14;                    // each banner period lasts two weeks
const CONCURRENT     = Math.min(2, BANNER_POOL.length); // banners live at once
const ANCHOR_MS      = Date.UTC(2026, 0, 5);  // rotation epoch (a Monday, in the past)

const ymd = (ms) => new Date(ms).toISOString().slice(0, 10);

// All dates are computed in UTC for consistency with getActiveEvents/secondsUntilEnd,
// which already key off toISOString()/Date parsing.
function periodIndex(nowMs) {
  return Math.floor((nowMs - ANCHOR_MS) / DAY_MS / ROTATION_DAYS);
}

// Returns the banners scheduled for a given rotation period, each stamped with the
// start/end dates of that period (endDate = last fully-active day).
function bannersForPeriod(period) {
  if (period < 0 || !BANNER_POOL.length) return [];
  const startMs = ANCHOR_MS + period * ROTATION_DAYS * DAY_MS;
  const startDate = ymd(startMs);
  const endDate   = ymd(startMs + (ROTATION_DAYS - 1) * DAY_MS);
  const out = [];
  for (let k = 0; k < CONCURRENT; k++) {
    const tmpl = BANNER_POOL[(period * CONCURRENT + k) % BANNER_POOL.length];
    out.push({ ...tmpl, startDate, endDate });
  }
  return out;
}

// Always returns the banners active right now (never empty while BANNER_POOL is non-empty).
export function getActiveEvents() {
  return bannersForPeriod(periodIndex(Date.now()));
}

// The banners that will go live next rotation — populates the UPCOMING tab.
export function getUpcomingEvents() {
  return bannersForPeriod(periodIndex(Date.now()) + 1);
}

// The banners from the previous rotation — populates the ENDED tab (recently past).
export function getEndedEvents() {
  return bannersForPeriod(periodIndex(Date.now()) - 1);
}

// Returns the nearest-ending active event, or null.
export function getFeaturedEvent() {
  const active = getActiveEvents();
  if (!active.length) return null;
  return active.sort((a, b) => (a.endDate < b.endDate ? -1 : 1))[0];
}

// Seconds remaining until endDate (midnight local/UTC after the last active day).
export function secondsUntilEnd(event) {
  const end = new Date(event.endDate);
  end.setUTCDate(end.getUTCDate() + 1); // include the end day fully
  return Math.max(0, Math.floor((end.getTime() - Date.now()) / 1000));
}
