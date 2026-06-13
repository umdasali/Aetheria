// ─── Limited-Time Event Definitions ──────────────────────────────────────────
// type: 'banner' | 'login_bonus'
// startDate / endDate: 'YYYY-MM-DD' strings (compared against local date)
// For banner events:
//   featuredHeroId  — hero shown on the banner card
//   rateUpHeroIds   — S-rank heroes with boosted chance (50 % of all S pulls)
//   pityLimit       — override pity cap for this event (default 80)

// Standard banner featured pool — Genshin-style showcase
export const STANDARD_BANNER = {
  featuredSRankIds:  ['hero_024', 'hero_001', 'hero_003'],  // Dusk Vale, Kira Voltz, Nova Blaine
  featuredLowerIds:  ['hero_007', 'hero_009', 'hero_010', 'hero_015', 'hero_006', 'hero_011'],  // Zane Ember, Kane Light, Tara Wind, Vex Hollow, Sol Frost, Vera Grove
};

export const ALL_EVENTS = [
  {
    id:              'event_blazing_vanguard',
    type:            'banner',
    name:            'Blazing Vanguard',
    subtitle:        'Limited Summoning Event',
    startDate:       '2026-06-09',
    endDate:         '2026-06-30',
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
    startDate:       '2026-06-09',
    endDate:         '2026-06-30',
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
    startDate:       '2026-07-01',
    endDate:         '2026-07-21',
    featuredHeroId:  'hero_012',
    rateUpHeroIds:   ['hero_012'],
    featuredLowerIds: ['hero_009', 'hero_018', 'hero_027', 'hero_028', 'hero_039', 'hero_048'],
    pityLimit:       80,
    bannerImg:       require('../../assets/heroes/hero_012.webp'),
    accentColor:     '#FFD700',
  },
];

// Returns only events whose date window includes today (local date).
export function getActiveEvents() {
  const today = new Date().toISOString().slice(0, 10);
  return ALL_EVENTS.filter(e => e.startDate <= today && today <= e.endDate);
}

// Returns the nearest-ending active event, or null.
export function getFeaturedEvent() {
  const active = getActiveEvents();
  if (!active.length) return null;
  return active.sort((a, b) => (a.endDate < b.endDate ? -1 : 1))[0];
}

// Seconds remaining until endDate (midnight local).
export function secondsUntilEnd(event) {
  const end = new Date(event.endDate);
  end.setDate(end.getDate() + 1); // include the end day fully
  return Math.max(0, Math.floor((end - Date.now()) / 1000));
}
