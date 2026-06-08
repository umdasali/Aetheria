import { HEROES } from '../data/heroes';

const STAGE_XP = { 1: 200, 2: 350, 3: 600 };
const RANK_XP  = { C: 80, B: 200, A: 400, S: 800 };
const LEVEL_XP = 150; // per hero level above 1
const STREAK_XP = 80; // per daily streak day

// XP required to advance FROM level L to L+1
export function xpToNextLevel(level) {
  return 200 + level * 80;
}

// Total XP threshold to REACH a given level from level 1
function xpFloor(level) {
  let total = 0;
  for (let l = 1; l < level; l++) total += xpToNextLevel(l);
  return total;
}

// Resolve level/progress from a raw totalXP value (no store needed)
export function calcLevelFromXP(totalXP) {
  totalXP = Math.max(0, totalXP);
  let level = 1, consumed = 0;
  while (level < 99) {
    const needed = xpToNextLevel(level);
    if (consumed + needed > totalXP) break;
    consumed += needed;
    level++;
  }
  const currentXP   = totalXP - consumed;
  const nextLevelXP = level >= 99 ? xpToNextLevel(99) : xpToNextLevel(level);
  const progress    = level >= 99 ? 1 : currentXP / nextLevelXP;
  return { level, currentXP, nextLevelXP, totalXP, progress };
}

// Compute { level, currentXP, nextLevelXP, totalXP, progress }
// Accepts the relevant slices of the Zustand store.
export function calcPlayerLevel({ completedChapters = [], ownedHeroes = [], heroCollection = {}, dailyStreak = 0 }) {
  let totalXP = 0;

  // Stage completions — stageId format: chapterId*100 + part (e.g. 101, 203)
  for (const stageId of completedChapters) {
    const part = stageId % 10;
    totalXP += STAGE_XP[part] ?? 0;
  }

  // Hero collection
  for (const heroId of ownedHeroes) {
    const hero = HEROES.find(h => h.id === heroId);
    if (hero) totalXP += RANK_XP[hero.rank] ?? 0;
  }

  // Hero level-ups (each level above 1 earns LEVEL_XP)
  for (const heroId of Object.keys(heroCollection)) {
    const lvl = heroCollection[heroId]?.level ?? 1;
    if (lvl > 1) totalXP += (lvl - 1) * LEVEL_XP;
  }

  // Daily login streak
  totalXP += dailyStreak * STREAK_XP;

  // Resolve level from accumulated XP
  let level = 1;
  let consumed = 0;
  while (level < 99) {
    const needed = xpToNextLevel(level);
    if (consumed + needed > totalXP) break;
    consumed += needed;
    level++;
  }

  const currentXP   = totalXP - consumed;
  const nextLevelXP = level >= 99 ? xpToNextLevel(99) : xpToNextLevel(level);
  const progress    = level >= 99 ? 1 : currentXP / nextLevelXP;

  return { level, currentXP, nextLevelXP, totalXP, progress };
}
