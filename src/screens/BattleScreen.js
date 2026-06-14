import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Image, Modal, Alert, Dimensions, BackHandler,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import useGameStore from '../store/gameStore';
import AudioManager from '../utils/AudioManager';
import { HEROES, FACTIONS } from '../data/heroes';
import HeroCard from '../components/HeroCard';
import { ENEMY_GROUPS, ENEMY_IMAGES } from '../data/enemies';
import { stageGoldReward } from '../data/story';
import { ASCENSION_STAT_MULT } from '../data/ascensionItems';
import { isBossFloor } from '../data/towerData';
import { C } from '../theme/colors';
import {
  calculateDamage, applyTrumpCard, applyHealSkill,
  allDefeated, getSmartAIAction,
  applyOnHitDebuff, processStatusEffects, EFFECT_MECHANICS,
  RANK_STAT_MULT,
} from '../utils/battleEngine';

const { width: W, height: SH } = Dimensions.get('window');

// ── Battlefield backgrounds ───────────────────────────────────────────────────
const BATTLE_BG = {
  emberveil: require('../../assets/battlefield-bg/Emberveil-Volcanic-Battlefield.webp'),
  glaciara:  require('../../assets/battlefield-bg/Glaciara-Frozen-Battlefield.webp'),
  khemara:   require('../../assets/battlefield-bg/Khemara-Desert-Battlefield.webp'),
  sunspire:  require('../../assets/battlefield-bg/Sunspire-Holy-Sanctuary.webp'),
  verdania:  require('../../assets/battlefield-bg/Verdania-Ancient-Forest-Battlefield.webp'),
  voidmark:  require('../../assets/battlefield-bg/Voidmark-Corrupted-Void-Battlefield.webp'),
};

const DUNGEON_BG_KEY = {
  gilded_vault:     'khemara',
  ascendant_grotto: 'verdania',
  void_sanctum:     'voidmark',
};

// Cycles story chapters 1-25 through the 6 backgrounds
const BG_CYCLE = ['emberveil', 'glaciara', 'sunspire', 'verdania', 'voidmark', 'khemara'];

function getBattleBg(dungeonMode, dungeonId, towerMode, towerFloor, chapterId) {
  if (dungeonMode && dungeonId) return BATTLE_BG[DUNGEON_BG_KEY[dungeonId] || 'voidmark'];
  if (towerMode)   return BATTLE_BG[BG_CYCLE[(towerFloor - 1) % 6]];
  if (chapterId)   return BATTLE_BG[BG_CYCLE[(Math.floor(chapterId / 100) - 1) % 6]];
  return BATTLE_BG.emberveil;
}

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
  lastHeal:      0,
  healKey:       0,
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
  stun:    { label: '⚡STN', color: C.GOLD   },
};

const mkAnims = () =>
  Array.from({ length: 3 }, () => ({
    shake:  new Animated.Value(0),
    flash:  new Animated.Value(0),
    scale:  new Animated.Value(1),
    lungeX: new Animated.Value(0),
  }));

// Boss enrage: first time a boss drops to/below 50% HP its ATK surges.
// Pure helper so both player actions AND DOT ticks can trigger it.
const applyEnrage = (teamArr) => {
  let msg = null;
  const team = teamArr.map((e) => {
    if (e.tier === 'boss' && !e.enraged && e.currentHp > 0 && (e.currentHp / e.maxHp) <= 0.50) {
      msg = `⚡ ${e.name} is ENRAGED! Attack power surges!`;
      return { ...e, atk: Math.floor(e.atk * 1.30), enraged: true };
    }
    return e;
  });
  return { team, msg };
};

// ─── BattleScreen ─────────────────────────────────────────────────────────────

export default function BattleScreen({ navigation, route }) {
  // Per-property selectors — avoids whole-store re-renders during battle animations
  const team                      = useGameStore(s => s.team);
  const completeChapter           = useGameStore(s => s.completeChapter);
  const getHeroData               = useGameStore(s => s.getHeroData);
  const hasSeenBattleTutorial     = useGameStore(s => s.hasSeenBattleTutorial);
  const seenBattleTutorial        = useGameStore(s => s.seenBattleTutorial);
  const completedChapters         = useGameStore(s => s.completedChapters);
  const practiceBonusClaimed      = useGameStore(s => s.practiceBonusClaimed);
  const claimPracticeBonus        = useGameStore(s => s.claimPracticeBonus);
  const addGems                   = useGameStore(s => s.addGems);
  const addGold                   = useGameStore(s => s.addGold);
  const trackQuestProgress        = useGameStore(s => s.trackQuestProgress);
  const completeTowerFloor        = useGameStore(s => s.completeTowerFloor);
  const completeDungeon           = useGameStore(s => s.completeDungeon);
  const trackAchievementProgress  = useGameStore(s => s.trackAchievementProgress);
  const setMaxAchievementProgress = useGameStore(s => s.setMaxAchievementProgress);
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
  const dungeonMode    = route?.params?.dungeonMode    || false;
  const dungeonId      = route?.params?.dungeonId      || null;
  const dungeonRewards = route?.params?.dungeonRewards || null;

  const battleBg = useMemo(
    () => getBattleBg(dungeonMode, dungeonId, towerMode, towerFloor, chapterId),
    [dungeonMode, dungeonId, towerMode, towerFloor, chapterId],
  );

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
  // Trump Card cinematic cut-in — holds the casting hero while the overlay plays
  const [trumpCutIn,     setTrumpCutIn]     = useState(null);
  // Enemy skill cut-in — bosses/mini-bosses get a menacing slam when they unleash a skill
  const [enemyCutIn,     setEnemyCutIn]     = useState(null);

  const aiRunning       = useRef(false);
  const resultTimerRef  = useRef(null);
  // Round-robin pointer so every living enemy gets turns (boss included)
  const enemyActorRef   = useRef(-1);
  const playerAnims = useRef(mkAnims()).current;
  const enemyAnims  = useRef(mkAnims()).current;
  // Whole-arena impact shake + full-screen flash (cosmetic overlays only —
  // these never gate the visibility of cards, so a missed frame is harmless)
  const arenaShakeX = useRef(new Animated.Value(0)).current;
  const screenFlash = useRef(new Animated.Value(0)).current;

  // If this screen mounted before AsyncStorage hydration finished, the teams
  // were built from the default (pre-hydration) store — rebuild them once.
  const wasUnhydrated = useRef(!useGameStore.persist.hasHydrated());
  useEffect(() => {
    if (hydrated && wasUnhydrated.current) {
      wasUnhydrated.current = false;
      setPlayerTeam(buildPlayers());
      setEnemyTeam(buildEnemies());
    }
  }, [hydrated, buildPlayers, buildEnemies]);

  // Battle BGM — start when screen gains focus, stop the moment it loses focus
  useFocusEffect(useCallback(() => {
    AudioManager.startBattleBGM();
    return () => AudioManager.stopBattleBGM();
  }, []));

  // Cancel pending victory navigation if the screen unmounts (e.g. quit during the 750ms delay)
  useEffect(() => () => { clearTimeout(resultTimerRef.current); }, []);

  // Shared quit confirmation — used by both the Quit button and hardware back.
  const confirmQuit = useCallback(() => {
    Alert.alert(
      'Quit Battle?',
      'Your progress in this battle will be lost.',
      [
        { text: 'Stay', style: 'cancel' },
        { text: 'Quit', style: 'destructive', onPress: () => navigation.goBack() },
      ]
    );
  }, [navigation]);

  // Intercept Android hardware back so it can't silently abandon the battle —
  // route it through the same Quit confirmation instead of popping the screen.
  useFocusEffect(useCallback(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      confirmQuit();
      return true; // consume the event
    });
    return () => sub.remove();
  }, [confirmQuit]));

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

  const triggerAttack = useCallback((anims, idx, direction = 0) => {
    const a = anims[Math.min(idx, 2)];
    if (!a) return;
    const animations = [
      Animated.sequence([
        Animated.timing(a.scale, { toValue: 1.09, duration: 100, useNativeDriver: true }),
        Animated.timing(a.scale, { toValue: 1.0,  duration: 150, useNativeDriver: true }),
      ]),
    ];
    if (direction !== 0 && a.lungeX) {
      animations.push(Animated.sequence([
        Animated.timing(a.lungeX, { toValue: direction * 14, duration: 90,  useNativeDriver: true }),
        Animated.timing(a.lungeX, { toValue: 0,              duration: 140, useNativeDriver: true }),
      ]));
    }
    Animated.parallel(animations).start();
  }, []);

  // Whole-arena shake — symmetric translateX around 0 (pure transform, native-safe).
  const triggerShake = useCallback((mag = 8) => {
    arenaShakeX.setValue(0);
    Animated.sequence([
      Animated.timing(arenaShakeX, { toValue: -mag,        duration: 38, useNativeDriver: true }),
      Animated.timing(arenaShakeX, { toValue: mag,         duration: 38, useNativeDriver: true }),
      Animated.timing(arenaShakeX, { toValue: -mag * 0.6,  duration: 38, useNativeDriver: true }),
      Animated.timing(arenaShakeX, { toValue: mag * 0.45,  duration: 38, useNativeDriver: true }),
      Animated.timing(arenaShakeX, { toValue: 0,           duration: 38, useNativeDriver: true }),
    ]).start();
  }, [arenaShakeX]);

  // Full-screen white flash — jump to peak via setValue, then fade to 0.
  // Fade-OUT direction is the proven-safe pattern on the New Architecture.
  const triggerScreenFlash = useCallback((peak = 0.4) => {
    screenFlash.setValue(peak);
    Animated.timing(screenFlash, { toValue: 0, duration: 240, useNativeDriver: true }).start();
  }, [screenFlash]);

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
        trackAchievementProgress('battlesWon', 1);
        setMaxAchievementProgress('towerHighestFloor', towerFloor);
        if (isBossFloor(towerFloor)) trackAchievementProgress('towerBossesDefeated', 1);
        showResult('win', { wasReplay: false, xpGained: 0, towerMode: true, towerFloor, towerRewards, towerAscensionDrop: ascensionDrop });
        return true;
      }

      // ── Resource Dungeon win ─────────────────────────────────────────────────
      if (dungeonMode) {
        completeDungeon(dungeonRewards);
        trackQuestProgress('win_battles');
        trackAchievementProgress('battlesWon', 1);
        showResult('win', { wasReplay: false, xpGained: 0, dungeonMode: true, dungeonRewards });
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
      if (chapterId && !wasReplay) {
        completeChapter(chapterId, chapterRewards.gems, chapterRewards.heroId);
      } else if (chapterId && wasReplay) {
        // Replays earn gold only — VictoryScreen and the stage card both
        // advertise this ("REPLAY · GOLD ONLY"), so actually grant it.
        addGold(stageGoldReward(chapterId % 10));
      }

      // Quest tracking
      trackQuestProgress('win_battles');
      // Replays count too — the daily quest is "clear a stage", and players who
      // finished all 75 stages have no first-clears left to complete it with.
      if (fromStory) trackQuestProgress('clear_stage');
      trackAchievementProgress('battlesWon', 1);
      // stagesCleared is tracked inside completeChapter; don't double-count here

      showResult('win', { wasReplay, practiceGotBonus, xpGained });
      return true;
    }
    if (allDefeated(players)) {
      // Pass mode flags so VictoryScreen routes Retry / Back correctly
      // (a tower/dungeon defeat must not dump the player into Story Mode).
      showResult('lose', { wasReplay: false, xpGained: 0, towerMode, towerFloor, towerRewards, dungeonMode, dungeonRewards });
      return true;
    }
    return false;
  }, [showResult, chapterId, chapterRewards, completeChapter, completedChapters,
      practiceMode, practiceBonusClaimed, claimPracticeBonus, addGems, addGold,
      towerMode, towerFloor, towerRewards, completeTowerFloor, trackQuestProgress,
      dungeonMode, dungeonRewards, completeDungeon,
      trackAchievementProgress, setMaxAchievementProgress, fromStory]);

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
      let curEnemyTeam = enemyTeam.map((e, i) => {
        if (e.currentHp <= 0 || !(e.statusEffects || []).length) return e;
        effectsProcessed = true;
        const { unit, dotDamage, messages } = processStatusEffects(e);
        dotMsgs.push(...messages);
        // DOT damage gets the same hit feedback as an attack: floating
        // damage number (via damageKey) + hit flash — it used to be silent.
        if (dotDamage > 0) {
          setTimeout(() => triggerHit(enemyAnims, i), 60);
          return { ...unit, lastDamage: dotDamage, lastCrit: false, damageKey: (e.damageKey || 0) + 1 };
        }
        return unit;
      });
      if (effectsProcessed) {
        // A DOT tick can push a boss below 50% — enrage must trigger here too,
        // not only on player actions.
        const enr = applyEnrage(curEnemyTeam);
        curEnemyTeam = enr.team;
        if (enr.msg) dotMsgs.unshift(enr.msg);
        setEnemyTeam(curEnemyTeam);
        if (dotMsgs.length > 0) setStatusMsg(dotMsgs[0]);
        // Apply player regen so checkEnd sees the post-regen state (DOT could finish
        // an already-weakened enemy, regen could keep a player alive at the same tick).
        const regenPlayers = playerTeam.map((p) => {
          if (p.currentHp <= 0) return p;
          return processStatusEffects(p).unit;
        });
        if (checkEnd(regenPlayers, curEnemyTeam)) {
          // Game over from DOT — commit regen state and exit
          setPlayerTeam(regenPlayers);
          aiRunning.current = false;
          setIsAnimating(false);
          return;
        }
        setCurrentTurnIdx(nextPlayerIdx(regenPlayers, currentTurnIdx));
        // Game continues: don't setPlayerTeam here — the AI action block below
        // rebuilds np from playerTeam and applies regen itself before setting state.
      }

      // ── Round-robin actor selection ──────────────────────────────────────
      // Rotate through living enemies so every enemy gets turns. Previously
      // only the FIRST living enemy ever acted, which meant a boss listed
      // last never attacked until its mobs were dead — and stun counters on
      // non-acting enemies froze forever.
      const len = curEnemyTeam.length;
      let actorIdx = -1;
      for (let k = 1; k <= len; k++) {
        const idx = (enemyActorRef.current + k) % len;
        if (curEnemyTeam[idx]?.currentHp > 0) { actorIdx = idx; break; }
      }
      const actor = actorIdx >= 0 ? curEnemyTeam[actorIdx] : null;
      if (actorIdx >= 0) enemyActorRef.current = actorIdx;

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

      const actorHpRatio = actor.maxHp > 0 ? actor.currentHp / actor.maxHp : 1.0;
      const aiAction = getSmartAIAction(actor, playerTeam, actorEnergy, ENEMY_SKILL_COSTS, actor.tier || 'mob', actorHpRatio);
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
          triggerAttack(enemyAnims, actorIdx, 1);
          if (isCrit) { triggerScreenFlash(0.28); triggerShake(6); }
        }
        energyAfter = Math.min(MAX_ENERGY, actorEnergy + 20);
      } else if (aiAction.action === 'skill') {
        const skill     = actor.skills[aiAction.skillIdx];
        const skillCost = ENEMY_SKILL_COSTS[aiAction.skillIdx] ?? ENEMY_SKILL_COSTS[0];
        if (skill) {
          // Signature moment for elites: a boss/mini-boss unleashing a skill gets a
          // menacing full-screen cut-in + impact shake. Regular mobs stay quick so the
          // pace doesn't drown in cinematics.
          if (actor.tier === 'boss' || actor.tier === 'mini-boss') {
            setEnemyCutIn({ ...actor, _skillName: skill.name });
            triggerShake(10);
          }
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
            triggerAttack(enemyAnims, actorIdx, 1);
            if (isCrit) { triggerScreenFlash(0.28); triggerShake(6); }
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
  // Intentional stale closure: only re-trigger when the turn flips or the battle ends.
  // Including playerTeam/enemyTeam would re-fire mid-turn as those are mutated inside this effect.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEnemyTurn, battleResult]);

  // ── Player action ─────────────────────────────────────────────────────────

  const executeAction = useCallback((actionType, skillIdx = 0) => {
    if (isEnemyTurn || isAnimating || battleResult || enemyCutIn) return;
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
    triggerAttack(playerAnims, currentTurnIdx, -1);
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
          np[currentTurnIdx] = { ...np[currentTurnIdx], currentHp: Math.min(np[currentTurnIdx].maxHp, np[currentTurnIdx].currentHp + drain), lastHeal: drain, healKey: (np[currentTurnIdx].healKey || 0) + 1 };
        }
        msg = `${hero.name} attacks${isCrit ? ' — CRITICAL HIT!' : '!'}`;
        setTimeout(() => triggerHit(enemyAnims, tgtIdx), 100);
        if (isCrit) { triggerScreenFlash(0.32); triggerShake(7); }
        // Energy only on a connected hit — not on dodge or block
        newEnergy = Math.min(MAX_ENERGY, newEnergy + 15);
      }

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
          let aoeHit = false;
          ne = ne.map((e, i) => {
            if (e.currentHp <= 0) return e;
            const { damage, isCrit, blocked, dodged } = calculateDamage(hero, e, skill.damage);
            if (blocked) return { ...e, shield: Math.max(0, e.shield - 1) };
            if (dodged) return e;
            aoeHit = true;
            setTimeout(() => triggerHit(enemyAnims, i), 80 + i * 70);
            let updated = { ...e, currentHp: Math.max(0, e.currentHp - damage), lastDamage: damage, lastCrit: isCrit, damageKey: (e.damageKey || 0) + 1 };
            updated = applyOnHitDebuff(hero, updated, true);
            return updated;
          });
          if (EFFECT_MECHANICS[hero.effect] === 'lifedrain') {
            const totalDmg = ne.reduce((sum, e) => sum + (e.lastDamage || 0), 0);
            const drain = Math.floor(totalDmg * 0.15);
            if (drain > 0) np[currentTurnIdx] = { ...np[currentTurnIdx], currentHp: Math.min(np[currentTurnIdx].maxHp, np[currentTurnIdx].currentHp + drain), lastHeal: drain, healKey: (np[currentTurnIdx].healKey || 0) + 1 };
          }
          msg = `${hero.name}: ${skill.name} — All enemies!`;
          // Grant energy only if at least one enemy was actually hit
          if (aoeHit) newEnergy = Math.min(MAX_ENERGY, newEnergy + 10);
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
              np[currentTurnIdx] = { ...np[currentTurnIdx], currentHp: Math.min(np[currentTurnIdx].maxHp, np[currentTurnIdx].currentHp + drain), lastHeal: drain, healKey: (np[currentTurnIdx].healKey || 0) + 1 };
            }
            msg = `${hero.name}: ${skill.name}${isCrit ? ' — CRIT!' : ''}`;
            setTimeout(() => triggerHit(enemyAnims, tgtIdx), 100);
            if (isCrit) { triggerScreenFlash(0.32); triggerShake(7); }
            // Energy only on a connected hit
            newEnergy = Math.min(MAX_ENERGY, newEnergy + 10);
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
          const preHealHps = np.map(p => p.currentHp);
          np = applyHealSkill(hero, np);
          np = np.map((p, i) => {
            const healAmt = p.currentHp - preHealHps[i];
            if (healAmt > 0) return { ...p, lastHeal: healAmt, healKey: (p.healKey || 0) + 1 };
            return p;
          });
          msg = `${hero.name}: ${skill.name} — Healed!`;
        }
        // Heals and shields always succeed — always grant energy
        newEnergy = Math.min(MAX_ENERGY, newEnergy + 10);
      }

    } else if (actionType === 'trump') {
      if (newEnergy < MAX_ENERGY) { setStatusMsg('Need 100 energy!'); setIsAnimating(false); return; }
      const res = applyTrumpCard(hero, np, ne);
      np = res.allies;
      ne = res.enemies;
      // Lifedrain procs on trump damage too (Trump Cards are skills)
      if (EFFECT_MECHANICS[hero.effect] === 'lifedrain') {
        const totalDmg = ne.reduce((sum, e) => sum + (e.lastDamage || 0), 0);
        const drain = Math.floor(totalDmg * 0.15);
        if (drain > 0) np[currentTurnIdx] = {
          ...np[currentTurnIdx],
          currentHp: Math.min(np[currentTurnIdx].maxHp, np[currentTurnIdx].currentHp + drain),
          lastHeal: drain, healKey: (np[currentTurnIdx].healKey || 0) + 1,
        };
      }
      // Fire hit animations immediately — useNativeDriver means they run on the
      // native thread, so no JS-thread stagger is needed and fewer timers = less lag.
      ne.forEach((e, i) => { if ((e.lastDamage || 0) > 0) triggerHit(enemyAnims, i); });
      msg = `${hero.name}: ${hero.trumpCard.name}!`;
      newEnergy = 0;
      // Signature moment: full-screen cinematic cut-in + heavy impact feedback.
      // Capture the post-fusion rank so the card shows its true rarity, not base.
      const hd = getHeroData(hero.id);
      const cutInRank = hero.sovereign ? 'SOVEREIGN' : (hd?.effectiveRank || hero.rank);
      setTrumpCutIn({ ...hero, _effRank: cutInRank });
      triggerScreenFlash(0.55);
      triggerShake(14);
      trackQuestProgress('use_trump');
      trackAchievementProgress('trumpCardsUsed', 1);
    }

    // ── Boss enrage check (player-action path; DOT path checks separately) ────
    const enr = applyEnrage(ne);
    ne = enr.team;
    if (enr.msg) msg = enr.msg;

    // ── Turn limit ──────────────────────────────────────────────────────────────
    const newTurnCount = turnCount + 1;

    setStatusMsg(msg);
    setEnergy(newEnergy);
    setEnemyTeam(ne);
    setPlayerTeam(np);
    setTurnCount(newTurnCount);

    setTimeout(() => {
      // Win check BEFORE turn limit — a killing blow on the 50th action must
      // count as a victory, not a timeout loss.
      if (!checkEnd(np, ne)) {
        if (newTurnCount >= TURN_LIMIT) {
          setStatusMsg('⏰ Turn limit reached — enemies endure...');
          showResult('lose', { wasReplay: false, xpGained: 0, towerMode, towerFloor, towerRewards, dungeonMode, dungeonRewards });
        } else {
          setIsEnemyTurn(true);
        }
      }
      setIsAnimating(false);
    }, 500);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEnemyTurn, isAnimating, battleResult, enemyCutIn, playerTeam, enemyTeam,
      energy, currentTurnIdx, selectedEnemy, turnCount,
      towerMode, towerFloor, towerRewards, dungeonMode, dungeonRewards,
      checkEnd, triggerHit, triggerAttack, triggerShake, triggerScreenFlash,
      trackQuestProgress, trackAchievementProgress, showResult]);

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
  // Lock all player input while a cut-in plays (the enemy cut-in fades out after
  // the AI hands control back, so isAnimating alone would leave buttons live).
  const inputLocked = isAnimating || !!enemyCutIn;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={S.root}>
      <Image source={battleBg} style={[StyleSheet.absoluteFill, { width: '100%', height: SH }]} resizeMode="cover" />
      <LinearGradient colors={C.GRAD_BATTLE} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={S.safe} edges={['top', 'bottom', 'left', 'right']}>

        {/* ══ HEADER ══ */}
        <View style={S.header}>
          <TouchableOpacity
            style={S.quitBtn}
            onPress={confirmQuit}
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

          <Text style={S.turnLabel}>Round {turnNumber}  ·  <Text style={S.turnCountLabel}>Act {turnCount}/{TURN_LIMIT}</Text></Text>

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
        <Animated.View style={[S.arena, { transform: [{ translateX: arenaShakeX }] }]}>

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
                  lungeAnim={enemyAnims[i]?.lungeX}
                  onPress={e.currentHp > 0 && !inputLocked ? () => setSelectedEnemy(i) : undefined}
                  accessibilityLabel={e.currentHp > 0 && !inputLocked ? `Target ${e.name}` : undefined}
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
                  lungeAnim={playerAnims[i]?.lungeX}
                  // tap a living non-active hero to switch who attacks this turn
                  canSwitch={!isEnemyTurn && !inputLocked && h.currentHp > 0 && i !== currentTurnIdx}
                  onPress={
                    !isEnemyTurn && !inputLocked && h.currentHp > 0 && i !== currentTurnIdx
                      ? () => setCurrentTurnIdx(i)
                      : undefined
                  }
                  accessibilityLabel={
                    !isEnemyTurn && !inputLocked && h.currentHp > 0 && i !== currentTurnIdx
                      ? `Switch to ${h.name}`
                      : undefined
                  }
                  accessibilityRole="button"
                />
              ))}
            </View>
          </View>

        </Animated.View>

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
                      disabled={inputLocked}
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
                        disabled={inputLocked || energy < skill0.cost * 20}
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
                        disabled={inputLocked || energy < skill1.cost * 20}
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
                      disabled={inputLocked || !ultiReady}
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
              <LinearGradient colors={[C.BG_BASE, C.BG_MID]} style={StyleSheet.absoluteFill} />
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

      {/* ══ FULL-SCREEN WHITE FLASH (crit / Trump impact) ══ */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, S.screenFlash, { opacity: screenFlash }]}
      />

      {/* ══ TRUMP CARD CINEMATIC CUT-IN ══ */}
      <TrumpCutIn hero={trumpCutIn} onDone={() => setTrumpCutIn(null)} />

      {/* ══ ENEMY SKILL CUT-IN (bosses / mini-bosses) ══ */}
      <EnemyCutIn enemy={enemyCutIn} onDone={() => setEnemyCutIn(null)} />

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
    prev.unit.healKey    === next.unit.healKey     &&
    prev.unit.shield     === next.unit.shield      &&
    prev.unit.stunned    === next.unit.stunned     &&
    prev.isActive        === next.isActive         &&
    prev.isSelected      === next.isSelected       &&
    prev.canSwitch       === next.canSwitch        &&
    prev.side            === next.side             &&
    _fxKey(prev.unit.statusEffects) === _fxKey(next.unit.statusEffects)
  );
}

const BattleCard = React.memo(function BattleCard({ unit, side, isActive, isSelected, factionColor, shakeAnim, flashAnim, scaleAnim, lungeAnim, onPress, canSwitch, accessibilityLabel, accessibilityRole }) {
  // Stable fallback Animated values so we never create new objects in render
  const _shake  = useRef(new Animated.Value(0)).current;
  const _scale  = useRef(new Animated.Value(1)).current;
  const _lungeX = useRef(new Animated.Value(0)).current;

  const hpRatio  = unit.maxHp > 0 ? Math.max(0, unit.currentHp / unit.maxHp) : 0;
  const defeated = unit.currentHp <= 0;

  // Ghost HP trail — amber bar that lingers at the old HP level, then catches up
  const prevHpRatioRef = useRef(hpRatio);
  const [ghostRatio, setGhostRatio] = useState(hpRatio);
  useEffect(() => {
    if (hpRatio < prevHpRatioRef.current) {
      setGhostRatio(prevHpRatioRef.current);
      const t = setTimeout(() => setGhostRatio(hpRatio), 500);
      prevHpRatioRef.current = hpRatio;
      return () => clearTimeout(t);
    }
    prevHpRatioRef.current = hpRatio;
    setGhostRatio(hpRatio);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hpRatio]);

  // Primary status → glow color. Stun wins; otherwise the first active effect.
  const stunned     = (unit.stunned || 0) > 0;
  const primaryFx   = (unit.statusEffects || [])[0];
  const statusColor = stunned
    ? STATUS_DISPLAY.stun.color
    : (primaryFx && STATUS_DISPLAY[primaryFx.type] ? STATUS_DISPLAY[primaryFx.type].color : null);

  // Pulsing status aura — loops opacity while a status is active. This is a pure
  // overlay; if a frame is ever dropped the card underneath stays fully visible.
  const glowPulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!statusColor || defeated) { glowPulse.setValue(0); return; }
    glowPulse.setValue(0.3);
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(glowPulse, { toValue: 0.7,  duration: 720, useNativeDriver: true }),
      Animated.timing(glowPulse, { toValue: 0.25, duration: 720, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [statusColor, defeated, glowPulse]);

  // Stun stars — a small cluster that spins above the head while stunned.
  const stunSpin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!stunned || defeated) return;
    stunSpin.setValue(0);
    const loop = Animated.loop(
      Animated.timing(stunSpin, { toValue: 1, duration: 1400, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [stunned, defeated, stunSpin]);
  const stunRotate = stunSpin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

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
          {/* Ghost trail — lingers at old HP, then catches up */}
          <View style={[S.hpGhostFill, { width: `${ghostRatio * 100}%` }]} />
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
            { translateX: lungeAnim ?? _lungeX },
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

        {/* Pulsing status aura — color keyed to the active status effect */}
        {statusColor && !defeated && (
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              { borderRadius: 10, borderWidth: 2.5, borderColor: statusColor, opacity: glowPulse },
            ]}
          />
        )}

        {/* Spinning stun stars (above the head) */}
        {stunned && !defeated && (
          <Animated.View
            pointerEvents="none"
            style={[S.stunStars, { transform: [{ rotate: stunRotate }] }]}
          >
            <Text style={S.stunStarText}>✦  ✦  ✦</Text>
          </Animated.View>
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

        {/* Status effect badges (statusEffects array + stun counter) */}
        {((unit.statusEffects || []).length > 0 || (unit.stunned || 0) > 0) && !defeated && (
          <View style={S.statusEffectRow}>
            {(unit.stunned || 0) > 0 && (() => {
              const d = STATUS_DISPLAY.stun;
              return (
                <View style={[S.statusEffectBadge, { backgroundColor: d.color + '33', borderColor: d.color }]}>
                  <Text style={[S.statusEffectText, { color: d.color }]}>{d.label}</Text>
                </View>
              );
            })()}
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
        {/* Floating heal */}
        <FloatingHeal value={unit.lastHeal} trigger={unit.healKey} />

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

// ─── FloatingHeal ─────────────────────────────────────────────────────────────

const FloatingHeal = React.memo(function FloatingHeal({ value, trigger }) {
  const yAnim  = useRef(new Animated.Value(0)).current;
  const opAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!trigger || !value) return;
    yAnim.setValue(0);
    opAnim.setValue(1);
    Animated.parallel([
      Animated.timing(yAnim,  { toValue: -(IMG_H * 0.55), duration: 750, useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(350),
        Animated.timing(opAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, [trigger]);

  if (!value) return null;
  return (
    <Animated.Text style={[
      S.floatHeal,
      { transform: [{ translateY: yAnim }], opacity: opAnim },
    ]}>
      +{value}
    </Animated.Text>
  );
}, (prev, next) => prev.trigger === next.trigger);

// ─── TrumpCutIn ───────────────────────────────────────────────────────────────
// Full-screen cinematic when a Trump Card fires: the hero portrait slams in from
// the left, the name + trump banner sweeps in from the right, then the whole
// thing fades out. Purely cosmetic overlay (pointerEvents none) layered above the
// battle — the Trump's damage has already been applied underneath, so nothing
// here gates game logic. Native-safe: all entrances are transforms, and the only
// opacity move is a fade-OUT from a setValue(1) start.

const TrumpCutIn = React.memo(function TrumpCutIn({ hero, onDone }) {
  const fade   = useRef(new Animated.Value(1)).current;
  const slideX = useRef(new Animated.Value(0)).current;  // portrait, from left
  const nameX  = useRef(new Animated.Value(0)).current;  // banner, from right

  useEffect(() => {
    if (!hero) return;
    fade.setValue(1);
    slideX.setValue(-W * 0.6);
    nameX.setValue(W * 0.55);
    const seq = Animated.sequence([
      Animated.parallel([
        Animated.spring(slideX, { toValue: 0, friction: 6.5, tension: 75, useNativeDriver: true }),
        Animated.spring(nameX,  { toValue: 0, friction: 7,   tension: 60, useNativeDriver: true }),
      ]),
      Animated.delay(430),
      Animated.timing(fade, { toValue: 0, duration: 280, useNativeDriver: true }),
    ]);
    seq.start(({ finished }) => { if (finished) onDone?.(); });
    return () => seq.stop();
  // onDone is stable enough; re-run only when a new hero casts.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hero]);

  if (!hero) return null;
  const fc = FACTIONS[hero.faction]?.color || C.PRIMARY;
  // Size the actual collectible card to fill most of the screen height.
  const cutCardH = Math.min(SH * 0.84, 360);
  const cutCardW = Math.round(cutCardH * (220 / 320));

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, S.cutInRoot, { opacity: fade }]}>
      {/* dark vignette */}
      <View style={S.cutInBackdrop} />

      {/* diagonal faction energy band behind the card */}
      <View style={[S.cutInBand, { backgroundColor: fc + '22', borderColor: fc }]} />

      {/* the real Trump Card slams in from the left */}
      <Animated.View style={[S.cutInCardWrap, { transform: [{ translateX: slideX }] }]}>
        <HeroCard hero={hero} effectiveRank={hero._effRank} width={cutCardW} compact />
      </Animated.View>

      {/* name + trump banner sweeps in from the right */}
      <Animated.View style={[S.cutInTextWrap, { transform: [{ translateX: nameX }] }]}>
        <Text style={S.cutInLabel}>TRUMP CARD</Text>
        <View style={[S.cutInRule, { backgroundColor: fc }]} />
        <Text style={[S.cutInHeroName, { color: fc }]} numberOfLines={1}>{hero.name}</Text>
        <Text style={S.cutInTrumpName} numberOfLines={2}>{hero.trumpCard?.name}</Text>
      </Animated.View>
    </Animated.View>
  );
}, (prev, next) => prev.hero === next.hero);

// ─── EnemyCutIn ───────────────────────────────────────────────────────────────
// Mirror of TrumpCutIn for elite enemies: the enemy portrait slams in from the
// RIGHT, a danger-red banner sweeps in from the LEFT, then it fades. Faster than
// the player's Trump cut-in since enemies act often. Same native-safe rules:
// entrances are transforms; the only opacity move is a fade-OUT from setValue(1).

const EnemyCutIn = React.memo(function EnemyCutIn({ enemy, onDone }) {
  const fade   = useRef(new Animated.Value(1)).current;
  const slideX = useRef(new Animated.Value(0)).current;  // portrait, from right
  const nameX  = useRef(new Animated.Value(0)).current;  // banner, from left

  useEffect(() => {
    if (!enemy) return;
    fade.setValue(1);
    slideX.setValue(W * 0.6);
    nameX.setValue(-W * 0.55);
    const seq = Animated.sequence([
      Animated.parallel([
        Animated.spring(slideX, { toValue: 0, friction: 6.5, tension: 85, useNativeDriver: true }),
        Animated.spring(nameX,  { toValue: 0, friction: 7,   tension: 70, useNativeDriver: true }),
      ]),
      Animated.delay(300),
      Animated.timing(fade, { toValue: 0, duration: 240, useNativeDriver: true }),
    ]);
    seq.start(({ finished }) => { if (finished) onDone?.(); });
    return () => seq.stop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enemy]);

  if (!enemy) return null;
  const isBoss = enemy.tier === 'boss';
  const accent = isBoss ? C.DANGER : C.SECONDARY;
  const imgSrc = enemy.imageKey && ENEMY_IMAGES[enemy.imageKey] ? ENEMY_IMAGES[enemy.imageKey] : null;
  // Fit the portrait frame to most of the screen height.
  const frameH = Math.min(SH * 0.80, 340);
  const frameW = Math.round(frameH * 0.82);

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, S.cutInRoot, { opacity: fade }]}>
      {/* dark vignette */}
      <View style={S.cutInBackdrop} />

      {/* diagonal danger band behind the portrait */}
      <View style={[S.enemyCutInBand, { backgroundColor: accent + '22', borderColor: accent }]} />

      {/* danger banner sweeps in from the left */}
      <Animated.View style={[S.enemyCutInTextWrap, { transform: [{ translateX: nameX }] }]}>
        <Text style={[S.cutInLabel, { color: accent, textAlign: 'right' }]}>
          {isBoss ? '☠  BOSS ASSAULT' : '⚠  ENEMY SKILL'}
        </Text>
        <View style={[S.cutInRule, S.enemyCutInRule, { backgroundColor: accent }]} />
        <Text style={[S.cutInHeroName, S.enemyCutInName, { color: accent }]} numberOfLines={1}>{enemy.name}</Text>
        <Text style={[S.cutInTrumpName, S.enemyCutInSkill]} numberOfLines={2}>{enemy._skillName}</Text>
      </Animated.View>

      {/* enemy portrait slams in from the right */}
      <Animated.View style={[S.enemyCutInCardWrap, { transform: [{ translateX: slideX }] }]}>
        <View style={[S.enemyCutInFrame, { width: frameW, height: frameH, borderColor: accent }]}>
          {imgSrc ? (
            <Image source={imgSrc} style={S.cutInFillImg} resizeMode="cover" />
          ) : (
            <View style={[S.cutInFillImg, S.cutInPortraitFb]}>
              <Text style={{ fontSize: 56 }}>👹</Text>
            </View>
          )}
          <LinearGradient colors={['transparent', C.BG_VOID]} style={S.enemyCutInFade} />
        </View>
      </Animated.View>
    </Animated.View>
  );
}, (prev, next) => prev.enemy === next.enemy);

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
  bgImage: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.55 },
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
  quitText:     { fontSize: 12, fontWeight: '800', color: C.TEXT, letterSpacing: 0.5 },

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
  hpBarBg:     { flex: 1, height: 5, backgroundColor: C.BG_BOTTOM, borderRadius: 3, overflow: 'hidden' },
  hpBarFill:   { height: 5, borderRadius: 3 },
  hpGhostFill: { position: 'absolute', top: 0, left: 0, height: 5, backgroundColor: C.WARNING, borderRadius: 3, opacity: 0.45 },

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
  switchHintText: { fontSize: 8, color: C.PRIMARY, fontWeight: '900', letterSpacing: 0.5 },

  targetBadge: {
    position: 'absolute', top: 4, left: 4,
    backgroundColor: C.GOLD_GLOW,
    borderRadius: 4, paddingHorizontal: 4, paddingVertical: 2,
    borderWidth: 1, borderColor: C.GOLD,
    zIndex: 10,
  },
  targetBadgeText: { fontSize: 8, color: C.GOLD, fontWeight: '900', letterSpacing: 0.5 },

  cardNameStrip: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: C.OVERLAY_4,
    paddingVertical: 3, paddingHorizontal: 4,
  },
  cardName: { fontSize: 8, color: C.TEXT, fontWeight: '700', textAlign: 'center' },

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
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.3,
  },

  stunStars: {
    position: 'absolute',
    top: 4, left: 0, right: 0,
    alignItems: 'center',
    zIndex: 16,
  },
  stunStarText: {
    fontSize: 11,
    fontWeight: '900',
    color: C.GOLD,
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
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
  floatHeal: {
    position: 'absolute',
    bottom: 22,
    alignSelf: 'center',
    fontSize: 14,
    fontWeight: '900',
    color: C.SUCCESS,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    zIndex: 21,
  },
  defeatedOv: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.SHIMMER,
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Full-screen impact flash ──
  screenFlash: {
    backgroundColor: C.FLASH_WHITE,
    zIndex: 40,
  },

  // ── Trump Card cinematic cut-in ──
  cutInRoot: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 50,
  },
  cutInBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.OVERLAY_VOID,
  },
  cutInBand: {
    position: 'absolute',
    left: -W * 0.1, right: -W * 0.1,
    height: Math.floor(SH * 0.46),
    borderTopWidth: 2, borderBottomWidth: 2,
    transform: [{ rotate: '-8deg' }],
  },
  cutInCardWrap: {
    marginLeft: Math.floor(W * 0.06),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cutInTextWrap: {
    flex: 1,
    paddingLeft: Math.floor(W * 0.05),
    paddingRight: Math.floor(W * 0.06),
  },
  cutInLabel: {
    fontSize: 12, fontWeight: '900', letterSpacing: 4,
    color: C.TEXT_ON_DARK_MUTED,
  },
  cutInRule: {
    width: 54, height: 3, borderRadius: 2,
    marginTop: 8, marginBottom: 10,
  },
  cutInHeroName: {
    fontSize: 16, fontWeight: '800', letterSpacing: 1,
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  cutInTrumpName: {
    fontSize: Math.min(34, Math.floor(SH * 0.095)),
    fontWeight: '900', letterSpacing: 0.5,
    color: C.TEXT,
    textShadowColor: 'rgba(0,0,0,0.85)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  cutInPortraitFb: { backgroundColor: C.BG_MID, alignItems: 'center', justifyContent: 'center' },
  cutInFillImg:    { width: '100%', height: '100%' },

  // ── Enemy skill cut-in (mirror: portrait right, banner left, danger red) ──
  enemyCutInBand: {
    position: 'absolute',
    left: -W * 0.1, right: -W * 0.1,
    height: Math.floor(SH * 0.46),
    borderTopWidth: 2, borderBottomWidth: 2,
    transform: [{ rotate: '8deg' }],
  },
  enemyCutInTextWrap: {
    flex: 1,
    alignItems: 'flex-end',
    paddingRight: Math.floor(W * 0.05),
    paddingLeft: Math.floor(W * 0.06),
  },
  enemyCutInRule:  { alignSelf: 'flex-end' },
  enemyCutInName:  { textAlign: 'right' },
  enemyCutInSkill: { textAlign: 'right' },
  enemyCutInCardWrap: {
    marginRight: Math.floor(W * 0.06),
    alignItems: 'center',
    justifyContent: 'center',
  },
  enemyCutInFrame: {
    borderRadius: 14,
    borderWidth: 2.5,
    overflow: 'hidden',
    backgroundColor: C.BG_MID,
  },
  enemyCutInFade: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    height: '38%',
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
  pillBtnLabel:    { fontSize: 11, fontWeight: '800', color: C.TEXT, letterSpacing: 0.2 },
  pillBtnLabelDim: { color: C.TEXT_DISABLED },
  pillBtnSub:      { fontSize: 8, color: C.TEXT_ON_DARK, fontWeight: '600', marginTop: 1 },
  pillBtnSubDim:   { color: C.TEXT_ON_DARK_DIM },

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
    backgroundColor: C.OVERLAY_VOID,
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
    fontSize: 16, fontWeight: '900', color: C.TEXT,
    letterSpacing: 3.5, textAlign: 'center', marginBottom: 2,
  },
  tutSub: {
    fontSize: 9, color: C.TEXT_ON_DARK_MUTED,
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
  tutRowLabel: { fontSize: 11, fontWeight: '800', color: C.TEXT, letterSpacing: 0.3 },
  tutRowDesc:  { fontSize: 9, color: C.TEXT_ON_DARK_SOFT, marginTop: 1 },
  tutBtn:      { borderRadius: 10, overflow: 'hidden' },
  tutBtnInner: { paddingVertical: 12, alignItems: 'center' },
  tutBtnTxt:   { fontSize: 12, fontWeight: '900', color: C.TEXT, letterSpacing: 1.5 },
});
