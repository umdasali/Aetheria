import React, { useEffect, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Dimensions, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import useGameStore from '../store/gameStore';
import {
  getTowerEnemyGroup, getTowerFloorReward,
  getFloorDifficulty, isBossFloor, isMilestoneFloor,
  FLOOR_MILESTONES, TOWER_MAX_FLOOR,
} from '../data/towerData';
import { ENEMY_IMAGES } from '../data/enemies';
import AudioManager from '../utils/AudioManager';
import { C } from '../theme/colors';

const { width: W, height: H } = Dimensions.get('window');
const COIN_IMG = require('../../assets/currency/coin.png');
const GEM_IMG  = require('../../assets/currency/gem.png');
const GOLD_IMG = require('../../assets/currency/gold.png');

// ── Fixed layout tokens ───────────────────────────────────────────────────────
const HEADER_H = 52;
const PAD      = 10;
const GAP      = 6;
const LEFT_W   = Math.round(W * 0.33);
const AVAIL_H  = H - HEADER_H - PAD * 2;   // usable body height

// ── Enemy portrait card dimensions (3:5 = 768×1280 actual image ratio) ─────────
// Budget: AVAIL_H minus (reward 44 + milestone 28 + button 44 + shead 11 + 4×gaps 24 + pad 16) ≈ 147px fixed
// → enemy section gets AVAIL_H - 147 ≈ 131px on 360-400px landscape devices.
const ENEMY_CARD_H = Math.min(132, Math.round(AVAIL_H - 148));
const ENEMY_CARD_W = Math.round(ENEMY_CARD_H * (3 / 5));  // 3:5 matches 768×1280

// ── Weekly reset countdown ────────────────────────────────────────────────────
function getResetCountdown() {
  const now  = new Date();
  const day  = now.getDay();
  const next = new Date(now);
  // Reset is on Sunday (day 0). From any other day, count days until next Sunday.
  // From Sunday itself, count 7 days to the same time next week.
  const daysUntil = day === 0 ? 7 : 7 - day;
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

// ── Enemy portrait card (3:4, image bg, overlaid stats) ───────────────────────
function EnemyCard({ enemy }) {
  const isBoss = enemy.tier === 'boss';
  const isMini = enemy.tier === 'mini-boss';
  const col    = isBoss ? C.DANGER : isMini ? C.GOLD : C.TEXT_MUTED;
  const imgSrc = enemy.imageKey && ENEMY_IMAGES[enemy.imageKey]
    ? ENEMY_IMAGES[enemy.imageKey] : null;

  return (
    <View style={[ec.card, { borderColor: col + '55', width: ENEMY_CARD_W, height: ENEMY_CARD_H }]}>
      {/* Portrait image — explicit 100%×100% so the 3:5 image fills the 3:5 card exactly */}
      {imgSrc
        ? <Image source={imgSrc} style={ec.img} resizeMode="cover" />
        : <View style={[ec.img, ec.imgFallback]}>
            <Text style={{ fontSize: 28 }}>{isBoss ? '💀' : isMini ? '⚔️' : '👾'}</Text>
          </View>}

      {/* Bottom gradient overlay */}
      <LinearGradient colors={['transparent', C.OVERLAY_DEEP]} style={ec.grad} />

      {/* Tier badge top-left */}
      <View style={[ec.badge, { backgroundColor: col + '28', borderColor: col + '60' }]}>
        <Text style={ec.badgeEmoji}>{isBoss ? '💀' : isMini ? '⚔️' : '👾'}</Text>
      </View>

      {/* Name + stats overlay at bottom */}
      <View style={ec.info}>
        <Text style={ec.name} numberOfLines={1}>{enemy.name}</Text>
        <View style={ec.stats}>
          <Text style={[ec.sv, { color: C.HP }]}>{enemy.hp.toLocaleString()}</Text>
          <Text style={ec.sl}>HP</Text>
          <Text style={[ec.sv, { color: C.ATK, marginLeft: 6 }]}>{enemy.atk}</Text>
          <Text style={ec.sl}>ATK</Text>
        </View>
      </View>
    </View>
  );
}
const ec = StyleSheet.create({
  card:        { borderRadius: 8, overflow: 'hidden', borderWidth: 1, backgroundColor: C.BG_CARD, position: 'relative' },
  img:         { width: '100%', height: '100%' },            // fills the 3:5 card exactly
  imgFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: C.BG_MID },
  grad:        { position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%' },
  badge:       { position: 'absolute', top: 4, left: 4, borderRadius: 4, padding: 3, borderWidth: 1 },
  badgeEmoji:  { fontSize: 10 },
  info:        { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 5 },
  name:        { fontSize: 8, fontWeight: '800', color: C.TEXT, lineHeight: 10 },
  stats:       { flexDirection: 'row', alignItems: 'baseline', marginTop: 2 },
  sv:          { fontSize: 8, fontWeight: '900' },
  sl:          { fontSize: 5, color: C.TEXT_ON_DARK_SOFT, fontWeight: '700', marginLeft: 1, letterSpacing: 0.2 },
});

// ── Reward chip (horizontal row item) ─────────────────────────────────────────
function RewardChip({ img, color, value, label, dimmed }) {
  const c = dimmed ? C.TEXT_DISABLED : color;
  return (
    <View style={rw.chip}>
      <Image source={img} style={[rw.chipIcon, dimmed && { opacity: 0.4 }]} resizeMode="contain" />
      <Text style={[rw.val, { color: c }]}>{value}</Text>
      <Text style={[rw.lbl, dimmed && { color: C.TEXT_DISABLED }]}>{label}</Text>
    </View>
  );
}
const rw = StyleSheet.create({
  chip:     { flex: 1, alignItems: 'center', gap: 2, paddingVertical: 7 },
  chipIcon: { width: 16, height: 16 },
  val:      { fontSize: 12, fontWeight: '900' },
  lbl:      { fontSize: 7, color: C.TEXT_MUTED, fontWeight: '700' },
});

// ── Milestone bar ─────────────────────────────────────────────────────────────
function MilestoneBar({ floor }) {
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
        <Text style={mb.from}>Floor {prev || 1}</Text>
        <Text style={mb.to}>{next ? `⭐ Floor ${next.floor}` : '🏆 MAX'}</Text>
      </View>
    </View>
  );
}
const mb = StyleSheet.create({
  wrap:  { gap: 4 },
  track: { height: 3, borderRadius: 2, backgroundColor: C.BG_MID, overflow: 'visible', position: 'relative' },
  fill:  { height: 3, borderRadius: 2 },
  dot:   { position: 'absolute', top: -4, width: 10, height: 10, borderRadius: 5, backgroundColor: C.PRIMARY_LIGHT, borderWidth: 2, borderColor: C.TEXT, transform: [{ translateX: -5 }] },
  row:   { flexDirection: 'row', justifyContent: 'space-between' },
  from:  { fontSize: 7, color: C.TEXT_MUTED, fontWeight: '700' },
  to:    { fontSize: 7, color: C.PRIMARY_LIGHT, fontWeight: '900' },
});

// ── Section label ─────────────────────────────────────────────────────────────
function SHead({ text }) {
  return <Text style={sh.t}>{text}</Text>;
}
const sh = StyleSheet.create({
  t: { fontSize: 7, fontWeight: '900', color: C.TEXT_MUTED, letterSpacing: 2.2, marginBottom: 4 },
});

// ── Stat cell (left pane) ─────────────────────────────────────────────────────
function StatCell({ icon, label, value, color }) {
  return (
    <View style={sc.wrap}>
      <Ionicons name={icon} size={11} color={color} />
      <Text style={sc.lbl}>{label}</Text>
      <Text style={[sc.val, { color }]}>{value}</Text>
    </View>
  );
}
const sc = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', gap: 2 },
  lbl:  { fontSize: 7, color: C.TEXT_MUTED, fontWeight: '700' },
  val:  { fontSize: 11, fontWeight: '900' },
});

// ─────────────────────────────────────────────────────────────────────────────
export default function TowerScreen({ navigation }) {
  const { towerCurrentFloor, towerHighestFloor, towerCoins, checkTowerWeekReset } = useGameStore();
  useEffect(() => { checkTowerWeekReset(); }, []);

  const floor       = Math.min(towerCurrentFloor, TOWER_MAX_FLOOR);
  const enemies     = getTowerEnemyGroup(floor);
  const reward      = getTowerFloorReward(floor);
  const diff        = getFloorDifficulty(floor);
  const isBoss      = isBossFloor(floor);
  const isMilestone = isMilestoneFloor(floor);
  const resetIn     = getResetCountdown();

  // ── Dynamic circle size — shrinks when boss/milestone badge is shown ──────
  // Badge adds ~36px (height 28 + gap 8). Without badge the circle can be bigger.
  const badgeExtra  = (isBoss || isMilestone) ? 36 : 0;
  const circleDiam  = Math.min(
    Math.round(LEFT_W * 0.82),
    Math.round(AVAIL_H - 104 - badgeExtra),   // 104 = diff+stats+their-gaps
  );
  const floorFont   = Math.min(44, Math.round(circleDiam * 0.30));

  // Spring in on floor change
  const floorAnim = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    floorAnim.setValue(0.5);
    Animated.spring(floorAnim, { toValue: 1, friction: 5, tension: 140, useNativeDriver: true }).start();
  }, [floor]);

  // Perpetual glow pulse
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
  const lbl = isMilestone ? `⚡ MILESTONE  FLOOR ${floor}`
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
        opacity: glow,
      }]} />

      <SafeAreaView style={s.safe} edges={['top', 'bottom', 'left', 'right']}>

        {/* ══ HEADER ══════════════════════════════════════════════════════ */}
        <View style={s.header}>
          <TouchableOpacity style={s.back} onPress={() => { AudioManager.playButtonSFX(); navigation.navigate('Home'); }} activeOpacity={0.8}>
            <Ionicons name="chevron-back" size={20} color={C.TEXT} />
          </TouchableOpacity>

          <View style={s.headerMid}>
            <Text style={s.hTitle}>ENDLESS TOWER</Text>
            <Text style={s.hSub}>Resets in {resetIn}</Text>
          </View>

          <View style={s.hRight}>
            <View style={s.hPills}>
              <View style={[s.pill, { borderColor: C.GOLD + '55', backgroundColor: C.GOLD + '12' }]}>
                <Ionicons name="trophy" size={9} color={C.GOLD} />
                <Text style={[s.pillTxt, { color: C.GOLD }]}>Best {towerHighestFloor || '—'}</Text>
              </View>
              <View style={[s.pill, { borderColor: C.PRIMARY_LIGHT + '55', backgroundColor: C.PRIMARY_GLOW }]}>
                <Image source={COIN_IMG} style={s.pillIcon} resizeMode="contain" />
                <Text style={[s.pillTxt, { color: C.PRIMARY_LIGHT }]}>{towerCoins} coins</Text>
              </View>
            </View>
            <TouchableOpacity
              style={s.shopBtn}
              onPress={() => { AudioManager.playButtonSFX(); navigation.navigate('TowerShop'); }}
              activeOpacity={0.8}
            >
              <Ionicons name="storefront-outline" size={13} color={C.GOLD} />
              <Text style={s.shopTxt}>SHOP</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ══ BODY ════════════════════════════════════════════════════════ */}
        <View style={s.body}>

          {/* ── LEFT: floor identity ──────────────────────────────────── */}
          <View style={s.leftCol}>

            {/* Floor circle — dynamically sized to prevent overflow */}
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

                {/* Boss / Milestone badge — pinned to top of circle */}
                {(isBoss || isMilestone) && (
                  <View style={[s.typeBadge, {
                    backgroundColor: (isMilestone ? C.GOLD : C.DANGER) + '18',
                    borderColor:     (isMilestone ? C.GOLD : C.DANGER) + '55',
                  }]}>
                    <Text style={[s.typeTxt, { color: isMilestone ? C.GOLD : C.DANGER }]}>
                      {isMilestone ? '⚡ MILESTONE' : '💀 BOSS'}
                    </Text>
                  </View>
                )}

                <Text style={s.circleWord}>FLOOR</Text>
                <Text style={[s.circleNum, { color: diff.color, fontSize: floorFont, lineHeight: floorFont + 6 }]}>
                  {floor}
                </Text>
                <Text style={[s.circleMax, { color: diff.color + '55' }]}>/ {TOWER_MAX_FLOOR}</Text>

                {/* Difficulty pill — pinned to bottom of circle */}
                <View style={[s.diffPill, { borderColor: diff.color + '55', backgroundColor: diff.color + '18' }]}>
                  <View style={[s.diffDot, { backgroundColor: diff.color }]} />
                  <Text style={[s.diffTxt, { color: diff.color }]}>{diff.label}</Text>
                </View>
              </View>
            </Animated.View>


            {/* Best + Coins stats */}
            <View style={s.statsRow}>
              <StatCell icon="trophy-outline" label="Best"  value={towerHighestFloor || '—'} color={C.GOLD} />
              <View style={s.statSep} />
              <StatCell icon="star-outline"   label="Coins" value={towerCoins} color={C.PRIMARY_LIGHT} />
            </View>

          </View>

          {/* Column separator */}
          <View style={s.colSep} />

          {/* ── RIGHT: intel ──────────────────────────────────────────── */}
          <View style={s.rightCol}>

            {/* ── Enemy portrait cards (1 row × 3 cols, 3:4 ratio) ── */}
            <SHead text="ENEMIES THIS FLOOR" />
            <View style={s.enemyRow}>
              {enemies.enemies.map((e, i) => (
                <EnemyCard key={i} enemy={e} />
              ))}
              {/* Fill empty slots if fewer than 3 enemies */}
              {enemies.enemies.length < 3 && Array.from({ length: 3 - enemies.enemies.length }).map((_, i) => (
                <View key={`empty_${i}`} style={[ec.card, { width: ENEMY_CARD_W, height: ENEMY_CARD_H, borderColor: 'transparent' }]} />
              ))}
            </View>

            {/* Flex spacer */}
            <View style={{ flex: 1 }} />

            {/* ── Rewards: single horizontal row ── */}
            <SHead text="FLOOR REWARDS" />
            <View style={s.rewardCard}>
              <LinearGradient colors={['rgba(255,255,255,0.03)', 'transparent']} style={StyleSheet.absoluteFill} />
              <RewardChip
                img={GOLD_IMG}
                color={C.GOLD}
                value={`+${reward.gold.toLocaleString()}`}
                label="Gold"
              />
              <View style={s.chipSep} />
              <RewardChip
                img={COIN_IMG}
                color={C.GOLD}
                value={`+${reward.coins}`}
                label="Coins"
              />
              <View style={s.chipSep} />
              <RewardChip
                img={GEM_IMG}
                color={C.PRIMARY_LIGHT}
                value={reward.gems > 0 ? `+${reward.gems}` : '—'}
                label="Gems"
                dimmed={reward.gems === 0}
              />
            </View>

            {/* ── Milestone progress ── */}
            <View style={s.milestoneWrap}>
              <MilestoneBar floor={floor} />
            </View>

            {/* ── ENTER button ── */}
            <TouchableOpacity style={s.enterBtn} onPress={handleEnter} activeOpacity={0.87}>
              <Animated.View style={[s.enterGlow, { backgroundColor: diff.color + '38', opacity: glow }]} />
              <LinearGradient colors={btn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.enterInner}>
                <Ionicons name="flash" size={15} color="#fff" />
                <Text style={s.enterTxt}>{lbl}</Text>
                <Ionicons name="chevron-forward" size={13} color="rgba(255,255,255,0.55)" />
              </LinearGradient>
            </TouchableOpacity>

          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },

  glowDisc: { position: 'absolute', top: H * 0.05, left: LEFT_W * 0.05 },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    height: HEADER_H,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: PAD + 2, gap: PAD,
    backgroundColor: C.OVERLAY_1,
    borderBottomWidth: 1, borderBottomColor: C.BORDER_SUBTLE,
  },
  back: {
    width: 34, height: 34, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.BORDER_SUBTLE,
    borderWidth: 1, borderColor: C.GLASS_5,
  },
  headerMid: { flex: 1 },
  hTitle:    { fontSize: 14, fontWeight: '900', color: C.TEXT, letterSpacing: 3.5 },
  hSub:      { fontSize: 8, color: C.TEXT_MUTED, marginTop: 1 },
  hRight:    { flexDirection: 'row', alignItems: 'center', gap: GAP },
  hPills:    { flexDirection: 'row', gap: GAP },
  pill:      { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4, borderWidth: 1 },
  pillTxt:   { fontSize: 10, fontWeight: '800' },
  pillIcon:  { width: 14, height: 14 },
  shopBtn:   { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: C.GOLD + '66', backgroundColor: C.GOLD + '14' },
  shopTxt:   { fontSize: 10, fontWeight: '900', color: C.GOLD, letterSpacing: 0.8 },
  // ── Body ────────────────────────────────────────────────────────────────────
  body:    { flex: 1, flexDirection: 'row' },
  colSep:  { width: 1, backgroundColor: C.BORDER_SUBTLE, marginVertical: PAD },

  // ── Left column ─────────────────────────────────────────────────────────────
  leftCol: {
    width: LEFT_W,
    alignItems: 'center', justifyContent: 'center',
    gap: GAP, paddingHorizontal: PAD, paddingVertical: PAD,
  },
  typeBadge: { position: 'absolute', top: 10, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1 },
  typeTxt:   { fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },

  circleWrap: { alignItems: 'center', justifyContent: 'center' },
  glowRing:   { position: 'absolute', borderWidth: 1.5 },
  circle: {
    borderWidth: 2, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.OVERLAY_3,
    shadowOffset: { width: 0, height: 0 }, shadowRadius: 18, shadowOpacity: 0.8, elevation: 8,
  },
  circleWord: { fontSize: 8, fontWeight: '800', color: C.TEXT_MUTED, letterSpacing: 4 },
  circleNum:  { fontWeight: '900', letterSpacing: -2 },
  circleMax:  { fontSize: 7, fontWeight: '700', letterSpacing: 0.5, marginTop: -2 },

  diffPill: { position: 'absolute', bottom: 10, flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1 },
  diffDot:  { width: 5, height: 5, borderRadius: 3 },
  diffTxt:  { fontSize: 10, fontWeight: '900', letterSpacing: 1.8 },

  statsRow: {
    flexDirection: 'row', width: '100%',
    borderRadius: 9, overflow: 'hidden',
    borderWidth: 1, borderColor: C.BORDER,
    backgroundColor: C.OVERLAY_2, paddingVertical: 8,
  },
  statSep: { width: 1, backgroundColor: C.BORDER },

  // ── Right column ─────────────────────────────────────────────────────────────
  rightCol: {
    flex: 1, paddingHorizontal: PAD, paddingVertical: PAD, gap: GAP,
  },

  // 1-row × 3-col enemy portrait cards
  enemyRow: {
    flexDirection: 'row', gap: GAP, justifyContent: 'center',
  },

  // Single-row reward card
  rewardCard: {
    flexDirection: 'row',
    borderRadius: 10, overflow: 'hidden',
    borderWidth: 1, borderColor: C.BORDER,
    backgroundColor: C.OVERLAY_2, position: 'relative',
  },
  chipSep: { width: 1, backgroundColor: C.BORDER, marginVertical: 6 },

  // Milestone track wrapper
  milestoneWrap: {
    paddingHorizontal: PAD, paddingVertical: 6,
    borderRadius: 9, borderWidth: 1,
    borderColor: C.BORDER,
    backgroundColor: C.OVERLAY_2,
  },

  // ── Enter button ─────────────────────────────────────────────────────────────
  enterBtn:   { borderRadius: 11, overflow: 'hidden', position: 'relative' },
  enterGlow:  { position: 'absolute', top: -8, left: -8, right: -8, bottom: -8, borderRadius: 18 },
  enterInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 11, gap: 8 },
  enterTxt:   { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '900', color: '#fff', letterSpacing: 0.8 },
});
