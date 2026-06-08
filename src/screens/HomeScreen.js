import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, Animated, Dimensions, Modal, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AudioManager from '../utils/AudioManager';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import useGameStore from '../store/gameStore';
import { HEROES, FACTIONS } from '../data/heroes';
import { CHAPTER_DEFS } from '../data/story';
import { QUEST_DEFS } from '../data/dailyQuests';
import { WEATHER_BACKGROUNDS } from '../data/backgrounds';
import { ASCENSION_ITEMS } from '../data/ascensionItems';
import WeatherEffect from '../components/WeatherEffect';
import { C, RANK } from '../theme/colors';
import { calcPlayerLevel } from '../utils/playerLevel';
import HeroCard from '../components/HeroCard';

const { width: W, height: H } = Dimensions.get('window');

// ── Sidebar grid constants ────────────────────────────────────────────────────
// SIDEBAR_W − PANEL_PAD×2 − SIDE_GAP = CELL_W×2  (exact fit, no fractional px)
const SIDEBAR_W  = 164;
const PANEL_PAD  = 12;

const ENEMY_THUMB  = require('../../assets/enemy/boss_001.webp');
const SUMMON_THUMB = require('../../assets/heroes/hero_002.webp');


const SIDE_MENU = [
  { key: 'heroes',  image: require('../../assets/currency/heroes.png'),   label: 'Heroes', a11yLabel: 'Heroes',             badge: false, accent: C.GOLD,          screen: 'Collection'  },
  { key: 'daily',   image: require('../../assets/currency/packs.png'),    label: 'Daily',  a11yLabel: 'Claim Daily Reward', badge: false, accent: C.CYAN,          screen: 'DailyReward' },
  { key: 'quests',  image: require('../../assets/home/quest.png'),        label: 'Quests', a11yLabel: 'Daily Quests',       badge: false, accent: C.SUCCESS,       screen: 'DailyQuests' },
  { key: 'team',    image: require('../../assets/home/team.png'),         label: 'Team',   a11yLabel: 'Build Team',         badge: false, accent: C.PRIMARY_LIGHT, screen: 'TeamBuild'   },
  { key: 'world',   image: require('../../assets/home/world-map.png'),    label: 'World',  a11yLabel: 'World Map',          badge: false, accent: C.SECONDARY,     screen: 'WorldMap'    },
  // { key: 'tower',   icon: 'layers-outline',                               label: 'Tower',  badge: false, accent: C.GOLD,          screen: 'Tower'       },
];

export default function HomeScreen({ navigation }) {
  const {
    gems, gold, lastClaimDate, dailyQuests, ownedHeroes, team, completedChapters, heroCollection,
    dailyStreak, playerProfile, isChapterCompleted, towerCurrentFloor, towerHighestFloor,
    pendingMilestoneReward, clearMilestoneReward, getDailyQuestProgress,
  } = useGameStore();

  const [milestoneVisible, setMilestoneVisible] = useState(false);
  const milestoneHero = pendingMilestoneReward?.hero ?? null;

  const { level: playerLevel, currentXP, nextLevelXP, progress } = useMemo(
    () => calcPlayerLevel({ completedChapters, ownedHeroes, heroCollection, dailyStreak }),
    [completedChapters, ownedHeroes, heroCollection, dailyStreak],
  );
  const xpCurrent = Math.round(progress * 100);
  const xpLabel   = `EXP  ${currentXP} / ${nextLevelXP}`;

  // Badge state — kept fresh via useFocusEffect so values update immediately
  // when the user returns from DailyRewardScreen or DailyQuestScreen.
  const [canClaim, setCanClaim]               = useState(false);
  const [hasClaimableQuests, setHasClaimableQuests] = useState(false);

  const refreshBadges = useCallback(() => {
    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setCanClaim(lastClaimDate !== todayStr);
    const { progress: qp, claimed: qc } = getDailyQuestProgress();
    setHasClaimableQuests(QUEST_DEFS.some(q => (qp[q.id] || 0) >= q.target && !qc[q.id]));
  }, [lastClaimDate, dailyQuests, getDailyQuestProgress]);

  // Refresh on every screen focus (covers return from Daily/Quest screens)
  useFocusEffect(useCallback(() => { refreshBadges(); }, [refreshBadges]));
  // Also sync when store state changes while this screen is already focused
  useEffect(() => { refreshBadges(); }, [refreshBadges]);

  const { bg: bgSource, weather } = useRef(
    WEATHER_BACKGROUNDS[Math.floor(Math.random() * WEATHER_BACKGROUNDS.length)]
  ).current;

  const teamHeroes  = useMemo(() => team.map((id) => HEROES.find((h) => h.id === id)).filter(Boolean), [team]);
  const displayHero = teamHeroes[0] || HEROES[0];

  // Profile-driven values — fall back to team hero if player hasn't customised
  const avatarHero   = playerProfile.avatarHeroId
    ? HEROES.find(h => h.id === playerProfile.avatarHeroId) ?? displayHero
    : displayHero;
  const activeFaction = playerProfile.favoriteFaction
    ? FACTIONS[playerProfile.favoriteFaction]
    : (displayHero ? FACTIONS[displayHero.faction] : null);
  const factionColor  = activeFaction?.color ?? C.PRIMARY;
  const playerName    = playerProfile.name || 'Commander';

  const completedChapterCount = useMemo(
    () => CHAPTER_DEFS.filter(ch => isChapterCompleted(ch.id)).length,
    [completedChapters, isChapterCompleted],
  );
  const storyProgress  = Math.round((completedChapterCount / CHAPTER_DEFS.length) * 100);
  const currentChapter = Math.min(completedChapterCount + 1, CHAPTER_DEFS.length);
  const chapterTitle   = CHAPTER_DEFS[currentChapter - 1]?.title ?? 'Completed';

  const panelData = useMemo(() => [
    {
      key: 'Story',
      tag: 'STORY',
      accent: C.PRIMARY,
      title: `Ch.${currentChapter} · ${chapterTitle}`,
      sub: `${storyProgress}% Complete`,
      thumb: displayHero?.image,
      progressRatio: storyProgress / 100,
      accessibilityLabel: 'Go to Story Mode',
      onPress: () => { AudioManager.playButtonSFX(); navigation.navigate('Story'); },
    },
    {
      key: 'Battle',
      tag: 'BATTLE',
      accent: C.DANGER,
      title: 'Quick Battle',
      sub: 'Practice Mode',
      thumb: ENEMY_THUMB,
      accessibilityLabel: 'Go to Quick Battle',
      onPress: () => {
        AudioManager.playButtonSFX();
        if (!team.length) {
          Alert.alert('No Team Selected', 'Add at least one hero to your team before battling.', [{ text: 'OK' }]);
          return;
        }
        navigation.navigate('Battle', { practiceMode: true });
      },
    },
    {
      key: 'Summon',
      tag: 'SUMMON',
      accent: C.CYAN,
      title: 'Recruit Heroes',
      sub: `${gems} Gems Ready`,
      thumb: SUMMON_THUMB,
      badge: true,
      accessibilityLabel: 'Go to Summon',
      onPress: () => { AudioManager.playButtonSFX(); navigation.navigate('Summon'); },
    },
    {
      key: 'Tower',
      tag: 'TOWER',
      accent: C.GOLD,
      title: 'Endless Tower',
      sub: `Floor ${towerCurrentFloor} · Best ${towerHighestFloor || '—'}`,
      thumb: require('../../assets/enemy/boss_010.webp'),
      accessibilityLabel: 'Go to Tower',
      onPress: () => { AudioManager.playButtonSFX(); navigation.navigate('Tower'); },
    },
  ], [currentChapter, chapterTitle, storyProgress, displayHero, gems, towerCurrentFloor, towerHighestFloor, navigation, team]);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(14)).current;

  // BGM — singleton persists across navigation, pauses when screen loses focus
  useFocusEffect(useCallback(() => {
    AudioManager.playHome();
    return () => AudioManager.pauseHome();
  }, []));

  // Show milestone modal whenever a pending reward is detected on focus
  useFocusEffect(useCallback(() => {
    if (pendingMilestoneReward) setMilestoneVisible(true);
  }, [pendingMilestoneReward]));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 550, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.root}>

      {/* ── Background ── */}
      <Image source={bgSource} style={[StyleSheet.absoluteFill, { width: '100%', height: H }]} resizeMode="cover" />

      {/* ── Cinematic vignettes ── */}
      <LinearGradient
        colors={['rgba(0,0,0,0.82)', 'rgba(0,0,0,0.2)', 'transparent']}
        style={styles.vigTop}
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.45)', 'rgba(0,0,0,0.9)']}
        style={styles.vigBottom}
      />
      <LinearGradient
        colors={['rgba(0,0,0,0.72)', 'rgba(0,0,0,0.18)', 'transparent']}
        start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
        style={styles.vigLeft}
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.28)', 'rgba(0,0,0,0.65)']}
        start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
        style={styles.vigRight}
      />

      {/* ── Weather particles ── */}
      <WeatherEffect type={weather} />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
        <Animated.View
          style={[styles.shell, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          {/* ══════════════ TOP HUD ══════════════ */}
          <View style={styles.topHud}>
            {/* Avatar + name + xp — tappable to open Profile */}
            <TouchableOpacity style={styles.playerBlock} onPress={() => { AudioManager.playButtonSFX(); navigation.navigate('Profile'); }} activeOpacity={0.8}>
              <View style={[styles.avatarFrame, { borderColor: factionColor }]}>
                {avatarHero?.image ? (
                  <Image source={avatarHero.image} style={styles.avatarImg} />
                ) : (
                  <Ionicons name="person" size={18} color="#fff" />
                )}
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.55)']}
                  style={styles.avatarOverlay}
                />
              </View>
              <View>
                <View style={styles.nameRow}>
                  <Text style={styles.playerName}>{playerName}</Text>
                  <View style={[styles.lvBadge, { backgroundColor: factionColor }]}>
                    <Text style={styles.lvText}>Lv.{playerLevel}</Text>
                  </View>
                </View>
                <View style={styles.xpOuter}>
                  <LinearGradient
                    colors={[factionColor, factionColor + 'AA']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={[styles.xpFill, { width: `${xpCurrent}%` }]}
                  />
                </View>
                <Text style={styles.xpLabel}>{xpLabel}</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.hudDivider} />

            {/* Currencies */}
            <View style={styles.currRow}>
              <CurrencyChip
                icon={require('../../assets/currency/gem.png')}
                value={gems}
                tint={C.PRIMARY_LIGHT}
              />
              <View style={styles.currSep} />
              <CurrencyChip
                icon={require('../../assets/currency/gold.png')}
                value={gold}
                tint={C.GOLD}
              />
              {/* <View style={styles.currSep} /> */}
              {/* <CurrencyChip
                icon={require('../../assets/currency/pack.png')}
                value={ownedHeroes.length}
                tint={C.SUCCESS}
              /> */}
            </View>

            <View style={{ flex: 1 }} />

            {/* Icon buttons */}
            <View style={styles.topIcons}>
              {/* <TouchableOpacity style={styles.topIconBtn}>
                <Ionicons name="notifications-outline" size={17} color="rgba(255,255,255,0.8)" />
                <View style={styles.notifDot} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.topIconBtn}>
                <Ionicons name="mail-outline" size={17} color="rgba(255,255,255,0.8)" />
              </TouchableOpacity> */}
              <TouchableOpacity style={styles.topIconBtn} onPress={() => { AudioManager.playButtonSFX(); navigation.navigate('Settings'); }} accessibilityLabel="Open Settings" accessibilityRole="button">
                <Ionicons name="settings-outline" size={17} color="rgba(255,255,255,0.8)" />
              </TouchableOpacity>
            </View>
          </View>

          {/* ══════════════ MAIN ROW ══════════════ */}
          <View style={styles.mainRow}>

            {/* ── Left sidebar ── */}
            <View style={styles.leftSidebar}>
              <View style={styles.sidePanel}>
                {/* <LinearGradient
                  colors={['rgba(8, 3, 22, 0.03)', 'rgba(255, 255, 255, 0.19)']}
                  style={StyleSheet.absoluteFill}
                /> */}
                {/* <View style={[StyleSheet.absoluteFill, styles.sidePanelBorder]} /> */}
                {SIDE_MENU.map(({ key: k, screen, ...item }) => (
                  <SideItem
                    key={k}
                    {...item}
                    badge={k === 'daily' ? canClaim : k === 'quests' ? hasClaimableQuests : item.badge}
                    onPress={screen ? () => { AudioManager.playButtonSFX(); navigation.navigate(screen); } : undefined}
                  />
                ))}
              </View>
            </View>

            {/* center spacer — background shows through */}
            <View style={styles.centerGap} />

            {/* ── Right action panels ── */}
            <View style={styles.rightPanels}>
              {panelData.map(({ key: k, ...p }) => (
                <ActionPanel key={k} {...p} />
              ))}
            </View>

          </View>

          {/* ── News ticker — inside SafeAreaView so home indicator doesn't overlap ── */}
          <View style={styles.ticker}>
            <View style={styles.tickerTag}>
              <Text style={styles.tickerTagText}>NEWS</Text>
            </View>
            <Text style={styles.tickerText} numberOfLines={1}>
              v1.0 Launch — Welcome to Aetheria: Legends Unbound! Complete story chapters to unlock heroes and earn rare rewards.
            </Text>
          </View>

        </Animated.View>
      </SafeAreaView>

      {/* ── Milestone reward modal ── */}
      <Modal
        visible={milestoneVisible}
        transparent
        animationType="fade"
        onRequestClose={() => { setMilestoneVisible(false); clearMilestoneReward(); }}
      >
        <View style={styles.msOverlay}>
          <View style={styles.msCard}>
            <LinearGradient
              colors={['#0E0525', '#1A0840']}
              style={StyleSheet.absoluteFill}
            />
            <View style={[styles.msAccent, { backgroundColor: C.GOLD }]} />

            <Text style={styles.msBadge}>MILESTONE REACHED</Text>
            <Text style={styles.msChapters}>
              {pendingMilestoneReward?.milestone ?? ''} CHAPTERS COMPLETE
            </Text>
            <Text style={styles.msSub}>Bonus hero added to your collection</Text>

            {/* Ascension material drop */}
            {pendingMilestoneReward?.ascensionDrop && (() => {
              const drop = pendingMilestoneReward.ascensionDrop;
              const item = ASCENSION_ITEMS.find(i => i.id === drop.itemId);
              if (!item) return null;
              return (
                <View style={styles.msAscRow}>
                  <Image source={item.image} style={styles.msAscImg} resizeMode="contain" />
                  <View style={styles.msAscInfo}>
                    <Text style={styles.msAscName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.msAscSub}>{item.rankLabel} · Ascension Material</Text>
                  </View>
                  <View style={styles.msAscQtyBadge}>
                    <Text style={styles.msAscQty}>×{drop.qty}</Text>
                  </View>
                </View>
              );
            })()}

            {milestoneHero && (
              <View style={styles.msHeroWrap}>
                <HeroCard hero={milestoneHero} width={styles.msHeroCard.width} compact />
                <View style={[
                  styles.msRankBadge,
                  { backgroundColor: RANK[milestoneHero.rank]?.bg ?? C.PRIMARY },
                ]}>
                  <Text style={[styles.msRankText, { color: RANK[milestoneHero.rank]?.text ?? '#fff' }]}>
                    {milestoneHero.rank}
                  </Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={styles.msBtn}
              activeOpacity={0.82}
              onPress={() => {
                AudioManager.playRewardClaimSFX();
                setMilestoneVisible(false);
                clearMilestoneReward();
              }}
            >
              <LinearGradient
                colors={C.GRAD_GOLD}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.msBtnInner}
              >
                <Text style={styles.msBtnText}>COLLECT  ✦</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─────────────────────────── Sub-components ────────────────────────────────

function CurrencyChip({ icon, value, tint }) {
  return (
    <TouchableOpacity
      style={styles.currChip}
      activeOpacity={0.8}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityLabel="Add currency"
      accessibilityRole="button"
    >
      <Image source={icon} style={styles.currIcon} resizeMode="contain" />
      <Text style={[styles.currVal, { color: tint }]}>{value.toLocaleString()}</Text>
      <View style={[styles.currAdd, { borderColor: tint + '60' }]}>
        <Ionicons name="add" size={9} color={tint} />
      </View>
    </TouchableOpacity>
  );
}

function SideItem({ icon, image, label, a11yLabel, badge, accent, onPress }) {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!badge) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 850, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 850, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [badge]);

  const ringScale = badge ? pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.9] }) : undefined;
  const ringOp    = badge ? pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0]   }) : undefined;
  const iconGlow  = badge ? pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.10, 0.38] }) : undefined;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.72} style={styles.sideItem} accessibilityLabel={a11yLabel || label} accessibilityRole="button">

      {/* Card face */}
      <View style={[styles.sideFace, { borderColor: accent + '45' }]}>
        <LinearGradient
          colors={['rgba(6,2,18,0.92)', 'rgba(10,4,24,0.84)']}
          style={StyleSheet.absoluteFill}
        />

        {/* Left accent stripe */}
        <View style={[styles.sideStripe, { backgroundColor: accent }]} />

        {/* Icon box */}
        <View style={[styles.sideIconWrap, { backgroundColor: accent + '20' }]}>
          {badge && (
            <Animated.View
              pointerEvents="none"
              style={[StyleSheet.absoluteFill, { borderRadius: 9, backgroundColor: accent, opacity: iconGlow }]}
            />
          )}
          {image
            ? <Image source={image} style={styles.sideIcon} resizeMode="contain" />
            : <Ionicons name={icon} size={20} color={accent} />
          }
        </View>

        {/* Label */}
        <Text style={styles.sideLabel} numberOfLines={1}>{label}</Text>

        {/* Chevron */}
        <Ionicons name="chevron-forward" size={11} color={accent + '70'} style={styles.sideChevron} />
      </View>

      {/* Badge dot + pulsing ring */}
      {badge && (
        <View style={styles.sideBadgeWrap}>
          <Animated.View
            style={[styles.sideBadgeRing, { borderColor: C.SECONDARY, transform: [{ scale: ringScale }], opacity: ringOp }]}
          />
          <View style={[styles.sideBadgeDot, { backgroundColor: C.SECONDARY }]} />
        </View>
      )}
    </TouchableOpacity>
  );
}

function ActionPanel({ tag, accent, title, sub, thumb, progressRatio, badge, onPress, accessibilityLabel: a11yLabel }) {
  return (
    <TouchableOpacity style={styles.panel} onPress={onPress} activeOpacity={0.82} accessibilityLabel={a11yLabel} accessibilityRole="button">
      {/* Dark glass fill */}
      <LinearGradient
        colors={['rgba(2,0,16,0.92)', 'rgba(6,3,22,0.82)']}
        style={styles.panelBg}
      />
      {/* Glowing border overlay */}
      <View style={[styles.panelBorder, { borderColor: accent + '55' }]} />

      {/* Row: [strip] [content] [thumb] — no absolute, no overlap */}
      <View style={[styles.panelStrip, { backgroundColor: accent }]} />

      <View style={styles.panelContent}>
        <View style={styles.panelTagRow}>
          <View style={[styles.panelTag, { backgroundColor: accent }]}>
            <Text style={styles.panelTagText}>{tag}</Text>
          </View>
          {badge && (
            <View style={styles.panelNewBadge}>
              <Text style={styles.panelNewText}>NEW</Text>
            </View>
          )}
        </View>
        <Text style={styles.panelTitle} numberOfLines={1}>{title}</Text>
        <Text style={styles.panelSub} numberOfLines={1}>{sub}</Text>
        {progressRatio !== undefined && (
          <View style={styles.panelProgBg}>
            <LinearGradient
              colors={[accent, accent + '88']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[styles.panelProgFill, { width: `${Math.min(progressRatio * 100, 100)}%` }]}
            />
          </View>
        )}
        {/* <View style={styles.panelEnterRow}>
          <Text style={[styles.panelEnterText, { color: accent }]}>ENTER</Text>
          <Ionicons name="chevron-forward" size={9} color={accent} />
        </View> */}
      </View>

      {/* Thumbnail — normal flex child, no overlap */}
      {thumb && (
        <View style={styles.panelThumbWrap}>
          <Image source={thumb} style={styles.panelThumb} resizeMode="cover" />
          <LinearGradient
            colors={['rgba(2,0,16,0.85)', 'transparent']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─────────────────────────── Styles ────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.BG_SCREEN },
  safe: { flex: 1 },
  shell: { flex: 1 },

  // Vignettes
  vigTop:    { position: 'absolute', top: 0,    left: 0, right: 0, height: H * 0.3  },
  vigBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: H * 0.42 },
  vigLeft:   { position: 'absolute', top: 0, bottom: 0, left: 0,  width:  W * 0.18  },
  vigRight:  { position: 'absolute', top: 0, bottom: 0, right: 0, width:  W * 0.3   },

  // ── Top HUD ──────────────────────────────────
  topHud: {
    height: 52,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, gap: 10,
    // backgroundColor: 'rgba(0,0,0,0.55)',
    // borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)',
  },

  playerBlock: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatarFrame: {
    width: 36, height: 36, borderRadius: 8,
    borderWidth: 2, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(40,18,80,0.9)',
  },
  avatarImg:     { width: '100%', height: '100%', resizeMode: 'cover' },
  avatarOverlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },

  nameRow:    { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 3 },
  playerName: { fontSize: 11, fontWeight: '800', color: '#fff', letterSpacing: 0.8 },
  lvBadge:    { borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  lvText:     { fontSize: 10, color: '#fff', fontWeight: '900', letterSpacing: 0.5 },

  xpOuter: {
    width: 88, height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2, overflow: 'hidden',
  },
  xpFill:  { height: 3, borderRadius: 2 },
  xpLabel: { fontSize: 10, color: 'rgba(255,255,255,0.38)', marginTop: 2, letterSpacing: 0.3 },

  hudDivider: {
    width: 1, height: 28,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 2,
  },

  currRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  currChip: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  currIcon: { width: 20, height: 20 },
  currVal:  { fontSize: 13, fontWeight: '800', minWidth: 26 },
  currAdd: {
    width: 15, height: 15, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  currSep: { width: 1, height: 18, backgroundColor: 'rgba(255,255,255,0.1)' },

  topIcons: { flexDirection: 'row', gap: 5 },
  topIconBtn: {
    width: 30, height: 30, borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    position: 'relative',
  },
  notifDot: {
    position: 'absolute', top: 4, right: 4,
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: C.SECONDARY, borderWidth: 1, borderColor: C.BG_SCREEN,
  },

  // ── Main row ──────────────────────────────────
  mainRow: { flex: 1, flexDirection: 'row' },

  // ── Left sidebar ──────────────────────────────────
  leftSidebar: {
    width: SIDEBAR_W,
    justifyContent: 'center',
    paddingVertical: 14,    // top + bottom breathing room
    // no paddingHorizontal — panel padding handles inset
  },

  // Glass panel — vertical list
  sidePanel: {
    borderRadius: 14,
    overflow: 'hidden',
    padding: PANEL_PAD,
    flexDirection: 'column',
    gap: 7,
    position: 'relative',
  },
  sidePanelBorder: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },

  // Full-width row item
  sideItem: {
    width: '100%',
    height: 50,
    position: 'relative',
  },

  // Card face — horizontal flex
  sideFace: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.40,
    shadowRadius: 4,
    elevation: 4,
  },

  // Left accent stripe
  sideStripe: {
    width: 3,
    alignSelf: 'stretch',
  },

  // Icon container
  sideIconWrap: {
    width: 34, height: 34,
    borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  sideIcon: { width: 22, height: 22 },

  // Label
  sideLabel: {
    flex: 1,
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.88)',
    letterSpacing: 0.5,
    marginLeft: 8,
  },

  sideChevron: { marginRight: 10 },

  // Badge — floats outside top-right corner
  sideBadgeWrap: {
    position: 'absolute',
    top: -4, right: -4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideBadgeRing: {
    position: 'absolute',
    width: 13, height: 13,
    borderRadius: 7, borderWidth: 1.5,
  },
  sideBadgeDot: {
    width: 10, height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: C.BG_SCREEN,
  },

  // Center spacer
  centerGap: { flex: 1 },

  // Right panels
  rightPanels: { width: 272, paddingVertical: 8, paddingRight: 8, gap: 7 },

  panel: {
    flex: 1, borderRadius: 10, overflow: 'hidden',
    flexDirection: 'row', position: 'relative',
  },
  panelBg: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
  },
  panelBorder: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
    borderRadius: 10, borderWidth: 1,
  },
  panelStrip: { width: 4, alignSelf: 'stretch' },
  panelThumbWrap: { width: 86, position: 'relative', overflow: 'hidden' },
  panelThumb: { width: '100%', height: '100%', },

  panelContent: { flex: 1, paddingVertical: 9, paddingLeft: 8, paddingRight: 6 },
  panelTagRow:  { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  panelTag:     { borderRadius: 3, paddingHorizontal: 6, paddingVertical: 2 },
  panelTagText: { fontSize: 10, color: '#fff', fontWeight: '900', letterSpacing: 1.5 },
  panelNewBadge: {
    backgroundColor: C.SECONDARY, borderRadius: 3,
    paddingHorizontal: 5, paddingVertical: 1,
  },
  panelNewText:  { fontSize: 10, color: '#fff', fontWeight: '900', letterSpacing: 1 },
  panelTitle: {
    fontSize: 12, color: '#fff', fontWeight: '800', letterSpacing: 0.3,
    textShadowColor: 'rgba(0,0,0,0.7)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2,
  },
  panelSub:    { fontSize: 9, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  panelProgBg: {
    height: 2, backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 1, marginTop: 5, overflow: 'hidden', width: '82%',
  },
  panelProgFill: { height: 2, borderRadius: 1 },
  panelEnterRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 4 },
  panelEnterText:{ fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },

  // ── News ticker ──────────────────────────────
  ticker: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.82)',
    borderTopWidth: 1, borderTopColor: C.PRIMARY_GLOW,
  },
  tickerTag: {
    backgroundColor: C.PRIMARY, borderRadius: 3,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  tickerTagText: { fontSize: 10, color: '#fff', fontWeight: '900', letterSpacing: 1.5 },
  tickerText:    { fontSize: 9, color: 'rgba(255,255,255,0.42)', flex: 1, letterSpacing: 0.3 },

  // ── Milestone modal ───────────────────────────────────────────────────────
  msOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  msCard: {
    width: Math.min(W * 0.55, 400),
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.GOLD + '66',
    padding: 20,
    alignItems: 'center',
    shadowColor: C.GOLD,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 14,
  },
  msAccent: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
  },
  msBadge: {
    fontSize: 10, fontWeight: '900', color: C.GOLD,
    letterSpacing: 3, marginBottom: 4, marginTop: 4,
  },
  msChapters: {
    fontSize: 18, fontWeight: '900', color: '#fff',
    letterSpacing: 2, textAlign: 'center', marginBottom: 4,
  },
  msSub: {
    fontSize: 10, color: C.TEXT_MUTED, marginBottom: 14,
    letterSpacing: 0.5, fontStyle: 'italic',
  },
  msHeroWrap: {
    position: 'relative',
    marginBottom: 16,
  },
  msHeroCard: { width: 120 },
  msRankBadge: {
    position: 'absolute', top: 6, right: -8,
    borderRadius: 5, paddingHorizontal: 7, paddingVertical: 3,
    shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 4, elevation: 6,
  },
  msRankText: { fontSize: 12, fontWeight: '900' },
  msAscRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 8, borderWidth: 1, borderColor: C.GOLD + '40', backgroundColor: C.GOLD + '0C', paddingHorizontal: 10, paddingVertical: 8, width: '100%', marginBottom: 10 },
  msAscImg:      { width: 36, height: 36 },
  msAscInfo:     { flex: 1 },
  msAscName:     { fontSize: 11, fontWeight: '800', color: C.GOLD, letterSpacing: 0.3 },
  msAscSub:      { fontSize: 9, color: C.TEXT_MUTED, marginTop: 1 },
  msAscQtyBadge: { borderRadius: 6, borderWidth: 1, borderColor: C.GOLD + '55', backgroundColor: C.GOLD + '22', paddingHorizontal: 8, paddingVertical: 4 },
  msAscQty:      { fontSize: 13, fontWeight: '900', color: C.GOLD },
  msBtn: { borderRadius: 10, overflow: 'hidden', width: '100%' },
  msBtnInner: {
    paddingVertical: 13, alignItems: 'center',
  },
  msBtnText: {
    fontSize: 14, fontWeight: '900', color: '#fff', letterSpacing: 2,
  },
});
