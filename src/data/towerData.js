import { ENEMY_GROUPS } from './enemies';

// ─── Tower constants ──────────────────────────────────────────────────────────
export const TOWER_MAX_FLOOR     = 200;
export const TOWER_BOSS_INTERVAL = 10;   // boss every 10 floors

// Square-root scaling: mult = 1 + sqrt(floor-1) * 0.30
// Floor 10 → ~1.9×  |  Floor 50 → ~3.1×  |  Floor 100 → ~4.0×  |  Floor 200 → ~5.2×
export const STAT_SCALE_PER_FLOOR = 0.30; // coefficient for sqrt formula (not linear %)

// ─── Floor type helpers ───────────────────────────────────────────────────────
export const isBossFloor      = (f) => f % TOWER_BOSS_INTERVAL === 0;
export const isMilestoneFloor = (f) => f % 50 === 0;

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
  // Cycle through the pool so higher floors reuse enemies at greater power
  const base   = pool[(floor - 1) % pool.length];
  const mult   = 1 + Math.sqrt(Math.max(0, floor - 1)) * STAT_SCALE_PER_FLOOR;

  return {
    id:          `tower_${floor}`,
    name:        isBossFloor(floor)
      ? `Floor ${floor} — ${isMilestoneFloor(floor) ? '⚡ MILESTONE BOSS' : '💀 Boss'}`
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
 * Gems are only awarded every 10 floors.
 * Tower coins scale with floor depth.
 */
export function getTowerFloorReward(floor) {
  return {
    gold:  200  + floor * 80,
    gems:  isBossFloor(floor) ? 30 + Math.floor(floor / 10) * 5 : 0,
    coins: 2    + Math.floor(floor / 4),
  };
}

// ─── Milestone descriptions ───────────────────────────────────────────────────
export const FLOOR_MILESTONES = [
  { floor: 10,  label: '🗡️ Floor 10',   reward: 'First Summit'         },
  { floor: 25,  label: '⚔️ Floor 25',   reward: 'Abyss Walker'         },
  { floor: 50,  label: '🔥 Floor 50',   reward: 'Halfway Champion'     },
  { floor: 75,  label: '🌀 Floor 75',   reward: 'Void Climber'         },
  { floor: 100, label: '👑 Floor 100',  reward: 'Tower Sovereign'      },
  { floor: 150, label: '💫 Floor 150',  reward: 'Celestial Ascendant'  },
  { floor: 200, label: '⭐ Floor 200',  reward: 'Tower Master'         },
];

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
  // Build the key from LOCAL date components — toISOString() returns UTC which
  // can be a different calendar day in timezones far ahead of UTC (e.g. UTC+10).
  const y = monday.getFullYear();
  const m = String(monday.getMonth() + 1).padStart(2, '0');
  const d = String(monday.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ─── Difficulty label ─────────────────────────────────────────────────────────
export function getFloorDifficulty(floor) {
  if (floor >= 150) return { label: 'MYTHIC',    color: '#FFD700' };
  if (floor >= 100) return { label: 'LEGENDARY', color: '#F72585' };
  if (floor >=  75) return { label: 'EPIC',      color: '#9B59B6' };
  if (floor >=  50) return { label: 'HARD',      color: '#E11D48' };
  if (floor >=  25) return { label: 'NORMAL',    color: '#0891B2' };
  return                    { label: 'EASY',     color: '#059669' };
}
