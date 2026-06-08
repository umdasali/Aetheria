import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Image, Modal, Alert, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import useGameStore from '../store/gameStore';
import AudioManager from '../utils/AudioManager';
import { HEROES, FACTIONS } from '../data/heroes';
import { ENEMY_GROUPS, ENEMY_IMAGES } from '../data/enemies';
import { ASCENSION_STAT_MULT } from '../data/ascensionItems';
import { C } from '../theme/colors';
import {
  calculateDamage, applyTrumpCard, applyHealSkill,
  allDefeated, getSmartAIAction,
  applyOnHitDebuff, processStatusEffects, EFFECT_MECHANICS,
  RANK_STAT_MULT,
} from '../utils/battleEngine';

const { width: W, height: SH } = Dimensions.get('window');
const MAX_ENERGY          = 100;
const ENERGY_PER_TURN     = 20;
const ENEMY_ENERGY_TURN   = 25;
const ENEMY_SKILL_COSTS   = [30, 50];
const DEFAULT_GROUP       = ENEMY_GROUPS[0];
const TURN_LIMIT          = 50;

// XP awarded per stage part on first clear (part = stageId % 10)
const STAGE_XP = { 1: 200, 2: 350, 3: 600 };
const AI_DELAY_MS = 750;

// ── Landscape layout ──────────────────────────────────────────────────────────
const SIDE_PAD = 8;
const CARD_GAP = 6;
const SIDE_W   = Math.floor(W / 2) - SIDE_PAD * 2;
const CARD_W   = Math.floor((SIDE_W - CARD_GAP * 2) / 3 * 0.80);
// Smaller cards to leave room for the action bar
const CARD_H   = Math.min(Math.max(60, Math.floor(SH * 0.36)), 200);
const IMG_H    = CARD_H;
const PILL_H   = Math.min(Math.max(44, Math.floor(SH * 0.11)), 58);

// ─── Unit factory ─────────────────────────────────────────────────────────────

const mkUnit = (raw) => ({
  ...raw,
  currentHp:     raw.hp,
  maxHp:         raw.hp,
  shield:        0,
  stunned:       0,
  energy:        0,
  lastDamage:    0,
  lastCrit:      false,
  damageKey:     0,
  statusEffects: [],
  enraged:       false,
});

// Status effect display config (colors use C tokens)
const STATUS_DISPLAY = {
  burn:    { label: 'BRN', color: C.WARNING },
  poison:  { label: 'PSN', color: C.SUCCESS },
  chill:   { label: 'CHI', color: C.CYAN    },
  shatter: { label: 'DEF-', color: C.DANGER  },
  weaken:  { label: 'ATK-', color: C.PRIMARY },
};

const mkAnims = () =>
  Array.from({ length: 3 }, () => ({
    shake: new Animated.Value(0),
    flash: new Animated.Value(0),
    scale: new Animated.Value(1),
  }));

// ─── BattleScreen ─────────────────────────────────────────────────────────────

export default function BattleScreen({ navigation, route }) {
  const {
    team, completeChapter, getHeroData, hasSeenBattleTutorial, seenBattleTutorial,
    completedChapters, practiceBonusClaimed, claimPracticeBonus, addGems, addGold,
    trackQuestProgress, completeTowerFloor,
  } = useGameStore();
  const [showTutorial, setShowTutorial] = useState(!hasSeenBattleTutorial);
  const [hydrated, setHydrated] = useState(() => useGameStore.persist.hasHydrated());

  useEffect(() => {
    if (hydrated) return;
    return useGameStore.persist.onFinishHydration(() => setHydrated(true));
  }, [hydrated]);

  const practiceMode   = route?.params?.practiceMode   || false;
  const fromStory      = route?.params?.fromStory      || false;
  const chapterEnemies = route?.params?.chapterEnemies || DEFAULT_GROUP;
  const chapterId      = route?.params?.chapterId      || null;
  const chapterRewards = route?.params?.chapterRewards || { gems: 0, heroId: null };
  const towerMode      = route?.params?.towerMode      || false;
  const towerFloor     = route?.params?.towerFloor     || 1;
  const towerRewards   = route?.params?.towerRewards   || { gold: 0, gems: 0, coins: 0 };

  const buildPlayers = useCallback(() =>
    team.map((id) => {
      const h = HEROES.find((x) => x.id === id);
      if (!h) return null;
      const heroData   = getHeroData(id);
      const level      = heroData.level     || 1;
      const ascension  = heroData.ascension || 0;
      const levelMult  = 1 + (level - 1) * 0.08;
      const ascMult    = ASCENSION_STAT_MULT[ascension] ?? 1;
      const rankKey    = h.sovereign ? 'SOVEREIGN' : (heroData.effectiveRank || h.rank);
      const rankMult   = RANK_STAT_MULT[rankKey] ?? 1.0;
      const mult       = levelMult * rankMult * ascMult;
      return mkUnit({
        ...h,
        hp:   Math.round(h.hp   * mult),
        atk:  Math.round(h.atk  * mult),
        def:  Math.round(h.def  * mult),
        crit: Math.round(h.crit * mult),
      });
    }).filter(Boolean),
  [team, getHeroData]);

  const buildEnemies = useCallback(() =>
    chapterEnemies.enemies.map(mkUnit),
  [chapterEnemies]);

  const [playerTeam,     setPlayerTeam]     = useState(buildPlayers);
  const [enemyTeam,      setEnemyTeam]      = useState(buildEnemies);
  const [energy,         setEnergy]         = useState(0);
  const [turnNumber,     setTurnNumber]     = useState(1);
  const [turnCount,      setTurnCount]      = useState(0);
  const [currentTurnIdx, setCurrentTurnIdx] = useState(0);
  const [isEnemyTurn,    setIsEnemyTurn]    = useState(false);
  const [statusMsg,      setStatusMsg]      = useState('Battle Start!');
  const [battleResult,   setBattleResult]   = useState(null);
  const [isAnimating,    setIsAnimating]    = useState(false);
  const [selectedEnemy,  setSelectedEnemy]  = useState(0);

  const aiRunning       = useRef(false);
  const resultTimerRef  = useRef(null);
  const playerAnims = useRef(mkAnims()).current;
  const enemyAnims  = useRef(mkAnims()).current;
  const resultAnim  = useRef(new Animated.Value(0)).current;

  // Battle BGM — start when screen gains focus, stop the moment it loses focus
  useFocusEffect(useCallback(() => {
    AudioManager.startBattleBGM();
    return () => AudioManager.stopBattleBGM();
  }, []));

  // Cancel pending victory navigation if the screen unmounts (e.g. quit during the 750ms delay)
  useEffect(() => () => { clearTimeout(resultTimerRef.current); }, []);

  // ── Animations ────────────────────────────────────────────────────────────

  const triggerHit = useCallback((anims, idx) => {
    const a = anims[Math.min(idx, 2)];
    if (!a) return;
    Animated.parallel([
      Animated.sequence([
        Animated.timing(a.shake, { toValue: 9,  duration: 50, useNativeDriver: true }),
        Animated.timing(a.shake, { toValue: -9, duration: 50, useNativeDriver: true }),
        Animated.timing(a.shake, { toValue: 4,  duration: 50, useNativeDriver: true }),
        Animated.timing(a.shake, { toValue: 0,  duration: 50, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(a.flash, { toValue: 0.85, duration: 70,  useNativeDriver: true }),
        Animated.timing(a.flash, { toValue: 0,    duration: 280, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const triggerAttack = useCallback((anims, idx) => {
    const a = anims[Math.min(idx, 2)];
    if (!a) return;
    Animated.sequence([
      Animated.timing(a.scale, { toValue: 1.09, duration: 100, useNativeDriver: true }),
      Animated.timing(a.scale, { toValue: 1.0,  duration: 150, useNativeDriver: true }),
    ]).start();
  }, []);

  const showResult = useCallback((r, meta = {}) => {
    setBattleResult(r);
    resultTimerRef.current = setTimeout(() => {
      navigation.replace('Victory', {
        battleResult: r,
        stageId:      chapterId,
        rewards:      chapterRewards,
        enemyGroup:   chapterEnemies,
        fromStory,
        practiceMode,
        ...meta,
      });
    }, 750);
  }, [navigation, chapterId, chapterRewards, chapterEnemies, fromStory, practiceMode]);

  const checkEnd = useCallback((players, enemies) => {
    if (allDefeated(enemies)) {
      const wasReplay = !!(chapterId && completedChapters.includes(chapterId));

      // ── Tower mode win ───────────────────────────────────────────────────────
      if (towerMode) {
        const { ascensionDrop } = completeTowerFloor(towerFloor, towerRewards);
        trackQuestProgress('win_battles');
        showResult('win', { wasReplay: false, xpGained: 0, towerMode: true, towerFloor, towerRewards, towerAscensionDrop: ascensionDrop });
        return true;
      }

      // Practice mode one-time bonus
      let practiceGotBonus = false;
      if (practiceMode && !practiceBonusClaimed) {
        addGold(1000);
        addGems(100);
        claimPracticeBonus();
        practiceGotBonus = true;
      }

      // XP gained: 0 on replay, stage XP on first clear, +200 for practice bonus
      let xpGained = 0;
      if (!wasReplay && chapterId) xpGained += STAGE_XP[chapterId % 10] ?? 0;
      if (practiceGotBonus)        xpGained += 200;

      // Commit rewards BEFORE navigating so VictoryScreen reads updated state
      if (chapterId && !wasReplay) completeChapter(chapterId, chapterRewards.gems, chapterRewards.heroId);

      // Quest tracking
      trackQuestProgress('win_battles');
      if (fromStory) trackQuestProgress('clear_stage');

      showResult('win', { wasReplay, practiceGotBonus, xpGained });
      return true;
    }
    if (allDefeated(players)) { showResult('lose', { wasReplay: false, xpGained: 0 }); return true; }
    return false;
  }, [showResult, chapterId, chapterRewards, completeChapter, completedChapters,
      practiceMode, practiceBonusClaimed, claimPracticeBonus, addGems, addGold,
      towerMode, towerFloor, towerRewards, completeTowerFloor, trackQuestProgress, fromStory]);

  const firstLiving = (arr) => {
    for (let i = 0; i < arr.length; i++) if (arr[i].currentHp > 0) return i;
    return 0;
  };

  // Prefer the player's currently-chosen hero if still alive; fall back to firstLiving.
  const nextPlayerIdx = (arr, preferred) =>
    preferred < arr.length && arr[preferred].currentHp > 0 ? preferred : firstLiving(arr);

  // ── Enemy AI ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isEnemyTurn || battleResult) return;
    if (aiRunning.current) return;

    aiRunning.current = true;
    setIsAnimating(true);

    const timer = setTimeout(() => {
      // ── Tick enemy status effects (burn/poison DOTs, buff expiry) ──────────
      const dotMsgs = [];
      let effectsProcessed = false;
      let curEnemyTeam = enemyTeam.map((e) => {
        if (e.currentHp <= 0 || !(e.statusEffects || []).length) return e;
        effectsProcessed = true;
        const { unit, messages } = processStatusEffects(e);
        dotMsgs.push(...messages);
        return unit;
      });
      if (effectsProcessed) {
        setEnemyTeam(curEnemyTeam);
        if (dotMsgs.length > 0) setStatusMsg(dotMsgs[0]);
        // Tick player regen passives on this path to match the other two exit paths
        const regenPlayers = playerTeam.map((p) => {
          if (p.currentHp <= 0) return p;
          return processStatusEffects(p).unit;
        });
        setPlayerTeam(regenPlayers);
        if (checkEnd(regenPlayers, curEnemyTeam)) {
          aiRunning.current = false;
          setIsAnimating(false);
          return;
        }
        setCurrentTurnIdx(nextPlayerIdx(regenPlayers, currentTurnIdx));
      }

      const actorIdx = curEnemyTeam.findIndex((e) => e.currentHp > 0);
      const actor    = actorIdx >= 0 ? curEnemyTeam[actorIdx] : null;

      if (!actor) {
        aiRunning.current = false;
        setIsAnimating(false);
        setIsEnemyTurn(false);
        return;
      }

      // Chill debuff halves passive energy gain
      const chilled = (actor.statusEffects || []).some((fx) => fx.type === 'chill');
      const energyGain  = chilled ? Math.floor(ENEMY_ENERGY_TURN * 0.5) : ENEMY_ENERGY_TURN;
      const actorEnergy = Math.min(MAX_ENERGY, (actor.energy || 0) + energyGain);

      if ((actor.stunned || 0) > 0) {
        setEnemyTeam(curEnemyTeam.map((e, i) =>
          i === actorIdx ? { ...e, stunned: e.stunned - 1, energy: actorEnergy } : e
        ));
        // Apply player regen passives on stun-skip
        const npRegen = playerTeam.map((p) => {
          if (p.currentHp <= 0) return p;
          return processStatusEffects(p).unit;
        });
        setStatusMsg(`${actor.name} is stunned!`);
        setPlayerTeam(npRegen);
        setCurrentTurnIdx(nextPlayerIdx(npRegen, currentTurnIdx));
        setEnergy((p) => Math.min(MAX_ENERGY, p + ENERGY_PER_TURN));
        setTurnNumber((t) => t + 1);
        setIsEnemyTurn(false);
        aiRunning.current = false;
        setIsAnimating(false);
        return;
      }

      const aiAction = getSmartAIAction(actor, playerTeam, actorEnergy, ENEMY_SKILL_COSTS);
      if (!aiAction) {
        aiRunning.current = false;
        setIsAnimating(false);
        setIsEnemyTurn(false);
        return;
      }

      const { targetIdx } = aiAction;
      const target = playerTeam[targetIdx];
      if (!target) {
        aiRunning.current = false;
        setIsAnimating(false);
        setIsEnemyTurn(false);
        return;
      }

      let np  = playerTeam.map((p) => ({ ...p, lastDamage: 0 }));
      let msg = '';
      let energyAfter = actorEnergy;
      let lastDmg = 0;

      if (aiAction.action === 'attack') {
        const { damage, isCrit, blocked, dodged } = calculateDamage(actor, target, 1.0);
        if (blocked) {
          np[targetIdx] = { ...np[targetIdx], shield: Math.max(0, np[targetIdx].shield - 1) };
          msg = `${target.name}'s shield blocked!`;
        } else if (dodged) {
          msg = `${target.name} dodged ${actor.name}'s attack!`;
        } else {
          np[targetIdx] = {
            ...np[targetIdx],
            currentHp:  Math.max(0, np[targetIdx].currentHp - damage),
            lastDamage: damage, lastCrit: isCrit,
            damageKey:  (np[targetIdx].damageKey || 0) + 1,
          };
          lastDmg = damage;
          msg = `${actor.name} attacks${isCrit ? ' — CRITICAL!' : ''}`;
          setTimeout(() => triggerHit(playerAnims, targetIdx), 80);
          triggerAttack(enemyAnims, actorIdx);
        }
        energyAfter = Math.min(MAX_ENERGY, actorEnergy + 20);
      } else if (aiAction.action === 'skill') {
        const skill     = actor.skills[aiAction.skillIdx];
        const skillCost = ENEMY_SKILL_COSTS[aiAction.skillIdx] ?? ENEMY_SKILL_COSTS[0];
        if (skill) {
          const { damage, isCrit, blocked, dodged } = calculateDamage(actor, target, skill.damage);
          if (blocked) {
            np[targetIdx] = { ...np[targetIdx], shield: Math.max(0, np[targetIdx].shield - 1) };
            msg = `${target.name}'s shield blocked ${skill.name}!`;
          } else if (dodged) {
            msg = `${target.name} dodged ${skill.name}!`;
          } else {
            np[targetIdx] = {
              ...np[targetIdx],
              currentHp:  Math.max(0, np[targetIdx].currentHp - damage),
              lastDamage: damage, lastCrit: isCrit,
              damageKey:  (np[targetIdx].damageKey || 0) + 1,
            };
            lastDmg = damage;
            msg = `${actor.name}: ${skill.name}${isCrit ? ' — CRIT!' : ''}`;
            setTimeout(() => triggerHit(playerAnims, targetIdx), 80);
            triggerAttack(enemyAnims, actorIdx);
          }
          energyAfter = Math.max(0, actorEnergy - skillCost + 15);
        }
      }

      // Thornstrike reflect: if hit player has thornstrike passive, reflect 15% to attacker
      let updatedEnemyTeam = curEnemyTeam.map((e, i) =>
        i === actorIdx ? { ...e, energy: energyAfter } : e
      );
      if (lastDmg > 0 && EFFECT_MECHANICS[target.effect] === 'thornstrike') {
        const reflect = Math.floor(lastDmg * 0.15);
        updatedEnemyTeam = updatedEnemyTeam.map((e, i) =>
          i === actorIdx ? { ...e, currentHp: Math.max(0, e.currentHp - reflect) } : e
        );
        msg += ` (reflected ${reflect})`;
      }

      // Apply player regen passives at end of enemy turn
      np = np.map((p) => {
        if (p.currentHp <= 0) return p;
        return processStatusEffects(p).unit;
      });

      setStatusMsg(msg);
      setPlayerTeam(np);
      setEnemyTeam(updatedEnemyTeam);

      if (!checkEnd(np, updatedEnemyTeam)) {
        setCurrentTurnIdx(nextPlayerIdx(np, currentTurnIdx));
        setEnergy((p) => Math.min(MAX_ENERGY, p + ENERGY_PER_TURN));
        setTurnNumber((t) => t + 1);
        setIsEnemyTurn(false);
      }

      aiRunning.current = false;
      setIsAnimating(false);
    }, AI_DELAY_MS);

    return () => clearTimeout(timer);
  }, [isEnemyTurn, battleResult]);

  // ── Player action ─────────────────────────────────────────────────────────

  const executeAction = useCallback((actionType, skillIdx = 0) => {
    if (isEnemyTurn || isAnimating || battleResult) return;
    const hero = playerTeam[currentTurnIdx];
    if (!hero || hero.currentHp <= 0) return;

    let tgtIdx = selectedEnemy;
    if (tgtIdx >= enemyTeam.length || enemyTeam[tgtIdx]?.currentHp <= 0)
      tgtIdx = enemyTeam.findIndex((e) => e.currentHp > 0);
    if (tgtIdx === -1) return;

    let np        = playerTeam.map((p) => ({ ...p, lastDamage: 0 }));
    let ne        = enemyTeam.map((e) => ({ ...e, lastDamage: 0 }));
    let newEnergy = energy;
    let msg       = '';

    setIsAnimating(true);
    triggerAttack(playerAnims, currentTurnIdx);
    AudioManager.playAttackSFX();

    if (actionType === 'attack') {
      const { damage, isCrit, blocked, dodged } = calculateDamage(hero, ne[tgtIdx], 1.0);
      if (blocked) {
        ne[tgtIdx] = { ...ne[tgtIdx], shield: Math.max(0, ne[tgtIdx].shield - 1) };
        msg = `${ne[tgtIdx].name}'s shield blocked!`;
      } else if (dodged) {
        msg = `${hero.name} attacks — DODGED!`;
      } else {
        ne[tgtIdx] = {
          ...ne[tgtIdx],
          currentHp:  Math.max(0, ne[tgtIdx].currentHp - damage),
          lastDamage: damage, lastCrit: isCrit,
          damageKey:  (ne[tgtIdx].damageKey || 0) + 1,
        };
        ne[tgtIdx] = applyOnHitDebuff(hero, ne[tgtIdx], false);
        if (EFFECT_MECHANICS[hero.effect] === 'lifedrain') {
          const drain = Math.floor(damage * 0.15);
          np[currentTurnIdx] = { ...np[currentTurnIdx], currentHp: Math.min(np[currentTurnIdx].maxHp, np[currentTurnIdx].currentHp + drain) };
        }
        msg = `${hero.name} attacks${isCrit ? ' — CRITICAL HIT!' : '!'}`;
        setTimeout(() => triggerHit(enemyAnims, tgtIdx), 100);
      }
      newEnergy = Math.min(MAX_ENERGY, newEnergy + 15);

    } else if (actionType === 'skill') {
      const skill = hero.skills[skillIdx];
      if (!skill) { setIsAnimating(false); return; }
      const cost = skill.cost * 20;
      if (newEnergy < cost) {
        setStatusMsg('Not enough energy!');
        setIsAnimating(false);
        return;
      }
      newEnergy -= cost;

      if (skill.damage > 0) {
        const isAoe = /all|enemies|every/i.test(skill.description || '');
        if (isAoe) {
          ne = ne.map((e, i) => {
            if (e.currentHp <= 0) return e;
            const { damage, isCrit, blocked, dodged } = calculateDamage(hero, e, skill.damage);
            if (blocked) return { ...e, shield: Math.max(0, e.shield - 1) };
            if (dodged) return e;
            setTimeout(() => triggerHit(enemyAnims, i), 80 + i * 70);
            let updated = { ...e, currentHp: Math.max(0, e.currentHp - damage), lastDamage: damage, lastCrit: isCrit, damageKey: (e.damageKey || 0) + 1 };
            updated = applyOnHitDebuff(hero, updated, true);
            return updated;
          });
          if (EFFECT_MECHANICS[hero.effect] === 'lifedrain') {
            const totalDmg = ne.reduce((sum, e) => sum + (e.lastDamage || 0), 0);
            const drain = Math.floor(totalDmg * 0.15);
            if (drain > 0) np[currentTurnIdx] = { ...np[currentTurnIdx], currentHp: Math.min(np[currentTurnIdx].maxHp, np[currentTurnIdx].currentHp + drain) };
          }
          msg = `${hero.name}: ${skill.name} — All enemies!`;
        } else {
          const { damage, isCrit, blocked, dodged } = calculateDamage(hero, ne[tgtIdx], skill.damage);
          if (blocked) {
            ne[tgtIdx] = { ...ne[tgtIdx], shield: Math.max(0, ne[tgtIdx].shield - 1) };
            msg = `Shield absorbed ${skill.name}!`;
          } else if (dodged) {
            msg = `${hero.name}: ${skill.name} — DODGED!`;
          } else {
            ne[tgtIdx] = { ...ne[tgtIdx], currentHp: Math.max(0, ne[tgtIdx].currentHp - damage), lastDamage: damage, lastCrit: isCrit, damageKey: (ne[tgtIdx].damageKey || 0) + 1 };
            ne[tgtIdx] = applyOnHitDebuff(hero, ne[tgtIdx], true);
            if (EFFECT_MECHANICS[hero.effect] === 'lifedrain') {
              const drain = Math.floor(damage * 0.15);
              np[currentTurnIdx] = { ...np[currentTurnIdx], currentHp: Math.min(np[currentTurnIdx].maxHp, np[currentTurnIdx].currentHp + drain) };
            }
            msg = `${hero.name}: ${skill.name}${isCrit ? ' — CRIT!' : ''}`;
            setTimeout(() => triggerHit(enemyAnims, tgtIdx), 100);
          }
        }
      } else {
        const desc = (skill.description || '').toLowerCase();
        if (/shield|absorb|barrier|deflect/.test(desc)) {
          np = np.map((p, i) =>
            i === currentTurnIdx ? { ...p, shield: (p.shield || 0) + 1 } : p
          );
          msg = `${hero.name}: ${skill.name} — Shielded!`;
        } else {
          np  = applyHealSkill(hero, np);
          msg = `${hero.name}: ${skill.name} — Healed!`;
        }
      }
      newEnergy = Math.min(MAX_ENERGY, newEnergy + 10);

    } else if (actionType === 'trump') {
      if (newEnergy < MAX_ENERGY) { setStatusMsg('Need 100 energy!'); setIsAnimating(false); return; }
      const res = applyTrumpCard(hero, np, ne);
      np = res.allies;
      ne = res.enemies;
      // Fire hit animations immediately — useNativeDriver means they run on the
      // native thread, so no JS-thread stagger is needed and fewer timers = less lag.
      ne.forEach((e, i) => { if ((e.lastDamage || 0) > 0) triggerHit(enemyAnims, i); });
      msg = `${hero.name}: ${hero.trumpCard.name}!`;
      newEnergy = 0;
      trackQuestProgress('use_trump');
    }

    // ── Boss enrage: first time a boss drops to/below 50% HP ──────────────────
    const enrageMessages = [];
    ne = ne.map((e) => {
      if (e.tier === 'boss' && !e.enraged && e.currentHp > 0 && (e.currentHp / e.maxHp) <= 0.50) {
        enrageMessages.push(`⚡ ${e.name} is ENRAGED! Attack power surges!`);
        return { ...e, atk: Math.floor(e.atk * 1.30), enraged: true };
      }
      return e;
    });
    if (enrageMessages.length > 0) msg = enrageMessages[0];

    // ── Turn limit ──────────────────────────────────────────────────────────────
    const newTurnCount = turnCount + 1;

    setStatusMsg(msg);
    setEnergy(newEnergy);
    setEnemyTeam(ne);
    setPlayerTeam(np);
    setTurnCount(newTurnCount);

    setTimeout(() => {
      if (newTurnCount >= TURN_LIMIT) {
        setStatusMsg('⏰ Turn limit reached — enemies endure...');
        showResult('lose', { wasReplay: false, xpGained: 0 });
      } else if (!checkEnd(np, ne)) {
        setIsEnemyTurn(true);
      }
      setIsAnimating(false);
    }, 500);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEnemyTurn, isAnimating, battleResult, playerTeam, enemyTeam,
      energy, currentTurnIdx, selectedEnemy, turnCount,
      checkEnd, triggerHit, triggerAttack, trackQuestProgress, showResult]);

  const retryBattle = () => {
    setBattleResult(null);
    resultAnim.setValue(0);
    aiRunning.current = false;
    setPlayerTeam(buildPlayers());
    setEnemyTeam(buildEnemies());
    setEnergy(0);
    setTurnNumber(1);
    setTurnCount(0);
    setCurrentTurnIdx(0);
    setIsEnemyTurn(false);
    setIsAnimating(false);
    setStatusMsg('Battle Start!');
    setSelectedEnemy(0);
    AudioManager.startBattleBGM();
  };

  // ── Rehydration guard — brief spinner while AsyncStorage loads ───────────

  if (!hydrated) {
    return (
      <LinearGradient colors={C.GRAD_BG} style={[S.root, S.center]}>
        <Ionicons name="sync" size={32} color={C.PRIMARY_LIGHT} />
      </LinearGradient>
    );
  }

  // ── No-team guard ─────────────────────────────────────────────────────────

  if (!playerTeam.length) {
    return (
      <LinearGradient colors={C.GRAD_BG} style={[S.root, S.center]}>
        <Ionicons name="warning" size={44} color={C.GOLD} />
        <Text style={S.warnTitle}>No Team Selected!</Text>
        <Text style={S.warnSub}>Add heroes to your team before battling.</Text>
        <TouchableOpacity style={S.goBackBtn} onPress={() => navigation.goBack()}>
          <Text style={S.goBackText}>Go Back</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  const activeHero  = playerTeam[currentTurnIdx];
  const skill0      = activeHero?.skills?.[0];
  const skill1      = activeHero?.skills?.[1];
  const trumpName   = activeHero?.trumpCard?.name || 'Ultimate';
  const ultiReady   = energy >= MAX_ENERGY;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={S.root}>
      <LinearGradient colors={C.GRAD_BG} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={S.safe} edges={['top', 'bottom', 'left', 'right']}>

        {/* ══ HEADER ══ */}
        <View style={S.header}>
          <TouchableOpacity
            style={S.quitBtn}
            onPress={() =>
              Alert.alert(
                'Quit Battle?',
                'Your progress in this battle will be lost.',
                [
                  { text: 'Stay',  style: 'cancel' },
                  { text: 'Quit',  style: 'destructive', onPress: () => navigation.goBack() },
                ]
              )
            }
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={C.GRAD_HEADER}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={S.quitBtnInner}
            >
              <Text style={S.quitText}>Quit</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={S.headerMid}>
            <Text style={S.headerTitle} numberOfLines={1}>
              {practiceMode ? 'Practice Battle' : chapterEnemies.name}
            </Text>
          </View>

          <Text style={S.turnLabel}>Turn {turnNumber}  ·  <Text style={S.turnCountLabel}>{turnCount}/{TURN_LIMIT}</Text></Text>

          <View style={S.energyWrap}>
            <Text style={S.energyLbl}>⚡ {energy}/{MAX_ENERGY}</Text>
            <View style={S.energyBg}>
              <LinearGradient
                colors={energy >= MAX_ENERGY ? C.GRAD_GOLD : [C.PRIMARY_DARK, C.PRIMARY]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={[S.energyFill, { width: `${(energy / MAX_ENERGY) * 100}%` }]}
              />
            </View>
          </View>

          <View style={[S.turnPill, {
            borderColor:     isEnemyTurn ? C.DANGER  : C.SUCCESS,
            backgroundColor: isEnemyTurn ? C.DANGER + '1A' : C.SUCCESS + '1A',
          }]}>
            <View style={[S.turnDot, { backgroundColor: isEnemyTurn ? C.DANGER : C.SUCCESS }]} />
            <Text style={[S.turnText, { color: isEnemyTurn ? C.DANGER : C.SUCCESS }]}>
              {isEnemyTurn ? 'Enemy' : 'Your'} Turn
            </Text>
          </View>
        </View>

        {/* ══ ARENA ══ */}
        <View style={S.arena}>

          {/* — Enemy side — */}
          <View style={S.teamSide}>
            <Text style={[S.teamLabel, { color: C.SECONDARY }]}>ENEMY TEAM</Text>
            <View style={S.cardRow}>
              {enemyTeam.map((e, i) => (
                <BattleCard
                  key={`e${i}`}
                  unit={e}
                  side="enemy"
                  isSelected={selectedEnemy === i && e.currentHp > 0}
                  shakeAnim={enemyAnims[i]?.shake}
                  flashAnim={enemyAnims[i]?.flash}
                  scaleAnim={enemyAnims[i]?.scale}
                  onPress={e.currentHp > 0 ? () => setSelectedEnemy(i) : undefined}
                  accessibilityLabel={e.currentHp > 0 ? `Target ${e.name}` : undefined}
                  accessibilityRole="button"
                />
              ))}
            </View>
          </View>

          {/* — Divider — */}
          <View style={S.divider} />

          {/* — Player side — */}
          <View style={S.teamSide}>
            <Text style={[S.teamLabel, { color: C.PRIMARY }]}>YOUR TEAM</Text>
            <View style={S.cardRow}>
              {playerTeam.map((h, i) => (
                <BattleCard
                  key={`p${i}`}
                  unit={h}
                  side="player"
                  isActive={i === currentTurnIdx && !isEnemyTurn && h.currentHp > 0}
                  factionColor={FACTIONS[h.faction]?.color}
                  shakeAnim={playerAnims[i]?.shake}
                  flashAnim={playerAnims[i]?.flash}
                  scaleAnim={playerAnims[i]?.scale}
                  // tap a living non-active hero to switch who attacks this turn
                  canSwitch={!isEnemyTurn && !isAnimating && h.currentHp > 0 && i !== currentTurnIdx}
                  onPress={
                    !isEnemyTurn && !isAnimating && h.currentHp > 0 && i !== currentTurnIdx
                      ? () => setCurrentTurnIdx(i)
                      : undefined
                  }
                  accessibilityLabel={
                    !isEnemyTurn && !isAnimating && h.currentHp > 0 && i !== currentTurnIdx
                      ? `Switch to ${h.name}`
                      : undefined
                  }
                  accessibilityRole="button"
                />
              ))}
            </View>
          </View>

        </View>

        {/* ══ BOTTOM: STATUS + ACTIONS (transparent) ══ */}
        <View style={S.bottomArea}>
          <Text style={S.statusMsg} numberOfLines={1}>{statusMsg}</Text>

          {!battleResult && (
            <View style={S.actionBar}>
              {isEnemyTurn ? (
                <Text style={S.enemyThinking}>Enemy is thinking…</Text>
              ) : activeHero && activeHero.currentHp > 0 ? (
                <>
                  {/* Active hero indicator */}
                  <View style={S.heroTag}>
                    <Text style={S.heroTagBadge}>ACTING</Text>
                    <Text style={S.heroTagName} numberOfLines={1}>{activeHero.name}</Text>
                    <Text style={S.heroTagHint} numberOfLines={1}>
                      vs. {enemyTeam[selectedEnemy]?.currentHp > 0 ? enemyTeam[selectedEnemy].name : (enemyTeam.find(e => e.currentHp > 0)?.name ?? '?')}
                    </Text>
                  </View>

                  {/* Action pill buttons */}
                  <View style={S.pillRow}>
                    <PillBtn
                      label="Normal Attack"
                      sub={`ATK ${activeHero.atk}  ·  +15⚡`}
                      colors={[C.PRIMARY_DARK, C.PRIMARY]}
                      onPress={() => executeAction('attack')}
                      disabled={isAnimating}
                      accessibilityLabel="Normal attack"
                      accessibilityRole="button"
                    />

                    {skill0 ? (
                      <PillBtn
                        label={`${skill0.damage > 0 ? '⚔ ' : '✦ '}${skill0.name}`}
                        sub={`S1  ·  ${skill0.cost * 20}⚡`}
                        colors={energy >= skill0.cost * 20
                          ? [C.CYAN, C.PRIMARY_DARK]
                          : [C.TEXT_DISABLED, C.TEXT_MUTED]}
                        onPress={() => executeAction('skill', 0)}
                        disabled={isAnimating || energy < skill0.cost * 20}
                        dimmed={energy < skill0.cost * 20}
                        accessibilityLabel={`Use ${skill0.name}`}
                        accessibilityRole="button"
                      />
                    ) : (
                      <PillBtn
                        label="No Skill"
                        sub="—"
                        colors={[C.TEXT_DISABLED, C.TEXT_MUTED]}
                        onPress={() => {}}
                        disabled
                        dimmed
                      />
                    )}

                    {skill1 ? (
                      <PillBtn
                        label={`${skill1.damage > 0 ? '⚔ ' : '✦ '}${skill1.name}`}
                        sub={`S2  ·  ${skill1.cost * 20}⚡`}
                        colors={energy >= skill1.cost * 20
                          ? [C.SECONDARY, C.PRIMARY_DARK]
                          : [C.TEXT_DISABLED, C.TEXT_MUTED]}
                        onPress={() => executeAction('skill', 1)}
                        disabled={isAnimating || energy < skill1.cost * 20}
                        dimmed={energy < skill1.cost * 20}
                        accessibilityLabel={`Use ${skill1.name}`}
                        accessibilityRole="button"
                      />
                    ) : null}

                    <PillBtn
                      label={trumpName}
                      sub={ultiReady ? '⚡ READY!' : `Trump  ·  100⚡`}
                      colors={ultiReady ? C.GRAD_GOLD : [C.TEXT_DISABLED, C.TEXT_MUTED]}
                      onPress={() => executeAction('trump')}
                      disabled={isAnimating || !ultiReady}
                      dimmed={!ultiReady}
                      glow={ultiReady}
                      accessibilityLabel="Use Trump Card"
                      accessibilityRole="button"
                    />
                  </View>
                </>
              ) : null}
            </View>
          )}
        </View>

        {/* ══ ENERGY TUTORIAL — shown once on first battle ══ */}
        <Modal visible={showTutorial} transparent animationType="fade">
          <View style={S.tutOverlay}>
            <View style={S.tutCard}>
              <LinearGradient colors={['#0E0525', '#180840']} style={StyleSheet.absoluteFill} />
              <View style={[S.tutAccent, { backgroundColor: C.PRIMARY }]} />

              <Text style={S.tutTitle}>BATTLE BASICS</Text>
              <Text style={S.tutSub}>How the energy system works</Text>

              <View style={S.tutRows}>
                {[
                  { icon: 'flash',        color: C.ATK,          label: 'Normal Attack', desc: 'Always free  ·  gives +15⚡' },
                  { icon: 'star',         color: C.CYAN,         label: 'S1 / S2 Skills', desc: 'Cost energy to cast  ·  gives +10⚡' },
                  { icon: 'thunderstorm', color: C.GOLD,         label: 'Trump Card',    desc: 'Requires full 100⚡  ·  hits all enemies' },
                  { icon: 'battery-charging', color: C.SUCCESS,  label: 'Passive Gain',  desc: '+20⚡ per enemy turn automatically' },
                ].map((row, i) => (
                  <View key={i} style={S.tutRow}>
                    <View style={[S.tutIconWrap, { backgroundColor: row.color + '22', borderColor: row.color + '60' }]}>
                      <Ionicons name={row.icon} size={15} color={row.color} />
                    </View>
                    <View style={S.tutRowText}>
                      <Text style={S.tutRowLabel}>{row.label}</Text>
                      <Text style={S.tutRowDesc}>{row.desc}</Text>
                    </View>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={S.tutBtn}
                onPress={() => { seenBattleTutorial(); setShowTutorial(false); }}
                activeOpacity={0.82}
              >
                <LinearGradient
                  colors={C.GRAD_PINK}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={S.tutBtnInner}
                >
                  <Text style={S.tutBtnTxt}>GOT IT  —  START BATTLE</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </SafeAreaView>

    </View>
  );
}

// ─── BattleCard ───────────────────────────────────────────────────────────────

// Lightweight status-effects key: "burn:2,poison:1" — much cheaper than JSON.stringify.
const _fxKey = (arr) => (arr || []).map(fx => `${fx.type}:${fx.duration}`).join(',');

// Custom equality: only re-render when the fields that actually change the card's
// visual output have changed. Energy, turn index, status message etc. don't
// affect any card's appearance, so they must NOT cause a re-render.
function _cardEqual(prev, next) {
  return (
    prev.unit.currentHp  === next.unit.currentHp  &&
    prev.unit.damageKey  === next.unit.damageKey   &&
    prev.unit.lastDamage === next.unit.lastDamage  &&
    prev.unit.lastCrit   === next.unit.lastCrit    &&
    prev.unit.shield     === next.unit.shield      &&
    prev.unit.stunned    === next.unit.stunned     &&
    prev.isActive        === next.isActive         &&
    prev.isSelected      === next.isSelected       &&
    prev.canSwitch       === next.canSwitch        &&
    prev.side            === next.side             &&
    _fxKey(prev.unit.statusEffects) === _fxKey(next.unit.statusEffects)
  );
}

const BattleCard = React.memo(function BattleCard({ unit, side, isActive, isSelected, factionColor, shakeAnim, flashAnim, scaleAnim, onPress, canSwitch, accessibilityLabel, accessibilityRole }) {
  // Stable fallback Animated values so we never create new objects in render
  const _shake = useRef(new Animated.Value(0)).current;
  const _scale = useRef(new Animated.Value(1)).current;

  const hpRatio  = unit.maxHp > 0 ? Math.max(0, unit.currentHp / unit.maxHp) : 0;
  const defeated = unit.currentHp <= 0;

  const imgSrc = side === 'enemy'
    ? (unit.imageKey && ENEMY_IMAGES[unit.imageKey] ? ENEMY_IMAGES[unit.imageKey] : null)
    : (unit.image || null);

  const cardBorderColor = isSelected ? C.GOLD
    : isActive            ? (factionColor || C.PRIMARY)
    : side === 'enemy'    ? C.BORDER_STRONG
    :                       C.BORDER;

  const hpBarColors = hpRatio > 0.5
    ? [C.DEF, C.PRIMARY_LIGHT]
    : hpRatio > 0.25
    ? [C.WARNING, C.GOLD]
    : [C.HP, C.DANGER];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.85}
      style={S.cardTouch}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={onPress ? (accessibilityRole ?? 'button') : undefined}
    >

      {/* HP number */}
      <Text style={[S.hpNumber, { color: side === 'enemy' ? C.SECONDARY : C.PRIMARY }]}>
        {unit.currentHp}
      </Text>

      {/* HP label + bar */}
      <View style={S.hpBarRow}>
        <Text style={S.hpLabel}>HP</Text>
        <View style={S.hpBarBg}>
          <LinearGradient
            colors={hpBarColors}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={[S.hpBarFill, { width: `${hpRatio * 100}%` }]}
          />
        </View>
      </View>

      {/* Portrait */}
      <Animated.View style={[
        S.card,
        {
          borderColor: cardBorderColor,
          borderWidth: isSelected || isActive ? 2.5 : 1,
          opacity: defeated ? 0.4 : 1,
          transform: [
            { translateX: shakeAnim ?? _shake },
            { scale:      scaleAnim ?? _scale },
          ],
        },
      ]}>
        {imgSrc ? (
          <Image source={imgSrc} style={S.cardImg} resizeMode="cover" />
        ) : (
          <View style={[S.cardImg, S.cardImgFb]}>
            <Text style={{ fontSize: 28 }}>{side === 'enemy' ? '👹' : '⚔️'}</Text>
          </View>
        )}

        {/* Hit flash */}
        {flashAnim && (
          <Animated.View style={[
            StyleSheet.absoluteFill,
            { borderRadius: 10, backgroundColor: side === 'enemy' ? C.DANGER : C.PRIMARY, opacity: flashAnim },
          ]} />
        )}

        {/* Active faction ring */}
        {isActive && (
          <View style={[S.activeRing, { borderColor: factionColor || C.PRIMARY }]} />
        )}

        {/* Selected gold ring (enemy target) */}
        {isSelected && !defeated && (
          <View style={[StyleSheet.absoluteFill, { borderRadius: 10, borderWidth: 2.5, borderColor: C.GOLD }]} />
        )}

        {/* Shield badge */}
        {(unit.shield || 0) > 0 && (
          <View style={S.shieldBadge}>
            <Ionicons name="shield" size={9} color={C.CYAN} />
          </View>
        )}

        {/* Switch hint — shown on inactive alive player heroes */}
        {canSwitch && (
          <View style={S.switchHint}>
            <Text style={S.switchHintText}>SWITCH</Text>
          </View>
        )}

        {/* Target badge — shown on selected enemy */}
        {isSelected && !defeated && side === 'enemy' && (
          <View style={S.targetBadge}>
            <Text style={S.targetBadgeText}>TARGET</Text>
          </View>
        )}

        {/* Status effect badges */}
        {(unit.statusEffects || []).length > 0 && !defeated && (
          <View style={S.statusEffectRow}>
            {unit.statusEffects.map((fx, i) => {
              const d = STATUS_DISPLAY[fx.type];
              if (!d) return null;
              return (
                <View key={i} style={[S.statusEffectBadge, { backgroundColor: d.color + '33', borderColor: d.color }]}>
                  <Text style={[S.statusEffectText, { color: d.color }]}>{d.label}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Floating damage */}
        <FloatingDamage value={unit.lastDamage} isCrit={unit.lastCrit} trigger={unit.damageKey} />

        {/* Name strip */}
        <View style={S.cardNameStrip}>
          <Text style={S.cardName} numberOfLines={1}>{unit.name}</Text>
        </View>

        {/* Defeated overlay */}
        {defeated && (
          <View style={S.defeatedOv}>
            <Ionicons name="close-circle" size={26} color={C.DANGER} />
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}, _cardEqual);

// ─── FloatingDamage ───────────────────────────────────────────────────────────

const FloatingDamage = React.memo(function FloatingDamage({ value, isCrit, trigger }) {
  const yAnim  = useRef(new Animated.Value(0)).current;
  const opAnim = useRef(new Animated.Value(0)).current;
  const scAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!trigger || !value) return;
    yAnim.setValue(0);
    opAnim.setValue(1);
    scAnim.setValue(isCrit ? 1.4 : 1.15);
    Animated.parallel([
      Animated.timing(yAnim,  { toValue: -(IMG_H * 0.7), duration: 820, useNativeDriver: true }),
      Animated.timing(scAnim, { toValue: 1.0, duration: 200, useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(440),
        Animated.timing(opAnim, { toValue: 0, duration: 380, useNativeDriver: true }),
      ]),
    ]).start();
  }, [trigger]);

  if (!value) return null;
  return (
    <Animated.Text style={[
      S.floatDmg,
      {
        fontSize:  isCrit ? 18 : 13,
        color:     isCrit ? C.GOLD : '#fff',
        transform: [{ translateY: yAnim }, { scale: scAnim }],
        opacity:   opAnim,
      },
    ]}>
      {isCrit ? '💥' : ''}-{value}{isCrit ? '!' : ''}
    </Animated.Text>
  );
}, (prev, next) => prev.trigger === next.trigger);

// ─── PillBtn ──────────────────────────────────────────────────────────────────

const PillBtn = React.memo(function PillBtn({ label, sub, colors, onPress, disabled, dimmed, glow, accessibilityLabel, accessibilityRole }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.75}
      style={[S.pillBtn, glow && S.pillBtnGlow]}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole ?? 'button'}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={S.pillBtnInner}
      >
        <Text style={[S.pillBtnLabel, dimmed && S.pillBtnLabelDim]} numberOfLines={1}>
          {label}
        </Text>
        <Text style={[S.pillBtnSub, dimmed && S.pillBtnSubDim]} numberOfLines={1}>
          {sub}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.BG_DEEP },
  safe:   { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },

  // ── Header ──
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 6, gap: 10,
    backgroundColor: C.BG_RAISED,
    borderBottomWidth: 1, borderBottomColor: C.BORDER,
  },
  quitBtn:      { borderRadius: 8, overflow: 'hidden' },
  quitBtnInner: { paddingHorizontal: 14, paddingVertical: 7 },
  quitText:     { fontSize: 12, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },

  headerMid:   { flex: 1 },
  headerTitle: { fontSize: 13, fontWeight: '800', color: C.TEXT, letterSpacing: 0.3 },
  turnLabel:      { fontSize: 10, color: C.TEXT_MUTED, fontWeight: '600', letterSpacing: 0.5 },
  turnCountLabel: { fontSize: 9, color: C.TEXT_MUTED, fontWeight: '600' },

  energyWrap: { width: 96 },
  energyLbl:  { fontSize: 9, color: C.GOLD, fontWeight: '700', marginBottom: 3 },
  energyBg:   { height: 5, backgroundColor: C.BG_MID, borderRadius: 3, overflow: 'hidden' },
  energyFill: { height: 5, borderRadius: 3 },

  turnPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 8, borderWidth: 1,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  turnDot:  { width: 6, height: 6, borderRadius: 3 },
  turnText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },

  // ── Arena ──
  arena: {
    flex: 1,
    flexDirection: 'row',
    paddingTop: 6,
  },
  teamSide: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: SIDE_PAD,
  },
  teamLabel: {
    fontSize: 11, fontWeight: '900', letterSpacing: 2.5,
    marginBottom: 5,
  },
  cardRow: {
    flexDirection: 'row',
    gap: CARD_GAP,
    justifyContent: 'center',
  },
  divider: {
    width: 1,
    backgroundColor: C.BORDER,
    marginVertical: 4,
  },

  // ── Card ──
  cardTouch: { width: CARD_W, alignItems: 'center' },

  hpNumber: {
    fontSize: 14, fontWeight: '900', letterSpacing: 0.3,
    marginBottom: 2,
  },
  hpBarRow: {
    flexDirection: 'row', alignItems: 'center',
    width: CARD_W, gap: 4, marginBottom: 3,
  },
  hpLabel:  { fontSize: 8, fontWeight: '800', color: C.TEXT_SOFT, letterSpacing: 0.3 },
  hpBarBg:  { flex: 1, height: 5, backgroundColor: C.BG_BOTTOM, borderRadius: 3, overflow: 'hidden' },
  hpBarFill:{ height: 5, borderRadius: 3 },

  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: C.BG_CARD,
    shadowColor: C.PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  cardImg:   { width: '100%', height: '100%' },
  cardImgFb: { backgroundColor: C.BG_MID, alignItems: 'center', justifyContent: 'center' },

  activeRing: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 10, borderWidth: 2.5, zIndex: 8,
  },
  shieldBadge: {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: C.CYAN_GLOW,
    borderRadius: 4, padding: 3, zIndex: 10,
    borderWidth: 1, borderColor: C.DEF,
  },
  switchHint: {
    position: 'absolute', top: 4, left: 4,
    backgroundColor: C.PRIMARY_GLOW,
    borderRadius: 4, paddingHorizontal: 4, paddingVertical: 2,
    borderWidth: 1, borderColor: C.PRIMARY,
    zIndex: 10,
  },
  switchHintText: { fontSize: 6, color: C.PRIMARY, fontWeight: '900', letterSpacing: 0.5 },

  targetBadge: {
    position: 'absolute', top: 4, left: 4,
    backgroundColor: 'rgba(217,119,6,0.25)',
    borderRadius: 4, paddingHorizontal: 4, paddingVertical: 2,
    borderWidth: 1, borderColor: C.GOLD,
    zIndex: 10,
  },
  targetBadgeText: { fontSize: 6, color: C.GOLD, fontWeight: '900', letterSpacing: 0.5 },

  cardNameStrip: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.52)',
    paddingVertical: 3, paddingHorizontal: 4,
  },
  cardName: { fontSize: 8, color: '#fff', fontWeight: '700', textAlign: 'center' },

  statusEffectRow: {
    position: 'absolute',
    bottom: 18,
    left: 0, right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 2,
    zIndex: 15,
    paddingHorizontal: 2,
  },
  statusEffectBadge: {
    borderRadius: 3,
    borderWidth: 1,
    paddingHorizontal: 2,
    paddingVertical: 1,
  },
  statusEffectText: {
    fontSize: 6,
    fontWeight: '900',
    letterSpacing: 0.3,
  },

  floatDmg: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    zIndex: 20,
  },
  defeatedOv: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Bottom area (transparent) ──
  bottomArea: {
    paddingTop: 4,
    paddingBottom: 8,
    paddingHorizontal: 8,
    backgroundColor: 'transparent',
  },
  statusMsg: {
    alignSelf: 'center',
    fontSize: 10, color: C.TEXT_SOFT,
    fontStyle: 'italic', fontWeight: '600',
    letterSpacing: 0.3, marginBottom: 5,
  },

  // ── Action bar ──
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // Active hero tag (left side of action bar)
  heroTag: {
    width: 82,
    paddingRight: 8,
    borderRightWidth: 1,
    borderRightColor: C.BORDER,
    justifyContent: 'center',
  },
  heroTagBadge: {
    fontSize: 7, color: C.PRIMARY, fontWeight: '900',
    letterSpacing: 1.5, marginBottom: 2,
  },
  heroTagName: {
    fontSize: 11, fontWeight: '800', color: C.TEXT,
    letterSpacing: 0.2,
  },
  heroTagHint: {
    fontSize: 7, color: C.GOLD, fontWeight: '700', marginTop: 2,
  },

  // Pill buttons row
  pillRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
  },
  pillBtn: {
    flex: 1,
    height: PILL_H,
    borderRadius: PILL_H / 2,
    overflow: 'hidden',
    shadowColor: C.PRIMARY_DARK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  pillBtnGlow: {
    shadowColor: C.GOLD,
    shadowOpacity: 0.55,
    shadowRadius: 10,
    elevation: 6,
  },
  pillBtnInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  pillBtnLabel:    { fontSize: 11, fontWeight: '800', color: '#fff', letterSpacing: 0.2 },
  pillBtnLabelDim: { color: 'rgba(255,255,255,0.38)' },
  pillBtnSub:      { fontSize: 8, color: 'rgba(255,255,255,0.8)', fontWeight: '600', marginTop: 1 },
  pillBtnSubDim:   { color: 'rgba(255,255,255,0.28)' },

  enemyThinking: {
    flex: 1, textAlign: 'center',
    fontSize: 12, color: C.TEXT_MUTED,
    fontStyle: 'italic', fontWeight: '600',
    paddingVertical: 10,
  },

  // ── No-team ──
  warnTitle: { fontSize: 18, fontWeight: '700', color: C.GOLD, marginTop: 14, marginBottom: 8 },
  warnSub:   { fontSize: 12, color: C.TEXT_MUTED, textAlign: 'center', lineHeight: 18, marginBottom: 20 },
  goBackBtn: {
    backgroundColor: C.PRIMARY_GLOW, borderRadius: 10,
    paddingVertical: 11, paddingHorizontal: 26,
    borderWidth: 1, borderColor: C.PRIMARY,
  },
  goBackText: { color: C.PRIMARY, fontSize: 14, fontWeight: '700' },

  // ── Energy tutorial modal ──
  tutOverlay: {
    flex: 1,
    backgroundColor: 'rgba(6,2,18,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tutCard: {
    width: Math.min(W * 0.62, 480),
    borderRadius: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: C.BORDER_STRONG,
    padding: 18,
    shadowColor: C.PRIMARY,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45, shadowRadius: 20, elevation: 12,
  },
  tutAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 3 },
  tutTitle: {
    fontSize: 16, fontWeight: '900', color: '#fff',
    letterSpacing: 3.5, textAlign: 'center', marginBottom: 2,
  },
  tutSub: {
    fontSize: 9, color: 'rgba(255,255,255,0.45)',
    textAlign: 'center', letterSpacing: 0.5, marginBottom: 14,
  },
  tutRows:    { gap: 8, marginBottom: 16 },
  tutRow:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tutIconWrap: {
    width: 32, height: 32, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  tutRowText:  { flex: 1 },
  tutRowLabel: { fontSize: 11, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  tutRowDesc:  { fontSize: 9, color: 'rgba(255,255,255,0.52)', marginTop: 1 },
  tutBtn:      { borderRadius: 10, overflow: 'hidden' },
  tutBtnInner: { paddingVertical: 12, alignItems: 'center' },
  tutBtnTxt:   { fontSize: 12, fontWeight: '900', color: '#fff', letterSpacing: 1.5 },
});
