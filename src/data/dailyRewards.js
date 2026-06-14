// 7-day rotating reward cycle. Cycles restart after day 7.
// Gold bumps help F2P players level heroes without feeling gated on basic progression.
export const DAILY_REWARDS = [
  { day: 1, gems: 0,   gold: 400,  type: 'gold'  },
  { day: 2, gems: 30,  gold: 0,    type: 'gems'  },
  { day: 3, gems: 0,   gold: 800,  type: 'gold'  },
  { day: 4, gems: 50,  gold: 0,    type: 'gems'  },
  { day: 5, gems: 0,   gold: 1500, type: 'gold'  },
  { day: 6, gems: 60,  gold: 0,    type: 'gems'  },
  { day: 7, gems: 120, gold: 3000, type: 'both', isBonus: true },
];
