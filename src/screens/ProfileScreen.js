import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, FlatList, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useGameStore from '../store/gameStore';
import { FACTIONS, getHeroById } from '../data/heroes';
import { C, RANK } from '../theme/colors';
import FactionParticles from '../components/FactionParticles';
import { calcPlayerLevel } from '../utils/playerLevel';

const { width: W } = Dimensions.get('window');

// ── Layout ────────────────────────────────────────────────────────────────────
const HEADER_H   = 48;
const LEFT_W     = Math.floor(W * 0.33);
const RIGHT_W    = W - LEFT_W - 1;
const HERO_COLS  = 5;
const HERO_PAD   = 10;
const HERO_GAP   = 6;
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
  const { top: topInset, bottom: bottomInset } = useSafeAreaInsets();
  const {
    ownedHeroes, team, gems, completedChapters, heroCollection, dailyStreak,
    playerProfile, playerUid, towerHighestFloor,
  } = useGameStore();

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

  const avatarHero = useMemo(() => {
    const id = playerProfile.avatarHeroId || team[0] || ownedHeroes[0];
    return id ? getHeroById(id) : null;
  }, [playerProfile.avatarHeroId, team, ownedHeroes]);

  // ── Character portrait panel (full-height left column) ────────────────────

  const renderCharPanel = () => (
    <View style={s.charPanel}>
      {activeFaction && <FactionParticles faction={activeFaction} />}

      {avatarHero ? (
        <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
          <Image
            source={avatarHero.image}
            style={{ width: LEFT_W, height: LEFT_W * 1.7 }}
            resizeMode="cover"
          />
        </View>
      ) : (
        <LinearGradient colors={[C.BG_MID, C.BG_BOTTOM]} style={StyleSheet.absoluteFill} />
      )}

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
              onPress={() => navigation.navigate('EditProfile')}
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
              <Ionicons name="chevron-forward" size={8} color={factionColor + 'AA'} />
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

        <TouchableOpacity onPress={() => navigation.navigate('EditProfile')} activeOpacity={0.82} style={s.editBtn} accessibilityLabel="Edit profile" accessibilityRole="button">
          <LinearGradient
            colors={[factionColor + 'DD', factionColor + '88']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={s.editGrad}
          >
            <Ionicons name="create-outline" size={12} color="#fff" />
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
              style={s.heroCardWrap}
              accessibilityLabel="Hero showcase slot"
              accessibilityRole="button"
            >
              <View style={[s.heroCard, { height: HERO_CARD_H, borderColor: r.glow }]}>
                <Image
                  source={hero.image}
                  style={{ width: HERO_CARD_W, height: HERO_CARD_H }}
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.8} accessibilityLabel="Go back" accessibilityRole="button">
          <Ionicons name="chevron-back" size={22} color="#fff" />
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
    paddingHorizontal: 14, gap: 10,
  },
  backBtn:     { padding: 4 },
  headerTitle: { fontSize: 12, fontWeight: '900', color: '#fff', letterSpacing: 2.5 },
  gemsChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
  gemImg:  { width: 14, height: 14, resizeMode: 'contain' },
  gemsTxt: { color: C.GOLD, fontSize: 12, fontWeight: '700' },

  // ── Character panel ───────────────────────────────────────────────────────────
  charPanel: {
    width: LEFT_W,
    overflow: 'hidden',
    backgroundColor: C.BG_MID,
  },

  uidPill: {
    position: 'absolute', top: 10, right: 10,
    backgroundColor: 'rgba(0,0,0,0.32)',
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3,
  },
  uidTxt: { color: 'rgba(255,255,255,0.48)', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },

  charInfo: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 14, paddingBottom: 14,
  },
  factionBar: { width: 28, height: 3, borderRadius: 2, marginBottom: 10 },

  charMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 7 },
  xpRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, marginBottom: 2,
  },
  xpTrack: {
    flex: 1, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden',
  },
  xpFill: { height: 4, borderRadius: 2 },
  xpLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, minWidth: 70, textAlign: 'right' },

  lvlBubble: {
    flexDirection: 'row', alignItems: 'baseline', gap: 2,
    backgroundColor: 'rgba(0,0,0,0.52)',
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4,
  },
  lvlLabel: { color: 'rgba(255,255,255,0.48)', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  lvlNum:   { color: '#fff', fontSize: 16, fontWeight: '900' },

  factionChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 20, borderWidth: 1,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  factionChipIcon: { width: 12, height: 12 },
  factionTxt: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },

  miniGem:  { width: 12, height: 12, resizeMode: 'contain' },
  miniGems: { color: C.GOLD, fontSize: 10, fontWeight: '700' },

  charName: {
    fontSize: 20, fontWeight: '900', color: '#fff',
    letterSpacing: 0.5, marginBottom: 3,
    textShadowColor: 'rgba(0,0,0,0.85)',
    textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6,
  },
  charSig: {
    fontSize: 9, color: 'rgba(255,255,255,0.58)', fontStyle: 'italic',
    lineHeight: 14, marginBottom: 10,
  },
  charSigEmpty: {
    fontSize: 10, color: 'rgba(255,255,255,0.20)', fontStyle: 'italic', marginBottom: 10,
  },

  statBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 8, marginBottom: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  statBlock: { flex: 1, paddingVertical: 6, alignItems: 'center' },
  statSep:   { width: 1, backgroundColor: 'rgba(255,255,255,0.10)', marginVertical: 6 },
  statVal:   { color: '#fff', fontSize: 15, fontWeight: '900' },
  statLbl:   { color: 'rgba(255,255,255,0.42)', fontSize: 10, fontWeight: '700', letterSpacing: 0.8, marginTop: 2 },

  editBtn:  { borderRadius: 8, overflow: 'hidden' },
  editGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 9,
  },
  editTxt: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },

  // ── Right panel ───────────────────────────────────────────────────────────────
  rightPanel: { flex: 1 },

  secHdr: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: HERO_PAD, paddingTop: 10, paddingBottom: 8,
  },
  secAccent: { width: 3, height: 12, borderRadius: 2 },
  secTitle:  { fontSize: 10, fontWeight: '900', color: C.TEXT, letterSpacing: 2 },
  secHint:   { marginLeft: 2, fontSize: 10, color: C.TEXT_MUTED, fontWeight: '600' },

  // Hero grid
  heroGrid: {
    paddingHorizontal: HERO_PAD,
    paddingBottom: 10,
    gap: HERO_GAP,
  },
  heroCardWrap: {
    width: HERO_CARD_W,
    marginRight: HERO_GAP,
    marginBottom: 0,
  },
  heroCard: {
    width: HERO_CARD_W,
    borderRadius: 8, overflow: 'hidden',
    borderWidth: 1.5,
  },
  heroRankBadge: {
    position: 'absolute', top: 4, right: 4,
    paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3,
  },
  heroRankTxt: { fontSize: 10, fontWeight: '900' },
  heroNameTxt: {
    position: 'absolute', bottom: 4, left: 4, right: 4,
    fontSize: 10, fontWeight: '700', color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2,
  },

});
