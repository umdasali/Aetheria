import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Image, Animated, Dimensions, Easing, useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AudioManager from '../utils/AudioManager';
import { C } from '../theme/colors';
import { getHeroById } from '../data/heroes';
import { RANK } from '../theme/colors';
import { FACTIONS } from '../data/heroes';
import { STAGE_ORDER, getStageById, isStageUnlocked, stageGoldReward } from '../data/story';
import { TOWER_MAX_FLOOR } from '../data/towerData';
import { ASCENSION_ITEMS } from '../data/ascensionItems';
import { ENEMY_GROUPS } from '../data/enemies';
import useGameStore from '../store/gameStore';
import { calcPlayerLevel, calcLevelFromXP } from '../utils/playerLevel';
import { rs, rf } from '../theme/scale';

const { width: W, height: H } = Dimensions.get('window');
const GEM_IMG  = require('../../assets/currency/gem.png');
const GOLD_IMG = require('../../assets/currency/gold.png');
const COIN_IMG = require('../../assets/currency/coin.png');
const VICTORY_IMG = require('../../assets/battlefield-bg/victory.png');
const DEFEAT_IMG  = require('../../assets/battlefield-bg/defeat.png');

// ─── Particle ────────────────────────────────────────────────────────────────
function Particle({ color, delay, duration, x, size }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);
  const ty      = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -(H * 0.7)] });
  const opacity = anim.interpolate({ inputRange: [0, 0.07, 0.76, 1], outputRange: [0, 0.85, 0.35, 0] });
  return (
    <Animated.View style={{
      position: 'absolute', left: x, bottom: 10,
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: color, opacity, transform: [{ translateY: ty }],
    }} />
  );
}

// ─── VictoryScreen ────────────────────────────────────────────────────────────
export default function VictoryScreen({ navigation, route }) {
  const {
    battleResult, stageId, rewards, enemyGroup, fromStory,
    practiceMode, wasReplay, practiceGotBonus, xpGained = 0,
    towerMode = false, towerFloor = 0, towerRewards = null, towerAscensionDrop = null,
    dungeonMode = false, dungeonRewards = null,
  } = route.params || {};
  const completedChapters = useGameStore(s => s.completedChapters);
  const ownedHeroes       = useGameStore(s => s.ownedHeroes);
  const heroCollection    = useGameStore(s => s.heroCollection);
  const dailyStreak       = useGameStore(s => s.dailyStreak);

  const { width: W, height: H } = useWindowDimensions();

  const isWin     = battleResult === 'win';
  const accentClr = isWin ? C.GOLD : C.DANGER;

  // Tower mode: override rewards
  const part       = stageId ? stageId % 10 : 0;
  const chapterNum = stageId ? Math.floor(stageId / 100) : 0;
  const goldReward = towerMode
    ? (towerRewards?.gold ?? 0)
    : dungeonMode
    ? (dungeonRewards?.gold ?? 0)
    : (isWin && stageId ? stageGoldReward(part) : 0);
  const actualGems = towerMode
    ? (towerRewards?.gems ?? 0)
    : dungeonMode
    ? (dungeonRewards?.gems ?? 0)
    : (isWin && !wasReplay ? (rewards?.gems ?? 0) : 0);
  const heroObj    = (!wasReplay && rewards?.heroId) ? getHeroById(rewards.heroId) : null;
  const hero       = heroObj?.rank !== 'S' ? heroObj : null;
  // Ascension material to show: tower boss drop, or a dungeon's fixed material reward.
  const materialDrop = towerAscensionDrop || (dungeonMode ? (dungeonRewards?.material ?? null) : null);

  // XP - compute both before and after states precisely
  const afterState  = calcPlayerLevel({ completedChapters, ownedHeroes, heroCollection, dailyStreak });
  const beforeState = calcLevelFromXP(afterState.totalXP - xpGained);
  const leveledUp   = isWin && xpGained > 0 && afterState.level > beforeState.level;

  // Animated values
  const screenFade   = useRef(new Animated.Value(0)).current;
  const iconScale    = useRef(new Animated.Value(0.4)).current;
  const iconFade     = useRef(new Animated.Value(0)).current;
  const glowPulse    = useRef(new Animated.Value(0.25)).current;
  const titleSlide   = useRef(new Animated.Value(-36)).current;
  const titleFade    = useRef(new Animated.Value(0)).current;
  const rewardSlide  = useRef(new Animated.Value(28)).current;
  const rewardFade   = useRef(new Animated.Value(0)).current;
  const btnFade      = useRef(new Animated.Value(0)).current;

  // XP bar - starts at beforeState.progress (exact "before" position)
  const xpBarAnim    = useRef(new Animated.Value(beforeState.progress)).current;
  const xpCountAnim  = useRef(new Animated.Value(beforeState.currentXP)).current;
  const xpBadgeScale = useRef(new Animated.Value(0)).current;
  const xpBadgeFade  = useRef(new Animated.Value(0)).current;
  const shimmerAnim  = useRef(new Animated.Value(-1)).current;
  const levelUpScale = useRef(new Animated.Value(0.4)).current;
  const levelUpFade  = useRef(new Animated.Value(0)).current;
  const xpFlash      = useRef(new Animated.Value(0)).current;
  const glowLoopRef  = useRef(null);
  const xpTimersRef  = useRef([]);          // pending XP-sequence timeouts
  const xpCleanupRef = useRef(() => {});    // removes listener + stops shimmer
  const [displayXP,  setDisplayXP] = useState(beforeState.currentXP);
  // Track width measured at layout - lets the XP bar animate as a native-driven
  // left-anchored scaleX instead of a JS-thread width animation
  const [xpTrackW,   setXpTrackW]  = useState(0);

  // Next stage
  const nextStage = (() => {
    if (!isWin || !stageId) return null;
    const idx = STAGE_ORDER.indexOf(stageId);
    if (idx < 0 || idx >= STAGE_ORDER.length - 1) return null;
    return getStageById(STAGE_ORDER[idx + 1]);
  })();
  const canGoNext = fromStory && nextStage && isStageUnlocked(nextStage.id, completedChapters);

  useEffect(() => {
    if (isWin) AudioManager.playVictorySFX();
    else AudioManager.playDefeatSFX();
  }, []);

  useEffect(() => {
    // Screen entrance sequence
    Animated.sequence([
      Animated.timing(screenFade, { toValue: 1, duration: 520, useNativeDriver: true }),
      Animated.parallel([
        Animated.spring(iconScale, { toValue: 1, friction: 4, tension: 85, useNativeDriver: true }),
        Animated.timing(iconFade,  { toValue: 1, duration: 420, useNativeDriver: true }),
      ]),
      Animated.delay(120),
      Animated.parallel([
        Animated.timing(titleSlide, { toValue: 0, duration: 340, useNativeDriver: true }),
        Animated.timing(titleFade,  { toValue: 1, duration: 340, useNativeDriver: true }),
      ]),
      Animated.delay(180),
      Animated.parallel([
        Animated.timing(rewardSlide, { toValue: 0, duration: 380, useNativeDriver: true }),
        Animated.timing(rewardFade,  { toValue: 1, duration: 380, useNativeDriver: true }),
      ]),
      Animated.delay(120),
      Animated.timing(btnFade, { toValue: 1, duration: 360, useNativeDriver: true }),
    ]).start();

    // Icon glow loop - reference stored so cleanup can stop it on unmount
    glowLoopRef.current = Animated.loop(Animated.sequence([
      Animated.timing(glowPulse, { toValue: 0.75, duration: 1300, useNativeDriver: true }),
      Animated.timing(glowPulse, { toValue: 0.20, duration: 1300, useNativeDriver: true }),
    ]));
    glowLoopRef.current.start();

    // XP sequence - fires after rewards have faded in
    if (isWin && xpGained > 0) {
      const listenerId = xpCountAnim.addListener(({ value }) => setDisplayXP(Math.round(value)));

      // Shimmer loops while bar is animating
      const shimmerLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, { toValue: 2,  duration: 900, useNativeDriver: true }),
          Animated.timing(shimmerAnim, { toValue: -1, duration: 0,   useNativeDriver: true }),
        ])
      );
      xpCleanupRef.current = () => {
        shimmerLoop.stop();
        xpCountAnim.removeListener(listenerId);
      };

      xpTimersRef.current.push(setTimeout(() => {
        // +XP badge springs in
        Animated.parallel([
          Animated.spring(xpBadgeScale, { toValue: 1, friction: 5, tension: 130, useNativeDriver: true }),
          Animated.timing(xpBadgeFade,  { toValue: 1, duration: 200, useNativeDriver: true }),
        ]).start();

        shimmerLoop.start();

        if (leveledUp) {
          // Phase 1: fill from before → 100% of old level
          Animated.parallel([
            Animated.timing(xpBarAnim, {
              toValue: 1, duration: 700,
              easing: Easing.out(Easing.cubic), useNativeDriver: true,
            }),
            Animated.timing(xpCountAnim, {
              toValue: beforeState.nextLevelXP, duration: 700,
              easing: Easing.out(Easing.cubic), useNativeDriver: false,
            }),
          ]).start(() => {
            // Flash + level-up pop
            Animated.sequence([
              Animated.timing(xpFlash, { toValue: 0.6, duration: 70,  useNativeDriver: true }),
              Animated.timing(xpFlash, { toValue: 0,   duration: 500, useNativeDriver: true }),
            ]).start();
            Animated.parallel([
              Animated.spring(levelUpScale, { toValue: 1, friction: 4, tension: 110, useNativeDriver: true }),
              Animated.timing(levelUpFade,  { toValue: 1, duration: 250, useNativeDriver: true }),
            ]).start();

            // Phase 2: reset bar + counter to 0, then fill to new level progress
            xpTimersRef.current.push(setTimeout(() => {
              xpBarAnim.setValue(0);
              xpCountAnim.setValue(0);
              Animated.parallel([
                Animated.timing(xpBarAnim, {
                  toValue: afterState.progress, duration: 800,
                  easing: Easing.out(Easing.cubic), useNativeDriver: true,
                }),
                Animated.timing(xpCountAnim, {
                  toValue: afterState.currentXP, duration: 800,
                  easing: Easing.out(Easing.cubic), useNativeDriver: false,
                }),
              ]).start(() => xpCleanupRef.current());
            }, 350));
          });
        } else {
          // Simple: before → after within the same level
          Animated.parallel([
            Animated.timing(xpBarAnim, {
              toValue: afterState.progress, duration: 1100,
              easing: Easing.out(Easing.cubic), useNativeDriver: true,
            }),
            Animated.timing(xpCountAnim, {
              toValue: afterState.currentXP, duration: 1100,
              easing: Easing.out(Easing.cubic), useNativeDriver: false,
            }),
          ]).start(() => xpCleanupRef.current());
        }
      }, 1500));
    }
    return () => {
      glowLoopRef.current?.stop();
      xpTimersRef.current.forEach(clearTimeout);
      xpCleanupRef.current();
    };
  }, []);

  // Navigation
  const handleNextStage = () => {
    const grp = ENEMY_GROUPS.find(g => g.id === nextStage.enemyGroupId);
    navigation.replace('Narration', { stage: nextStage, enemyGroup: grp });
  };
  const handleRetry = () => {
    // Practice battles have no stage - relaunch the practice battle directly
    if (practiceMode) { navigation.replace('Battle', { practiceMode: true }); return; }
    const curStage = getStageById(stageId);
    if (curStage && enemyGroup) navigation.replace('Narration', { stage: curStage, enemyGroup, autoSkip: true });
    else navigation.navigate('Story');
  };
  const handleStoryMode  = () => navigation.navigate('Story');
  const handleHome       = () => navigation.navigate('Home');
  const handleNextFloor  = () => navigation.navigate('Tower');
  const handleBackTower  = () => navigation.navigate('Tower');
  const handleBackDungeon = () => navigation.navigate('Dungeons');

  const PARTS = Array.from({ length: 18 }, (_, i) => ({
    delay:    i * 240,
    duration: 2800 + (i % 5) * 320,
    x:        (W / 18) * i + 8,
    size:     2 + (i % 4) * 1.5,
  }));


  return (
    <Animated.View style={[S.root, { opacity: screenFade }]}>
      <LinearGradient colors={isWin ? C.GRAD_VICTORY : C.GRAD_DEFEAT} style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={[accentClr + '10', 'transparent', accentClr + '10']}
        start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
      {PARTS.map((p, i) => (
        <Particle key={i} color={accentClr + 'AA'} delay={p.delay} duration={p.duration} x={p.x} size={p.size} />
      ))}

      <View style={S.body}>

        {/* ── LEFT ─────────────────────────────────────── */}
        <View style={S.leftPanel}>
          <Animated.View style={[S.iconGlow, { backgroundColor: accentClr + '18', shadowColor: accentClr, opacity: glowPulse }]} />
          <Animated.View style={{ transform: [{ scale: iconScale }], opacity: iconFade }}>
            <Image source={isWin ? VICTORY_IMG : DEFEAT_IMG} style={S.resultIcon} resizeMode="contain" />
          </Animated.View>
          <Animated.View style={{ transform: [{ translateY: titleSlide }], opacity: titleFade, alignItems: 'center' }}>
            <Text style={[S.resultTitle, { color: accentClr }]}>{isWin ? 'VICTORY!' : 'DEFEATED!'}</Text>
            <Text style={S.resultSub}>{isWin ? 'Enemies vanquished. Glory earned.' : 'Regroup and try again.'}</Text>
            {stageId ? (
              <View style={[S.stagePill, { borderColor: accentClr + '40', backgroundColor: accentClr + '12' }]}>
                <Ionicons name="map-outline" size={rs(10)} color={accentClr} />
                <Text style={[S.stagePillTxt, { color: accentClr }]}>Chapter {chapterNum} · Part {part}</Text>
              </View>
            ) : null}
          </Animated.View>
        </View>

        {/* ── RIGHT ────────────────────────────────────── */}
        <View style={S.rightPanel}>

          {isWin ? (
            <>
              {/* Header */}
              <Animated.View style={[S.rewardsHeadRow, { opacity: rewardFade, transform: [{ translateY: rewardSlide }] }]}>
                <Text style={S.rewardsHeading}>REWARDS EARNED</Text>
                {wasReplay && (
                  <View style={S.modeBadge}>
                    <Ionicons name="refresh" size={rs(8)} color={C.TEXT_MUTED} />
                    <Text style={S.modeBadgeTxt}>REPLAY · GOLD ONLY</Text>
                  </View>
                )}
                {practiceMode && practiceGotBonus && (
                  <View style={[S.modeBadge, { borderColor: C.CYAN + '60', backgroundColor: C.CYAN + '12' }]}>
                    <Ionicons name="star" size={rs(8)} color={C.CYAN} />
                    <Text style={[S.modeBadgeTxt, { color: C.CYAN }]}>FIRST CLEAR BONUS</Text>
                  </View>
                )}
                {practiceMode && !practiceGotBonus && (
                  <View style={S.modeBadge}>
                    <Text style={S.modeBadgeTxt}>PRACTICE · BONUS CLAIMED</Text>
                  </View>
                )}
              </Animated.View>

              <View style={[S.divider, { backgroundColor: C.GOLD + '40' }]} />

              {/* Scrollable content */}
              <Animated.View style={{ flex: 1, opacity: rewardFade, transform: [{ translateY: rewardSlide }] }}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.scrollContent}>

                  {/* Currency chips - side by side */}
                  <View style={S.chipRow}>
                    {goldReward > 0 && (
                      <View style={[S.chip, { borderColor: C.GOLD + '50', backgroundColor: C.GOLD + '14' }]}>
                        <Image source={GOLD_IMG} style={S.chipImg} resizeMode="contain" />
                        <Text style={[S.chipAmt, { color: C.GOLD }]}>+{goldReward}</Text>
                        <Text style={S.chipLbl}>Gold</Text>
                      </View>
                    )}
                    {actualGems > 0 && (
                      <View style={[S.chip, { borderColor: C.PRIMARY_LIGHT + '50', backgroundColor: C.PRIMARY_GLOW }]}>
                        <Image source={GEM_IMG} style={S.chipImg} resizeMode="contain" />
                        <Text style={[S.chipAmt, { color: C.PRIMARY_LIGHT }]}>+{actualGems}</Text>
                        <Text style={S.chipLbl}>Gems</Text>
                      </View>
                    )}
                    {towerMode && (towerRewards?.coins ?? 0) > 0 && (
                      <View style={[S.chip, { borderColor: C.GOLD + '50', backgroundColor: C.GOLD + '10' }]}>
                        <Image source={COIN_IMG} style={S.chipImg} resizeMode="contain" />
                        <Text style={[S.chipAmt, { color: C.GOLD }]}>+{towerRewards.coins}</Text>
                        <Text style={S.chipLbl}>Coins</Text>
                      </View>
                    )}
                  </View>
                  {towerMode && (
                    <View style={S.towerPill}>
                      <Ionicons name="layers-outline" size={rs(15)} color={C.CYAN} />
                      <Text style={S.towerPillTxt}>
                        {towerFloor >= TOWER_MAX_FLOOR
                          ? `Floor ${towerFloor} Cleared  →  🏆 Tower Conquered!`
                          : `Floor ${towerFloor} Cleared  →  Floor ${towerFloor + 1} Unlocked`}
                      </Text>
                    </View>
                  )}

                  {/* Ascension material drop - boss floors only */}
                  {materialDrop && (() => {
                    const item = ASCENSION_ITEMS.find(i => i.id === materialDrop.itemId);
                    if (!item) return null;
                    return (
                      <View style={[S.ascDropRow, { borderColor: C.GOLD + '40', backgroundColor: C.GOLD + '0C' }]}>
                        <Image source={item.image} style={S.ascDropImg} resizeMode="contain" />
                        <View style={S.ascDropInfo}>
                          <Text style={S.ascDropName} numberOfLines={1}>{item.name}</Text>
                          <Text style={S.ascDropSub}>{item.rankLabel} · Ascension Material</Text>
                        </View>
                        <View style={[S.ascDropQtyBadge, { backgroundColor: C.GOLD + '22', borderColor: C.GOLD + '55' }]}>
                          <Text style={[S.ascDropQty, { color: C.GOLD }]}>×{materialDrop.qty}</Text>
                        </View>
                      </View>
                    );
                  })()}

                  {/* Hero reward - compact horizontal row */}
                  {hero && (() => {
                    const r = RANK[hero.rank];
                    const factionColor = FACTIONS[hero.faction]?.color ?? C.PRIMARY;
                    return (
                      <View style={[S.heroRow, { borderColor: factionColor + '40', backgroundColor: factionColor + '10' }]}>
                        {/* Portrait */}
                        <View style={[S.heroPortraitWrap, { borderColor: r.glow + '80' }]}>
                          <Image source={hero.image} style={S.heroPortrait} resizeMode="cover" />
                          <LinearGradient colors={['transparent', C.OVERLAY_3]} style={StyleSheet.absoluteFill} />
                        </View>
                        {/* Info */}
                        <View style={S.heroInfo}>
                          <View style={S.heroNameRow}>
                            <View style={[S.rankBadge, { backgroundColor: r.bg }]}>
                              <Text style={[S.rankTxt, { color: r.text }]}>{hero.rank}</Text>
                            </View>
                            <Text style={S.heroName} numberOfLines={1}>{hero.name}</Text>
                          </View>
                          <Text style={[S.heroFaction, { color: factionColor }]}>{hero.faction} · {hero.element}</Text>
                          <Text style={S.heroClass}>{hero.class}</Text>
                        </View>
                        {/* Unlock badge */}
                        <View style={[S.unlockBadge, { backgroundColor: C.PRIMARY + '22', borderColor: C.PRIMARY_LIGHT + '50' }]}>
                          <Ionicons name="star" size={rs(14)} color={C.PRIMARY_LIGHT} />
                          <Text style={S.unlockTxt}>UNLOCKED</Text>
                        </View>
                      </View>
                    );
                  })()}

                  {/* XP bar */}
                  {xpGained > 0 && (
                    <View style={S.xpSection}>
                      {/* Flash overlay */}
                      <Animated.View
                        pointerEvents="none"
                        style={[StyleSheet.absoluteFill, { backgroundColor: C.FLASH_WHITE, opacity: xpFlash, borderRadius: rs(10) }]}
                      />

                      {/* Header row */}
                      <View style={S.xpHeadRow}>
                        <Text style={S.xpHeading}>COMMANDER EXP</Text>
                        <View style={{ flex: 1 }} />
                        {leveledUp && (
                          <Animated.View style={[S.levelUpBadge, { opacity: levelUpFade, transform: [{ scale: levelUpScale }] }]}>
                            <Text style={S.levelUpTxt}>⬆ LEVEL UP!</Text>
                          </Animated.View>
                        )}
                        <Animated.View style={[S.xpGainBadge, { opacity: xpBadgeFade, transform: [{ scale: xpBadgeScale }] }]}>
                          <Ionicons name="trending-up" size={rs(14)} color={C.PRIMARY_LIGHT} />
                          <Text style={S.xpGainTxt}>+{xpGained} XP</Text>
                        </Animated.View>
                      </View>

                      {/* Bar + level bubble */}
                      <View style={S.xpBarRow}>
                        <View style={S.xpTrack} onLayout={e => setXpTrackW(e.nativeEvent.layout.width)}>
                          <Animated.View style={[S.xpGlow, {
                            width: '100%', opacity: xpTrackW ? 1 : 0,
                            transform: [
                              { translateX: -xpTrackW / 2 },
                              { scaleX: xpBarAnim },
                              { translateX: xpTrackW / 2 },
                            ],
                          }]} />
                          <Animated.View style={[S.xpFill, {
                            width: '100%', opacity: xpTrackW ? 1 : 0,
                            transform: [
                              { translateX: -xpTrackW / 2 },
                              { scaleX: xpBarAnim },
                              { translateX: xpTrackW / 2 },
                            ],
                          }]}>
                            <LinearGradient
                              colors={[C.PRIMARY_DARK, C.PRIMARY, C.PRIMARY_LIGHT]}
                              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                              style={StyleSheet.absoluteFill}
                            />
                            <Animated.View style={[S.xpShimmer, {
                              transform: [{ translateX: shimmerAnim.interpolate({ inputRange: [-1, 2], outputRange: [-40, 280] }) }],
                            }]} />
                          </Animated.View>
                        </View>
                        <View style={[S.lvBubble, leveledUp && { borderColor: C.GOLD + '80' }]}>
                          <Text style={S.lvLabel}>LV</Text>
                          <Text style={[S.lvNum, leveledUp && { color: C.GOLD }]}>{afterState.level}</Text>
                        </View>
                      </View>

                      <Text style={S.xpNums}>{displayXP} / {afterState.nextLevelXP} XP to next level</Text>
                    </View>
                  )}

                </ScrollView>
              </Animated.View>
            </>
          ) : (
            <Animated.View style={[S.defeatSection, { opacity: rewardFade, transform: [{ translateY: rewardSlide }] }]}>
              <Ionicons name="shield-outline" size={rs(36)} color={C.DANGER + '80'} />
              <Text style={S.defeatMsg}>Your heroes gave everything. Strengthen your team and return stronger.</Text>
            </Animated.View>
          )}

          {/* Action buttons */}
          <Animated.View style={[S.btnRow, { opacity: btnFade }]}>

            {dungeonMode ? (
              /* ── Resource Dungeon win / lose ───────────────────────────────── */
              isWin ? (
                <>
                  <TouchableOpacity style={S.primaryBtn} onPress={handleBackDungeon} activeOpacity={0.85}>
                    <LinearGradient colors={[C.PRIMARY_DARK, C.PRIMARY]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={S.btnInner}>
                      <Ionicons name="flash" size={rs(18)} color={C.TEXT} />
                      <Text style={S.primaryBtnTxt}>Keep Farming</Text>
                      <Ionicons name="chevron-forward" size={rs(18)} color={C.ICON_ON_DARK} />
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity style={S.secondaryBtn} onPress={handleHome} activeOpacity={0.85}>
                    <Ionicons name="home-outline" size={rs(18)} color={C.ICON_MUTED} />
                    <Text style={S.secondaryBtnTxt}>Home</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity style={S.retryBtn} onPress={handleBackDungeon} activeOpacity={0.85}>
                    <LinearGradient colors={[C.DANGER, C.DANGER_DARK]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={S.btnInner}>
                      <Ionicons name="refresh" size={rs(18)} color={C.TEXT} />
                      <Text style={S.primaryBtnTxt}>Try Again</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity style={S.secondaryBtn} onPress={handleHome} activeOpacity={0.85}>
                    <Ionicons name="home-outline" size={rs(18)} color={C.ICON_MUTED} />
                    <Text style={S.secondaryBtnTxt}>Home</Text>
                  </TouchableOpacity>
                </>
              )
            ) : towerMode ? (
              /* ── Tower win / lose ──────────────────────────────────────────── */
              isWin ? (
                <>
                  {/* Primary: Next Floor */}
                  <TouchableOpacity style={S.primaryBtn} onPress={handleNextFloor} activeOpacity={0.85}>
                    <LinearGradient colors={[C.GOLD_DARK, C.GOLD]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={S.btnInner}>
                      <Ionicons name="layers" size={rs(18)} color={C.TEXT} />
                      <Text style={S.primaryBtnTxt}>{towerFloor >= TOWER_MAX_FLOOR ? 'Back to Tower' : 'Next Floor'}</Text>
                      <Ionicons name="chevron-forward" size={rs(18)} color={C.ICON_ON_DARK} />
                    </LinearGradient>
                  </TouchableOpacity>
                  {/* Secondary: Home */}
                  <TouchableOpacity style={S.secondaryBtn} onPress={handleHome} activeOpacity={0.85}>
                    <Ionicons name="home-outline" size={rs(18)} color={C.ICON_MUTED} />
                    <Text style={S.secondaryBtnTxt}>Home</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {/* Primary: Back to Tower to retry same floor */}
                  <TouchableOpacity style={S.retryBtn} onPress={handleBackTower} activeOpacity={0.85}>
                    <LinearGradient colors={[C.PRIMARY_DARK, C.PRIMARY]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={S.btnInner}>
                      <Ionicons name="layers" size={rs(18)} color={C.TEXT} />
                      <Text style={S.primaryBtnTxt}>Back to Tower</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity style={S.secondaryBtn} onPress={handleHome} activeOpacity={0.85}>
                    <Ionicons name="home-outline" size={rs(18)} color={C.ICON_MUTED} />
                    <Text style={S.secondaryBtnTxt}>Home</Text>
                  </TouchableOpacity>
                </>
              )
            ) : isWin ? (
              /* ── Story / normal win ────────────────────────────────────────── */
              <>
                {canGoNext && (
                  <TouchableOpacity style={S.primaryBtn} onPress={handleNextStage} activeOpacity={0.85}>
                    <LinearGradient colors={C.GRAD_PINK} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={S.btnInner}>
                      <Ionicons name="flash" size={rs(18)} color={C.TEXT} />
                      <Text style={S.primaryBtnTxt}>Next Stage</Text>
                      <Ionicons name="chevron-forward" size={rs(18)} color={C.ICON_ON_DARK} />
                    </LinearGradient>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={S.secondaryBtn} onPress={fromStory ? handleStoryMode : handleHome} activeOpacity={0.85}>
                  <Ionicons name={fromStory ? 'book-outline' : 'home-outline'} size={rs(18)} color={C.ICON_MUTED} />
                  <Text style={S.secondaryBtnTxt}>{fromStory ? 'Story Mode' : 'Home'}</Text>
                </TouchableOpacity>
              </>
            ) : (
              /* ── Normal defeat ─────────────────────────────────────────────── */
              <>
                <TouchableOpacity style={S.retryBtn} onPress={handleRetry} activeOpacity={0.85}>
                  <LinearGradient colors={[C.DANGER, C.DANGER_DARK]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={S.btnInner}>
                    <Ionicons name="refresh" size={rs(18)} color={C.TEXT} />
                    <Text style={S.primaryBtnTxt}>Retry</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity style={S.secondaryBtn} onPress={fromStory ? handleStoryMode : handleHome} activeOpacity={0.85}>
                  <Ionicons name={fromStory ? 'book-outline' : 'home-outline'} size={rs(18)} color={C.ICON_MUTED} />
                  <Text style={S.secondaryBtnTxt}>{fromStory ? 'Story Mode' : 'Home'}</Text>
                </TouchableOpacity>
              </>
            )}

          </Animated.View>

        </View>
      </View>
    </Animated.View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.BG_VOID },
  body: { flex: 1, flexDirection: 'row' },

  // ── Left panel ──────────────────────────────────────────────────
  leftPanel: { width: '40%', justifyContent: 'center', alignItems: 'center', gap: rs(12), overflow: 'hidden' },
  iconGlow:  { position: 'absolute', width: rs(180), height: rs(180), borderRadius: rs(90), shadowRadius: 55, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, elevation: 40 },
  resultIcon:  { width: rs(96), height: rs(96) },
  resultTitle: { fontSize: rf(26), fontWeight: '900', letterSpacing: 4, textAlign: 'center', textShadowColor: C.OVERLAY_MODAL, textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8 },
  resultSub:   { fontSize: rf(13), color: C.TEXT_ON_DARK_SOFT, marginTop: rs(4), letterSpacing: 0.5, textAlign: 'center' },
  stagePill:   { flexDirection: 'row', alignItems: 'center', gap: rs(5), borderWidth: 1, borderRadius: rs(6), paddingHorizontal: rs(9), paddingVertical: rs(3), marginTop: rs(8) },
  stagePillTxt:{ fontSize: rf(12), fontWeight: '700', letterSpacing: 1 },

  // ── Right panel ─────────────────────────────────────────────────
  rightPanel: { flex: 1, paddingHorizontal: rs(16), paddingVertical: rs(12), justifyContent: 'space-between' },

  rewardsHeadRow: { flexDirection: 'row', alignItems: 'center', gap: rs(6), marginBottom: rs(4) },
  rewardsHeading: { fontSize: rf(13), fontWeight: '900', color: C.GOLD, letterSpacing: 2.5 },
  modeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: rs(3),
    borderRadius: rs(4), paddingHorizontal: rs(5), paddingVertical: rs(2),
    borderWidth: 1, borderColor: C.BORDER, backgroundColor: C.GLASS_3,
  },
  modeBadgeTxt: { fontSize: rf(10), fontWeight: '800', color: C.TEXT_MUTED, letterSpacing: 0.6 },
  divider: { height: 1, marginBottom: rs(8), borderRadius: 1 },

  scrollContent: { gap: rs(8), paddingBottom: rs(4) },

  // Currency chips
  chipRow: { flexDirection: 'row', gap: rs(8) },
  chip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: rs(8),
    borderWidth: 1, borderRadius: rs(10), paddingHorizontal: rs(12), paddingVertical: rs(8),
  },
  chipImg: { width: rs(26), height: rs(26) },
  chipAmt: { fontSize: rf(20), fontWeight: '900' },
  chipLbl: { fontSize: rf(13), color: C.TEXT_ON_DARK_MUTED, fontWeight: '600', alignSelf: 'flex-end', marginBottom: rs(2) },

  // Hero reward - compact horizontal row
  heroRow: {
    flexDirection: 'row', alignItems: 'center', gap: rs(10),
    borderWidth: 1, borderRadius: rs(10), overflow: 'hidden',
    paddingRight: rs(10),
  },
  heroPortraitWrap: {
    width: rs(56), height: rs(56), borderRightWidth: 1, overflow: 'hidden',
  },
  heroPortrait: { width: '100%', height: '100%' },
  heroInfo: { flex: 1, gap: rs(2) },
  heroNameRow: { flexDirection: 'row', alignItems: 'center', gap: rs(6) },
  rankBadge: { borderRadius: rs(4), paddingHorizontal: rs(5), paddingVertical: rs(1) },
  rankTxt:   { fontSize: rf(12), fontWeight: '900' },
  heroName:  { fontSize: rf(12), fontWeight: '800', color: C.TEXT, flex: 1 },
  heroFaction:{ fontSize: rf(12), fontWeight: '700', letterSpacing: 0.3 },
  heroClass:  { fontSize: rf(11), color: C.TEXT_ON_DARK_WEAK, fontWeight: '600' },
  unlockBadge: {
    flexDirection: 'row', alignItems: 'center', gap: rs(3),
    borderWidth: 1, borderRadius: rs(5), paddingHorizontal: rs(6), paddingVertical: rs(3),
  },
  unlockTxt: { fontSize: rf(10), fontWeight: '900', color: C.PRIMARY_LIGHT, letterSpacing: 0.8 },

  // XP section
  xpSection: {
    gap: rs(6), padding: rs(10), borderRadius: rs(10), overflow: 'hidden',
    backgroundColor: C.PRIMARY_GLOW,
    borderWidth: 1, borderColor: C.PRIMARY + '35',
  },
  xpHeadRow:  { flexDirection: 'row', alignItems: 'center', gap: rs(5) },
  xpHeading:  { fontSize: rf(11), fontWeight: '900', color: C.TEXT_MUTED, letterSpacing: 2 },

  levelUpBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.GOLD + '22', borderRadius: rs(5),
    paddingHorizontal: rs(6), paddingVertical: rs(2),
    borderWidth: 1, borderColor: C.GOLD + '60', marginRight: rs(4),
  },
  levelUpTxt: { fontSize: rf(12), fontWeight: '900', color: C.GOLD, letterSpacing: 0.5 },

  xpGainBadge: {
    flexDirection: 'row', alignItems: 'center', gap: rs(3),
    backgroundColor: C.PRIMARY + '25', borderRadius: rs(5),
    paddingHorizontal: rs(6), paddingVertical: rs(2),
    borderWidth: 1, borderColor: C.PRIMARY_LIGHT + '50',
  },
  xpGainTxt: { fontSize: rf(13), fontWeight: '900', color: C.PRIMARY_LIGHT, letterSpacing: 0.5 },

  xpBarRow: { flexDirection: 'row', alignItems: 'center', gap: rs(8) },
  xpTrack: {
    flex: 1, height: rs(8), borderRadius: rs(4),
    backgroundColor: C.GLASS_5, overflow: 'hidden', position: 'relative',
  },
  xpGlow: {
    position: 'absolute', top: -3, bottom: -3, left: 0,
    borderRadius: rs(6), backgroundColor: C.PRIMARY + '50',
  },
  xpFill: { position: 'absolute', top: 0, bottom: 0, left: 0, borderRadius: rs(4), overflow: 'hidden' },
  xpShimmer: {
    position: 'absolute', top: 0, bottom: 0, width: rs(26),
    backgroundColor: C.GLASS_8, borderRadius: rs(4),
    transform: [{ skewX: '-20deg' }],
  },
  lvBubble: {
    width: rs(32), height: rs(32), borderRadius: rs(8),
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.PRIMARY + '38',
    borderWidth: 1, borderColor: C.PRIMARY + '55',
  },
  lvLabel: { fontSize: rf(6), fontWeight: '700', color: C.SHIMMER, letterSpacing: 0.5 },
  lvNum:   { fontSize: rf(12), fontWeight: '900', color: C.TEXT },
  xpNums:  { fontSize: rf(12), color: C.TEXT_ON_DARK_DIM, fontWeight: '600', letterSpacing: 0.3 },

  // Defeat
  defeatSection: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: rs(14) },
  defeatMsg:     { fontSize: rf(12), color: C.TEXT_ON_DARK_SOFT, lineHeight: rf(19), textAlign: 'center' },

  // Tower pill
  towerPill: {
    flexDirection: 'row', alignItems: 'center', gap: rs(5),
    backgroundColor: C.CYAN + '12', borderRadius: rs(7),
    paddingHorizontal: rs(10), paddingVertical: rs(5),
    borderWidth: 1, borderColor: C.CYAN + '40',
  },
  towerPillTxt: { fontSize: rf(13), fontWeight: '700', color: C.CYAN },

  ascDropRow:      { flexDirection: 'row', alignItems: 'center', gap: rs(10), borderRadius: rs(8), borderWidth: 1, paddingHorizontal: rs(10), paddingVertical: rs(8), marginTop: rs(6) },
  ascDropImg:      { width: rs(36), height: rs(36) },
  ascDropInfo:     { flex: 1 },
  ascDropName:     { fontSize: rf(13), fontWeight: '800', color: C.GOLD, letterSpacing: 0.3 },
  ascDropSub:      { fontSize: rf(12), color: C.TEXT_MUTED, marginTop: rs(1) },
  ascDropQtyBadge: { borderRadius: rs(6), borderWidth: 1, paddingHorizontal: rs(8), paddingVertical: rs(4) },
  ascDropQty:      { fontSize: rf(13), fontWeight: '900', letterSpacing: 0.5 },

  // Buttons
  btnRow:       { flexDirection: 'row', gap: rs(8), alignItems: 'center', paddingTop: rs(6) },
  btnInner:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(6), paddingHorizontal: rs(16), paddingVertical: rs(10), borderRadius: rs(10) },
  primaryBtn:   { flex: 1, borderRadius: rs(10), overflow: 'hidden' },
  retryBtn:     { flex: 1, borderRadius: rs(10), overflow: 'hidden' },
  primaryBtnTxt:{ fontSize: rf(12), fontWeight: '900', color: C.TEXT, letterSpacing: 0.5 },
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: rs(5),
    paddingHorizontal: rs(12), paddingVertical: rs(10), borderRadius: rs(10),
    borderWidth: 1, borderColor: C.GLASS_7,
    backgroundColor: C.GLASS_3,
  },
  secondaryBtnTxt: { fontSize: rf(12), fontWeight: '700', color: C.TEXT_ON_DARK },
});
