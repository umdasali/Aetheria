import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Image, Animated, Dimensions, Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AudioManager from '../utils/AudioManager';
import { C } from '../theme/colors';
import { getHeroById } from '../data/heroes';
import { RANK } from '../theme/colors';
import { FACTIONS } from '../data/heroes';
import { STAGE_ORDER, getStageById, isStageUnlocked, stageGoldReward } from '../data/story';
import { ASCENSION_ITEMS } from '../data/ascensionItems';
import { ENEMY_GROUPS } from '../data/enemies';
import useGameStore from '../store/gameStore';
import { calcPlayerLevel, calcLevelFromXP } from '../utils/playerLevel';

const { width: W, height: H } = Dimensions.get('window');
const GEM_IMG  = require('../../assets/currency/gem.png');
const GOLD_IMG = require('../../assets/currency/gold.png');
const COIN_IMG = require('../../assets/currency/coin.png');

// ─── Particle ────────────────────────────────────────────────────────────────
function Particle({ color, delay, duration, x, size }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    ).start();
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
  } = route.params;
  const { completedChapters, ownedHeroes, heroCollection, dailyStreak } = useGameStore();

  const isWin     = battleResult === 'win';
  const accentClr = isWin ? C.GOLD : C.DANGER;

  // Tower mode: override rewards
  const part       = stageId ? stageId % 10 : 0;
  const goldReward = towerMode
    ? (towerRewards?.gold ?? 0)
    : (isWin && stageId ? stageGoldReward(part) : 0);
  const actualGems = towerMode
    ? (towerRewards?.gems ?? 0)
    : (isWin && !wasReplay ? (rewards?.gems ?? 0) : 0);
  const heroObj    = (!wasReplay && rewards?.heroId) ? getHeroById(rewards.heroId) : null;
  const hero       = heroObj?.rank !== 'S' ? heroObj : null;

  // XP — compute both before and after states precisely
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

  // XP bar — starts at beforeState.progress (exact "before" position)
  const xpBarAnim    = useRef(new Animated.Value(beforeState.progress)).current;
  const xpCountAnim  = useRef(new Animated.Value(beforeState.currentXP)).current;
  const xpBadgeScale = useRef(new Animated.Value(0)).current;
  const xpBadgeFade  = useRef(new Animated.Value(0)).current;
  const shimmerAnim  = useRef(new Animated.Value(-1)).current;
  const levelUpScale = useRef(new Animated.Value(0.4)).current;
  const levelUpFade  = useRef(new Animated.Value(0)).current;
  const xpFlash      = useRef(new Animated.Value(0)).current;
  const [displayXP,  setDisplayXP] = useState(beforeState.currentXP);

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

    // Icon glow loop
    Animated.loop(Animated.sequence([
      Animated.timing(glowPulse, { toValue: 0.75, duration: 1300, useNativeDriver: true }),
      Animated.timing(glowPulse, { toValue: 0.20, duration: 1300, useNativeDriver: true }),
    ])).start();

    // XP sequence — fires after rewards have faded in
    if (isWin && xpGained > 0) {
      const listenerId = xpCountAnim.addListener(({ value }) => setDisplayXP(Math.round(value)));

      // Shimmer loops while bar is animating
      const shimmerLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, { toValue: 2,  duration: 900, useNativeDriver: true }),
          Animated.timing(shimmerAnim, { toValue: -1, duration: 0,   useNativeDriver: true }),
        ])
      );

      setTimeout(() => {
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
              easing: Easing.out(Easing.cubic), useNativeDriver: false,
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
            setTimeout(() => {
              xpBarAnim.setValue(0);
              xpCountAnim.setValue(0);
              Animated.parallel([
                Animated.timing(xpBarAnim, {
                  toValue: afterState.progress, duration: 800,
                  easing: Easing.out(Easing.cubic), useNativeDriver: false,
                }),
                Animated.timing(xpCountAnim, {
                  toValue: afterState.currentXP, duration: 800,
                  easing: Easing.out(Easing.cubic), useNativeDriver: false,
                }),
              ]).start(() => {
                shimmerLoop.stop();
                xpCountAnim.removeListener(listenerId);
              });
            }, 350);
          });
        } else {
          // Simple: before → after within the same level
          Animated.parallel([
            Animated.timing(xpBarAnim, {
              toValue: afterState.progress, duration: 1100,
              easing: Easing.out(Easing.cubic), useNativeDriver: false,
            }),
            Animated.timing(xpCountAnim, {
              toValue: afterState.currentXP, duration: 1100,
              easing: Easing.out(Easing.cubic), useNativeDriver: false,
            }),
          ]).start(() => {
            shimmerLoop.stop();
            xpCountAnim.removeListener(listenerId);
          });
        }
      }, 1500);
    }
  }, []);

  // Navigation
  const handleNextStage = () => {
    const grp = ENEMY_GROUPS.find(g => g.id === nextStage.enemyGroupId);
    navigation.replace('Narration', { stage: nextStage, enemyGroup: grp });
  };
  const handleRetry = () => {
    const curStage = getStageById(stageId);
    if (curStage && enemyGroup) navigation.replace('Narration', { stage: curStage, enemyGroup, autoSkip: true });
    else navigation.navigate('Story');
  };
  const handleStoryMode  = () => navigation.navigate('Story');
  const handleHome       = () => navigation.navigate('Home');
  const handleNextFloor  = () => navigation.navigate('Tower');
  const handleBackTower  = () => navigation.navigate('Tower');

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

      <SafeAreaView style={S.body} edges={['top', 'bottom', 'left', 'right']}>

        {/* ── LEFT ─────────────────────────────────────── */}
        <View style={S.leftPanel}>
          <Animated.View style={[S.iconGlow, { backgroundColor: accentClr + '18', shadowColor: accentClr, opacity: glowPulse }]} />
          <Animated.View style={{ transform: [{ scale: iconScale }], opacity: iconFade }}>
            <Text style={S.resultIcon}>{isWin ? '🏆' : '💀'}</Text>
          </Animated.View>
          <Animated.View style={{ transform: [{ translateY: titleSlide }], opacity: titleFade, alignItems: 'center' }}>
            <Text style={[S.resultTitle, { color: accentClr }]}>{isWin ? 'VICTORY!' : 'DEFEATED!'}</Text>
            <Text style={S.resultSub}>{isWin ? 'Enemies vanquished. Glory earned.' : 'Regroup and try again.'}</Text>
            {stageId ? (
              <View style={[S.stagePill, { borderColor: accentClr + '40', backgroundColor: accentClr + '12' }]}>
                <Ionicons name="map-outline" size={10} color={accentClr} />
                <Text style={[S.stagePillTxt, { color: accentClr }]}>Stage {stageId}</Text>
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
                    <Ionicons name="refresh" size={8} color={C.TEXT_MUTED} />
                    <Text style={S.modeBadgeTxt}>REPLAY · GOLD ONLY</Text>
                  </View>
                )}
                {practiceMode && practiceGotBonus && (
                  <View style={[S.modeBadge, { borderColor: C.CYAN + '60', backgroundColor: C.CYAN + '12' }]}>
                    <Ionicons name="star" size={8} color={C.CYAN} />
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

                  {/* Currency chips — side by side */}
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
                      <Ionicons name="layers-outline" size={11} color={C.CYAN} />
                      <Text style={S.towerPillTxt}>Floor {towerFloor} Cleared  →  Floor {towerFloor + 1} Unlocked</Text>
                    </View>
                  )}

                  {/* Ascension material drop — boss floors only */}
                  {towerAscensionDrop && (() => {
                    const item = ASCENSION_ITEMS.find(i => i.id === towerAscensionDrop.itemId);
                    if (!item) return null;
                    return (
                      <View style={[S.ascDropRow, { borderColor: C.GOLD + '40', backgroundColor: C.GOLD + '0C' }]}>
                        <Image source={item.image} style={S.ascDropImg} resizeMode="contain" />
                        <View style={S.ascDropInfo}>
                          <Text style={S.ascDropName} numberOfLines={1}>{item.name}</Text>
                          <Text style={S.ascDropSub}>{item.rankLabel} · Ascension Material</Text>
                        </View>
                        <View style={[S.ascDropQtyBadge, { backgroundColor: C.GOLD + '22', borderColor: C.GOLD + '55' }]}>
                          <Text style={[S.ascDropQty, { color: C.GOLD }]}>×{towerAscensionDrop.qty}</Text>
                        </View>
                      </View>
                    );
                  })()}

                  {/* Hero reward — compact horizontal row */}
                  {hero && (() => {
                    const r = RANK[hero.rank];
                    const factionColor = FACTIONS[hero.faction]?.color ?? C.PRIMARY;
                    return (
                      <View style={[S.heroRow, { borderColor: factionColor + '40', backgroundColor: factionColor + '10' }]}>
                        {/* Portrait */}
                        <View style={[S.heroPortraitWrap, { borderColor: r.glow + '80' }]}>
                          <Image source={hero.image} style={S.heroPortrait} resizeMode="cover" />
                          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.55)']} style={StyleSheet.absoluteFill} />
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
                          <Ionicons name="star" size={9} color={C.PRIMARY_LIGHT} />
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
                        style={[StyleSheet.absoluteFill, { backgroundColor: '#fff', opacity: xpFlash, borderRadius: 10 }]}
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
                          <Ionicons name="trending-up" size={9} color={C.PRIMARY_LIGHT} />
                          <Text style={S.xpGainTxt}>+{xpGained} XP</Text>
                        </Animated.View>
                      </View>

                      {/* Bar + level bubble */}
                      <View style={S.xpBarRow}>
                        <View style={S.xpTrack}>
                          <Animated.View style={[S.xpGlow, {
                            width: xpBarAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                          }]} />
                          <Animated.View style={[S.xpFill, {
                            width: xpBarAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
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
              <Ionicons name="shield-outline" size={36} color={C.DANGER + '80'} />
              <Text style={S.defeatMsg}>Your heroes gave everything. Strengthen your team and return stronger.</Text>
            </Animated.View>
          )}

          {/* Action buttons */}
          <Animated.View style={[S.btnRow, { opacity: btnFade }]}>

            {towerMode ? (
              /* ── Tower win / lose ──────────────────────────────────────────── */
              isWin ? (
                <>
                  {/* Primary: Next Floor */}
                  <TouchableOpacity style={S.primaryBtn} onPress={handleNextFloor} activeOpacity={0.85}>
                    <LinearGradient colors={[C.GOLD_DARK, C.GOLD]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={S.btnInner}>
                      <Ionicons name="layers" size={14} color="#fff" />
                      <Text style={S.primaryBtnTxt}>Next Floor</Text>
                      <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.8)" />
                    </LinearGradient>
                  </TouchableOpacity>
                  {/* Secondary: Home */}
                  <TouchableOpacity style={S.secondaryBtn} onPress={handleHome} activeOpacity={0.85}>
                    <Ionicons name="home-outline" size={14} color="rgba(255,255,255,0.65)" />
                    <Text style={S.secondaryBtnTxt}>Home</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {/* Primary: Back to Tower to retry same floor */}
                  <TouchableOpacity style={S.retryBtn} onPress={handleBackTower} activeOpacity={0.85}>
                    <LinearGradient colors={[C.PRIMARY_DARK, C.PRIMARY]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={S.btnInner}>
                      <Ionicons name="layers" size={14} color="#fff" />
                      <Text style={S.primaryBtnTxt}>Back to Tower</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity style={S.secondaryBtn} onPress={handleHome} activeOpacity={0.85}>
                    <Ionicons name="home-outline" size={14} color="rgba(255,255,255,0.65)" />
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
                      <Ionicons name="flash" size={14} color="#fff" />
                      <Text style={S.primaryBtnTxt}>Next Stage</Text>
                      <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.8)" />
                    </LinearGradient>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={S.secondaryBtn} onPress={fromStory ? handleStoryMode : handleHome} activeOpacity={0.85}>
                  <Ionicons name={fromStory ? 'book-outline' : 'home-outline'} size={14} color="rgba(255,255,255,0.65)" />
                  <Text style={S.secondaryBtnTxt}>{fromStory ? 'Story Mode' : 'Home'}</Text>
                </TouchableOpacity>
              </>
            ) : (
              /* ── Normal defeat ─────────────────────────────────────────────── */
              <>
                <TouchableOpacity style={S.retryBtn} onPress={handleRetry} activeOpacity={0.85}>
                  <LinearGradient colors={[C.DANGER, '#7F1D1D']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={S.btnInner}>
                    <Ionicons name="refresh" size={14} color="#fff" />
                    <Text style={S.primaryBtnTxt}>Retry</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity style={S.secondaryBtn} onPress={fromStory ? handleStoryMode : handleHome} activeOpacity={0.85}>
                  <Ionicons name={fromStory ? 'book-outline' : 'home-outline'} size={14} color="rgba(255,255,255,0.65)" />
                  <Text style={S.secondaryBtnTxt}>{fromStory ? 'Story Mode' : 'Home'}</Text>
                </TouchableOpacity>
              </>
            )}

          </Animated.View>

        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.BG_VOID },
  body: { flex: 1, flexDirection: 'row' },

  // ── Left panel ──────────────────────────────────────────────────
  leftPanel: { width: '40%', justifyContent: 'center', alignItems: 'center', gap: 12, overflow: 'hidden' },
  iconGlow:  { position: 'absolute', width: 180, height: 180, borderRadius: 90, shadowRadius: 55, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, elevation: 40 },
  resultIcon:  { fontSize: 64 },
  resultTitle: { fontSize: 26, fontWeight: '900', letterSpacing: 4, textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8 },
  resultSub:   { fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 4, letterSpacing: 0.5, textAlign: 'center' },
  stagePill:   { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 6, paddingHorizontal: 9, paddingVertical: 3, marginTop: 8 },
  stagePillTxt:{ fontSize: 9, fontWeight: '700', letterSpacing: 1 },

  // ── Right panel ─────────────────────────────────────────────────
  rightPanel: { flex: 1, paddingHorizontal: 16, paddingVertical: 12, justifyContent: 'space-between' },

  rewardsHeadRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  rewardsHeading: { fontSize: 10, fontWeight: '900', color: C.GOLD, letterSpacing: 2.5 },
  modeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2,
    borderWidth: 1, borderColor: C.BORDER, backgroundColor: 'rgba(255,255,255,0.05)',
  },
  modeBadgeTxt: { fontSize: 7, fontWeight: '800', color: C.TEXT_MUTED, letterSpacing: 0.6 },
  divider: { height: 1, marginBottom: 8, borderRadius: 1 },

  scrollContent: { gap: 8, paddingBottom: 4 },

  // Currency chips
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
  },
  chipImg: { width: 26, height: 26 },
  chipAmt: { fontSize: 20, fontWeight: '900' },
  chipLbl: { fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: '600', alignSelf: 'flex-end', marginBottom: 2 },

  // Hero reward — compact horizontal row
  heroRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderRadius: 10, overflow: 'hidden',
    paddingRight: 10,
  },
  heroPortraitWrap: {
    width: 56, height: 56, borderRightWidth: 1, overflow: 'hidden',
  },
  heroPortrait: { width: '100%', height: '100%' },
  heroInfo: { flex: 1, gap: 2 },
  heroNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rankBadge: { borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  rankTxt:   { fontSize: 9, fontWeight: '900' },
  heroName:  { fontSize: 12, fontWeight: '800', color: '#fff', flex: 1 },
  heroFaction:{ fontSize: 9, fontWeight: '700', letterSpacing: 0.3 },
  heroClass:  { fontSize: 8, color: 'rgba(255,255,255,0.38)', fontWeight: '600' },
  unlockBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    borderWidth: 1, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 3,
  },
  unlockTxt: { fontSize: 7, fontWeight: '900', color: C.PRIMARY_LIGHT, letterSpacing: 0.8 },

  // XP section
  xpSection: {
    gap: 6, padding: 10, borderRadius: 10, overflow: 'hidden',
    backgroundColor: 'rgba(124,58,237,0.10)',
    borderWidth: 1, borderColor: C.PRIMARY + '35',
  },
  xpHeadRow:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  xpHeading:  { fontSize: 8, fontWeight: '900', color: C.TEXT_MUTED, letterSpacing: 2 },

  levelUpBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.GOLD + '22', borderRadius: 5,
    paddingHorizontal: 6, paddingVertical: 2,
    borderWidth: 1, borderColor: C.GOLD + '60', marginRight: 4,
  },
  levelUpTxt: { fontSize: 9, fontWeight: '900', color: C.GOLD, letterSpacing: 0.5 },

  xpGainBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: C.PRIMARY + '25', borderRadius: 5,
    paddingHorizontal: 6, paddingVertical: 2,
    borderWidth: 1, borderColor: C.PRIMARY_LIGHT + '50',
  },
  xpGainTxt: { fontSize: 10, fontWeight: '900', color: C.PRIMARY_LIGHT, letterSpacing: 0.5 },

  xpBarRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  xpTrack: {
    flex: 1, height: 8, borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden', position: 'relative',
  },
  xpGlow: {
    position: 'absolute', top: -3, bottom: -3, left: 0,
    borderRadius: 6, backgroundColor: C.PRIMARY + '50',
  },
  xpFill: { position: 'absolute', top: 0, bottom: 0, left: 0, borderRadius: 4, overflow: 'hidden' },
  xpShimmer: {
    position: 'absolute', top: 0, bottom: 0, width: 26,
    backgroundColor: 'rgba(255,255,255,0.28)', borderRadius: 4,
    transform: [{ skewX: '-20deg' }],
  },
  lvBubble: {
    width: 32, height: 32, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(124,58,237,0.22)',
    borderWidth: 1, borderColor: C.PRIMARY + '55',
  },
  lvLabel: { fontSize: 6, fontWeight: '700', color: 'rgba(255,255,255,0.40)', letterSpacing: 0.5 },
  lvNum:   { fontSize: 12, fontWeight: '900', color: '#fff' },
  xpNums:  { fontSize: 9, color: 'rgba(255,255,255,0.35)', fontWeight: '600', letterSpacing: 0.3 },

  // Defeat
  defeatSection: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14 },
  defeatMsg:     { fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 19, textAlign: 'center' },

  // Tower pill
  towerPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.CYAN + '12', borderRadius: 7,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: C.CYAN + '40',
  },
  towerPillTxt: { fontSize: 10, fontWeight: '700', color: C.CYAN },

  ascDropRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8, marginTop: 6 },
  ascDropImg:      { width: 36, height: 36 },
  ascDropInfo:     { flex: 1 },
  ascDropName:     { fontSize: 11, fontWeight: '800', color: C.GOLD, letterSpacing: 0.3 },
  ascDropSub:      { fontSize: 9, color: C.TEXT_MUTED, marginTop: 1 },
  ascDropQtyBadge: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4 },
  ascDropQty:      { fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },

  // Buttons
  btnRow:       { flexDirection: 'row', gap: 8, alignItems: 'center', paddingTop: 6 },
  btnInner:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  primaryBtn:   { flex: 1, borderRadius: 10, overflow: 'hidden' },
  retryBtn:     { flex: 1, borderRadius: 10, overflow: 'hidden' },
  primaryBtnTxt:{ fontSize: 12, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  secondaryBtnTxt: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.65)' },
});
