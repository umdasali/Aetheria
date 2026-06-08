import { useState, useRef, useMemo, memo, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Image, Dimensions, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { HEROES, FACTIONS } from '../data/heroes';
import useGameStore from '../store/gameStore';
import AudioManager from '../utils/AudioManager';
import { C, RANK_COLORS, RANK } from '../theme/colors';

const { width: W } = Dimensions.get('window');

const SIDEBAR_W = 148;
const COLS      = 5;
const GRID_PAD  = 10;
const GAP       = 7;
const CARD_W    = Math.floor((W - SIDEBAR_W - GRID_PAD * 2 - GAP * (COLS - 1)) / COLS);
const CARD_H    = Math.floor(CARD_W * 1.42);

const FACTION_FILTERS = [
  { key: 'All',       label: 'All Heroes' },
  { key: 'EMBERVEIL', label: 'Emberveil'  },
  { key: 'GLACIARA',  label: 'Glaciara'   },
  { key: 'SUNSPIRE',  label: 'Sunspire'   },
  { key: 'VERDANIA',  label: 'Verdania'   },
  { key: 'VOIDMARK',  label: 'Voidmark'   },
];

const SORT_OPTIONS = ['Default', 'Rank', 'Name'];
const RANK_ORDER   = { SOVEREIGN: -1, S: 0, A: 1, B: 2, C: 3 };

export default function CollectionScreen({ navigation }) {
  const { ownedHeroes, team, heroCollection } = useGameStore();
  const [filter,   setFilter]   = useState('All');
  const [sortBy,   setSortBy]   = useState('Default');
  const [showSort, setShowSort] = useState(false);

  // O(1) membership lookups — stable refs unless the underlying arrays change
  const ownedSet = useMemo(() => new Set(ownedHeroes), [ownedHeroes]);
  const teamSet  = useMemo(() => new Set(team),        [team]);
  const isOwned  = useCallback((id) => ownedSet.has(id), [ownedSet]);
  const inTeam   = useCallback((id) => teamSet.has(id),  [teamSet]);

  const filtered = useMemo(() => {
    let list = HEROES.filter((h) => filter === 'All' || h.faction === filter);
    if (sortBy === 'Rank') list = [...list].sort((a, b) => {
      const aRank = heroCollection[a.id]?.effectiveRank ?? a.rank;
      const bRank = heroCollection[b.id]?.effectiveRank ?? b.rank;
      return (RANK_ORDER[aRank] ?? 99) - (RANK_ORDER[bRank] ?? 99);
    });
    else if (sortBy === 'Name') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [filter, sortBy, heroCollection]);

  // Collection BGM — start on focus, stop on blur
  useFocusEffect(
    useCallback(() => {
      AudioManager.startCollectionBGM();
      return () => AudioManager.stopCollectionBGM();
    }, [])
  );

  // Stable renderItem — only re-created when the dependencies that affect card rendering change.
  const renderItem = useCallback(({ item: hero }) => (
    <HeroGridCard
      hero={hero}
      owned={isOwned(hero.id)}
      onTeam={inTeam(hero.id)}
      effectiveRank={heroCollection[hero.id]?.effectiveRank ?? hero.rank}
      onPress={() => { AudioManager.playButtonSFX(); navigation.navigate('HeroDetail', { heroId: hero.id }); }}
    />
  ), [isOwned, inTeam, navigation, heroCollection]);

  return (
    <View style={styles.root}>
      <LinearGradient colors={C.GRAD_BG} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>

        {/* ══ TOP BAR ══ */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => { AudioManager.playButtonSFX(); navigation.goBack(); }} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={19} color={C.TEXT} />
            <Text style={styles.backText}>BACK</Text>
          </TouchableOpacity>

          <View style={styles.topCenter}>
            <Text style={styles.topTitle}>HEROES</Text>
            <Text style={styles.topCount}>{ownedHeroes.length} / {HEROES.length} Owned</Text>
          </View>

        </View>

        {/* ══ BODY ══ */}
        <View style={styles.body}>

          {/* Faction sidebar — zIndex: 2 ensures sort dropdown floats above FlatList */}
          <View style={styles.sidebar}>
            <View style={styles.sideList}>
              {FACTION_FILTERS.map((f) => {
                const active = filter === f.key;
                const fData  = FACTIONS[f.key];
                const accent = fData ? fData.color : C.PRIMARY_LIGHT;
                return (
                  <TouchableOpacity
                    key={f.key}
                    style={[styles.sideItem, active && styles.sideItemActive]}
                    onPress={() => { AudioManager.playButtonSFX(); setFilter(f.key); }}
                    activeOpacity={0.78}
                  >
                    {active && <View style={[styles.sideActiveLine, { backgroundColor: accent }]} />}
                    <View style={styles.sideItemRow}>
                      {fData ? (
                        <Image source={fData.image} style={styles.sideIcon} resizeMode="contain" />
                      ) : (
                        <Ionicons name="apps" size={15} color={active ? C.TEXT : C.TEXT_MUTED} />
                      )}
                      <Text style={[styles.sideLabel, active && styles.sideLabelActive]}>
                        {f.label}
                      </Text>
                    </View>
                    {active && (
                      <View style={[styles.sideCountBadge, { backgroundColor: accent + '30' }]}>
                        <Text style={[styles.sideCountText, { color: accent }]}>{filtered.length}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Sort — sortArea has high zIndex so dropdown floats above grid */}
            <View style={styles.sortArea}>
              <View style={styles.sortSep} />
              <TouchableOpacity
                style={styles.sortBtn}
                onPress={() => { AudioManager.playButtonSFX(); setShowSort(!showSort); }}
                activeOpacity={0.75}
              >
                <Ionicons name="funnel-outline" size={12} color={C.TEXT_MUTED} />
                <Text style={styles.sortBtnLabel}>Sort</Text>
                <Text style={styles.sortBtnValue}>{sortBy}</Text>
                <Ionicons name={showSort ? 'chevron-up' : 'chevron-down'} size={10} color={C.TEXT_MUTED} />
              </TouchableOpacity>
              {showSort && (
                <View style={styles.sortDropdown}>
                  {SORT_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      style={[styles.sortOpt, sortBy === opt && styles.sortOptActive]}
                      onPress={() => { AudioManager.playButtonSFX(); setSortBy(opt); setShowSort(false); }}
                    >
                      <Text style={[styles.sortOptText, sortBy === opt && styles.sortOptTextActive]}>
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Hero grid
              extraData={team} — when team changes FlatList forces item re-renders
              even if `filtered` (the data array) didn't change.             */}
          <FlatList
            data={filtered}
            numColumns={COLS}
            key={`${filter}-${COLS}`}
            keyExtractor={(h) => h.id}
            contentContainerStyle={styles.grid}
            columnWrapperStyle={styles.gridRow}
            showsVerticalScrollIndicator={false}
            extraData={team}
            renderItem={renderItem}
            // Performance props
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews
            getItemLayout={(_data, index) => ({
              length: CARD_H + GAP,
              offset: Math.floor(index / COLS) * (CARD_H + GAP) + GRID_PAD,
              index,
            })}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

// ─── HeroGridCard ─────────────────────────────────────────────────────────────

const HeroGridCard = memo(function HeroGridCard({ hero, owned, onTeam, effectiveRank, onPress }) {
  const [imgErr, setImgErr] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const faction   = FACTIONS[hero.faction];
  const rank      = RANK_COLORS[effectiveRank] || RANK_COLORS[hero.rank] || RANK_COLORS.C;
  const rankLabel = effectiveRank;

  const handleLoad = useCallback(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }).start();
  }, [fadeAnim]);

  return (
    <TouchableOpacity
      style={[styles.gridCard, !owned && styles.gridCardLocked, onTeam && styles.gridCardInTeam]}
      onPress={onPress}
      activeOpacity={0.82}
    >
      {/* Faction-tinted skeleton — visible immediately while portrait decodes */}
      {!imgErr && (
        <View style={[styles.cardArt, styles.cardPlaceholder, { backgroundColor: faction.color + '22' }]} />
      )}

      {imgErr ? (
        <View style={[styles.cardArt, { backgroundColor: faction.color + '40', alignItems: 'center', justifyContent: 'center' }]}>
          <Text style={{ fontSize: 28 }}>⚔️</Text>
        </View>
      ) : (
        <Animated.Image
          source={hero.image}
          style={[styles.cardArt, { opacity: fadeAnim }]}
          resizeMode="cover"
          onLoad={handleLoad}
          onError={() => setImgErr(true)}
        />
      )}

      <View style={[styles.cardTopAccent, { backgroundColor: faction.color }]} />

      <View style={[styles.cardFactionBadge, { backgroundColor: faction.color + '28', borderColor: faction.color + '88' }]}>
        <Image source={faction.image} style={styles.cardFactionIcon} resizeMode="contain" />
      </View>

      <View style={[styles.cardRankBadge, { backgroundColor: rank.bg }]}>
        <Text style={[styles.cardRankText, { color: rank.text }]}>{rankLabel}</Text>
      </View>

      <LinearGradient colors={['transparent', C.OVERLAY_DEEP]} style={styles.cardBotGrad} />
      <View style={styles.cardBottom}>
        <Text style={styles.cardName} numberOfLines={1}>{hero.name}</Text>
      </View>

      {!owned && (
        <View style={styles.lockedOverlay}>
          <Ionicons name="lock-closed" size={18} color={C.GOLD} />
        </View>
      )}

      {onTeam && owned && <View style={styles.teamDot} />}
    </TouchableOpacity>
  );
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.BG_DEEP },
  safe: { flex: 1 },

  // ── Top bar ────────────────────────────────────────────────────────────────
  topBar: {
    height: 48, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12,
    backgroundColor: C.BG_BASE,
    borderBottomWidth: 1, borderBottomColor: C.BORDER,
  },
  backBtn:  { flexDirection: 'row', alignItems: 'center', gap: 3, marginRight: 12 },
  backText: { color: C.TEXT, fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  topCenter:{ flex: 1, alignItems: 'center' },
  topTitle: { fontSize: 13, fontWeight: '900', color: C.TEXT, letterSpacing: 4 },
  topCount: { fontSize: 9, color: C.TEXT_MUTED, letterSpacing: 0.5, marginTop: 1 },

  // ── Body ───────────────────────────────────────────────────────────────────
  body: { flex: 1, flexDirection: 'row' },

  // Sidebar — zIndex: 2 ensures sort dropdown appears above the FlatList
  sidebar: {
    width: SIDEBAR_W,
    backgroundColor: C.BG_BASE,
    borderRightWidth: 1, borderRightColor: C.BORDER,
    justifyContent: 'space-between',
    zIndex: 2,
  },
  sideList: { flex: 1 },
  sideItem: {
    height: 42, flexDirection: 'row', alignItems: 'center',
    paddingLeft: 3, position: 'relative',
  },
  sideItemActive:  { backgroundColor: C.PRIMARY_GLOW },
  sideActiveLine:  { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  sideItemRow:     { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 12 },
  sideIcon:        { width: 18, height: 18 },
  sideLabel:       { fontSize: 11, color: C.TEXT_MUTED, fontWeight: '600', letterSpacing: 0.2 },
  sideLabelActive: { color: C.TEXT, fontWeight: '700' },
  sideCountBadge:  { marginRight: 8, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  sideCountText:   { fontSize: 9, fontWeight: '800' },

  // Sort — elevated above sibling FlatList so dropdown is never clipped
  sortArea: { paddingBottom: 6, zIndex: 10, elevation: 10 },
  sortSep:  { height: 1, backgroundColor: C.BORDER_SUBTLE, marginBottom: 2 },
  sortBtn:  { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8 },
  sortBtnLabel:       { fontSize: 9, color: C.TEXT_MUTED, fontWeight: '600' },
  sortBtnValue:       { flex: 1, fontSize: 9, color: C.TEXT_SOFT, fontWeight: '700' },
  sortDropdown: {
    position: 'absolute', bottom: '100%', left: 0, right: 0,
    backgroundColor: C.BG_RAISED,
    borderWidth: 1, borderColor: C.BORDER,
    borderRadius: 8, overflow: 'hidden',
    zIndex: 20, elevation: 20,
  },
  sortOpt:          { paddingHorizontal: 14, paddingVertical: 9 },
  sortOptActive:    { backgroundColor: C.PRIMARY_GLOW },
  sortOptText:      { color: C.TEXT_MUTED, fontSize: 11, fontWeight: '600' },
  sortOptTextActive:{ color: C.PRIMARY_LIGHT, fontWeight: '700' },

  // Grid
  grid:    { padding: GRID_PAD, paddingBottom: 20 },
  gridRow: { gap: GAP, marginBottom: GAP },

  // Grid card
  gridCard: {
    width: CARD_W, height: CARD_H,
    borderRadius: 8, overflow: 'hidden',
    backgroundColor: C.BG_CARD,
  },
  gridCardLocked: { opacity: 0.55 },
  gridCardInTeam: { borderWidth: 2, borderColor: C.SUCCESS },
  cardArt:          { position: 'absolute', width: '100%', height: '100%' },
  cardPlaceholder:  { backgroundColor: C.BG_MID },
  cardTopAccent:    { position: 'absolute', top: 0, left: 0, right: 0, height: 3 },
  cardFactionBadge: {
    position: 'absolute', top: 7, left: 7,
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  cardFactionIcon: { width: 15, height: 15 },
  cardRankBadge: {
    position: 'absolute', top: 7, right: 7,
    borderRadius: 3, paddingHorizontal: 5, paddingVertical: 2,
  },
  cardRankText: { fontSize: 8, fontWeight: '900' },
  cardBotGrad:  { position: 'absolute', bottom: 0, left: 0, right: 0, height: 44 },
  cardBottom:   { position: 'absolute', bottom: 5, left: 7, right: 7 },
  cardName: {
    fontSize: 9, color: C.TEXT, fontWeight: '700', letterSpacing: 0.4,
    textShadowColor: C.OVERLAY_DEEP,
    textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3,
  },
  lockedOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: C.OVERLAY_3,
    alignItems: 'center', justifyContent: 'center',
  },
  teamDot: {
    position: 'absolute', bottom: 6, right: 6,
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: C.SUCCESS, borderWidth: 1, borderColor: C.BG_DEEP,
  },

});
