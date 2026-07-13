import { ENEMY_GROUPS } from './enemies';

// ─── Tower constants ──────────────────────────────────────────────────────────
export const TOWER_MAX_FLOOR     = 300;
export const TOWER_BOSS_INTERVAL = 10;   // boss every 10 floors

// Square-root scaling: mult = 1 + sqrt(floor-1) * 0.30
// Floor 10 → ~1.9×  |  Floor 50 → ~3.1×  |  Floor 100 → ~4.0×  |  Floor 200 → ~5.2×  |  Floor 300 → ~6.2×
export const STAT_SCALE_PER_FLOOR = 0.30; // coefficient for sqrt formula (not linear %)

// ─── Milestone descriptions ───────────────────────────────────────────────────
// Every milestone is also a boss floor so badge styling, enemy group, and the
// progress bar all agree on what counts as a milestone.
export const FLOOR_MILESTONES = [
  { floor: 10,  label: '🗡️ Floor 10',   title: 'First Summit'         },
  { floor: 50,  label: '🔥 Floor 50',   title: 'Halfway Champion'     },
  { floor: 100, label: '👑 Floor 100',  title: 'Tower Sovereign'      },
  { floor: 150, label: '💫 Floor 150',  title: 'Celestial Ascendant'  },
  { floor: 200, label: '⭐ Floor 200',  title: 'Tower Master'         },
  { floor: 250, label: '🌌 Floor 250',  title: 'Void Ascendant'       },
  { floor: 300, label: '👑 Floor 300',  title: 'Eternal Sovereign'    },
];
const MILESTONE_FLOORS = new Set(FLOOR_MILESTONES.map(m => m.floor));

// ─── Floor type helpers ───────────────────────────────────────────────────────
export const isBossFloor      = (f) => f % TOWER_BOSS_INTERVAL === 0;
export const isMilestoneFloor = (f) => MILESTONE_FLOORS.has(f);

// Pre-split ENEMY_GROUPS into boss / regular pools once at module load
const _bossGroups    = ENEMY_GROUPS.filter(g => g.enemies.some(e => e.tier === 'boss'));
const _regularGroups = ENEMY_GROUPS.filter(g => !g.enemies.some(e => e.tier === 'boss'));

// ─── Enemy group generator ────────────────────────────────────────────────────
/**
 * Returns a scaled enemy group for the given tower floor.
 * Stats use square-root scaling: mult = 1 + sqrt(floor-1) * STAT_SCALE_PER_FLOOR.
 * This gives diminishing difficulty growth vs the old linear formula.
 */
export function getTowerEnemyGroup(floor) {
  const isBoss = isBossFloor(floor);
  const pool   = isBoss ? _bossGroups : _regularGroups;
  // Cycle through the pool so higher floors reuse enemies at greater power.
  // Boss floors only land every TOWER_BOSS_INTERVAL floors, so index by boss
  // number (not raw floor) - indexing by raw floor here would only ever hit
  // gcd(TOWER_BOSS_INTERVAL, pool.length) distinct residues, hiding most bosses.
  const base   = isBoss
    ? pool[Math.floor((floor - 1) / TOWER_BOSS_INTERVAL) % pool.length]
    : pool[(floor - 1) % pool.length];
  const mult   = 1 + Math.sqrt(Math.max(0, floor - 1)) * STAT_SCALE_PER_FLOOR;

  return {
    id:          `tower_${floor}`,
    name:        isBossFloor(floor)
      ? `Floor ${floor} - ${isMilestoneFloor(floor) ? '⚡ MILESTONE BOSS' : '💀 Boss'}`
      : `Floor ${floor}`,
    description: isMilestoneFloor(floor)
      ? 'A legendary guardian awakened by the tower\'s deepest power.'
      : isBoss
      ? 'A powerful creature standing watch over this floor.'
      : 'Tower sentinels grow stronger with each floor.',
    enemies: base.enemies.map(e => ({
      ...e,
      id:    `tower_${floor}_${e.id}`,
      hp:    Math.round(e.hp    * mult),
      maxHp: Math.round(e.hp    * mult),
      atk:   Math.round(e.atk   * mult),
      def:   Math.round(e.def   * mult),
    })),
  };
}

// ─── Reward calculator ────────────────────────────────────────────────────────
/**
 * Returns { gold, gems, coins } earned for clearing a floor.
 * Gold and coins scale on the SAME sqrt curve as enemy stats (STAT_SCALE_PER_FLOOR)
 * so reward growth tracks difficulty growth instead of outrunning it.
 * Gems are only awarded every 10 floors (boss floors) - untouched by the rescale
 * below since that pool is sized against quest/boss income, not the coin shop.
 */
export function getTowerFloorReward(floor) {
  const mult = 1 + Math.sqrt(Math.max(0, floor - 1)) * STAT_SCALE_PER_FLOOR;
  return {
    gold:  Math.round(100 * mult),
    gems:  isBossFloor(floor) ? 30 + Math.floor(floor / 10) * 5 : 0,
    // A full 1→300 climb now totals ~5,495 coins (was ~15,910) - back in line
    // with the tower shop's own "~2,000 gems/week via the coin shop" target.
    coins: Math.round(4 * mult) + (isBossFloor(floor) ? 5 : 0),
  };
}

// ─── Weekly reset helper ──────────────────────────────────────────────────────
/**
 * Returns the ISO-date-string of the current week's Monday.
 * Used to detect when to reset towerCurrentFloor.
 */
export function getCurrentWeekKey() {
  const now    = new Date();
  const day    = now.getDay();                        // 0=Sun … 6=Sat
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  monday.setHours(0, 0, 0, 0);
  // Build the key from LOCAL date components - toISOString() returns UTC which
  // can be a different calendar day in timezones far ahead of UTC (e.g. UTC+10).
  const y = monday.getFullYear();
  const m = String(monday.getMonth() + 1).padStart(2, '0');
  const d = String(monday.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ─── Difficulty label ─────────────────────────────────────────────────────────
export function getFloorDifficulty(floor) {
  if (floor >= 250) return { label: 'TRANSCENDENT', color: '#FFFFFF' };
  if (floor >= 200) return { label: 'MYTHIC',      color: '#FFD700' };
  if (floor >= 150) return { label: 'ASCENDANT',   color: '#38BDF8' };
  if (floor >= 100) return { label: 'LEGENDARY',   color: '#F72585' };
  if (floor >=  75) return { label: 'EPIC',        color: '#9B59B6' };
  if (floor >=  50) return { label: 'HARD',        color: '#E11D48' };
  if (floor >=  25) return { label: 'NORMAL',      color: '#0891B2' };
  return                    { label: 'EASY',       color: '#059669' };
}
