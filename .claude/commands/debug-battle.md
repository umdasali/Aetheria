Simulate a battle between a player team and a specific enemy group to check if the team can win.

Usage:
  /debug-battle team:hero_001,hero_005,hero_016 vs stage:203
  /debug-battle team:hero_001,hero_005 vs floor:50
  /debug-battle hero_001,hero_005,hero_016 vs stage:203    ← shorthand, team: prefix optional

Arguments: $ARGUMENTS

Steps:

1. Parse $ARGUMENTS:
   - Extract player hero IDs (comma-separated after "team:")
   - Determine the enemy group:
     - "stage:NNN" → look up stageId NNN in src/data/story.js → get enemyGroupId → look up in src/data/enemies.js
     - "floor:N" → call getTowerEnemyGroup(N) from src/data/towerData.js logic
   - Read src/data/heroes.js for player hero stats
   - Read src/data/enemies.js for enemy group

2. Apply RANK_STAT_MULT to each hero's stats using their effectiveRank (assume base rank if not specified):
   C=1.00, B=1.15, A=1.32, S=1.55, SOVEREIGN=1.85

3. Simulate the battle turn-by-turn (player heroes go in team order, enemies use AI):
   - Energy starts at 0 for all units
   - Per turn: +20 energy passive
   - Normal attack: +15 energy, multiplier 1.0
   - Skill: use highest-damage skill that can be afforded; +10 energy
   - Trump Card at 100 energy: hits all enemies, resets energy to 0
   - Apply DOT ticks at start of each unit's turn (burn: hero.atk×0.08, poison: maxHp×0.05)
   - Apply regen for units with regen passive (maxHp×0.05 per turn)
   - Status effects: stun skips turn, shatter reduces DEF 25%, weaken reduces ATK 20%

4. Print a compact round log:
   Round N | ACTOR → SKILL (xMULT) vs TARGET → Xdmg [CRIT] [status] | HP remaining: team HP totals

5. After the battle ends (one side all at 0 HP or 30 rounds cap), print:
   - Result: WIN / LOSS / DRAW
   - Rounds taken
   - Remaining HP for the winning side (absolute and as %)
   - Which heroes were eliminated (if any)
   - Key observations: e.g., "Enemy boss reached rage phase at round 8", "Trump Card fired round 5"
   - Verdict: if LOSS, suggest which stats to improve or which hero abilities counter the enemy's effect

Do not modify any files. This is read-only simulation only.
