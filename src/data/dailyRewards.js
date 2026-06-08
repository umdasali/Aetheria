// 7-day rotating reward cycle. Cycles restart after day 7.
export const DAILY_REWARDS = [
  { day: 1, gems: 0,   gold: 200,  type: 'gold'  },
  { day: 2, gems: 100, gold: 0,    type: 'gems'  },
  { day: 3, gems: 0,   gold: 500,  type: 'gold'  },
  { day: 4, gems: 100, gold: 0,    type: 'gems'  },
  { day: 5, gems: 0,   gold: 1000, type: 'gold'  },
  { day: 6, gems: 100, gold: 0,    type: 'gems'  },
  { day: 7, gems: 200, gold: 2000, type: 'both', isBonus: true },
];
