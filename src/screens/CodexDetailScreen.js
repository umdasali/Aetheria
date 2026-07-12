import { useMemo, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, Animated, ScrollView, useWindowDimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView, BlurTargetView } from 'expo-blur';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import AudioManager from '../utils/AudioManager';
import { C } from '../theme/colors';
import { rs, rf } from '../theme/scale';
import { ENEMY_IMAGES } from '../data/enemies';
import { getBestiaryEntry, getEnemyCatalog, getEnemyCombatSnapshot } from '../data/bestiary';
import { getChronicleEntry, CHAPTER_IMAGES } from '../data/chronicle';
import { CHAPTER_DEFS } from '../data/story';
import CornerBrackets from '../components/ui/CornerBrackets';
import EnemyParticles from '../components/EnemyParticles';

const CODEX_BG_VIDEO = require('../../assets/video/codex-bg.mp4');

const BODY_PAD = 12;

const TIER_BADGE_COLOR = { boss: C.DANGER, 'mini-boss': C.WARNING, mob: C.TEXT_MUTED };
const TIER_BADGE_LABEL = { boss: 'BOSS', 'mini-boss': 'MINI-BOSS', mob: 'MOB' };

// Human-readable ailment descriptions — mirrors the effect → mechanic mapping
// in battleEngine.js, spelled out for players browsing the Codex rather than
// fighting the battle live.
const EFFECT_LABELS = {
  PARALYSIS:   'Stuns the target, skipping its next turn.',
  BURN:        'Burns for 8% ATK damage per turn, for 2 turns.',
  TOXIN:       'Poisons for 5% max HP per turn, for 3 turns.',
  CHILL:       'Slows the target by 50% for 2 turns.',
  SHATTER:     "Shatters the target's DEF by 25% for 2 turns.",
  VOID_CURSE:  "Weakens the target's ATK by 20% for 2 turns.",
  SHADOW:      'Passive 20% chance to dodge incoming attacks.',
  LIFEDRAIN:   'Drains a portion of damage dealt as self-healing.',
  THORNSTRIKE: 'Reflects a portion of incoming damage back at the attacker.',
  BLESSING:    'Regenerates 5% max HP per turn.',
  BARKSKIN:    'Reduces all incoming damage by 15%.',
  SMITE:       'Critical hits deal a 2.0× damage multiplier.',
};

// route.params: { type: 'bestiary' | 'chronicle', key }
// Mirrors HeroDetailScreen's layout: portrait/panel card on the left (fixed
// aspect, floating back button), full lore in a scrollable right column.
export default function CodexDetailScreen({ navigation, route }) {
  const { type, key } = route.params;
  const { width: screenW, height: screenH } = useWindowDimensions();

  // Ambient looping background video — muted, paused while the screen is
  // unfocused so it doesn't keep decoding frames off-screen. play()/pause()
  // are wrapped in try/catch because the native player can already be
  // released by the time this fires (e.g. on back-navigation unmount),
  // which otherwise throws a native "shared object already released" error.
  const bgVideoPlayer = useVideoPlayer(CODEX_BG_VIDEO, player => {
    player.loop = true;
    player.muted = true;
    try { player.play(); } catch (_) {}
  });
  useFocusEffect(useCallback(() => {
    try { bgVideoPlayer.play(); } catch (_) {}
    return () => { try { bgVideoPlayer.pause(); } catch (_) {} };
  }, [bgVideoPlayer]));
  // Android-only: BlurView's real-time blur methods need a BlurTargetView ref
  // to know what to sample — without it, blurMethod silently falls back to
  // "none" (a flat tint, no actual blur). iOS ignores blurTarget entirely.
  const videoTargetRef = useRef(null);

  const cardHAvail = screenH - BODY_PAD * 2;
  const CARD_W = Math.min(
    Math.floor(cardHAvail * (220 / 320)),
    Math.floor(screenW * 0.34),
  );
  const CARD_H = Math.floor(CARD_W * (320 / 220));

  const bestiary = useMemo(() => {
    if (type !== 'bestiary') return null;
    const catalogEntry = getEnemyCatalog().find(e => e.imageKey === key);
    const entry = getBestiaryEntry(key);
    if (!catalogEntry || !entry) return null;
    return { ...catalogEntry, ...entry, combat: getEnemyCombatSnapshot(key) };
  }, [type, key]);

  const chronicle = useMemo(() => {
    if (type !== 'chronicle') return null;
    const chapter = CHAPTER_DEFS.find(ch => ch.id === key);
    if (!chapter) return null;
    return { chapter, lore: getChronicleEntry(key) || '' };
  }, [type, key]);

  const goBack = () => { AudioManager.playButtonSFX(); navigation.goBack(); };

  if (!bestiary && !chronicle) return null;

  const accent = bestiary ? TIER_BADGE_COLOR[bestiary.tier] : (chronicle.chapter.color || C.PRIMARY);
  const isBoss = bestiary?.tier === 'boss';
  const showCombatProfile = bestiary && (bestiary.tier === 'boss' || bestiary.tier === 'mini-boss') && bestiary.combat;

  return (
    <View style={styles.root}>
      <BlurTargetView ref={videoTargetRef} style={StyleSheet.absoluteFill}>
        <VideoView
          player={bgVideoPlayer}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          nativeControls={false}
          pointerEvents="none"
          surfaceType="textureView"
        />
      </BlurTargetView>
      <BlurView
        blurTarget={videoTargetRef}
        intensity={40}
        tint="dark"
        blurMethod="dimezisBlurView"
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <LinearGradient colors={C.GRAD_BATTLE} style={StyleSheet.absoluteFill} pointerEvents="none" />

      <View style={styles.safe}>
        <View style={styles.body}>

          {/* LEFT — card / chapter panel */}
          <View style={[styles.cardCol, { width: CARD_W }]}>
            {bestiary ? (
              <EnemyCard entry={bestiary} width={CARD_W} height={CARD_H} isBoss={isBoss} />
            ) : (
              <ChapterPanel chapter={chronicle.chapter} width={CARD_W} height={CARD_H} />
            )}
            <TouchableOpacity style={styles.backBtn} onPress={goBack} activeOpacity={0.8}>
              <Ionicons name="chevron-back" size={rs(22)} color={C.TEXT} />
            </TouchableOpacity>
          </View>

          {/* RIGHT — lore panel */}
          <View style={styles.infoCol}>
            {bestiary ? (
              <>
                <View style={styles.nameRow}>
                  <View style={[styles.rankDot, { backgroundColor: accent }]} />
                  <Text style={styles.title} numberOfLines={1}>{bestiary.name.toUpperCase()}</Text>
                  {isBoss && <Ionicons name="skull" size={rs(16)} color={accent} />}
                  <View style={[styles.badge, { backgroundColor: accent + '30', borderColor: accent + '88' }]}>
                    <Text style={[styles.badgeTxt, { color: accent }]}>{TIER_BADGE_LABEL[bestiary.tier]}</Text>
                  </View>
                </View>
                <Text style={styles.subtitle}>{bestiary.epithet} · First appears Chapter {bestiary.chapter}</Text>
              </>
            ) : (
              <>
                <View style={styles.nameRow}>
                  <View style={[styles.rankDot, { backgroundColor: accent }]} />
                  <Text style={styles.title} numberOfLines={1}>{chronicle.chapter.title.toUpperCase()}</Text>
                  <View style={[styles.badge, { backgroundColor: accent + '30', borderColor: accent + '88' }]}>
                    <Text style={[styles.badgeTxt, { color: accent }]}>CHAPTER {chronicle.chapter.id}</Text>
                  </View>
                </View>
                <Text style={styles.subtitle}>{chronicle.chapter.subtitle}</Text>
              </>
            )}

            <View style={styles.divider} />

            <ScrollView style={styles.loreArea} showsVerticalScrollIndicator={false} contentContainerStyle={styles.loreContent}>
              {showCombatProfile && <CombatProfile combat={bestiary.combat} accent={accent} />}
              <Text style={styles.loreTxt}>{bestiary ? bestiary.lore : chronicle.lore}</Text>
            </ScrollView>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Combat profile — HP/ATK/DEF, ailment, signature skills ────────────────

function CombatProfile({ combat, accent }) {
  return (
    <View style={styles.combatWrap}>
      <Text style={[styles.combatHeading, { color: accent }]}>COMBAT PROFILE</Text>

      <View style={styles.statRow}>
        {[
          { key: 'HP',  val: combat.hp,  color: C.HP },
          { key: 'ATK', val: combat.atk, color: C.ATK },
          { key: 'DEF', val: combat.def, color: C.DEF },
        ].map(s => (
          <View key={s.key} style={styles.statChip}>
            <Text style={[styles.statVal, { color: s.color }]}>{s.val.toLocaleString()}</Text>
            <Text style={styles.statKey}>{s.key}</Text>
          </View>
        ))}
      </View>

      {combat.effect && EFFECT_LABELS[combat.effect] && (
        <View style={[styles.ailmentRow, { borderColor: accent + '55', backgroundColor: accent + '12' }]}>
          <Ionicons name="flash" size={rs(13)} color={accent} />
          <Text style={styles.ailmentTxt}>
            <Text style={[styles.ailmentTag, { color: accent }]}>{combat.effect}  </Text>
            {EFFECT_LABELS[combat.effect]}
          </Text>
        </View>
      )}

      {combat.skills.length > 0 && (
        <View style={styles.skillList}>
          {combat.skills.map(sk => (
            <View key={sk.name} style={styles.skillRow}>
              <Ionicons name="flame-outline" size={rs(12)} color={C.TEXT_MUTED} />
              <Text style={styles.skillName} numberOfLines={1}>{sk.name}</Text>
              <Text style={styles.skillMult}>{sk.damage.toFixed(1)}×</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.combatDivider} />
    </View>
  );
}

// ─── Left-column card variants ──────────────────────────────────────────────

function EnemyCard({ entry, width, height, isBoss }) {
  const accent = TIER_BADGE_COLOR[entry.tier];
  const pulseAnim   = useRef(new Animated.Value(0.4)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  // Boss-only VFX: a slow breathing glow around the border, plus a diagonal
  // shimmer sweep that fires, pauses, then repeats — same pattern HeroCard.js
  // already uses for Sovereign heroes, just recolored to the boss accent.
  useEffect(() => {
    if (!isBoss) return;
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1,   duration: 1300, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 1300, useNativeDriver: true }),
      ])
    );
    pulseLoop.start();

    let active = true;
    const runShimmer = () => {
      if (!active) return;
      shimmerAnim.setValue(0);
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.delay(2600),
      ]).start(() => runShimmer());
    };
    runShimmer();

    return () => { active = false; pulseLoop.stop(); };
  }, [isBoss, pulseAnim, shimmerAnim]);

  const shimmerX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-rs(60), width + rs(60)],
  });

  return (
    <View style={[cardStyles.wrap, { width, height, borderColor: accent + '55' }]}>
      <Image source={ENEMY_IMAGES[entry.imageKey]} style={cardStyles.art} resizeMode="cover" />
      <LinearGradient colors={['transparent', C.OVERLAY_4]} style={cardStyles.botGrad} />
      <EnemyParticles tier={entry.tier} imageKey={entry.imageKey} width={width} height={height} />

      {isBoss && (
        <>
          {/* Pulsing outer glow */}
          <Animated.View
            pointerEvents="none"
            style={[cardStyles.bossGlow, { borderColor: accent, opacity: pulseAnim }]}
          />
          {/* Diagonal shimmer sweep */}
          <View pointerEvents="none" style={cardStyles.shimmerClip}>
            <Animated.View style={[cardStyles.shimmerBar, { transform: [{ translateX: shimmerX }, { rotate: '20deg' }] }]}>
              <LinearGradient
                colors={['transparent', C.SHIMMER, 'transparent']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </View>
          <CornerBrackets color={accent} size={18} thickness={2} inset={6} />
        </>
      )}

      <View style={[cardStyles.tierBadge, { backgroundColor: accent + '30', borderColor: accent + '88' }]}>
        {isBoss && <Ionicons name="skull" size={rs(11)} color={accent} style={cardStyles.tierIcon} />}
        <Text style={[cardStyles.tierTxt, { color: accent }]}>{TIER_BADGE_LABEL[entry.tier]}</Text>
      </View>
      <View style={cardStyles.namePlate}>
        <Text style={cardStyles.nameTxt} numberOfLines={2}>{entry.name}</Text>
      </View>
    </View>
  );
}

function ChapterPanel({ chapter, width, height }) {
  const accent = chapter.color || C.PRIMARY;
  const image = CHAPTER_IMAGES[chapter.id];
  return (
    <View style={[cardStyles.wrap, { width, height, borderColor: accent + '55' }]}>
      {image ? (
        <Image source={image} style={cardStyles.art} resizeMode="cover" />
      ) : (
        <LinearGradient colors={[accent + '55', C.BG_DEEP]} style={StyleSheet.absoluteFill} />
      )}
      <LinearGradient colors={['transparent', C.OVERLAY_4]} style={cardStyles.botGrad} />
      <View style={[cardStyles.tierBadge, { backgroundColor: accent + '30', borderColor: accent + '88' }]}>
        <Ionicons name="book" size={rs(11)} color={accent} style={cardStyles.tierIcon} />
        <Text style={[cardStyles.tierTxt, { color: accent }]}>CH.{chapter.id}</Text>
      </View>
      <View style={cardStyles.namePlate}>
        <Text style={cardStyles.nameTxt} numberOfLines={3}>{chapter.title}</Text>
      </View>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  wrap: {
    borderRadius: rs(12), overflow: 'hidden', borderWidth: 2,
    backgroundColor: C.BG_CARD, position: 'relative',
  },
  art: { position: 'absolute', width: '100%', height: '100%' },
  botGrad: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%' },
  bossGlow: {
    position: 'absolute', top: -2, left: -2, right: -2, bottom: -2,
    borderRadius: rs(14), borderWidth: 3,
  },
  shimmerClip: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' },
  shimmerBar: { position: 'absolute', top: -20, bottom: -20, width: rs(50) },
  tierBadge: {
    position: 'absolute', top: rs(10), left: rs(10),
    flexDirection: 'row', alignItems: 'center', gap: rs(3),
    borderRadius: 4, paddingHorizontal: rs(7), paddingVertical: rs(3), borderWidth: 1,
  },
  tierIcon: { marginRight: 1 },
  tierTxt: { fontSize: rf(10), fontWeight: '900', letterSpacing: 0.5 },
  namePlate: { position: 'absolute', bottom: rs(12), left: rs(10), right: rs(10) },
  nameTxt: {
    fontSize: rf(16), fontWeight: '900', color: C.TEXT, letterSpacing: 0.5,
    textShadowColor: C.OVERLAY_4, textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.BG_DEEP },
  safe: { flex: 1 },

  body: { flex: 1, flexDirection: 'row', padding: rs(BODY_PAD), gap: rs(12) },

  cardCol: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  backBtn: {
    position: 'absolute', top: rs(8), left: rs(8),
    width: rs(30), height: rs(30), borderRadius: rs(15),
    backgroundColor: C.BG_CARD, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.BORDER, zIndex: 20,
  },

  infoCol: { flex: 1, flexDirection: 'column' },

  nameRow:  { flexDirection: 'row', alignItems: 'center', gap: rs(7), marginBottom: rs(6) },
  rankDot:  { width: rs(8), height: rs(8), borderRadius: rs(4) },
  title:    { flex: 1, fontSize: rf(16), fontWeight: '900', letterSpacing: 2, color: C.TEXT },
  badge:    { paddingHorizontal: rs(8), paddingVertical: rs(3), borderRadius: 4, borderWidth: 1 },
  badgeTxt: { fontSize: rf(11), fontWeight: '900', letterSpacing: 0.5 },
  subtitle: { fontSize: rf(12), color: C.TEXT_MUTED, fontWeight: '600', marginBottom: rs(10) },

  divider: { height: 1, backgroundColor: C.BORDER_SUBTLE, marginBottom: rs(12) },

  loreArea:    {
    flex: 1, borderRadius: rs(12), borderWidth: 1, borderColor: C.BORDER_SUBTLE,
    backgroundColor: C.BG_BASE+'33',
  },
  loreContent: { padding: rs(16) },
  loreTxt:     { fontSize: rf(14), color: C.TEXT_SOFT, lineHeight: rf(22) },

  // ── Combat profile ──────────────────────────────────────────────────────
  combatWrap:     { marginBottom: rs(14) },
  combatHeading:  { fontSize: rf(11), fontWeight: '900', letterSpacing: 1.5, marginBottom: rs(8) },
  statRow:        { flexDirection: 'row', gap: rs(8), marginBottom: rs(10) },
  statChip: {
    flex: 1, alignItems: 'center', paddingVertical: rs(8), borderRadius: rs(8),
    backgroundColor: C.BG_STATS, borderWidth: 1, borderColor: C.BORDER_SUBTLE,
  },
  statVal: { fontSize: rf(14), fontWeight: '900' },
  statKey: { fontSize: rf(9), color: C.TEXT_MUTED, fontWeight: '700', letterSpacing: 0.5, marginTop: 2 },

  ailmentRow: {
    flexDirection: 'row', alignItems: 'center', gap: rs(7),
    borderRadius: rs(8), borderWidth: 1, padding: rs(9), marginBottom: rs(10),
  },
  ailmentTxt: { flex: 1, fontSize: rf(12), color: C.TEXT_SOFT, lineHeight: rf(16) },
  ailmentTag: { fontWeight: '900', letterSpacing: 0.5 },

  skillList:  { gap: rs(5) },
  skillRow:   { flexDirection: 'row', alignItems: 'center', gap: rs(6) },
  skillName:  { flex: 1, fontSize: rf(12), color: C.TEXT_SOFT, fontWeight: '600' },
  skillMult:  { fontSize: rf(12), color: C.PRIMARY_LIGHT, fontWeight: '800' },

  combatDivider: { height: 1, backgroundColor: C.BORDER_SUBTLE, marginTop: rs(14) },
});
