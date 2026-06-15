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
};

const DEBUFF_SET = new Set(['stun', 'burn', 'poison', 'chill', 'shatter', 'weaken']);

// ── Internal helpers ───────────────────────────────────────────────────────

const addOrRefreshEffect = (unit, effect) => {
  const effects = [...(unit.statusEffects || [])];
  const idx = effects.findIndex((fx) => fx.type === effect.type);
  if (idx >= 0) {
    effects[idx] = { ...effects[idx], duration: Math.max(effects[idx].duration, effect.duration) };
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
 * Enemies without a crit stat receive a 5% base crit chance (crit || 50).
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
  // Heroes have explicit crit (170-700). Enemies lack the stat → give them a 5% base crit.
  const critChance = (eff.crit || 50) / 1000;
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
      return {
        ...e,
        currentHp:  Math.max(0, e.currentHp - damage),
        lastDamage: damage,
        lastCrit:   isCrit,
        damageKey:  (e.damageKey || 0) + 1,
      };
    });
  }

  const eff = (tc.effect || '').toLowerCase();
  if (eff.includes('heal')) {
    const m   = eff.match(/(\d+)%/);
    const pct = m ? parseInt(m[1], 10) / 100 : 0.2;
    updatedAllies = updatedAllies.map((a) => {
      if (a.currentHp <= 0) return a;
      return { ...a, currentHp: Math.min(a.maxHp, a.currentHp + Math.floor(a.maxHp * pct)) };
    });
  }

  if (eff.includes('shield')) {
    const m       = eff.match(/(\d+)\s*(?:hits?)/);
    const shields = m ? parseInt(m[1], 10) : 1;
    updatedAllies = updatedAllies.map((a) => {
      if (a.currentHp <= 0) return a;
      return { ...a, shield: (a.shield || 0) + shields };
    });
  }

  if (eff.includes('stun')) {
    const m     = eff.match(/(\d+)\s*turn/);
    const turns = m ? parseInt(m[1], 10) : 1;
    updatedEnemies = updatedEnemies.map((e) => {
      if (e.currentHp <= 0) return e;
      // Cap stun at 2 turns (matches applyOnHitDebuff).
      return { ...e, stunned: Math.min(2, (e.stunned || 0) + turns) };
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
      // Cap stun at 2 turns so repeated procs can't lock an enemy indefinitely.
      return { ...target, stunned: Math.min(2, (target.stunned || 0) + 1) };
    case 'burn':
      return addOrRefreshEffect(target, {
        type: 'burn', duration: 3,
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
 *  1. Kill focus — if any player is at ≤25% HP, overwhelm them with best skill (85-95% chance)
 *  2. One-shot check — use skill[1] if its low-end estimate kills the primary target
 *  3. Energy urgency — at ≥80 energy always spend a skill (never waste a full bar)
 *  4. Boss burst-save — hoard energy toward skill[1] if still building up
 *  5. Tier-based skill chance (mob 60% → mini-boss 72% → boss 82%; rage: 92%)
 *  6. Basic attack
 *
 * Rage phase: boss at ≤45% HP or already enraged enters rage mode — skill chance
 * jumps to 92%, heavy-skill preference to 80%, and it always targets unshielded heroes.
 *
 * Target selection: mob → lowest HP ratio; mini-boss → 30% highest ATK; boss → 40%
 * highest ATK. Both elites prefer unshielded targets over shielded ones.
 *
 * actorEnergy and skillCosts are passed in so the function never silently downgrades.
 * enemyHpRatio is the actor's own current HP / maxHP for phase-shift logic.
 */
export const getSmartAIAction = (enemy, playerTeam, actorEnergy = 0, skillCosts = [30, 50], tier = 'mob', enemyHpRatio = 1.0) => {
  const livingAll = playerTeam
    .map((p, i) => ({ ...p, _i: i }))
    .filter((p) => p.currentHp > 0);

  if (!livingAll.length) return null;

  const canAfford = (idx) => actorEnergy >= (skillCosts[idx] ?? skillCosts[0]);

  // Sort by HP ratio ascending (lowest first)
  const byHpRatio = [...livingAll].sort((a, b) => (a.currentHp / a.maxHp) - (b.currentHp / b.maxHp));

  // Boss rage: activated at ≤45% own HP or if already enraged flag is set
  const isRaging = tier === 'boss' && (enemy.enraged || enemyHpRatio <= 0.45);
  // Mini-boss second phase: ≤50% own HP
  const minibossPhase2 = tier === 'mini-boss' && enemyHpRatio <= 0.50;

  // ── 1. Kill focus ────────────────────────────────────────────────────────────
  // Any player at or below 25% HP is a "finish them" target — elite units strongly prioritise.
  const dyingPlayers = byHpRatio.filter(p => (p.currentHp / p.maxHp) <= 0.25);
  if (dyingPlayers.length > 0 && (tier === 'boss' || tier === 'mini-boss')) {
    const killTarget = dyingPlayers[0];
    const killChance = isRaging ? 0.95 : tier === 'boss' ? 0.88 : 0.78;
    if (Math.random() < killChance) {
      const affordable = enemy.skills.map((_, i) => i).filter(canAfford);
      if (affordable.length > 0) {
        const best = affordable.length > 1 ? 1 : affordable[0];
        return { action: 'skill', skillIdx: best, targetIdx: killTarget._i };
      }
    }
  }

  // ── Target selection ─────────────────────────────────────────────────────────
  // Prefer unshielded heroes over shielded ones when choosing primary target
  const unshielded = livingAll.filter(p => !(p.shield > 0));
  const candidatePool = unshielded.length > 0 ? unshielded : livingAll;
  const byHpRatioCandidates = [...candidatePool].sort((a, b) => (a.currentHp / a.maxHp) - (b.currentHp / b.maxHp));

  let primary;
  if (tier === 'boss') {
    // Rage mode: always target the highest-ATK player (eliminate the biggest threat)
    if (isRaging && livingAll.length > 1) {
      primary = candidatePool.reduce((best, p) => ((p.atk || 0) > (best.atk || 0) ? p : best), candidatePool[0]);
    } else if (livingAll.length > 1 && Math.random() < 0.40) {
      // 40% chance to focus highest-ATK player
      primary = candidatePool.reduce((best, p) => ((p.atk || 0) > (best.atk || 0) ? p : best), candidatePool[0]);
    } else {
      primary = byHpRatioCandidates[0];
    }
  } else if (tier === 'mini-boss') {
    // Phase 2: target highest-ATK 50% of the time
    const atkChance = minibossPhase2 ? 0.50 : 0.30;
    if (livingAll.length > 1 && Math.random() < atkChance) {
      primary = candidatePool.reduce((best, p) => ((p.atk || 0) > (best.atk || 0) ? p : best), candidatePool[0]);
    } else {
      primary = byHpRatioCandidates[0];
    }
  } else {
    // Mob: always lowest HP ratio
    primary = byHpRatioCandidates[0];
  }

  // ── 2. One-shot check ────────────────────────────────────────────────────────
  if (enemy.skills.length > 1 && canAfford(1)) {
    const est = Math.floor(
      enemy.atk * enemy.skills[1].damage / (1 + ((primary.def || 0) / ((primary.def || 0) + 500)) * 1.5)
    );
    if (Math.floor(est * 0.85) >= primary.currentHp) {
      return { action: 'skill', skillIdx: 1, targetIdx: primary._i };
    }
  }

  // ── 3. Energy urgency — full bar, always spend ───────────────────────────────
  if (actorEnergy >= 80) {
    const affordable = enemy.skills.map((_, i) => i).filter(canAfford);
    if (affordable.length > 0) {
      const urgentPref = isRaging ? 0.85 : tier === 'boss' ? 0.70 : 0.60;
      const skillIdx = affordable.length > 1 && Math.random() < urgentPref ? 1 : affordable[0];
      return { action: 'skill', skillIdx, targetIdx: primary._i };
    }
  }

  // ── 4. Boss burst-save ───────────────────────────────────────────────────────
  // Skip skill and basic-attack to hoard energy toward skill[1] — but not while raging.
  if (!isRaging && tier === 'boss' && enemy.skills.length > 1 && !canAfford(1) && canAfford(0)) {
    if (actorEnergy >= (skillCosts[0] ?? 30) * 1.5) {
      return { action: 'attack', skillIdx: -1, targetIdx: primary._i };
    }
  }

  // ── 5. Tier-based skill use ──────────────────────────────────────────────────
  let skillChance, skill1Pref;
  if (isRaging) {
    skillChance = 0.92; skill1Pref = 0.80;
  } else if (tier === 'boss') {
    skillChance = 0.82; skill1Pref = 0.65;
  } else if (minibossPhase2) {
    skillChance = 0.78; skill1Pref = 0.62;
  } else if (tier === 'mini-boss') {
    skillChance = 0.72; skill1Pref = 0.55;
  } else {
    skillChance = 0.60; skill1Pref = 0.45;
  }

  if (Math.random() < skillChance) {
    const affordable = enemy.skills.map((_, idx) => idx).filter(canAfford);
    if (affordable.length > 0) {
      const skillIdx = affordable.length > 1 && Math.random() < skill1Pref ? 1 : affordable[0];
      return { action: 'skill', skillIdx, targetIdx: primary._i };
    }
  }

  return { action: 'attack', skillIdx: -1, targetIdx: primary._i };
};
