import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, Image, StyleSheet, TouchableOpacity, TouchableWithoutFeedback,
  Animated, Dimensions, Easing,
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
import FactionParticles from '../components/FactionParticles';

const WISH_VIDEO = require('../../assets/video/wish-animation.mp4');

const { width: W, height: H } = Dimensions.get('window');
const GEM_IMG = require('../../assets/currency/gem.png');
const bannerImg = require('../../assets/banner/summon-banner.jpg');

// ── Pull config ───────────────────────────────────────────────────────────────
const SINGLE_COST = 50;
const MULTI_COST  = 450;
const PITY_LIMIT  = 90;

const RANK_ODDS = [
  { rank: 'C', weight: 44 },
  { rank: 'B', weight: 30 },
  { rank: 'A', weight: 22 },
  { rank: 'S', weight: 4  },
];

// Base rates as fractions (out of 1) derived from RANK_ODDS weights (total = 100)
const BASE_S_RATE = 4  / 100; // 0.04
const BASE_A_RATE = 22 / 100; // 0.22
const BASE_B_RATE = 30 / 100; // 0.30
// BASE_C_RATE = 44/100 — C fills whatever probability remains

const pickRank = (pity) => {
  // pity is incremented AFTER each non-S draw, so after 89 failures pity === 89.
  // Checking >= PITY_LIMIT - 1 fires the guarantee on draw #90, not draw #91.
  if (pity >= PITY_LIMIT - 1) return 'S';

  // Soft pity: S rate ramps up at 50 and 70 pulls
  let sRate;
  if (pity >= 70) sRate = 0.15;
  else if (pity >= 50) sRate = 0.08;
  else sRate = BASE_S_RATE;

  const rand = Math.random();
  if (rand < sRate) return 'S';

  // Redistribute the remaining probability (1 - sRate) proportionally across A, B, C
  // using the original non-S total (1 - BASE_S_RATE = 0.96) as the reference.
  const nonSTotal = 1 - BASE_S_RATE; // 0.96
  const remaining = 1 - sRate;       // shrinks as soft pity kicks in
  const scale     = remaining / nonSTotal;

  const aRate = BASE_A_RATE * scale;
  const bRate = BASE_B_RATE * scale;

  if (rand < sRate + aRate) return 'A';
  if (rand < sRate + aRate + bRate) return 'B';
  return 'C';
};

// ownedSet filters the sovereign pool so already-owned sovereigns aren't re-rolled.
// When the unowned sovereign pool is empty (player owns all), the 20% proc is folded
// directly into the regular S draw — the effective S-rank rate stays unchanged.
const performSummon = (count, currentPity, ownedSet = new Set()) => {
  const heroes = [];
  let pity = currentPity;
  for (let i = 0; i < count; i++) {
    const rank = pickRank(pity);
    if (rank === 'S') pity = 0; else pity++;
    let pool;
    if (rank === 'S') {
      const sovereignPool = HEROES.filter(h => h.rank === 'S' && h.sovereign && !ownedSet.has(h.id));
      const regularPool   = HEROES.filter(h => h.rank === 'S' && !h.sovereign);
      pool = (sovereignPool.length > 0 && Math.random() < 0.20)
        ? sovereignPool
        : (regularPool.length ? regularPool : HEROES.filter(h => h.rank === 'S'));
    } else {
      pool = HEROES.filter(h => h.rank === rank);
    }
    heroes.push(pool[Math.floor(Math.random() * pool.length)]);
  }
  return { heroes, newPity: pity };
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
  <View style={{ width, height, borderRadius: 8, overflow: 'hidden' }}>
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
            colors={['rgba(255,255,255,0.26)', 'rgba(255,255,255,0.06)', 'transparent']}
            start={{ x: 0, y: 0 }} end={{ x: 0.65, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {/* Bottom depth shadow */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.32)']}
            start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 22 }}
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

const SmallCardFront = ({ hero, isNew, width }) => {
  const r = RANK[hero.rank];
  const height = Math.floor(width * 320 / 220);
  return (
    <View style={{ width, height, borderRadius: 8, overflow: 'hidden' }}>
      <Image source={hero.image} style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]} resizeMode="cover" />
      <LinearGradient
        colors={['transparent', 'transparent', 'rgba(0,0,0,0.88)']}
        style={StyleSheet.absoluteFill}
      />
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
export default function SummonScreen({ navigation }) {
  const { top: topInset, bottom: bottomInset, left: leftInset, right: rightInset } = useSafeAreaInsets();
  const { gems, spendGems, addHero, ownedHeroes, pity, setPity, trackQuestProgress } = useGameStore();

  const [pullPhase,   setPullPhase]   = useState('banner');
  const [pullResults, setPullResults] = useState([]);
  const [revealCount, setRevealCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [allRevealed, setAllRevealed] = useState(false);

  // ── Animated values ──────────────────────────────────────────────────────
  const transAnim   = useRef(new Animated.Value(0)).current;
  const flashWhite  = useRef(new Animated.Value(0)).current;
  const flashGold   = useRef(new Animated.Value(0)).current;
  const flashPurp   = useRef(new Animated.Value(0)).current;
  const shakeAnim   = useRef(new Animated.Value(0)).current;
  const tapHintAnim = useRef(new Animated.Value(1)).current;
  const borderPulse = useRef(new Animated.Value(0)).current;
  const shimmerX    = useRef(new Animated.Value(-160)).current;

  const cardAnims = useRef(
    Array.from({ length: 10 }, () => ({
      slideY:  new Animated.Value(20),
      opacity: new Animated.Value(0),
      flip:    new Animated.Value(0),
      glow:    new Animated.Value(0),
      scale:   new Animated.Value(0.78),  // entrance bloom
    }))
  ).current;

  const sfxTimers = useRef([]);   // tracked so they can be cancelled on unmount

  const starYAnims = useRef(
    STARS.map(star => new Animated.Value(star.initPct * H))
  ).current;

  // ── Video player ─────────────────────────────────────────────────────────
  const videoPlayer         = useVideoPlayer(WISH_VIDEO);
  const pendingTagged       = useRef(null);
  const videoTransitioned   = useRef(false);
  const transitionToRevealRef = useRef(null);

  // ── Banner ambient loops ─────────────────────────────────────────────────
  useEffect(() => {
    const bLoop = Animated.loop(Animated.sequence([
      Animated.timing(borderPulse, { toValue: 1,   duration: 1800, useNativeDriver: true }),
      Animated.timing(borderPulse, { toValue: 0.3, duration: 1800, useNativeDriver: true }),
    ]));
    const sLoop = Animated.loop(Animated.sequence([
      Animated.timing(shimmerX, {
        toValue: W * 0.56, duration: 2800,
        easing: Easing.linear, useNativeDriver: true,
      }),
      Animated.delay(1800),
      Animated.timing(shimmerX, { toValue: -160, duration: 0, useNativeDriver: true }),
    ]));
    bLoop.start();
    sLoop.start();
    return () => { bLoop.stop(); sLoop.stop(); };
  }, []);

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
  useEffect(() => () => sfxTimers.current.forEach(clearTimeout), []);

  // ── Tap hint pulse ────────────────────────────────────────────────────────
  useEffect(() => {
    if (pullPhase !== 'reveal' || allRevealed || pullResults.length === 1) {
      tapHintAnim.setValue(1);
      return;
    }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(tapHintAnim, { toValue: 0.2, duration: 560, useNativeDriver: true }),
      Animated.timing(tapHintAnim, { toValue: 1,   duration: 560, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [pullPhase, allRevealed, pullResults.length]);

  // ── Auto-reveal single card after entrance animation settles ─────────────
  useEffect(() => {
    if (pullPhase === 'reveal' && pullResults.length === 1) {
      const t = setTimeout(() => doRevealCard(0), 500);
      return () => clearTimeout(t);
    }
  }, [pullPhase]);

  // ── Detect all-revealed; activate results screen for multi-pulls ──────────
  useEffect(() => {
    if (pullPhase === 'reveal' && revealCount > 0 && revealCount === pullResults.length) {
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

  // ── Reveal transition (called after video ends or skip tap) ──────────────
  //
  // Design: the transition is a single unbroken motion:
  //   1. Flash builds to full white in 60 ms — summon energy peak; video still
  //      playing underneath but hidden behind the growing brightness.
  //   2. At peak: video pauses and phase switches to 'reveal' — completely
  //      hidden from the user because the screen is solid white.
  //   3. Flash fades slowly (720 ms, eased out) AND cards bloom in at the same
  //      time — the cards appear to materialise out of the dissolving light.
  //
  // There is no separate void/dark overlay step. transAnim is NOT used here so
  // there is no mid-sequence dark frame that breaks the visual continuity.
  const transitionToReveal = useCallback(() => {
    if (videoTransitioned.current) return;
    videoTransitioned.current = true;

    const tagged = pendingTagged.current;
    if (!tagged) return;

    // Pre-position cards: slightly below centre and scaled down — they will
    // emerge upward and bloom outward as the flash dissolves.
    cardAnims.forEach(ca => {
      ca.flip.setValue(0); ca.glow.setValue(0);
      ca.slideY.setValue(20); ca.opacity.setValue(0); ca.scale.setValue(0.78);
    });

    // Step 1 — quick energy burst to solid white
    Animated.timing(flashWhite, { toValue: 1, duration: 60, useNativeDriver: true }).start(() => {
      // Step 2 — at peak brightness: stop video + switch phase (invisible to user)
      try { videoPlayer.pause(); } catch (_) {}
      videoTransitioned.current = false;
      setPullPhase('reveal');

      // Step 3 — flash dissolves and cards bloom in as one unified motion
      Animated.parallel([
        // Light energy slowly dissipates
        Animated.timing(flashWhite, {
          toValue: 0, duration: 720,
          easing: Easing.out(Easing.quad), useNativeDriver: true,
        }),
        // Cards emerge through the fading light — staggered bloom entrance
        Animated.parallel(
          tagged.map((_, idx) => Animated.sequence([
            Animated.delay(idx * 52),
            Animated.parallel([
              // Rise slightly into position
              Animated.timing(cardAnims[idx].slideY, {
                toValue: 0, duration: 340,
                easing: Easing.out(Easing.back(1.05)),
                useNativeDriver: true,
              }),
              // Fade in as flash recedes
              Animated.timing(cardAnims[idx].opacity, {
                toValue: 1, duration: 260, useNativeDriver: true,
              }),
              // Scale bloom: small → natural size
              Animated.spring(cardAnims[idx].scale, {
                toValue: 1, friction: 7, tension: 100, useNativeDriver: true,
              }),
            ]),
          ]))
        ),
      ]).start(() => setIsAnimating(false)); // unlock tap-to-reveal
    });
  }, [videoPlayer, cardAnims, flashWhite]);

  // Keep ref in sync so the video-end listener never goes stale
  useEffect(() => { transitionToRevealRef.current = transitionToReveal; }, [transitionToReveal]);

  // Video ended → go to reveal automatically
  useEffect(() => {
    const sub = videoPlayer.addListener('playToEnd', () => {
      transitionToRevealRef.current?.();
    });
    return () => sub.remove();
  }, [videoPlayer]);

  // ── Pull trigger ──────────────────────────────────────────────────────────
  const doPull = useCallback((count) => {
    const cost = count === 1 ? SINGLE_COST : MULTI_COST;
    if (gems < cost || isAnimating) return;
    if (!spendGems(cost)) return;
    setIsAnimating(true);
    AudioManager.playButtonSFX();

    const { heroes, newPity } = performSummon(count, pity, new Set(ownedHeroes));
    const ownedSet   = new Set(ownedHeroes);
    const seenInPull = new Set();
    const tagged = heroes.map(hero => {
      const isNew = !ownedSet.has(hero.id) && !seenInPull.has(hero.id);
      seenInPull.add(hero.id);
      return { hero, isNew };
    });
    heroes.forEach(h => addHero(h.id));
    setPity(newPity);
    trackQuestProgress('hero_summon');
    setPullResults(tagged);
    setRevealCount(0);
    setAllRevealed(false);
    pendingTagged.current = tagged;
    videoTransitioned.current = false;

    // Play wish animation video first, then transition to reveal
    videoPlayer.replay();
    setPullPhase('video');
  }, [gems, isAnimating, spendGems, pity, ownedHeroes, addHero, videoPlayer]);

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
              : <SmallCardFront hero={item.hero} isNew={item.isNew} width={cardW} />
            }
          </Animated.View>
          {/* Rank glow ring */}
          <Animated.View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, { borderRadius: 8, borderWidth: 2.5, borderColor: r.glow, opacity: ca.glow }]}
          />
        </View>

        {/* NEW badge below card (single mode only) */}
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
  const renderVideo = () => (
    <TouchableWithoutFeedback onPress={transitionToReveal}>
      <View style={StyleSheet.absoluteFill}>
        <VideoView
          player={videoPlayer}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          nativeControls={false}
        />
        <View style={s.videoSkipRow} pointerEvents="none">
          <Text style={s.videoSkipTxt}>TAP TO SKIP  ›</Text>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );

  // ── Phase: banner ─────────────────────────────────────────────────────────
  const renderBanner = () => {
    const feat     = FEATURED;
    const pityPct  = Math.min(pity / PITY_LIMIT, 1);
    const leftColW = CARD_W + BODY_PAD * 2;

    return (
      <View style={s.bannerLayout}>
        <LinearGradient colors={C.GRAD_BG} style={StyleSheet.absoluteFill} />
        <FactionParticles faction={feat.faction} />

        {/* LEFT: HeroCard */}
        <View style={[s.bannerLeft, { width: leftColW }]}>
          {/* <HeroCard hero={bannerImg} width={CARD_W} /> */}
          <Image source={bannerImg} style={{ width: CARD_W, height: 250, borderRadius: 12 }} resizeMode="cover" />
        </View>

        {/* RIGHT: title + 2 sub-columns */}
        <View style={s.bannerRight}>

          {/* Title */}
          <View style={s.bannerTitleWrap}>
            <View style={{ overflow: 'hidden' }}>
              <Text style={s.bannerTitle}>TEMPORAL NEXUS</Text>
              <Animated.View
                pointerEvents="none"
                style={[s.shimmerBar, { transform: [{ translateX: shimmerX }] }]}
              >
                <LinearGradient
                  colors={['transparent', C.SHIMMER, 'transparent']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={{ width: 90, height: 28 }}
                />
              </Animated.View>
            </View>
            <View style={s.bannerLimitedRow}>
              <View style={s.limitedDot} />
              <Text style={s.bannerLimitedTxt}>LIMITED BANNER</Text>
              <View style={s.limitedDot} />
            </View>
          </View>

          {/* Sub-columns row */}
          <View style={s.bannerSubCols}>

            {/* Info col: rates + pity */}
            <View style={s.bannerInfoCol}>
              <View style={s.infoCard}>
                <Text style={s.infoCardTitle}>SUMMON RATES</Text>
                <View style={s.ratesRow}>
                  {/* Sovereign — within S pulls, 20% chance ≈ 0.8% overall */}
                  <View style={s.rateItem}>
                    <View style={[s.rateRankPill, { backgroundColor: RANK.SOVEREIGN.bg, paddingHorizontal: 6, paddingVertical: 6 }]}>
                      <Text style={[s.rateRankLbl, { color: RANK.SOVEREIGN.text, fontSize: 7 }]}>SOV</Text>
                    </View>
                    <Text style={s.ratePct}>0.8%</Text>
                  </View>
                  {[...RANK_ODDS].reverse().map(({ rank, weight }) => {
                    const r = RANK[rank];
                    return (
                      <View key={rank} style={s.rateItem}>
                        <View style={[s.rateRankPill, { backgroundColor: r.bg }]}>
                          <Text style={[s.rateRankLbl, { color: r.text }]}>{rank}</Text>
                        </View>
                        <Text style={s.ratePct}>{weight}%</Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              <View style={s.infoCard}>
                <View style={s.pityHeader}>
                  <Text style={s.infoCardTitle}>PITY COUNTER</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    {pity >= 70 && (
                      <View style={[s.pityWarnBadge, { backgroundColor: C.HP + '22', borderColor: C.HP }]}>
                        <Text style={[s.pityWarnTxt, { color: C.HP }]}>NEAR PITY</Text>
                      </View>
                    )}
                    <Text style={s.pityCount}>{pity} / {PITY_LIMIT}</Text>
                  </View>
                </View>
                <View style={s.pityBg}>
                  <View style={[s.pityFill, {
                    width: `${pityPct * 100}%`,
                    backgroundColor: pity >= 70 ? C.HP : C.PRIMARY_LIGHT,
                  }]} />
                </View>
                <Text style={s.pityHint}>
                  50+ pulls: S rate 8%  ·  70+ pulls: S rate 15%{'\n'}Guaranteed S-Rank at {PITY_LIMIT} pulls
                </Text>
              </View>
            </View>

            {/* Buttons col: wish×1, wish×10 */}
            <View style={s.bannerBtnCol}>
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

          {/* Bottom action bar */}
          <View style={s.revealBar}>
            {allRevealed ? (
              <TouchableOpacity onPress={closeToBanner} activeOpacity={0.85} style={s.closeBtn}>
                <Ionicons name="close" size={26} color="#fff" />
              </TouchableOpacity>
            ) : (
              !isSingle && (
                <Animated.Text style={[s.tapHint, { opacity: tapHintAnim }]}>
                  TAP ANYWHERE TO REVEAL
                </Animated.Text>
              )
            )}
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
          {/* Sovereign chip — heroes with sovereign flag */}
          {(() => {
            const count = pullResults.filter(i => i.hero?.sovereign).length;
            if (!count) return null;
            const r = RANK.SOVEREIGN;
            return (
              <View key="SOV" style={[s.sumChip, { borderColor: r.glow }]}>
                <View style={[s.sumDot, { backgroundColor: r.bg }]}>
                  <Text style={[s.sumDotTxt, { color: r.text, fontSize: 7 }]}>SOV</Text>
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

        <TouchableOpacity onPress={closeToBanner} activeOpacity={0.85} style={s.closeBtn}>
          <Ionicons name="close" size={26} color="#fff" />
        </TouchableOpacity>
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
          <Ionicons name={pullPhase === 'banner' ? 'chevron-back' : 'close'} size={22} color="#fff" />
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
      </LinearGradient>

      {/* Phase content */}
      <View style={s.content}>
        {pullPhase === 'banner'  && renderBanner()}
        {pullPhase === 'reveal'  && renderReveal()}
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
    position: 'absolute', bottom: 28, right: 24,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 7,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  videoSkipTxt: {
    color: 'rgba(255,255,255,0.85)', fontSize: 11,
    fontWeight: '700', letterSpacing: 1.5,
  },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.14)',
  },
  headerBack:  { padding: 4, marginRight: 6 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#fff', letterSpacing: 4 },
  headerSub:   { fontSize: 10, color: 'rgba(255,255,255,0.65)', marginTop: 1 },
  gemsChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 14,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  gemsTxt:      { color: C.GOLD, fontSize: 14, fontWeight: '700' },
  headerGemImg: { width: 16, height: 16, resizeMode: 'contain' },

  // ── Banner layout ──────────────────────────────────────────────────────────
  bannerLayout: { flex: 1, flexDirection: 'row' },

  bannerLeft: { overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  bannerCardWrap: { marginTop: 8 },

  bannerTitleWrap: { alignItems: 'flex-start', paddingTop: 4, paddingBottom: 4 },
  bannerTitle: {
    fontSize: 20, fontWeight: '900', color: C.PRIMARY_LIGHT, letterSpacing: 5,
  },
  shimmerBar: { position: 'absolute', top: 0, left: 0, height: 28 },
  bannerLimitedRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 4 },
  bannerLimitedTxt: { fontSize: 10, color: C.GOLD, fontWeight: '700', letterSpacing: 3 },
  limitedDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: C.GOLD },

  // ── Right controls ─────────────────────────────────────────────────────────
  bannerRight: {
    flex: 1, flexDirection: 'column', paddingVertical: 10, paddingHorizontal: 8, gap: 8,
  },
  bannerSubCols: {
    flex: 1, flexDirection: 'row', gap: 8, alignItems: 'center',
  },
  bannerInfoCol: {
    flex: 1, gap: 8, justifyContent: 'center',
  },
  bannerBtnCol: {
    flex: 1, gap: 8, justifyContent: 'center',
  },

  infoCard: {
    borderRadius: 10, padding: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: C.BORDER,
  },
  infoCardTitle: { fontSize: 9, fontWeight: '800', color: C.TEXT_MUTED, letterSpacing: 2, marginBottom: 6 },

  ratesRow:    { flexDirection: 'row', gap: 8 },
  rateItem:    { alignItems: 'center', gap: 3 },
  rateRankPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  rateRankLbl: { fontSize: 11, fontWeight: '900' },
  ratePct:     { fontSize: 10, color: C.TEXT_SOFT, fontWeight: '600' },

  pityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  pityCount:  { fontSize: 10, color: C.PRIMARY_LIGHT, fontWeight: '700' },
  pityBg:     { height: 5, backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 3, overflow: 'hidden' },
  pityFill:   { height: '100%', borderRadius: 3 },
  pityHint:     { fontSize: 8, color: C.TEXT_MUTED, marginTop: 5, fontStyle: 'italic' },
  pityWarnBadge:{ borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1, borderWidth: 1 },
  pityWarnTxt:  { fontSize: 7, fontWeight: '900', letterSpacing: 0.5 },

  ornateDisabled: { opacity: 0.42 },
  ornateOuter:    { marginVertical: 10 },
  ornateGlowRing: {
    position: 'absolute', top: -5, left: -5, right: -5, bottom: -5,
    borderRadius: 13,
  },
  ornateBody: {
    height: 64, borderRadius: 8, overflow: 'hidden', borderWidth: 2,
  },
  ornateRail:    { position: 'absolute', left: 14, right: 14, height: 1 },
  ornateContent: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12 },
  ornateLabel: {
    fontSize: 14, fontWeight: '900', color: '#fff', letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.7)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
  ornateSub:     { fontSize: 7, color: C.SUCCESS, fontWeight: '800', letterSpacing: 1, marginTop: 2 },
  ornateCostRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ornateCostTxt: { fontSize: 14, fontWeight: '800' },
  ornateDiamond: { position: 'absolute', width: 12, height: 12, transform: [{ rotate: '45deg' }] },
  ornateTL:      { top: -6, left: 10 },
  ornateTR:      { top: -6, right: 10 },
  ornateBL:      { bottom: -6, left: 10 },
  ornateBR:      { bottom: -6, right: 10 },
  ornateAccentRow: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  ornateAccentDot: { width: 10, height: 10, transform: [{ rotate: '45deg' }] },
  ornateParticle:  { position: 'absolute', bottom: 4, width: 4, height: 4, borderRadius: 2 },
  ornateGemImg:    { width: 18, height: 18, resizeMode: 'contain' },

  noGems: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.DANGER + '18', borderRadius: 7, padding: 8,
    borderWidth: 1, borderColor: C.DANGER + '40',
  },
  noGemsTxt: { flex: 1, fontSize: 10, color: C.TEXT_SOFT, lineHeight: 14 },

  // ── Reveal / Results ───────────────────────────────────────────────────────
  revealWrap:  { flex: 1 },
  resultsWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  singleArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tenGrid: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingHorizontal: 12,
  },
  tenRow: { flexDirection: 'row', gap: 8 },

  revealBar: {
    height: REVEAL_BOT, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 16,
  },
  tapHint: { fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: '700', letterSpacing: 3 },

  closeBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },

  summaryRow: {
    flexDirection: 'row', gap: 10, justifyContent: 'center',
    paddingVertical: 8,
  },
  sumChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 8, borderWidth: 1.5,
    paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  sumDot: { width: 22, height: 22, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  sumDotTxt: { fontSize: 10, fontWeight: '900' },
  sumCount:  { fontSize: 14, fontWeight: '700' },

  // ── Card back ──────────────────────────────────────────────────────────────
  cbCorner: { position: 'absolute', width: 10, height: 10, borderColor: C.GOLD, borderWidth: 1.5 },
  cbTL: { top: 5,  left: 5,  borderRightWidth: 0, borderBottomWidth: 0 },
  cbTR: { top: 5,  right: 5, borderLeftWidth:  0, borderBottomWidth: 0 },
  cbBL: { bottom: 5, left: 5,  borderRightWidth: 0, borderTopWidth: 0 },
  cbBR: { bottom: 5, right: 5, borderLeftWidth:  0, borderTopWidth: 0 },
  cbCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cbSymbol: { fontSize: 18, color: C.GOLD, marginBottom: 4, textShadowColor: C.GOLD, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 },
  cbWord:   { fontSize: 9, color: C.GOLD, fontWeight: '800', letterSpacing: 3, lineHeight: 13 },

  // ── Small card front (×10) ─────────────────────────────────────────────────
  scRank:    { position: 'absolute', top: 4, right: 4, paddingHorizontal: 4, paddingVertical: 2, borderRadius: 3 },
  scRankTxt: { fontSize: 9, fontWeight: '900' },
  scName: {
    position: 'absolute', bottom: 16, left: 4, right: 4,
    fontSize: 8, color: '#fff', fontWeight: '700', textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.9)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3,
  },
  scNew:    { position: 'absolute', bottom: 4, left: 4, right: 4, alignItems: 'center' },
  scNewTxt: {
    fontSize: 7, color: C.SUCCESS, fontWeight: '900', letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2,
  },

  // ── Single card new badge ──────────────────────────────────────────────────
  singleNew: {
    marginTop: 10, alignSelf: 'center',
    backgroundColor: C.SUCCESS + '22', borderRadius: 6,
    paddingHorizontal: 14, paddingVertical: 5,
    borderWidth: 1, borderColor: C.SUCCESS,
  },
  singleNewTxt: { color: C.SUCCESS, fontSize: 11, fontWeight: '800', letterSpacing: 2 },

  // ── Star particle ──────────────────────────────────────────────────────────
  starDot: { position: 'absolute', backgroundColor: 'white' },
});
