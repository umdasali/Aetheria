import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, Modal, ScrollView, Animated,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import useGameStore from '../store/gameStore';
import AudioManager from '../utils/AudioManager';
import { C, RANK } from '../theme/colors';
import { rs, rf } from '../theme/scale';
import { InfiniteCarousel, OrnateCard, GlassPanel } from '../components/ui';
import { ENEMY_IMAGES } from '../data/enemies';
import { getEncounteredImageKeys, getEnemyCatalog } from '../data/bestiary';
import { CHAPTER_IMAGES } from '../data/chronicle';
import { CHAPTER_DEFS } from '../data/story';
import { ASCENSION_ITEMS } from '../data/ascensionItems';

const CODEX_BG_VIDEO = require('../../assets/video/codex-bg.mp4');

const SIDEBAR_W = 96;
// Card sizing is derived at runtime from the measured content box rather than
// a fixed grid formula, so it fills whatever room is left below the top bar.
const CARD_MIN_H  = 120;
const CARD_MAX_H  = 220;
const CARD_ASPECT = 0.74; // width = height * CARD_ASPECT (portrait)

const TABS = [
  { key: 'bestiary',  label: 'BESTIARY',  icon: 'skull-outline' },
  { key: 'relics',    label: 'RELICS',    icon: 'diamond-outline' },
  { key: 'chronicle', label: 'CHRONICLE', icon: 'book-outline' },
];

const TIER_FILTERS = [
  { key: 'all',       label: 'All',         icon: 'sparkles-outline', color: C.PRIMARY_LIGHT },
  { key: 'boss',      label: 'Bosses',      icon: 'skull-outline',    color: C.DANGER },
  { key: 'mini-boss', label: 'Mini-Bosses', icon: 'skull-outline',    color: C.WARNING },
  { key: 'mob',       label: 'Mobs',        icon: 'skull-outline',    color: C.TEXT_MUTED },
];

const RANK_FILTERS = [
  { key: 'all',       label: 'All',         icon: 'diamond-outline' },
  { key: 'SOVEREIGN', label: 'Sovereign',   icon: 'star' },
  { key: 'S',         label: 'S Rank',      icon: 'medal-outline' },
  { key: 'A',         label: 'A Rank',      icon: 'medal-outline' },
  { key: 'B',         label: 'B / C Rank',  icon: 'medal-outline' },
];

const TIER_BADGE_COLOR = { boss: C.DANGER, 'mini-boss': C.WARNING, mob: C.TEXT_MUTED };
const TIER_BADGE_LABEL = { boss: 'BOSS', 'mini-boss': 'MINI-BOSS', mob: 'MOB' };
const TIER_STARS       = { boss: 3, 'mini-boss': 2, mob: 1 };
const RANK_STARS       = { C: 1, B: 2, A: 3, S: 4, SOVEREIGN: 5 };

const FOOTER_NOTE = {
  bestiary:  'Defeat enemies and bosses to unlock their entries in the Codex.',
  chronicle: "Clear each chapter's story stages to unlock its Chronicle entry.",
};

export default function CodexScreen({ navigation }) {
  const { bottom: bottomInset } = useSafeAreaInsets();

  const completedChapters  = useGameStore(s => s.completedChapters);
  const ascensionInventory = useGameStore(s => s.ascensionInventory);
  const clearCodexUnlocks  = useGameStore(s => s.clearCodexUnlocks);

  const [activeTab, setActiveTab]   = useState('bestiary');
  const [tierFilter, setTierFilter] = useState('all');
  const [rankFilter, setRankFilter] = useState('all');
  const [detail, setDetail]         = useState(null); // { type, key } | null

  // Opening the Codex is itself the "acknowledgement" of new entries — clears
  // the bottom-tab badge instead of an interrupting unlock modal on Home.
  useFocusEffect(useCallback(() => { clearCodexUnlocks(); }, [clearCodexUnlocks]));

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

  const catalog = useMemo(() => getEnemyCatalog(), []);
  const encounteredKeys = useMemo(
    () => getEncounteredImageKeys(completedChapters),
    [completedChapters],
  );
  const filteredCatalog = useMemo(
    () => tierFilter === 'all' ? catalog : catalog.filter(e => e.tier === tierFilter),
    [catalog, tierFilter],
  );
  const filteredRelics = useMemo(
    () => rankFilter === 'all' ? ASCENSION_ITEMS : ASCENSION_ITEMS.filter(i => i.rankKey === rankFilter),
    [rankFilter],
  );

  const unlockedChapterIds = useMemo(() => {
    const done = new Set(completedChapters);
    return new Set(
      CHAPTER_DEFS
        .filter(ch => [1, 2, 3].every(p => done.has(ch.id * 100 + p)))
        .map(ch => ch.id),
    );
  }, [completedChapters]);

  const relicsUnlockedCount = ASCENSION_ITEMS.filter(i => (ascensionInventory[i.id] || 0) > 0).length;

  // Card size is derived from the measured content box (the area below the
  // top bar / tier row), so it fills whatever room is left.
  const [box, setBox] = useState({ w: 0, h: 0 });
  const handleBoxLayout = useCallback((e) => {
    const { width, height } = e.nativeEvent.layout;
    setBox(prev => (prev.w === width && prev.h === height) ? prev : { w: width, h: height });
  }, []);
  const cardH = useMemo(
    () => box.h ? Math.max(CARD_MIN_H, Math.min(box.h - bottomInset - rs(8), CARD_MAX_H)) : 0,
    [box.h, bottomInset],
  );
  const cardW = useMemo(() => Math.round(cardH * CARD_ASPECT), [cardH]);
  // Relics' spotlight column (badge + art + name + stars + CTA) runs taller
  // than the bordered portrait cards, so it gets its own row height using the
  // full measured box instead of the CARD_MAX_H clamp — otherwise the CTA
  // button clips at the carousel row's edge.
  const relicH = useMemo(
    () => box.h ? Math.max(CARD_MIN_H, Math.min(box.h - bottomInset - rs(12), 340)) : 0,
    [box.h, bottomInset],
  );

  // Bestiary/Chronicle open a dedicated split-screen (card left, lore right) —
  // mirrors HeroDetailScreen rather than a modal, since the lore is long-form.
  // Relics stay a modal here: only 4 items, short lore, no need for a full screen.
  const openBestiaryDetail  = useCallback((imageKey) => { AudioManager.playButtonSFX(); navigation.navigate('CodexDetail', { type: 'bestiary', key: imageKey }); }, [navigation]);
  const openChronicleDetail = useCallback((chapterId) => { AudioManager.playButtonSFX(); navigation.navigate('CodexDetail', { type: 'chronicle', key: chapterId }); }, [navigation]);
  const openRelicDetail     = useCallback((itemId) => { AudioManager.playButtonSFX(); setDetail({ type: 'relic', key: itemId }); }, []);
  const closeDetail         = useCallback(() => { AudioManager.playButtonSFX(); setDetail(null); }, []);

  const renderBestiaryCard = useCallback(({ item }) => {
    const unlocked = encounteredKeys.has(item.imageKey);
    return (
      <OrnateCard
        cardW={cardW}
        cardH={cardH}
        image={ENEMY_IMAGES[item.imageKey]}
        unlocked={unlocked}
        title={item.name}
        badgeLabel={TIER_BADGE_LABEL[item.tier]}
        badgeColor={TIER_BADGE_COLOR[item.tier]}
        starCount={TIER_STARS[item.tier]}
        onPress={() => unlocked && openBestiaryDetail(item.imageKey)}
        requirementText={`Clear Chapter ${item.chapter}`}
      />
    );
  }, [encounteredKeys, cardW, cardH, openBestiaryDetail]);

  const renderChronicleCard = useCallback(({ item }) => {
    const unlocked = unlockedChapterIds.has(item.id);
    const accent = item.color || C.PRIMARY;
    return (
      <OrnateCard
        cardW={cardW}
        cardH={cardH}
        image={CHAPTER_IMAGES[item.id]}
        unlocked={unlocked}
        title={item.title}
        badgeLabel={`CH. ${item.id}`}
        badgeColor={accent}
        onPress={() => unlocked && openChronicleDetail(item.id)}
        requirementText={`Clear Chapter ${item.id}`}
        lockedHint="Clear to discover"
      />
    );
  }, [unlockedChapterIds, cardW, cardH, openChronicleDetail]);

  const renderRelicCard = useCallback(({ item, isCenter, centerProgress }) => {
    const unlocked = (ascensionInventory[item.id] || 0) > 0;
    const rank = RANK[item.rankKey] || RANK.C;
    return (
      <RelicSpotlightCard
        item={item}
        rank={rank}
        isCenter={isCenter}
        centerProgress={centerProgress}
        unlocked={unlocked}
        cardW={cardW}
        cardH={relicH}
        onPress={() => unlocked && openRelicDetail(item.id)}
      />
    );
  }, [ascensionInventory, cardW, relicH, openRelicDetail]);

  const totalTabCount = activeTab === 'bestiary' ? catalog.length
    : activeTab === 'relics' ? ASCENSION_ITEMS.length
    : CHAPTER_DEFS.length;
  const unlockedTabCount = activeTab === 'bestiary' ? encounteredKeys.size
    : activeTab === 'relics' ? relicsUnlockedCount
    : unlockedChapterIds.size;
  const discoverPct = totalTabCount ? (unlockedTabCount / totalTabCount) * 100 : 0;

  return (
    <View style={styles.root}>
      <VideoView
        player={bgVideoPlayer}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
        pointerEvents="none"
      />
      <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} pointerEvents="none" />
      <LinearGradient colors={C.GRAD_BATTLE} style={StyleSheet.absoluteFill} pointerEvents="none" />
      <AmbientDust />

      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>

        {/* ══ TOP BAR ══ */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => { AudioManager.playButtonSFX(); navigation.goBack(); }} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={rs(19)} color={C.TEXT} />
            <Text style={styles.backText}>BACK</Text>
          </TouchableOpacity>

          <View style={styles.topCenter}>
            <View style={styles.titleRow}>
              <Text style={styles.titleFlourish}>◇</Text>
              <Text style={styles.topTitle}>CODEX</Text>
              <Text style={styles.titleFlourish}>◇</Text>
            </View>
            <Text style={styles.topCount}>{unlockedTabCount} / {totalTabCount} discovered</Text>
            {activeTab !== 'relics' && (
              <View style={styles.progressRow}>
                <View style={styles.progressTrack}>
                  <LinearGradient
                    colors={[C.PRIMARY_DARK, C.PRIMARY]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={[styles.progressFill, { width: `${discoverPct}%` }]}
                  />
                </View>
                <Text style={styles.progressPct}>{Math.round(discoverPct)}%</Text>
              </View>
            )}
          </View>
        </View>

        {/* ══ BODY ══ */}
        <View style={styles.body}>

          {/* Tab sidebar */}
          <View style={styles.sidebar}>
            {TABS.map(tab => {
              const active = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tabBtn, active && styles.tabBtnActive]}
                  onPress={() => { AudioManager.playButtonSFX(); setActiveTab(tab.key); }}
                  activeOpacity={0.8}
                >
                  {active && <View style={styles.tabAccent} />}
                  <Ionicons name={tab.icon} size={rs(18)} color={active ? C.PRIMARY_LIGHT : C.TEXT_MUTED} />
                  <Text style={[styles.tabTxt, active && styles.tabTxtActive]}>{tab.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Content */}
          {activeTab === 'bestiary' && (
            <View style={styles.content}>
              <View style={styles.tierRow}>
                {TIER_FILTERS.map(f => {
                  const active = tierFilter === f.key;
                  return (
                    <TouchableOpacity
                      key={f.key}
                      style={[styles.tierPill, active && styles.tierPillActive]}
                      onPress={() => { AudioManager.playButtonSFX(); setTierFilter(f.key); }}
                      activeOpacity={0.8}
                    >
                      <Ionicons name={f.icon} size={rs(12)} color={f.color} />
                      <Text style={[styles.tierPillTxt, active && styles.tierPillTxtActive]}>{f.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={[styles.carouselBox, { paddingBottom: bottomInset }]} onLayout={handleBoxLayout}>
                {box.w > 0 && cardW > 0 && (
                  <InfiniteCarousel
                    key={`bestiary-${tierFilter}-${cardW}`}
                    data={filteredCatalog}
                    cardW={cardW}
                    cardH={cardH}
                    containerWidth={box.w}
                    renderCard={renderBestiaryCard}
                  />
                )}
              </View>
              <FooterNote text={FOOTER_NOTE.bestiary} />
            </View>
          )}

          {activeTab === 'relics' && (
            <View style={styles.content}>
              <View style={styles.tierRow}>
                {RANK_FILTERS.map(f => {
                  const active = rankFilter === f.key;
                  const color = f.key === 'all' ? C.PRIMARY_LIGHT : (RANK[f.key] || RANK.C).bg;
                  return (
                    <TouchableOpacity
                      key={f.key}
                      style={[styles.tierPill, active && styles.tierPillActive]}
                      onPress={() => { AudioManager.playButtonSFX(); setRankFilter(f.key); }}
                      activeOpacity={0.8}
                    >
                      <Ionicons name={f.icon} size={rs(12)} color={color} />
                      <Text style={[styles.tierPillTxt, active && styles.tierPillTxtActive]}>{f.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={[styles.carouselBox, { paddingBottom: bottomInset }]} onLayout={handleBoxLayout}>
                {box.w > 0 && cardW > 0 && (
                  <InfiniteCarousel
                    key={`relics-${rankFilter}-${cardW}-${relicH}`}
                    data={filteredRelics}
                    cardW={cardW}
                    cardH={relicH}
                    gap={rs(26)}
                    containerWidth={box.w}
                    renderCard={renderRelicCard}
                    focusMode
                    onCenterPress={(idx) => {
                      const item = filteredRelics[idx];
                      if (item && (ascensionInventory[item.id] || 0) > 0) openRelicDetail(item.id);
                    }}
                  />
                )}
              </View>
            </View>
          )}

          {activeTab === 'chronicle' && (
            <View style={styles.content}>
              <View style={[styles.carouselBox, { paddingBottom: bottomInset }]} onLayout={handleBoxLayout}>
                {box.w > 0 && cardW > 0 && (
                  <InfiniteCarousel
                    key={`chronicle-${cardW}`}
                    data={CHAPTER_DEFS}
                    cardW={cardW}
                    cardH={cardH}
                    containerWidth={box.w}
                    renderCard={renderChronicleCard}
                  />
                )}
              </View>
              <FooterNote text={FOOTER_NOTE.chronicle} />
            </View>
          )}
        </View>
      </SafeAreaView>

      <DetailModal detail={detail} onClose={closeDetail} ascensionInventory={ascensionInventory} />
    </View>
  );
}

// ─── Relic spotlight card — Relics' floating, borderless "artifact" style
// (a deliberately different presentation from OrnateCard: no frame, one item
// spotlighted at a time by the carousel's focusMode scale/dim + glow). ──────

function RelicSpotlightCard({ item, rank, isCenter, centerProgress, unlocked, cardW, cardH, onPress }) {
  // Fixed vertical budget: badge / name / stars / CTA slot are constant-height,
  // the art gets whatever remains — so the column always fits the carousel row
  // and the CTA button can never clip at the row's bottom edge.
  const artSize = Math.max(rs(56), Math.min(Math.round(cardW * 0.85), cardH - rs(128)));
  const displayName = unlocked ? item.name : '???';
  const starCount = RANK_STARS[item.rankKey];

  return (
    <View style={[styles.relicCol, { width: cardW, height: cardH }]}>
      <View style={[styles.relicBadge, { backgroundColor: rank.bg + '30', borderColor: rank.bg + '88' }]}>
        <Ionicons name={item.rankKey === 'SOVEREIGN' ? 'star' : 'medal-outline'} size={rs(10)} color={rank.bg} />
        <Text style={[styles.relicBadgeTxt, { color: rank.bg }]} numberOfLines={1}>{item.rankLabel}</Text>
      </View>

      <View style={[styles.relicArtWrap, { width: artSize, height: artSize }]}>
        {/* Spotlight burst lives INSIDE the item (not at the carousel's fixed
            center) so it always sits exactly behind this art, and its opacity
            rides centerProgress so it fades in/out in lockstep with the scroll. */}
        {centerProgress && (
          <>
            <Animated.View pointerEvents="none" style={[styles.relicHalo, { width: '180%', height: '180%', backgroundColor: rank.bg + '17', opacity: centerProgress }]} />
            <Animated.View pointerEvents="none" style={[styles.relicHalo, { width: '145%', height: '145%', backgroundColor: rank.bg + '24', opacity: centerProgress }]} />
          </>
        )}
        <View pointerEvents="none" style={[styles.relicGlow, { backgroundColor: rank.bg + (unlocked ? '18' : '0F') }]} />
        {/* Locked relics still show their art (dimmed) — the mystery is the
            name/lore, matching the reference — not a blacked-out silhouette. */}
        <Image source={item.image} style={[styles.relicArt, !unlocked && styles.relicArtDim]} resizeMode="contain" />
      </View>

      <Text style={styles.relicName} numberOfLines={1}>{displayName}</Text>

      {starCount != null && (
        <View style={styles.starRow}>
          {[0, 1, 2, 3, 4].map(i => (
            <Text key={i} style={[styles.relicStar, { color: i < starCount ? rank.bg : C.GLASS_5 }]}>★</Text>
          ))}
        </View>
      )}

      {/* Constant-height slot: button (centered+unlocked), lock (locked), or
          empty — keeps every column's badge/art/name rows vertically aligned.
          The button's opacity rides centerProgress so it eases in as the item
          settles into center rather than popping at the midpoint. */}
      <View style={styles.relicCtaSlot}>
        {unlocked && isCenter && (
          <Animated.View style={[styles.relicCtaBtn, centerProgress ? { opacity: centerProgress } : null]}>
            <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
              <GlassPanel radius={rs(14)} borderColor={rank.bg} baseColor={C.OVERLAY_STRONG}>
                <View style={styles.ctaRow}>
                  <Ionicons name="eye-outline" size={rf(11)} color={C.TEXT} />
                  <Text style={styles.ctaTxt}>VIEW DETAILS</Text>
                </View>
              </GlassPanel>
            </TouchableOpacity>
          </Animated.View>
        )}
        {!unlocked && (
          <Ionicons name="lock-closed-outline" size={rs(14)} color={C.TEXT_MUTED} />
        )}
      </View>
    </View>
  );
}

// ─── Ambient dust — a handful of tiny twinkling motes behind the whole
// screen for atmosphere; cheap (native-driven opacity only), screen-local. ──

const DUST_COUNT = 16;

function AmbientDust() {
  const dots = useMemo(() => Array.from({ length: DUST_COUNT }, () => ({
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: 1 + Math.random() * 2,
    delay: Math.random() * 3000,
  })), []);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {dots.map((d, i) => <DustMote key={i} {...d} />)}
    </View>
  );
}

function DustMote({ left, top, size, delay }) {
  const opacity = useRef(new Animated.Value(0.12)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, { toValue: 0.75, duration: 1800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.12, duration: 1800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity, delay]);
  return (
    <Animated.View style={{
      position: 'absolute', left: `${left}%`, top: `${top}%`,
      width: size, height: size, borderRadius: size, backgroundColor: C.PRIMARY_LIGHT, opacity,
    }}
    />
  );
}

// ─── Footer explainer note ──────────────────────────────────────────────────

function FooterNote({ text }) {
  return (
    <View style={styles.footerNote}>
      <Ionicons name="information-circle-outline" size={rs(12)} color={C.TEXT_MUTED} />
      <Text style={styles.footerNoteTxt}>{text}</Text>
    </View>
  );
}

// ─── Detail modal — Relics only. Bestiary/Chronicle detail is a dedicated
// split-screen (CodexDetailScreen) since their lore runs much longer; relics
// have just 4 short entries, so a modal is enough. ─────────────────────────

function DetailModal({ detail, onClose, ascensionInventory }) {
  if (!detail) return null;

  const item = ASCENSION_ITEMS.find(i => i.id === detail.key);
  const rank = RANK[item?.rankKey] || RANK.C;
  const image = item?.image;
  const title = item?.name || '';
  const subtitle = `${item?.rankLabel || ''} · Owned: ${ascensionInventory[detail.key] || 0}`;
  const accent = rank.bg;
  const lore = item?.lore || '';

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={[styles.modalAccent, { backgroundColor: accent }]} />
          <TouchableOpacity style={styles.modalClose} onPress={onClose} activeOpacity={0.8}>
            <Ionicons name="close" size={rs(20)} color={C.TEXT} />
          </TouchableOpacity>

          <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
            {image && (
              <View style={styles.modalImageWrap}>
                <Image source={image} style={styles.modalImage} resizeMode="contain" />
              </View>
            )}
            <Text style={styles.modalTitle}>{title}</Text>
            <Text style={[styles.modalSubtitle, { color: accent }]}>{subtitle}</Text>
            <Text style={styles.modalLore}>{lore}</Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.BG_DEEP },
  safe: { flex: 1 },

  topBar: {
    minHeight: rs(48), flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: rs(12), paddingVertical: rs(6),
    backgroundColor: C.BG_BASE+'33',
    borderBottomWidth: 1, borderBottomColor: C.BORDER,
  },
  backBtn:  { flexDirection: 'row', alignItems: 'center', gap: rs(3), marginRight: rs(12) },
  backText: { color: C.TEXT, fontSize: rf(12), fontWeight: '700', letterSpacing: 0.5 },
  topCenter:{ flex: 1, alignItems: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: rs(8) },
  titleFlourish: { fontSize: rf(11), color: C.PRIMARY_LIGHT },
  topTitle: { fontSize: rf(13), fontWeight: '900', color: C.TEXT, letterSpacing: 4 },
  topCount: { fontSize: rf(12), color: C.TEXT_MUTED, letterSpacing: 0.5, marginTop: 1 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: rs(6), marginTop: rs(4), width: rs(160) },
  progressTrack: { flex: 1, height: 4, borderRadius: 2, backgroundColor: C.BG_MID, overflow: 'hidden' },
  progressFill:  { height: 4, borderRadius: 2 },
  progressPct:   { fontSize: rf(9), fontWeight: '800', color: C.TEXT_MUTED },

  body: { flex: 1, flexDirection: 'row' },

  sidebar: {
    width: SIDEBAR_W, paddingVertical: rs(10), gap: rs(4),
    backgroundColor: C.BG_BASE+'33',
    borderRightWidth: 1, borderRightColor: C.BORDER,
  },
  tabBtn: {
    alignItems: 'center', justifyContent: 'center', gap: rs(4),
    paddingVertical: rs(12), position: 'relative',
    borderRightWidth: 2, borderRightColor: 'transparent',
  },
  tabBtnActive: { backgroundColor: C.PRIMARY_GLOW, borderRightColor: C.PRIMARY_LIGHT },
  tabAccent: {
    position: 'absolute', left: 0, top: rs(6), bottom: rs(6),
    width: 3, borderRadius: 2, backgroundColor: C.PRIMARY_LIGHT,
  },
  tabTxt:       { fontSize: rf(8), fontWeight: '800', color: C.TEXT_MUTED, letterSpacing: 0.5, textAlign: 'center' },
  tabTxtActive: { color: C.PRIMARY_LIGHT },

  content: { flex: 1 },
  carouselBox: { flex: 1, justifyContent: 'center' },

  tierRow: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(6), padding: rs(10), paddingBottom: rs(4) },
  tierPill: {
    flexDirection: 'row', alignItems: 'center', gap: rs(4),
    paddingHorizontal: rs(10), paddingVertical: rs(6), borderRadius: rs(12),
    backgroundColor: C.GLASS_3, borderWidth: 1, borderColor: C.GLASS_7,
  },
  tierPillActive:  { backgroundColor: C.PRIMARY_GLOW, borderColor: C.PRIMARY_LIGHT },
  tierPillTxt:     { fontSize: rf(11), fontWeight: '700', color: C.TEXT_MUTED },
  tierPillTxtActive: { color: C.PRIMARY_LIGHT },

  footerNote: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(6),
    paddingVertical: rs(8), paddingHorizontal: rs(16),
  },
  footerNoteTxt: { fontSize: rf(10), color: C.TEXT_MUTED, textAlign: 'center' },

  relicCol: { alignItems: 'center', justifyContent: 'center' },
  relicBadge: {
    flexDirection: 'row', alignItems: 'center', gap: rs(4),
    borderRadius: rs(10), paddingHorizontal: rs(8), paddingVertical: rs(3), borderWidth: 1,
    marginBottom: rs(8),
  },
  relicBadgeTxt: { fontSize: rf(9), fontWeight: '800' },
  relicArtWrap: { alignItems: 'center', justifyContent: 'center' },
  relicGlow: { position: 'absolute', width: '130%', height: '130%', borderRadius: 999 },
  relicHalo: { position: 'absolute', borderRadius: 999 },
  relicArt: { width: '100%', height: '100%' },
  relicArtDim: { opacity: 0.45 },
  relicName: { fontSize: rf(12), fontWeight: '700', color: C.TEXT, marginTop: rs(8), textAlign: 'center' },
  starRow: { flexDirection: 'row', gap: 1, marginTop: rs(3) },
  relicStar: { fontSize: rf(10) },
  relicCtaSlot: {
    height: rs(38), marginTop: rs(8), width: '100%',
    alignItems: 'center', justifyContent: 'center',
  },
  relicCtaBtn: { width: '100%' },
  ctaRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(4),
    paddingVertical: rs(7),
  },
  ctaTxt: { color: C.TEXT, fontWeight: '700', fontSize: rf(11), letterSpacing: 1 },

  modalBackdrop: {
    flex: 1, backgroundColor: C.OVERLAY_4, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: rs(40), paddingVertical: rs(24),
  },
  modalCard: {
    width: '100%', maxWidth: rs(520), maxHeight: '90%',
    backgroundColor: C.BG_RAISED, borderRadius: rs(14),
    borderWidth: 1, borderColor: C.BORDER, overflow: 'hidden',
  },
  modalAccent: { height: rs(4), width: '100%' },
  modalClose: {
    position: 'absolute', top: rs(10), right: rs(10), zIndex: 5,
    padding: rs(6), borderRadius: rs(14), backgroundColor: C.OVERLAY_3,
  },
  modalScroll: { padding: rs(20), paddingTop: rs(16) },
  modalImageWrap: {
    width: '100%', height: rs(160), borderRadius: rs(10), overflow: 'hidden',
    backgroundColor: C.BG_MID, marginBottom: rs(14), alignItems: 'center', justifyContent: 'center',
  },
  modalImage: { width: '100%', height: '100%' },
  modalTitle: { fontSize: rf(18), fontWeight: '900', color: C.TEXT, letterSpacing: 0.5 },
  modalSubtitle: { fontSize: rf(12), fontWeight: '700', marginTop: rs(4), marginBottom: rs(14) },
  modalLore: { fontSize: rf(13), color: C.TEXT_SOFT, lineHeight: rf(20) },
});
