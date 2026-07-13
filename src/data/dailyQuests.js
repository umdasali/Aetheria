// ─── Daily Quest Definitions ──────────────────────────────────────────────────
// 5 quests refresh every day at midnight (local time).
// Progress is tracked by questId in gameStore.dailyQuests.progress.

export const QUEST_DEFS = [
  {
    id:     'win_battles',
    title:  'Battlefield Commander',
    desc:   'Win 3 battles (any mode)',
    icon:   'trophy-outline',
    target: 3,
    reward: { gems: 12, gold: 500 },
  },
  {
    id:     'use_trump',
    title:  'Trump Card Unleashed',
    // Reduced from 5 to 3 - more accessible for casual sessions
    desc:   'Use a Trump Card 3 times',
    icon:   'thunderstorm-outline',
    target: 3,
    reward: { gems: 18, gold: 0 },
  },
  {
    id:     'clear_stage',
    title:  'Story Conqueror',
    desc:   'Clear 1 Story stage',
    icon:   'book-outline',
    target: 1,
    reward: { gems: 12, gold: 1000 },
  },
  {
    id:     'hero_summon',
    title:  'The Calling',
    desc:   'Perform at least 1 summon',
    icon:   'sparkles-outline',
    target: 1,
    // Was 10 gems - summoning 1× costs 50 gems, so reward was a −40 net loss.
    // Now 22 gems + gold makes the spend feel worthwhile.
    reward: { gems: 22, gold: 500 },
  },
  {
    id:     'hero_level',
    title:  'Power Up!',
    desc:   'Level up any hero once',
    icon:   'arrow-up-circle-outline',
    target: 1,
    reward: { gems: 10, gold: 200 },
  },
];

// Total daily reward if all 5 are claimed: 74 gems + 2200 gold (was 50 gems)
export const TOTAL_DAILY_GEMS = QUEST_DEFS.reduce((s, q) => s + q.reward.gems, 0);
export const TOTAL_DAILY_GOLD = QUEST_DEFS.reduce((s, q) => s + q.reward.gold, 0);
