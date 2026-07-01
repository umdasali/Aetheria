import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, FlatList, Dimensions, useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useGameStore from '../store/gameStore';
import { FACTIONS, getHeroById } from '../data/heroes';
import { getAvatarImage } from '../data/avatars';
import { C, RANK } from '../theme/colors';
import FactionParticles from '../components/FactionParticles';
import { calcPlayerLevel } from '../utils/playerLevel';
import { rs, rf } from '../theme/scale';
import AudioManager from '../utils/AudioManager';

const { width: W } = Dimensions.get('window');

// ── Layout ────────────────────────────────────────────────────────────────────
const HEADER_H   = 48;
const LEFT_W     = Math.floor(W * 0.33);
const RIGHT_W    = W - LEFT_W - 1;
const HERO_COLS  = 5;
const HERO_PAD   = 12;
const HERO_GAP   = 7;
const HERO_CARD_W = Math.floor((RIGHT_W - HERO_PAD * 2 - HERO_GAP * (HERO_COLS - 1)) / HERO_COLS);
const HERO_CARD_H = Math.floor(HERO_CARD_W * 320 / 220);

const GEM_IMG = require('../../assets/currency/gem.png');

// ── Helpers ───────────────────────────────────────────────────────────────────

function getDominantFaction(ownedHeroIds) {
  const counts = {};
  ownedHeroIds.forEach(id => {
    const h = getHeroById(id);
    if (h) counts[h.faction] = (counts[h.faction] || 0) + 1;
  });
  const entries = Object.entries(counts);
  if (!entries.length) return null;
  return entries.sort((a, b) => b[1] - a[1])[0][0];
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function ProfileScreen({ navigation }) {
  const { width: W, height: H } = useWindowDimensions();
  const { top: topInset, bottom: bottomInset } = useSafeAreaInsets();
  const ownedHeroes       = useGameStore(s => s.ownedHeroes);
  const gems              = useGameStore(s => s.gems);
  const completedChapters = useGameStore(s => s.completedChapters);
  const heroCollection    = useGameStore(s => s.heroCollection);
  const dailyStreak       = useGameStore(s => s.dailyStreak);
  const playerProfile     = useGameStore(s => s.playerProfile);
  const playerUid         = useGameStore(s => s.playerUid);
  const towerHighestFloor = useGameStore(s => s.towerHighestFloor);

  const { level, currentXP, nextLevelXP, progress } = useMemo(
    () => calcPlayerLevel({ completedChapters, ownedHeroes, heroCollection, dailyStreak }),
    [completedChapters, ownedHeroes, heroCollection, dailyStreak]
  );

  const dominantFaction = useMemo(() => getDominantFaction(ownedHeroes), [ownedHeroes]);
  const activeFaction = playerProfile.favoriteFaction || dominantFaction;
  const factionData   = activeFaction ? FACTIONS[activeFaction] : null;
  const factionColor  = factionData?.color ?? C.PRIMARY;

  const sRankCount = useMemo(
    () => ownedHeroes.filter(id => {
      const effectiveRank = heroCollection[id]?.effectiveRank;
      const hero = getHeroById(id);
      return (effectiveRank ?? hero?.rank) === 'S';
    }).length,
    [ownedHeroes, heroCollection]
  );

  const avatarImage = useMemo(
    () => getAvatarImage(playerProfile.avatarId),
    [playerProfile.avatarId]
  );

  const dynamicLeftW = Math.floor(W * 0.33);
  const dynamicRightW = W - dynamicLeftW - 1;
  const dynamicHeroCardW = Math.floor((dynamicRightW - HERO_PAD * 2 - HERO_GAP * (HERO_COLS - 1)) / HERO_COLS);
  const dynamicHeroCardH = Math.floor(dynamicHeroCardW * 320 / 220);

  // ── Character portrait panel (full-height left column) ────────────────────

  const renderCharPanel = () => (
    <View style={[s.charPanel, { width: dynamicLeftW }]}>
      {activeFaction && <FactionParticles faction={activeFaction} />}

      <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
        <Image
          source={avatarImage}
          style={{ width: dynamicLeftW, height: dynamicLeftW * 1.7 }}
          resizeMode="cover"
        />
      </View>

      <LinearGradient
        colors={['rgba(10,4,26,0.62)', 'transparent']}
        style={[StyleSheet.absoluteFill, { bottom: '62%' }]}
      />
      <LinearGradient
        colors={['transparent', 'rgba(8,3,20,0.97)']}
        style={[StyleSheet.absoluteFill, { top: '34%' }]}
      />

      {/* UID pill — top right */}
      <View style={s.uidPill}>
        <Text style={s.uidTxt}>UID · {playerUid || '---'}</Text>
      </View>

      <View style={s.charInfo}>
        <View style={[s.factionBar, { backgroundColor: factionColor }]} />

        <View style={s.charMeta}>
          <View style={s.lvlBubble}>
            <Text style={s.lvlLabel}>LV</Text>
            <Text style={s.lvlNum}>{level}</Text>
          </View>
          {factionData && (
            <TouchableOpacity
              onPress={() => { AudioManager.playButtonSFX(); navigation.navigate('EditProfile'); }}
              activeOpacity={0.78}
              accessibilityLabel="Edit profile"
              accessibilityRole="button"
              style={[s.factionChip, {
                borderColor: factionColor + '70',
                backgroundColor: factionColor + '22',
              }]}
            >
              <Image source={factionData.image} style={s.factionChipIcon} resizeMode="contain" />
              <Text style={[s.factionTxt, { color: factionColor }]}>{activeFaction}</Text>
              <Ionicons name="chevron-forward" size={rs(8)} color={factionColor + 'AA'} />
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }} />
          <Image source={GEM_IMG} style={s.miniGem} />
          <Text style={s.miniGems}>{gems.toLocaleString()}</Text>
        </View>

        <Text style={s.charName} numberOfLines={1}>{playerProfile.name}</Text>

        {playerProfile.signature
          ? <Text style={s.charSig} numberOfLines={2}>"{playerProfile.signature}"</Text>
          : <Text style={s.charSigEmpty}>tap edit to set a signature</Text>
        }

        <View style={s.xpRow}>
          <View style={s.xpTrack}>
            <LinearGradient
              colors={[factionColor, factionColor + 'AA']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[s.xpFill, { width: `${Math.round(progress * 100)}%` }]}
            />
          </View>
          <Text style={[s.xpLabel, { color: factionColor }]}>
            {currentXP} / {nextLevelXP} XP
          </Text>
        </View>

        {/* Stats strip — 4 items */}
        <View style={s.statBar}>
          {[
            { val: ownedHeroes.length,       lbl: 'HEROES'   },
            { val: sRankCount,               lbl: 'S-RANK'   },
            { val: completedChapters.length, lbl: 'CHAPTERS' },
            { val: towerHighestFloor,        lbl: 'TOWER'    },
          ].map((st, i) => (
            <React.Fragment key={i}>
              {i > 0 && <View style={s.statSep} />}
              <View style={s.statBlock}>
                <Text style={s.statVal}>{st.val}</Text>
                <Text style={s.statLbl}>{st.lbl}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        <TouchableOpacity onPress={() => { AudioManager.playButtonSFX(); navigation.navigate('EditProfile'); }} activeOpacity={0.82} style={s.editBtn} accessibilityLabel="Edit profile" accessibilityRole="button">
          <LinearGradient
            colors={[factionColor + 'DD', factionColor + '88']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={s.editGrad}
          >
            <Ionicons name="create-outline" size={rs(12)} color={C.TEXT} />
            <Text style={s.editTxt}>EDIT PROFILE</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ── Owned heroes grid ─────────────────────────────────────────────────────

  const renderHeroesList = () => (
    <View style={{ flex: 1 }}>
      <View style={s.secHdr}>
        <View style={[s.secAccent, { backgroundColor: C.PRIMARY }]} />
        <Text style={s.secTitle}>HEROES</Text>
        <Text style={s.secHint}>{ownedHeroes.length} collected</Text>
      </View>
      <FlatList
        data={ownedHeroes}
        keyExtractor={id => id}
        numColumns={HERO_COLS}
        contentContainerStyle={s.heroGrid}
        columnWrapperStyle={{ gap: HERO_GAP }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: id }) => {
          const hero = getHeroById(id);
          if (!hero) return null;
          const effectiveRank = heroCollection[id]?.effectiveRank ?? hero.rank;
          const r = RANK[effectiveRank];
          return (
            <TouchableOpacity
              onPress={() => navigation.navigate('HeroDetail', { heroId: id })}
              activeOpacity={0.85}
              style={[s.heroCardWrap, { width: dynamicHeroCardW }]}
              accessibilityLabel="Hero showcase slot"
              accessibilityRole="button"
            >
              <View style={[s.heroCard, { width: dynamicHeroCardW, height: dynamicHeroCardH, borderColor: r.glow }]}>
                <Image
                  source={hero.image}
                  style={{ width: dynamicHeroCardW, height: dynamicHeroCardH }}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.76)']}
                  style={StyleSheet.absoluteFill}
                />
                <View style={[s.heroRankBadge, { backgroundColor: r.bg }]}>
                  <Text style={[s.heroRankTxt, { color: r.text }]}>{effectiveRank}</Text>
                </View>
                <Text style={s.heroNameTxt} numberOfLines={1}>{hero.name}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );

  // ── Root render ───────────────────────────────────────────────────────────

  return (
    <View style={s.root}>
      <LinearGradient colors={C.GRAD_BG} style={StyleSheet.absoluteFill} />

      <LinearGradient
        colors={C.GRAD_HEADER}
        style={[s.header, { height: HEADER_H + topInset, paddingTop: topInset }]}
      >
        <TouchableOpacity onPress={() => { AudioManager.playButtonSFX(); navigation.goBack(); }} style={s.backBtn} activeOpacity={0.8} accessibilityLabel="Go back" accessibilityRole="button">
          <Ionicons name="chevron-back" size={rs(22)} color={C.TEXT} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>COMMANDER PROFILE</Text>
        <View style={{ flex: 1 }} />
        <View style={s.gemsChip}>
          <Image source={GEM_IMG} style={s.gemImg} />
          <Text style={s.gemsTxt}>{gems.toLocaleString()}</Text>
        </View>
      </LinearGradient>

      <View style={[s.body, { paddingBottom: bottomInset }]}>
        {renderCharPanel()}
        <View style={s.divV} />
        <View style={s.rightPanel}>
          {activeFaction && <FactionParticles faction={activeFaction} />}
          {renderHeroesList()}
        </View>
      </View>

    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1 },
  body: { flex: 1, flexDirection: 'row' },
  divV: { width: 1, backgroundColor: C.BORDER },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: rs(14), gap: rs(10),
  },
  backBtn:     { padding: 4 },
  headerTitle: { fontSize: rf(12), fontWeight: '900', color: C.TEXT, letterSpacing: 2.5 },
  gemsChip: {
    flexDirection: 'row', alignItems: 'center', gap: rs(5),
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: rs(20), paddingHorizontal: rs(10), paddingVertical: rs(4),
  },
  gemImg:  { width: rs(14), height: rs(14), resizeMode: 'contain' },
  gemsTxt: { color: C.GOLD, fontSize: rf(12), fontWeight: '700' },

  // ── Character panel ───────────────────────────────────────────────────────────
  charPanel: {
    overflow: 'hidden',
    backgroundColor: C.BG_MID,
  },

  uidPill: {
    position: 'absolute', top: rs(10), right: rs(10),
    backgroundColor: 'rgba(0,0,0,0.32)',
    borderRadius: rs(20), paddingHorizontal: rs(8), paddingVertical: rs(3),
  },
  uidTxt: { color: 'rgba(255,255,255,0.48)', fontSize: rf(13), fontWeight: '700', letterSpacing: 0.5 },

  charInfo: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: rs(14), paddingBottom: rs(14),
  },
  factionBar: { width: rs(28), height: 3, borderRadius: 2, marginBottom: rs(10) },

  charMeta: { flexDirection: 'row', alignItems: 'center', gap: rs(6), marginBottom: rs(7) },
  xpRow: {
    flexDirection: 'row', alignItems: 'center', gap: rs(8), marginTop: rs(6), marginBottom: 2,
  },
  xpTrack: {
    flex: 1, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden',
  },
  xpFill: { height: 4, borderRadius: 2 },
  xpLabel: { fontSize: rf(13), fontWeight: '800', letterSpacing: 0.5, minWidth: rs(70), textAlign: 'right' },

  lvlBubble: {
    flexDirection: 'row', alignItems: 'baseline', gap: 2,
    backgroundColor: 'rgba(0,0,0,0.52)',
    borderRadius: rs(6), paddingHorizontal: rs(8), paddingVertical: rs(4),
  },
  lvlLabel: { color: 'rgba(255,255,255,0.48)', fontSize: rf(13), fontWeight: '700', letterSpacing: 0.5 },
  lvlNum:   { color: C.TEXT, fontSize: rf(16), fontWeight: '900' },

  factionChip: {
    flexDirection: 'row', alignItems: 'center', gap: rs(5),
    borderRadius: rs(20), borderWidth: 1,
    paddingHorizontal: rs(7), paddingVertical: rs(3),
  },
  factionChipIcon: { width: rs(12), height: rs(12) },
  factionTxt: { fontSize: rf(13), fontWeight: '800', letterSpacing: 1 },

  miniGem:  { width: rs(12), height: rs(12), resizeMode: 'contain' },
  miniGems: { color: C.GOLD, fontSize: rf(13), fontWeight: '700' },

  charName: {
    fontSize: rf(20), fontWeight: '900', color: C.TEXT,
    letterSpacing: 0.5, marginBottom: rs(3),
    textShadowColor: 'rgba(0,0,0,0.85)',
    textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6,
  },
  charSig: {
    fontSize: rf(12), color: 'rgba(255,255,255,0.58)', fontStyle: 'italic',
    lineHeight: rf(14), marginBottom: rs(10),
  },
  charSigEmpty: {
    fontSize: rf(13), color: 'rgba(255,255,255,0.20)', fontStyle: 'italic', marginBottom: rs(10),
  },

  statBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: rs(8), marginBottom: rs(10),
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  statBlock: { flex: 1, paddingVertical: rs(6), alignItems: 'center' },
  statSep:   { width: 1, backgroundColor: 'rgba(255,255,255,0.10)', marginVertical: rs(6) },
  statVal:   { color: C.TEXT, fontSize: rf(15), fontWeight: '900' },
  statLbl:   { color: 'rgba(255,255,255,0.42)', fontSize: rf(13), fontWeight: '700', letterSpacing: 0.8, marginTop: 2 },

  editBtn:  { borderRadius: rs(8), overflow: 'hidden' },
  editGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: rs(6), paddingVertical: rs(9),
  },
  editTxt: { color: C.TEXT, fontSize: rf(13), fontWeight: '800', letterSpacing: 1.5 },

  // ── Right panel ───────────────────────────────────────────────────────────────
  rightPanel: { flex: 1 },

  secHdr: {
    flexDirection: 'row', alignItems: 'center', gap: rs(7),
    paddingHorizontal: rs(HERO_PAD), paddingTop: rs(10), paddingBottom: rs(8),
  },
  secAccent: { width: rs(3), height: rs(12), borderRadius: 2 },
  secTitle:  { fontSize: rf(13), fontWeight: '900', color: C.TEXT, letterSpacing: 2 },
  secHint:   { marginLeft: 2, fontSize: rf(13), color: C.TEXT_MUTED, fontWeight: '600' },

  // Hero grid
  heroGrid: {
    paddingHorizontal: rs(HERO_PAD),
    paddingBottom: rs(10),
    gap: rs(HERO_GAP),
  },
  heroCardWrap: {},
  heroCard: {
    borderRadius: rs(8), overflow: 'hidden',
    borderWidth: 1.5,
  },
  heroRankBadge: {
    position: 'absolute', top: 4, right: 4,
    paddingHorizontal: rs(4), paddingVertical: 1, borderRadius: rs(3),
  },
  heroRankTxt: { fontSize: rf(13), fontWeight: '900' },
  heroNameTxt: {
    position: 'absolute', bottom: 4, left: 4, right: 4,
    fontSize: rf(13), fontWeight: '700', color: C.TEXT,
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2,
  },

});
