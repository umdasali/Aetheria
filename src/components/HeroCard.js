import React, { useRef, useEffect, useCallback } from 'react';
import { View, Text, Image, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FACTIONS } from '../data/heroes';
import { C, RANK_COLORS } from '../theme/colors';

const CLASS_ICONS = {
  Attacker: '⚔️',
  Defender: '🛡️',
  Support:  '✨',
  Mage:     '🔮',
};

const ELEMENT_ICONS = {
  Fire:     '🔥',
  Ice:      '❄️',
  Lightning:'⚡',
  Wind:     '🌪️',
  Nature:   '🌿',
  Void:     '🌀',
  Holy:     '☀️',
  Physical: '💪',
};

const CARD_W = 220;
const CARD_H = 320;

function HeroCard({ hero, width = CARD_W, compact = false, effectiveRank }) {
  if (!hero) return null;

  const displayRank        = effectiveRank ?? hero.rank;
  const isSovereign        = !!hero.sovereign;
  const faction            = FACTIONS[hero.faction] || FACTIONS.EMBERVEIL;
  const rankStyle          = RANK_COLORS[displayRank] || RANK_COLORS[hero.rank] || RANK_COLORS.B;
  const effectiveRankStyle = isSovereign ? (RANK_COLORS.SOVEREIGN || rankStyle) : rankStyle;
  const rankDisplayText    = isSovereign ? 'SOV' : displayRank;
  const scale       = width / CARD_W;
  const height      = width * (CARD_H / CARD_W);

  // All absolute positions are derived from scale so the card renders
  // correctly at every width (160px VictoryScreen, 220px reference, 248px+ HeroDetail).
  const sc = {
    corner:     Math.round(6  * scale),
    cornerSz:   Math.round(14 * scale),
    section:    Math.round(10 * scale),
    tagLeft:    Math.round(8  * scale),
    factionTop: Math.round(56 * scale),
    factionR:   Math.round(10 * scale),
    factionPad: Math.max(2, Math.round(3 * scale)),
    statsB:     Math.round(52 * scale),
    barB:       Math.round(14 * scale),
    footerB:    Math.round(4  * scale),
    footerR:    Math.round(10 * scale),
    divH:       Math.round(24 * scale),
    rankW:      Math.round(34 * scale),
    rankH:      Math.round(40 * scale),
    topLeftMR:  Math.round(6  * scale),
    shimmerW:   Math.round(52 * scale),
    bannerB:    Math.round(72 * scale), // sits just above stats row gap
  };

  // ── Sovereign animations ───────────────────────────────────────────────────
  const pulseAnim      = useRef(new Animated.Value(0.55)).current;
  const shimmerAnim    = useRef(new Animated.Value(0)).current;
  const sweepActiveRef = useRef(false);

  // Recursive shimmer sweep — guarded by sweepActiveRef so it stops on unmount
  const sweep = useCallback(() => {
    if (!sweepActiveRef.current) return;
    shimmerAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shimmerAnim, { toValue: 1, duration: 820, useNativeDriver: true }),
      Animated.delay(3400),
    ]).start(({ finished }) => {
      if (finished && sweepActiveRef.current) sweep();
    });
  }, [shimmerAnim]);

  useEffect(() => {
    if (!isSovereign) return;

    // 1. Pulsing gold border: opacity 0.55 ↔ 1.0
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.0,  duration: 1400, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.55, duration: 1400, useNativeDriver: true }),
      ])
    );
    pulseLoop.start();

    // 2. Diagonal shimmer sweep — fires, pauses, repeats
    sweepActiveRef.current = true;
    sweep();

    return () => {
      pulseLoop.stop();
      sweepActiveRef.current = false;
    };
  }, [isSovereign, sweep]);

  const shimmerX = shimmerAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [-sc.shimmerW, Math.round(width * 1.7)],
  });

  // Derived per-card colours
  const cornerColor = isSovereign ? C.SOVEREIGN_GOLD : faction.color;
  const tagBorder   = isSovereign ? C.SOVEREIGN_GOLD + '99' : faction.color + '99';
  const bottomTint  = isSovereign ? C.SOVEREIGN_AMBER        : faction.color;

  return (
    <View style={[styles.card, { width, height }]}>

      {/* ── Sovereign: warm gold background wash (below gradients) ──────────── */}
      {isSovereign && (
        <LinearGradient
          colors={['rgba(255,165,0,0.09)', 'transparent', 'rgba(255,215,0,0.05)']}
          style={[StyleSheet.absoluteFill, { zIndex: 1 }]}
          pointerEvents="none"
        />
      )}

      {/* ── Border glow — animated gold pulse for sovereign ─────────────────── */}
      {isSovereign ? (
        <Animated.View
          style={[styles.borderGlow, { borderColor: C.SOVEREIGN_GOLD, opacity: pulseAnim }]}
        />
      ) : (
        <View style={[styles.borderGlow, { borderColor: faction.color + '99' }]} />
      )}

      {/* ── Portrait ────────────────────────────────────────────────────────── */}
      <Image source={hero.image} style={styles.portrait} resizeMode="cover" />

      {/* ── Top dark fade ───────────────────────────────────────────────────── */}
      <LinearGradient
        colors={['rgba(0,0,0,0.7)', 'transparent']}
        style={styles.topGradient}
      />

      {/* ── Bottom faction/sovereign gradient ───────────────────────────────── */}
      <LinearGradient
        colors={['transparent', bottomTint + '18', 'rgba(0,0,0,0.94)']}
        style={styles.bottomGradient}
      />

      {/* ── Sovereign: diagonal shimmer sweep ───────────────────────────────── */}
      {isSovereign && (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: 3 }]}>
          <Animated.View
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              width: sc.shimmerW,
              transform: [{ translateX: shimmerX }],
            }}
          >
            <LinearGradient
              colors={[
                'transparent',
                C.SOVEREIGN_GLOW,
                C.SOVEREIGN_SHINE,
                C.SOVEREIGN_GLOW,
                'transparent',
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>
      )}

      {/* ── Corner circuit decorations ───────────────────────────────────────── */}
      <View style={[styles.cornerTL, { borderColor: cornerColor, top: sc.corner, left: sc.corner,  width: sc.cornerSz, height: sc.cornerSz }]} />
      <View style={[styles.cornerTR, { borderColor: cornerColor, top: sc.corner, right: sc.corner, width: sc.cornerSz, height: sc.cornerSz }]} />
      <View style={[styles.cornerBL, { borderColor: cornerColor, bottom: sc.corner, left: sc.corner,  width: sc.cornerSz, height: sc.cornerSz }]} />
      <View style={[styles.cornerBR, { borderColor: cornerColor, bottom: sc.corner, right: sc.corner, width: sc.cornerSz, height: sc.cornerSz }]} />

      {/* ── Top: name + frame label + rank badge ─────────────────────────────── */}
      <View style={[styles.topSection, { top: sc.section, left: sc.section, right: sc.section }]}>
        <View style={[styles.topLeft, { marginRight: sc.topLeftMR }]}>
          <Text style={[styles.heroName, { fontSize: 16 * scale }]} numberOfLines={1}>
            {hero.name.toUpperCase()}
          </Text>
          <Text
            style={[
              styles.frameLabel,
              { fontSize: 9 * scale, color: isSovereign ? C.SOVEREIGN_GOLD : C.PRIMARY_LIGHT },
            ]}
          >
            {isSovereign ? '♛ ' : 'FRAME : '}{hero.frame}
          </Text>
        </View>
        <View
          style={[
            styles.rankBadge,
            {
              backgroundColor: effectiveRankStyle.bg,
              shadowColor:     effectiveRankStyle.glow,
              width:           sc.rankW,
              height:          sc.rankH,
            },
          ]}
        >
          <Text style={[styles.rankText,  { color: effectiveRankStyle.text, fontSize: (isSovereign ? 11 : 16) * scale }]}>
            {rankDisplayText}
          </Text>
          <Text style={[styles.rankLabel, { color: effectiveRankStyle.text, fontSize: 6 * scale }]}>
            RANK
          </Text>
        </View>
      </View>

      {/* ── Left column: element + effect tags ──────────────────────────────── */}
      {!compact && (
        <View style={[styles.leftTags, { left: sc.tagLeft }]}>
          <View style={[styles.tag, { backgroundColor: 'rgba(0,0,0,0.65)', borderColor: tagBorder }]}>
            <Text style={[styles.tagIcon, { fontSize: 10 * scale }]}>
              {ELEMENT_ICONS[hero.element] || '🔮'}
            </Text>
            <View>
              <Text style={[styles.tagLabel, { fontSize: 6 * scale }]}>ELEMENT</Text>
              <Text style={[styles.tagValue, { fontSize: 8 * scale }]}>{hero.element.toUpperCase()}</Text>
            </View>
          </View>
          <View style={[styles.tag, { backgroundColor: 'rgba(0,0,0,0.65)', borderColor: tagBorder, marginTop: 4 }]}>
            <Text style={[styles.tagIcon, { fontSize: 10 * scale }]}>✦</Text>
            <View>
              <Text style={[styles.tagLabel, { fontSize: 6 * scale }]}>EFFECT</Text>
              <Text style={[styles.tagValue, { fontSize: 8 * scale }]}>{hero.effect}</Text>
            </View>
          </View>
        </View>
      )}

      {/* ── Faction icon badge ───────────────────────────────────────────────── */}
      <View style={[styles.factionBadge, { top: sc.factionTop, right: sc.factionR, padding: sc.factionPad }]}>
        <Image
          source={faction.image}
          style={[styles.factionIcon, { width: 22 * scale, height: 22 * scale }]}
          resizeMode="contain"
        />
      </View>

      {/* ── Sovereign: ♛ SOVEREIGN crown banner above stats row ─────────────── */}
      {isSovereign && (
        <View pointerEvents="none" style={[styles.sovereignBanner, { bottom: sc.bannerB }]}>
          <LinearGradient
            colors={['transparent', C.SOVEREIGN_GLOW, 'transparent']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.sovereignBannerGrad}
          >
            <Text style={[styles.sovereignLabel, { fontSize: Math.max(6, Math.round(7 * scale)) }]}>
              ♛  SOVEREIGN
            </Text>
          </LinearGradient>
        </View>
      )}

      {/* ── Stats row — gold top border for sovereign ────────────────────────── */}
      <View
        style={[
          styles.statsRow,
          { bottom: sc.statsB },
          isSovereign && { borderTopColor: C.SOVEREIGN_GOLD + '55', borderTopWidth: 1 },
        ]}
      >
        <StatItem icon="♥" label="HP"   value={hero.hp}   color={C.HP}   scale={scale} />
        <View style={[styles.statDivider, { height: sc.divH }]} />
        <StatItem icon="✕" label="ATK"  value={hero.atk}  color={C.ATK}  scale={scale} />
        <View style={[styles.statDivider, { height: sc.divH }]} />
        <StatItem icon="⊙" label="DEF"  value={hero.def}  color={C.DEF}  scale={scale} />
        <View style={[styles.statDivider, { height: sc.divH }]} />
        <StatItem icon="◎" label="CRIT" value={hero.crit} color={C.CRIT} scale={scale} />
      </View>

      {/* ── Bottom info bar ──────────────────────────────────────────────────── */}
      {!compact && (
        <View style={[styles.bottomBar, { bottom: sc.barB }]}>
          <View style={styles.classSection}>
            <Text style={[styles.classIcon, { fontSize: 16 * scale }]}>
              {CLASS_ICONS[hero.class] || '⚔️'}
            </Text>
            <View>
              <Text style={[styles.classLabel, { fontSize: 6 * scale }]}>CLASS</Text>
              <Text
                style={[
                  styles.classValue,
                  { fontSize: 9 * scale, color: isSovereign ? C.SOVEREIGN_GOLD : faction.color },
                ]}
              >
                {hero.class.toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={styles.aboutSection}>
            <Text style={[styles.aboutLabel, { fontSize: 6 * scale }]}>ABOUT</Text>
            <Text style={[styles.aboutText, { fontSize: 7 * scale }]} numberOfLines={3}>
              {hero.about}
            </Text>
          </View>
        </View>
      )}

      {/* ── Card ID footer — gold tint for sovereign ────────────────────────── */}
      <View style={[styles.cardFooter, { bottom: sc.footerB, right: sc.footerR }]}>
        <Text
          style={[
            styles.cardId,
            { fontSize: 6 * scale, color: isSovereign ? C.SOVEREIGN_GOLD + 'AA' : C.TEXT_MUTED },
          ]}
        >
          {hero.cardId}
        </Text>
      </View>

    </View>
  );
}

function StatItem({ icon, label, value, color, scale }) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statIcon,  { color, fontSize: 8  * scale }]}>{icon} {label}</Text>
      <Text style={[styles.statValue, { color, fontSize: 13 * scale }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: C.BG_DEEP,
    position: 'relative',
  },

  // Outer border — animated Animated.View for sovereign, plain View otherwise
  borderGlow: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 10,
    borderWidth: 1.5,
    zIndex: 10,
  },

  portrait: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    width: '100%', height: '100%',
  },

  topGradient: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: '40%',
    zIndex: 2,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: '58%',
    zIndex: 2,
  },

  // ── Corners ─────────────────────────────────────────────────────────────────
  cornerTL: { position: 'absolute', borderTopWidth: 2,    borderLeftWidth: 2,  borderRadius: 2, zIndex: 5 },
  cornerTR: { position: 'absolute', borderTopWidth: 2,    borderRightWidth: 2, borderRadius: 2, zIndex: 5 },
  cornerBL: { position: 'absolute', borderBottomWidth: 2, borderLeftWidth: 2,  borderRadius: 2, zIndex: 5 },
  cornerBR: { position: 'absolute', borderBottomWidth: 2, borderRightWidth: 2, borderRadius: 2, zIndex: 5 },

  // ── Top name / rank ──────────────────────────────────────────────────────────
  topSection: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 6,
  },
  topLeft: { flex: 1 },
  heroName: {
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  frameLabel: {
    letterSpacing: 0.5,
    marginTop: 1,
  },
  rankBadge: {
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.9,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    elevation: 4,
  },
  rankText:  { fontWeight: '900', lineHeight: 20 },
  rankLabel: { fontWeight: '700', letterSpacing: 1 },

  // ── Left element / effect tags ───────────────────────────────────────────────
  leftTags: { position: 'absolute', top: '32%', zIndex: 6 },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    gap: 4,
  },
  tagIcon:  {},
  tagLabel: { color: C.TEXT_MUTED, letterSpacing: 0.5 },
  tagValue: { color: '#fff', fontWeight: '700', letterSpacing: 0.5 },

  // ── Faction icon ─────────────────────────────────────────────────────────────
  factionBadge: {
    position: 'absolute',
    zIndex: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 4,
  },
  factionIcon: {},

  // ── Sovereign crown banner ───────────────────────────────────────────────────
  sovereignBanner: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 6,
    alignItems: 'center',
  },
  sovereignBannerGrad: {
    width: '100%',
    paddingVertical: 3,
    alignItems: 'center',
  },
  sovereignLabel: {
    color: C.SOVEREIGN_GOLD,
    fontWeight: '900',
    letterSpacing: 2.5,
    textShadowColor: C.SOVEREIGN_GLOW,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },

  // ── Stats row ────────────────────────────────────────────────────────────────
  statsRow: {
    position: 'absolute',
    left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: 'rgba(0,0,0,0.78)',
    zIndex: 6,
  },
  statItem:    { alignItems: 'center', flex: 1 },
  statIcon:    { fontWeight: '600' },
  statValue:   { fontWeight: '900', marginTop: 1 },
  statDivider: { width: 1, backgroundColor: C.PRIMARY_GLOW },

  // ── Bottom info bar ──────────────────────────────────────────────────────────
  bottomBar: {
    position: 'absolute',
    left: 0, right: 0,
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingTop: 4,
    zIndex: 6,
    gap: 6,
  },
  classSection: { flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 60 },
  classIcon:    {},
  classLabel:   { color: C.TEXT_MUTED, letterSpacing: 0.5 },
  classValue:   { fontWeight: '800', letterSpacing: 0.5 },
  aboutSection: { flex: 1 },
  aboutLabel:   { color: C.GOLD, fontWeight: '700', letterSpacing: 1, marginBottom: 2 },
  aboutText:    { color: C.PRIMARY_LIGHT, lineHeight: 10 },

  // ── Footer ───────────────────────────────────────────────────────────────────
  cardFooter: { position: 'absolute', zIndex: 6 },
  cardId:     { letterSpacing: 1 },
});

// Memoize so parent re-renders (e.g. team state changes in Collection/Battle)
// don't re-render cards whose hero data hasn't changed.
export default React.memo(HeroCard);
