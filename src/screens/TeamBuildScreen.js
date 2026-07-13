import React, { useState, useMemo, useCallback, useRef, memo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, ScrollView, FlatList, Dimensions, Animated,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import useGameStore from '../store/gameStore';
import { HEROES, FACTIONS } from '../data/heroes';
import AudioManager from '../utils/AudioManager';
import { C, RANK } from '../theme/colors';
import { rs, rf } from '../theme/scale';

const { width: W } = Dimensions.get('window');

const HEADER_H = 48;
const LEFT_W   = Math.floor(W * 0.56);
const FILTER_H = 38;
const COLS     = 4;
const GRID_PAD = 8;
const GAP      = 6;
const CARD_W   = Math.floor((LEFT_W - GRID_PAD * 2 - GAP * (COLS - 1)) / COLS);
const CARD_H   = Math.floor(CARD_W * 1.45);
const SLOT_PAD = 12;

const PRESET_LABELS = ['Ⅰ', 'Ⅱ', 'Ⅲ'];
// Derived from FACTIONS so it stays in sync when factions are added
const FACTION_KEYS = ['All', ...Object.keys(FACTIONS)];

export default function TeamBuildScreen({ navigation }) {
  const { width: W, height: H } = useWindowDimensions();

  const ownedHeroes      = useGameStore(s => s.ownedHeroes);
  const team             = useGameStore(s => s.team);
  const savedTeams       = useGameStore(s => s.savedTeams);
  const activeTeamPreset = useGameStore(s => s.activeTeamPreset);
  const deployPreset     = useGameStore(s => s.deployPreset);
  const saveTeamPreset   = useGameStore(s => s.saveTeamPreset);
  const heroCollection   = useGameStore(s => s.heroCollection);

  const [tab,    setTab]    = useState(0);
  const [filter, setFilter] = useState('All');

  // ── Shake animation for full-preset feedback ─────────────────────────────
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const triggerShake = useCallback(() => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue:  7, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -7, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue:  4, duration: 45, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue:  0, duration: 45, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  // ── Preset state ─────────────────────────────────────────────────────────
  const preset      = savedTeams[tab] || [null, null, null];
  const presetSet   = useMemo(() => new Set(preset.filter(Boolean)), [preset]);
  const filledCount = preset.filter(Boolean).length;
  const presetFull  = filledCount >= 3;

  // ── Deployed-preset change detection ─────────────────────────────────────
  // Compare sorted non-null preset IDs against live team to detect post-deploy edits
  const isDeployedPreset = activeTeamPreset === tab;
  const presetHeroIds    = useMemo(() => preset.filter(Boolean).sort().join(','), [preset]);
  const liveTeamIds      = useMemo(() => [...team].sort().join(','), [team]);
  const isLive     = isDeployedPreset && filledCount > 0 && presetHeroIds === liveTeamIds;
  const isModified = isDeployedPreset && filledCount > 0 && presetHeroIds !== liveTeamIds;

  // ── Hero lists ────────────────────────────────────────────────────────────
  const ownedSet = useMemo(() => new Set(ownedHeroes), [ownedHeroes]);

  const filteredHeroes = useMemo(() => {
    const base = HEROES.filter(h => ownedSet.has(h.id));
    if (filter === 'All') return base;
    return base.filter(h => h.faction === filter);
  }, [filter, ownedSet]);

  // ── Slot data (memoised - searches HEROES only when preset changes) ───────
  const slotHeroes = useMemo(
    () => preset.map(id => (id ? HEROES.find(h => h.id === id) ?? null : null)),
    [preset],
  );
  const totalHp  = useMemo(() => slotHeroes.reduce((s, h) => s + (h?.hp  ?? 0), 0), [slotHeroes]);
  const totalAtk = useMemo(() => slotHeroes.reduce((s, h) => s + (h?.atk ?? 0), 0), [slotHeroes]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleToggle = useCallback((heroId) => {
    AudioManager.playButtonSFX();
    const next = [...preset];
    const idx  = next.indexOf(heroId);
    if (idx >= 0) {
      next[idx] = null;
    } else {
      const empty = next.indexOf(null);
      if (empty < 0) { triggerShake(); return; }
      next[empty] = heroId;
    }
    saveTeamPreset(tab, next);
  }, [preset, tab, saveTeamPreset, triggerShake]);

  const handleDeploy = useCallback(() => {
    if (!filledCount) return;
    AudioManager.playButtonSFX();
    deployPreset(tab);
  }, [tab, filledCount, deployPreset]);

  const handleClear = useCallback(() => {
    AudioManager.playButtonSFX();
    saveTeamPreset(tab, [null, null, null]);
  }, [tab, saveTeamPreset]);

  // ── FlatList helpers ──────────────────────────────────────────────────────
  // Passing handleToggle + heroId as separate props lets memo do its job -
  // handleToggle is a stable ref; heroId is a primitive string.
  const renderCard = useCallback(({ item: hero }) => (
    <SelectCard
      hero={hero}
      heroId={hero.id}
      inTeam={presetSet.has(hero.id)}
      teamFull={presetFull}
      handleToggle={handleToggle}
      effectiveRank={hero.sovereign ? 'SOVEREIGN' : (heroCollection[hero.id]?.effectiveRank ?? hero.rank)}
    />
  ), [presetSet, presetFull, handleToggle, heroCollection]);

  const getItemLayout = useCallback((_, index) => ({
    length: CARD_H + GAP,
    offset: GRID_PAD + Math.floor(index / COLS) * (CARD_H + GAP),
    index,
  }), []);

  const ListEmpty = useMemo(() => (
    <View style={s.emptyState}>
      <Ionicons name="people-outline" size={rs(32)} color={C.TEXT_DISABLED} />
      <Text style={s.emptyTitle}>No Heroes</Text>
      <Text style={s.emptyHint}>
        {filter === 'All'
          ? 'Summon heroes to build a team.'
          : `No owned ${FACTIONS[filter]?.name ?? filter} heroes.`}
      </Text>
    </View>
  ), [filter]);

  return (
    <View style={s.root}>
      <LinearGradient colors={C.GRAD_BG} style={StyleSheet.absoluteFill} />

      <View style={s.safe}>

        {/* ══ HEADER ══ */}
        <LinearGradient colors={C.GRAD_HEADER} style={s.header}>
          <TouchableOpacity
            onPress={() => { AudioManager.playButtonSFX(); navigation.goBack(); }}
            style={s.backBtn}
          >
            <Ionicons name="chevron-back" size={rs(19)} color={C.TEXT} />
            <Text style={s.backTxt}>BACK</Text>
          </TouchableOpacity>

          <View style={s.headerCenter}>
            <Text style={s.headerTitle}>TEAM BUILDER</Text>
            <Text style={s.headerSub}>Synced with Quick Teams in Profile</Text>
          </View>

          <View style={[s.countChip, {
            borderColor:     isLive ? C.SUCCESS + '80' : C.BORDER_STRONG,
            backgroundColor: isLive ? C.SUCCESS + '22' : C.PRIMARY_GLOW,
          }]}>
            <Text style={[s.countTxt, { color: isLive ? C.SUCCESS : C.PRIMARY_LIGHT }]}>
              {filledCount} / 3
            </Text>
          </View>
        </LinearGradient>

        {/* ══ BODY ══ */}
        <View style={s.body}>

          {/* ── LEFT: hero selection ── */}
          <View style={s.leftPanel}>

            {/* Faction filter strip */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={s.filterBar}
              contentContainerStyle={s.filterContent}
            >
              {FACTION_KEYS.map(key => {
                const active = filter === key;
                const fData  = FACTIONS[key];
                const accent = fData ? fData.color : C.PRIMARY_LIGHT;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[s.filterChip, active && { backgroundColor: accent + '28', borderColor: accent }]}
                    onPress={() => { AudioManager.playButtonSFX(); setFilter(key); }}
                    activeOpacity={0.78}
                  >
                    {fData && <Image source={fData.image} style={s.filterIcon} resizeMode="contain" />}
                    <Text style={[s.filterLabel, active && { color: accent }]}>
                      {key === 'All' ? 'All' : fData.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <FlatList
              data={filteredHeroes}
              numColumns={COLS}
              key={`tb-${filter}-${COLS}`}
              keyExtractor={h => h.id}
              contentContainerStyle={s.grid}
              columnWrapperStyle={s.gridRow}
              showsVerticalScrollIndicator={false}
              extraData={preset}
              renderItem={renderCard}
              getItemLayout={getItemLayout}
              ListEmptyComponent={ListEmpty}
            />
          </View>

          {/* ── RIGHT: preset panel ── */}
          <View style={s.rightPanel}>
            <View style={s.rightInner}>

              {/* Preset tab row */}
              <View style={s.tabRow}>
                {PRESET_LABELS.map((lbl, i) => {
                  const filled   = (savedTeams[i] || []).filter(Boolean).length;
                  const active   = tab === i;
                  const deployed = activeTeamPreset === i && filled > 0;
                  return (
                    <TouchableOpacity
                      key={i}
                      style={[s.tab, active && s.tabActive, deployed && s.tabDeployed]}
                      onPress={() => { AudioManager.playButtonSFX(); setTab(i); }}
                      activeOpacity={0.80}
                    >
                      <Text style={[s.tabLbl, active && s.tabLblActive]}>{lbl}</Text>
                      {filled > 0 && (
                        <View style={s.tabDots}>
                          {[0, 1, 2].map(d => (
                            <View
                              key={d}
                              style={[s.tabDot, {
                                backgroundColor: d < filled
                                  ? (deployed ? C.SUCCESS : C.PRIMARY_LIGHT)
                                  : C.GLASS_2,
                              }]}
                            />
                          ))}
                        </View>
                      )}
                      {deployed && (
                        <View style={s.tabActiveBadge}>
                          <Ionicons name="flash" size={rs(8)} color={C.SUCCESS} />
                        </View>
                      )}
                      {/* Clear button - visible only on the active tab when it has heroes */}
                      {active && filled > 0 && (
                        <TouchableOpacity
                          style={s.tabClear}
                          onPress={handleClear}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons name="trash-outline" size={rs(15)} color={C.TEXT_ON_DARK_DIM} />
                        </TouchableOpacity>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* 3 hero slots - wraps in Animated.View for full-preset shake feedback */}
              <Animated.View
                style={[s.slotsCol, { transform: [{ translateX: shakeAnim }] }]}
              >
                {[0, 1, 2].map(i => {
                  const hero    = slotHeroes[i];
                  const faction = hero ? FACTIONS[hero.faction] : null;
                  // Sovereign heroes always badge as SOVEREIGN; everyone else shows
                  // their post-fusion effectiveRank (falls back to base rank if unset).
                  const rankKey = hero
                    ? (hero.sovereign ? 'SOVEREIGN' : (heroCollection[hero.id]?.effectiveRank ?? hero.rank))
                    : null;
                  const rk      = hero ? RANK[rankKey] : null;

                  if (hero) {
                    return (
                      <View key={i} style={[s.slot, { borderColor: faction.color + '70' }]}>
                        {/* Portrait thumbnail */}
                        <View style={s.slotPortrait}>
                          <Image source={hero.image} style={s.slotPortraitArt} resizeMode="cover" />
                          <LinearGradient
                            colors={['transparent', C.OVERLAY_2]}
                            style={StyleSheet.absoluteFill}
                          />
                          <View style={[s.slotFactionBar, { backgroundColor: faction.color }]} />
                        </View>

                        {/* Hero info */}
                        <LinearGradient
                          colors={[C.BG_DEEP + 'D9', faction.color + '18']}
                          start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
                          style={s.slotInfoArea}
                        >
                          <View style={s.slotTopRow}>
                            <View style={[s.slotRankBadge, {
                              backgroundColor: rk.bg,
                              shadowColor: rk.glow, shadowOpacity: 0.8, shadowRadius: 4, elevation: 3,
                            }]}>
                              <Text style={[s.slotRankTxt, { color: rk.text }]}>
                                {hero.sovereign ? 'SOV' : rankKey}
                              </Text>
                            </View>
                            <Text style={[s.slotFactionLabel, { color: faction.color }]}>{faction.name}</Text>
                            <Text style={s.slotSlotNum}>#{i + 1}</Text>
                          </View>
                          <Text style={s.slotName} numberOfLines={1}>{hero.name}</Text>
                          <Text style={s.slotMeta}>{hero.class}  ·  {hero.element}</Text>
                        </LinearGradient>

                        {/* Remove */}
                        <TouchableOpacity
                          style={s.slotRemove}
                          onPress={() => handleToggle(hero.id)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Ionicons name="close-circle" size={rs(20)} color={C.TEXT_ON_DARK} />
                        </TouchableOpacity>
                      </View>
                    );
                  }

                  return (
                    <View key={i} style={s.slotEmpty}>
                      <View style={[s.slotEmptyNum, { borderColor: C.PRIMARY + '50' }]}>
                        <Text style={s.slotEmptyNumTxt}>{i + 1}</Text>
                      </View>
                      <View>
                        <Text style={s.slotEmptyLabel}>SLOT {i + 1}</Text>
                        <Text style={s.slotEmptyHint}>Tap a hero to assign</Text>
                      </View>
                    </View>
                  );
                })}
              </Animated.View>

              {/* Bottom bar: power stats + deploy / active / modified */}
              <View style={s.bottomBar}>
                {filledCount > 0 && (
                  <>
                    <View style={s.powerStat}>
                      <Text style={s.powerLabel}>HP</Text>
                      <Text style={[s.powerValue, { color: C.HP }]}>{totalHp.toLocaleString()}</Text>
                    </View>
                    <View style={s.powerDivider} />
                    <View style={s.powerStat}>
                      <Text style={s.powerLabel}>ATK</Text>
                      <Text style={[s.powerValue, { color: C.ATK }]}>{totalAtk.toLocaleString()}</Text>
                    </View>
                    <View style={s.powerDivider} />
                  </>
                )}

                {isLive ? (
                  // Preset matches the live battle team exactly
                  <View style={s.statusRow}>
                    <Ionicons name="checkmark-circle" size={rs(17)} color={C.SUCCESS} />
                    <Text style={[s.statusTxt, { color: C.SUCCESS }]}>ACTIVE</Text>
                  </View>
                ) : isModified ? (
                  // Preset was deployed but has since been edited - prompt re-deploy
                  <TouchableOpacity style={s.modifiedRow} onPress={handleDeploy} activeOpacity={0.82}>
                    <Ionicons name="warning" size={rs(17)} color={C.WARNING} />
                    <Text style={[s.statusTxt, { color: C.WARNING }]}>MODIFIED</Text>
                    <Text style={s.modifiedHint}> · tap to re-deploy</Text>
                  </TouchableOpacity>
                ) : (
                  // Normal deploy button
                  <TouchableOpacity
                    style={[s.deployBtn, !filledCount && { opacity: 0.35 }]}
                    onPress={handleDeploy}
                    disabled={!filledCount}
                    activeOpacity={0.82}
                  >
                    <LinearGradient
                      colors={filledCount ? C.GRAD_PINK : [C.BG_MID, C.BG_BASE]}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={s.deployInner}
                    >
                      <Ionicons name="flash" size={rs(17)} color={filledCount ? C.TEXT : C.TEXT_DISABLED} />
                      <Text style={[s.deployTxt, { color: filledCount ? C.TEXT : C.TEXT_DISABLED }]}>
                        DEPLOY {PRESET_LABELS[tab]}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>

            </View>
          </View>

        </View>
      </View>
    </View>
  );
}

// ─── SelectCard ───────────────────────────────────────────────────────────────
// Receives `heroId` (primitive) and `handleToggle` (stable ref from useCallback)
// so React.memo can correctly skip re-renders for unaffected cards.

const SelectCard = memo(function SelectCard({ hero, heroId, inTeam, teamFull, handleToggle, effectiveRank }) {
  const faction = FACTIONS[hero.faction];
  const rk      = RANK[effectiveRank];
  return (
    <TouchableOpacity
      style={[s.card, inTeam && s.cardActive]}
      onPress={() => handleToggle(heroId)}
      disabled={teamFull && !inTeam}
      activeOpacity={0.80}
    >
      <Image source={hero.image} style={s.cardArt} resizeMode="cover" />
      <LinearGradient colors={['transparent', C.OVERLAY_4]} style={s.cardGrad} />
      <View style={[s.cardTopBar, { backgroundColor: faction.color }]} />
      <View style={[s.cardRank, { backgroundColor: rk.bg }]}>
        <Text style={[s.cardRankTxt, { color: rk.text }]}>{hero.sovereign ? 'SOV' : effectiveRank}</Text>
      </View>
      <Text style={s.cardName} numberOfLines={1}>{hero.name}</Text>
      {inTeam && (
        <View style={s.checkBadge}>
          <Ionicons name="checkmark-circle" size={rs(21)} color={C.SUCCESS} />
        </View>
      )}
      {teamFull && !inTeam && (
        <View style={s.fullOverlay}>
          <Text style={s.fullTxt}>FULL</Text>
        </View>
      )}
    </TouchableOpacity>
  );
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.BG_DARK },
  safe: { flex: 1 },

  header: {
    height: HEADER_H, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: rs(12), gap: rs(10),
  },
  backBtn:      { flexDirection: 'row', alignItems: 'center', gap: rs(3) },
  backTxt:      { fontSize: rf(12), fontWeight: '700', color: C.TEXT, letterSpacing: 0.5 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle:  { fontSize: rf(14), fontWeight: '900', color: C.TEXT, letterSpacing: 3 },
  headerSub:    { fontSize: rf(12), color: C.TEXT_ON_DARK_MUTED, marginTop: 1 },
  countChip:    { paddingHorizontal: rs(12), paddingVertical: rs(5), borderRadius: rs(8), borderWidth: 1 },
  countTxt:     { fontSize: rf(13), fontWeight: '900' },

  body: { flex: 1, flexDirection: 'row' },

  // ── Left panel ──────────────────────────────────────────────────────────────
  leftPanel: {
    width: LEFT_W,
    borderRightWidth: 1,
    borderRightColor: C.BORDER_SUBTLE,
    backgroundColor: C.GLASS_1,
  },
  filterBar:     { height: FILTER_H, flexGrow: 0 },
  filterContent: { paddingHorizontal: rs(8), paddingVertical: rs(6), gap: rs(6), alignItems: 'center' },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: rs(5),
    paddingHorizontal: rs(10), paddingVertical: rs(4),
    borderRadius: rs(14), borderWidth: 1,
    borderColor: C.GLASS_7,
    backgroundColor: C.GLASS_4,
  },
  filterIcon:  { width: rs(14), height: rs(14) },
  filterLabel: { fontSize: rf(13), color: C.TEXT_MUTED, fontWeight: '700', letterSpacing: 0.3 },
  grid:    { padding: GRID_PAD, paddingBottom: rs(20) },
  gridRow: { gap: GAP, marginBottom: GAP },

  // ── Empty state ─────────────────────────────────────────────────────────────
  emptyState: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: rs(48), gap: rs(8),
  },
  emptyTitle: { fontSize: rf(14), fontWeight: '800', color: C.TEXT_MUTED, letterSpacing: 1 },
  emptyHint:  {
    fontSize: rf(13), color: C.TEXT_DISABLED, textAlign: 'center',
    paddingHorizontal: rs(24), lineHeight: rf(16),
  },

  // ── Select card ─────────────────────────────────────────────────────────────
  card: {
    width: CARD_W, height: CARD_H,
    borderRadius: rs(8), overflow: 'hidden',
    backgroundColor: C.BG_CARD,
    borderWidth: 1.5, borderColor: C.BORDER_SUBTLE,
  },
  cardActive: {
    borderColor: C.SUCCESS,
    shadowColor: C.SUCCESS,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55, shadowRadius: rs(8), elevation: 6,
  },
  cardArt:    { position: 'absolute', width: '100%', height: '100%' },
  cardGrad:   { position: 'absolute', bottom: 0, left: 0, right: 0, height: CARD_H * 0.55 },
  cardTopBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 3 },
  cardRank: {
    position: 'absolute', top: rs(5), right: rs(5),
    paddingHorizontal: rs(5), paddingVertical: rs(2), borderRadius: rs(3),
  },
  cardRankTxt: { fontSize: rf(11), fontWeight: '900' },
  cardName: {
    position: 'absolute', bottom: rs(5), left: rs(5), right: rs(5),
    fontSize: rf(12), color: C.TEXT, fontWeight: '700', letterSpacing: 0.3,
    textShadowColor: C.OVERLAY_4,
    textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3,
  },
  checkBadge: {
    position: 'absolute', top: rs(4), left: rs(4),
    backgroundColor: C.OVERLAY_3, borderRadius: rs(10),
  },
  fullOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: C.OVERLAY_4,
    alignItems: 'center', justifyContent: 'center',
  },
  fullTxt: { fontSize: rf(12), color: C.TEXT_MUTED, fontWeight: '900', letterSpacing: 1.5 },

  // ── Right panel ─────────────────────────────────────────────────────────────
  rightPanel: { flex: 1, backgroundColor: C.OVERLAY_1 },
  rightInner: {
    flex: 1, paddingHorizontal: rs(SLOT_PAD), paddingTop: rs(10), paddingBottom: rs(10), gap: rs(8),
  },

  // ── Preset tabs ─────────────────────────────────────────────────────────────
  tabRow: { flexDirection: 'row', gap: rs(6) },
  tab: {
    flex: 1, paddingVertical: rs(7), borderRadius: rs(8),
    backgroundColor: C.GLASS_3,
    borderWidth: 1, borderColor: C.GLASS_6,
    alignItems: 'center', gap: rs(4), position: 'relative',
  },
  tabActive:      { backgroundColor: C.PRIMARY_GLOW, borderColor: C.PRIMARY },
  tabDeployed:    { borderColor: C.SUCCESS + '70', backgroundColor: C.SUCCESS + '12' },
  tabLbl:         { fontSize: rf(14), fontWeight: '900', color: C.TEXT_ON_DARK_MUTED },
  tabLblActive:   { color: C.PRIMARY_LIGHT },
  tabDots:        { flexDirection: 'row', gap: rs(3) },
  tabDot:         { width: rs(5), height: rs(5), borderRadius: rs(3) },
  tabActiveBadge: {
    position: 'absolute', top: -4, right: -4,
    backgroundColor: C.SUCCESS, borderRadius: rs(8),
    width: rs(14), height: rs(14),
    alignItems: 'center', justifyContent: 'center',
  },
  tabClear: { position: 'absolute', bottom: rs(5), right: rs(6) },

  // ── Slots ───────────────────────────────────────────────────────────────────
  slotsCol: { flex: 1, gap: rs(7) },
  slot: {
    flex: 1, borderRadius: rs(10), overflow: 'hidden',
    borderWidth: 1.5, flexDirection: 'row',
    backgroundColor: C.OVERLAY_2,
  },
  slotPortrait:    { width: rs(64), overflow: 'hidden', position: 'relative' },
  slotPortraitArt: { position: 'absolute', width: '100%', height: '100%' },
  slotFactionBar:  { position: 'absolute', right: 0, top: 0, bottom: 0, width: 3 },
  slotInfoArea: {
    flex: 1, paddingHorizontal: rs(10), paddingVertical: rs(8),
    justifyContent: 'center', gap: rs(3),
  },
  slotTopRow:       { flexDirection: 'row', alignItems: 'center', gap: rs(5) },
  slotRankBadge:    { paddingHorizontal: rs(5), paddingVertical: rs(2), borderRadius: rs(3) },
  slotRankTxt:      { fontSize: rf(12), fontWeight: '900' },
  slotFactionLabel: { fontSize: rf(10), fontWeight: '800', letterSpacing: 1, opacity: 0.85 },
  slotSlotNum:      { marginLeft: 'auto', fontSize: rf(12), color: C.TEXT_ON_DARK_DIM, fontWeight: '800' },
  slotName: {
    fontSize: rf(12), fontWeight: '800', color: C.TEXT, letterSpacing: 0.2,
    textShadowColor: C.OVERLAY_4,
    textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3,
  },
  slotMeta:   { fontSize: rf(11), color: C.TEXT_ON_DARK_SOFT, fontWeight: '600' },
  slotRemove: { position: 'absolute', top: rs(5), right: rs(7) },
  slotEmpty: {
    flex: 1, borderRadius: rs(10),
    borderWidth: 1.5, borderStyle: 'dashed',
    borderColor: C.PRIMARY_LIGHT + '40',
    backgroundColor: C.PRIMARY_GLOW,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: rs(14), gap: rs(12),
  },
  slotEmptyNum: {
    width: rs(32), height: rs(32), borderRadius: rs(16),
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5,
  },
  slotEmptyNumTxt: { fontSize: rf(12), fontWeight: '900', color: C.PRIMARY_LIGHT + '80' },
  slotEmptyLabel:  { fontSize: rf(13), color: C.TEXT_MUTED, fontWeight: '900', letterSpacing: 1.5, marginBottom: rs(2) },
  slotEmptyHint:   { fontSize: rf(11), color: C.TEXT_DISABLED, fontStyle: 'italic' },

  // ── Bottom bar ───────────────────────────────────────────────────────────────
  bottomBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.GLASS_2,
    borderRadius: rs(8), borderWidth: 1, borderColor: C.GLASS_5,
    paddingVertical: rs(6), paddingHorizontal: rs(10), gap: rs(8),
    height: rs(44),
  },
  powerStat:    { alignItems: 'center', paddingHorizontal: rs(2) },
  powerLabel:   { fontSize: rf(10), color: C.TEXT_ON_DARK_DIM, fontWeight: '700', letterSpacing: 1.2, marginBottom: 1 },
  powerValue:   { fontSize: rf(12), fontWeight: '900' },
  powerDivider: { width: 1, height: rs(22), backgroundColor: C.GLASS_5 },

  statusRow: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(6),
    backgroundColor: C.SUCCESS + '18', borderRadius: rs(6),
    borderWidth: 1, borderColor: C.SUCCESS + '40',
    alignSelf: 'stretch',
  },
  statusTxt: { fontSize: rf(13), fontWeight: '900', letterSpacing: 1.2 },

  modifiedRow: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(4),
    backgroundColor: C.WARNING + '15', borderRadius: rs(6),
    borderWidth: 1, borderColor: C.WARNING + '40',
    alignSelf: 'stretch',
  },
  modifiedHint: { fontSize: rf(13), fontWeight: '600', color: C.WARNING + 'AA' },

  deployBtn:   { flex: 1, borderRadius: rs(6), overflow: 'hidden' },
  deployInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: rs(6), paddingVertical: rs(9),
  },
  deployTxt: { fontSize: rf(13), fontWeight: '900', letterSpacing: 0.8 },
});
