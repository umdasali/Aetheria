import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Dimensions, Animated, Image, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useGameStore from '../store/gameStore';
import { fetchTopN, fetchOwnRank, submitScore, getCurrentUserId, CATEGORIES } from '../cloud/leaderboardService';
import { C } from '../theme/colors';

const { width: W } = Dimensions.get('window');

// ── Constants ─────────────────────────────────────────────────────────────────
const TABS = [
  { key: CATEGORIES.TOWER_WEEKLY,  label: 'WEEKLY',  icon: 'flame',        unit: 'FLOOR' },
  { key: CATEGORIES.TOWER_ALLTIME, label: 'ALL TIME', icon: 'layers',       unit: 'FLOOR' },
  { key: CATEGORIES.COLLECTION,    label: 'COLLECT',  icon: 'people',       unit: 'HEROES' },
];

const GOLD   = { color: C.MEDAL_GOLD,   dim: C.MEDAL_GOLD_DIM,   bg: C.MEDAL_GOLD_BG,   glow: C.MEDAL_GOLD_GLOW   };
const SILVER = { color: C.MEDAL_SILVER, dim: C.MEDAL_SILVER_DIM, bg: C.MEDAL_SILVER_BG, glow: C.MEDAL_SILVER_GLOW };
const BRONZE = { color: C.MEDAL_BRONZE, dim: C.MEDAL_BRONZE_DIM, bg: C.MEDAL_BRONZE_BG, glow: C.MEDAL_BRONZE_GLOW };
const TIER   = [GOLD, SILVER, BRONZE];

const LEFT_W = Math.round(W * 0.41);
const PAD    = 10;
// Fixed list-row height: paddingVertical 9·2 + avatar 26 + 1px bottom border.
const ROW_H  = 45;

// ── Medal images ──────────────────────────────────────────────────────────────
const MEDAL_GOLD   = require('../../assets/home/gold-medal.png');
const MEDAL_SILVER = require('../../assets/home/silver-medal.png');
const MEDAL_BRONZE = require('../../assets/home/bronze-medal.png');
const MEDALS       = [null, MEDAL_GOLD, MEDAL_SILVER, MEDAL_BRONZE];

// ── Per-tab response cache (prevents redundant fetches) ───────────────────────
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const _cache = new Map(); // key: category → { data, ownRank, ownScore, ownUserId, ts }
// The user the cache belongs to — when it changes (sign in/out/switch) the cache
// is wiped so one account never shows another's rank.
let _cacheUserId = null;

// Avatar colors per first-char bucket
const AV_PALETTE = [C.PRIMARY, C.SECONDARY, C.CYAN, C.GOLD, C.SUCCESS, C.DANGER];
function avatarColor(name) {
  const code = name && name.length ? name.charCodeAt(0) : 65;
  return AV_PALETTE[code % AV_PALETTE.length];
}
function initials(name) {
  if (!name) return '?';
  // split on any whitespace run + drop empties so "Sir  Lancelot" → ["Sir","Lancelot"]
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
}

// ── Skeleton shimmer ──────────────────────────────────────────────────────────
function SkeletonBox({ shimX, w, h, radius = 5, style }) {
  return (
    <View style={[{ height: h, borderRadius: radius, backgroundColor: C.BG_RAISED, overflow: 'hidden' }, w ? { width: w } : null, style]}>
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { transform: [{ translateX: shimX }] }]}
      >
        <LinearGradient
          colors={['transparent', C.GLASS_5, 'transparent']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={{ width: 140, height: '100%' }}
        />
      </Animated.View>
    </View>
  );
}

function useSkimmer(range) {
  const anim = useRef(new Animated.Value(-1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(anim, { toValue: 1, duration: 1300, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, []);
  return anim.interpolate({ inputRange: [-1, 1], outputRange: [-range, range] });
}

function LeftPanelSkeleton() {
  const shimX = useSkimmer(LEFT_W);
  return (
    <View style={s.leftPanel}>
      <SkeletonBox shimX={shimX} w={70} h={7} radius={4} />

      {/* Champion card */}
      <View style={[cc.card, { borderColor: C.BORDER }]}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: C.BG_RAISED }]} />
        <View style={cc.row}>
          <SkeletonBox shimX={shimX} w={28} h={38} radius={6} />
          <SkeletonBox shimX={shimX} w={44} h={44} radius={22} />
          <View style={{ flex: 1, gap: 6 }}>
            <SkeletonBox shimX={shimX} w={55} h={7} radius={3} />
            <SkeletonBox shimX={shimX} w={110} h={14} radius={4} />
          </View>
          <View style={{ alignItems: 'flex-end', gap: 5 }}>
            <SkeletonBox shimX={shimX} w={48} h={20} radius={4} />
            <SkeletonBox shimX={shimX} w={30} h={8} radius={3} />
          </View>
        </View>
      </View>

      {/* Runner cards */}
      <View style={[s.runnersRow]}>
        {[0, 1].map(i => (
          <View key={i} style={[rc.card, { borderColor: C.BORDER }]}>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: C.BG_RAISED }]} />
            <View style={rc.inner}>
              <SkeletonBox shimX={shimX} w={22} h={34} radius={5} />
              <SkeletonBox shimX={shimX} w={32} h={32} radius={16} />
              <View style={{ flex: 1, gap: 5 }}>
                <SkeletonBox shimX={shimX} h={10} radius={3} style={{ flex: undefined, width: '75%' }} />
                <SkeletonBox shimX={shimX} h={12} radius={3} style={{ flex: undefined, width: '55%' }} />
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Divider stays visible */}
      <View style={s.divider}>
        <View style={s.dividerLine} />
        <Text style={s.dividerTxt}>YOUR RANKING</Text>
        <View style={s.dividerLine} />
      </View>

      {/* Your rank card */}
      <View style={[yr.card, { borderColor: C.BORDER }]}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: C.BG_RAISED }]} />
        <View style={yr.topLine} />
        <View style={yr.row}>
          <SkeletonBox shimX={shimX} w={32} h={32} radius={16} />
          <View style={{ flex: 1, gap: 5 }}>
            <SkeletonBox shimX={shimX} h={9} radius={3} style={{ width: '60%' }} />
            <SkeletonBox shimX={shimX} h={10} radius={3} style={{ width: '45%' }} />
          </View>
          <SkeletonBox shimX={shimX} w={34} h={34} radius={6} />
        </View>
      </View>
    </View>
  );
}

function RightPanelSkeleton({ unit }) {
  const RIGHT_W = W - LEFT_W - 1;
  const shimX   = useSkimmer(RIGHT_W);
  return (
    <View style={s.rightPanel}>
      <View style={s.colHeader}>
        <Text style={[s.colHdr, { width: 30 }]}>#</Text>
        <View style={{ width: 26 }} />
        <Text style={[s.colHdr, { flex: 1 }]}>PLAYER</Text>
        <Text style={[s.colHdr, { width: 56, textAlign: 'right' }]}>{unit}</Text>
      </View>
      {Array.from({ length: 12 }).map((_, i) => (
        <View key={i} style={[rr.row, { opacity: Math.max(0.15, 1 - i * 0.07) }]}>
          <View style={rr.rankCell}>
            <SkeletonBox shimX={shimX} w={22} h={10} radius={3} />
          </View>
          <SkeletonBox shimX={shimX} w={26} h={26} radius={13} />
          <SkeletonBox shimX={shimX} h={11} radius={4} style={{ flex: 1, marginRight: 4 }} />
          <SkeletonBox shimX={shimX} w={50} h={11} radius={4} />
        </View>
      ))}
    </View>
  );
}

// ── Avatar circle ─────────────────────────────────────────────────────────────
function Avatar({ name, size = 36, color }) {
  const bg = color ?? avatarColor(name);
  return (
    <View style={[av.wrap, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg + '33', borderColor: bg + '88' }]}>
      <Text style={[av.txt, { fontSize: size * 0.33, color: bg }]}>{initials(name)}</Text>
    </View>
  );
}
const av = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  txt:  { fontWeight: '900' },
});

// ── Champion card (rank #1 — full width, gold, shimmer) ───────────────────────
function ChampionCard({ player, unit }) {
  const empty   = !player;
  const shimmer = useRef(new Animated.Value(-1)).current;
  useEffect(() => {
    // Only animate when there's a champion — the sweep view isn't rendered when empty.
    if (empty) return;
    const anim = Animated.loop(
      Animated.timing(shimmer, { toValue: 1, duration: 2200, useNativeDriver: true })
    );
    anim.start();
    return () => anim.stop();
  }, [empty, shimmer]);
  const shimX = shimmer.interpolate({ inputRange: [-1, 1], outputRange: [-W * 0.4, W * 0.4] });

  return (
    <View style={cc.card}>
      {/* Background gradient */}
      <LinearGradient
        colors={[...C.GRAD_CHAMPION, C.BG_CARD]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Gold border glow */}
      <View style={cc.glowBorder} />
      {/* Top gold line */}
      <View style={cc.topLine} />
      {/* Shimmer sweep */}
      {!empty && (
        <Animated.View
          pointerEvents="none"
          style={[cc.shimmer, { transform: [{ translateX: shimX }] }]}
        >
          <LinearGradient
            colors={['transparent', C.MEDAL_GOLD_SHIMMER, 'transparent']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{ width: 80, height: '100%' }}
          />
        </Animated.View>
      )}

      <View style={cc.row}>
        {/* Medal + rank */}
        <View style={cc.crownCol}>
          <Image source={MEDAL_GOLD} style={cc.medalImg} resizeMode="contain" />
          <View style={cc.rankPill}>
            <Text style={cc.rankPillTxt}>#1</Text>
          </View>
        </View>

        {/* Avatar */}
        {empty
          ? <View style={[cc.emptyAvatar, { borderColor: GOLD.dim }]} />
          : <Avatar name={player.player_name} size={44} color={GOLD.color} />
        }

        {/* Name + label */}
        <View style={cc.info}>
          <Text style={cc.label}>CHAMPION</Text>
          <Text style={[cc.name, empty && cc.namePlaceholder]} numberOfLines={1}>
            {empty ? 'No champion yet' : player.player_name}
          </Text>
        </View>

        {/* Score */}
        {!empty && (
          <View style={cc.scoreCol}>
            <Text style={cc.scoreNum}>{player.score.toLocaleString()}</Text>
            <Text style={cc.scoreUnit}>{unit}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const cc = StyleSheet.create({
  card: {
    height: 84, borderRadius: 12, overflow: 'hidden',
    borderWidth: 1.5, borderColor: GOLD.color + '55',
    position: 'relative',
    shadowColor: GOLD.color, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 8,
    elevation: 8,
  },
  glowBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12, borderWidth: 1, borderColor: GOLD.color + '18',
  },
  topLine: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: GOLD.color },
  shimmer: { position: 'absolute', top: 0, bottom: 0, left: 0 },
  row:     { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 12 },

  crownCol: { alignItems: 'center', gap: 3 },
  medalImg:  { width: 30, height: 30 },
  rankPill:  {
    backgroundColor: GOLD.color + '33', borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 2,
    borderWidth: 1, borderColor: GOLD.color + '66',
  },
  rankPillTxt: { fontSize: 8, fontWeight: '900', color: GOLD.color },

  emptyAvatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, backgroundColor: GOLD.dim + '22' },

  info:    { flex: 1, gap: 4 },
  label:   { fontSize: 7, fontWeight: '900', color: GOLD.dim, letterSpacing: 2.5 },
  name:    { fontSize: 14, fontWeight: '900', color: GOLD.color, letterSpacing: 0.5 },
  namePlaceholder: { color: C.TEXT_DISABLED, fontStyle: 'italic', fontSize: 11 },

  scoreCol:  { alignItems: 'flex-end', gap: 3 },
  scoreNum:  { fontSize: 20, fontWeight: '900', color: GOLD.color },
  scoreUnit: { fontSize: 8, color: GOLD.dim, fontWeight: '800', letterSpacing: 1 },
});

// ── Runner-up card (#2 or #3) ─────────────────────────────────────────────────
function RunnerCard({ rank, player, unit }) {
  const tier  = TIER[rank - 1];
  const empty = !player;

  return (
    <View style={[rc.card, { borderColor: tier.color + '44' }]}>
      <LinearGradient
        colors={[tier.dim + 'BB', C.BG_CARD + 'EE']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[rc.topLine, { backgroundColor: tier.color }]} />

      <View style={rc.inner}>
        {/* Medal image + rank */}
        <View style={rc.medalCol}>
          <Image source={MEDALS[rank]} style={rc.medalImg} resizeMode="contain" />
          <Text style={[rc.rankNum, { color: tier.color }]}>#{rank}</Text>
        </View>

        {/* Avatar */}
        {empty
          ? <View style={[rc.emptyAv, { borderColor: tier.dim }]} />
          : <Avatar name={player.player_name} size={32} color={tier.color} />
        }

        {/* Info */}
        <View style={rc.info}>
          <Text style={[rc.name, empty && { color: C.TEXT_DISABLED, fontSize: 9 }]} numberOfLines={1}>
            {empty ? 'Empty' : player.player_name}
          </Text>
          {!empty && (
            <Text style={[rc.score, { color: tier.color }]}>
              {player.score.toLocaleString()} <Text style={rc.scoreUnit}>{unit}</Text>
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const rc = StyleSheet.create({
  card: {
    flex: 1, borderRadius: 10, overflow: 'hidden',
    borderWidth: 1, position: 'relative',
  },
  topLine: { height: 2, width: '100%' },
  inner:   { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, gap: 8 },

  medalCol: { alignItems: 'center', gap: 2 },
  medalImg: { width: 22, height: 22 },
  rankNum:    { fontSize: 9, fontWeight: '900' },

  emptyAv: { width: 32, height: 32, borderRadius: 16, borderWidth: 1.5 },

  info:      { flex: 1, gap: 3 },
  name:      { fontSize: 10, fontWeight: '800', color: C.TEXT },
  score:     { fontSize: 12, fontWeight: '900', marginTop: 1 },
  scoreUnit: { fontSize: 7, fontWeight: '700' },
});

// ── Your rank badge (pinned bottom of left panel) ─────────────────────────────
function YourRankCard({ rank, score, name, unit }) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const anim = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.03, duration: 900, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1,    duration: 900, useNativeDriver: true }),
    ]));
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View style={[yr.card, { transform: [{ scale: pulse }] }]}>
      <LinearGradient
        colors={[C.PRIMARY_DARK + 'DD', C.BG_MID + 'EE']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={yr.topLine} />

      <View style={yr.row}>
        <Avatar name={name} size={32} color={C.PRIMARY_LIGHT} />

        <View style={yr.info}>
          <View style={yr.youRow}>
            <View style={yr.youBadge}>
              <Text style={yr.youTxt}>YOU</Text>
            </View>
            <Text style={yr.name} numberOfLines={1}>{name ?? 'Aetherian'}</Text>
          </View>
          {score !== null && (
            <Text style={yr.score}>{score?.toLocaleString()} <Text style={yr.unit}>{unit}</Text></Text>
          )}
        </View>

        <View style={yr.rankBox}>
          {rank !== null
            ? <>
                <Text style={yr.rankHash}>#</Text>
                <Text style={yr.rankNum}>{rank}</Text>
              </>
            : <Text style={yr.unranked}>—</Text>
          }
        </View>
      </View>
    </Animated.View>
  );
}

const yr = StyleSheet.create({
  card: {
    height: 60, borderRadius: 10, overflow: 'hidden',
    borderWidth: 1.5, borderColor: C.PRIMARY_LIGHT + '66',
    shadowColor: C.PRIMARY, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 6,
    elevation: 6,
  },
  topLine: { height: 2, backgroundColor: C.PRIMARY_LIGHT, width: '100%' },
  row:  { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 10 },

  info:   { flex: 1, gap: 3 },
  youRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  youBadge: {
    backgroundColor: C.PRIMARY + '55', borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 2,
    borderWidth: 1, borderColor: C.PRIMARY_LIGHT + '77',
  },
  youTxt:   { fontSize: 7, fontWeight: '900', color: C.PRIMARY_LIGHT, letterSpacing: 1.5 },
  name:     { fontSize: 10, fontWeight: '700', color: C.TEXT },
  score:    { fontSize: 10, fontWeight: '800', color: C.PRIMARY_LIGHT },
  unit:     { fontSize: 7, fontWeight: '700', color: C.TEXT_MUTED },

  rankBox:  { alignItems: 'center', justifyContent: 'center', gap: 0 },
  rankHash: { fontSize: 9, fontWeight: '900', color: C.PRIMARY_LIGHT, lineHeight: 10 },
  rankNum:  { fontSize: 22, fontWeight: '900', color: C.PRIMARY_LIGHT, lineHeight: 24 },
  unranked: { fontSize: 20, color: C.TEXT_DISABLED },
});

// ── List row ──────────────────────────────────────────────────────────────────
const RankRow = React.memo(function RankRow({ item, ownUserId }) {
  const isTop3 = item.rank <= 3;
  const tier   = isTop3 ? TIER[item.rank - 1] : null;
  // Identity is matched by user id — never by rank (ties share a rank number).
  const isOwn  = !!ownUserId && item.user_id === ownUserId;
  return (
    <View style={[rr.row, isOwn && rr.rowOwn, isTop3 && { backgroundColor: tier.bg }]}>
      {/* Left: rank */}
      <View style={rr.rankCell}>
        {isTop3
          ? <Image source={MEDALS[item.rank]} style={rr.medalImg} resizeMode="contain" />
          : <Text style={[rr.rankTxt, isOwn && { color: C.PRIMARY_LIGHT }]}>
              {String(item.rank).padStart(2, ' ')}
            </Text>
        }
      </View>

      {/* Avatar */}
      <Avatar
        name={item.player_name}
        size={26}
        color={isTop3 ? tier.color : isOwn ? C.PRIMARY_LIGHT : undefined}
      />

      {/* Name */}
      <Text
        style={[rr.nameTxt,
          isTop3 && { color: tier.color, fontWeight: '900' },
          isOwn  && { color: C.PRIMARY_LIGHT, fontWeight: '900' },
        ]}
        numberOfLines={1}
      >
        {item.player_name}{isOwn ? '  ← YOU' : ''}
      </Text>

      {/* Score */}
      <Text style={[rr.scoreTxt, isTop3 && { color: tier.color }, isOwn && { color: C.PRIMARY_LIGHT }]}>
        {item.score.toLocaleString()}
      </Text>
    </View>
  );
}, (prev, next) =>
  prev.ownUserId        === next.ownUserId        &&
  prev.item.user_id     === next.item.user_id     &&
  prev.item.rank        === next.item.rank        &&
  prev.item.score       === next.item.score       &&
  prev.item.player_name === next.item.player_name
);

const rr = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 9,
    borderBottomWidth: 1, borderBottomColor: C.BORDER_SUBTLE,
  },
  rowOwn: { backgroundColor: C.PRIMARY + '12' },

  rankCell:  { width: 32, alignItems: 'center' },
  medalImg:  { width: 20, height: 20 },
  rankTxt:   { fontSize: 11, fontWeight: '700', color: C.TEXT_MUTED, fontVariant: ['tabular-nums'] },

  nameTxt:   { flex: 1, fontSize: 11, fontWeight: '700', color: C.TEXT },
  scoreTxt:  { width: 60, fontSize: 12, fontWeight: '800', color: C.TEXT_SOFT, textAlign: 'right' },
});

// ── Main screen ───────────────────────────────────────────────────────────────
export default function LeaderboardScreen({ navigation }) {
  const insets             = useSafeAreaInsets();
  const playerProfile      = useGameStore(s => s.playerProfile);
  const towerHighestFloor  = useGameStore(s => s.towerHighestFloor);
  const towerWeeklyBest    = useGameStore(s => s.towerWeeklyBest);
  const ownedHeroes        = useGameStore(s => s.ownedHeroes);
  const checkTowerWeekReset = useGameStore(s => s.checkTowerWeekReset);

  const [activeTab, setActiveTab] = useState(CATEGORIES.TOWER_WEEKLY);
  const [rows,      setRows]      = useState([]);
  const [ownRank,   setOwnRank]   = useState(null);
  const [ownScore,  setOwnScore]  = useState(null);
  const [ownUserId, setOwnUserId] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  // Monotonic request id — only the most recent load is allowed to commit state,
  // so a slow response for a tab the user already left can't overwrite the view.
  const reqIdRef = useRef(0);

  const tabDef = TABS.find(t => t.key === activeTab);
  const unit   = tabDef?.unit ?? 'FLOOR';

  // Single source of truth for "what score does this tab submit?"
  const scoreForTab = useCallback((tab) => {
    if (tab === CATEGORIES.COLLECTION)   return ownedHeroes.length;
    if (tab === CATEGORIES.TOWER_WEEKLY) return towerWeeklyBest;
    return towerHighestFloor;
  }, [ownedHeroes, towerWeeklyBest, towerHighestFloor]);

  const loadLeaderboard = useCallback(async (forceRefresh = false) => {
    const category = activeTab;
    const myReq    = ++reqIdRef.current;
    const isCurrent = () => myReq === reqIdRef.current;

    // Keep towerWeeklyBest aligned with the current week before reading it.
    checkTowerWeekReset();

    // Drop the whole cache if the signed-in account changed.
    const userId = await getCurrentUserId();
    if (userId !== _cacheUserId) { _cache.clear(); _cacheUserId = userId; }
    if (!isCurrent()) return;

    // Serve from cache if fresh and not a manual refresh
    const cached = _cache.get(category);
    if (!forceRefresh && cached && (Date.now() - cached.ts < CACHE_TTL)) {
      setRows(cached.data);
      setOwnRank(cached.ownRank);
      setOwnScore(cached.ownScore);
      setOwnUserId(cached.ownUserId);
      setError(null);
      return;
    }

    // Initial load shows the skeleton; a refresh-over-existing-data keeps content.
    setLoading(true);
    setError(null);
    try {
      // currentScore is used only to decide WHEN to re-submit; the authoritative score
      // is derived server-side by submit_score() from the uploaded save.
      const currentScore = scoreForTab(category);
      if (forceRefresh || !cached || cached.ownScore !== currentScore) {
        await submitScore(category, playerProfile?.name ?? 'Aetherian');
      }
      const [topResult, ownResult] = await Promise.all([
        fetchTopN(category, 100),
        fetchOwnRank(category),
      ]);
      if (topResult.error) throw new Error(String(topResult.error));
      if (!isCurrent()) return; // a newer load superseded this one

      // Prefer the rank from the player's own listed row (dense, consistent with
      // the visible list); fall back to the queried rank when outside the top-N.
      const myId   = userId ?? ownResult.userId ?? null;
      const myRow  = myId ? topResult.data.find(r => r.user_id === myId) : null;
      const rank   = myRow ? myRow.rank  : ownResult.rank;
      const score  = myRow ? myRow.score : ownResult.score;

      _cache.set(category, {
        data: topResult.data, ownRank: rank, ownScore: score,
        ownUserId: myId, ts: Date.now(),
      });
      setRows(topResult.data);
      setOwnRank(rank);
      setOwnScore(score);
      setOwnUserId(myId);
    } catch (e) {
      if (isCurrent()) setError(e.message ?? 'Failed to load');
    } finally {
      if (isCurrent()) setLoading(false);
    }
  }, [activeTab, scoreForTab, playerProfile, checkTowerWeekReset]);

  // Reload whenever the tab changes. loadLeaderboard is intentionally omitted —
  // it already closes over activeTab, and listing it would re-fire on unrelated
  // store changes (score/profile) mid-view.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadLeaderboard(); }, [activeTab]);

  // Resolve the podium in a single pass instead of three Array.find scans.
  const { top1, top2, top3 } = useMemo(() => {
    let a = null, b = null, c = null;
    for (const r of rows) {
      if      (r.rank === 1 && !a) a = r;
      else if (r.rank === 2 && !b) b = r;
      else if (r.rank === 3 && !c) c = r;
      if (a && b && c) break;
    }
    return { top1: a, top2: b, top3: c };
  }, [rows]);

  return (
    <View style={[s.root, { paddingBottom: insets.bottom, paddingLeft: insets.left, paddingRight: insets.right }]}>
      <LinearGradient colors={C.GRAD_BG} style={StyleSheet.absoluteFill} />

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <LinearGradient colors={C.GRAD_HEADER} style={[s.header, { paddingTop: insets.top + 4 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={s.backBtn}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={22} color={C.TEXT} />
        </TouchableOpacity>

        {/* Title */}
        <View style={s.titleBlock}>
          <Ionicons name="podium" size={16} color={GOLD.color} />
          <Text style={s.title}>RANKINGS</Text>
        </View>

        {/* Category tab pills */}
        <View style={s.tabRow}>
          {TABS.map(tab => {
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[s.tabPill, active && s.tabPillActive]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`${tab.label} leaderboard`}
              >
                <Ionicons name={active ? tab.icon : tab.icon + '-outline'} size={12} color={active ? C.PRIMARY_LIGHT : C.TEXT_MUTED} />
                <Text style={[s.tabPillTxt, active && s.tabPillTxtActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          onPress={() => loadLeaderboard(true)}
          style={s.refreshBtn}
          activeOpacity={0.75}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Refresh leaderboard"
        >
          {loading
            ? <ActivityIndicator size="small" color={C.TEXT_ON_DARK} />
            : <Ionicons name="refresh-outline" size={18} color={C.TEXT_ON_DARK} />
          }
        </TouchableOpacity>
      </LinearGradient>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <View style={s.body}>
        {loading && rows.length === 0 ? (
          // Skeleton only on a cold load — a refresh over existing data keeps the
          // content on screen (the header spinner signals the in-flight request).
          <>
            <LeftPanelSkeleton />
            <View style={s.separator} />
            <RightPanelSkeleton unit={unit} />
          </>
        ) : (
          <>
            {/* LEFT: podium + your rank ──────────────────────────────── */}
            <View style={s.leftPanel}>
              <Text style={s.sectionLbl}>TOP PLAYERS</Text>
              <ChampionCard player={top1} unit={unit} />
              <View style={s.runnersRow}>
                <RunnerCard rank={2} player={top2} unit={unit} />
                <RunnerCard rank={3} player={top3} unit={unit} />
              </View>
              <View style={s.divider}>
                <View style={s.dividerLine} />
                <Text style={s.dividerTxt}>YOUR RANKING</Text>
                <View style={s.dividerLine} />
              </View>
              <YourRankCard rank={ownRank} score={ownScore} name={playerProfile?.name} unit={unit} />
            </View>

            {/* Vertical separator */}
            <View style={s.separator} />

            {/* RIGHT: full ranked list ───────────────────────────────── */}
            <View style={s.rightPanel}>
              <View style={s.colHeader}>
                <Text style={[s.colHdr, { width: 30 }]}>#</Text>
                <View style={{ width: 26 }} />
                <Text style={[s.colHdr, { flex: 1 }]}>PLAYER</Text>
                <Text style={[s.colHdr, { width: 56, textAlign: 'right' }]}>{unit}</Text>
              </View>

              {/* Non-blocking error banner — shown when a refresh failed but we
                  still have data to display underneath. */}
              {error && rows.length > 0 && (
                <View style={s.errBanner}>
                  <Ionicons name="cloud-offline-outline" size={12} color={C.DANGER} />
                  <Text style={s.errBannerTxt} numberOfLines={1}>Couldn’t refresh — showing saved ranks</Text>
                </View>
              )}

              {rows.length === 0 ? (
                <View style={s.emptyWrap}>
                  <Text style={s.emptyIcon}>🏆</Text>
                  <Text style={s.emptyTitle}>{error ? 'Could Not Load' : 'No Rankings Yet'}</Text>
                  <Text style={s.emptyBody}>
                    {error
                      ? 'Could not reach the leaderboard. Check your connection or sign in to Cloud Save.'
                      : activeTab === CATEGORIES.COLLECTION
                        ? 'Summon heroes to climb the collection ranks'
                        : 'Complete Tower floors to join the leaderboard'}
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={rows}
                  extraData={ownUserId}
                  keyExtractor={item => item.user_id}
                  renderItem={({ item }) => <RankRow item={item} ownUserId={ownUserId} />}
                  showsVerticalScrollIndicator={false}
                  initialNumToRender={20}
                  getItemLayout={(_, index) => ({ length: ROW_H, offset: ROW_H * index, index })}
                />
              )}
            </View>
          </>
        )}
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.BG_DEEP },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: C.GLASS_6,
    gap: 12,
  },
  backBtn:   { padding: 6 },
  titleBlock:{ flexDirection: 'row', alignItems: 'center', gap: 7 },
  title:     { fontSize: 16, fontWeight: '900', color: C.TEXT, letterSpacing: 4 },
  refreshBtn:{ padding: 8 },

  tabRow: { flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  tabPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1,
    borderColor: C.BORDER, backgroundColor: C.GLASS_3,
  },
  tabPillActive: {
    backgroundColor: C.PRIMARY + '33',
    borderColor: C.PRIMARY_LIGHT + '99',
  },
  tabPillTxt:       { fontSize: 9, fontWeight: '800', color: C.TEXT_MUTED, letterSpacing: 0.8 },
  tabPillTxtActive: { color: C.PRIMARY_LIGHT },

  // Body
  body: { flex: 1, flexDirection: 'row' },

  // Left panel
  leftPanel: {
    width: LEFT_W, padding: 12, paddingBottom: 14, gap: 9, overflow: 'hidden',
  },
  sectionLbl: {
    fontSize: 7, fontWeight: '900', color: C.TEXT_DISABLED,
    letterSpacing: 2.5, marginBottom: 2, marginLeft: 2,
  },
  runnersRow: { flexDirection: 'row', gap: 8, flex: 1 },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 2 },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.PRIMARY + '44' },
  dividerTxt:  { fontSize: 7, fontWeight: '900', color: C.PRIMARY + 'BB', letterSpacing: 2 },

  // Separator
  separator: { width: 1, backgroundColor: C.BORDER_SUBTLE, marginVertical: 12 },

  // Right panel
  rightPanel: { flex: 1 },

  colHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: C.BG_STATS,
    borderBottomWidth: 1, borderBottomColor: C.BORDER_SUBTLE,
  },
  colHdr: { fontSize: 8, fontWeight: '900', color: C.TEXT_DISABLED, letterSpacing: 1.5 },

  // Error banner (refresh failed but data is still shown)
  errBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 6,
    backgroundColor: C.DANGER + '1A',
    borderBottomWidth: 1, borderBottomColor: C.DANGER + '44',
  },
  errBannerTxt: { flex: 1, fontSize: 9, fontWeight: '700', color: C.DANGER, letterSpacing: 0.5 },

  // Empty state
  emptyWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24,
  },
  emptyIcon:  { fontSize: 40 },
  emptyTitle: { fontSize: 13, fontWeight: '900', color: C.TEXT_MUTED, letterSpacing: 1 },
  emptyBody:  { fontSize: 10, color: C.TEXT_DISABLED, textAlign: 'center', lineHeight: 16 },

});
