import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, Image, TouchableOpacity, ScrollView, FlatList,
  Animated, Dimensions, StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { C, RANK } from '../theme/colors';
import { FACTIONS, getHeroesByFaction, getHeroById } from '../data/heroes';
import FactionParticles from '../components/FactionParticles';
import useGameStore from '../store/gameStore';
import AudioManager from '../utils/AudioManager';

const { width: W, height: H } = Dimensions.get('window');
const WORLD_MAP = require('../../assets/worldMap/world-map.webp');

// ── Hero grid sizing (right column, 2 columns) ───────────────────────────────
const LEFT_COL_W  = Math.floor(W * 0.33);
const OUTER_PAD   = 14;
const COL_GAP     = 12;
// fsBody (row, gap:COL_GAP) holds THREE children — left ScrollView, the 1px
// fsSep separator, and fsRight — so there are TWO inter-child gaps to subtract,
// plus the 1px separator. Undercounting these made the grid overflow.
const RIGHT_COL_W = W - LEFT_COL_W - 1 - OUTER_PAD * 2 - COL_GAP * 2;
const GRID_COLS   = 2;
const GRID_GAP    = 14;
// Hero art is PORTRAIT — keep the card at the same portrait aspect the rest of
// the app uses (≈1.42, like the Collection cards) so `cover` fills it without
// cropping the sides. Size is driven by height so a full portrait card always
// fits the grid area (≤ ~50% of screen height); the row centers and the list
// scrolls for additional rows.
const CARD_ASPECT = 1.45;
const GRID_MAX_H  = Math.floor(H * 0.50);
const CARD_W      = Math.min(
  Math.floor((RIGHT_COL_W - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS),  // fill 2-up
  Math.floor(GRID_MAX_H / CARD_ASPECT),                                // but keep height bounded
);
const CARD_H      = Math.floor(CARD_W * CARD_ASPECT);

// ── Faction lore, region metadata & sovereign ────────────────────────────────
const FACTION_META = {
  EMBERVEIL: {
    climate: 'Volcanic & Storm-torn',
    element: '🔥 Fire  ⚡ Lightning',
    specialties: ['Fire Mastery', 'Burn Effects', 'High ATK', 'Lightning Strikes'],
    lore: 'A land of perpetual eruption and lightning storms where only the fiercest survive. For three cycles of the volcanic moon the ember throne sat empty — its sovereign swallowed by a dimensional rift while sealing a catastrophic breach in the realm. Into that silence strode Kira Voltz, who held the throne by sheer force of will until the day Ravenna Blaze walked back out of that same rift, carrying fire from dimensions no one else has seen. Kira surrendered the throne the moment Ravenna crossed the border. Neither of them had to say a word.',
    ruler: {
      heroId: 'hero_041',
      name: 'Ravenna Blaze',
      title: 'The Ember Sovereign',
      status: 'RULER',
      roleLore: 'The original sovereign of EMBERVEIL, returned from three cycles of dimensional exile carrying fire from beyond the rift. The throne did not need to be reclaimed — it simply recognized her.',
    },
  },
  GLACIARA: {
    climate: 'Arctic Blizzard & Permafrost',
    element: '❄️ Ice',
    specialties: ['Ice Control', 'Freeze Debuffs', 'High DEF', 'Crowd Control'],
    lore: 'An eternal winter realm of ice fortresses and howling blizzards. For generations the ruling council lay sealed inside an enchanted glacier — and Nova Blaine governed in their absence, calling herself regent long after the council ceased to be a realistic expectation. Then the original sovereign returned. Aeloria, the woman who built GLACIARA from raw permafrost and sacrifice, walked out of her crystalline sleep and back onto her throne. Nova Blaine stepped aside without being asked. In GLACIARA, some things simply freeze in their rightful position and stay there.',
    ruler: {
      heroId: 'hero_037',
      name: 'Aeloria',
      title: 'The Frozen Sovereign',
      status: 'RULER',
      roleLore: 'Built GLACIARA from nothing. Sacrificed her throne to seal an elder darkness. Returned from centuries of crystalline sleep to reclaim what was always hers — and found it exactly where she left it.',
    },
  },
  SUNSPIRE: {
    climate: 'Eternal Sunlight & Golden Highlands',
    element: '☀️ Holy',
    specialties: ['Holy Healing', 'Divine Buffs', 'Blessed Defense', 'Light Smite'],
    lore: 'A radiant land of golden highlands and ivory temples where the sun never fully sets and holy light is as natural as air. Aura Bloom was chosen not by vote or bloodline, but by the light itself — during the Ceremony of Ascension she called down a single ray of pure sunlight that healed an entire city in one breath. Her reign is absolute and undisputed. Enemies who face Sunspire on the battlefield have been known to lay down their arms not from defeat, but from the sudden, total certainty that they had already lost.',
    ruler: {
      heroId: 'hero_012',
      name: 'Aura Bloom',
      title: 'The Radiant Sovereign',
      status: 'RULER',
      roleLore: 'Chosen by light itself during the Ceremony of Ascension. Her reign is undisputed across all of Sunspire — the first true sovereign the realm has known in centuries.',
    },
  },
  VERDANIA: {
    climate: 'Tropical Ancient Forest & Living Jungle',
    element: '🌿 Nature  🌪️ Wind',
    specialties: ['Nature Magic', 'Toxin Builds', 'Root Control', 'Healing'],
    lore: 'An ancient primordial forest so vast its borders have never been fully mapped, where the oldest trees remember the first age of the world. Iris Vale was not appointed or elected — she was chosen. During the Night of Blossoming, the eldest trees of Verdania flowered for the first time in a thousand years and named her queen. She does not rule from a palace; she walks the roots, speaks with the canopy, and feels every wound dealt to her forest as if it were carved into her own skin.',
    ruler: {
      heroId: 'hero_030',
      name: 'Iris Vale',
      title: 'The Thornborn Queen',
      status: 'RULER',
      roleLore: 'The jungle itself crowned her during the Night of Blossoming. She feels every wound dealt to Verdania as her own. To harm this forest is to make an enemy of its queen.',
    },
  },
  VOIDMARK: {
    climate: 'Corrupted Void & Broken Reality',
    element: '🌀 Void',
    specialties: ['DEF-Ignore', 'Instant KO', 'Reality Tears', 'Shadow Strikes'],
    lore: 'A fractured realm where the sky tears open without warning and the laws of reality are more suggestion than rule. There is no coronation ceremony in Voidmark — only survival. Nyx Vael rules because every challenger who came before her is no longer a concern. She does not speak of governance, only of dominance. In a realm where loyalty shifts like smoke and entire districts can slip between dimensions overnight, her absolute, immovable presence is the only thing stopping Voidmark from collapsing into itself. Even her inner court fears her. She considers that proof of competence.',
    ruler: {
      heroId: 'hero_033',
      name: 'Nyx Vael',
      title: 'The Abyssal Sovereign',
      status: 'RULER',
      roleLore: 'No coronation. No law. She rules because nothing that challenged her survived the attempt. In Voidmark, that is the only qualification that counts.',
    },
  },
  KHEMARA: {
    climate: 'Endless Dunes & Silver Nights',
    element: '🏜️ Sand  🌙 Moon',
    specialties: ['Lunar Judgment', 'Dynastic Rule', 'Sand & Dust', 'Moonlit Magic'],
    lore: 'A vast desert dominion of obelisks, sunken tombs, and dunes that swallow whole armies — a realm of scorching days and cold silver nights where the moon is worshipped and the dead are honored as gods. Khemara does not appear on any map a traveler can buy; its borders open only to those who already know the way. At its heart sits Nefara Khonsu, goddess and pharaoh in one, crowned by the full desert moon during a ceremony no outsider has ever witnessed. Her court measures time in dynasties, not years, and her judgment falls as silently as moonlight on sand. Those who seek Khemara do not find it. It decides whether to find them.',
    ruler: {
      heroId: 'hero_054',
      name: 'Nefara Khonsu',
      title: 'The Moon-Queen of Khemara',
      status: 'RULER',
      roleLore: 'Goddess and pharaoh of the sand realm, crowned by the full desert moon itself. She cannot be summoned or won — she descends only for those who seek her court directly, and weighs all who stand before her in the dark.',
    },
  },
};

// ── Touch zones — derived from FACTION_MARKERS centers ───────────────────────
// Positions match the six painted regions on world-map.webp:
//   GLACIARA  top-left      (ice / aurora)
//   EMBERVEIL bottom-left   (volcano / lava)
//   VERDANIA  center        (great tree / forest)
//   SUNSPIRE  top-center-R  (white floating city)
//   KHEMARA   top-right     (pyramids / desert)
//   VOIDMARK  bottom-right  (purple void)
// Tap zones tile the whole map with no gaps or overlaps — each rectangle
// contains its faction's marker pin (see FACTION_MARKERS). Three vertical
// bands (top 0–30% / mid 30–53% / bottom 53–100%), each split left↔right at
// the midpoint between the two markers that share the band.
const FACTION_ZONES = {
  // Top band — GLACIARA (left) | SUNSPIRE (right)
  GLACIARA:  { left: W * 0.00, top: H * 0.00, width: W * 0.62, height: H * 0.30 },
  SUNSPIRE:  { left: W * 0.62, top: H * 0.00, width: W * 0.38, height: H * 0.30 },
  // Mid band — VERDANIA (left) | VOIDMARK (right)
  VERDANIA:  { left: W * 0.00, top: H * 0.30, width: W * 0.78, height: H * 0.23 },
  VOIDMARK:  { left: W * 0.78, top: H * 0.30, width: W * 0.22, height: H * 0.23 },
  // Bottom band — EMBERVEIL (left) | KHEMARA (right)
  EMBERVEIL: { left: W * 0.00, top: H * 0.53, width: W * 0.50, height: H * 0.47 },
  KHEMARA:   { left: W * 0.50, top: H * 0.53, width: W * 0.50, height: H * 0.47 },
};

// ── Marker pin centers — subtract half marker size (24) to center ─────────────
const FACTION_MARKERS = {
  GLACIARA:  { left: Math.floor(W * 0.45) - 24, top: Math.floor(H * 0.22) - 24 },
  EMBERVEIL: { left: Math.floor(W * 0.16) - 24, top: Math.floor(H * 0.66) - 24 },
  VERDANIA:  { left: Math.floor(W * 0.60) - 24, top: Math.floor(H * 0.40) - 24 },
  SUNSPIRE:  { left: Math.floor(W * 0.80) - 24, top: Math.floor(H * 0.15) - 24 },
  VOIDMARK:   { left: Math.floor(W * 0.95) - 24, top: Math.floor(H * 0.40) - 24 },
  KHEMARA:  { left: Math.floor(W * 0.82) - 24, top: Math.floor(H * 0.66) - 24 },
};

// Order = overlap priority (later wins). SUNSPIRE last so its top-center pin
// takes precedence over VERDANIA where their zones meet.
const FACTION_KEYS = ['GLACIARA', 'EMBERVEIL', 'KHEMARA', 'VOIDMARK', 'VERDANIA', 'SUNSPIRE'];

// ── Status badge color per role ───────────────────────────────────────────────
const STATUS_COLORS = {
  RULER:     null,   // uses faction color (set at render time)
  CARETAKER: C.GOLD,
  REGENT:    C.CYAN,
};

// ── Full-screen faction detail ────────────────────────────────────────────────
// ── Faction hero grid item — memoized so panel re-renders don't repaint the grid ──
const FactionHeroCard = React.memo(function FactionHeroCard({ hero, owned, color, onHeroPress }) {
  const r = RANK[hero.rank];
  return (
    <TouchableOpacity
      style={S.heroCard}
      onPress={() => onHeroPress(hero)}
      activeOpacity={0.8}
    >
      {/* Card portrait */}
      <View style={[S.heroCardFrame, { borderColor: owned ? color + '99' : C.BORDER }]}>
        <Image source={hero.image} style={S.heroCardImg} />

        {/* Lock overlay for unowned */}
        {!owned && (
          <View style={S.lockOverlay}>
            <View style={S.lockIcon}>
              <Ionicons name="lock-closed" size={14} color={C.TEXT_MUTED} />
            </View>
          </View>
        )}

        {/* Rank badge */}
        <View style={[S.rankBadge, { backgroundColor: r.bg, shadowColor: r.glow }]}>
          <Text style={[S.rankText, { color: r.text }]}>{hero.rank}</Text>
        </View>

        {/* Owned green dot */}
        {owned && <View style={[S.ownedDot, { backgroundColor: C.SUCCESS }]} />}

        {/* Bottom name gradient */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.75)']}
          style={S.heroCardGrad}
        />
        <Text style={S.heroCardNameOverlay} numberOfLines={1}>
          {hero.name.split(' ')[0]}
        </Text>
      </View>

      {/* Class label below card */}
      <Text style={[S.heroCardClass, { color: owned ? C.TEXT_SOFT : C.TEXT_DISABLED }]} numberOfLines={1}>
        {hero.class}
      </Text>
    </TouchableOpacity>
  );
});

function FactionScreen({ faction, heroes, ownedHeroes, color, onClose, onHeroPress }) {
  const meta        = FACTION_META[faction];
  const factionData = FACTIONS[faction];
  const rulerHero   = getHeroById(meta.ruler.heroId);
  const statusColor = meta.ruler.status === 'RULER' ? color : (STATUS_COLORS[meta.ruler.status] ?? color);
  const ownedCount  = heroes.filter(h => ownedHeroes.includes(h.id)).length;

  return (
    <View style={S.fsRoot}>
      {/* Dark gradient background */}
      <LinearGradient
        colors={[C.BG_DEEP, C.BG_MID, C.BG_DEEP]}
        style={StyleSheet.absoluteFill}
      />

      {/* Faction ambient particles */}
      <FactionParticles faction={faction} />

      {/* Subtle faction-colored left-edge glow */}
      <LinearGradient
        colors={[color + '30', 'transparent']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 0.25, y: 0.5 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* ── Header bar ── */}
      <LinearGradient
        colors={[color + '28', C.BG_MID + 'F0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={S.fsHeader}
      >
        {/* Faction icon + name + climate */}
        <Image source={factionData.image} style={S.fsHeaderIcon} />
        <View style={S.fsHeaderInfo}>
          <Text style={[S.fsHeaderName, { color }]}>{faction}</Text>
          <Text style={S.fsHeaderClimate}>📍 {meta.climate}   ·   {meta.element}</Text>
        </View>

        {/* Owned count */}
        <View style={[S.fsOwnedBadge, { borderColor: color + '55', backgroundColor: color + '18' }]}>
          <Ionicons name="people" size={12} color={color} />
          <Text style={[S.fsOwnedText, { color }]}>  {ownedCount} / {heroes.length}  OWNED</Text>
        </View>

        {/* Close button */}
        <TouchableOpacity
          style={S.fsCloseBtn}
          onPress={onClose}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <View style={[S.fsCloseBtnInner, { borderColor: C.BORDER }]}>
            <Ionicons name="close" size={16} color={C.TEXT_SOFT} />
          </View>
        </TouchableOpacity>
      </LinearGradient>

      {/* Accent line under header */}
      <View style={[S.fsAccentLine, { backgroundColor: color }]} />

      {/* ── Body: left info + right hero grid ── */}
      <View style={S.fsBody}>

        {/* LEFT — faction details (scrollable so lore is always reachable) */}
        <ScrollView
          style={S.fsLeft}
          contentContainerStyle={S.fsLeftContent}
          showsVerticalScrollIndicator={false}
        >

          {/* ── Sovereign ── */}
          <Text style={S.fsSectionLabel}>SOVEREIGN</Text>
          <View style={S.rulerCard}>
            {/* Portrait */}
            {rulerHero && (
              <View style={[S.rulerPortraitFrame, { borderColor: statusColor + '88' }]}>
                <Image source={rulerHero.image} style={S.rulerPortrait} />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.70)']}
                  style={S.rulerPortraitGrad}
                />
              </View>
            )}
            {/* Info */}
            <View style={S.rulerInfo}>
              <Text style={[S.rulerName, { color }]}>{meta.ruler.name}</Text>
              <Text style={S.rulerTitle}>{meta.ruler.title}</Text>
              <View style={[S.rulerStatusBadge, { borderColor: statusColor + '60', backgroundColor: statusColor + '20' }]}>
                <Text style={[S.rulerStatusText, { color: statusColor }]}>{meta.ruler.status}</Text>
              </View>
            </View>
          </View>
          {/* Ruler role lore */}
          <Text style={S.rulerLore} numberOfLines={3}>{meta.ruler.roleLore}</Text>

          {/* Divider */}
          <View style={[S.fsDivider, { backgroundColor: color + '35' }]} />

          {/* ── Region traits ── */}
          <Text style={S.fsSectionLabel}>REGION TRAITS</Text>
          <View style={S.specialtyRow}>
            {meta.specialties.map((tag) => (
              <View key={tag} style={[S.specialtyTag, { borderColor: color + '60', backgroundColor: color + '18' }]}>
                <Text style={[S.specialtyText, { color }]}>{tag}</Text>
              </View>
            ))}
          </View>

          {/* Divider */}
          <View style={[S.fsDivider, { backgroundColor: color + '35' }]} />

          {/* ── Region lore ── */}
          <Text style={S.fsSectionLabel}>REGION LORE</Text>
          <Text style={S.loreText}>{meta.lore}</Text>
        </ScrollView>

        {/* Vertical separator */}
        <View style={[S.fsSep, { backgroundColor: color + '35' }]} />

        {/* RIGHT — champion grid */}
        <View style={S.fsRight}>
          <View style={S.championsHeader}>
            <Text style={S.championsTitle}>CHAMPIONS</Text>
            <Text style={S.championsSubtitle}>{heroes.length} heroes in {faction}</Text>
          </View>

          <FlatList
            data={heroes}
            keyExtractor={h => h.id}
            numColumns={GRID_COLS}
            renderItem={({ item }) => (
              <FactionHeroCard
                hero={item}
                owned={ownedHeroes.includes(item.id)}
                color={color}
                onHeroPress={onHeroPress}
              />
            )}
            style={S.heroList}
            columnWrapperStyle={S.heroGridRow}
            contentContainerStyle={S.heroGrid}
            showsVerticalScrollIndicator={false}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={4}
          />
        </View>

      </View>
    </View>
  );
}

// ── World Map Screen ──────────────────────────────────────────────────────────
export default function WorldMapScreen({ navigation }) {
  const ownedHeroes = useGameStore(s => s.ownedHeroes);
  const [selectedFaction, setSelectedFaction] = useState(null);

  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const overlaySlide   = useRef(new Animated.Value(24)).current;
  const glowPulse      = useRef(new Animated.Value(0)).current;

  const markerScale = useRef(
    FACTION_KEYS.reduce((acc, k) => ({ ...acc, [k]: new Animated.Value(1) }), {})
  ).current;

  // Continuous breathing glow on all marker rings
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const openPanel = useCallback((faction) => {
    AudioManager.playButtonSFX();
    setSelectedFaction(faction);
    // Marker pop
    Animated.sequence([
      Animated.timing(markerScale[faction], { toValue: 1.3, duration: 110, useNativeDriver: true }),
      Animated.timing(markerScale[faction], { toValue: 1.0, duration: 110, useNativeDriver: true }),
    ]).start();
    // Fade + slide-in overlay
    overlayOpacity.setValue(0);
    overlaySlide.setValue(24);
    Animated.parallel([
      Animated.timing(overlayOpacity, { toValue: 1, duration: 260, useNativeDriver: true }),
      Animated.spring(overlaySlide,   { toValue: 0, friction: 10, tension: 100, useNativeDriver: true }),
    ]).start();
  }, []);

  const closePanel = useCallback(() => {
    Animated.parallel([
      Animated.timing(overlayOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(overlaySlide,   { toValue: 18, duration: 180, useNativeDriver: true }),
    ]).start(() => setSelectedFaction(null));
  }, []);

  const factionHeroes = selectedFaction ? getHeroesByFaction(selectedFaction) : [];
  const factionColor  = selectedFaction ? FACTIONS[selectedFaction].color : C.PRIMARY;
  const glowOpacity   = glowPulse.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.80] });

  return (
    <View style={S.root}>
      {/* World map */}
      <Image
        source={WORLD_MAP}
        style={[StyleSheet.absoluteFill, { width: '100%', height: H }]}
        resizeMode="cover"
      />

      {/* Cinematic vignette */}
      <LinearGradient
        colors={['rgba(6,3,15,0.55)', 'transparent', 'rgba(6,3,15,0.70)']}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Faction touch zones */}
      {FACTION_KEYS.map((key) => (
        <TouchableOpacity
          key={key}
          style={[S.touchZone, FACTION_ZONES[key]]}
          onPress={() => openPanel(key)}
          activeOpacity={0.01}
        />
      ))}

      {/* Faction marker pins */}
      {FACTION_KEYS.map((key) => {
        const fColor    = FACTIONS[key].color;
        const isSelected = selectedFaction === key;
        return (
          <Animated.View
            key={key}
            style={[S.markerWrap, FACTION_MARKERS[key], { transform: [{ scale: markerScale[key] }] }]}
            pointerEvents="none"
          >
            <Animated.View
              style={[S.markerGlowRing, { borderColor: fColor, opacity: isSelected ? 1 : glowOpacity }]}
            />
            <View style={[
              S.markerCircle,
              {
                backgroundColor: fColor + (isSelected ? '35' : '20'),
                borderColor:     fColor + (isSelected ? 'CC' : '55'),
                borderWidth:     isSelected ? 2.5 : 1.5,
              },
            ]}>
              <Image source={FACTIONS[key].image} style={S.markerIcon} />
            </View>

          </Animated.View>
        );
      })}

      {/* Back button */}
      <TouchableOpacity
        style={S.backBtn}
        onPress={() => { AudioManager.playButtonSFX(); navigation.goBack(); }}
        activeOpacity={0.75}
      >
        <LinearGradient colors={C.GRAD_HEADER} style={S.backBtnGrad}>
          <Ionicons name="arrow-back" size={16} color={C.TEXT} />
          <Text style={S.backBtnText}>WORLD MAP</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Tap hint */}
      {!selectedFaction && (
        <View style={S.hintBadge} pointerEvents="none">
          <Text style={S.hintText}>TAP A REGION TO EXPLORE</Text>
        </View>
      )}

      {/* Full-screen faction overlay */}
      {selectedFaction && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              opacity:   overlayOpacity,
              transform: [{ translateY: overlaySlide }],
            },
          ]}
        >
          <FactionScreen
            faction={selectedFaction}
            heroes={factionHeroes}
            ownedHeroes={ownedHeroes}
            color={factionColor}
            onClose={closePanel}
            onHeroPress={(hero) => {
              closePanel();
              setTimeout(() => navigation.navigate('HeroDetail', { heroId: hero.id }), 220);
            }}
          />
        </Animated.View>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.BG_SCREEN,
  },

  // Invisible tap zones
  touchZone: {
    position: 'absolute',
  },

  // ── Marker pins ──────────────────────────────────────────────────────────
  markerWrap: {
    position: 'absolute',
    alignItems: 'center',
    width: 48,
  },
  markerGlowRing: {
    position: 'absolute',
    top: -5,
    left: -5,
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1.5,
  },
  markerCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerIcon: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },
  markerLabel: {
    marginTop: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  markerLabelText: {
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  // ── Back button ──────────────────────────────────────────────────────────
  backBtn: {
    position: 'absolute',
    top: 10,
    left: 12,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: C.SHADOW,
    shadowOpacity: 0.55,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  backBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 6,
  },
  backBtnText: {
    color: C.TEXT,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },

  // ── Tap hint ─────────────────────────────────────────────────────────────
  hintBadge: {
    position: 'absolute',
    bottom: 14,
    alignSelf: 'center',
    backgroundColor: 'rgba(6,3,15,0.75)',
    borderRadius: 5,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: C.BORDER,
  },
  hintText: {
    color: C.TEXT_MUTED,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 3,
  },

  // ── Full-screen faction overlay ──────────────────────────────────────────
  fsRoot: {
    flex: 1,
  },
  fsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: OUTER_PAD,
    paddingVertical: 10,
    gap: 12,
  },
  fsHeaderIcon: {
    width: 42,
    height: 42,
    resizeMode: 'contain',
  },
  fsHeaderInfo: {
    flex: 1,
    gap: 2,
  },
  fsHeaderName: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 4,
  },
  fsHeaderClimate: {
    color: C.TEXT_MUTED,
    fontSize: 10,
    fontWeight: '600',
  },
  fsOwnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
  },
  fsOwnedText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  fsCloseBtn: {
    marginLeft: 4,
  },
  fsCloseBtnInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  fsAccentLine: {
    height: 2,
    opacity: 0.70,
  },

  // ── Body split ───────────────────────────────────────────────────────────
  fsBody: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: OUTER_PAD,
    paddingTop: 12,
    paddingBottom: 10,
    gap: COL_GAP,
  },

  // Left info column
  fsLeft: {
    width: LEFT_COL_W,
  },
  fsLeftContent: {
    gap: 8,
    paddingBottom: 12,
  },
  fsSectionLabel: {
    color: C.TEXT_MUTED,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2.5,
    marginBottom: 2,
  },
  specialtyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  specialtyTag: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
  },
  specialtyText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  fsDivider: {
    height: 1,
    marginVertical: 4,
  },

  // ── Ruler / sovereign card ───────────────────────────────────────────────
  rulerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  rulerPortraitFrame: {
    width: 50,
    height: 66,
    borderRadius: 7,
    overflow: 'hidden',
    borderWidth: 1.5,
    backgroundColor: C.BG_CARD,
  },
  rulerPortrait: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  rulerPortraitGrad: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    height: 22,
  },
  rulerInfo: {
    flex: 1,
    gap: 3,
  },
  rulerName: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
  rulerTitle: {
    color: C.TEXT_MUTED,
    fontSize: 9,
    fontWeight: '600',
    lineHeight: 13,
  },
  rulerStatusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    marginTop: 1,
  },
  rulerStatusText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  rulerLore: {
    color: C.TEXT_MUTED,
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 15,
    marginBottom: 2,
    fontStyle: 'italic',
  },

  loreText: {
    color: C.TEXT_MUTED,
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 17,
  },

  // Vertical separator
  fsSep: {
    width: 1,
    alignSelf: 'stretch',
    marginVertical: 2,
  },

  // Right champion grid
  fsRight: {
    flex: 1,
    gap: 10,
  },
  championsHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  championsTitle: {
    color: C.TEXT,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2.5,
  },
  championsSubtitle: {
    color: C.TEXT_MUTED,
    fontSize: 9,
    fontWeight: '600',
  },

  // Hero grid (virtualized FlatList, 2 columns)
  heroList: {
    flex: 1,           // fill remaining column height so tall rosters scroll, not overflow
  },
  heroGrid: {
    gap: GRID_GAP,
    paddingBottom: 8,
  },
  heroGridRow: {
    gap: GRID_GAP,
    justifyContent: 'center',
  },
  heroCard: {
    width: CARD_W,
    alignItems: 'center',
  },
  heroCardFrame: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1.5,
    backgroundColor: C.BG_CARD,
  },
  heroCardImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  lockOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
    shadowOpacity: 0.6,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
  rankText: {
    fontSize: 8,
    fontWeight: '900',
  },
  ownedDot: {
    position: 'absolute',
    bottom: 22,
    right: 5,
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  heroCardGrad: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    height: 28,
  },
  heroCardNameOverlay: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    fontSize: 8,
    fontWeight: '800',
    color: C.TEXT,
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  heroCardClass: {
    fontSize: 8,
    fontWeight: '600',
    marginTop: 3,
    textAlign: 'center',
  },
});
