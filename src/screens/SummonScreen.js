import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, Image, StyleSheet, TouchableOpacity, TouchableWithoutFeedback,
  Animated, Dimensions, Easing, ScrollView, useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useGameStore from '../store/gameStore';
import { HEROES } from '../data/heroes';
import { C, RANK } from '../theme/colors';
import { VideoView, useVideoPlayer } from 'expo-video';
import AudioManager from '../utils/AudioManager';
import HeroCard from '../components/HeroCard';
import {
  getActiveEvents, STANDARD_BANNER, FIFTY_FIFTY_LOSS_IDS,
  STANDARD_RATES, EVENT_RATES,
} from '../data/events';
import { rs, rf } from '../theme/scale';

const WISH_VIDEO = require('../../assets/video/wish-animation.mp4');

const { width: W, height: H } = Dimensions.get('window');
const GEM_IMG = require('../../assets/currency/gem.png');

// ── Pull config ───────────────────────────────────────────────────────────────
const SINGLE_COST = 50;
const MULTI_COST  = 450;
const PITY_LIMIT  = 90;

// Base rank rates come from src/data/events.js (STANDARD_RATES / EVENT_RATES)
// so pools and odds can be updated manually in one place.
//
// pity is incremented AFTER each non-S draw. Soft-pity thresholds scale with
// the banner's pity limit so event banners (80 pulls) ramp at the same
// proportional points as the standard banner (90 pulls).
const pickRank = (pity, rates, limit = PITY_LIMIT) => {
  if (pity >= limit - 1) return 'S';

  let sRate;
  if      (pity >= Math.floor(limit * 0.78)) sRate = 0.15; // ~70/90, ~62/80
  else if (pity >= Math.floor(limit * 0.56)) sRate = 0.08; // ~50/90, ~44/80
  else sRate = rates.S;

  const rand = Math.random();
  if (rand < sRate) return 'S';

  // Scale non-S ranks so they exactly fill the probability left after sRate.
  const scale = (1 - sRate) / (rates.A + rates.B + rates.C);
  const aRate = rates.A * scale;
  const bRate = rates.B * scale;

  if (rand < sRate + aRate) return 'A';
  if (rand < sRate + aRate + bRate) return 'B';
  if (rates.C > 0) return 'C';
  // Zero-C banner: float rounding can leak past the checks above — fall back
  // to the highest nonzero non-S rank.
  return rates.B > 0 ? 'B' : 'A';
};

// ── Genshin / WuWa-style banner system ───────────────────────────────────────
//
// All pools and rates are data-driven from src/data/events.js — edit
// STANDARD_BANNER, FIFTY_FIFTY_LOSS_IDS, STANDARD_RATES and EVENT_RATES there
// to update the gacha manually.
//
// Which ranks can drop on a banner is governed by its rate table — a rank
// with rate 0 never rolls. Non-S pulls always draw from ALL heroes of the
// rolled rank.
//
// Event banners (rateUpHeroIds non-empty):
//   • Rates: EVENT_RATES.
//   • 50/50 on every S pull: either the featured rate-up hero OR an off-banner S
//     from FIFTY_FIFTY_LOSS_IDS (minus the current rate-up).
//   • Losing 50/50 sets guarantee = true → the NEXT S on this banner is 100% the
//     rate-up hero, regardless of random roll.
//
// Standard banner (rateUpHeroIds empty):
//   • Rates: STANDARD_RATES.
//   • S pulls come exclusively from STANDARD_BANNER.featuredSRankIds — no
//     Sovereign proc, no 50/50; guarantee state is ignored and unchanged.
//
// shopExclusive heroes (e.g. hero_054) never appear in any pool.
//
// Parameters:
//   isGuaranteed – current guarantee flag for this banner (from store)
//   pityLimit    – hard pity cap for this banner
//
const performSummon = (
  count,
  currentPity,
  rateUpHeroIds = [],
  isGuaranteed  = false,
  pityLimit     = PITY_LIMIT,
) => {
  const results    = [];
  let pity         = currentPity;
  let guaranteed   = isGuaranteed;
  const rateUpPool = HEROES.filter(h => rateUpHeroIds.includes(h.id));
  const isEvent    = rateUpPool.length > 0;
  const rates      = isEvent ? EVENT_RATES : STANDARD_RATES;

  // Off-banner S pool (event banners only): the manually-curated 50/50 loss
  // pool, excluding the current rate-up heroes so the player never loses the
  // 50/50 and still ends up with the featured hero.
  const buildOffBannerPool = () => {
    const pool = FIFTY_FIFTY_LOSS_IDS
      .map(id => HEROES.find(h => h.id === id))
      .filter(h => h && !rateUpHeroIds.includes(h.id));
    return pool.length
      ? pool
      : HEROES.filter(h => h.rank === 'S' && !h.sovereign && !h.shopExclusive && !rateUpHeroIds.includes(h.id));
  };
  // Computed once per performSummon call, only if an event banner S roll happens.
  let offBannerPool = null;
  const getOffBannerPool = () => { return offBannerPool || (offBannerPool = buildOffBannerPool()); };

  // Standard banner S pool — exactly the curated featured list, nothing else.
  const buildStandardSPool = () => {
    const pool = STANDARD_BANNER.featuredSRankIds
      .map(id => HEROES.find(h => h.id === id))
      .filter(Boolean);
    return pool.length
      ? pool
      : HEROES.filter(h => h.rank === 'S' && !h.sovereign && !h.shopExclusive);
  };
  let standardSPool = null;
  const getStandardSPool = () => { return standardSPool || (standardSPool = buildStandardSPool()); };

  for (let i = 0; i < count; i++) {
    const wasPityPull = pity >= pityLimit - 1;
    const rank        = pickRank(pity, rates, pityLimit);
    const isPity      = wasPityPull && rank === 'S';
    if (rank === 'S') pity = 0; else pity++;

    let pool;
    let isFeatured = false;

    if (rank === 'S') {
      if (isEvent) {
        // ── Event banner: 50/50 guarantee system ───────────────────────────
        const wonRateUp = guaranteed || Math.random() < 0.50;
        if (wonRateUp) {
          pool       = rateUpPool;
          isFeatured = true;
          guaranteed = false; // win resets the guarantee
        } else {
          // Lost the 50/50 → give off-banner S, set guarantee for next pull
          pool       = getOffBannerPool();
          guaranteed = true;
        }
      } else {
        // ── Standard banner: curated S pool only ───────────────────────────
        pool = getStandardSPool();
      }
    } else {
      // ── Non-S ranks: all heroes of the rolled rank. Which ranks can roll
      // at all is governed by the banner's rate table, not by hero lists.
      pool = HEROES.filter(h => h.rank === rank && !h.shopExclusive);
    }

    const hero = pool[Math.floor(Math.random() * pool.length)];
    results.push({ hero, isPity, isFeatured });
  }

  return { results, newPity: pity, newGuaranteed: guaranteed };
};

// ── Featured hero (first S-rank) ─────────────────────────────────────────────
const FEATURED = HEROES.find(h => h.rank === 'S') || HEROES[0];

// ── Star particle data (fixed per module) ─────────────────────────────────────
const STARS = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  xPct: Math.random(),
  size: Math.random() * 3.5 + 1.5,
  opacity: Math.random() * 0.5 + 0.2,
  duration: Math.random() * 9000 + 5000,
  initPct: Math.random(),
}));

// ── Card dimensions ───────────────────────────────────────────────────────────
const HEADER_H   = 48;
const BODY_PAD   = 14;
const CARD_W     = Math.floor((H - HEADER_H - BODY_PAD * 2) * (220 / 320) * 0.78);
const REVEAL_BOT = 58;
const AVAIL_H    = H - HEADER_H - REVEAL_BOT - 20;
const TEN_CH     = Math.floor((AVAIL_H - 10) / 2);
const TEN_CW     = Math.floor(TEN_CH * 220 / 320);
const ONE_CH     = Math.min(Math.floor(H * 0.70), 264);
const ONE_CW     = Math.floor(ONE_CH * 220 / 320);

// ── Sub-components ────────────────────────────────────────────────────────────

const CardBack = ({ width, height }) => (
  <View style={{ width, height, borderRadius: rs(8), overflow: 'hidden' }}>
    <LinearGradient
      colors={[C.BG_DARK, C.BG_VOID, C.BG_DARK]}
      start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}
      style={StyleSheet.absoluteFill}
    />
    <View style={[s.cbCorner, s.cbTL]} />
    <View style={[s.cbCorner, s.cbTR]} />
    <View style={[s.cbCorner, s.cbBL]} />
    <View style={[s.cbCorner, s.cbBR]} />
    <View style={s.cbCenter}>
      <Text style={s.cbSymbol}>✦</Text>
      <Text style={s.cbWord}>TRUMP</Text>
      <Text style={s.cbWord}>CARD</Text>
    </View>
  </View>
);

// ── Ornate wish button (reference-style decorative frame) ────────────────────
const PARTICLE_XS = ['10%', '28%', '50%', '68%', '86%'];
const PARTICLE_STAGGER = [0, 360, 720, 180, 540];

const OrnateWishBtn = ({ onPress, disabled, borderCol, gradColors, label, sub, costAmt, canAfford }) => {
  const glowAnim    = useRef(new Animated.Value(0.12)).current;
  const particleAnims = useRef(
    Array.from({ length: 5 }, () => ({
      y:       new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;

  // Pulsing soft glow
  useEffect(() => {
    const pulse = Animated.loop(Animated.sequence([
      Animated.timing(glowAnim, { toValue: 0.42, duration: 1700, useNativeDriver: true }),
      Animated.timing(glowAnim, { toValue: 0.10, duration: 1700, useNativeDriver: true }),
    ]));
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Rising sparkle particles
  useEffect(() => {
    const anims = particleAnims.map((p, i) => {
      p.y.setValue(0);
      p.opacity.setValue(0);
      const loop = Animated.loop(
        Animated.sequence([
          Animated.delay(PARTICLE_STAGGER[i]),
          Animated.parallel([
            Animated.timing(p.y, {
              toValue: -56, duration: 1400,
              easing: Easing.out(Easing.quad), useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(p.opacity, { toValue: 0.9, duration: 240, useNativeDriver: true }),
              Animated.timing(p.opacity, { toValue: 0,   duration: 420, useNativeDriver: true }),
            ]),
          ]),
          Animated.timing(p.y,       { toValue: 0, duration: 0, useNativeDriver: true }),
          Animated.timing(p.opacity, { toValue: 0, duration: 0, useNativeDriver: true }),
          Animated.delay(160 + i * 60),
        ])
      );
      loop.start();
      return loop;
    });
    return () => anims.forEach(a => a.stop());
  }, []);

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.82}
      style={disabled ? s.ornateDisabled : null}
    >
      <View style={[s.ornateOuter, {
        shadowColor: borderCol,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.7,
        shadowRadius: 14,
        elevation: 12,
      }]}>
        {/* Soft pulsing glow ring (behind body) */}
        <Animated.View
          pointerEvents="none"
          style={[s.ornateGlowRing, { backgroundColor: borderCol, opacity: glowAnim }]}
        />
        {/* Main body */}
        <View style={[s.ornateBody, { borderColor: borderCol }]}>
          <LinearGradient colors={gradColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
          {/* Diagonal top-left inner highlight */}
          <LinearGradient
            colors={[C.GLASS_8, C.GLASS_4, 'transparent']}
            start={{ x: 0, y: 0 }} end={{ x: 0.65, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {/* Bottom depth shadow */}
          <LinearGradient
            colors={['transparent', C.OVERLAY_2]}
            start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: rs(22) }}
          />
          {/* Double rail lines top */}
          <View style={[s.ornateRail, { top: 6,  opacity: 0.75, backgroundColor: borderCol }]} />
          <View style={[s.ornateRail, { top: 9,  opacity: 0.35, backgroundColor: borderCol }]} />
          {/* Double rail lines bottom */}
          <View style={[s.ornateRail, { bottom: 6, opacity: 0.75, backgroundColor: borderCol }]} />
          <View style={[s.ornateRail, { bottom: 9, opacity: 0.35, backgroundColor: borderCol }]} />
          {/* Rising sparkle particles */}
          {canAfford && particleAnims.map((p, i) => (
            <Animated.View
              key={i}
              pointerEvents="none"
              style={[s.ornateParticle, {
                left: PARTICLE_XS[i],
                backgroundColor: borderCol,
                transform: [{ translateY: p.y }],
                opacity: p.opacity,
              }]}
            />
          ))}
          {/* Content */}
          <View style={s.ornateContent}>
            <View style={{ flex: 1 }}>
              <Text style={s.ornateLabel}>{label}</Text>
              {sub && canAfford && <Text style={s.ornateSub}>{sub}</Text>}
            </View>
            <View style={s.ornateCostRow}>
              <Image source={GEM_IMG} style={s.ornateGemImg} />
              <Text style={[s.ornateCostTxt, { color: canAfford ? C.GOLD : C.TEXT_MUTED }]}>{costAmt}</Text>
            </View>
          </View>
        </View>
        {/* Corner diamond ornaments */}
        <View style={[s.ornateDiamond, s.ornateTL, { backgroundColor: borderCol }]} />
        <View style={[s.ornateDiamond, s.ornateTR, { backgroundColor: borderCol }]} />
        <View style={[s.ornateDiamond, s.ornateBL, { backgroundColor: borderCol }]} />
        <View style={[s.ornateDiamond, s.ornateBR, { backgroundColor: borderCol }]} />
        {/* Center top accent diamond */}
        <View style={[s.ornateAccentRow, { top: -6 }]}>
          <View style={[s.ornateAccentDot, { backgroundColor: borderCol }]} />
        </View>
        {/* Center bottom accent diamond */}
        <View style={[s.ornateAccentRow, { bottom: -6 }]}>
          <View style={[s.ornateAccentDot, { backgroundColor: borderCol }]} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const SmallCardFront = ({ hero, isNew, isFeatured, width }) => {
  const r = RANK[hero.rank];
  const height = Math.floor(width * 320 / 220);
  return (
    <View style={{ width, height, borderRadius: rs(8), overflow: 'hidden' }}>
      <Image source={hero.image} style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]} resizeMode="cover" />
      <LinearGradient
        colors={['transparent', 'transparent', C.OVERLAY_DEEP]}
        style={StyleSheet.absoluteFill}
      />
      {/* FEATURED star badge — top-left, only for rate-up S pulls */}
      {isFeatured && (
        <View style={s.scFeatured}>
          <Text style={s.scFeaturedTxt}>★</Text>
        </View>
      )}
      <View style={[s.scRank, { backgroundColor: r.bg }]}>
        <Text style={[s.scRankTxt, { color: r.text }]}>{hero.rank}</Text>
      </View>
      <Text style={s.scName} numberOfLines={1}>{hero.name}</Text>
      {isNew && (
        <View style={s.scNew}>
          <Text style={s.scNewTxt}>NEW</Text>
        </View>
      )}
    </View>
  );
};

// ── Main screen ───────────────────────────────────────────────────────────────
export default function SummonScreen({ navigation, route }) {
  const { width: W, height: H } = useWindowDimensions();
  const { top: topInset, bottom: bottomInset, left: leftInset, right: rightInset } = useSafeAreaInsets();
  // Per-property selectors — keeps pull-reveal animations free of unrelated re-renders
  const gems                     = useGameStore(s => s.gems);
  const spendGems                = useGameStore(s => s.spendGems);
  const addHero                  = useGameStore(s => s.addHero);
  const ownedHeroes              = useGameStore(s => s.ownedHeroes);
  const pity                     = useGameStore(s => s.pity);
  const setPity                  = useGameStore(s => s.setPity);
  const trackQuestProgress       = useGameStore(s => s.trackQuestProgress);
  const addToPullHistory         = useGameStore(s => s.addToPullHistory);
  const trackAchievementProgress = useGameStore(s => s.trackAchievementProgress);
  const eventPity                = useGameStore(s => s.eventPity);
  const setEventPity             = useGameStore(s => s.setEventPity);
  const eventGuarantee           = useGameStore(s => s.eventGuarantee);
  const setEventGuarantee        = useGameStore(s => s.setEventGuarantee);

  const [pullPhase,      setPullPhase]      = useState('banner');
  const [pullResults,    setPullResults]    = useState([]);
  const [revealCount,    setRevealCount]    = useState(0);
  const [isAnimating,    setIsAnimating]    = useState(false);
  const [allRevealed,    setAllRevealed]    = useState(false);
  const [selectedBanner, setSelectedBanner] = useState(() => {
    const openId = route?.params?.openBannerId;
    if (openId && getActiveEvents().some(e => e.id === openId)) return openId;
    return 'standard';
  });
  const [featuredIdx,  setFeaturedIdx]  = useState(0);
  const [showRates,    setShowRates]    = useState(false);
  const featFadeAnim = useRef(new Animated.Value(1)).current;

  const activeEvents    = getActiveEvents();
  const activeEvent     = activeEvents.find(e => e.id === selectedBanner) || null;
  const activePity      = activeEvent ? (eventPity[activeEvent.id] || 0) : pity;
  const activePityLimit = activeEvent ? (activeEvent.pityLimit || 80) : PITY_LIMIT;
  // true when the player has already lost the 50/50 on this event banner;
  // their next S pull is guaranteed to be the featured rate-up hero.
  const activeGuarantee = activeEvent ? (eventGuarantee[activeEvent.id] || false) : false;

  // ── Animated values ──────────────────────────────────────────────────────
  const transAnim   = useRef(new Animated.Value(0)).current;
  const flashWhite  = useRef(new Animated.Value(0)).current;
  const flashGold   = useRef(new Animated.Value(0)).current;
  const flashPurp   = useRef(new Animated.Value(0)).current;
  const shakeAnim   = useRef(new Animated.Value(0)).current;
  const tapHintAnim    = useRef(new Animated.Value(0)).current;
  const closeBtnOpacity = useRef(new Animated.Value(0)).current;

  // ── Video overlay animations ──────────────────────────────────────────────
  const videoFadeAnim      = useRef(new Animated.Value(1)).current;
  const cardOverlayScale   = useRef(new Animated.Value(0.3)).current;
  const cardOverlayOpacity = useRef(new Animated.Value(0)).current;

  const cardAnims = useRef(
    Array.from({ length: 10 }, () => ({
      slideY:  new Animated.Value(20),
      opacity: new Animated.Value(0),
      flip:    new Animated.Value(0),
      glow:    new Animated.Value(0),
      scale:   new Animated.Value(0.78),  // entrance bloom
    }))
  ).current;

  const sfxTimers       = useRef([]);
  const videoCardTimers = useRef([]);
  const videoEndedNaturally = useRef(false);
  // Synchronous double-tap guard — isAnimating is React state, so two taps
  // landing before the setIsAnimating(true) re-render commits both pass the
  // `isAnimating` check below and both run a full pull, silently overwriting
  // the first pull's in-flight reveal with the second's.
  const pullLockRef = useRef(false);
  useEffect(() => { if (!isAnimating) pullLockRef.current = false; }, [isAnimating]);

  const starYAnims = useRef(
    STARS.map(star => new Animated.Value(star.initPct * H))
  ).current;

  // ── Video player ─────────────────────────────────────────────────────────
  const videoPlayer         = useVideoPlayer(WISH_VIDEO);
  const pendingTagged       = useRef(null);
  const videoTransitioned   = useRef(false);
  const transitionToRevealRef = useRef(null);

  // Banner ambient animation loops removed — background stays static.

  // ── Star particles ────────────────────────────────────────────────────────
  useEffect(() => {
    let active = true;
    const runStar = (anim, star, fromY) => {
      if (!active) return;
      anim.setValue(fromY);
      Animated.timing(anim, {
        toValue: -30, duration: star.duration,
        easing: Easing.linear, useNativeDriver: true,
      }).start(({ finished }) => { if (finished && active) runStar(anim, star, H + 20); });
    };
    STARS.forEach((star, i) => runStar(starYAnims[i], star, star.initPct * H));
    return () => {
      active = false;
      starYAnims.forEach(a => a.stopAnimation());
    };
  }, []);

  // ── SFX timer cleanup on unmount ──────────────────────────────────────────
  useEffect(() => () => {
    sfxTimers.current.forEach(clearTimeout);
    videoCardTimers.current.forEach(clearTimeout);
  }, []);

  // ── Standard banner: auto-cycle featured S-rank heroes ────────────────────
  useEffect(() => {
    if (selectedBanner !== 'standard') {
      featFadeAnim.setValue(1);
      setFeaturedIdx(0);
      return;
    }
    const LIMIT = STANDARD_BANNER.featuredSRankIds.length;
    const t = setInterval(() => {
      Animated.timing(featFadeAnim, { toValue: 0, duration: 280, useNativeDriver: true }).start(() => {
        setFeaturedIdx(prev => (prev + 1) % LIMIT);
        Animated.timing(featFadeAnim, { toValue: 1, duration: 380, useNativeDriver: true }).start();
      });
    }, 3500);
    return () => clearInterval(t);
  }, [selectedBanner]);

  // ── Tap hint pulse ────────────────────────────────────────────────────────
  useEffect(() => {
    if (pullPhase !== 'reveal' || allRevealed || pullResults.length === 1) {
      if (pullPhase !== 'reveal') tapHintAnim.setValue(0);
      return;
    }
    let loop;
    const fadeIn = Animated.timing(tapHintAnim, { toValue: 1, duration: 280, useNativeDriver: true });
    fadeIn.start(({ finished }) => {
      if (!finished) return;
      loop = Animated.loop(Animated.sequence([
        Animated.timing(tapHintAnim, { toValue: 0.2, duration: 560, useNativeDriver: true }),
        Animated.timing(tapHintAnim, { toValue: 1,   duration: 560, useNativeDriver: true }),
      ]));
      loop.start();
    });
    return () => { fadeIn.stop(); loop?.stop(); };
  }, [pullPhase, allRevealed, pullResults.length]);

  // ── Auto-reveal single card after entrance animation settles ─────────────
  useEffect(() => {
    if (pullPhase === 'reveal' && pullResults.length === 1) {
      const t = setTimeout(() => doRevealCard(0), 500);
      return () => clearTimeout(t);
    }
  }, [pullPhase]);

  // ── Detect all-revealed; crossfade bar, then activate results ────────────
  useEffect(() => {
    if (pullPhase === 'reveal' && revealCount > 0 && revealCount === pullResults.length) {
      // Crossfade: tap hint fades out, close button fades in
      Animated.parallel([
        Animated.timing(tapHintAnim,    { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.timing(closeBtnOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
      setAllRevealed(true);
      if (pullResults.length > 1) {
        const t = setTimeout(() => setPullPhase('results'), 420);
        return () => clearTimeout(t);
      }
    }
  }, [revealCount, pullResults.length, pullPhase]);

  // ── Rank effects ──────────────────────────────────────────────────────────
  const doShake = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue:  9, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -9, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue:  6, duration: 45, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 45, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue:  3, duration: 35, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue:  0, duration: 35, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  const doFlashGold = useCallback(() => {
    Animated.sequence([
      Animated.timing(flashGold, { toValue: 1, duration: 80,  useNativeDriver: true }),
      Animated.timing(flashGold, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [flashGold]);

  const doFlashPurp = useCallback(() => {
    Animated.sequence([
      Animated.timing(flashPurp, { toValue: 1, duration: 80,  useNativeDriver: true }),
      Animated.timing(flashPurp, { toValue: 0, duration: 480, useNativeDriver: true }),
    ]).start();
  }, [flashPurp]);

  const switchFeatured = useCallback((idx) => {
    Animated.timing(featFadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setFeaturedIdx(idx);
      Animated.timing(featFadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    });
  }, [featFadeAnim]);

  // ── Card reveal ───────────────────────────────────────────────────────────
  const doRevealCard = useCallback((idx) => {
    if (idx >= pullResults.length) return;
    const ca = cardAnims[idx];
    const hero = pullResults[idx].hero;
    setIsAnimating(true);
    AudioManager.playCardFlipSFX();

    Animated.sequence([
      Animated.timing(ca.flip, {
        toValue: 0.5, duration: 175,
        easing: Easing.in(Easing.quad), useNativeDriver: true,
      }),
      Animated.timing(ca.flip, {
        toValue: 1, duration: 235,
        easing: Easing.out(Easing.back(1.4)), useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.sequence([
        Animated.timing(ca.glow, { toValue: 1,    duration: 140, useNativeDriver: true }),
        Animated.timing(ca.glow, { toValue: 0.55, duration: 600, useNativeDriver: true }),
      ]).start();
      if (hero.rank === 'S')      { doShake(); doFlashGold(); }
      else if (hero.rank === 'A') { doFlashPurp(); }
      setRevealCount(c => c + 1);
      setIsAnimating(false);
    });
  }, [cardAnims, pullResults, doShake, doFlashGold, doFlashPurp]);

  const doRevealAll = useCallback(() => {
    const pending = [];
    for (let i = revealCount; i < pullResults.length; i++) pending.push(i);
    if (!pending.length) return;
    setIsAnimating(true);

    const hasS = pending.some(i => pullResults[i].hero.rank === 'S');
    const hasA = pending.some(i => pullResults[i].hero.rank === 'A');

    sfxTimers.current.forEach(clearTimeout);
    sfxTimers.current = pending.map((_, order) =>
      setTimeout(() => AudioManager.playCardFlipSFX(), order * 85)
    );

    Animated.parallel(
      pending.map((idx, order) => {
        const ca = cardAnims[idx];
        return Animated.sequence([
          Animated.delay(order * 85),
          Animated.sequence([
            Animated.timing(ca.flip, { toValue: 0.5, duration: 140, easing: Easing.in(Easing.quad),       useNativeDriver: true }),
            Animated.timing(ca.flip, { toValue: 1,   duration: 190, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
          ]),
        ]);
      })
    ).start(() => {
      pending.forEach(i =>
        Animated.timing(cardAnims[i].glow, { toValue: 0.55, duration: 200, useNativeDriver: true }).start()
      );
      if (hasS) doFlashGold(); else if (hasA) doFlashPurp();
      setRevealCount(pullResults.length);
      setIsAnimating(false);
    });
  }, [revealCount, pullResults, cardAnims, doFlashGold, doFlashPurp]);

  // ── Reveal transition ─────────────────────────────────────────────────────
  // White flash hides the cut in both natural-end and skip paths, so any
  // positional difference between the video card overlay and the reveal grid
  // is invisible to the user.
  const transitionToReveal = useCallback(() => {
    if (videoTransitioned.current) return;
    videoTransitioned.current = true;

    const tagged = pendingTagged.current;
    if (!tagged) return;

    videoCardTimers.current.forEach(clearTimeout);
    videoCardTimers.current = [];
    videoEndedNaturally.current = false;

    cardAnims.forEach(ca => {
      ca.flip.setValue(0); ca.glow.setValue(0);
      ca.slideY.setValue(20); ca.opacity.setValue(0); ca.scale.setValue(0.78);
    });

    Animated.timing(flashWhite, { toValue: 1, duration: 60, useNativeDriver: true }).start(() => {
      try { videoPlayer.pause(); } catch (_) {}
      videoTransitioned.current = false;
      setPullPhase('reveal');

      Animated.parallel([
        Animated.timing(flashWhite, {
          toValue: 0, duration: 720,
          easing: Easing.out(Easing.quad), useNativeDriver: true,
        }),
        Animated.parallel(
          tagged.map((_, idx) => Animated.sequence([
            Animated.delay(idx * 52),
            Animated.parallel([
              Animated.timing(cardAnims[idx].slideY, {
                toValue: 0, duration: 340,
                easing: Easing.out(Easing.back(1.05)),
                useNativeDriver: true,
              }),
              Animated.timing(cardAnims[idx].opacity, {
                toValue: 1, duration: 260, useNativeDriver: true,
              }),
              Animated.spring(cardAnims[idx].scale, {
                toValue: 1, friction: 7, tension: 100, useNativeDriver: true,
              }),
            ]),
          ]))
        ),
      ]).start(() => setIsAnimating(false));
    });
  }, [videoPlayer, cardAnims, flashWhite]);

  // Keep ref in sync so the video-end listener never goes stale
  useEffect(() => { transitionToRevealRef.current = transitionToReveal; }, [transitionToReveal]);

  // Video ended → go to reveal automatically (natural-end path)
  useEffect(() => {
    const sub = videoPlayer.addListener('playToEnd', () => {
      videoEndedNaturally.current = true;
      transitionToRevealRef.current?.();
    });
    return () => sub.remove();
  }, [videoPlayer]);

  // ── Video skip handler ────────────────────────────────────────────────────
  const handleVideoSkip = useCallback(() => {
    videoCardTimers.current.forEach(clearTimeout);
    videoCardTimers.current = [];
    transitionToReveal();
  }, [transitionToReveal]);

  // ── Pull trigger ──────────────────────────────────────────────────────────
  const doPull = useCallback((count) => {
    if (pullLockRef.current) return;
    const cost = count === 1 ? SINGLE_COST : MULTI_COST;
    if (gems < cost || isAnimating) return;
    if (!spendGems(cost)) return;
    pullLockRef.current = true;
    setIsAnimating(true);
    AudioManager.playButtonSFX();

    const rateUpIds = activeEvent ? (activeEvent.rateUpHeroIds || []) : [];
    const { results: summonResults, newPity, newGuaranteed } = performSummon(
      count, activePity, rateUpIds, activeGuarantee, activePityLimit,
    );
    const ownedSet   = new Set(ownedHeroes);
    const seenInPull = new Set();
    const tagged = summonResults.map(({ hero, isPity: wasPity, isFeatured }) => {
      const isNew = !ownedSet.has(hero.id) && !seenInPull.has(hero.id);
      seenInPull.add(hero.id);
      return { hero, isNew, isPity: wasPity, isFeatured };
    });
    summonResults.forEach(r => addHero(r.hero.id));

    // Update pity counter and guarantee flag for the active banner
    if (activeEvent) {
      setEventPity(activeEvent.id, newPity);
      setEventGuarantee(activeEvent.id, newGuaranteed);
    } else {
      setPity(newPity);
    }

    // Quest + achievement tracking
    trackQuestProgress('hero_summon');
    trackAchievementProgress('totalSummons', count);
    trackAchievementProgress('gemsSpent', cost);

    // Track S-rank acquisitions for achievements
    const newSRanks = tagged.filter(t => t.isNew && t.hero.rank === 'S').length;
    if (newSRanks > 0) trackAchievementProgress('sRanksOwned', newSRanks);

    // Record pull history
    addToPullHistory(tagged.map(t => ({
      heroId:     t.hero.id,
      heroName:   t.hero.name,
      rank:       t.hero.rank,
      isPity:     t.isPity,
      isFeatured: t.isFeatured,
      bannerType: activeEvent ? activeEvent.id : 'standard',
    })));

    setPullResults(tagged);
    setRevealCount(0);
    setAllRevealed(false);
    pendingTagged.current = tagged;
    videoTransitioned.current = false;

    // Play wish animation video first, then transition to reveal
    videoPlayer.replay();
    setPullPhase('video');

    // Reset video overlay animations and bar state
    videoFadeAnim.setValue(1);
    cardOverlayScale.setValue(0.3);
    cardOverlayOpacity.setValue(0);
    tapHintAnim.setValue(0);
    closeBtnOpacity.setValue(0);
    videoEndedNaturally.current = false;
    videoCardTimers.current.forEach(clearTimeout);

    // At 7s: card(s) emerge from center over the still-playing video
    const vt1 = setTimeout(() => {
      Animated.parallel([
        Animated.spring(cardOverlayScale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
        Animated.timing(cardOverlayOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]).start();
    }, 7000);

    // At 8.5s: video fades out as cards remain
    const vt2 = setTimeout(() => {
      Animated.timing(videoFadeAnim, { toValue: 0, duration: 1500, useNativeDriver: true }).start();
    }, 8500);

    videoCardTimers.current = [vt1, vt2];
  }, [
    gems, isAnimating, spendGems, pity, ownedHeroes, addHero, videoPlayer,
    activeEvent, activePity, activeGuarantee, activePityLimit,
    setEventPity, setEventGuarantee,
    trackQuestProgress, trackAchievementProgress, addToPullHistory,
  ]);

  const handleRevealTap = useCallback(() => {
    if (isAnimating || pullResults.length === 1) return;
    if (revealCount < pullResults.length) doRevealAll();
  }, [isAnimating, pullResults.length, revealCount, doRevealAll]);

  const closeToBanner = useCallback(() => {
    Animated.timing(transAnim, { toValue: 0.75, duration: 180, useNativeDriver: true }).start(() => {
      setPullPhase('banner');
      setPullResults([]);
      setRevealCount(0);
      setAllRevealed(false);
      tapHintAnim.setValue(0);
      closeBtnOpacity.setValue(0);
      Animated.timing(transAnim, { toValue: 0, duration: 280, useNativeDriver: true }).start();
    });
  }, [transAnim]);

  // ── Render: star particles ────────────────────────────────────────────────
  const renderStars = () =>
    STARS.map((star, i) => (
      <Animated.View
        key={star.id}
        pointerEvents="none"
        style={[
          s.starDot,
          {
            left:    star.xPct * W,
            width:   star.size,
            height:  star.size,
            borderRadius: star.size / 2,
            opacity: star.opacity,
            transform: [{ translateY: starYAnims[i] }],
          },
        ]}
      />
    ));

  // ── Render: single reveal card ────────────────────────────────────────────
  const renderCard = (item, idx, cardW, cardH) => {
    const ca = cardAnims[idx];
    const r  = RANK[item.hero.rank];
    const isSingle = pullResults.length === 1;

    const flipScaleX = ca.flip.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0.01, 1] });
    const backOp     = ca.flip.interpolate({ inputRange: [0, 0.45, 0.5, 1], outputRange: [1, 1, 0, 0] });
    const frontOp    = ca.flip.interpolate({ inputRange: [0, 0.49, 0.5, 1], outputRange: [0, 0, 1, 1] });

    return (
      <Animated.View
        key={idx}
        style={{
          transform: [
            { translateY: ca.slideY },
            { scale: ca.scale },      // entrance bloom (0.78 → 1.0)
            { scaleX: flipScaleX },   // card flip deformation (applied after)
          ],
          opacity: ca.opacity,
        }}
      >
        <View style={{ width: cardW, height: cardH }}>
          {/* Back face */}
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: backOp }]}>
            <CardBack width={cardW} height={cardH} />
          </Animated.View>
          {/* Front face */}
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: frontOp }]}>
            {isSingle
              ? <HeroCard hero={item.hero} width={cardW} />
              : <SmallCardFront hero={item.hero} isNew={item.isNew} isFeatured={item.isFeatured} width={cardW} />
            }
          </Animated.View>
          {/* Rank glow ring */}
          <Animated.View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, { borderRadius: rs(8), borderWidth: 2.5, borderColor: r.glow, opacity: ca.glow }]}
          />
        </View>

        {/* Badges below card (single mode only) */}
        {isSingle && item.isFeatured && (
          <Animated.View style={[s.singleFeatured, { opacity: frontOp }]}>
            <Text style={s.singleFeaturedTxt}>★ FEATURED HERO ★</Text>
          </Animated.View>
        )}
        {isSingle && item.isNew && (
          <Animated.View style={[s.singleNew, { opacity: frontOp }]}>
            <Text style={s.singleNewTxt}>✦ NEW HERO UNLOCKED ✦</Text>
          </Animated.View>
        )}
      </Animated.View>
    );
  };

  // ── Render: card grid (shared by reveal + results) ─────────────────────────
  const renderCardGrid = (cardW, cardH) => {
    const isSingle = pullResults.length === 1;
    if (isSingle) {
      return (
        <View style={s.singleArea}>
          {pullResults.length > 0 && renderCard(pullResults[0], 0, cardW, cardH)}
        </View>
      );
    }
    return (
      <View style={s.tenGrid}>
        <View style={s.tenRow}>
          {pullResults.slice(0, 5).map((item, idx) => renderCard(item, idx, cardW, cardH))}
        </View>
        {pullResults.length > 5 && (
          <View style={s.tenRow}>
            {pullResults.slice(5, 10).map((item, idx) => renderCard(item, idx + 5, cardW, cardH))}
          </View>
        )}
      </View>
    );
  };

  // ── Phase: video ─────────────────────────────────────────────────────────
  const renderVideo = () => {
    const isSingle = pullResults.length === 1;
    const cardW = isSingle ? ONE_CW : TEN_CW;
    const cardH = isSingle ? ONE_CH : TEN_CH;
    const firstRow  = pullResults.slice(0, 5);
    const secondRow = pullResults.slice(5, 10);

    return (
      <TouchableWithoutFeedback onPress={handleVideoSkip}>
        <View style={StyleSheet.absoluteFill}>
          {/* Video fades out as card overlay appears */}
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: videoFadeAnim }]}>
            <VideoView
              player={videoPlayer}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              nativeControls={false}
            />
          </Animated.View>

          {/* Card(s) emerge from center before video ends */}
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              {
                alignItems: 'center',
                justifyContent: 'center',
                transform: [{ scale: cardOverlayScale }],
                opacity: cardOverlayOpacity,
              },
            ]}
          >
            {isSingle ? (
              <CardBack width={cardW} height={cardH} />
            ) : (
              <View style={{ gap: rs(10) }}>
                <View style={{ flexDirection: 'row', gap: rs(8) }}>
                  {firstRow.map((_, i) => <CardBack key={i} width={cardW} height={cardH} />)}
                </View>
                {secondRow.length > 0 && (
                  <View style={{ flexDirection: 'row', gap: rs(8) }}>
                    {secondRow.map((_, i) => <CardBack key={i + 5} width={cardW} height={cardH} />)}
                  </View>
                )}
              </View>
            )}
          </Animated.View>

          <View style={s.videoSkipRow} pointerEvents="none">
            <Text style={s.videoSkipTxt}>TAP TO SKIP  ›</Text>
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
  };

  // ── Phase: banner ─────────────────────────────────────────────────────────
  const renderBanner = () => {
    const standardSHeroes = STANDARD_BANNER.featuredSRankIds.map(id => HEROES.find(h => h.id === id)).filter(Boolean);
    // Lower pools follow the rate tables — every hero of each rank whose base
    // rate is above zero on that banner, best rank first.
    const lowerPoolFor = (rates) => {
      const ranks = ['A', 'B', 'C'].filter(r => rates[r] > 0);
      return {
        ranks,
        heroes: ranks.flatMap(r => HEROES.filter(h => h.rank === r && !h.shopExclusive)),
      };
    };
    const standardLower = lowerPoolFor(STANDARD_RATES);
    const eventLower    = lowerPoolFor(EVENT_RATES);
    const feat     = activeEvent
      ? (HEROES.find(h => h.id === activeEvent.featuredHeroId) || FEATURED)
      : (standardSHeroes[featuredIdx] || FEATURED);
    const pityPct  = Math.min(activePity / activePityLimit, 1);
    const leftColW = CARD_W + BODY_PAD * 2;

    return (
      <View style={{ flex: 1 }}>
        {/* ── Banner tabs (standard + active events) ─────────────────────── */}
        {activeEvents.length > 0 && (
          <View style={s.bannerTabs}>
            <TouchableOpacity
              style={[s.bannerTab, selectedBanner === 'standard' && s.bannerTabActive]}
              onPress={() => setSelectedBanner('standard')}
              activeOpacity={0.8}
            >
              <Text style={[s.bannerTabTxt, selectedBanner === 'standard' && s.bannerTabTxtActive]}>
                STANDARD
              </Text>
            </TouchableOpacity>
            {activeEvents.map(ev => (
              <TouchableOpacity
                key={ev.id}
                style={[s.bannerTab, selectedBanner === ev.id && s.bannerTabActive, { borderColor: ev.accentColor }]}
                onPress={() => setSelectedBanner(ev.id)}
                activeOpacity={0.8}
              >
                <View style={[s.bannerTabDot, { backgroundColor: ev.accentColor }]} />
                <Text style={[s.bannerTabTxt, selectedBanner === ev.id && { color: ev.accentColor }]}
                  numberOfLines={1}
                >
                  {ev.name.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={[s.bannerLayout, { flex: 1 }]}>
        <LinearGradient colors={C.GRAD_BG} style={StyleSheet.absoluteFill} />

        {/* LEFT: HeroCard (fades when cycling on standard banner) */}
        <View style={[s.bannerLeft, { width: leftColW }]}>
          <Animated.View style={{ opacity: selectedBanner === 'standard' ? featFadeAnim : 1 }}>
            <HeroCard hero={feat} width={CARD_W} />
          </Animated.View>
          {selectedBanner === 'standard' && (
            <View style={s.featDots}>
              {standardSHeroes.map((_, i) => (
                <TouchableOpacity key={i} onPress={() => switchFeatured(i)} activeOpacity={0.7}>
                  <View style={[s.featDot, i === featuredIdx && s.featDotActive]} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* RIGHT: 2 sub-columns */}
        <View style={s.bannerRight}>

          {/* Sub-columns row */}
          <View style={s.bannerSubCols}>

            {/* Info col: rates + pity */}
            <View style={s.bannerInfoCol}>
              {selectedBanner === 'standard' ? (
                <View style={s.infoCard}>
                  <Text style={s.infoCardTitle}>FEATURED POOL</Text>
                  <Text style={s.featSectionLabel}>S RANK</Text>
                  <View style={s.featMinis}>
                    {standardSHeroes.map((h, i) => (
                      <TouchableOpacity
                        key={h.id}
                        style={[s.featMiniS, { borderColor: i === featuredIdx ? RANK[h.rank].glow : RANK[h.rank].glow + '44' }]}
                        onPress={() => switchFeatured(i)}
                        activeOpacity={0.8}
                      >
                        <Image source={h.image} style={s.featMiniImg} />
                        {i === featuredIdx && (
                          <View pointerEvents="none" style={[StyleSheet.absoluteFill, s.featMiniActiveRing, { borderColor: RANK[h.rank].glow }]} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text style={[s.featSectionLabel, { marginTop: rs(6) }]}>{standardLower.ranks.join(' / ')} RANK  ·  ALL {standardLower.heroes.length} HEROES</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.featMinisScroll}>
                    {standardLower.heroes.map(h => (
                      <View key={h.id} style={[s.featMiniAB, { borderColor: RANK[h.rank].glow + '55' }]}>
                        <Image source={h.image} style={s.featMiniImg} />
                        <View style={[s.featMiniRankBadge, { backgroundColor: RANK[h.rank].bg }]}>
                          <Text style={[s.featMiniRankTxt, { color: RANK[h.rank].text }]}>{h.rank}</Text>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              ) : (
                <View style={s.infoCard}>
                  <Text style={s.infoCardTitle}>FEATURED POOL</Text>
                  <Text style={s.featSectionLabel}>S RANK  ·  RATE UP</Text>
                  <View style={s.featMinis}>
                    {(activeEvent?.rateUpHeroIds ?? []).map(id => {
                      const h = HEROES.find(hero => hero.id === id);
                      if (!h) return null;
                      return (
                        <View key={h.id} style={[s.featMiniS, { borderColor: RANK[h.rank].glow }]}>
                          <Image source={h.image} style={s.featMiniImg} />
                          <View pointerEvents="none" style={[StyleSheet.absoluteFill, s.featMiniActiveRing, { borderColor: RANK[h.rank].glow }]} />
                        </View>
                      );
                    })}
                  </View>
                  <Text style={[s.featSectionLabel, { marginTop: rs(6) }]}>{eventLower.ranks.join(' / ')} RANK  ·  ALL {eventLower.heroes.length} HEROES</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.featMinisScroll}>
                    {eventLower.heroes.map(h => (
                      <View key={h.id} style={[s.featMiniAB, { borderColor: RANK[h.rank].glow + '55' }]}>
                        <Image source={h.image} style={s.featMiniImg} />
                        <View style={[s.featMiniRankBadge, { backgroundColor: RANK[h.rank].bg }]}>
                          <Text style={[s.featMiniRankTxt, { color: RANK[h.rank].text }]}>{h.rank}</Text>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}

              <View style={s.infoCard}>
                <View style={s.pityHeader}>
                  <Text style={s.infoCardTitle}>PITY COUNTER</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: rs(5) }}>
                    {activePity >= Math.floor(activePityLimit * 0.78) && (
                      <View style={[s.pityWarnBadge, { backgroundColor: C.HP + '22', borderColor: C.HP }]}>
                        <Text style={[s.pityWarnTxt, { color: C.HP }]}>NEAR PITY</Text>
                      </View>
                    )}
                    <Text style={s.pityCount}>{activePity} / {activePityLimit}</Text>
                  </View>
                </View>
                <View style={s.pityBg}>
                  <View style={[s.pityFill, {
                    width: `${pityPct * 100}%`,
                    backgroundColor: activePity >= Math.floor(activePityLimit * 0.78) ? C.HP : C.PRIMARY_LIGHT,
                  }]} />
                </View>

                {/* 50/50 guarantee indicator — only shown on event banners */}
                {activeEvent && (
                  <View style={[
                    s.guaranteeRow,
                    activeGuarantee
                      ? { backgroundColor: C.GOLD + '18', borderColor: C.GOLD }
                      : { backgroundColor: C.PRIMARY + '12', borderColor: C.PRIMARY_LIGHT + '55' },
                  ]}>
                    <Text style={[
                      s.guaranteeTxt,
                      { color: activeGuarantee ? C.GOLD : C.TEXT_MUTED },
                    ]}>
                      {activeGuarantee ? '★ NEXT S: GUARANTEED FEATURED' : '◈ NEXT S: 50/50'}
                    </Text>
                  </View>
                )}

                <Text style={s.pityHint}>
                  {Math.floor(activePityLimit * 0.56)}+ pulls: S rate 8%  ·  {Math.floor(activePityLimit * 0.78)}+ pulls: S rate 15%{'\n'}
                  {activeEvent
                    ? `Featured hero guaranteed within ${activePityLimit} pulls`
                    : `Guaranteed S-Rank at ${activePityLimit} pulls`}
                </Text>
              </View>
            </View>

            {/* Buttons col: banner name + wish×1 + wish×10 */}
            <View style={s.bannerBtnCol}>

              {/* Banner name + type label */}
              <View style={s.btnColHeader}>
                <Text style={[s.btnColBannerName, { color: activeEvent ? activeEvent.accentColor : C.PRIMARY_LIGHT }]} numberOfLines={1}>
                  {activeEvent ? activeEvent.name.toUpperCase() : 'TEMPORAL NEXUS'}
                </Text>
                <View style={s.bannerLimitedRow}>
                  <View style={[s.limitedDot, { backgroundColor: activeEvent ? activeEvent.accentColor : C.GOLD }]} />
                  <Text style={[s.bannerLimitedTxt, { color: activeEvent ? activeEvent.accentColor : C.GOLD }]}>
                    {activeEvent ? 'LIMITED BANNER' : 'STANDARD BANNER'}
                  </Text>
                  <View style={[s.limitedDot, { backgroundColor: activeEvent ? activeEvent.accentColor : C.GOLD }]} />
                </View>
              </View>

              <OrnateWishBtn
                onPress={() => doPull(1)}
                disabled={gems < SINGLE_COST || isAnimating}
                borderCol={C.GOLD}
                gradColors={gems >= SINGLE_COST ? [C.PRIMARY_DARK, C.PRIMARY, C.SECONDARY] : [C.BG_MID, C.BG_BASE]}
                label="WISH ×1"
                costAmt={SINGLE_COST}
                canAfford={gems >= SINGLE_COST}
              />
              <OrnateWishBtn
                onPress={() => doPull(10)}
                disabled={gems < MULTI_COST || isAnimating}
                borderCol={C.PRIMARY_LIGHT}
                gradColors={gems >= MULTI_COST ? [C.BG_VOID, C.PRIMARY_DARK, C.SECONDARY_DARK] : [C.BG_MID, C.BG_BASE]}
                label="WISH ×10"
                sub="SAVE 50 GEMS"
                costAmt={MULTI_COST}
                canAfford={gems >= MULTI_COST}
              />
            </View>

          </View>
        </View>
        </View>
      </View>
    );
  };

  // ── Phase: reveal ─────────────────────────────────────────────────────────
  const renderReveal = () => {
    const isSingle = pullResults.length === 1;
    const cardW = isSingle ? ONE_CW : TEN_CW;
    const cardH = isSingle ? ONE_CH : TEN_CH;

    return (
      <TouchableWithoutFeedback onPress={handleRevealTap}>
        <Animated.View style={[s.revealWrap, { transform: [{ translateX: shakeAnim }] }]}>
          <LinearGradient colors={C.GRAD_VOID} style={StyleSheet.absoluteFill} />
          {renderStars()}

          {renderCardGrid(cardW, cardH)}

          {/* Bottom action bar — both elements fill the bar, crossfade via opacity */}
          <View style={s.revealBar}>
            {!isSingle && (
              <Animated.View style={[StyleSheet.absoluteFill, s.revealBarCenter, { opacity: tapHintAnim }]} pointerEvents="none">
                <Text style={s.tapHint}>TAP ANYWHERE TO REVEAL</Text>
              </Animated.View>
            )}
            {/* <Animated.View
              style={[StyleSheet.absoluteFill, s.revealBarCenter, { opacity: closeBtnOpacity }]}
              pointerEvents={allRevealed ? 'auto' : 'none'}
            >
              <TouchableOpacity onPress={closeToBanner} activeOpacity={0.85} style={s.closeBtn}>
                <Ionicons name="close" size={rs(26)} color={C.TEXT} />
              </TouchableOpacity>
            </Animated.View> */}
          </View>
        </Animated.View>
      </TouchableWithoutFeedback>
    );
  };

  // ── Phase: results ────────────────────────────────────────────────────────
  const renderResults = () => {
    const isSingle = pullResults.length === 1;
    const cardW = isSingle ? ONE_CW : TEN_CW;
    const cardH = isSingle ? ONE_CH : TEN_CH;

    return (
      <View style={s.resultsWrap}>
        <LinearGradient colors={C.GRAD_VOID} style={StyleSheet.absoluteFill} />
        {renderStars()}

        {renderCardGrid(cardW, cardH)}

        {/* Summary row */}
        <View style={s.summaryRow}>
          {/* Featured chip — S-rank rate-up heroes on event banners */}
          {(() => {
            const count = pullResults.filter(i => i.isFeatured).length;
            if (!count) return null;
            return (
              <View key="FEAT" style={[s.sumChip, { borderColor: C.GOLD }]}>
                <View style={[s.sumDot, { backgroundColor: C.GOLD }]}>
                  <Text style={[s.sumDotTxt, { color: RANK.SOVEREIGN.text, fontSize: rf(13) }]}>★</Text>
                </View>
                <Text style={[s.sumCount, { color: C.GOLD }]}>×{count}</Text>
              </View>
            );
          })()}
          {/* Sovereign chip — heroes with sovereign flag */}
          {(() => {
            const count = pullResults.filter(i => i.hero?.sovereign).length;
            if (!count) return null;
            const r = RANK.SOVEREIGN;
            return (
              <View key="SOV" style={[s.sumChip, { borderColor: r.glow }]}>
                <View style={[s.sumDot, { backgroundColor: r.bg }]}>
                  <Text style={[s.sumDotTxt, { color: r.text, fontSize: rf(13) }]}>SOV</Text>
                </View>
                <Text style={[s.sumCount, { color: r.glow }]}>×{count}</Text>
              </View>
            );
          })()}
          {['S', 'A', 'B', 'C'].map(rank => {
            const count = pullResults.filter(i => i.hero.rank === rank).length;
            if (!count) return null;
            const r = RANK[rank];
            return (
              <View key={rank} style={[s.sumChip, { borderColor: r.glow }]}>
                <View style={[s.sumDot, { backgroundColor: r.bg }]}>
                  <Text style={[s.sumDotTxt, { color: r.text }]}>{rank}</Text>
                </View>
                <Text style={[s.sumCount, { color: r.glow }]}>×{count}</Text>
              </View>
            );
          })}
        </View>

        {/* <TouchableOpacity onPress={closeToBanner} activeOpacity={0.85} style={s.closeBtn}>
          <Ionicons name="close" size={rs(26)} color={C.TEXT} />
        </TouchableOpacity> */}
      </View>
    );
  };

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <View style={[s.root, { paddingBottom: bottomInset, paddingLeft: leftInset, paddingRight: rightInset }]}>
      {/* Header */}
      <LinearGradient colors={C.GRAD_HEADER} style={[s.header, { paddingTop: topInset + 8 }]}>
        <TouchableOpacity
          onPress={pullPhase === 'banner' ? () => navigation.goBack() : closeToBanner}
          style={s.headerBack}
        >
          <Ionicons name={pullPhase === 'banner' ? 'chevron-back' : 'close'} size={rs(22)} color={C.TEXT} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>SUMMON</Text>
          <Text style={s.headerSub}>
            {pullPhase === 'banner'
              ? 'Call Heroes to Your Side'
              : pullPhase === 'reveal'
              ? 'Your Summon Results...'
              : 'Collected!'}
          </Text>
        </View>
        <View style={s.gemsChip}>
          <Image source={GEM_IMG} style={s.headerGemImg} />
          <Text style={s.gemsTxt}>{gems}</Text>
        </View>
        {pullPhase === 'banner' && (
          <TouchableOpacity
            onPress={() => setShowRates(true)}
            style={s.historyBtn}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="View summon rates and odds"
          >
            <Ionicons name="information-circle-outline" size={rs(22)} color={C.ICON_ON_DARK} />
          </TouchableOpacity>
        )}
        {pullPhase === 'banner' && (
          <TouchableOpacity
            onPress={() => navigation.navigate('PullHistory')}
            style={s.historyBtn}
            activeOpacity={0.75}
          >
            <Ionicons name="time-outline" size={rs(20)} color={C.ICON_ON_DARK} />
          </TouchableOpacity>
        )}
      </LinearGradient>

      {/* Phase content */}
      <View style={s.content}>
        {pullPhase === 'banner'  && renderBanner()}
        {(pullPhase === 'video' || pullPhase === 'reveal') && renderReveal()}
        {pullPhase === 'results' && renderResults()}
      </View>

      {/* Video phase — full-screen overlay (covers header too) */}
      {pullPhase === 'video' && (
        <View style={[StyleSheet.absoluteFill, s.videoOverlay]}>
          {renderVideo()}
        </View>
      )}

      {/* Global cinematic overlays */}
      <Animated.View pointerEvents="none" style={[s.overlay, { backgroundColor: C.BG_VOID,      opacity: transAnim  }]} />
      <Animated.View pointerEvents="none" style={[s.overlay, { backgroundColor: 'white',         opacity: flashWhite }]} />
      <Animated.View pointerEvents="none" style={[s.overlay, { backgroundColor: C.FLASH_GOLD,   opacity: flashGold  }]} />
      <Animated.View pointerEvents="none" style={[s.overlay, { backgroundColor: C.FLASH_PURPLE, opacity: flashPurp  }]} />

      {/* Rates / odds disclosure — required for App Store (3.1.1) & Google Play */}
      {showRates && (
        <View style={[StyleSheet.absoluteFill, s.ratesOverlay]}>
          <TouchableWithoutFeedback onPress={() => setShowRates(false)}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
          <View style={s.ratesCard}>
            <View style={s.ratesHeaderRow}>
              <Text style={s.ratesTitle}>SUMMON RATES</Text>
              <TouchableOpacity onPress={() => setShowRates(false)} style={s.ratesClose} accessibilityLabel="Close rates">
                <Ionicons name="close" size={rs(22)} color={C.TEXT} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={{ paddingBottom: rs(6) }}>
              <Text style={s.ratesSection}>
                Base probability — {activeEvent ? activeEvent.name : 'Standard banner'}
              </Text>
              {(() => {
                const rates = activeEvent ? EVENT_RATES : STANDARD_RATES;
                const noteFor = (rank) => rank === 'S'
                  ? (activeEvent ? '50% featured / 50% standard S pool' : 'the featured S heroes only')
                  : `all ${rank}-rank heroes`;
                return ['S', 'A', 'B', 'C'].filter(rank => rates[rank] > 0).map(rank => {
                  const rc = RANK[rank];
                  return (
                    <View key={rank} style={s.rateRow}>
                      <View style={[s.rateBadge, { backgroundColor: rc.bg }]}>
                        <Text style={[s.rateBadgeTxt, { color: rc.text }]}>{rank}</Text>
                      </View>
                      <Text style={s.ratePct}>{+(rates[rank] * 100).toFixed(1)}%</Text>
                      <Text style={s.rateNote}>{noteFor(rank)}</Text>
                    </View>
                  );
                });
              })()}

              <Text style={s.ratesSection}>Pity (guaranteed S-rank)</Text>
              <Text style={s.ratesBody}>• The S-rank chance rises to <Text style={s.ratesEm}>8%</Text> from pull 50 and <Text style={s.ratesEm}>15%</Text> from pull 70 ("soft pity").</Text>
              <Text style={s.ratesBody}>• An S-rank is <Text style={s.ratesEm}>guaranteed by pull 90</Text> on the standard banner and <Text style={s.ratesEm}>pull 80</Text> on event banners ("hard pity"). The counter carries over between summons and resets when you obtain an S-rank.</Text>

              <Text style={s.ratesSection}>Featured heroes</Text>
              <Text style={s.ratesBody}>• <Text style={s.ratesEm}>Event banner:</Text> each S-rank has a 50% chance to be the featured hero. If it is not, you receive one of the standard banner's featured S-rank heroes instead, and your <Text style={s.ratesEm}>next</Text> S-rank is guaranteed to be the featured hero.</Text>
              <Text style={s.ratesBody}>• <Text style={s.ratesEm}>Standard banner:</Text> S-rank summons come only from the featured S-rank heroes shown on the banner.</Text>

              <Text style={s.ratesFoot}>Probabilities are independent per summon. ×10 summons draw 10 times at these same rates.</Text>
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: C.BG_DEEP },
  content: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFill },
  videoOverlay: { zIndex: 100 },
  videoSkipRow: {
    position: 'absolute', bottom: rs(28), right: rs(24),
    backgroundColor: C.OVERLAY_MID,
    borderRadius: rs(20), paddingHorizontal: rs(16), paddingVertical: rs(7),
    borderWidth: 1, borderColor: C.GLASS_8,
  },
  videoSkipTxt: {
    color: C.ICON_ON_DARK, fontSize: rf(13),
    fontWeight: '700', letterSpacing: 1.5,
  },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: rs(12), paddingBottom: rs(10),
    borderBottomWidth: 1, borderBottomColor: C.GLASS_7,
  },
  headerBack:  { padding: rs(4), marginRight: rs(6) },
  headerTitle: { fontSize: rf(18), fontWeight: '900', color: C.TEXT, letterSpacing: 4 },
  headerSub:   { fontSize: rf(13), color: C.ICON_MUTED, marginTop: 1 },
  gemsChip: {
    flexDirection: 'row', alignItems: 'center', gap: rs(5),
    backgroundColor: C.GLASS_7, borderRadius: rs(14),
    paddingHorizontal: rs(10), paddingVertical: rs(5),
    borderWidth: 1, borderColor: C.GLASS_8,
  },
  gemsTxt:      { color: C.GOLD, fontSize: rf(14), fontWeight: '700' },
  headerGemImg: { width: rs(16), height: rs(16), resizeMode: 'contain' },

  // ── Rates / odds disclosure modal ───────────────────────────────────────────
  ratesOverlay: {
    backgroundColor: C.OVERLAY_4, alignItems: 'center', justifyContent: 'center',
    zIndex: 120, paddingHorizontal: rs(16),
  },
  ratesCard: {
    width: '100%', maxWidth: rs(520), maxHeight: '88%',
    backgroundColor: C.BG_CARD, borderRadius: rs(16),
    borderWidth: 1, borderColor: C.BORDER_STRONG,
    paddingHorizontal: rs(18), paddingTop: rs(14), paddingBottom: rs(16),
  },
  ratesHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: rs(8) },
  ratesTitle: { flex: 1, color: C.TEXT, fontSize: rf(15), fontWeight: '900', letterSpacing: 2 },
  ratesClose: { padding: rs(4) },
  ratesSection: {
    color: C.GOLD, fontSize: rf(13), fontWeight: '800', letterSpacing: 1.5,
    textTransform: 'uppercase', marginTop: rs(12), marginBottom: rs(6),
  },
  rateRow: { flexDirection: 'row', alignItems: 'center', gap: rs(10), paddingVertical: rs(3) },
  rateBadge: {
    width: rs(26), height: rs(22), borderRadius: rs(5), alignItems: 'center', justifyContent: 'center',
  },
  rateBadgeTxt: { fontSize: rf(12), fontWeight: '900' },
  ratePct: { color: C.TEXT, fontSize: rf(14), fontWeight: '800', minWidth: rs(42) },
  rateNote: { color: C.TEXT_MUTED, fontSize: rf(13), flex: 1 },
  ratesBody: { color: C.TEXT_SOFT, fontSize: rf(12.5), lineHeight: rf(18), marginBottom: rs(5) },
  ratesEm: { color: C.TEXT, fontWeight: '800' },
  ratesFoot: { color: C.TEXT_MUTED, fontSize: rf(13), lineHeight: rf(16), marginTop: rs(12), fontStyle: 'italic' },

  // ── Banner layout ──────────────────────────────────────────────────────────
  bannerLayout: { flex: 1, flexDirection: 'row' },

  bannerLeft: { overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  bannerCardWrap: { marginTop: rs(8) },

  // ── Button-column banner header ────────────────────────────────────────────
  btnColHeader: { alignItems: 'center', paddingBottom: rs(4) },
  btnColBannerName: {
    fontSize: rf(16), fontWeight: '900', letterSpacing: 3, textAlign: 'center',
    textShadowColor: C.OVERLAY_STRONG, textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
  bannerLimitedRow: { flexDirection: 'row', alignItems: 'center', gap: rs(7), marginTop: rs(4) },
  bannerLimitedTxt: { fontSize: rf(13), color: C.GOLD, fontWeight: '700', letterSpacing: 3 },
  limitedDot: { width: rs(4), height: rs(4), borderRadius: rs(2), backgroundColor: C.GOLD },

  // ── Right controls ─────────────────────────────────────────────────────────
  bannerRight: {
    flex: 1, flexDirection: 'column', paddingVertical: rs(10), paddingHorizontal: rs(8), gap: rs(8),
  },
  bannerSubCols: {
    flex: 1, flexDirection: 'row', gap: rs(8), alignItems: 'center',
  },
  bannerInfoCol: {
    flex: 1, gap: rs(8), justifyContent: 'center',
  },
  bannerBtnCol: {
    flex: 1, gap: rs(8), justifyContent: 'center',
  },

  infoCard: {
    borderRadius: rs(10), padding: rs(10),
    backgroundColor: C.GLASS_4,
    borderWidth: 1, borderColor: C.BORDER,
  },
  infoCardTitle: { fontSize: rf(12), fontWeight: '800', color: C.TEXT_MUTED, letterSpacing: 2, marginBottom: rs(6) },

  ratesRow:    { flexDirection: 'row', gap: rs(8) },
  rateItem:    { alignItems: 'center', gap: rs(3) },
  rateRankPill: { paddingHorizontal: rs(8), paddingVertical: rs(3), borderRadius: rs(4) },
  rateRankLbl: { fontSize: rf(13), fontWeight: '900' },

  pityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: rs(6) },
  pityCount:  { fontSize: rf(13), color: C.PRIMARY_LIGHT, fontWeight: '700' },
  pityBg:     { height: rs(5), backgroundColor: C.GLASS_6, borderRadius: rs(3), overflow: 'hidden' },
  pityFill:   { height: '100%', borderRadius: rs(3) },
  pityHint:     { fontSize: rf(13), color: C.TEXT_MUTED, marginTop: rs(5), fontStyle: 'italic' },
  pityWarnBadge:{ borderRadius: rs(4), paddingHorizontal: rs(5), paddingVertical: 1, borderWidth: 1 },
  pityWarnTxt:  { fontSize: rf(13), fontWeight: '900', letterSpacing: 0.5 },

  ornateDisabled: { opacity: 0.42 },
  ornateOuter:    { marginVertical: rs(10) },
  ornateGlowRing: {
    position: 'absolute', top: -5, left: -5, right: -5, bottom: -5,
    borderRadius: rs(13),
  },
  ornateBody: {
    height: rs(64), borderRadius: rs(8), overflow: 'hidden', borderWidth: 2,
  },
  ornateRail:    { position: 'absolute', left: rs(14), right: rs(14), height: 1 },
  ornateContent: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: rs(16), gap: rs(12) },
  ornateLabel: {
    fontSize: rf(14), fontWeight: '900', color: C.TEXT, letterSpacing: 2,
    textShadowColor: C.OVERLAY_STRONG, textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
  ornateSub:     { fontSize: rf(13), color: C.SUCCESS, fontWeight: '800', letterSpacing: 1, marginTop: 2 },
  ornateCostRow: { flexDirection: 'row', alignItems: 'center', gap: rs(4) },
  ornateCostTxt: { fontSize: rf(14), fontWeight: '800' },
  ornateDiamond: { position: 'absolute', width: rs(12), height: rs(12), transform: [{ rotate: '45deg' }] },
  ornateTL:      { top: -6, left: rs(10) },
  ornateTR:      { top: -6, right: rs(10) },
  ornateBL:      { bottom: -6, left: rs(10) },
  ornateBR:      { bottom: -6, right: rs(10) },
  ornateAccentRow: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  ornateAccentDot: { width: rs(10), height: rs(10), transform: [{ rotate: '45deg' }] },
  ornateParticle:  { position: 'absolute', bottom: rs(4), width: rs(4), height: rs(4), borderRadius: rs(2) },
  ornateGemImg:    { width: rs(18), height: rs(18), resizeMode: 'contain' },

  noGems: {
    flexDirection: 'row', alignItems: 'center', gap: rs(6),
    backgroundColor: C.DANGER + '18', borderRadius: rs(7), padding: rs(8),
    borderWidth: 1, borderColor: C.DANGER + '40',
  },
  noGemsTxt: { flex: 1, fontSize: rf(13), color: C.TEXT_SOFT, lineHeight: rf(14) },

  // ── Reveal / Results ───────────────────────────────────────────────────────
  revealWrap:  { flex: 1 },
  resultsWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  singleArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tenGrid: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: rs(10), paddingHorizontal: rs(12),
  },
  tenRow: { flexDirection: 'row', gap: rs(8) },

  revealBar: {
    height: REVEAL_BOT,
  },
  revealBarCenter: {
    alignItems: 'center', justifyContent: 'center',
  },
  tapHint: { fontSize: rf(12), color: C.ICON_ON_DARK, fontWeight: '700', letterSpacing: 3 },

  closeBtn: {
    width: rs(44), height: rs(44), borderRadius: rs(22),
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.GLASS_7,
    borderWidth: 1, borderColor: C.TEXT_ON_DARK_DIM,
  },

  summaryRow: {
    flexDirection: 'row', gap: rs(10), justifyContent: 'center',
    paddingVertical: rs(8),
  },
  sumChip: {
    flexDirection: 'row', alignItems: 'center', gap: rs(6),
    borderRadius: rs(8), borderWidth: 1.5,
    paddingHorizontal: rs(10), paddingVertical: rs(5),
    backgroundColor: C.GLASS_3,
  },
  sumDot: { width: rs(22), height: rs(22), borderRadius: rs(5), alignItems: 'center', justifyContent: 'center' },
  sumDotTxt: { fontSize: rf(13), fontWeight: '900' },
  sumCount:  { fontSize: rf(14), fontWeight: '700' },

  // ── Card back ──────────────────────────────────────────────────────────────
  cbCorner: { position: 'absolute', width: rs(10), height: rs(10), borderColor: C.GOLD, borderWidth: 1.5 },
  cbTL: { top: rs(5),  left: rs(5),  borderRightWidth: 0, borderBottomWidth: 0 },
  cbTR: { top: rs(5),  right: rs(5), borderLeftWidth:  0, borderBottomWidth: 0 },
  cbBL: { bottom: rs(5), left: rs(5),  borderRightWidth: 0, borderTopWidth: 0 },
  cbBR: { bottom: rs(5), right: rs(5), borderLeftWidth:  0, borderTopWidth: 0 },
  cbCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cbSymbol: { fontSize: rf(18), color: C.GOLD, marginBottom: rs(4), textShadowColor: C.GOLD, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 },
  cbWord:   { fontSize: rf(12), color: C.GOLD, fontWeight: '800', letterSpacing: 3, lineHeight: rf(13) },

  // ── Small card front (×10) ─────────────────────────────────────────────────
  scRank:    { position: 'absolute', top: rs(4), right: rs(4), paddingHorizontal: rs(4), paddingVertical: 2, borderRadius: rs(3) },
  scRankTxt: { fontSize: rf(12), fontWeight: '900' },
  scName: {
    position: 'absolute', bottom: rs(16), left: rs(4), right: rs(4),
    fontSize: rf(13), color: C.TEXT, fontWeight: '700', textAlign: 'center',
    textShadowColor: C.TEXT_SHADOW, textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3,
  },
  scNew:    { position: 'absolute', bottom: rs(4), left: rs(4), right: rs(4), alignItems: 'center' },
  scNewTxt: {
    fontSize: rf(13), color: C.SUCCESS, fontWeight: '900', letterSpacing: 0.5,
    textShadowColor: C.OVERLAY_MODAL, textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2,
  },
  scFeatured: {
    position: 'absolute', top: rs(4), left: rs(4),
    backgroundColor: C.GOLD + 'CC', borderRadius: rs(3),
    paddingHorizontal: rs(3), paddingVertical: 1,
  },
  scFeaturedTxt: { fontSize: rf(13), color: RANK.SOVEREIGN.text, fontWeight: '900' },

  // ── Single card badges ─────────────────────────────────────────────────────
  singleFeatured: {
    marginTop: rs(8), alignSelf: 'center',
    backgroundColor: C.GOLD + '22', borderRadius: rs(6),
    paddingHorizontal: rs(14), paddingVertical: rs(5),
    borderWidth: 1, borderColor: C.GOLD,
  },
  singleFeaturedTxt: { color: C.GOLD, fontSize: rf(13), fontWeight: '900', letterSpacing: 2 },
  singleNew: {
    marginTop: rs(6), alignSelf: 'center',
    backgroundColor: C.SUCCESS + '22', borderRadius: rs(6),
    paddingHorizontal: rs(14), paddingVertical: rs(5),
    borderWidth: 1, borderColor: C.SUCCESS,
  },
  singleNewTxt: { color: C.SUCCESS, fontSize: rf(13), fontWeight: '800', letterSpacing: 2 },

  // ── 50/50 guarantee row (pity card) ────────────────────────────────────────
  guaranteeRow: {
    marginTop: rs(6), borderRadius: rs(5), borderWidth: 1,
    paddingHorizontal: rs(8), paddingVertical: rs(4),
    alignItems: 'center',
  },
  guaranteeTxt: { fontSize: rf(13), fontWeight: '900', letterSpacing: 1 },

  // ── Star particle ──────────────────────────────────────────────────────────
  starDot: { position: 'absolute', backgroundColor: 'white' },

  // ── History button (header) ────────────────────────────────────────────────
  historyBtn: {
    marginLeft: rs(8), padding: rs(6),
    borderRadius: rs(8), backgroundColor: C.GLASS_6,
  },

  // ── Banner tabs ────────────────────────────────────────────────────────────
  bannerTabs: {
    flexDirection: 'row', gap: rs(6),
    paddingHorizontal: rs(10), paddingVertical: rs(6),
    backgroundColor: C.BG_DEEP,
    borderBottomWidth: 1, borderBottomColor: C.BORDER_SUBTLE,
  },
  bannerTab: {
    flexDirection: 'row', alignItems: 'center', gap: rs(5),
    paddingHorizontal: rs(12), paddingVertical: rs(5),
    borderRadius: rs(6), borderWidth: 1, borderColor: C.BORDER,
    backgroundColor: C.GLASS_3,
  },
  bannerTabActive: {
    backgroundColor: C.PRIMARY + '22',
    borderColor: C.PRIMARY_LIGHT,
  },
  bannerTabTxt: {
    fontSize: rf(12), fontWeight: '800', letterSpacing: 1.5,
    color: C.TEXT_MUTED,
  },
  bannerTabTxtActive: {
    color: C.PRIMARY_LIGHT,
  },
  bannerTabDot: {
    width: rs(6), height: rs(6), borderRadius: rs(3),
  },

  // ── Standard banner: featured pool ────────────────────────────────────────
  featDots:      { flexDirection: 'row', gap: rs(5), justifyContent: 'center', paddingTop: rs(5) },
  featDot:       { width: rs(5), height: rs(5), borderRadius: rs(3), backgroundColor: C.GLASS_5 },
  featDotActive: { width: rs(14), backgroundColor: C.PRIMARY_LIGHT },

  featSectionLabel: { fontSize: rf(13), fontWeight: '800', color: C.TEXT_MUTED, letterSpacing: 1.5, marginBottom: rs(4) },
  featMinis:        { flexDirection: 'row', gap: rs(5), flexWrap: 'wrap' },
  featMinisScroll:  { flexDirection: 'row', gap: rs(5), paddingRight: rs(4) },
  featMiniS: {
    width: rs(48), height: rs(48), borderRadius: rs(8), overflow: 'hidden', borderWidth: 2,
  },
  featMiniAB: {
    width: rs(32), height: rs(32), borderRadius: rs(5), overflow: 'hidden', borderWidth: 1.5,
  },
  featMiniImg:        { width: '100%', height: '100%' },
  featMiniActiveRing: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: rs(8), borderWidth: 2 },
  featMiniRankBadge:  { position: 'absolute', bottom: 1, right: 1, paddingHorizontal: 2, borderRadius: 2 },
  featMiniRankTxt:    { fontSize: rf(6), fontWeight: '900' },
});
