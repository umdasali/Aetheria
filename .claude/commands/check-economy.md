Audit the full game economy — income sources, spending sinks, and balance health.

Usage: /check-economy
Arguments: $ARGUMENTS (optional — if a heroId is given, focus on that hero's progression cost)

Read the following files to gather current values:
- src/data/dailyQuests.js — QUEST_DEFS rewards
- src/data/dailyRewards.js — DAILY_REWARDS cycle
- src/data/towerData.js — getTowerFloorReward formula
- src/data/story.js — stage reward totals
- src/store/gameStore.js — INITIAL_STATE (starting gems/gold), fuseHero costs, transcendHero costs, levelUpHero formula, convertExcessCopies rates

Then produce this report:

---

## Economy Audit

### Daily Gem Income
| Source | Amount | Notes |
|--------|--------|-------|
| Daily quests (all 5) | X gems | |
| 7-day login avg/day | X gems | divide 7-day total by 7 |
| **Total avg/day** | **X gems** | |

### Daily Gold Income
| Source | Amount | Notes |
|--------|--------|-------|
| Daily quests (all 5) | X gold | |
| 7-day login avg/day | X gold | |
| **Total avg/day** | **X gold** | |

### One-Time Gem Income (Story)
- Total if all 75 stages cleared: X gems (sum of all stage gem rewards)

### Tower Gem Milestones
Show gems earned at floors 10, 50, 100, 150, 200 (cumulative, boss-only gems)

### Hero Progression Costs
Show cost to take one hero through:
- L1 → L10: total gold
- L1 → L10 + all 4 transcendences (to L30): total gold
- C → S fusion (3 fusions, 9 copies total): total gold
- Full progression (L30 + S rank): total gold + copies required

### F2P Pull Rate
At daily average income, how many days to save for:
- 1 single pull (50 gems)
- 1 multi pull (450 gems)
- Pity (90 pulls = 4500 gems)

### Balance Flags
Flag any of these if found:
- A daily quest that costs more than it rewards (e.g. summon quest costs 50 gems, reward < 50)
- Level-up cost at any level that exceeds ~3 days of gold income
- Any fusion tier that takes more than 30 days of saving to afford
- Tower coins earned per floor vs shop prices (are coins accessible or gated?)

### Summary
One paragraph: is the economy player-friendly? What's the biggest bottleneck?

---

If $ARGUMENTS contains a heroId, add a section showing that specific hero's full progression roadmap:
current state → cost to next level → cost to max level → fusion path → transcendence path → total remaining cost.
