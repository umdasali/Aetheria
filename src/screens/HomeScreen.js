import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Image, Animated, Dimensions, Modal, useWindowDimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AudioManager from '../utils/AudioManager';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import useGameStore from '../store/gameStore';
import { HEROES, FACTIONS } from '../data/heroes';
import { getAvatarImage } from '../data/avatars';
import { CHAPTER_DEFS } from '../data/story';
import { QUEST_DEFS } from '../data/dailyQuests';
import { ACHIEVEMENT_DEFS } from '../data/achievements';
import { WEATHER_BACKGROUNDS } from '../data/backgrounds';
import { ASCENSION_ITEMS } from '../data/ascensionItems';
import WeatherEffect from '../components/WeatherEffect';
import { C, RANK } from '../theme/colors';
import { calcPlayerLevel } from '../utils/playerLevel';
import HeroCard from '../components/HeroCard';
import { rs, rf } from '../theme/scale';

const { width: W, height: H } = Dimensions.get('window');

// ── Sidebar grid constants ────────────────────────────────────────────────────
// 2-column grid: CELL_W = (SIDEBAR_W − PANEL_PAD×2 − GAP) / 2
const SIDEBAR_W  = 164;
const PANEL_PAD  = 12;

const SUMMON_THUMB = require('../../assets/heroes/hero_002.webp');


const SIDE_MENU = [
  { key: 'heroes',  image: require('../../assets/currency/heroes.webp'),   label: 'Heroes', a11yLabel: 'Heroes',             badge: false, accent: C.GOLD,          screen: 'Collection'  },
  { key: 'daily',   image: require('../../assets/currency/packs.png'),    label: 'Daily',  a11yLabel: 'Claim Daily Reward', badge: false, accent: C.CYAN,          screen: 'DailyReward' },
  { key: 'quests',  image: require('../../assets/home/quest.png'),        label: 'Quests', a11yLabel: 'Daily Quests',       badge: false, accent: C.SUCCESS,       screen: 'DailyQuests' },
  { key: 'team',    image: require('../../assets/home/team.png'),         label: 'Team',   a11yLabel: 'Build Team',         badge: false, accent: C.PRIMARY_LIGHT, screen: 'TeamBuild'   },
  { key: 'world',        image: require('../../assets/home/world-map.png'),  label: 'World',    a11yLabel: 'World Map',        badge: false, accent: C.SECONDARY,     screen: 'WorldMap'     },
  { key: 'events',       image: require('../../assets/home/events.png'),       label: 'Events',   a11yLabel: 'Limited Events',   badge: false, accent: C.GOLD,          screen: 'Events'       },
  { key: 'achievements', image: require('../../assets/home/achieve.png'),      label: 'Achieve',  a11yLabel: 'Achievements',     badge: false, accent: C.PRIMARY_LIGHT, screen: 'Achievements' },
  { key: 'rankings',     image: require('../../assets/home/ranking.png'),      label: 'Rankings', a11yLabel: 'Leaderboards',     badge: false, accent: C.CYAN,          screen: 'Leaderboard'  },
];

export default function HomeScreen({ navigation }) {
  const { width: screenW } = useWindowDimensions();

  // Per-property selectors — the screen only re-renders when a value it reads changes
  const gems                      = useGameStore(s => s.gems);
  const gold                      = useGameStore(s => s.gold);
  const lastClaimDate             = useGameStore(s => s.lastClaimDate);
  const dailyQuests               = useGameStore(s => s.dailyQuests);
  const ownedHeroes               = useGameStore(s => s.ownedHeroes);
  const team                      = useGameStore(s => s.team);
  const completedChapters         = useGameStore(s => s.completedChapters);
  const heroCollection            = useGameStore(s => s.heroCollection);
  const dailyStreak               = useGameStore(s => s.dailyStreak);
  const playerProfile             = useGameStore(s => s.playerProfile);
  const isChapterCompleted        = useGameStore(s => s.isChapterCompleted);
  const towerCurrentFloor         = useGameStore(s => s.towerCurrentFloor);
  const towerHighestFloor         = useGameStore(s => s.towerHighestFloor);
  const pendingMilestoneRewards   = useGameStore(s => s.pendingMilestoneRewards);
  const clearMilestoneReward      = useGameStore(s => s.clearMilestoneReward);
  const getDailyQuestProgress     = useGameStore(s => s.getDailyQuestProgress);
  const achievements              = useGameStore(s => s.achievements);
  const pendingAchievementUnlocks = useGameStore(s => s.pendingAchievementUnlocks);
  const clearAchievementUnlocks   = useGameStore(s => s.clearAchievementUnlocks);

  const [milestoneVisible, setMilestoneVisible] = useState(false);
  // Show the head of the queue — clearMilestoneReward shifts it off, revealing
  // the next one (if any) rather than ever overwriting/losing an unclaimed reward.
  const pendingMilestoneReward = pendingMilestoneRewards?.[0] ?? null;
  const milestoneHero = pendingMilestoneReward?.hero ?? null;

  const [achieveVisible, setAchieveVisible] = useState(false);
  const unlockedDefs = useMemo(
    () => pendingAchievementUnlocks
      .map(id => ACHIEVEMENT_DEFS.find(d => d.id === id))
      .filter(Boolean),
    [pendingAchievementUnlocks],
  );

  const { level: playerLevel, currentXP, nextLevelXP, progress } = useMemo(
    () => calcPlayerLevel({ completedChapters, ownedHeroes, heroCollection, dailyStreak }),
    [completedChapters, ownedHeroes, heroCollection, dailyStreak],
  );
  const xpCurrent = Math.round(progress * 100);
  const xpLabel   = `EXP  ${currentXP} / ${nextLevelXP}`;

  // Badge state — daily/quests require manual refresh on focus.
  // Achievements are derived directly via useMemo so they react instantly to store changes.
  const [canClaim, setCanClaim]               = useState(false);
  const [hasClaimableQuests, setHasClaimableQuests] = useState(false);

  const hasClaimableAchievements = useMemo(
    () => ACHIEVEMENT_DEFS.some(d => {
      const a = achievements[d.id];
      return (a?.progress ?? 0) >= d.target && !a?.claimed;
    }),
    [achievements],
  );

  // Stable handler so memoized SideItems don't re-render when HomeScreen does
  const handleSideNavigate = useCallback((screen) => {
    AudioManager.playButtonSFX();
    navigation.navigate(screen);
  }, [navigation]);

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

  const avatarImage = getAvatarImage(playerProfile.avatarId);
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
    {
      key: 'Dungeons',
      tag: 'DUNGEON',
      accent: C.SUCCESS,
      title: 'Resource Dungeons',
      sub: 'Daily gold & materials',
      thumb: require('../../assets/currency/chest.png'),
      accessibilityLabel: 'Go to Resource Dungeons',
      onPress: () => { AudioManager.playButtonSFX(); navigation.navigate('Dungeons'); },
    },
  ], [currentChapter, chapterTitle, storyProgress, displayHero, gems, towerCurrentFloor, towerHighestFloor, navigation, team]);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(14)).current;

  // BGM — singleton persists across navigation, pauses when screen loses focus
  useFocusEffect(useCallback(() => {
    AudioManager.playHome();
    return () => AudioManager.pauseHome();
  }, []));

  // Show milestone modal whenever the queue has an unclaimed reward — a plain
  // effect (not useFocusEffect) so collecting one while already on Home
  // immediately reveals the next queued reward instead of waiting for a refocus.
  useEffect(() => {
    if (pendingMilestoneReward) setMilestoneVisible(true);
  }, [pendingMilestoneReward]);

  // Show achievement unlock toast whenever new achievements are queued
  useFocusEffect(useCallback(() => {
    if (pendingAchievementUnlocks.length > 0) setAchieveVisible(true);
  }, [pendingAchievementUnlocks]));

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
        colors={[C.OVERLAY_MODAL, C.OVERLAY_1, 'transparent']}
        style={styles.vigTop}
      />
      <LinearGradient
        colors={['transparent', C.OVERLAY_MID, C.TEXT_SHADOW]}
        style={styles.vigBottom}
      />
      <LinearGradient
        colors={[C.OVERLAY_STRONG, C.SHADOW + '2E', 'transparent']}
        start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
        style={styles.vigLeft}
      />
      <LinearGradient
        colors={['transparent', C.OVERLAY_1, C.SHADOW + 'A6']}
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
                <Image source={avatarImage} style={styles.avatarImg} />
                <LinearGradient
                  colors={['transparent', C.OVERLAY_3]}
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
                onPress={() => { AudioManager.playButtonSFX(); navigation.navigate('Shop'); }}
              />
              <View style={styles.currSep} />
              <CurrencyChip
                icon={require('../../assets/currency/gold.png')}
                value={gold}
                tint={C.GOLD}
                onPress={() => { AudioManager.playButtonSFX(); navigation.navigate('Shop'); }}
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
                <Ionicons name="notifications-outline" size={rs(17)} color={C.ICON_ON_DARK} />
                <View style={styles.notifDot} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.topIconBtn}>
                <Ionicons name="mail-outline" size={rs(17)} color={C.ICON_ON_DARK} />
              </TouchableOpacity> */}
              <TouchableOpacity style={styles.topIconBtn} onPress={() => { AudioManager.playButtonSFX(); navigation.navigate('Shop'); }} accessibilityLabel="Open Shop" accessibilityRole="button">
                <Ionicons name="storefront" size={rs(17)} color={C.GOLD} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.topIconBtn} onPress={() => { AudioManager.playButtonSFX(); navigation.navigate('Settings'); }} accessibilityLabel="Open Settings" accessibilityRole="button">
                <Ionicons name="settings-outline" size={rs(17)} color={C.ICON_ON_DARK} />
              </TouchableOpacity>
            </View>
          </View>

          {/* ══════════════ MAIN ROW ══════════════ */}
          <View style={styles.mainRow}>

            {/* ── Left sidebar ── */}
            <View style={styles.leftSidebar}>
              <View style={styles.sidePanel}>
                {/* <LinearGradient
                  colors={[C.BG_SCREEN + '08', C.GLASS_EDGE]}
                  style={StyleSheet.absoluteFill}
                /> */}
                {/* <View style={[StyleSheet.absoluteFill, styles.sidePanelBorder]} /> */}
                {SIDE_MENU.map(({ key: k, screen, ...item }) => (
                  <SideItem
                    key={k}
                    {...item}
                    badge={k === 'daily' ? canClaim : k === 'quests' ? hasClaimableQuests : k === 'achievements' ? hasClaimableAchievements : item.badge}
                    screen={screen}
                    onNavigate={handleSideNavigate}
                  />
                ))}
              </View>
            </View>

            {/* small spacer between sidebar and the tile grid */}
            <View style={styles.centerGap} />

            {/* ── Right action panels — 2-column tile grid (no scroll) ── */}
            <View style={[styles.rightPanels, { width: (screenW - SIDEBAR_W - 16) / 2 }]}>
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

      {/* ── Achievement unlock modal ── */}
      <Modal
        visible={achieveVisible && unlockedDefs.length > 0}
        transparent
        animationType="fade"
        onRequestClose={() => { setAchieveVisible(false); clearAchievementUnlocks(); }}
      >
        <View style={styles.msOverlay}>
          <View style={styles.achCard}>
            <LinearGradient colors={[C.BG_MID, C.BG_DEEP]} style={StyleSheet.absoluteFill} />
            {/* Purple top accent bar */}
            <View style={[styles.msAccent, { backgroundColor: C.PRIMARY_LIGHT }]} />

            {/* Header row */}
            <View style={styles.achHeader}>
              <View style={styles.achIconCircle}>
                <Ionicons name="ribbon" size={rs(22)} color={C.PRIMARY_LIGHT} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.achBadge}>
                  {unlockedDefs.length === 1 ? 'ACHIEVEMENT UNLOCKED' : `${unlockedDefs.length} ACHIEVEMENTS UNLOCKED`}
                </Text>
                <Text style={styles.achSubtitle}>Visit Achievements to claim your rewards</Text>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.achDivider} />

            {/* Achievement list — scrollable if many */}
            <ScrollView
              style={styles.achList}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ gap: rs(8) }}
            >
              {unlockedDefs.map(def => (
                <View key={def.id} style={styles.achRow}>
                  <LinearGradient
                    colors={[C.PRIMARY + '18', C.PRIMARY + '08']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.achRowIcon}>
                    <Ionicons name={def.icon ?? 'trophy-outline'} size={rs(18)} color={C.PRIMARY_LIGHT} />
                  </View>
                  <View style={styles.achRowInfo}>
                    <Text style={styles.achRowTitle}>{def.title}</Text>
                    <Text style={styles.achRowDesc} numberOfLines={1}>{def.desc}</Text>
                  </View>
                  {(def.reward?.gems > 0 || def.reward?.gold > 0) && (
                    <View style={styles.achRowReward}>
                      {def.reward.gems > 0 && (
                        <Text style={styles.achRowGems}>+{def.reward.gems} 💎</Text>
                      )}
                      {def.reward.gold > 0 && (
                        <Text style={styles.achRowGold}>+{def.reward.gold} 🪙</Text>
                      )}
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>

            {/* Action row */}
            <View style={styles.achActions}>
              <TouchableOpacity
                style={styles.achBtnClose}
                activeOpacity={0.75}
                onPress={() => { setAchieveVisible(false); clearAchievementUnlocks(); }}
              >
                <Text style={styles.achBtnCloseTxt}>CLOSE</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.achBtnView}
                activeOpacity={0.82}
                onPress={() => {
                  setAchieveVisible(false);
                  clearAchievementUnlocks();
                  navigation.navigate('Achievements');
                }}
              >
                <LinearGradient
                  colors={C.GRAD_PINK}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.achBtnViewInner}
                >
                  <Ionicons name="ribbon-outline" size={rs(13)} color={C.TEXT} />
                  <Text style={styles.achBtnViewTxt}>VIEW ACHIEVEMENTS</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
              colors={C.GRAD_PANEL}
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
                  <Text style={[styles.msRankText, { color: RANK[milestoneHero.rank]?.text ?? C.TEXT }]}>
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

function CurrencyChip({ icon, value, tint, onPress }) {
  return (
    <TouchableOpacity
      style={styles.currChip}
      activeOpacity={0.8}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      onPress={onPress}
      disabled={!onPress}
      accessibilityLabel="Open shop"
      accessibilityRole="button"
    >
      <Image source={icon} style={styles.currIcon} resizeMode="contain" />
      <Text style={[styles.currVal, { color: tint }]}>{value.toLocaleString()}</Text>
      <View style={[styles.currAdd, { borderColor: tint + '60' }]}>
        <Ionicons name="add" size={rs(9)} color={tint} />
      </View>
    </TouchableOpacity>
  );
}

const SideItem = memo(function SideItem({ icon, image, label, a11yLabel, badge, accent, screen, onNavigate }) {
  const onPress = screen ? () => onNavigate(screen) : undefined;
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

      {/* Card face — vertical compact */}
      <View style={[styles.sideFace, { borderColor: accent + '45' }]}>
        <LinearGradient
          colors={[C.BG_SCREEN + 'EB', C.BG_DARK + 'D6']}
          style={StyleSheet.absoluteFill}
        />
        {/* Top accent line */}
        <View style={[styles.sideTopLine, { backgroundColor: accent }]} />

        {/* Icon box */}
        <View style={[styles.sideIconWrap, { backgroundColor: accent + '20' }]}>
          {badge && (
            <Animated.View
              pointerEvents="none"
              style={[StyleSheet.absoluteFill, { borderRadius: rs(8), backgroundColor: accent, opacity: iconGlow }]}
            />
          )}
          {image
            ? <Image source={image} style={styles.sideIcon} resizeMode="contain" />
            : <Ionicons name={icon} size={rs(22)} color={accent} />
          }
        </View>

        {/* Label */}
        <Text style={[styles.sideLabel, { color: accent }]} numberOfLines={1}>{label}</Text>
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
});

function ActionPanel({ tag, accent, title, sub, thumb, progressRatio, badge, onPress, accessibilityLabel: a11yLabel }) {
  return (
    <TouchableOpacity style={styles.panel} onPress={onPress} activeOpacity={0.82} accessibilityLabel={a11yLabel} accessibilityRole="button">
      {/* Dark glass fill */}
      <LinearGradient
        colors={[C.BG_VOID + 'EB', C.BG_SCREEN + 'D1']}
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
          <Ionicons name="chevron-forward" size={rs(9)} color={accent} />
        </View> */}
      </View>

      {/* Thumbnail — normal flex child, no overlap */}
      {thumb && (
        <View style={styles.panelThumbWrap}>
          <Image source={thumb} style={styles.panelThumb} resizeMode="cover" />
          <LinearGradient
            colors={[C.BG_VOID + 'D9', 'transparent']}
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
    height: rs(62),
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: rs(20), gap: rs(10),
    // backgroundColor: 'rgba(0,0,0,0.55)',
    // borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)',
  },

  playerBlock: { flexDirection: 'row', alignItems: 'center', gap: rs(18) },
  avatarFrame: {
    width: rs(46), height: rs(46), borderRadius: rs(8),
    borderWidth: 2, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.BG_MID,
  },
  avatarImg:     { width: '100%', height: '100%', resizeMode: 'cover' },
  avatarOverlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },

  nameRow:    { flexDirection: 'row', alignItems: 'center', gap: rs(5), marginBottom: rs(3) },
  playerName: { fontSize: rf(13), fontWeight: '800', color: C.TEXT, letterSpacing: 0.8 },
  lvBadge:    { borderRadius: 4, paddingHorizontal: rs(5), paddingVertical: 1 },
  lvText:     { fontSize: rf(11), color: C.TEXT, fontWeight: '900', letterSpacing: 0.5 },

  xpOuter: {
    width: rs(88), height: rs(3),
    backgroundColor: C.GLASS_6,
    borderRadius: 2, overflow: 'hidden',
  },
  xpFill:  { height: rs(3), borderRadius: 2 },
  xpLabel: { fontSize: rf(10), color: C.TEXT_ON_DARK_WEAK, marginTop: rs(2), letterSpacing: 0.3 },

  hudDivider: {
    width: 1, height: rs(28),
    backgroundColor: C.GLASS_6,
    marginHorizontal: rs(2),
  },

  currRow: { flexDirection: 'row', alignItems: 'center', gap: rs(6) },
  currChip: { flexDirection: 'row', alignItems: 'center', gap: rs(5), minHeight: rs(30), paddingVertical: rs(5) },
  currIcon: { width: rs(20), height: rs(20) },
  currVal:  { fontSize: rf(15), fontWeight: '800', minWidth: rs(26) },
  currAdd: {
    width: rs(15), height: rs(15), borderRadius: rs(8),
    backgroundColor: C.GLASS_5,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  currSep: { width: 1, height: rs(18), backgroundColor: C.GLASS_6 },

  topIcons: { flexDirection: 'row', gap: rs(5) },
  topIconBtn: {
    width: rs(30), height: rs(30), borderRadius: rs(7),
    backgroundColor: C.GLASS_4,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.GLASS_6,
    position: 'relative',
  },
  notifDot: {
    position: 'absolute', top: 4, right: 4,
    width: rs(6), height: rs(6), borderRadius: rs(3),
    backgroundColor: C.SECONDARY, borderWidth: 1, borderColor: C.BG_SCREEN,
  },

  // ── Main row ──────────────────────────────────
  mainRow: { flex: 1, flexDirection: 'row' },

  // ── Left sidebar ──────────────────────────────────
  leftSidebar: {
    width: SIDEBAR_W,
    justifyContent: 'center',
    paddingVertical: rs(8),
  },

  // Glass panel — 2-column compact grid
  sidePanel: {
    borderRadius: rs(14),
    overflow: 'hidden',
    padding: rs(PANEL_PAD),
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: rs(7),
    position: 'relative',
  },
  sidePanelBorder: {
    borderRadius: rs(14),
    borderWidth: 1,
    borderColor: C.GLASS_6,
  },

  // 2-column grid cell — width fills exactly half minus gap
  sideItem: {
    width: (SIDEBAR_W - PANEL_PAD * 2 - 6) / 2,
    height: rs(65),
    position: 'relative',
  },

  // Card face — vertical compact
  sideFace: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: rs(10),
    overflow: 'hidden',
    borderWidth: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(4),
    paddingVertical: rs(6),
    shadowColor: C.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.40,
    shadowRadius: 4,
    elevation: 4,
  },

  // Top accent line (replaces left stripe)
  sideTopLine: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 2, borderTopLeftRadius: rs(10), borderTopRightRadius: rs(10),
  },

  // Icon container
  sideIconWrap: {
    width: rs(34), height: rs(34),
    borderRadius: rs(9),
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  sideIcon: { width: rs(22), height: rs(22) },

  // Label
  sideLabel: {
    fontSize: rf(11),
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center',
  },

  // Badge — floats outside top-right corner
  sideBadgeWrap: {
    position: 'absolute',
    top: -4, right: -4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideBadgeRing: {
    position: 'absolute',
    width: rs(13), height: rs(13),
    borderRadius: rs(7), borderWidth: 1.5,
  },
  sideBadgeDot: {
    width: rs(10), height: rs(10),
    borderRadius: rs(5),
    borderWidth: 1.5,
    borderColor: C.BG_SCREEN,
  },

  centerGap: { flex: 1 },

  rightPanels: {
    paddingVertical: rs(8), paddingRight: rs(8),
    flexDirection: 'column', gap: rs(8),
  },

  panel: {
    flex: 1, borderRadius: rs(10), overflow: 'hidden',
    flexDirection: 'row', position: 'relative',
  },
  panelBg: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
  },
  panelBorder: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
    borderRadius: rs(10), borderWidth: 1,
  },
  panelStrip: { width: 4, alignSelf: 'stretch' },
  panelThumbWrap: { width: rs(100), position: 'relative', overflow: 'hidden' },
  panelThumb: { width: '100%', height: '100%', },

  panelContent: { flex: 1, paddingVertical: rs(6), paddingLeft: rs(8), paddingRight: rs(6) },
  panelTagRow:  { flexDirection: 'row', alignItems: 'center', gap: rs(5), marginBottom: rs(4) },
  panelTag:     { borderRadius: 3, paddingHorizontal: rs(6), paddingVertical: rs(2) },
  panelTagText: { fontSize: rf(11), color: C.TEXT, fontWeight: '900', letterSpacing: 1.5 },
  panelNewBadge: {
    backgroundColor: C.SECONDARY, borderRadius: 3,
    paddingHorizontal: rs(5), paddingVertical: 1,
  },
  panelNewText:  { fontSize: rf(11), color: C.TEXT, fontWeight: '900', letterSpacing: 1 },
  panelTitle: {
    fontSize: rf(14), color: C.TEXT, fontWeight: '800', letterSpacing: 0.3,
    textShadowColor: C.OVERLAY_STRONG, textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2,
  },
  panelSub:    { fontSize: rf(11), color: C.TEXT_ON_DARK_SOFT, marginTop: rs(2) },
  panelProgBg: {
    height: 2, backgroundColor: C.GLASS_7,
    borderRadius: 1, marginTop: rs(5), overflow: 'hidden', width: '82%',
  },
  panelProgFill: { height: 2, borderRadius: 1 },
  panelEnterRow: { flexDirection: 'row', alignItems: 'center', gap: rs(2), marginTop: rs(4) },
  panelEnterText:{ fontSize: rf(10), fontWeight: '900', letterSpacing: 1.2 },

  // ── News ticker ──────────────────────────────
  ticker: {
    flexDirection: 'row', alignItems: 'center', gap: rs(8),
    paddingHorizontal: rs(10), paddingVertical: rs(4),
    backgroundColor: C.OVERLAY_MODAL,
    borderTopWidth: 1, borderTopColor: C.PRIMARY_GLOW,
  },
  tickerTag: {
    backgroundColor: C.PRIMARY, borderRadius: 3,
    paddingHorizontal: rs(6), paddingVertical: rs(2),
  },
  tickerTagText: { fontSize: rf(10), color: C.TEXT, fontWeight: '900', letterSpacing: 1.5 },
  tickerText:    { fontSize: rf(9), color: C.TEXT_ON_DARK_MUTED, flex: 1, letterSpacing: 0.3 },

  // ── Milestone modal ───────────────────────────────────────────────────────
  msOverlay: {
    flex: 1,
    backgroundColor: C.SHADOW + 'BF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  msCard: {
    width: Math.min(W * 0.55, 400),
    borderRadius: rs(16),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.GOLD + '66',
    padding: rs(20),
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
    fontSize: rf(10), fontWeight: '900', color: C.GOLD,
    letterSpacing: 3, marginBottom: rs(4), marginTop: rs(4),
  },
  msChapters: {
    fontSize: rf(18), fontWeight: '900', color: C.TEXT,
    letterSpacing: 2, textAlign: 'center', marginBottom: rs(4),
  },
  msSub: {
    fontSize: rf(10), color: C.TEXT_MUTED, marginBottom: rs(14),
    letterSpacing: 0.5, fontStyle: 'italic',
  },
  msHeroWrap: {
    position: 'relative',
    marginBottom: rs(16),
  },
  msHeroCard: { width: rs(120) },
  msRankBadge: {
    position: 'absolute', top: 6, right: -8,
    borderRadius: rs(5), paddingHorizontal: rs(7), paddingVertical: rs(3),
    shadowColor: C.SHADOW, shadowOpacity: 0.5, shadowRadius: 4, elevation: 6,
  },
  msRankText: { fontSize: rf(12), fontWeight: '900' },
  msAscRow:      { flexDirection: 'row', alignItems: 'center', gap: rs(10), borderRadius: rs(8), borderWidth: 1, borderColor: C.GOLD + '40', backgroundColor: C.GOLD + '0C', paddingHorizontal: rs(10), paddingVertical: rs(8), width: '100%', marginBottom: rs(10) },
  msAscImg:      { width: rs(36), height: rs(36) },
  msAscInfo:     { flex: 1 },
  msAscName:     { fontSize: rf(11), fontWeight: '800', color: C.GOLD, letterSpacing: 0.3 },
  msAscSub:      { fontSize: rf(9), color: C.TEXT_MUTED, marginTop: 1 },
  msAscQtyBadge: { borderRadius: rs(6), borderWidth: 1, borderColor: C.GOLD + '55', backgroundColor: C.GOLD + '22', paddingHorizontal: rs(8), paddingVertical: rs(4) },
  msAscQty:      { fontSize: rf(13), fontWeight: '900', color: C.GOLD },
  msBtn: { borderRadius: rs(10), overflow: 'hidden', width: '100%' },
  msBtnInner: {
    paddingVertical: rs(13), alignItems: 'center',
  },
  msBtnText: {
    fontSize: rf(14), fontWeight: '900', color: C.TEXT, letterSpacing: 2,
  },

  // ── Achievement unlock modal ──────────────────────────────────────────────
  achCard: {
    width: Math.min(W * 0.56, 440),
    maxHeight: H * 0.82,
    borderRadius: rs(16),
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: C.PRIMARY_LIGHT + '44',
    shadowColor: C.PRIMARY,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 14,
  },
  achHeader: {
    flexDirection: 'row', alignItems: 'center', gap: rs(12),
    paddingHorizontal: rs(18), paddingTop: rs(18), paddingBottom: rs(14),
  },
  achIconCircle: {
    width: rs(42), height: rs(42), borderRadius: rs(21),
    backgroundColor: C.PRIMARY + '28',
    borderWidth: 1.5, borderColor: C.PRIMARY_LIGHT + '55',
    alignItems: 'center', justifyContent: 'center',
  },
  achBadge: {
    fontSize: rf(11), fontWeight: '900', color: C.PRIMARY_LIGHT,
    letterSpacing: 2.5, marginBottom: rs(3),
  },
  achSubtitle: {
    fontSize: rf(9), color: C.TEXT_MUTED, fontStyle: 'italic',
  },
  achDivider: {
    height: 1, backgroundColor: C.PRIMARY + '33',
    marginHorizontal: rs(18), marginBottom: rs(4),
  },
  achList: {
    maxHeight: H * 0.44,
    paddingHorizontal: rs(18),
    paddingVertical: rs(12),
  },
  achRow: {
    flexDirection: 'row', alignItems: 'center', gap: rs(10),
    borderRadius: rs(10), overflow: 'hidden',
    borderWidth: 1, borderColor: C.PRIMARY + '28',
    paddingHorizontal: rs(12), paddingVertical: rs(10),
  },
  achRowIcon: {
    width: rs(34), height: rs(34), borderRadius: rs(10),
    backgroundColor: C.PRIMARY + '22',
    borderWidth: 1, borderColor: C.PRIMARY_LIGHT + '40',
    alignItems: 'center', justifyContent: 'center',
  },
  achRowInfo: { flex: 1, gap: rs(3) },
  achRowTitle: { fontSize: rf(11), fontWeight: '800', color: C.TEXT, letterSpacing: 0.3 },
  achRowDesc:  { fontSize: rf(9),  fontWeight: '500', color: C.TEXT_MUTED },
  achRowReward: { alignItems: 'flex-end', gap: rs(3) },
  achRowGems: { fontSize: rf(10), fontWeight: '800', color: C.PRIMARY_LIGHT },
  achRowGold: { fontSize: rf(10), fontWeight: '800', color: C.GOLD },
  achActions: {
    flexDirection: 'row', alignItems: 'center', gap: rs(8),
    paddingHorizontal: rs(18), paddingTop: rs(10), paddingBottom: rs(18),
  },
  achBtnClose: {
    paddingHorizontal: rs(18), paddingVertical: rs(12),
    borderRadius: rs(10), borderWidth: 1, borderColor: C.BORDER,
    alignItems: 'center', justifyContent: 'center',
  },
  achBtnCloseTxt: {
    fontSize: rf(11), fontWeight: '800', color: C.TEXT_MUTED, letterSpacing: 1,
  },
  achBtnView: { flex: 1, borderRadius: rs(10), overflow: 'hidden' },
  achBtnViewInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: rs(7), paddingVertical: rs(12),
  },
  achBtnViewTxt: {
    fontSize: rf(11), fontWeight: '900', color: C.TEXT, letterSpacing: 1.5,
  },
});
