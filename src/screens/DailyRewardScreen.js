import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, Animated, Dimensions, useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import useGameStore from '../store/gameStore';
import { DAILY_REWARDS } from '../data/dailyRewards';
import AudioManager from '../utils/AudioManager';
import { C } from '../theme/colors';
import { rs, rf } from '../theme/scale';

const { height: H } = Dimensions.get('window');
const GEM_IMG  = require('../../assets/currency/gem.png');
const GOLD_IMG = require('../../assets/currency/gold.png');

// Card height is responsive to screen height, capped at 118px
const CARD_H = Math.min(Math.floor(H * 0.29), 118);

// ─── helpers ──────────────────────────────────────────────────────────────────

const todayStr = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

function countdown() {
  const now      = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diff     = midnight - now;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

// ─── DayCard ──────────────────────────────────────────────────────────────────

function DayCard({ reward, state, scale }) {
  const isClaimed = state === 'claimed';
  const isToday   = state === 'today';
  const isBonus   = reward.isBonus;
  const isGold    = reward.type === 'gold' || reward.type === 'both';
  const isGem     = reward.type === 'gems' || reward.type === 'both';

  const accentCol = isBonus ? C.SECONDARY : isGold ? C.GOLD : C.PRIMARY_LIGHT;

  // Visual tokens per state
  const stripColor  = isClaimed ? C.SUCCESS : isToday ? accentCol : C.BORDER_SUBTLE;
  const borderColor = isClaimed ? C.SUCCESS + '80' : isToday ? accentCol : C.GLASS_5;
  const borderWidth = isToday ? 1.5 : 1;
  const bgTop       = isClaimed ? C.SUCCESS + '26' : isToday ? accentCol + '2C' : C.GLASS_3;
  const bgBot       = isClaimed ? C.SUCCESS + '0A' : isToday ? accentCol + '07' : C.OVERLAY_1;
  const iconOpacity = isClaimed ? 0.52 : isToday ? 1 : 0.26;
  const numColor    = isClaimed ? C.SUCCESS : isToday ? accentCol : C.TEXT_ON_DARK_DIM;

  const displayAmt  = isBonus ? 'BONUS'
    : (isGold && isGem) ? `${reward.gold}+${reward.gems}`
    : isGold ? `${reward.gold}`
    : `${reward.gems}`;

  const amtColor = isClaimed ? C.SUCCESS + 'AA' : isToday ? C.TEXT : C.TEXT_ON_DARK_DIM;

  return (
    <Animated.View
      style={[
        S.dayCard,
        {
          borderColor, borderWidth,
          transform: [{ scale }],
          shadowColor:   isToday ? accentCol : C.SHADOW,
          shadowOpacity: isToday ? 0.60 : 0.18,
          shadowOffset:  { width: 0, height: isToday ? 5 : 2 },
          shadowRadius:  isToday ? 12 : 4,
          elevation:     isToday ? 10 : 2,
        },
      ]}
    >
      <LinearGradient colors={[bgTop, bgBot]} style={StyleSheet.absoluteFill} />

      {/* ① Top accent strip */}
      <View style={[S.dayStrip, { backgroundColor: stripColor }]} />

      {/* ② Day number */}
      <Text style={[S.dayNum, { color: numColor }]}>
        {reward.day}
      </Text>

      {/* ③ Icon */}
      <View style={[S.dayIconWrap, { opacity: iconOpacity }]}>
        {isGold && <Image source={GOLD_IMG} style={S.dayIcon} resizeMode="contain" />}
        {isGem  && <Image source={GEM_IMG}  style={S.dayIcon} resizeMode="contain" />}
      </View>

      {/* ④ Amount */}
      <Text style={[S.dayAmt, { color: amtColor }]} numberOfLines={1}>
        {displayAmt}
      </Text>

      {/* ⑤ State chip */}
      <View style={S.dayStateRow}>
        {isClaimed ? (
          <Ionicons name="checkmark-circle" size={rs(19)} color={C.SUCCESS} />
        ) : isToday ? (
          <View style={[S.todayChip, { backgroundColor: accentCol }]}>
            <Text style={S.todayChipTxt}>{isBonus ? 'BONUS' : 'TODAY'}</Text>
          </View>
        ) : (
          <Ionicons name="lock-closed" size={rs(15)} color={C.GLASS_7} />
        )}
      </View>
    </Animated.View>
  );
}

// ─── DailyRewardScreen ────────────────────────────────────────────────────────

export default function DailyRewardScreen({ navigation }) {
  const { width: W, height: SH } = useWindowDimensions();
  const dailyStreak      = useGameStore(s => s.dailyStreak);
  const lastClaimDate    = useGameStore(s => s.lastClaimDate);
  const claimDailyReward = useGameStore(s => s.claimDailyReward);

  const today     = todayStr();
  const canClaim  = lastClaimDate !== today;
  const streakPos = dailyStreak % 7;

  const todayReward = DAILY_REWARDS[canClaim ? streakPos : Math.max(0, streakPos - 1)];

  const [timeLeft,    setTimeLeft]    = useState(countdown());
  const [justClaimed, setJustClaimed] = useState(false);

  const screenFade = useRef(new Animated.Value(0)).current;
  const claimScale = useRef(new Animated.Value(1)).current;
  const cardScales = useRef(DAILY_REWARDS.map(() => new Animated.Value(1))).current;
  const flashAnim  = useRef(new Animated.Value(0)).current;
  const iconBounce = useRef(new Animated.Value(1)).current;

  // Countdown ticker
  useEffect(() => {
    const t = setInterval(() => setTimeLeft(countdown()), 1000);
    return () => clearInterval(t);
  }, []);

  // Entrance animations
  useEffect(() => {
    Animated.timing(screenFade, { toValue: 1, duration: 420, useNativeDriver: true }).start();

    cardScales.forEach(s => s.setValue(0.72));
    Animated.stagger(55, cardScales.map((s, i) =>
      Animated.sequence([
        Animated.delay(i * 38),
        Animated.spring(s, { toValue: 1, friction: 5, tension: 130, useNativeDriver: true }),
      ])
    )).start();

    const bounceLoop = Animated.loop(Animated.sequence([
      Animated.timing(iconBounce, { toValue: 1.07, duration: 950, useNativeDriver: true }),
      Animated.timing(iconBounce, { toValue: 1.00, duration: 950, useNativeDriver: true }),
    ]));
    bounceLoop.start();
    return () => bounceLoop.stop();
  }, []);

  const handleClaim = useCallback(() => {
    if (!canClaim || justClaimed) return;
    const result = claimDailyReward();
    if (!result) return;
    setJustClaimed(true);
    AudioManager.playRewardClaimSFX();

    Animated.sequence([
      Animated.timing(flashAnim, { toValue: 1, duration: 140, useNativeDriver: true }),
      Animated.timing(flashAnim, { toValue: 0, duration: 340, useNativeDriver: true }),
    ]).start();

    Animated.sequence([
      Animated.spring(claimScale, { toValue: 0.93, friction: 5, tension: 130, useNativeDriver: true }),
      Animated.spring(claimScale, { toValue: 1.00, friction: 5, tension: 110, useNativeDriver: true }),
    ]).start();

    Animated.sequence([
      Animated.spring(cardScales[streakPos % 7], { toValue: 1.18, friction: 4, tension: 120, useNativeDriver: true }),
      Animated.spring(cardScales[streakPos % 7], { toValue: 1.00, friction: 5, tension: 80,  useNativeDriver: true }),
    ]).start();
  }, [canClaim, justClaimed, claimDailyReward, streakPos, cardScales, claimScale, flashAnim]);

  const getDayState = useCallback((dayIdx) => {
    const pos = dailyStreak % 7;
    if (justClaimed || !canClaim) {
      const claimedCount = (pos === 0 && dailyStreak > 0) ? 7 : pos;
      return dayIdx < claimedCount ? 'claimed' : 'future';
    }
    if (dayIdx < pos) return 'claimed';
    if (dayIdx === pos) return 'today';
    return 'future';
  }, [canClaim, justClaimed, dailyStreak]);

  const isBonus     = todayReward?.isBonus;
  const accentColor = isBonus ? C.SECONDARY : (todayReward?.type === 'gold' ? C.GOLD : C.PRIMARY_LIGHT);

  const claimedCount = (() => {
    const pos = dailyStreak % 7;
    if (justClaimed || !canClaim) return (pos === 0 && dailyStreak > 0) ? 7 : pos;
    return pos;
  })();

  const displayDay = (canClaim && !justClaimed)
    ? streakPos + 1
    : (streakPos === 0 && dailyStreak > 0 ? 7 : streakPos);

  return (
    <Animated.View style={[S.root, { opacity: screenFade }]}>

      {/* Background */}
      <LinearGradient colors={[C.BG_VOID, C.BG_DARK, C.BG_VOID]} style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={[accentColor + '12', 'transparent', accentColor + '08']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Flash overlay */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, S.flashOverlay, { opacity: flashAnim }]}
      />

      <View style={S.wrapper}>

        {/* ══ HEADER ══ */}
        <LinearGradient colors={C.GRAD_HEADER} style={[S.header, { paddingTop: 8 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={S.backBtn} activeOpacity={0.8}>
            <Ionicons name="chevron-back" size={rs(22)} color={C.TEXT} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={S.hdrTitle}>DAILY LOGIN REWARD</Text>
            <Text style={S.hdrSub}>Log in every day — don't break the streak!</Text>
          </View>
          <View style={S.streakPill}>
            <Text style={S.streakFire}>🔥</Text>
            <Text style={S.streakNum}>{dailyStreak}</Text>
            <Text style={S.streakLabel}>{dailyStreak === 1 ? 'day' : 'days'}</Text>
          </View>
        </LinearGradient>

        {/* ══ BODY ══ */}
        <View style={S.body}>

          {/* ── LEFT — Today spotlight ── */}
          <View style={[S.leftPanel, { borderRightColor: accentColor + '22' }]}>

            {/* Day counter */}
            <View style={S.dayCounter}>
              <Text style={[S.dayCounterNum, { color: accentColor }]}>{displayDay}</Text>
              <Text style={S.dayCounterOf}> / 7</Text>
            </View>

            <Text style={[S.spotlightLabel, { color: accentColor }]}>
              {justClaimed || !canClaim ? "TODAY'S REWARD" : 'CLAIM TODAY'}
            </Text>

            {/* Reward icon */}
            <Animated.View style={[S.bigIconWrap, { transform: [{ scale: iconBounce }] }]}>
              <LinearGradient colors={[accentColor + '35', accentColor + '06']} style={S.bigIconGlow} />
              <View style={[S.bigIconRing, { borderColor: accentColor + '38' }]} />
              {todayReward?.type === 'both' ? (
                <View style={S.bothIcons}>
                  <Image source={GOLD_IMG} style={S.bigIcon} resizeMode="contain" />
                  <Image source={GEM_IMG}  style={S.bigIcon} resizeMode="contain" />
                </View>
              ) : todayReward?.type === 'gold' ? (
                <Image source={GOLD_IMG} style={S.bigIcon} resizeMode="contain" />
              ) : (
                <Image source={GEM_IMG} style={S.bigIcon} resizeMode="contain" />
              )}
            </Animated.View>

            {/* Amount chips */}
            <View style={S.amtRow}>
              {(todayReward?.gold ?? 0) > 0 && (
                <View style={S.amtChip}>
                  <Image source={GOLD_IMG} style={S.amtIcon} resizeMode="contain" />
                  <Text style={[S.amtTxt, { color: C.GOLD }]}>+{todayReward.gold}</Text>
                </View>
              )}
              {(todayReward?.gems ?? 0) > 0 && (
                <View style={S.amtChip}>
                  <Image source={GEM_IMG} style={S.amtIcon} resizeMode="contain" />
                  <Text style={[S.amtTxt, { color: C.PRIMARY_LIGHT }]}>+{todayReward.gems}</Text>
                </View>
              )}
            </View>

            {/* Claim CTA or countdown */}
            {canClaim && !justClaimed ? (
              <Animated.View style={[S.claimBtnWrap, { transform: [{ scale: claimScale }] }]}>
                <TouchableOpacity onPress={handleClaim} activeOpacity={0.84} style={S.claimBtn}>
                  <LinearGradient
                    colors={isBonus ? C.GRAD_PINK : C.GRAD_GOLD}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={S.claimBtnInner}
                  >
                    <Ionicons name="gift" size={rs(21)} color={C.TEXT} />
                    <Text style={S.claimBtnTxt}>{isBonus ? 'CLAIM BONUS!' : 'CLAIM REWARD'}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            ) : (
              <View style={S.claimedBox}>
                <Ionicons name="checkmark-circle" size={rs(22)} color={C.SUCCESS} />
                <View style={{ gap: rs(2) }}>
                  <Text style={S.claimedTxt}>Claimed!</Text>
                  <Text style={S.countdownTxt}>Next in  {timeLeft}</Text>
                </View>
              </View>
            )}
          </View>

          {/* ── RIGHT — 7-day calendar ── */}
          <View style={S.rightPanel}>

            {/* Panel header row */}
            <View style={S.rightHeader}>
              <View>
                <Text style={S.calendarTitle}>7-DAY REWARDS</Text>
                <Text style={S.calendarSub}>{claimedCount} of 7 collected</Text>
              </View>
              {/* Streak progress dots */}
              <View style={S.dotsRow}>
                {DAILY_REWARDS.map((_, i) => {
                  const st = getDayState(i);
                  return (
                    <View
                      key={i}
                      style={[
                        S.dot,
                        st === 'claimed' && S.dotClaimed,
                        st === 'today'   && S.dotToday,
                        st === 'future'  && S.dotFuture,
                      ]}
                    />
                  );
                })}
              </View>
            </View>

            {/* 7 cards — flex row, no ScrollView (landscape always fits) */}
            <View style={S.cardsRow}>
              {DAILY_REWARDS.map((r, i) => (
                <DayCard
                  key={r.day}
                  reward={r}
                  state={getDayState(i)}
                  scale={cardScales[i]}
                />
              ))}
            </View>

            {/* Cycle note */}
            <View style={S.cycleRow}>
              <Ionicons name="refresh-circle-outline" size={rs(17)} color={C.TEXT_ON_DARK_DIM} />
              <Text style={S.cycleTxt}>Rewards cycle and reset after Day 7</Text>
            </View>

          </View>
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  root:         { flex: 1, backgroundColor: C.BG_VOID },
  wrapper:      { flex: 1 },
  flashOverlay: { backgroundColor: C.FLASH_GOLD, zIndex: 99 },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: rs(14), paddingBottom: rs(10), gap: rs(10),
    borderBottomWidth: 1, borderBottomColor: C.GLASS_5,
  },
  backBtn:   { padding: 4 },
  hdrTitle:  { fontSize: rf(15), fontWeight: '900', color: C.TEXT, letterSpacing: 2 },
  hdrSub:    { fontSize: rf(12), color: C.TEXT_ON_DARK_MUTED, marginTop: 1 },

  streakPill: {
    flexDirection: 'row', alignItems: 'center', gap: rs(5),
    backgroundColor: C.STREAK_ORANGE_BG, borderRadius: rs(10),
    paddingHorizontal: rs(12), paddingVertical: rs(7),
    borderWidth: 1, borderColor: C.STREAK_ORANGE_BORDER,
  },
  streakFire:  { fontSize: rf(15) },
  streakNum:   { fontSize: rf(18), fontWeight: '900', color: C.STREAK_ORANGE },
  streakLabel: { fontSize: rf(12), color: C.TEXT_ON_DARK_MUTED, fontWeight: '600' },

  // ── Body split ────────────────────────────────────────────────────────────
  body: { flex: 1, flexDirection: 'row' },

  // ── Left panel ────────────────────────────────────────────────────────────
  leftPanel: {
    width: '40%',
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: rs(24), gap: rs(14),
    borderRightWidth: 1,
  },

  // Day X / 7
  dayCounter: { flexDirection: 'row', alignItems: 'baseline' },
  dayCounterNum: { fontSize: rf(34), fontWeight: '900', letterSpacing: -1 },
  dayCounterOf:  { fontSize: rf(15), fontWeight: '700', color: C.TEXT_ON_DARK_DIM },

  spotlightLabel: { fontSize: rf(13), fontWeight: '900', letterSpacing: 2.5 },

  bigIconWrap: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  bigIconGlow: { position: 'absolute', width: rs(118), height: rs(118), borderRadius: rs(59) },
  bigIconRing: {
    position: 'absolute', width: rs(104), height: rs(104), borderRadius: rs(52),
    borderWidth: 1,
  },
  bigIcon:   { width: rs(78), height: rs(78) },
  bothIcons: { flexDirection: 'row', gap: rs(8) },

  // Amount chips
  amtRow:  { flexDirection: 'row', gap: rs(12), alignItems: 'center' },
  amtChip: { flexDirection: 'row', alignItems: 'center', gap: rs(5) },
  amtIcon: { width: rs(16), height: rs(16) },
  amtTxt: {
    fontSize: rf(20), fontWeight: '900', letterSpacing: 0.3,
    textShadowColor: C.OVERLAY_3,
    textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3,
  },

  // Claim button
  claimBtnWrap:  { width: '82%' },
  claimBtn:      { borderRadius: rs(12), overflow: 'hidden' },
  claimBtnInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: rs(8), paddingVertical: rs(13),
  },
  claimBtnTxt: { fontSize: rf(13), fontWeight: '900', color: C.TEXT, letterSpacing: 1 },

  // Claimed state
  claimedBox: {
    flexDirection: 'row', alignItems: 'center', gap: rs(12),
    backgroundColor: C.SUCCESS + '24',
    borderWidth: 1, borderColor: C.SUCCESS + '45',
    borderRadius: rs(12), paddingHorizontal: rs(16), paddingVertical: rs(11),
  },
  claimedTxt:   { fontSize: rf(13), fontWeight: '800', color: C.SUCCESS },
  countdownTxt: { fontSize: rf(13), color: C.TEXT_ON_DARK_MUTED },

  // ── Right panel ───────────────────────────────────────────────────────────
  rightPanel: {
    flex: 1,
    paddingHorizontal: rs(18), paddingTop: rs(14), paddingBottom: rs(10),
    gap: rs(12),
  },

  rightHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
  },
  calendarTitle: { fontSize: rf(13), fontWeight: '900', color: C.TEXT_ON_DARK, letterSpacing: 2.5 },
  calendarSub:   { fontSize: rf(12), color: C.TEXT_ON_DARK_DIM, marginTop: rs(3) },

  // Streak progress dots
  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: rs(6) },
  dot:        { width: rs(8), height: rs(8), borderRadius: rs(4) },
  dotClaimed: { backgroundColor: C.SUCCESS },
  dotToday:   { backgroundColor: C.GOLD, width: rs(11), height: rs(11), borderRadius: rs(6) },
  dotFuture:  { backgroundColor: C.GLASS_7 },

  // 7-card flex row
  cardsRow: { flex: 1, flexDirection: 'row', gap: rs(7) },

  cycleRow: { flexDirection: 'row', alignItems: 'center', gap: rs(5) },
  cycleTxt: { fontSize: rf(12), color: C.TEXT_ON_DARK_DIM, fontStyle: 'italic' },

  // ── DayCard ───────────────────────────────────────────────────────────────
  dayCard: {
    flex: 1, height: CARD_H,
    borderRadius: rs(11), overflow: 'hidden',
    alignItems: 'center',
    position: 'relative',
  },

  // ① Top strip
  dayStrip: { width: '100%', height: 3 },

  // ② Day number
  dayNum: { fontSize: rf(12), fontWeight: '900', letterSpacing: 0.4, marginTop: rs(6) },

  // ③ Icon zone
  dayIconWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  dayIcon:     { width: rs(28), height: rs(28) },

  // ④ Amount
  dayAmt: {
    fontSize: rf(13), fontWeight: '900', letterSpacing: 0.2,
    paddingHorizontal: rs(4), marginBottom: rs(5),
  },

  // ⑤ State chip
  dayStateRow: { height: rs(20), alignItems: 'center', justifyContent: 'center', marginBottom: rs(6) },
  todayChip:   { borderRadius: rs(4), paddingHorizontal: rs(6), paddingVertical: rs(2) },
  todayChipTxt:{ fontSize: rf(10), fontWeight: '900', color: C.TEXT, letterSpacing: 0.8 },
});
