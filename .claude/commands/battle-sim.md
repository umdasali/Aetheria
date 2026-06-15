Simulate a turn-by-turn battle between two heroes using the Aetheria battle engine rules.

Usage:
  /battle-sim hero_001 vs hero_042
  /battle-sim hero_001 hero_042
  /battle-sim Kira Voltz vs Theron Vex   ← partial name match also accepted

Arguments: $ARGUMENTS

Steps:
1. Parse $ARGUMENTS to identify two hero identifiers (IDs or partial names).
   Read src/data/heroes.js to resolve each to a full hero object.

2. Set up combatants. Each starts with:
   - hp = hero.hp (current and max)
   - atk, def, crit from hero stats
   - energy = 0
   - statusEffects = []

3. Simulate rounds (hero 1 goes first). Each turn:

   a. Process status effects (DOT damage, heal ticks, decrement durations):
      - burn: damage += Math.floor(attacker.atk * 0.08)
      - poison: damage += Math.floor(unit.hp * 0.05)
      - regen: heal += Math.floor(unit.maxHp * 0.05), capped at maxHp
      - stun: skip this unit's turn

   b. Choose action:
      - If energy >= skill.cost * 20 for skill[1] and skill[1].damage > 0: use skill[1]
      - Else if energy >= skill.cost * 20 for skill[0] and skill[0].damage > 0: use skill[0]
      - Else: basic attack (multiplier 1.0, energy +15)
      - Using a skill gives +10 energy; each turn +20 energy passively

   c. Calculate damage:
      base      = attacker.atk * skillMultiplier
      defFactor = 1 + (defender.def / (defender.def + 500)) * 1.5
      isCrit    = Math.random() < (attacker.crit / 1000)
      critMult  = 1.75 (2.0 if attacker has SMITE effect)
      variance  = 0.9 + Math.random() * 0.2
      damage    = Math.floor((base / defFactor) * (isCrit ? critMult : 1) * variance)

   d. Apply on-hit status effect at 50% proc chance.

   e. If energy >= 100: use Trump Card instead (all enemies, reset energy to 0).

4. Print each round as one line:
   Round N │ ATTACKER uses SKILL_NAME → X dmg [CRIT] [status applied] │ DEFENDER: HP/maxHP

5. Stop when either hero reaches 0 HP. Declare winner with remaining HP and total rounds.

Cap simulation at 50 rounds to prevent infinite loops — declare a draw if nobody dies.
