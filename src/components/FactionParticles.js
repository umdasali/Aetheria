import React, { useEffect, useRef, useMemo, useState } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';

const { width: W, height: H } = Dimensions.get('window');
const rnd  = (mn, mx) => mn + Math.random() * (mx - mn);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

// ─── Per-faction effect name ──────────────────────────────────────────────────
const EFFECT = {
  EMBERVEIL: 'fire',
  GLACIARA:  'snow',
  SUNSPIRE:  'sparkle',
  VERDANIA:  'leaf',
  VOIDMARK:  'void',
};

// ─── Color palettes ───────────────────────────────────────────────────────────
const PAL = {
  fire:    ['#FF4500', '#FF6B35', '#FF8C00', '#FFA500', '#FFD700'],
  snow:    ['#FFFFFF', '#E0F7FF', '#B3E5FC', '#81D4FA', '#90E0EF'],
  sparkle: ['#FFD700', '#FFF9C4', '#FFEE58', '#FFC107', '#FFFFFF'],
  leaf:    ['#2ECC71', '#27AE60', '#A8E6CF', '#52BE80', '#1ABC9C'],
  void:    ['#9B59B6', '#8E44AD', '#D7BDE2', '#BB8FCE', '#C39BD3'],
};

// ─── Glow (shadow) colors per effect ─────────────────────────────────────────
const GLOW = {
  fire:    '#FF4500',
  snow:    '#90E0EF',
  sparkle: '#FFD700',
  leaf:    '#2ECC71',
  void:    '#9B59B6',
};

// ─── Particle generators ──────────────────────────────────────────────────────
// Counts kept lean: fire 10 / snow 12 / sparkle 9 / leaf 8 / void 10
// Reduces concurrent Animated loops from 102 → ~50, preventing JS-thread jank.
function genParticles(effect) {
  const c = PAL[effect];
  switch (effect) {
    case 'fire':
      return Array.from({ length: 10 }, () => ({
        x:        rnd(0, W),
        startY:   rnd(H * 0.55, H + 10),
        rise:     rnd(110, 210),
        size:     rnd(3, 8),
        color:    pick(c),
        duration: rnd(900, 1700),
        delay:    rnd(0, 1400),
        opacity:  rnd(0.55, 0.88),
      }));

    case 'snow':
      return Array.from({ length: 12 }, () => ({
        startX:   rnd(0, W),
        drift:    rnd(-18, 18),
        size:     rnd(3, 7),
        color:    pick(c),
        duration: rnd(4000, 7000),
        delay:    rnd(0, 3500),
        opacity:  rnd(0.5, 0.9),
      }));

    case 'sparkle':
      return Array.from({ length: 9 }, () => ({
        x:        rnd(10, W - 10),
        y:        rnd(10, H - 10),
        size:     rnd(2, 6),
        color:    pick(c),
        duration: rnd(650, 1300),
        delay:    rnd(0, 1400),
        opacity:  rnd(0.7, 1.0),
      }));

    case 'leaf':
      return Array.from({ length: 8 }, () => {
        const startX = rnd(-10, W + 10);
        return {
          startX,
          xDrift:   rnd(-70, 70),
          size:     rnd(5, 10),
          color:    pick(c),
          duration: rnd(3000, 5500),
          delay:    rnd(0, 2500),
          opacity:  rnd(0.5, 0.8),
        };
      });

    case 'void':
      return Array.from({ length: 10 }, () => ({
        x:        rnd(0, W),
        startY:   rnd(H * 0.1, H * 0.9),
        floatUp:  rnd(30, 60),
        size:     rnd(4, 11),
        color:    pick(c),
        duration: rnd(1400, 3000),
        delay:    rnd(0, 2200),
      }));

    default:
      return [];
  }
}

// ─── Main component ───────────────────────────────────────────────────────────
const MAX = 12; // maximum particle count across all effects

export default function FactionParticles({ faction }) {
  const effect       = EFFECT[faction];
  const [active, setActive] = useState(true);
  const screenOpacity = useRef(new Animated.Value(1)).current;

  // Fade out after the entrance window, then stop all animations
  useEffect(() => {
    if (!effect) return;
    const fadeTimer = setTimeout(() => {
      Animated.timing(screenOpacity, {
        toValue: 0, duration: 2000, useNativeDriver: true,
      }).start(() => setActive(false));
    }, 2500);
    return () => clearTimeout(fadeTimer);
  }, [effect]);

  const particles = useMemo(() => genParticles(effect), [effect]);

  // Unified animated value pools (MAX slots, only active-effect slots are used)
  const yAnims   = useRef(Array.from({ length: MAX }, () => new Animated.Value(0))).current;
  const xAnims   = useRef(Array.from({ length: MAX }, () => new Animated.Value(0))).current;
  const opAnims  = useRef(Array.from({ length: MAX }, () => new Animated.Value(0))).current;
  const sclAnims = useRef(Array.from({ length: MAX }, () => new Animated.Value(1))).current;

  useEffect(() => {
    if (!effect || !particles.length) return;

    const built = particles.map((p, i) => {
      switch (effect) {

        // ── Fire: rises from bottom, fades as it goes up ─────────────────────
        case 'fire':
          yAnims[i].setValue(p.startY);
          opAnims[i].setValue(p.opacity);
          return Animated.loop(Animated.sequence([
            Animated.delay(p.delay),
            Animated.parallel([
              Animated.timing(yAnims[i],  { toValue: p.startY - p.rise, duration: p.duration, useNativeDriver: true }),
              Animated.timing(opAnims[i], { toValue: 0,                  duration: p.duration, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(yAnims[i],  { toValue: p.startY, duration: 0, useNativeDriver: true }),
              Animated.timing(opAnims[i], { toValue: p.opacity, duration: 0, useNativeDriver: true }),
            ]),
          ]));

        // ── Snow: drifts from top to bottom with gentle horizontal sway ───────
        case 'snow':
          yAnims[i].setValue(-20);
          xAnims[i].setValue(p.startX);
          opAnims[i].setValue(p.opacity);
          return Animated.loop(Animated.sequence([
            Animated.delay(p.delay),
            Animated.parallel([
              Animated.timing(yAnims[i], { toValue: H + 20, duration: p.duration, useNativeDriver: true }),
              Animated.sequence([
                Animated.timing(xAnims[i], { toValue: p.startX + p.drift, duration: p.duration / 2, useNativeDriver: true }),
                Animated.timing(xAnims[i], { toValue: p.startX - p.drift, duration: p.duration / 2, useNativeDriver: true }),
              ]),
            ]),
            Animated.parallel([
              Animated.timing(yAnims[i], { toValue: -20,     duration: 0, useNativeDriver: true }),
              Animated.timing(xAnims[i], { toValue: p.startX, duration: 0, useNativeDriver: true }),
            ]),
          ]));

        // ── Sparkle: twinkles in/out at fixed positions ───────────────────────
        case 'sparkle':
          opAnims[i].setValue(0);
          sclAnims[i].setValue(0.4);
          return Animated.loop(Animated.sequence([
            Animated.delay(p.delay),
            Animated.parallel([
              Animated.timing(opAnims[i],  { toValue: p.opacity, duration: p.duration * 0.5, useNativeDriver: true }),
              Animated.timing(sclAnims[i], { toValue: 1.6,       duration: p.duration * 0.5, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(opAnims[i],  { toValue: 0,   duration: p.duration * 0.5, useNativeDriver: true }),
              Animated.timing(sclAnims[i], { toValue: 0.4, duration: p.duration * 0.5, useNativeDriver: true }),
            ]),
          ]));

        // ── Leaf: drifts diagonally from top ──────────────────────────────────
        case 'leaf':
          yAnims[i].setValue(-20);
          xAnims[i].setValue(p.startX);
          opAnims[i].setValue(p.opacity);
          return Animated.loop(Animated.sequence([
            Animated.delay(p.delay),
            Animated.parallel([
              Animated.timing(yAnims[i], { toValue: H + 20,            duration: p.duration, useNativeDriver: true }),
              Animated.timing(xAnims[i], { toValue: p.startX + p.xDrift, duration: p.duration, useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(yAnims[i], { toValue: -20,      duration: 0, useNativeDriver: true }),
              Animated.timing(xAnims[i], { toValue: p.startX, duration: 0, useNativeDriver: true }),
            ]),
          ]));

        // ── Void: pulses out of nowhere and dissolves, drifts upward ─────────
        case 'void':
          yAnims[i].setValue(p.startY);
          opAnims[i].setValue(0);
          sclAnims[i].setValue(0.3);
          return Animated.loop(Animated.sequence([
            Animated.delay(p.delay),
            Animated.parallel([
              Animated.timing(opAnims[i],  { toValue: 0.75,              duration: p.duration * 0.35, useNativeDriver: true }),
              Animated.timing(sclAnims[i], { toValue: 1.9,               duration: p.duration * 0.5,  useNativeDriver: true }),
              Animated.timing(yAnims[i],   { toValue: p.startY - p.floatUp, duration: p.duration,     useNativeDriver: true }),
            ]),
            Animated.parallel([
              Animated.timing(opAnims[i],  { toValue: 0,   duration: p.duration * 0.65, useNativeDriver: true }),
              Animated.timing(sclAnims[i], { toValue: 0.3, duration: p.duration * 0.5,  useNativeDriver: true }),
            ]),
            Animated.timing(yAnims[i], { toValue: p.startY, duration: 0, useNativeDriver: true }),
          ]));

        default:
          return null;
      }
    }).filter(Boolean);

    const composite = Animated.parallel(built);
    // Delay start until after the screen-entry fade (~300 ms) so particle loops
    // don't compete with the navigation transition on the JS thread.
    const timer = setTimeout(() => composite.start(), 320);
    return () => { clearTimeout(timer); composite.stop(); };
  }, [effect]);

  if (!effect || !active) return null;

  const glow = GLOW[effect];

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: screenOpacity }]} pointerEvents="none">

      {/* ── Fire ─────────────────────────────────────────────────────────── */}
      {effect === 'fire' && particles.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: p.x,
            top: 0,
            width: p.size,
            height: p.size,
            borderRadius: p.size / 2,
            backgroundColor: p.color,
            opacity: opAnims[i],
            transform: [{ translateY: yAnims[i] }],
            shadowColor: glow,
            shadowOpacity: 0.9,
            shadowOffset: { width: 0, height: 0 },
            shadowRadius: p.size * 1.5,
            elevation: 4,
          }}
        />
      ))}

      {/* ── Snow ─────────────────────────────────────────────────────────── */}
      {effect === 'snow' && particles.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: p.size,
            height: p.size,
            borderRadius: p.size / 2,
            backgroundColor: p.color,
            opacity: opAnims[i],
            transform: [{ translateX: xAnims[i] }, { translateY: yAnims[i] }],
            shadowColor: glow,
            shadowOpacity: 0.5,
            shadowOffset: { width: 0, height: 0 },
            shadowRadius: p.size,
          }}
        />
      ))}

      {/* ── Sparkle ──────────────────────────────────────────────────────── */}
      {effect === 'sparkle' && particles.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            borderRadius: p.size / 2,
            backgroundColor: p.color,
            opacity: opAnims[i],
            transform: [{ scale: sclAnims[i] }],
            shadowColor: glow,
            shadowOpacity: 1,
            shadowOffset: { width: 0, height: 0 },
            shadowRadius: p.size * 2.5,
            elevation: 5,
          }}
        />
      ))}

      {/* ── Leaf ─────────────────────────────────────────────────────────── */}
      {effect === 'leaf' && particles.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: p.size * 1.7,
            height: p.size,
            borderRadius: p.size * 0.8,
            backgroundColor: p.color,
            opacity: opAnims[i],
            transform: [{ translateX: xAnims[i] }, { translateY: yAnims[i] }],
            shadowColor: glow,
            shadowOpacity: 0.5,
            shadowOffset: { width: 0, height: 0 },
            shadowRadius: p.size,
          }}
        />
      ))}

      {/* ── Void ─────────────────────────────────────────────────────────── */}
      {effect === 'void' && particles.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: p.x,
            top: 0,
            width: p.size,
            height: p.size,
            borderRadius: p.size / 2,
            backgroundColor: p.color,
            opacity: opAnims[i],
            transform: [{ translateY: yAnims[i] }, { scale: sclAnims[i] }],
            shadowColor: glow,
            shadowOpacity: 1,
            shadowOffset: { width: 0, height: 0 },
            shadowRadius: p.size * 2,
            elevation: 5,
          }}
        />
      ))}

    </Animated.View>
  );
}
