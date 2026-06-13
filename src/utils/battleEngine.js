/**
 * EFFECT_MECHANICS maps every hero.effect string to a gameplay mechanic.
 *   Debuff mechanics → applied to enemies on-hit (proc chance varies).
 *   Passive mechanics → always-on traits read during damage calculation.
 */
// Rank stat hierarchy: SOVEREIGN > S > A > B > C
export const RANK_STAT_MULT = {
  C:         1.00,
  B:         1.15,
  A:         1.32,
  S:         1.55,
  SOVEREIGN: 1.85,
};

export const EFFECT_MECHANICS = {
  // ── Debuffs (applied to enemy on hit) ─────────────────────────────────────
  PARALYSIS:       'stun',
  ENTANGLEMENT:    'stun',
  BURN:            'burn',
  INCINERATE:      'burn',
  SCORCH:          'burn',
  SOVEREIGN_FLAME: 'burn',
  FLAMEDANCE:      'burn',
  FLAMEGUARD:      'burn',
  TOXIN:           'poison',
  CHILL:           'chill',
  GLACIATION:      'chill',
  PERMAFROST:      'chill',
  BLIZZARD:        'chill',
  ICEWALL:         'chill',
  SHATTER:         'shatter',
  VOID_CURSE:      'weaken',
  VOID_OMEN:       'weaken',
  VOID_PULSE:      'weaken',
  CORRUPTION:      'weaken',
  ABYSS:           'weaken',
  NULLIFY:         'weaken',
  // ── Passives (always-on for the hero) ─────────────────────────────────────
  SHADOW:          'evasion',
  PHANTOMSTRIKE:   'evasion',
  LIFEDRAIN:       'lifedrain',
  THORNSTRIKE:     'thornstrike',
  BLESSING:        'regen',
  SANCTIFY:        'regen',
  REJUVENATE:      'regen',
  RADIANCE:        'regen',
  ILLUMINATE:      'regen',
  BLOOM:           'regen',
  VOLTMEND:        'regen',
  FROSTMEND:       'regen',
  BARKSKIN:        'fortify',
  HEATSHIELD:      'fortify',
  DIVINE_SHIELD:   'fortify',
  SOVEREIGNTY:     'fortify',
  SMITE:           'smite',
  // ── Khemara — sand & moon flavor aliases ──────────────────────────────────
  MOONLIGHT:       'regen',
  LUNAR_GRACE:     'regen',
  SANDFLAY:        'shatter',
  DUSTSHROUD:      'evasion',
};

const DEBUFF_SET = new Set(['stun', 'burn', 'poison', 'chill', 'shatter', 'weaken']);

// ── Internal helpers ───────────────────────────────────────────────────────

const addOrRefreshEffect = (unit, effect) => {
  const effects = [...(unit.statusEffects || [])];
  const idx = effects.findIndex((fx) => fx.type === effect.type);
  if (idx >= 0) {
    // Refresh keeps the stronger of both: a weak hero's reapplication must not
    // overwrite a strong burn's tick value (and vice versa for duration).
    effects[idx] = {
      ...effects[idx],
      duration: Math.max(effects[idx].duration, effect.duration),
      value:    Math.max(effects[idx].value ?? 0, effect.value ?? 0),
    };
  } else {
    effects.push(effect);
  }
  return { ...unit, statusEffects: effects };
};

// Returns unit with ATK/DEF adjusted for shatter and weaken debuffs.
const effectiveUnit = (unit) => {
  let atk = unit.atk || 0;
  let def = unit.def || 0;
  for (const fx of (unit.statusEffects || [])) {
    if (fx.type === 'shatter') def = Math.floor(def * (1 - fx.value));
    if (fx.type === 'weaken')  atk = Math.floor(atk * (1 - fx.value));
  }
  return { ...unit, atk, def };
};

/**
 * calculateDamage
 * Returns { damage, isCrit, blocked, dodged }.
 * Accounts for evasion (dodge), fortify (damage reduction), smite (enhanced crits),
 * shatter (DEF down on defender), and weaken (ATK down on attacker).
 */
export const calculateDamage = (attacker, defender, multiplier) => {
  const defMechanic = EFFECT_MECHANICS[defender.effect];

  // Evasion checked before shield — a successful dodge preserves shield charges
  if (defMechanic === 'evasion' && Math.random() < 0.20) {
    return { damage: 0, isCrit: false, blocked: false, dodged: true };
  }

  if ((defender.shield || 0) > 0) {
    return { damage: 0, isCrit: false, blocked: true, dodged: false };
  }

  const eff        = effectiveUnit(attacker);
  const defEff     = effectiveUnit(defender);
  const base       = eff.atk * multiplier;
  const defFactor  = 1 + (defEff.def / (defEff.def + 500)) * 1.5;
  // Cap at 60%: the crit stat is multiplied by level/rank/ascension in
  // buildPlayers, so an uncapped crit/1000 hits 100% by mid-game.
  const critChance = Math.min(0.6, (eff.crit || 0) / 1000);
  const isCrit     = Math.random() < critChance;

  // Smite passive: 2.0× crit multiplier instead of 1.75×
  const critMult = EFFECT_MECHANICS[attacker.effect] === 'smite' ? 2.0 : 1.75;
  const variance = 0.9 + Math.random() * 0.2;
  let raw = Math.floor((base / defFactor) * (isCrit ? critMult : 1) * variance);

  // Fortify passive: defender takes 15% less damage
  if (defMechanic === 'fortify') raw = Math.floor(raw * 0.85);

  return { damage: Math.max(1, raw), isCrit, blocked: false, dodged: false };
};

/**
 * applyTrumpCard
 * Deals trump damage to all living enemies; parses heal% / shield / stun from effect string.
 */
export const applyTrumpCard = (hero, allies, enemies) => {
  const tc = hero.trumpCard;
  let updatedEnemies = enemies;
  let updatedAllies  = allies;

  if (tc.damage > 0) {
    updatedEnemies = enemies.map((e) => {
      if (e.currentHp <= 0) return e;
      const { damage, isCrit } = calculateDamage(hero, e, tc.damage);
      let updated = {
        ...e,
        currentHp:  Math.max(0, e.currentHp - damage),
        lastDamage: damage,
        lastCrit:   isCrit,
        damageKey:  (e.damageKey || 0) + 1,
      };
      // Trump Cards are skills — proc hero's on-hit debuff (50% chance) on each enemy hit
      if (damage > 0) updated = applyOnHitDebuff(hero, updated, true);
      return updated;
    });
  }

  // Prefix-anchored keyword match: `\bheal` matches "heal", "heals", "healing".
  // A full-word `\bheal\b` regex silently missed the plural verb forms every
  // trump effect string actually uses ("heals all allies 25% HP", "stuns all
  // enemies"), disabling the secondary effect of nearly every Trump Card
  // (verified: 0/53 trumps healed under \bheal\b vs 47/53 with prefix match).
  const eff = (tc.effect || '').toLowerCase();
  const hasKeyword = (word) => new RegExp(`\\b${word}`).test(eff);

  if (hasKeyword('heal') || hasKeyword('restore') || hasKeyword('recover')) {
    const m   = eff.match(/(\d+)\s*%/);
    const pct = m ? parseInt(m[1], 10) / 100 : 0.2;
    updatedAllies = updatedAllies.map((a) => {
      if (a.currentHp <= 0) return a;
      return { ...a, currentHp: Math.min(a.maxHp, a.currentHp + Math.floor(a.maxHp * pct)) };
    });
  }

  if (hasKeyword('shield') || hasKeyword('barrier')) {
    const m       = eff.match(/(\d+)\s*(?:hits?)/);
    const shields = m ? parseInt(m[1], 10) : 1;
    updatedAllies = updatedAllies.map((a) => {
      if (a.currentHp <= 0) return a;
      return { ...a, shield: (a.shield || 0) + shields };
    });
  }

  if (hasKeyword('stun') || hasKeyword('paralyze') || hasKeyword('paralyz')) {
    const m     = eff.match(/(\d+)\s*turn/);
    const turns = m ? parseInt(m[1], 10) : 1;
    updatedEnemies = updatedEnemies.map((e) => {
      if (e.currentHp <= 0) return e;
      // Non-stacking: refresh to the trump's turn count (1–2), don't add onto an
      // existing stun — additive stacking made stun-locks last far too long.
      return { ...e, stunned: Math.max(e.stunned || 0, turns) };
    });
  }

  return { allies: updatedAllies, enemies: updatedEnemies };
};

/**
 * applyHealSkill
 * Heals the lowest-HP-ratio living ally by caster.atk * 2.
 */
export const applyHealSkill = (caster, allies) => {
  const heal = Math.floor(caster.atk * 2);
  let lowestIdx = 0, lowestRatio = 1;
  allies.forEach((a, i) => {
    if (a.currentHp <= 0) return;
    const r = a.currentHp / a.maxHp;
    if (r < lowestRatio) { lowestRatio = r; lowestIdx = i; }
  });
  return allies.map((a, i) =>
    i === lowestIdx && a.currentHp > 0
      ? { ...a, currentHp: Math.min(a.maxHp, a.currentHp + heal) }
      : a
  );
};

/**
 * allDefeated – true when every unit in team has currentHp ≤ 0.
 */
export const allDefeated = (team) => team.every((u) => u.currentHp <= 0);

/**
 * applyOnHitDebuff
 * If hero.effect maps to a debuff mechanic, applies it to the target with a proc chance.
 *   isSkill true  → 50% proc chance
 *   isSkill false → 25% proc chance (basic attack)
 * Returns the (possibly updated) target unit.
 */
export const applyOnHitDebuff = (hero, target, isSkill) => {
  const mechanic = EFFECT_MECHANICS[hero.effect];
  if (!mechanic || !DEBUFF_SET.has(mechanic)) return target;
  if (target.currentHp <= 0) return target;
  if (Math.random() > (isSkill ? 0.50 : 0.25)) return target;

  switch (mechanic) {
    case 'stun':
      // Non-stacking: a proc guarantees the target skips its next turn, but never
      // accumulates. Procs used to add +1 each (50% per skill hit), which chain-locked
      // enemies for several turns — the "stun feels longer" problem.
      return { ...target, stunned: Math.max(target.stunned || 0, 1) };
    case 'burn':
      return addOrRefreshEffect(target, {
        type: 'burn', duration: 2,
        value: Math.floor((hero.atk || 0) * 0.08),
      });
    case 'poison':
      return addOrRefreshEffect(target, {
        type: 'poison', duration: 3,
        value: Math.floor((target.maxHp || 0) * 0.05),
      });
    case 'chill':
      return addOrRefreshEffect(target, { type: 'chill', duration: 2, value: 0.5 });
    case 'shatter':
      return addOrRefreshEffect(target, { type: 'shatter', duration: 2, value: 0.25 });
    case 'weaken':
      return addOrRefreshEffect(target, { type: 'weaken', duration: 2, value: 0.20 });
    default:
      return target;
  }
};

/**
 * processStatusEffects
 * Ticks DOTs (burn/poison) and regen passive for a unit at the start of its turn.
 * Returns { unit: updatedUnit, dotDamage, healAmount, messages }.
 */
export const processStatusEffects = (unit) => {
  let dotDamage  = 0;
  let healAmount = 0;
  const messages = [];
  const remaining = [];

  for (const fx of (unit.statusEffects || [])) {
    if (fx.duration <= 0) continue;
    const next = fx.duration - 1;
    if (fx.type === 'burn' || fx.type === 'poison') {
      dotDamage += fx.value;
      messages.push(`${unit.name} −${fx.value} ${fx.type}`);
    }
    // chill / shatter / weaken just expire silently; no tick damage
    if (next > 0) remaining.push({ ...fx, duration: next });
  }

  // Regen passive: heals 5% max HP each turn
  if (EFFECT_MECHANICS[unit.effect] === 'regen' && unit.currentHp > 0) {
    healAmount = Math.floor((unit.maxHp || 0) * 0.05);
    messages.push(`${unit.name} +${healAmount} regen`);
  }

  const newHp = Math.min(
    unit.maxHp || unit.currentHp,
    Math.max(0, unit.currentHp - dotDamage + healAmount),
  );

  return {
    unit:       { ...unit, currentHp: newHp, statusEffects: remaining },
    dotDamage,
    healAmount,
    messages,
  };
};

/**
 * getSmartAIAction
 * Priority order:
 *  1. One-shot the lowest-HP player with skill[1] if affordable and lethal
 *  2. 60 % chance to use a skill — only from the set the enemy can actually afford
 *     (skill[1] preferred at 45 % when both are affordable)
 *  3. Basic attack
 * Always targets the player with the lowest HP ratio.
 * actorEnergy and skillCosts are passed in so the function never proposes an
 * action the caller would have to silently downgrade.
 */
export const getSmartAIAction = (enemy, playerTeam, actorEnergy = 0, skillCosts = [30, 50]) => {
  const living = playerTeam
    .map((p, i) => ({ ...p, _i: i }))
    .filter((p) => p.currentHp > 0)
    .sort((a, b) => (a.currentHp / a.maxHp) - (b.currentHp / b.maxHp));

  if (!living.length) return null;

  // 20% chance to pick a random living hero instead of always targeting the weakest,
  // preventing degenerate strategies where one low-HP hero permanently absorbs all aggro.
  const primary = living.length > 1 && Math.random() < 0.20
    ? living[Math.floor(Math.random() * living.length)]
    : living[0];

  const canAfford = (idx) => actorEnergy >= (skillCosts[idx] ?? skillCosts[0]);

  // One-shot check — only if skill[1] is affordable and low-end estimate (−15% variance) still kills
  if (enemy.skills.length > 1 && canAfford(1)) {
    const est = Math.floor(
      enemy.atk * enemy.skills[1].damage / (1 + ((primary.def || 0) / ((primary.def || 0) + 500)) * 1.5)
    );
    if (Math.floor(est * 0.85) >= primary.currentHp) {
      return { action: 'skill', skillIdx: 1, targetIdx: primary._i };
    }
  }

  // 60 % chance to use a skill — restricted to what the enemy can afford
  if (Math.random() < 0.6) {
    const affordable = enemy.skills
      .map((_, idx) => idx)
      .filter(canAfford);

    if (affordable.length > 0) {
      // Prefer skill[1] at 45 % when both are available
      const skillIdx =
        affordable.length > 1 && Math.random() < 0.45 ? 1 : affordable[0];
      return { action: 'skill', skillIdx, targetIdx: primary._i };
    }
  }

  return { action: 'attack', skillIdx: -1, targetIdx: primary._i };
};
