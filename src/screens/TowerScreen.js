import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, useWindowDimensions, Image, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import useGameStore from '../store/gameStore';
import {
  getTowerEnemyGroup, getTowerFloorReward,
  getFloorDifficulty, isBossFloor, isMilestoneFloor,
  FLOOR_MILESTONES, TOWER_MAX_FLOOR,
} from '../data/towerData';
import { ENEMY_IMAGES } from '../data/enemies';
import AudioManager from '../utils/AudioManager';
import { C } from '../theme/colors';
import { rs, rf } from '../theme/scale';

const COIN_IMG = require('../../assets/currency/coin.png');
const GEM_IMG  = require('../../assets/currency/gem.png');
const GOLD_IMG = require('../../assets/currency/gold.png');

// Truly static layout tokens
const PAD = 10;
const GAP = 6;

// ── Weekly reset countdown ────────────────────────────────────────────────────
function getResetCountdown() {
  const now  = new Date();
  const day  = now.getDay();
  const next = new Date(now);
  const daysUntil = day === 1 ? 7 : (8 - day) % 7;
  next.setDate(now.getDate() + daysUntil);
  next.setHours(0, 0, 0, 0);
  const ms = next - now;
  const d  = Math.floor(ms / 86400000);
  const hh = Math.floor((ms % 86400000) / 3600000);
  const m  = Math.floor((ms % 3600000) / 60000);
  if (d > 0)  return `${d}d ${hh}h`;
  if (hh > 0) return `${hh}h ${m}m`;
  return `${m}m`;
}

// ── Rising spark particles ────────────────────────────────────────────────────
function Sparks({ color }) {
  const { width: W, height: H } = useWindowDimensions();
  const anims = useRef(
    Array.from({ length: 8 }, () => ({
      y:   new Animated.Value(0),
      op:  new Animated.Value(0),
      x:   Math.round(W * (0.08 + Math.random() * 0.84)),
      dur: 1600 + Math.round(Math.random() * 2200),
      del: Math.round(Math.random() * 1600),
      sz:  1.5 + Math.random() * 2,
    }))
  ).current;

  useEffect(() => {
    const loops = anims.map(p => {
      const loop = Animated.loop(Animated.sequence([
        Animated.delay(p.del),
        Animated.parallel([
          Animated.timing(p.y,  { toValue: -(H * 0.6), duration: p.dur, useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(p.op, { toValue: 0.6,  duration: p.dur * 0.15, useNativeDriver: true }),
            Animated.timing(p.op, { toValue: 0,    duration: p.dur * 0.85, useNativeDriver: true }),
          ]),
        ]),
        Animated.timing(p.y, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]));
      loop.start();
      return loop;
    });
    return () => loops.forEach(l => l.stop());
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {anims.map((p, i) => (
        <Animated.View key={i} style={{
          position: 'absolute', bottom: H * 0.05, left: p.x,
          width: p.sz, height: p.sz, borderRadius: p.sz / 2,
          backgroundColor: color, opacity: p.op,
          transform: [{ translateY: p.y }],
        }} />
      ))}
    </View>
  );
}

// ── Enemy portrait card ───────────────────────────────────────────────────────
function EnemyCard({ enemy, cardW, cardH, scale }) {
  const rsc    = n => Math.max(1, Math.round(n * scale));
  const isBoss = enemy.tier === 'boss';
  const isMini = enemy.tier === 'mini-boss';
  const col    = isBoss ? C.DANGER : isMini ? C.GOLD : C.TEXT_MUTED;
  const imgSrc = enemy.imageKey && ENEMY_IMAGES[enemy.imageKey]
    ? ENEMY_IMAGES[enemy.imageKey] : null;

  return (
    <View style={[ec.card, { borderColor: col + '55', width: cardW, height: cardH }]}>
      {imgSrc
        ? <Image source={imgSrc} style={ec.img} resizeMode="cover" />
        : <View style={[ec.img, ec.imgFallback]}>
            <Text style={{ fontSize: rsc(28) }}>{isBoss ? '💀' : isMini ? '⚔️' : '👾'}</Text>
          </View>}
      <LinearGradient colors={['transparent', C.OVERLAY_DEEP]} style={ec.grad} />
      <View style={[ec.badge, { backgroundColor: col + '28', borderColor: col + '60' }]}>
        <Text style={[ec.badgeEmoji, { fontSize: rsc(10) }]}>{isBoss ? '💀' : isMini ? '⚔️' : '👾'}</Text>
      </View>
      <View style={ec.info}>
        <Text style={[ec.name, { fontSize: rsc(9) }]} numberOfLines={1}>{enemy.name}</Text>
        <View style={ec.stats}>
          <Text style={[ec.sv, { color: C.HP, fontSize: rsc(9) }]}>{enemy.hp.toLocaleString()}</Text>
          <Text style={[ec.sl, { fontSize: rsc(6) }]}>HP</Text>
          <Text style={[ec.sv, { color: C.ATK, marginLeft: 6, fontSize: rsc(9) }]}>{enemy.atk}</Text>
          <Text style={[ec.sl, { fontSize: rsc(6) }]}>ATK</Text>
        </View>
      </View>
    </View>
  );
}
const ec = StyleSheet.create({
  card:        { borderRadius: rs(8), overflow: 'hidden', borderWidth: 1, backgroundColor: C.BG_CARD, position: 'relative' },
  img:         { width: '100%', height: '100%' },
  imgFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: C.BG_MID },
  grad:        { position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%' },
  badge:       { position: 'absolute', top: 4, left: 4, borderRadius: rs(4), padding: rs(3), borderWidth: 1 },
  badgeEmoji:  { fontWeight: '700' },
  info:        { position: 'absolute', bottom: 0, left: 0, right: 0, padding: rs(5) },
  name:        { fontWeight: '800', color: C.TEXT, lineHeight: rf(12) },
  stats:       { flexDirection: 'row', alignItems: 'baseline', marginTop: rs(2) },
  sv:          { fontWeight: '900' },
  sl:          { color: C.TEXT_ON_DARK_SOFT, fontWeight: '700', marginLeft: 1, letterSpacing: 0.2 },
});

// ── Reward chip ───────────────────────────────────────────────────────────────
function RewardChip({ img, color, value, label, dimmed, scale }) {
  const rsc = n => Math.max(1, Math.round(n * scale));
  const c  = dimmed ? C.TEXT_DISABLED : color;
  return (
    <View style={rw.chip}>
      <Image source={img} style={[rw.chipIcon, { width: rsc(18), height: rsc(18) }, dimmed && { opacity: 0.4 }]} resizeMode="contain" />
      <Text style={[rw.val, { color: c, fontSize: rsc(14) }]}>{value}</Text>
      <Text style={[rw.lbl, { fontSize: rsc(8) }, dimmed && { color: C.TEXT_DISABLED }]}>{label}</Text>
    </View>
  );
}
const rw = StyleSheet.create({
  chip:     { flex: 1, alignItems: 'center', gap: rs(2), paddingVertical: rs(8) },
  chipIcon: {},
  val:      { fontWeight: '900' },
  lbl:      { color: C.TEXT_MUTED, fontWeight: '700' },
});

// ── Milestone bar ─────────────────────────────────────────────────────────────
function MilestoneBar({ floor, scale }) {
  const rsc  = n => Math.max(1, Math.round(n * scale));
  const prev = useMemo(
    () => FLOOR_MILESTONES.slice().reverse().find(m => m.floor < floor)?.floor ?? 0, [floor],
  );
  const next = useMemo(
    () => FLOOR_MILESTONES.find(m => m.floor >= floor), [floor],
  );
  const pct = Math.min(1, (floor - prev) / ((next?.floor ?? TOWER_MAX_FLOOR) - prev));
  return (
    <View style={mb.wrap}>
      <View style={mb.track}>
        <LinearGradient colors={[C.PRIMARY_DARK, C.PRIMARY_LIGHT]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[mb.fill, { width: `${pct * 100}%` }]} />
        <View style={[mb.dot, { left: `${pct * 100}%` }]} />
      </View>
      <View style={mb.row}>
        <Text style={[mb.from, { fontSize: rsc(8) }]}>Floor {prev || 1}</Text>
        <Text style={[mb.to, { fontSize: rsc(8) }]}>{next ? `⭐ Floor ${next.floor}` : '🏆 MAX'}</Text>
      </View>
    </View>
  );
}
const mb = StyleSheet.create({
  wrap:  { gap: rs(4) },
  track: { height: 3, borderRadius: 2, backgroundColor: C.BG_MID, overflow: 'visible', position: 'relative' },
  fill:  { height: 3, borderRadius: 2 },
  dot:   { position: 'absolute', top: -4, width: rs(10), height: rs(10), borderRadius: rs(5), backgroundColor: C.PRIMARY_LIGHT, borderWidth: 2, borderColor: C.TEXT, transform: [{ translateX: -5 }] },
  row:   { flexDirection: 'row', justifyContent: 'space-between' },
  from:  { color: C.TEXT_MUTED, fontWeight: '700' },
  to:    { color: C.PRIMARY_LIGHT, fontWeight: '900' },
});

// ── Section label ─────────────────────────────────────────────────────────────
function SHead({ text, scale }) {
  const rsc = n => Math.max(1, Math.round(n * scale));
  return <Text style={[sh.t, { fontSize: rsc(8) }]}>{text}</Text>;
}
const sh = StyleSheet.create({
  t: { fontWeight: '900', color: C.TEXT_MUTED, letterSpacing: 2.2, marginBottom: rs(4) },
});

// ── Stat cell (left pane) ─────────────────────────────────────────────────────
function StatCell({ icon, label, value, color, scale }) {
  const rsc = n => Math.max(1, Math.round(n * scale));
  return (
    <View style={sc.wrap}>
      <Ionicons name={icon} size={rsc(13)} color={color} />
      <Text style={[sc.lbl, { fontSize: rsc(8) }]}>{label}</Text>
      <Text style={[sc.val, { color, fontSize: rsc(13) }]}>{value}</Text>
    </View>
  );
}
const sc = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', gap: rs(2) },
  lbl:  { color: C.TEXT_MUTED, fontWeight: '700' },
  val:  { fontWeight: '900' },
});

// ─────────────────────────────────────────────────────────────────────────────
export default function TowerScreen({ navigation }) {
  const { width: W, height: H } = useWindowDimensions();

  // Responsive scale - reference 1280px wide, clamped 0.70–1.30
  const scale  = Math.max(0.70, Math.min(1.30, W / 1280));
  const rsc    = n => Math.max(1, Math.round(n * scale));
  const LEFT_W = Math.round(W * 0.30);

  // Enemy section fills remaining space; cards are sized from measured section height.
  // Initial estimate avoids zero-size on first render.
  const [enemySectionH, setEnemySectionH] = useState(
    () => Math.round((H - rsc(52) - PAD * 2) * 0.55),
  );
  const onEnemySectionLayout = useCallback(
    e => setEnemySectionH(e.nativeEvent.layout.height), [],
  );
  // Cards fill the enemy section minus the SHead label and gaps, capped at rsc(330).
  const enemyCardH = Math.min(
    Math.max(rsc(40), enemySectionH - rsc(22) - GAP * 2),
    rsc(330),
  );
  const enemyCardW = Math.round(enemyCardH * 0.60);

  const team                = useGameStore(s => s.team);
  const towerCurrentFloor   = useGameStore(s => s.towerCurrentFloor);
  const towerHighestFloor   = useGameStore(s => s.towerHighestFloor);
  const towerCoins          = useGameStore(s => s.towerCoins);
  const checkTowerWeekReset = useGameStore(s => s.checkTowerWeekReset);

  const [, setClockTick] = useState(0);
  useFocusEffect(useCallback(() => {
    checkTowerWeekReset();
    const id = setInterval(() => {
      checkTowerWeekReset();
      setClockTick(t => t + 1);
    }, 60000);
    return () => clearInterval(id);
  }, [checkTowerWeekReset]));

  const conquered   = towerCurrentFloor > TOWER_MAX_FLOOR;
  const floor       = Math.min(towerCurrentFloor, TOWER_MAX_FLOOR);
  const enemies     = getTowerEnemyGroup(floor);
  const reward      = getTowerFloorReward(floor);
  const diff        = getFloorDifficulty(floor);
  const isBoss      = isBossFloor(floor);
  const isMilestone = isMilestoneFloor(floor);
  const resetIn     = getResetCountdown();

  const badgeExtra  = (isBoss || isMilestone) ? rsc(36) : 0;
  const circleDiam  = Math.min(
    Math.round(LEFT_W * 0.82),
    Math.round(H * 0.52 - badgeExtra),
    rsc(260),
  );
  const floorFont   = Math.min(rsc(44), Math.round(circleDiam * 0.30));

  const floorAnim = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    floorAnim.setValue(0.5);
    Animated.spring(floorAnim, { toValue: 1, friction: 5, tension: 140, useNativeDriver: true }).start();
  }, [floor]);

  const glow = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(glow, { toValue: 0.9,  duration: 1100, useNativeDriver: true }),
      Animated.timing(glow, { toValue: 0.3,  duration: 1100, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);

  const handleEnter = () => {
    if (conquered) return;
    if (!team || team.length === 0) {
      Alert.alert(
        'No Team Selected',
        'Add heroes to your team before entering the Tower.',
        [{ text: 'OK' }],
      );
      return;
    }
    AudioManager.playButtonSFX();
    navigation.navigate('Battle', {
      chapterEnemies: enemies,
      chapterId:      null,
      chapterRewards: { gems: 0, heroId: null },
      fromStory: false, practiceMode: false,
      towerMode: true, towerFloor: floor, towerRewards: reward,
    });
  };

  const bg  = isMilestone ? C.GRAD_TOWER_MILESTONE
            : isBoss      ? C.GRAD_TOWER_BOSS
            :               C.GRAD_TOWER;
  const btn = isMilestone ? [C.GOLD_DARK, C.GOLD]
            : isBoss      ? [C.DANGER_DARK, C.DANGER]
            :               [C.PRIMARY_DARK, C.PRIMARY];
  const lbl = conquered   ? `🏆 TOWER CONQUERED - RESETS IN ${resetIn}`
            : isMilestone ? `⚡ MILESTONE  FLOOR ${floor}`
            : isBoss      ? `💀 BOSS FLOOR  ${floor}`
            :               `ENTER  FLOOR  ${floor}`;

  return (
    <View style={s.root}>
      <LinearGradient colors={bg} style={StyleSheet.absoluteFill} />
      <Sparks color={diff.color + 'CC'} />

      {/* Ambient glow disc */}
      <Animated.View style={[s.glowDisc, {
        backgroundColor: diff.color + '20',
        width: circleDiam * 2, height: circleDiam * 2,
        borderRadius: circleDiam,
        top: H * 0.05, left: LEFT_W * 0.05,
        opacity: glow,
      }]} />

      <View style={s.safe}>

        {/* ══ HEADER ══════════════════════════════════════════════════════ */}
        <View style={[s.header, { height: rsc(52) }]}>
          <TouchableOpacity
            style={[s.back, { width: rs(34), height: rs(34) }]}
            onPress={() => { AudioManager.playButtonSFX(); navigation.navigate('Home'); }}
            activeOpacity={0.8}
          >
            <Ionicons name="chevron-back" size={rs(20)} color={C.TEXT} />
          </TouchableOpacity>

          <View style={s.headerMid}>
            <Text style={[s.hTitle, { fontSize: rf(14), letterSpacing: rsc(3.5) }]}>ENDLESS TOWER</Text>
            <Text style={[s.hSub, { fontSize: rf(13) }]}>Resets in {resetIn}</Text>
          </View>

          <View style={s.hRight}>
            <View style={s.hPills}>
              <View style={[s.pill, { borderColor: C.GOLD + '55', backgroundColor: C.GOLD + '12' }]}>
                <Ionicons name="trophy" size={rs(10)} color={C.GOLD} />
                <Text style={[s.pillTxt, { color: C.GOLD, fontSize: rf(13) }]}>Best {towerHighestFloor || '-'}</Text>
              </View>
              <View style={[s.pill, { borderColor: C.PRIMARY_LIGHT + '55', backgroundColor: C.PRIMARY_GLOW }]}>
                <Image source={COIN_IMG} style={[s.pillIcon, { width: rs(14), height: rs(14) }]} resizeMode="contain" />
                <Text style={[s.pillTxt, { color: C.PRIMARY_LIGHT, fontSize: rf(13) }]}>{towerCoins} coins</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: rs(6) }}>
              <TouchableOpacity
                style={s.shopBtn}
                onPress={() => { AudioManager.playButtonSFX(); navigation.navigate('Leaderboard'); }}
                activeOpacity={0.8}
              >
                <Ionicons name="podium-outline" size={rs(21)} color={C.CYAN} />
                <Text style={[s.shopTxt, { color: C.CYAN, fontSize: rf(13) }]}>RANKS</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.shopBtn}
                onPress={() => { AudioManager.playButtonSFX(); navigation.navigate('TowerShop'); }}
                activeOpacity={0.8}
              >
                <Ionicons name="storefront-outline" size={rs(21)} color={C.GOLD} />
                <Text style={[s.shopTxt, { fontSize: rf(13) }]}>SHOP</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ══ BODY ════════════════════════════════════════════════════════ */}
        <View style={s.body}>

          {/* ── LEFT: floor identity ──────────────────────────────────── */}
          <View style={[s.leftCol, { width: LEFT_W }]}>

            <Animated.View style={[s.circleWrap, { transform: [{ scale: floorAnim }] }]}>
              <Animated.View style={[s.glowRing, {
                borderColor: diff.color,
                width: circleDiam + 20, height: circleDiam + 20,
                borderRadius: (circleDiam + 20) / 2,
                opacity: glow,
              }]} />
              <View style={[s.circle, {
                width: circleDiam, height: circleDiam,
                borderRadius: circleDiam / 2,
                borderColor: diff.color + '70',
              }]}>
                <LinearGradient colors={[diff.color + '30', 'transparent']} style={StyleSheet.absoluteFill} />

                {(isBoss || isMilestone) && (
                  <View style={[s.typeBadge, {
                    backgroundColor: (isMilestone ? C.GOLD : C.DANGER) + '18',
                    borderColor:     (isMilestone ? C.GOLD : C.DANGER) + '55',
                  }]}>
                    <Text style={[s.typeTxt, { color: isMilestone ? C.GOLD : C.DANGER, fontSize: rf(12) }]}>
                      {isMilestone ? '⚡ MILESTONE' : '💀 BOSS'}
                    </Text>
                  </View>
                )}

                <Text style={[s.circleWord, { fontSize: rf(13) }]}>FLOOR</Text>
                <Text style={[s.circleNum, { color: diff.color, fontSize: floorFont, lineHeight: floorFont + 6 }]}>
                  {floor}
                </Text>
                <Text style={[s.circleMax, { color: diff.color + '55', fontSize: rf(13) }]}>/ {TOWER_MAX_FLOOR}</Text>

                <View style={[s.diffPill, { borderColor: diff.color + '55', backgroundColor: diff.color + '18' }]}>
                  <View style={[s.diffDot, { backgroundColor: diff.color }]} />
                  <Text style={[s.diffTxt, { color: diff.color, fontSize: rf(13) }]}>{diff.label}</Text>
                </View>
              </View>
            </Animated.View>

            <View style={s.statsRow}>
              <StatCell icon="trophy-outline" label="Best"  value={towerHighestFloor || '-'} color={C.GOLD}          scale={scale} />
              <View style={s.statSep} />
              <StatCell icon="star-outline"   label="Coins" value={towerCoins}              color={C.PRIMARY_LIGHT}  scale={scale} />
            </View>

          </View>

          {/* Column separator */}
          <View style={s.colSep} />

          {/* ── RIGHT: intel ──────────────────────────────────────────── */}
          <View style={s.rightCol}>

            {/* Enemy section - flex:1 so it fills whatever space remains above the fixed bottom */}
            <View style={s.enemySection} onLayout={onEnemySectionLayout}>
              <SHead text="ENEMIES THIS FLOOR" scale={scale} />
              <View style={[s.enemyRow, { height: enemyCardH }]}>
                {enemies.enemies.map((e, i) => (
                  <EnemyCard key={i} enemy={e} cardW={enemyCardW} cardH={enemyCardH} scale={scale} />
                ))}
                {enemies.enemies.length < 3 && Array.from({ length: 3 - enemies.enemies.length }).map((_, i) => (
                  <View key={`empty_${i}`} style={[ec.card, { width: enemyCardW, height: enemyCardH, borderColor: 'transparent' }]} />
                ))}
              </View>
            </View>

            {/* Rewards - always visible; not inside flex:1 so never pushed off screen */}
            <SHead text="FLOOR REWARDS" scale={scale} />
            <View style={s.rewardCard}>
              <LinearGradient colors={[C.GLASS_1, 'transparent']} style={StyleSheet.absoluteFill} />
              <RewardChip img={GOLD_IMG} color={C.GOLD}         value={`+${reward.gold.toLocaleString()}`} label="Gold"  scale={scale} />
              <View style={s.chipSep} />
              <RewardChip img={COIN_IMG} color={C.GOLD}         value={`+${reward.coins}`}                label="Coins" scale={scale} />
              <View style={s.chipSep} />
              <RewardChip img={GEM_IMG}  color={C.PRIMARY_LIGHT} value={reward.gems > 0 ? `+${reward.gems}` : '-'} label="Gems" dimmed={reward.gems === 0} scale={scale} />
            </View>

            {/* Milestone progress */}
            <View style={s.milestoneWrap}>
              <MilestoneBar floor={floor} scale={scale} />
            </View>

            {/* ENTER button */}
            <TouchableOpacity
              style={[s.enterBtn, conquered && { opacity: 0.55 }]}
              onPress={handleEnter}
              disabled={conquered}
              activeOpacity={0.87}
            >
              <Animated.View style={[s.enterGlow, { backgroundColor: diff.color + '38', opacity: glow }]} />
              <LinearGradient colors={btn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.enterInner}>
                <Ionicons name={conquered ? 'trophy' : 'flash'} size={rs(20)} color={C.TEXT} />
                <Text style={[s.enterTxt, { fontSize: rf(13) }]}>{lbl}</Text>
                {!conquered && <Ionicons name="chevron-forward" size={rs(22)} color={C.TEXT_ON_DARK_SOFT} />}
              </LinearGradient>
            </TouchableOpacity>

          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },

  // position applied inline (uses live W/H)
  glowDisc: { position: 'absolute' },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: rs(PAD + 2), gap: rs(PAD),
    backgroundColor: C.OVERLAY_1,
    borderBottomWidth: 1, borderBottomColor: C.BORDER_SUBTLE,
  },
  back: {
    borderRadius: rs(8),
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.BORDER_SUBTLE,
    borderWidth: 1, borderColor: C.GLASS_5,
  },
  headerMid: { flex: 1 },
  hTitle:    { fontWeight: '900', color: C.TEXT },
  hSub:      { color: C.TEXT_MUTED, marginTop: 1 },
  hRight:    { flexDirection: 'row', alignItems: 'center', gap: rs(GAP) },
  hPills:    { flexDirection: 'row', gap: rs(GAP) },
  pill:      { flexDirection: 'row', alignItems: 'center', gap: rs(4), borderRadius: rs(20), paddingHorizontal: rs(9), paddingVertical: rs(4), borderWidth: 1 },
  pillTxt:   { fontWeight: '800' },
  pillIcon:  {},
  shopBtn:   { flexDirection: 'row', alignItems: 'center', gap: rs(4), borderRadius: rs(8), paddingHorizontal: rs(10), paddingVertical: rs(5), borderWidth: 1, borderColor: C.GOLD + '66', backgroundColor: C.GOLD + '14' },
  shopTxt:   { fontWeight: '900', color: C.GOLD, letterSpacing: 0.8 },

  // ── Body ────────────────────────────────────────────────────────────────────
  body:    { flex: 1, flexDirection: 'row' },
  colSep:  { width: 1, backgroundColor: C.BORDER_SUBTLE, marginVertical: rs(PAD) },

  // ── Left column - width applied inline ──────────────────────────────────────
  leftCol: {
    alignItems: 'center', justifyContent: 'center',
    gap: rs(GAP), paddingHorizontal: rs(PAD), paddingVertical: rs(PAD),
  },
  typeBadge: { position: 'absolute', top: 10, borderRadius: rs(20), paddingHorizontal: rs(10), paddingVertical: rs(3), borderWidth: 1 },
  typeTxt:   { fontWeight: '900', letterSpacing: 1.2 },

  circleWrap: { alignItems: 'center', justifyContent: 'center' },
  glowRing:   { position: 'absolute', borderWidth: 1.5 },
  circle: {
    borderWidth: 2, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.OVERLAY_3,
    shadowOffset: { width: 0, height: 0 }, shadowRadius: 18, shadowOpacity: 0.8, elevation: 8,
  },
  circleWord: { fontWeight: '800', color: C.TEXT_MUTED, letterSpacing: 4 },
  circleNum:  { fontWeight: '900', letterSpacing: -2 },
  circleMax:  { fontWeight: '700', letterSpacing: 0.5, marginTop: -2 },

  diffPill: { position: 'absolute', bottom: 10, flexDirection: 'row', alignItems: 'center', gap: rs(5), borderRadius: rs(20), paddingHorizontal: rs(12), paddingVertical: rs(4), borderWidth: 1 },
  diffDot:  { width: rs(5), height: rs(5), borderRadius: rs(3) },
  diffTxt:  { fontWeight: '900', letterSpacing: 1.8 },

  statsRow: {
    flexDirection: 'row', width: '100%',
    borderRadius: rs(9), overflow: 'hidden',
    borderWidth: 1, borderColor: C.BORDER,
    backgroundColor: C.OVERLAY_2, paddingVertical: rs(8),
  },
  statSep: { width: 1, backgroundColor: C.BORDER },

  // ── Right column ─────────────────────────────────────────────────────────────
  rightCol: {
    flex: 1, paddingHorizontal: rs(PAD), paddingVertical: rs(PAD), gap: rs(GAP),
  },

  // Flex:1 - expands to fill remaining space above the fixed rewards/button section.
  // Cards are sized from this measured height via onLayout.
  enemySection: {
    flex: 1, gap: rs(GAP),
  },

  // Enemy row - height set inline to fill available space
  enemyRow: {
    flexDirection: 'row', gap: rs(GAP), justifyContent: 'center',
  },

  rewardCard: {
    flexDirection: 'row',
    borderRadius: rs(10), overflow: 'hidden',
    borderWidth: 1, borderColor: C.BORDER,
    backgroundColor: C.OVERLAY_2, position: 'relative',
  },
  chipSep: { width: 1, backgroundColor: C.BORDER, marginVertical: rs(6) },

  milestoneWrap: {
    paddingHorizontal: rs(PAD), paddingVertical: rs(6),
    borderRadius: rs(9), borderWidth: 1,
    borderColor: C.BORDER,
    backgroundColor: C.OVERLAY_2,
  },

  enterBtn:   { borderRadius: rs(11), overflow: 'hidden', position: 'relative' },
  enterGlow:  { position: 'absolute', top: -8, left: -8, right: -8, bottom: -8, borderRadius: rs(18) },
  enterInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: rs(12), gap: rs(8) },
  enterTxt:   { flex: 1, textAlign: 'center', fontWeight: '900', color: C.TEXT, letterSpacing: 0.8 },
});
