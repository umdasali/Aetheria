import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Image, Animated, Dimensions, Modal, useWindowDimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AudioManager from '../utils/AudioManager';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
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
import CornerBrackets from '../components/ui/CornerBrackets';
import { rs, rf } from '../theme/scale';

const { width: W, height: H } = Dimensions.get('window');

// ── Left menu list constants ──────────────────────────────────────────────────
const SIDEBAR_W  = 176;
const SIDE_GAP   = 8;

const SUMMON_THUMB = require('../../assets/heroes/hero_002.webp');

// Secondary hub actions — vertical list on the left. Heroes/Team/World/Codex
// live in the bottom tab bar instead, and Daily Reward is a top-HUD icon.
const SIDE_MENU = [
  { key: 'events',       image: require('../../assets/home/events.png'),  label: 'Events',   sub: 'New rewards!',  a11yLabel: 'Limited Events',   badge: false, accent: C.GOLD,          screen: 'Events'       },
  { key: 'quests',       image: require('../../assets/home/quest.png'),   label: 'Quests',   sub: 'Daily tasks',   a11yLabel: 'Daily Quests',      badge: false, accent: C.SUCCESS,       screen: 'DailyQuests'  },
  { key: 'achievements', image: require('../../assets/home/achieve.png'), label: 'Achieve',  sub: 'Claim rewards', a11yLabel: 'Achievements',      badge: false, accent: C.PRIMARY_LIGHT, screen: 'Achievements' },
  { key: 'rankings',     image: require('../../assets/home/ranking.png'), label: 'Rankings', sub: 'Top players',   a11yLabel: 'Leaderboards',      badge: false, accent: C.CYAN,          screen: 'Leaderboard'  },
];

// Persistent-look bottom bar — pushes into the existing Stack (not a real
// react-navigation tab bar), so there's no cross-screen "active tab" state.
const BOTTOM_TABS = [
  { key: 'heroes', image: require('../../assets/home/heroes.png'),    label: 'Heroes', screen: 'Collection' },
  { key: 'team',   image: require('../../assets/home/team.png'),      label: 'Team',   screen: 'TeamBuild'  },
  { key: 'world',  image: require('../../assets/home/world-map.png'), label: 'World',  screen: 'WorldMap'   },
  { key: 'codex',  image: require('../../assets/home/codex.png'),     label: 'Codex',  screen: 'Codex', badgeKey: 'codex' },
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
  const pendingCodexUnlocks       = useGameStore(s => s.pendingCodexUnlocks);

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

  // Codex unlocks are surfaced only as a badge on the bottom tab (see BOTTOM_TABS
  // below) — cleared when the player actually opens the Codex screen — rather
  // than an interrupting modal.

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

      <View style={styles.safe}>
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
                <View style={[styles.avatarLvBadge, { backgroundColor: factionColor }]}>
                  <Text style={styles.avatarLvBadgeText}>{playerLevel}</Text>
                </View>
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
              <CurrencyChip
                icon={require('../../assets/currency/gold.png')}
                value={gold}
                tint={C.GOLD}
                onPress={() => { AudioManager.playButtonSFX(); navigation.navigate('Shop'); }}
              />
            </View>

            <View style={{ flex: 1 }} />

            {/* Icon buttons */}
            <View style={styles.topIcons}>
              <TouchableOpacity style={styles.topIconBtn} onPress={() => { AudioManager.playButtonSFX(); navigation.navigate('DailyReward'); }} accessibilityLabel="Open Daily Rewards" accessibilityRole="button">
                <Ionicons name="calendar" size={rs(17)} color={C.ICON_ON_DARK} />
                {canClaim && <View style={styles.notifDot} />}
              </TouchableOpacity>
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
                {SIDE_MENU.map(({ key: k, screen, ...item }) => (
                  <SideItem
                    key={k}
                    {...item}
                    badge={k === 'quests' ? hasClaimableQuests : k === 'achievements' ? hasClaimableAchievements : item.badge}
                    screen={screen}
                    onNavigate={handleSideNavigate}
                  />
                ))}
              </View>
            </View>

            {/* small spacer between sidebar and the card stack */}
            <View style={styles.centerGap} />

            {/* ── Right action panels — single-column cinematic card stack ── */}
            <View style={[styles.rightPanels, { width: (screenW - SIDEBAR_W - 16) / 2 }]}>
              {panelData.map(({ key: k, ...p }) => (
                <ActionPanel key={k} {...p} />
              ))}
            </View>

          </View>

          {/* ── Bottom tab bar — pushes into the existing Stack, not a real tab navigator.
              No tab is drawn "active": Home isn't literally any of these 4 screens. ── */}
          <View style={styles.bottomBar}>
            <LinearGradient
              colors={[C.BG_DARK + 'CC', C.BG_VOID + 'CC']}
              style={StyleSheet.absoluteFill}
            />
            <CornerBrackets color={C.SOVEREIGN_GOLD} size={rs(12)} thickness={1.5} inset={-1} opacity={0.55} />
            {BOTTOM_TABS.flatMap(({ key: k, ...t }, i) => [
              <BottomTab
                key={k}
                {...t}
                badge={t.badgeKey === 'codex' ? pendingCodexUnlocks.length > 0 : false}
                onNavigate={handleSideNavigate}
              />,
              i < BOTTOM_TABS.length - 1 && <View key={`div-${k}`} style={styles.bottomTabDivider} />,
            ]).filter(Boolean)}
          </View>

        </Animated.View>
      </View>

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

const SideItem = memo(function SideItem({ icon, image, label, sub, a11yLabel, badge, accent, screen, onNavigate }) {
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

      {/* Card face — horizontal row */}
      <View style={[styles.sideFace, { borderColor: accent + '45' }]}>
        <LinearGradient
          colors={[C.BG_SCREEN + 'EB', C.BG_DARK + 'D6']}
          style={StyleSheet.absoluteFill}
        />
        {/* Left accent strip */}
        <View style={[styles.sideStrip, { backgroundColor: accent }]} />

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
            : <Ionicons name={icon} size={rs(18)} color={accent} />
          }
        </View>

        {/* Label + subtitle */}
        <View style={styles.sideTextCol}>
          <Text style={[styles.sideLabel, { color: accent }]} numberOfLines={1}>{label}</Text>
          {!!sub && <Text style={styles.sideSub} numberOfLines={1}>{sub}</Text>}
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
      </View>
    </TouchableOpacity>
  );
});

// Simple floating particle effect for the tab bar — small dots rise and fade,
// looping forever, spread across the whole tab.
const TAB_PARTICLES = [
  { delay: 0,    left: '20%', duration: 2200 },
  { delay: 500,  left: '50%', duration: 1900 },
  { delay: 1000, left: '80%', duration: 2400 },
];

function TabParticle({ delay, left, duration }) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(t, { toValue: 1, duration, useNativeDriver: true }),
        Animated.timing(t, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => { loop.stop(); t.stopAnimation(); };
  }, []);

  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [0, -rs(36)] });
  const opacity     = t.interpolate({ inputRange: [0, 0.15, 0.8, 1], outputRange: [0, 1, 0.7, 0] });

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.tabParticle, { left, opacity, transform: [{ translateY }] }]}
    />
  );
}

// Soft pulsing purple illumination rendered behind the tab icon.
function TabIconGlow() {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => { loop.stop(); pulse.stopAnimation(); };
  }, []);

  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.75] });
  const scale   = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.15] });

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.tabIconGlow, { opacity, transform: [{ scale }] }]}
    />
  );
}

const BottomTab = memo(function BottomTab({ image, label, badge, screen, onNavigate }) {
  return (
    <TouchableOpacity
      onPress={() => onNavigate(screen)}
      activeOpacity={0.6}
      style={styles.bottomTab}
      accessibilityLabel={label}
      accessibilityRole="button"
    >
      {TAB_PARTICLES.map((p, i) => <TabParticle key={i} {...p} />)}
      <View style={styles.bottomTabIconWrap}>
        <TabIconGlow />
        <Image source={image} style={styles.bottomTabIcon} resizeMode="contain" />
        {badge && (
          <View style={styles.bottomTabBadge}>
            <Text style={styles.bottomTabBadgeText}>!</Text>
          </View>
        )}
      </View>
      <Text style={styles.bottomTabLabel} numberOfLines={1}>{label}</Text>
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
  safe: { flex: 1,  },
  shell: { flex: 1, paddingHorizontal: rs(20), gap: rs(4) },

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
  },

  playerBlock: { flexDirection: 'row', alignItems: 'center', gap: rs(18) },
  avatarFrame: {
    width: rs(50), height: rs(50), borderRadius: rs(25),
    borderWidth: 2, overflow: 'visible',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.BG_MID,
  },
  avatarImg:     { width: '100%', height: '100%', borderRadius: rs(23), resizeMode: 'cover' },
  avatarOverlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, borderRadius: rs(23) },
  avatarLvBadge: {
    position: 'absolute', bottom: -rs(3), right: -rs(3),
    minWidth: rs(18), height: rs(18), borderRadius: rs(9),
    paddingHorizontal: rs(3),
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: C.BG_SCREEN,
  },
  avatarLvBadgeText: { fontSize: rf(9), color: C.TEXT, fontWeight: '900' },

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

  currRow: { flexDirection: 'row', alignItems: 'center', gap: rs(8) },
  currChip: {
    flexDirection: 'row', alignItems: 'center', gap: rs(5),
    height: rs(30), paddingLeft: rs(6), paddingRight: rs(6), borderRadius: rs(15),
    backgroundColor: C.GLASS_4, borderWidth: 1, borderColor: C.GLASS_6,
  },
  currIcon: { width: rs(20), height: rs(20) },
  currVal:  { fontSize: rf(15), fontWeight: '800', minWidth: rs(26) },
  currAdd: {
    width: rs(15), height: rs(15), borderRadius: rs(8),
    backgroundColor: C.GLASS_5,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },

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

  // ── Left sidebar — vertical action list ────────────
  leftSidebar: {
    width: SIDEBAR_W,
    justifyContent: 'center',
    paddingVertical: rs(8),
  },

  sidePanel: {
    flexDirection: 'column',
    gap: rs(SIDE_GAP),
  },

  sideItem: {
    width: '100%',
    height: rs(56),
  },

  // Card face — horizontal row: [strip][icon][label+sub][badge]
  sideFace: {
    flex: 1,
    borderRadius: rs(10),
    overflow: 'hidden',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(9),
    paddingHorizontal: rs(10),
    shadowColor: C.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.40,
    shadowRadius: 4,
    elevation: 4,
  },

  // Left accent strip
  sideStrip: { width: 3, alignSelf: 'stretch', borderRadius: 2 },

  // Icon container
  sideIconWrap: {
    width: rs(34), height: rs(34),
    borderRadius: rs(8),
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  sideIcon: { width: rs(26), height: rs(26) },

  sideTextCol: { flex: 1 },
  sideLabel: {
    fontSize: rf(12),
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  sideSub: {
    fontSize: rf(9),
    fontWeight: '500',
    color: C.TEXT_ON_DARK_MUTED,
    marginTop: 1,
  },

  // Badge — sits at the row's right edge
  sideBadgeWrap: {
    width: rs(13), height: rs(13),
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
  panelThumbWrap: { width: rs(116), position: 'relative', overflow: 'hidden' },
  panelThumb: { width: '100%', height: '100%', },

  panelContent: { flex: 1, justifyContent: 'center', paddingVertical: rs(5), paddingLeft: rs(8), paddingRight: rs(6) },
  panelTagRow:  { flexDirection: 'row', alignItems: 'center', gap: rs(5), marginBottom: rs(3) },
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
  panelSub:    { fontSize: rf(11), color: C.TEXT_ON_DARK_SOFT, marginTop: rs(1) },
  panelProgBg: {
    height: 2, backgroundColor: C.GLASS_7,
    borderRadius: 1, marginTop: rs(4), overflow: 'hidden', width: '82%',
  },
  panelProgFill: { height: 2, borderRadius: 1 },

  // ── Bottom tab bar — flat tactical panel, plain icons, gold hairline frame ──
  bottomBar: {
    flexDirection: 'row',
    paddingVertical: rs(8),
    position: 'relative',
    borderWidth: 1, borderColor: C.SOVEREIGN_GOLD + '40',
    borderRadius: rs(4),
    marginHorizontal: rs(1),
  },
  bottomTab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(6),
    paddingVertical: rs(2),
  },
  bottomTabDivider: {
    width: 1, height: rs(22), alignSelf: 'center',
    backgroundColor: C.BORDER_STRONG,
    transform: [{ rotate: '18deg' }],
  },
  bottomTabIconWrap: { position: 'relative' },
  bottomTabIcon: { width: rs(46), height: rs(40) },
  tabIconGlow: {
    position: 'absolute',
    top: '50%', left: '50%',
    width: rs(50), height: rs(50), borderRadius: rs(25),
    marginTop: -rs(25), marginLeft: -rs(25),
    backgroundColor: C.PRIMARY_GLOW,
    shadowColor: C.PRIMARY_LIGHT,
    shadowOpacity: 0.9,
    shadowRadius: rs(14),
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  tabParticle: {
    position: 'absolute',
    bottom: 0,
    width: rs(3), height: rs(3), borderRadius: rs(2),
    marginLeft: -rs(2),
    backgroundColor: C.SOVEREIGN_GOLD,
  },
  bottomTabBadge: {
    position: 'absolute', top: -rs(6), right: -rs(8),
    minWidth: rs(13), height: rs(13), borderRadius: rs(7),
    paddingHorizontal: rs(1),
    backgroundColor: C.DANGER, borderWidth: 1, borderColor: C.BG_SCREEN,
    alignItems: 'center', justifyContent: 'center',
  },
  bottomTabBadgeText: { fontSize: rf(9), color: C.TEXT, fontWeight: '900', lineHeight: rf(11) },
  bottomTabLabel: {
    fontSize: rf(10), fontWeight: '700', color: C.TEXT_ON_DARK_MUTED, letterSpacing: 0.6,
    textTransform: 'uppercase',
  },

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
