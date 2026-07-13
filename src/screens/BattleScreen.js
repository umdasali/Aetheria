import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Image, Modal, Alert, Dimensions, BackHandler, useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
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
import { rs, rf } from '../theme/scale';
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

// Cycle used only for the Tower (no per-floor theme to honour)
const BG_CYCLE = ['emberveil', 'glaciara', 'sunspire', 'verdania', 'voidmark', 'khemara'];

// Per-chapter battlefield theme (chapter number 1-25 → background key).
// Matches each chapter's actual story theme rather than an arbitrary cycle.
const CHAPTER_BG = {
  1:  'glaciara',  // Shattered Veil — ice scouts invade
  2:  'emberveil', // Ashen Inferno — fire drakes
  3:  'sunspire',  // Dawn of Radiance — sacred light shrines
  4:  'verdania',  // Thornwall — twisted ancient forest
  5:  'verdania',  // Verdant Ruin — bloom corruption of nature
  6:  'voidmark',  // Shadowbloom — darkness claims nature's crown
  7:  'voidmark',  // Abyssal Gate — the abyss tears reality open
  8:  'sunspire',  // Eclipse Rising — radiant light dragon
  9:  'sunspire',  // Celestial Fracture — the celestial realm
  10: 'voidmark',  // Void Queen's Reign — corrupted queen
  11: 'emberveil', // Titan's March — titan army burns everything
  12: 'voidmark',  // Time's End — the god of time unmakes the timeline
  13: 'glaciara',  // Eternal Winter — permanent ice
  14: 'emberveil', // Crimson Empire — blood empress
  15: 'voidmark',  // World's Last Hour — the World Eater
  16: 'voidmark',  // Cathedral of Chains — blood and shadow
  17: 'khemara',   // The Hollow Crown — erased king's domain
  18: 'sunspire',  // Divided Heaven — divine light and darkness
  19: 'khemara',   // The Living Archive — ancient library labyrinth
  20: 'voidmark',  // Before the First Breath — the dreaming entity
  21: 'voidmark',  // Shadow Sovereign — the shadow realm
  22: 'voidmark',  // The Cosmic Weave — rewriting reality from a star
  23: 'glaciara',  // Demon Glacier — ice demon's frost
  24: 'emberveil', // The Elder Crimson — the crimson bloodline
  25: 'voidmark',  // The First Entity — predates the gods and the void
};

function getBattleBg(dungeonMode, dungeonId, towerMode, towerFloor, chapterId) {
  if (dungeonMode && dungeonId) return BATTLE_BG[DUNGEON_BG_KEY[dungeonId] || 'voidmark'];
  if (towerMode)   return BATTLE_BG[BG_CYCLE[(towerFloor - 1) % 6]];
  if (chapterId) {
    const chapterNum = Math.floor(chapterId / 100);
    return BATTLE_BG[CHAPTER_BG[chapterNum] || 'emberveil'];
  }
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

// ── Pacing (all divided by the active battle speed: 1× / 2× / 3×) ─────────────
const AI_DELAY_MS     = 350;  // "thinking" beat before the enemy acts
const POST_ACTION_MS  = 250;  // beat after the player's action before the enemy turn
const RESULT_DELAY_MS = 700;  // pause before navigating to Victory/defeat

// Battle speed persists across battles within a session (not across app restarts).
let _lastSpeed = 1;

// ── Landscape layout ──────────────────────────────────────────────────────────
const SIDE_PAD = 8;
const CARD_GAP = 6;
const SIDE_W   = Math.floor(W / 2) - SIDE_PAD * 2;
const CARD_W   = Math.floor((SIDE_W - CARD_GAP * 2) / 3 * 0.76);
// Explicit margin between the three battle cards. Screen-proportional so it scales,
// and wide enough to clear a card's 1.15× attack-scale + lunge without overlapping a
// neighbour. Applied as the cardRow flex `gap`.
const CARD_MARGIN = Math.max(12, Math.round(SIDE_W * 0.045));
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
// overlayTint: absoluteFill card tint while active. pulseMin/Max/Ms: anim range + half-period.
const STATUS_DISPLAY = {
  burn:    { label: 'BRN',  icon: '🔥', color: C.WARNING,  overlayTint: C.WARNING + '38',   pulseMin: 0.15, pulseMax: 0.55, pulseMs: 550  },
  poison:  { label: 'PSN',  icon: '☠',  color: C.SUCCESS,  overlayTint: C.SUCCESS + '2E',   pulseMin: 0.12, pulseMax: 0.38, pulseMs: 800  },
  chill:   { label: 'CHI',  icon: '❄',  color: C.CYAN,     overlayTint: C.CYAN + '29',      pulseMin: 0.10, pulseMax: 0.30, pulseMs: 1100 },
  shatter: { label: 'DEF-', icon: '💢', color: C.DANGER,   overlayTint: C.DANGER + '24',    pulseMin: 0.10, pulseMax: 0.28, pulseMs: 900  },
  weaken:  { label: 'ATK-', icon: '⬇',  color: C.PRIMARY,  overlayTint: C.PRIMARY + '29',   pulseMin: 0.10, pulseMax: 0.28, pulseMs: 950  },
  stun:    { label: 'STN',  icon: '⚡', color: C.GOLD,     overlayTint: C.GOLD + '42',      pulseMin: 0.25, pulseMax: 0.65, pulseMs: 380  },
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

  // Live screen dimensions — recalculated on resize (Expo web, tablet rotation, etc.)
  const { width: dynW, height: dynH } = useWindowDimensions();
  const dynSideW      = Math.floor(dynW / 2) - SIDE_PAD * 2;
  const dynCardW      = Math.floor((dynSideW - CARD_GAP * 2) / 3 * 0.76);
  const dynCardMargin = Math.max(12, Math.round(dynSideW * 0.045));
  const dynCardH      = Math.min(Math.max(60, Math.floor(dynH * 0.36)), 200);
  const dynPillH      = Math.min(Math.max(38, Math.floor(dynH * 0.10)), 62);

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
  // Shared enemy energy pool — mirrors the player's single energy bar (whichever
  // enemy acts this turn draws from / feeds this one pool).
  const [enemyEnergy,    setEnemyEnergy]    = useState(0);
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
  // Battle speed: 1 | 2 | 3. Mirrored into a ref so async timers read the latest.
  const [speed,          setSpeed]          = useState(_lastSpeed);

  const aiRunning       = useRef(false);
  const resultTimerRef  = useRef(null);
  const phaseTimerRef   = useRef(null);
  // Round-robin pointer so each enemy phase a different living enemy acts.
  const enemyActorRef   = useRef(-1);
  const speedRef        = useRef(speed);
  speedRef.current = speed;  // keep enemy-phase / result timers reading the live speed

  const cycleSpeed = useCallback(() => {
    setSpeed((s) => { const n = s >= 3 ? 1 : s + 1; _lastSpeed = n; return n; });
  }, []);
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
  useEffect(() => () => { clearTimeout(resultTimerRef.current); clearTimeout(phaseTimerRef.current); }, []);

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
      // 5-stage decreasing shake — physical impact decay
      Animated.sequence([
        Animated.timing(a.shake, { toValue:  12, duration: 36, useNativeDriver: true }),
        Animated.timing(a.shake, { toValue: -10, duration: 36, useNativeDriver: true }),
        Animated.timing(a.shake, { toValue:   7, duration: 32, useNativeDriver: true }),
        Animated.timing(a.shake, { toValue:  -4, duration: 32, useNativeDriver: true }),
        Animated.timing(a.shake, { toValue:   0, duration: 32, useNativeDriver: true }),
      ]),
      // Hard flash onset, slow fade
      Animated.sequence([
        Animated.timing(a.flash, { toValue: 0.95, duration: 48,  useNativeDriver: true }),
        Animated.timing(a.flash, { toValue: 0,    duration: 340, useNativeDriver: true }),
      ]),
      // Scale punch: compress → spring back — feels like absorbing the blow
      Animated.sequence([
        Animated.timing(a.scale, { toValue: 0.86, duration: 52, useNativeDriver: true }),
        Animated.spring(a.scale, { toValue: 1.0, friction: 4, tension: 220, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const triggerAttack = useCallback((anims, idx, direction = 0) => {
    const a = anims[Math.min(idx, 2)];
    if (!a) return;
    const animations = [
      // Bigger pop: 1.15 surge with a quick snap back
      Animated.sequence([
        Animated.timing(a.scale, { toValue: 1.15, duration: 75,  useNativeDriver: true }),
        Animated.timing(a.scale, { toValue: 1.0,  duration: 140, useNativeDriver: true }),
      ]),
    ];
    if (direction !== 0 && a.lungeX) {
      // Faster lunge out, decisive snap back. Kept modest (14px) so lunge + the 1.15×
      // scale together still fit within the inter-card spacing and never overlap a neighbour.
      animations.push(Animated.sequence([
        Animated.timing(a.lungeX, { toValue: direction * 14, duration: 65,  useNativeDriver: true }),
        Animated.timing(a.lungeX, { toValue: 0,              duration: 120, useNativeDriver: true }),
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
    }, Math.round(RESULT_DELAY_MS / (speedRef.current || 1)));
  }, [navigation, chapterId, chapterRewards, chapterEnemies, fromStory, practiceMode]);

  const checkEnd = useCallback((players, enemies) => {
    // Player wipe is checked first: both teams' DOTs tick in the same phase
    // before this runs, so a simultaneous wipe must not resolve as a win.
    if (allDefeated(players)) {
      showResult('lose', { wasReplay: false, xpGained: 0, towerMode, towerFloor, towerRewards, dungeonMode, dungeonRewards });
      return true;
    }
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

  // First living hero that is NOT stunned (can actually take an action this turn).
  const firstActable = (arr) => {
    for (let i = 0; i < arr.length; i++) if (arr[i].currentHp > 0 && (arr[i].stunned || 0) <= 0) return i;
    return -1;
  };

  // Prefer the player's currently-chosen hero if still alive AND not stunned; otherwise
  // hand control to the first actable hero, falling back to the first living hero so a
  // fully-stunned team still resolves (the stun-skip effect then auto-passes the turn).
  const nextPlayerIdx = (arr, preferred) => {
    if (preferred < arr.length && arr[preferred].currentHp > 0 && (arr[preferred].stunned || 0) <= 0) return preferred;
    const actable = firstActable(arr);
    return actable >= 0 ? actable : firstLiving(arr);
  };

  // ── Enemy AI ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isEnemyTurn || battleResult) return;
    // Don't start the enemy turn while a Trump Card cut-in is still playing —
    // wait for onDone to clear trumpCutIn, then this effect re-fires cleanly.
    if (trumpCutIn) return;
    if (aiRunning.current) return;

    aiRunning.current = true;
    setIsAnimating(true);

    const spd     = Math.max(1, speedRef.current || 1);
    const aiDelay = Math.round(AI_DELAY_MS / spd);

    const timer = setTimeout(() => {
      // Mutable working copies for this phase (state is async; carry our own).
      let curEnemies = enemyTeam.map((e) => ({ ...e }));
      let curPlayers = playerTeam.map((p) => ({ ...p, lastDamage: 0 }));

      // ── Phase start: enemy DOTs/expiry, enrage, player regen (once) ─────────
      const dotMsgs = [];
      curEnemies = curEnemies.map((e, i) => {
        // Must tick even with an empty statusEffects list — regen (BLESSING and
        // friends) is driven by e.effect directly inside processStatusEffects,
        // not by an active debuff, so gating on statusEffects.length silently
        // starved every regen-passive enemy of its heal.
        if (e.currentHp <= 0) return e;
        const dotType = (e.statusEffects || []).find(fx => fx.type === 'burn') ? 'burn'
                      : (e.statusEffects || []).find(fx => fx.type === 'poison') ? 'poison'
                      : null;
        const { unit, dotDamage, messages } = processStatusEffects(e);
        dotMsgs.push(...messages);
        if (dotDamage > 0) {
          setTimeout(() => triggerHit(enemyAnims, i), 60);
          return {
            ...unit,
            lastDotDamage: dotDamage,
            dotKey:        (e.dotKey || 0) + 1,
            dotType,
            lastDamage:    0,
          };
        }
        return unit;
      });
      const enr = applyEnrage(curEnemies);
      curEnemies = enr.team;
      if (enr.msg) dotMsgs.unshift(enr.msg);
      curPlayers = curPlayers.map((p) => (p.currentHp <= 0 ? p : processStatusEffects(p).unit));

      // Helper: end the phase (commit a state, hand control back to the player).
      // stunDecrement runs once per ROUND for every stunned enemy, so a 2-stack
      // always clears in exactly two rounds — the count visibly ticks down.
      const finishPhase = (enemies, players, message) => {
        const ticked = enemies.map((e) =>
          (e.stunned || 0) > 0 ? { ...e, stunned: e.stunned - 1 } : e
        );
        setEnemyTeam(ticked);
        setPlayerTeam(players);
        if (message) setStatusMsg(message);
        if (!checkEnd(players, ticked)) {
          const nextIdx = nextPlayerIdx(players, currentTurnIdx);
          setCurrentTurnIdx(nextIdx);
          // Chill halves this round's energy gain — symmetric with the enemy-side
          // rule (chill previously only ever slowed the acting enemy's own energy).
          const nextChilled = (players[nextIdx]?.statusEffects || []).some((fx) => fx.type === 'chill');
          setEnergy((p) => Math.min(MAX_ENERGY, p + (nextChilled ? Math.floor(ENERGY_PER_TURN * 0.5) : ENERGY_PER_TURN)));
          setTurnNumber((t) => t + 1);
          setIsEnemyTurn(false);
        }
        aiRunning.current = false;
        setIsAnimating(false);
      };

      // A DOT tick may have ended the battle before any enemy acts.
      if (checkEnd(curPlayers, curEnemies)) {
        setEnemyTeam(curEnemies);
        setPlayerTeam(curPlayers);
        if (dotMsgs.length > 0) setStatusMsg(dotMsgs[0]);
        aiRunning.current = false;
        setIsAnimating(false);
        return;
      }

      // ── Pick ONE actor (round-robin), skipping stunned enemies so the team
      //    still acts while a stunned enemy waits out its turns. ──────────────
      const len = curEnemies.length;
      let actorIdx = -1;
      for (let k = 1; k <= len; k++) {
        const idx = (enemyActorRef.current + k) % len;
        const e = curEnemies[idx];
        if (e?.currentHp > 0 && (e.stunned || 0) <= 0) { actorIdx = idx; break; }
      }

      // Every living enemy is stunned (or none left) → enemy team forfeits the
      // round, but stuns still tick down so the lock can't last forever.
      if (actorIdx < 0) {
        const stunnedName = curEnemies.find((e) => e.currentHp > 0 && (e.stunned || 0) > 0)?.name;
        finishPhase(curEnemies, curPlayers, stunnedName ? `${stunnedName} is stunned!` : (dotMsgs[0] || ''));
        return;
      }
      enemyActorRef.current = actorIdx;
      const actor = curEnemies[actorIdx];

      // Shared enemy energy pool: this turn's actor draws from / feeds it.
      // Chill on the acting enemy halves the round's energy gain.
      const chilled     = (actor.statusEffects || []).some((fx) => fx.type === 'chill');
      const energyGain  = chilled ? Math.floor(ENEMY_ENERGY_TURN * 0.5) : ENEMY_ENERGY_TURN;
      const actorEnergy = Math.min(MAX_ENERGY, enemyEnergy + energyGain);

      const actorHpRatio = actor.maxHp > 0 ? actor.currentHp / actor.maxHp : 1.0;
      const aiAction = getSmartAIAction(actor, curPlayers, actorEnergy, ENEMY_SKILL_COSTS, actor.tier || 'mob', actorHpRatio);

      // No action / chosen target already gone → bank energy and end the round.
      const target = aiAction ? curPlayers[aiAction.targetIdx] : null;
      if (!aiAction || !target || target.currentHp <= 0) {
        setEnemyEnergy(actorEnergy);
        finishPhase(curEnemies, curPlayers, dotMsgs[0] || '');
        return;
      }

      const targetIdx = aiAction.targetIdx;
      let msg = dotMsgs[0] || '';
      let energyAfter = actorEnergy;
      let lastDmg = 0;

      if (aiAction.action === 'attack') {
        const { damage, isCrit, blocked, dodged } = calculateDamage(actor, target, 1.0);
        if (blocked) {
          curPlayers[targetIdx] = { ...curPlayers[targetIdx], shield: Math.max(0, curPlayers[targetIdx].shield - 1) };
          msg = `${target.name}'s shield blocked!`;
        } else if (dodged) {
          msg = `${target.name} dodged ${actor.name}'s attack!`;
        } else {
          curPlayers[targetIdx] = {
            ...curPlayers[targetIdx],
            currentHp:  Math.max(0, curPlayers[targetIdx].currentHp - damage),
            lastDamage: damage, lastCrit: isCrit,
            damageKey:  (curPlayers[targetIdx].damageKey || 0) + 1,
          };
          // Enemy effects (burn/poison/chill/shatter/weaken/stun) now actually proc on
          // the player — basic attack = 25% chance via applyOnHitDebuff.
          curPlayers[targetIdx] = applyOnHitDebuff(actor, curPlayers[targetIdx], false);
          if (EFFECT_MECHANICS[actor.effect] === 'lifedrain') {
            const drain = Math.floor(damage * 0.15);
            curEnemies[actorIdx] = { ...curEnemies[actorIdx], currentHp: Math.min(curEnemies[actorIdx].maxHp, curEnemies[actorIdx].currentHp + drain) };
          }
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
          if (actor.tier === 'boss' || actor.tier === 'mini-boss') {
            setEnemyCutIn({ ...actor, _skillName: skill.name });
            triggerShake(10);
          }
          const { damage, isCrit, blocked, dodged } = calculateDamage(actor, target, skill.damage);
          if (blocked) {
            curPlayers[targetIdx] = { ...curPlayers[targetIdx], shield: Math.max(0, curPlayers[targetIdx].shield - 1) };
            msg = `${target.name}'s shield blocked ${skill.name}!`;
          } else if (dodged) {
            msg = `${target.name} dodged ${skill.name}!`;
          } else {
            curPlayers[targetIdx] = {
              ...curPlayers[targetIdx],
              currentHp:  Math.max(0, curPlayers[targetIdx].currentHp - damage),
              lastDamage: damage, lastCrit: isCrit,
              damageKey:  (curPlayers[targetIdx].damageKey || 0) + 1,
            };
            // Enemy skills proc their effect at 50% (matches the player skill rate).
            curPlayers[targetIdx] = applyOnHitDebuff(actor, curPlayers[targetIdx], true);
            if (EFFECT_MECHANICS[actor.effect] === 'lifedrain') {
              const drain = Math.floor(damage * 0.15);
              curEnemies[actorIdx] = { ...curEnemies[actorIdx], currentHp: Math.min(curEnemies[actorIdx].maxHp, curEnemies[actorIdx].currentHp + drain) };
            }
            lastDmg = damage;
            msg = `${actor.name}: ${skill.name}${isCrit ? ' — CRIT!' : ''}`;
            setTimeout(() => triggerHit(playerAnims, targetIdx), 80);
            triggerAttack(enemyAnims, actorIdx, 1);
            if (isCrit) { triggerScreenFlash(0.28); triggerShake(6); }
          }
          energyAfter = Math.max(0, actorEnergy - skillCost + 15);
        }
      }

      // Commit the shared pool.
      setEnemyEnergy(energyAfter);

      // Thornstrike reflect: hit player with thornstrike reflects 15% back.
      if (lastDmg > 0 && EFFECT_MECHANICS[target.effect] === 'thornstrike') {
        const reflect = Math.floor(lastDmg * 0.15);
        curEnemies = curEnemies.map((e, i) =>
          i === actorIdx ? { ...e, currentHp: Math.max(0, e.currentHp - reflect) } : e
        );
        msg += ` (reflected ${reflect})`;
      }

      finishPhase(curEnemies, curPlayers, msg);
    }, aiDelay);

    // Release the claim if this effect is torn down before the timer fires (e.g. a
    // Trump Card cut-in appears mid-flight, changing the trumpCutIn dependency below
    // before this timer resolves) — otherwise aiRunning stays true forever and the
    // enemy turn can never be picked up again once the blocker clears.
    return () => { clearTimeout(timer); aiRunning.current = false; };
  // Intentional stale closure: only re-trigger when the turn flips, the battle ends,
  // or the Trump Card cut-in clears (trumpCutIn: non-null → null triggers the AI start).
  // Including playerTeam/enemyTeam would re-fire mid-turn as those are mutated here.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEnemyTurn, battleResult, trumpCutIn]);

  // ── Player action ─────────────────────────────────────────────────────────

  const executeAction = useCallback((actionType, skillIdx = 0) => {
    if (isEnemyTurn || isAnimating || battleResult || enemyCutIn) return;
    const hero = playerTeam[currentTurnIdx];
    if (!hero || hero.currentHp <= 0) return;
    // A stunned hero can't act — the player must switch to an unstunned hero
    // (or, if the whole team is stunned, the stun-skip effect auto-passes the turn).
    if ((hero.stunned || 0) > 0) { setStatusMsg(`${hero.name} is stunned!`); return; }

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
        // Defensive skills (guards/walls/armour/wards) grant the caster a shield charge.
        // Broadened from the old shield|absorb|barrier|deflect set so the ~10 "guard/
        // armour/reduce incoming damage" skills actually shield instead of falling through
        // to a heal. Verified against every damage:0 skill: no heal/buff matches this set.
        if (/shield|absorb|barrier|deflect|armou?r|\bward\b|nullif|reduc|defens|block/.test(desc)) {
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
      // Signature moment: shake + blinding flash FIRST, then cut-in slides in
      // through the fading brightness — identical to the summon reveal design.
      const hd = getHeroData(hero.id);
      const cutInRank = hero.sovereign ? 'SOVEREIGN' : (hd?.effectiveRank || hero.rank);
      triggerShake(18);
      triggerScreenFlash(0.82);
      setTimeout(() => setTrumpCutIn({ ...hero, _effRank: cutInRank }), 160);
      trackQuestProgress('use_trump');
      trackAchievementProgress('trumpCardsUsed', 1);
    }

    // ── Boss enrage check (player-action path; DOT path checks separately) ────
    const enr = applyEnrage(ne);
    ne = enr.team;
    if (enr.msg) msg = enr.msg;

    // ── Turn limit ──────────────────────────────────────────────────────────────
    const newTurnCount = turnCount + 1;

    // One round has passed — tick down any player stuns (symmetric with the
    // per-round enemy stun decrement in finishPhase).
    np = np.map((p) => ((p.stunned || 0) > 0 ? { ...p, stunned: p.stunned - 1 } : p));

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
    }, Math.round(POST_ACTION_MS / (speedRef.current || 1)));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEnemyTurn, isAnimating, battleResult, enemyCutIn, playerTeam, enemyTeam,
      energy, currentTurnIdx, selectedEnemy, turnCount,
      towerMode, towerFloor, towerRewards, dungeonMode, dungeonRewards,
      checkEnd, triggerHit, triggerAttack, triggerShake, triggerScreenFlash,
      trackQuestProgress, trackAchievementProgress, showResult]);

  // ── Player stun-skip ────────────────────────────────────────────────────
  // If it's the player's turn and EVERY living hero is stunned, no action is
  // possible — auto-pass the turn (ticking the stuns down) so a player-side stun
  // can never soft-lock the battle. If only some heroes are stunned, steer
  // control to one that can act.
  //
  // isAnimating/playerTeam are deliberately excluded from the deps array below.
  // This body sets both itself (setIsAnimating(true), setPlayerTeam(...)) to start
  // the forfeit delay — if they were dependencies, React would tear down this very
  // effect instance the moment they change (i.e. on the next render, well before the
  // delay elapses), cancelling the forfeit timer before it ever fires and leaving
  // isAnimating stuck at true forever. Same stale-closure reasoning as the enemy-side
  // AI effect above, for the same reason: don't watch state this effect itself sets.
  useEffect(() => {
    if (isEnemyTurn || battleResult || isAnimating || enemyCutIn) return;
    if (!playerTeam.length) return;
    const living = playerTeam.filter((p) => p.currentHp > 0);
    if (!living.length) return;

    if (living.some((p) => (p.stunned || 0) <= 0)) {
      // At least one hero can act — make sure the active slot isn't stunned/dead.
      const active = playerTeam[currentTurnIdx];
      if (!active || active.currentHp <= 0 || (active.stunned || 0) > 0) {
        const idx = playerTeam.findIndex((p) => p.currentHp > 0 && (p.stunned || 0) <= 0);
        if (idx >= 0 && idx !== currentTurnIdx) setCurrentTurnIdx(idx);
      }
      return;
    }

    // Whole team stunned → skip the player's turn (and tick the stuns).
    setStatusMsg('Your team is stunned!');
    setPlayerTeam((prev) => prev.map((p) => ((p.stunned || 0) > 0 ? { ...p, stunned: p.stunned - 1 } : p)));
    setIsAnimating(true);
    const t = setTimeout(() => {
      setIsAnimating(false);
      setIsEnemyTurn(true);
    }, Math.round(700 / (speedRef.current || 1)));
    // Defensively release isAnimating too, in case this instance is torn down
    // before the timer fires — otherwise input stays locked with no way to recover.
    return () => { clearTimeout(t); setIsAnimating(false); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEnemyTurn, battleResult, enemyCutIn, currentTurnIdx]);

  // ── Rehydration guard — brief spinner while AsyncStorage loads ───────────

  if (!hydrated) {
    return (
      <LinearGradient colors={C.GRAD_BG} style={[S.root, S.center]}>
        <Ionicons name="sync" size={rs(32)} color={C.PRIMARY_LIGHT} />
      </LinearGradient>
    );
  }

  // ── No-team guard ─────────────────────────────────────────────────────────

  if (!playerTeam.length) {
    return (
      <LinearGradient colors={C.GRAD_BG} style={[S.root, S.center]}>
        <Ionicons name="warning" size={rs(44)} color={C.GOLD} />
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
      <Image source={battleBg} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <LinearGradient colors={C.GRAD_BATTLE} style={StyleSheet.absoluteFill} />

      <View style={S.safe}>

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

          {/* Battle-speed toggle: cycles 1× → 2× → 3× */}
          <TouchableOpacity
            style={[S.speedBtn, speed > 1 && S.speedBtnActive]}
            onPress={cycleSpeed}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={`Battle speed ${speed} times, tap to change`}
          >
            <Ionicons name="play-forward" size={rs(19)} color={speed > 1 ? C.GOLD : C.TEXT_MUTED} />
            <Text style={[S.speedBtnTxt, speed > 1 && { color: C.GOLD }]}>{speed}×</Text>
          </TouchableOpacity>

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

            {/* Shared enemy energy + skill-intent telegraph (mirrors player's bar) */}
            <View style={S.enTeamEnergyRow}>
              <Text style={S.enTeamEnergyLbl}>⚡ {enemyEnergy}</Text>
              <View style={S.enTeamEnergyBg}>
                <LinearGradient
                  colors={enemyEnergy >= ENEMY_SKILL_COSTS[0] ? C.GRAD_GOLD : [C.SECONDARY_DARK, C.SECONDARY]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={[S.enTeamEnergyFill, { width: `${Math.min(100, enemyEnergy)}%` }]}
                />
              </View>
              {enemyEnergy >= ENEMY_SKILL_COSTS[0] && (
                <View style={S.enTeamIntent}>
                  <Ionicons name="flash" size={rs(18)} color={C.GOLD} />
                  <Text style={S.enTeamIntentTxt}>SKILL</Text>
                </View>
              )}
            </View>

            <View style={[S.cardRow, { gap: dynCardMargin }]}>
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
                  cardW={dynCardW}
                  cardH={dynCardH}
                />
              ))}
            </View>
          </View>

          {/* — Divider — */}
          <View style={S.divider} />

          {/* — Player side — */}
          <View style={S.teamSide}>
            <Text style={[S.teamLabel, { color: C.PRIMARY }]}>YOUR TEAM</Text>
            <View style={[S.cardRow, { gap: dynCardMargin }]}>
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
                  cardW={dynCardW}
                  cardH={dynCardH}
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
                      pillH={dynPillH}
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
                        pillH={dynPillH}
                      />
                    ) : (
                      <PillBtn
                        label="No Skill"
                        sub="—"
                        colors={[C.TEXT_DISABLED, C.TEXT_MUTED]}
                        onPress={() => {}}
                        disabled
                        dimmed
                        pillH={dynPillH}
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
                        pillH={dynPillH}
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
                      pillH={dynPillH}
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

      </View>

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
    prev.unit.currentHp     === next.unit.currentHp     &&
    prev.unit.damageKey     === next.unit.damageKey      &&
    prev.unit.lastDamage    === next.unit.lastDamage     &&
    prev.unit.lastCrit      === next.unit.lastCrit       &&
    prev.unit.healKey       === next.unit.healKey        &&
    prev.unit.dotKey        === next.unit.dotKey         &&
    prev.unit.shield        === next.unit.shield         &&
    prev.unit.stunned       === next.unit.stunned        &&
    prev.isActive           === next.isActive            &&
    prev.isSelected         === next.isSelected          &&
    prev.canSwitch          === next.canSwitch           &&
    prev.side               === next.side                &&
    prev.cardW              === next.cardW               &&
    prev.cardH              === next.cardH               &&
    _fxKey(prev.unit.statusEffects) === _fxKey(next.unit.statusEffects)
  );
}

// Spring-in badge — each badge pops to scale(1) from scale(0) when first mounted.
function BadgePill({ cfg, label }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 140, useNativeDriver: true }).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <View style={[S.statusEffectBadge, { backgroundColor: cfg.color + '33', borderColor: cfg.color }]}>
        <Text style={[S.statusEffectText, { color: cfg.color }]}>{label}</Text>
      </View>
    </Animated.View>
  );
}

const BattleCard = React.memo(function BattleCard({ unit, side, isActive, isSelected, factionColor, shakeAnim, flashAnim, scaleAnim, lungeAnim, onPress, canSwitch, accessibilityLabel, accessibilityRole, cardW: propCardW, cardH: propCardH }) {
  const cardW = propCardW ?? CARD_W;
  const cardH = propCardH ?? CARD_H;
  // Stable fallback Animated values so we never create new objects in render
  const _shake  = useRef(new Animated.Value(0)).current;
  const _scale  = useRef(new Animated.Value(1)).current;
  const _lungeX = useRef(new Animated.Value(0)).current;

  const hpRatio  = unit.maxHp > 0 ? Math.max(0, unit.currentHp / unit.maxHp) : 0;
  const defeated = unit.currentHp <= 0;

  // Gentle vertical float on the active hero — signals whose turn it is
  const floatAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!isActive || defeated) { floatAnim.setValue(0); return; }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(floatAnim, { toValue: -5, duration: 850, useNativeDriver: true }),
      Animated.timing(floatAnim, { toValue:  0, duration: 850, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [isActive, defeated, floatAnim]);

  // Death animation — scale down + fade when HP hits 0 (plays once per defeat)
  const deathAlpha = useRef(new Animated.Value(1)).current;
  const deathScale = useRef(new Animated.Value(1)).current;
  const wasDefeated = useRef(false);
  useEffect(() => {
    if (defeated && !wasDefeated.current) {
      wasDefeated.current = true;
      Animated.parallel([
        Animated.timing(deathAlpha, { toValue: 0.32, duration: 480, useNativeDriver: true }),
        Animated.timing(deathScale, { toValue: 0.84, duration: 380, useNativeDriver: true }),
      ]).start();
    } else if (!defeated) {
      wasDefeated.current = false;
      deathAlpha.setValue(1);
      deathScale.setValue(1);
    }
  }, [defeated, deathAlpha, deathScale]);

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

  // Primary status → config. Stun wins; otherwise the first active effect.
  const stunned       = (unit.stunned || 0) > 0;
  const primaryFx     = (unit.statusEffects || [])[0];
  const primaryFxType = stunned ? 'stun' : (primaryFx?.type ?? null);
  const primaryFxCfg  = primaryFxType ? STATUS_DISPLAY[primaryFxType] : null;
  const statusColor   = primaryFxCfg?.color ?? null;

  // Pulsing tint overlay — per-status timing and opacity range.
  const glowPulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!primaryFxCfg || defeated) { glowPulse.setValue(0); return; }
    glowPulse.setValue(primaryFxCfg.pulseMin);
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(glowPulse, { toValue: primaryFxCfg.pulseMax, duration: primaryFxCfg.pulseMs, useNativeDriver: true }),
      Animated.timing(glowPulse, { toValue: primaryFxCfg.pulseMin, duration: primaryFxCfg.pulseMs, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [primaryFxType, defeated, glowPulse]);

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

  // One-shot colored flash when a new status is applied to this unit.
  const statusFlash      = useRef(new Animated.Value(0)).current;
  const statusFlashColor = useRef(null);
  const prevFxKey        = useRef('');
  const currentFxKey     = _fxKey(unit.statusEffects);
  useEffect(() => {
    const prev = prevFxKey.current;
    prevFxKey.current = currentFxKey;
    if (!currentFxKey || defeated) return;
    const prevCount = prev.split(',').filter(Boolean).length;
    const currCount = currentFxKey.split(',').filter(Boolean).length;
    if (currCount > prevCount && (unit.statusEffects || []).length > 0) {
      const newest = unit.statusEffects[unit.statusEffects.length - 1];
      const cfg = newest ? STATUS_DISPLAY[newest.type] : null;
      if (cfg) {
        statusFlashColor.current = cfg.overlayTint;
        statusFlash.setValue(1);
        Animated.timing(statusFlash, { toValue: 0, duration: 350, useNativeDriver: true }).start();
        AudioManager.playStatusSFX(newest.type);
      }
    }
  }, [currentFxKey, defeated]);

  // One-shot green flash when a heal lands.
  const healFlash = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!unit.healKey) return;
    healFlash.setValue(0.85);
    Animated.timing(healFlash, { toValue: 0, duration: 500, useNativeDriver: true }).start();
  }, [unit.healKey]);

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
      style={[S.cardTouch, { width: cardW }]}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={onPress ? (accessibilityRole ?? 'button') : undefined}
    >

      {/* HP number */}
      <Text style={[S.hpNumber, { color: side === 'enemy' ? C.SECONDARY : C.PRIMARY }]}>
        {unit.currentHp}
      </Text>

      {/* HP label + bar */}
      <View style={[S.hpBarRow, { width: cardW }]}>
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
          width: cardW, height: cardH,
          borderColor: cardBorderColor,
          borderWidth: isSelected || isActive ? 2.5 : 1,
          opacity: deathAlpha,
          transform: [
            { translateX: shakeAnim ?? _shake },
            { translateX: lungeAnim ?? _lungeX },
            { translateY: floatAnim },
            { scale:      scaleAnim ?? _scale },
            { scale:      deathScale },
          ],
        },
      ]}>
        {imgSrc ? (
          <Image source={imgSrc} style={S.cardImg} resizeMode="cover" />
        ) : (
          <View style={[S.cardImg, S.cardImgFb]}>
            <Text style={{ fontSize: rf(28) }}>{side === 'enemy' ? '👹' : '⚔️'}</Text>
          </View>
        )}

        {/* Pulsing filled tint — color + opacity keyed to the primary status effect */}
        {primaryFxCfg && !defeated && (
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              { borderRadius: 10, backgroundColor: primaryFxCfg.overlayTint, opacity: glowPulse },
            ]}
          />
        )}
        {/* Thin border ring on top of the tint for extra definition */}
        {statusColor && !defeated && (
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              { borderRadius: 10, borderWidth: 1.5, borderColor: statusColor, opacity: glowPulse },
            ]}
          />
        )}

        {/* Status particle VFX — sparks/drops/crystals/shards per effect type */}
        {primaryFxCfg && !defeated && (
          <StatusParticles
            type={primaryFxType}
            cfg={primaryFxCfg}
            cardW={cardW}
            cardH={cardH}
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

        {/* Status application flash — one-shot tint on debuff land */}
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: 10, backgroundColor: statusFlashColor.current ?? 'transparent', opacity: statusFlash },
          ]}
        />

        {/* Heal flash — bright green glow when HP is restored */}
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: 10, backgroundColor: C.SUCCESS + '99', opacity: healFlash },
          ]}
        />

        {/* Heal burst — rising sparkle particles (same pattern as FloatingHeal) */}
        <HealBurst trigger={unit.healKey} imgH={cardH} />

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
            <Ionicons name="shield" size={rs(18)} color={C.CYAN} />
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
            {(unit.stunned || 0) > 0 && (
              <BadgePill
                key="stun"
                cfg={STATUS_DISPLAY.stun}
                label={`${STATUS_DISPLAY.stun.icon} ${STATUS_DISPLAY.stun.label}·${unit.stunned}`}
              />
            )}
            {(unit.statusEffects || []).map((fx, i) => {
              const d = STATUS_DISPLAY[fx.type];
              if (!d) return null;
              return (
                <BadgePill
                  key={`${fx.type}-${i}`}
                  cfg={d}
                  label={`${d.icon} ${d.label}·${fx.duration}`}
                />
              );
            })}
          </View>
        )}

        {/* Floating damage */}
        <FloatingDamage value={unit.lastDamage} isCrit={unit.lastCrit} trigger={unit.damageKey} imgH={cardH} />
        {/* Floating heal */}
        <FloatingHeal value={unit.lastHeal} trigger={unit.healKey} imgH={cardH} />
        {/* Floating DOT damage — distinct color + icon, rises from bottom */}
        <FloatingStatusDamage value={unit.lastDotDamage} dotType={unit.dotType} trigger={unit.dotKey} imgH={cardH} />

        {/* Name strip */}
        <View style={S.cardNameStrip}>
          <Text style={S.cardName} numberOfLines={1}>{unit.name}</Text>
        </View>

        {/* Defeated overlay */}
        {defeated && (
          <View style={S.defeatedOv}>
            <Ionicons name="close-circle" size={rs(26)} color={C.DANGER} />
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}, _cardEqual);

// ─── FloatingDamage ───────────────────────────────────────────────────────────

const FloatingDamage = React.memo(function FloatingDamage({ value, isCrit, trigger, imgH }) {
  const yAnim  = useRef(new Animated.Value(0)).current;
  const opAnim = useRef(new Animated.Value(0)).current;
  const scAnim = useRef(new Animated.Value(1)).current;
  const _imgH  = imgH ?? IMG_H;

  useEffect(() => {
    if (!trigger || !value) return;
    yAnim.setValue(0);
    opAnim.setValue(1);
    scAnim.setValue(isCrit ? 1.4 : 1.15);
    Animated.parallel([
      Animated.timing(yAnim,  { toValue: -(_imgH * 0.7), duration: 820, useNativeDriver: true }),
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
        fontSize:  isCrit ? rf(18) : rf(13),
        color:     isCrit ? C.GOLD : C.TEXT,
        transform: [{ translateY: yAnim }, { scale: scAnim }],
        opacity:   opAnim,
      },
    ]}>
      {isCrit ? '💥' : ''}-{value}{isCrit ? '!' : ''}
    </Animated.Text>
  );
}, (prev, next) => prev.trigger === next.trigger && prev.imgH === next.imgH);

// ─── FloatingHeal ─────────────────────────────────────────────────────────────

const FloatingHeal = React.memo(function FloatingHeal({ value, trigger, imgH }) {
  const yAnim  = useRef(new Animated.Value(0)).current;
  const opAnim = useRef(new Animated.Value(0)).current;
  const _imgH  = imgH ?? IMG_H;

  useEffect(() => {
    if (!trigger || !value) return;
    yAnim.setValue(0);
    opAnim.setValue(1);
    Animated.parallel([
      Animated.timing(yAnim,  { toValue: -(_imgH * 0.55), duration: 750, useNativeDriver: true }),
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
}, (prev, next) => prev.trigger === next.trigger && prev.imgH === next.imgH);

// ─── FloatingStatusDamage ─────────────────────────────────────────────────────
// DOT ticks (burn / poison) rise from the bottom of the card in their status color.

const FloatingStatusDamage = React.memo(function FloatingStatusDamage({ value, dotType, trigger, imgH }) {
  const yAnim  = useRef(new Animated.Value(0)).current;
  const opAnim = useRef(new Animated.Value(0)).current;
  const _imgH  = imgH ?? IMG_H;

  useEffect(() => {
    if (!trigger || !value) return;
    yAnim.setValue(0);
    opAnim.setValue(1);
    Animated.parallel([
      Animated.timing(yAnim,  { toValue: -(_imgH * 0.5), duration: 780, useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(380),
        Animated.timing(opAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, [trigger]);

  if (!value) return null;
  const cfg   = dotType ? STATUS_DISPLAY[dotType] : null;
  const icon  = cfg?.icon ?? '💧';
  const color = cfg?.color ?? C.TEXT_MUTED;
  return (
    <Animated.Text style={[
      S.floatDot,
      { color, transform: [{ translateY: yAnim }], opacity: opAnim },
    ]}>
      {icon} -{value}
    </Animated.Text>
  );
}, (prev, next) => prev.trigger === next.trigger && prev.imgH === next.imgH);

// ─── HealBurst ────────────────────────────────────────────────────────────────
// One-shot burst of green sparkles on heal. Modelled on FloatingHeal:
//   • starts at opacity 1 immediately (not fade-in) — same proven approach
//   • uses bottom + alignSelf positioning to stay within overflow:hidden card bounds
//   • 4 particles spread across different horizontal offsets

const _HEAL_PARTICLES = [
  { char: '+',  xOff: 0,   bottomBase: 18, dur: 680, delay: 0,   size: 16 },
  { char: '✦',  xOff: -18, bottomBase: 14, dur: 620, delay: 40,  size: 11 },
  { char: '✦',  xOff:  18, bottomBase: 14, dur: 640, delay: 60,  size: 11 },
  { char: '◈',  xOff: 0,   bottomBase: 10, dur: 580, delay: 80,  size: 10 },
];

function HealParticle({ char, xOff, bottomBase, dur, delay, size, imgH, trigger }) {
  const yAnim  = useRef(new Animated.Value(0)).current;
  const xAnim  = useRef(new Animated.Value(0)).current;
  const opAnim = useRef(new Animated.Value(0)).current;
  const scAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!trigger) return;
    yAnim.setValue(0);
    xAnim.setValue(0);
    opAnim.setValue(1);
    scAnim.setValue(1.2);
    Animated.parallel([
      Animated.timing(yAnim,  { toValue: -(imgH * 0.58), duration: dur, useNativeDriver: true }),
      Animated.timing(xAnim,  { toValue: xOff,           duration: dur, useNativeDriver: true }),
      Animated.timing(scAnim, { toValue: 0.7,            duration: dur, useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(Math.round(dur * 0.30)),
        Animated.timing(opAnim, { toValue: 0, duration: Math.round(dur * 0.70), useNativeDriver: true }),
      ]),
    ]).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  return (
    <Animated.Text
      style={{
        position: 'absolute',
        bottom:      rs(bottomBase),
        alignSelf:   'center',
        fontSize:    rf(size),
        fontWeight:  '900',
        color:       C.SUCCESS,
        textShadowColor:  C.OVERLAY_4,
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
        opacity:   opAnim,
        transform: [{ translateY: yAnim }, { translateX: xAnim }, { scale: scAnim }],
        zIndex:    22,
      }}
    >
      {char}
    </Animated.Text>
  );
}

const HealBurst = React.memo(function HealBurst({ trigger, imgH }) {
  return (
    <>
      {_HEAL_PARTICLES.map((p, i) => (
        <HealParticle key={i} {...p} imgH={imgH} trigger={trigger} />
      ))}
    </>
  );
}, (prev, next) => prev.trigger === next.trigger && prev.imgH === next.imgH);

// ─── StatusParticles ──────────────────────────────────────────────────────────
// Lightweight looping particle overlay for each status type.
// Uses a single 0→1 progress anim per spark; all transforms are native-driver safe.

const STATUS_SPARK_CHARS = {
  burn:    ['·', '∴', '*', '•', '✦'],
  poison:  ['•', '·', '∙', '◦', '∘'],
  chill:   ['❄', '·', '✦', '◆', '⬡'],
  shatter: ['╲', '╱', '◆', '▸', '▴'],
  weaken:  ['▼', '↓', '∨', '▾', '·'],
  stun:    ['⚡', '*', '✦', '·', '◦'],
};
const STATUS_SPARK_COUNTS = { burn: 5, poison: 4, chill: 5, shatter: 4, weaken: 4, stun: 4 };

function StatusSpark({ type, cardW, cardH, index, count, color }) {
  const prog = useRef(new Animated.Value(0)).current;

  // Stable per-spark layout + timing — computed once on mount via ref guard.
  const r = useRef(null);
  if (!r.current) {
    const frac   = count > 1 ? index / (count - 1) : 0.5;
    const chars  = STATUS_SPARK_CHARS[type] || ['·'];
    const altSign = index % 2 === 0 ? 1 : -1;

    // Starting positions (absolute, as initial translateX/Y from top-left 0,0)
    const startX =
      type === 'shatter' || type === 'stun'
        ? cardW * 0.45                           // burst from center
        : cardW * 0.12 + frac * cardW * 0.76;   // spread across width

    const startY =
      type === 'burn'    ? cardH * 0.75          // near bottom → rise
      : type === 'poison' ? cardH * 0.05         // near top → fall
      : type === 'shatter'? cardH * 0.38         // mid-card → scatter
      : type === 'stun'   ? cardH * 0.30         // upper-mid → scatter
      : type === 'weaken' ? cardH * (0.08 + frac * 0.18)  // top strip
      :                     cardH * (0.05 + frac * 0.28); // chill: top quarter

    // Movement deltas
    const deltaX =
      type === 'shatter' ? altSign * (9  + index * 7)
      : type === 'stun'  ? altSign * (12 + index * 5)
      : type === 'chill' ? altSign * 11
      : type === 'weaken'? altSign * 5
      :                    altSign * (3  + index * 2);

    const deltaY =
      type === 'burn'    ? -(cardH * 0.74)
      : type === 'poison' ?  (cardH * 0.72)
      : type === 'chill'  ?  (cardH * 0.38)
      : type === 'shatter'? altSign * (cardH * 0.22 + index * 8)
      : type === 'stun'   ? altSign * (cardH * 0.18 + index * 7)
      :                      (cardH * 0.54);     // weaken falls

    r.current = {
      char:   chars[index % chars.length],
      delay:  Math.round((index / count) * 650),
      dur:    type === 'chill'   ? 1700 + index * 200
            : type === 'shatter' ?  600 + index * 80
            : type === 'stun'    ?  480 + index * 70
            : type === 'burn'    ?  850 + index * 100
            :                      950 + index * 120,
      startX, startY, deltaX, deltaY,
    };
  }
  const p = r.current;

  useEffect(() => {
    let stopped = false;
    const runCycle = () => {
      if (stopped) return;
      prog.setValue(0);
      Animated.timing(prog, { toValue: 1, duration: p.dur, useNativeDriver: true })
        .start(({ finished }) => { if (finished && !stopped) runCycle(); });
    };
    const t = setTimeout(runCycle, p.delay);
    return () => { stopped = true; clearTimeout(t); prog.stopAnimation(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // All interpolations derived from the single 0→1 progress value.
  const tX  = type === 'chill'
    ? prog.interpolate({ inputRange: [0, 0.33, 0.66, 1], outputRange: [p.startX, p.startX + p.deltaX, p.startX, p.startX + p.deltaX * 0.5] })
    : prog.interpolate({ inputRange: [0, 1], outputRange: [p.startX, p.startX + p.deltaX] });

  const tY  = prog.interpolate({ inputRange: [0, 1], outputRange: [p.startY, p.startY + p.deltaY] });

  const op  =
    type === 'burn'    ? prog.interpolate({ inputRange: [0, 0.12, 0.55, 1], outputRange: [0, 0.85, 0.5,  0] })
    : type === 'poison' ? prog.interpolate({ inputRange: [0, 0.10, 0.65, 1], outputRange: [0, 0.75, 0.4,  0] })
    : type === 'chill'  ? prog.interpolate({ inputRange: [0, 0.18, 0.80, 1], outputRange: [0, 0.70, 0.55, 0] })
    : type === 'shatter'? prog.interpolate({ inputRange: [0, 0.18, 0.55, 1], outputRange: [0, 1.0,  0.5,  0] })
    : type === 'weaken' ? prog.interpolate({ inputRange: [0, 0.14, 0.72, 1], outputRange: [0, 0.68, 0.32, 0] })
    :                     prog.interpolate({ inputRange: [0, 0.20, 0.55, 1], outputRange: [0, 1.0,  0.6,  0] }); // stun

  const sc  =
    type === 'burn'    ? prog.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0.8, 1.1, 0.5] })
    : type === 'shatter'? prog.interpolate({ inputRange: [0, 0.18, 1], outputRange: [1.4, 1.0, 0.3] })
    : type === 'stun'   ? prog.interpolate({ inputRange: [0, 0.20, 1], outputRange: [1.3, 1.0, 0.4] })
    :                     prog.interpolate({ inputRange: [0, 0.5,  1], outputRange: [0.8, 1.0, 0.7] });

  return (
    <Animated.Text
      style={{
        position: 'absolute',
        top: 0, left: 0,
        fontSize: 9,
        fontWeight: '900',
        color,
        transform: [{ translateX: tX }, { translateY: tY }, { scale: sc }],
        opacity: op,
      }}
    >
      {p.char}
    </Animated.Text>
  );
}

function StatusParticles({ type, cfg, cardW, cardH }) {
  if (!type || !cfg) return null;
  const count = STATUS_SPARK_COUNTS[type] ?? 4;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: 'hidden', borderRadius: 10 }]}>
      {Array.from({ length: count }, (_, i) => (
        <StatusSpark
          key={i}
          type={type}
          cardW={cardW}
          cardH={cardH}
          index={i}
          count={count}
          color={cfg.color}
        />
      ))}
    </View>
  );
}

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
              <Text style={{ fontSize: rf(56) }}>👹</Text>
            </View>
          )}
          <LinearGradient colors={['transparent', C.BG_VOID]} style={S.enemyCutInFade} />
        </View>
      </Animated.View>
    </Animated.View>
  );
}, (prev, next) => prev.enemy === next.enemy);

// ─── PillBtn ──────────────────────────────────────────────────────────────────

const PillBtn = React.memo(function PillBtn({ label, sub, colors, onPress, disabled, dimmed, glow, pillH, accessibilityLabel, accessibilityRole }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.75}
      style={[S.pillBtn, glow && S.pillBtnGlow, pillH && { height: pillH, borderRadius: pillH / 2 }]}
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: rs(30) },

  // ── Header ──
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: rs(12), paddingVertical: rs(6), gap: rs(10),
    backgroundColor: C.BG_RAISED,
    borderBottomWidth: 1, borderBottomColor: C.BORDER,
  },
  quitBtn:      { borderRadius: rs(8), overflow: 'hidden' },
  quitBtnInner: { paddingHorizontal: rs(14), paddingVertical: rs(7) },
  quitText:     { fontSize: rf(12), fontWeight: '800', color: C.TEXT, letterSpacing: 0.5 },

  headerMid:   { flex: 1 },
  headerTitle: { fontSize: rf(13), fontWeight: '800', color: C.TEXT, letterSpacing: 0.3 },
  turnLabel:      { fontSize: rf(13), color: C.TEXT_MUTED, fontWeight: '600', letterSpacing: 0.5 },
  turnCountLabel: { fontSize: rf(12), color: C.TEXT_MUTED, fontWeight: '600' },

  energyWrap: { width: rs(96) },
  energyLbl:  { fontSize: rf(12), color: C.GOLD, fontWeight: '700', marginBottom: 3 },
  energyBg:   { height: 5, backgroundColor: C.BG_MID, borderRadius: 3, overflow: 'hidden' },
  energyFill: { height: 5, borderRadius: 3 },

  speedBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: rs(8), paddingVertical: rs(5),
    borderRadius: rs(8), borderWidth: 1,
    borderColor: C.BORDER, backgroundColor: C.GLASS_3,
  },
  speedBtnActive: { borderColor: C.GOLD, backgroundColor: C.GOLD_GLOW },
  speedBtnTxt:    { fontSize: rf(13), fontWeight: '900', color: C.TEXT_MUTED, letterSpacing: 0.3 },

  turnPill: {
    flexDirection: 'row', alignItems: 'center', gap: rs(5),
    borderRadius: rs(8), borderWidth: 1,
    paddingHorizontal: rs(8), paddingVertical: 4,
  },
  turnDot:  { width: 6, height: 6, borderRadius: 3 },
  turnText: { fontSize: rf(12), fontWeight: '800', letterSpacing: 0.5 },

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
    fontSize: rf(13), fontWeight: '900', letterSpacing: 2.5,
    marginBottom: rs(5),
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    // Explicit margin between cards so they never sit cramped/overlapping. CARD_MARGIN
    // also clears each card's 1.15× attack-scale + lunge.
    gap: CARD_MARGIN,
  },
  divider: {
    width: 1,
    backgroundColor: C.BORDER,
    marginVertical: 4,
  },

  // ── Card ──
  cardTouch: { width: CARD_W, alignItems: 'center' },

  hpNumber: {
    fontSize: rf(14), fontWeight: '900', letterSpacing: 0.3,
    marginBottom: 2,
  },
  hpBarRow: {
    flexDirection: 'row', alignItems: 'center',
    width: CARD_W, gap: 4, marginBottom: 3,
  },
  hpLabel:  { fontSize: rf(8), fontWeight: '800', color: C.TEXT_SOFT, letterSpacing: 0.3 },
  hpBarBg:     { flex: 1, height: 5, backgroundColor: C.BG_BOTTOM, borderRadius: 3, overflow: 'hidden' },
  hpBarFill:   { height: 5, borderRadius: 3 },
  hpGhostFill: { position: 'absolute', top: 0, left: 0, height: 5, backgroundColor: C.WARNING, borderRadius: 3, opacity: 0.45 },

  // Shared enemy-team energy bar (under the ENEMY TEAM label; mirrors the
  // player's single energy bar in the header).
  enTeamEnergyRow: { flexDirection: 'row', alignItems: 'center', gap: rs(5), marginBottom: rs(6), paddingHorizontal: rs(6) },
  enTeamEnergyLbl: { fontSize: rf(13), fontWeight: '800', color: C.GOLD, letterSpacing: 0.5 },
  enTeamEnergyBg:  { flex: 1, height: 5, backgroundColor: C.BG_MID, borderRadius: 3, overflow: 'hidden' },
  enTeamEnergyFill:{ height: 5, borderRadius: 3 },
  enTeamIntent:    { flexDirection: 'row', alignItems: 'center', gap: 2 },
  enTeamIntentTxt: { fontSize: rf(7), fontWeight: '900', color: C.GOLD, letterSpacing: 0.3 },

  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: rs(10),
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
    borderRadius: rs(10), borderWidth: 2.5, zIndex: 8,
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
  switchHintText: { fontSize: rf(13), color: C.PRIMARY, fontWeight: '900', letterSpacing: 0.5 },

  targetBadge: {
    position: 'absolute', top: 4, left: 4,
    backgroundColor: C.GOLD_GLOW,
    borderRadius: 4, paddingHorizontal: 4, paddingVertical: 2,
    borderWidth: 1, borderColor: C.GOLD,
    zIndex: 10,
  },
  targetBadgeText: { fontSize: rf(13), color: C.GOLD, fontWeight: '900', letterSpacing: 0.5 },

  cardNameStrip: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: C.OVERLAY_4,
    paddingVertical: 3, paddingHorizontal: 4,
  },
  cardName: { fontSize: rf(8), color: C.TEXT, fontWeight: '700', textAlign: 'center' },

  statusEffectRow: {
    position: 'absolute',
    bottom: rs(18),
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
    fontSize: rf(7),
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
    fontSize: rf(13),
    fontWeight: '900',
    color: C.GOLD,
    letterSpacing: 1,
    textShadowColor: C.OVERLAY_MODAL,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  floatDmg: {
    position: 'absolute',
    bottom: rs(8),
    alignSelf: 'center',
    fontWeight: '900',
    textShadowColor: C.OVERLAY_STRONG,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    zIndex: 20,
  },
  floatHeal: {
    position: 'absolute',
    bottom: rs(22),
    alignSelf: 'center',
    fontSize: rf(14),
    fontWeight: '900',
    color: C.SUCCESS,
    textShadowColor: C.OVERLAY_STRONG,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    zIndex: 21,
  },
  floatDot: {
    position: 'absolute',
    bottom: rs(8),
    alignSelf: 'center',
    fontSize: rf(12),
    fontWeight: '800',
    textShadowColor: C.OVERLAY_MODAL,
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
    fontSize: rf(12), fontWeight: '900', letterSpacing: 4,
    color: C.TEXT_ON_DARK_MUTED,
  },
  cutInRule: {
    width: rs(54), height: 3, borderRadius: 2,
    marginTop: rs(8), marginBottom: rs(10),
  },
  cutInHeroName: {
    fontSize: rf(16), fontWeight: '800', letterSpacing: 1,
    marginBottom: rs(6),
    textShadowColor: C.OVERLAY_MODAL,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  cutInTrumpName: {
    fontSize: Math.min(34, Math.floor(SH * 0.095)),
    fontWeight: '900', letterSpacing: 0.5,
    color: C.TEXT,
    textShadowColor: C.OVERLAY_MODAL,
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
    borderRadius: rs(14),
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
    paddingBottom: rs(8),
    paddingHorizontal: rs(8),
    backgroundColor: 'transparent',
  },
  statusMsg: {
    alignSelf: 'center',
    fontSize: rf(13), color: C.TEXT_SOFT,
    fontStyle: 'italic', fontWeight: '600',
    letterSpacing: 0.3, marginBottom: rs(5),
  },

  // ── Action bar ──
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(8),
  },

  // Active hero tag (left side of action bar)
  heroTag: {
    width: rs(82),
    paddingRight: rs(8),
    borderRightWidth: 1,
    borderRightColor: C.BORDER,
    justifyContent: 'center',
  },
  heroTagBadge: {
    fontSize: rf(13), color: C.PRIMARY, fontWeight: '900',
    letterSpacing: 1.5, marginBottom: 2,
  },
  heroTagName: {
    fontSize: rf(13), fontWeight: '800', color: C.TEXT,
    letterSpacing: 0.2,
  },
  heroTagHint: {
    fontSize: rf(13), color: C.GOLD, fontWeight: '700', marginTop: 2,
  },

  // Pill buttons row
  pillRow: {
    flex: 1,
    flexDirection: 'row',
    gap: rs(6),
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
    paddingHorizontal: rs(10),
  },
  pillBtnLabel:    { fontSize: rf(13), fontWeight: '800', color: C.TEXT, letterSpacing: 0.2 },
  pillBtnLabelDim: { color: C.TEXT_DISABLED },
  pillBtnSub:      { fontSize: rf(13), color: C.TEXT_ON_DARK, fontWeight: '600', marginTop: 1 },
  pillBtnSubDim:   { color: C.TEXT_ON_DARK_DIM },

  enemyThinking: {
    flex: 1, textAlign: 'center',
    fontSize: rf(12), color: C.TEXT_MUTED,
    fontStyle: 'italic', fontWeight: '600',
    paddingVertical: rs(10),
  },

  // ── No-team ──
  warnTitle: { fontSize: rf(18), fontWeight: '700', color: C.GOLD, marginTop: rs(14), marginBottom: rs(8) },
  warnSub:   { fontSize: rf(12), color: C.TEXT_MUTED, textAlign: 'center', lineHeight: rf(18), marginBottom: rs(20) },
  goBackBtn: {
    backgroundColor: C.PRIMARY_GLOW, borderRadius: rs(10),
    paddingVertical: rs(11), paddingHorizontal: rs(26),
    borderWidth: 1, borderColor: C.PRIMARY,
  },
  goBackText: { color: C.PRIMARY, fontSize: rf(14), fontWeight: '700' },

  // ── Energy tutorial modal ──
  tutOverlay: {
    flex: 1,
    backgroundColor: C.OVERLAY_VOID,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tutCard: {
    width: Math.min(W * 0.62, 480),
    borderRadius: rs(14), overflow: 'hidden',
    borderWidth: 1, borderColor: C.BORDER_STRONG,
    padding: rs(18),
    shadowColor: C.PRIMARY,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45, shadowRadius: 20, elevation: 12,
  },
  tutAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 3 },
  tutTitle: {
    fontSize: rf(16), fontWeight: '900', color: C.TEXT,
    letterSpacing: 3.5, textAlign: 'center', marginBottom: 2,
  },
  tutSub: {
    fontSize: rf(12), color: C.TEXT_ON_DARK_MUTED,
    textAlign: 'center', letterSpacing: 0.5, marginBottom: rs(14),
  },
  tutRows:    { gap: rs(8), marginBottom: rs(16) },
  tutRow:     { flexDirection: 'row', alignItems: 'center', gap: rs(12) },
  tutIconWrap: {
    width: rs(32), height: rs(32), borderRadius: rs(8),
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  tutRowText:  { flex: 1 },
  tutRowLabel: { fontSize: rf(13), fontWeight: '800', color: C.TEXT, letterSpacing: 0.3 },
  tutRowDesc:  { fontSize: rf(12), color: C.TEXT_ON_DARK_SOFT, marginTop: 1 },
  tutBtn:      { borderRadius: rs(10), overflow: 'hidden' },
  tutBtnInner: { paddingVertical: rs(12), alignItems: 'center' },
  tutBtnTxt:   { fontSize: rf(12), fontWeight: '900', color: C.TEXT, letterSpacing: 1.5 },
});
