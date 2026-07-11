import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../../theme/colors';
import { rs, rf } from '../../theme/scale';
import GlassPanel from './GlassPanel';

// ── OrnateCard ────────────────────────────────────────────────────────────────
// Dark-fantasy "dungeon select" card: glowing purple border, diamond gem accents
// (all four corners plus top- and bottom-center), a small info chip, an optional
// star row, and either a soft glass CTA button (unlocked) or a near-black locked
// body — diamond padlock, "???", a divider, a muted hint line, and an optional
// red requirement ribbon.
//
// Props:
//   cardW, cardH      — fixed card size
//   image             — ImageSource shown when unlocked (ignored/silhouette otherwise)
//   unlocked          — bool
//   title             — real name; displayed as "???" when locked
//   badgeLabel        — small top-left chip text (e.g. "BOSS", "CH. 3") — always visible
//   badgeColor        — chip + star-fill + button-glow color
//   starCount         — optional 0-5, renders a 5-star row when provided
//   ctaLabel          — CTA button label (default "VIEW")
//   onPress           — fires on card tap AND the CTA button
//   requirementText   — optional locked-state ribbon text (omit ribbon if not given)
//   lockedHint        — muted line shown under "???" when locked (default "Defeat to discover")
function OrnateCard({
  cardW,
  cardH,
  image,
  unlocked,
  title,
  badgeLabel,
  badgeColor = C.PRIMARY_LIGHT,
  starCount,
  ctaLabel = 'VIEW',
  onPress,
  requirementText,
  lockedHint = 'Defeat to discover',
}) {
  const displayTitle = unlocked ? title : '???';
  const showRibbon = !unlocked && !!requirementText;
  const bottomBarOffset = showRibbon ? rs(6) + rs(18) : rs(6);

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={[styles.card, { width: cardW, height: cardH, borderColor: badgeColor, shadowColor: badgeColor }]}>
      {unlocked && image ? (
        <Image source={image} style={styles.art} resizeMode="cover" />
      ) : (
        <View style={[styles.art, styles.silhouette]} />
      )}

      {!unlocked && (
        <View pointerEvents="none" style={styles.lockWrap}>
          <View style={styles.lockDiamond}>
            <View style={styles.lockDiamondCounter}>
              <Ionicons name="lock-closed" size={rs(16)} color={C.GOLD} />
            </View>
          </View>
        </View>
      )}

      <View pointerEvents="none" style={[styles.innerBorder, { borderColor: badgeColor + '80' }]} />
      <View pointerEvents="none" style={[styles.gem, styles.gemTop, { backgroundColor: badgeColor, borderColor: badgeColor }]} />
      <View pointerEvents="none" style={[styles.gem, styles.gemBottom, { backgroundColor: badgeColor, borderColor: badgeColor }]} />
      <View pointerEvents="none" style={[styles.gem, styles.gemTL, { backgroundColor: badgeColor, borderColor: badgeColor }]} />
      <View pointerEvents="none" style={[styles.gem, styles.gemTR, { backgroundColor: badgeColor, borderColor: badgeColor }]} />
      <View pointerEvents="none" style={[styles.gem, styles.gemBL, { backgroundColor: badgeColor, borderColor: badgeColor }]} />
      <View pointerEvents="none" style={[styles.gem, styles.gemBR, { backgroundColor: badgeColor, borderColor: badgeColor }]} />

      <View style={[styles.badge, { backgroundColor: badgeColor + '30', borderColor: badgeColor + '88' }]}>
        <Text style={[styles.badgeTxt, { color: badgeColor }]} numberOfLines={1}>{badgeLabel}</Text>
      </View>

      <LinearGradient colors={['transparent', C.OVERLAY_STRONG]} style={styles.bottomGrad} pointerEvents="none" />
      <View style={[styles.bottomBar, { bottom: bottomBarOffset }]}>
        <Text style={styles.title} numberOfLines={1}>{displayTitle}</Text>
        {starCount != null && (
          <View style={styles.starRow}>
            {[0, 1, 2, 3, 4].map(i => (
              <Text key={i} style={[styles.star, { color: i < starCount ? badgeColor : C.GLASS_5 }]}>★</Text>
            ))}
          </View>
        )}
        {unlocked && (
          <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.ctaBtn}>
            <GlassPanel radius={rs(13)} borderColor={badgeColor} baseColor={C.OVERLAY_STRONG}>
              <View style={styles.ctaRow}>
                <Ionicons name="eye-outline" size={rf(11)} color={C.TEXT} />
                <Text style={styles.ctaTxt}>{ctaLabel}</Text>
              </View>
            </GlassPanel>
          </TouchableOpacity>
        )}
        {!unlocked && (
          <>
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <View style={styles.dividerGem} />
              <View style={styles.dividerLine} />
            </View>
            <Text style={styles.discoverTxt} numberOfLines={1}>{lockedHint}</Text>
          </>
        )}
      </View>

      {showRibbon && (
        <View style={styles.ribbon}>
          <LinearGradient colors={[C.DANGER_DARK, C.DANGER]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
          <View style={styles.ribbonRow}>
            <Ionicons name="flag-outline" size={rf(9)} color={C.TEXT} />
            <Text style={styles.ribbonTxt} numberOfLines={1}>{requirementText}</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

const GEM = rs(11);

const styles = StyleSheet.create({
  card: {
    borderRadius: rs(10), overflow: 'hidden', backgroundColor: C.BG_CARD,
    borderWidth: 2, borderColor: C.PRIMARY, position: 'relative',
    shadowOpacity: 0.55, shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 }, elevation: 10,
  },
  art: { position: 'absolute', width: '100%', height: '100%' },
  silhouette: { backgroundColor: C.BG_VOID },

  lockWrap: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: rs(48),
    alignItems: 'center', justifyContent: 'center',
  },

  innerBorder: {
    position: 'absolute', top: rs(4), left: rs(4), right: rs(4), bottom: rs(4),
    borderWidth: 1, borderRadius: rs(7),
  },

  gem: {
    position: 'absolute', width: GEM, height: GEM,
    borderWidth: 1, transform: [{ rotate: '45deg' }],
  },
  gemTop:    { top: -GEM / 2, left: '50%', marginLeft: -GEM / 2 },
  gemBottom: { bottom: -GEM / 2, left: '50%', marginLeft: -GEM / 2 },
  gemTL:  { top: -GEM / 2, left: -GEM / 2 },
  gemTR:  { top: -GEM / 2, right: -GEM / 2 },
  gemBL:  { bottom: -GEM / 2, left: -GEM / 2 },
  gemBR:  { bottom: -GEM / 2, right: -GEM / 2 },

  badge: {
    position: 'absolute', top: rs(8), left: rs(8),
    borderRadius: 3, paddingHorizontal: rs(5), paddingVertical: rs(2), borderWidth: 1,
  },
  badgeTxt: { fontSize: rf(8), fontWeight: '900' },

  bottomGrad: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '58%' },
  bottomBar: { position: 'absolute', left: rs(7), right: rs(7) },
  title: {
    fontSize: rf(11), color: C.TEXT, fontWeight: '700', letterSpacing: 0.3,
    textShadowColor: C.OVERLAY_4, textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3,
  },
  starRow: { flexDirection: 'row', gap: 1, marginTop: rs(2) },
  star: { fontSize: rf(9) },
  ctaBtn: { marginTop: rs(6) },
  ctaRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(4),
    paddingVertical: rs(6),
  },
  ctaTxt: { color: C.TEXT, fontWeight: '700', fontSize: rf(11), letterSpacing: 1 },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: rs(4), marginTop: rs(4) },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.BORDER_STRONG },
  dividerGem: {
    width: rs(5), height: rs(5), backgroundColor: C.TEXT_MUTED,
    transform: [{ rotate: '45deg' }],
  },
  discoverTxt: { fontSize: rf(8), color: C.TEXT_MUTED, textAlign: 'center', marginTop: rs(2) },

  lockDiamond: {
    width: rs(30), height: rs(30), backgroundColor: C.OVERLAY_STRONG,
    borderWidth: 1, borderColor: C.PRIMARY_LIGHT, transform: [{ rotate: '45deg' }],
    alignItems: 'center', justifyContent: 'center',
  },
  lockDiamondCounter: { transform: [{ rotate: '-45deg' }] },
  ribbon: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: rs(18),
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  ribbonRow: { flexDirection: 'row', alignItems: 'center', gap: rs(3) },
  ribbonTxt: { fontSize: rf(8), fontWeight: '800', color: C.TEXT, letterSpacing: 0.3 },
});

export default React.memo(OrnateCard);
