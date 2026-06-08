import React, { useEffect, useRef, useMemo } from 'react';
import { View, Animated, Easing, Dimensions, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C } from '../theme/colors';

// ── Cloud assets (fog / bg_002 only) ─────────────────────────────────────────
const CLOUD_IMG_1 = require('../../assets/background-assets/cloud-1.png');
const CLOUD_IMG_2 = require('../../assets/background-assets/cloud-2.png');

const { width: W, height: H } = Dimensions.get('window');
const DROP_COUNT = 15;

// ── Cloud layer data (fog type) ───────────────────────────────────────────────
// Two image sources, varied Y/scale/opacity/speed for parallax depth.
// initX: initial translateX so some clouds are already mid-screen on mount.
const C1W = 320; const C1H = 120; // cloud-1 display size
const C2W = 260; const C2H = 100; // cloud-2 display size

const CLOUD_LAYERS = [
  // — cloud-1 (foreground, faster) ——————————————————————————
  { src: CLOUD_IMG_1, w: C1W, h: C1H, y: H * 0.03, sc: 1.10, op: 0.80, speed: 26000, delay: 0,     initX: W * 0.12 },
  { src: CLOUD_IMG_1, w: C1W, h: C1H, y: H * 0.24, sc: 0.80, op: 0.65, speed: 32000, delay: 7000,  initX: W * 0.58 },
  { src: CLOUD_IMG_1, w: C1W, h: C1H, y: H * 0.38, sc: 1.20, op: 0.52, speed: 22000, delay: 14000, initX: W + C1W  },
  // — cloud-2 (background, slower) ——————————————————————————
  { src: CLOUD_IMG_2, w: C2W, h: C2H, y: H * 0.08, sc: 0.70, op: 0.45, speed: 40000, delay: 4000,  initX: W * 0.72 },
  { src: CLOUD_IMG_2, w: C2W, h: C2H, y: H * 0.28, sc: 0.88, op: 0.56, speed: 46000, delay: 18000, initX: W * 0.33 },
  { src: CLOUD_IMG_2, w: C2W, h: C2H, y: H * 0.44, sc: 0.62, op: 0.36, speed: 36000, delay: 10000, initX: W + C2W  },
];

// ── Twinkling-star positions — fixed at module load so they never shift ────────
const TWINKLE_COUNT = 20;
const TWINKLE_DATA  = Array.from({ length: TWINKLE_COUNT }, () => ({
  x:    Math.random() * W,
  y:    Math.random() * H * 0.62,   // upper 62 % of screen (sky area)
  sz:   1.0 + Math.random() * 2.2,
  minO: 0.05 + Math.random() * 0.12,
  maxO: 0.45 + Math.random() * 0.55,
  dur:  650  + Math.random() * 1600,
  del:  Math.random() * 2400,
  // mostly white; 30 % warm-gold, 20 % cool-blue for variety
  color: Math.random() > 0.7
    ? 'rgba(255,240,160,0.9)'
    : Math.random() > 0.5
    ? 'rgba(180,220,255,0.9)'
    : 'rgba(255,255,255,0.9)',
}));

// ── Shooting-star paths — 3 independent streaks ────────────────────────────────
const SHOOT_W = 74;
const SHOOT_H = 1.8;
const SHOOT_DATA = [
  { sx: W * 0.08, sy: H * 0.05, dx: 200, dy: 75,  dur: 620, initDel: 800,  pause: 6200 },
  { sx: W * 0.35, sy: H * 0.10, dx: 175, dy: 65,  dur: 700, initDel: 3400, pause: 7500 },
  { sx: W * 0.18, sy: H * 0.22, dx: 220, dy: 82,  dur: 580, initDel: 5800, pause: 5800 },
];

// ── TwinklingStars ─────────────────────────────────────────────────────────────
function TwinklingStars() {
  const opA = useRef(TWINKLE_DATA.map(s => new Animated.Value(s.minO))).current;
  const scA = useRef(TWINKLE_DATA.map(s => new Animated.Value(s.sz > 1.8 ? 0.75 : 1.0))).current;

  useEffect(() => {
    const loops = TWINKLE_DATA.map((s, i) => {
      const big  = s.sz > 1.8;
      const loop = Animated.loop(Animated.sequence([
        Animated.delay(s.del),
        Animated.parallel([
          Animated.timing(opA[i], { toValue: s.maxO, duration: s.dur, useNativeDriver: true }),
          ...(big ? [Animated.timing(scA[i], { toValue: 1.5,  duration: s.dur, useNativeDriver: true })] : []),
        ]),
        Animated.parallel([
          Animated.timing(opA[i], { toValue: s.minO, duration: s.dur, useNativeDriver: true }),
          ...(big ? [Animated.timing(scA[i], { toValue: 0.75, duration: s.dur, useNativeDriver: true })] : []),
        ]),
      ]));
      loop.start();
      return loop;
    });
    return () => loops.forEach(l => l.stop());
  }, []);

  return (
    <>
      {TWINKLE_DATA.map((s, i) => (
        <Animated.View
          key={`twinkle_${i}`}
          style={{
            position: 'absolute',
            left: s.x, top: s.y,
            width: s.sz, height: s.sz,
            borderRadius: s.sz / 2,
            backgroundColor: s.color,
            opacity: opA[i],
            transform: [{ scale: scA[i] }],
          }}
        />
      ))}
    </>
  );
}

// ── ShootingStars ──────────────────────────────────────────────────────────────
function ShootingStars() {
  const xA = useRef(SHOOT_DATA.map(() => new Animated.Value(0))).current;
  const yA = useRef(SHOOT_DATA.map(() => new Animated.Value(0))).current;
  const oA = useRef(SHOOT_DATA.map(() => new Animated.Value(0))).current;
  const timers = useRef([]);

  useEffect(() => {
    const fire = (i) => {
      const s = SHOOT_DATA[i];
      xA[i].setValue(0);
      yA[i].setValue(0);
      oA[i].setValue(0);
      Animated.parallel([
        Animated.timing(xA[i], { toValue: s.dx, duration: s.dur, useNativeDriver: true }),
        Animated.timing(yA[i], { toValue: s.dy, duration: s.dur, useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(oA[i], { toValue: 1,  duration: s.dur * 0.20, useNativeDriver: true }),
          Animated.timing(oA[i], { toValue: 0,  duration: s.dur * 0.80, useNativeDriver: true }),
        ]),
      ]).start(({ finished }) => {
        if (!finished) return;
        timers.current[i] = setTimeout(
          () => fire(i),
          s.pause + Math.random() * 3000,
        );
      });
    };

    SHOOT_DATA.forEach((s, i) => {
      timers.current[i] = setTimeout(() => fire(i), s.initDel);
    });

    return () => {
      timers.current.forEach(t => t && clearTimeout(t));
      xA.forEach(a => a.stopAnimation());
      yA.forEach(a => a.stopAnimation());
      oA.forEach(a => a.stopAnimation());
    };
  }, []);

  return (
    <>
      {SHOOT_DATA.map((s, i) => (
        <Animated.View
          key={`shoot_${i}`}
          style={{
            position: 'absolute',
            left: s.sx,
            top:  s.sy,
            opacity: oA[i],
            transform: [{ translateX: xA[i] }, { translateY: yA[i] }],
          }}
        >
          {/* Gradient streak: transparent → bright white → cool-blue tail */}
          <LinearGradient
            colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.95)', 'rgba(180,225,255,0.35)']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{
              width: SHOOT_W, height: SHOOT_H,
              borderRadius: SHOOT_H,
              transform: [{ rotate: '22deg' }],
            }}
          />
        </Animated.View>
      ))}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function WeatherEffect({ type }) {
  const yAnims = useRef(Array.from({ length: DROP_COUNT }, () => new Animated.Value(-80))).current;
  const xAnims = useRef(Array.from({ length: DROP_COUNT }, () => new Animated.Value(-60))).current;
  const flashAnim = useRef(new Animated.Value(0)).current;
  const thunderRef = useRef(null);
  const cloudAnims = useRef(CLOUD_LAYERS.map(c => new Animated.Value(c.initX))).current;

  const drops = useMemo(() =>
    Array.from({ length: DROP_COUNT }, () => ({
      x:       Math.random() * W,
      y:       Math.random() * H,
      speed:   500 + Math.random() * 550,
      delay:   Math.random() * 1400,
      opacity: 0.22 + Math.random() * 0.32,
      length:  13 + Math.random() * 17,
      windW:   18 + Math.random() * 40,
    })), []
  );

  const compositeAnim = useRef(null);

  useEffect(() => {
    // Reset all values before starting so re-mounts start from scratch
    yAnims.forEach((a) => a.setValue(-80));
    xAnims.forEach((a) => a.setValue(-60));
    flashAnim.setValue(0);

    if (type === 'rain' || type === 'thunder') {
      const anims = drops.map((d, i) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(d.delay),
            Animated.timing(yAnims[i], { toValue: H + 80, duration: d.speed, useNativeDriver: true }),
            Animated.timing(yAnims[i], { toValue: -80,    duration: 0,        useNativeDriver: true }),
          ])
        )
      );
      compositeAnim.current = Animated.parallel(anims);
      compositeAnim.current.start();
    }

    if (type === 'wind') {
      const anims = drops.map((d, i) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(d.delay),
            Animated.timing(xAnims[i], { toValue: W + 60, duration: d.speed * 1.6, useNativeDriver: true }),
            Animated.timing(xAnims[i], { toValue: -60,    duration: 0,             useNativeDriver: true }),
          ])
        )
      );
      compositeAnim.current = Animated.parallel(anims);
      compositeAnim.current.start();
    }

    if (type === 'rain' || type === 'thunder') {
      const doFlash = () => {
        const minDelay  = type === 'thunder' ? 3200 : 5000;
        const randExtra = type === 'thunder' ? 5500 : 7000;
        thunderRef.current = setTimeout(() => {
          Animated.sequence([
            Animated.timing(flashAnim, { toValue: 0.42, duration: 65,  useNativeDriver: true }),
            Animated.timing(flashAnim, { toValue: 0,    duration: 65,  useNativeDriver: true }),
            Animated.timing(flashAnim, { toValue: 0.22, duration: 50,  useNativeDriver: true }),
            Animated.timing(flashAnim, { toValue: 0,    duration: 130, useNativeDriver: true }),
          ]).start(doFlash);
        }, minDelay + Math.random() * randExtra);
      };
      doFlash();
    }

    return () => {
      if (compositeAnim.current) {
        compositeAnim.current.stop();
        compositeAnim.current = null;
      }
      yAnims.forEach((a) => a.stopAnimation());
      xAnims.forEach((a) => a.stopAnimation());
      flashAnim.stopAnimation();
      if (thunderRef.current) {
        clearTimeout(thunderRef.current);
        thunderRef.current = null;
      }
    };
  }, [type]);

  // ── Cloud drift animation (fog type only) ──────────────────────────────────
  useEffect(() => {
    if (type !== 'fog') return;
    let active = true;

    const run = (idx, fromX) => {
      if (!active) return;
      const { w, speed } = CLOUD_LAYERS[idx];
      // Proportional duration so speed stays constant regardless of start position
      const totalTraverse = W + w * 2;
      const remaining     = fromX + w;
      const dur           = Math.max(1000, Math.round(speed * remaining / totalTraverse));
      cloudAnims[idx].setValue(fromX);
      Animated.timing(cloudAnims[idx], {
        toValue:  -w,
        duration: dur,
        easing:   Easing.linear,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished && active) run(idx, W + w);
      });
    };

    const timers = CLOUD_LAYERS.map((c, i) =>
      c.delay > 0
        ? setTimeout(() => run(i, c.initX), c.delay)
        : (run(i, c.initX), null)
    );

    return () => {
      active = false;
      timers.forEach(t => t && clearTimeout(t));
      cloudAnims.forEach(a => a.stopAnimation());
    };
  }, [type]);

  if (type === 'clear') return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Rain drops */}
      {(type === 'rain' || type === 'thunder') &&
        drops.map((d, i) => (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: d.x,
              top: -80,
              width: 1.5,
              height: d.length,
              backgroundColor: 'rgba(180,210,255,0.75)',
              opacity: d.opacity,
              transform: [{ translateY: yAnims[i] }, { rotate: '-12deg' }],
            }}
          />
        ))}

      {/* Thunder flash — fires for both rain (slow) and thunder (fast) */}
      {(type === 'rain' || type === 'thunder') && (
        <Animated.View
          style={[StyleSheet.absoluteFill, { backgroundColor: C.FLASH_LIGHT, opacity: flashAnim }]}
        />
      )}

      {/* Wind streaks */}
      {type === 'wind' &&
        drops.map((d, i) => (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: -60,
              top: d.y,
              width: d.windW,
              height: 1,
              backgroundColor: 'rgba(210,225,255,0.38)',
              opacity: d.opacity,
              transform: [{ translateX: xAnims[i] }, { rotate: '-6deg' }],
            }}
          />
        ))}

      {/* Fog — twinkling stars behind clouds (depth: stars appear peeking through) */}
      {type === 'fog' && <TwinklingStars />}

      {/* Fog — drifting cloud layers (in front of stars) */}
      {type === 'fog' && CLOUD_LAYERS.map((cloud, i) => (
        <Animated.Image
          key={`cloud_${i}`}
          source={cloud.src}
          style={{
            position:  'absolute',
            top:       cloud.y,
            width:     Math.round(cloud.w * cloud.sc),
            height:    Math.round(cloud.h * cloud.sc),
            opacity:   cloud.op,
            transform: [{ translateX: cloudAnims[i] }],
          }}
          resizeMode="contain"
        />
      ))}

      {/* Fog — shooting stars above clouds (most visible, dramatic) */}
      {type === 'fog' && <ShootingStars />}
    </View>
  );
}
