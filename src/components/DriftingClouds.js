import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, Dimensions, StyleSheet } from 'react-native';

// ── Cloud assets ──────────────────────────────────────────────────────────────
const CLOUD_IMG_1 = require('../../assets/background-assets/cloud-1.webp');
const CLOUD_IMG_2 = require('../../assets/background-assets/cloud-2.webp');

const { width: W, height: H } = Dimensions.get('window');

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

// ── DriftingClouds ─────────────────────────────────────────────────────────────
// Ambient parallax cloud layers drifting right-to-left, looping indefinitely.
// Shared by WeatherEffect's 'fog' type and any screen wanting the same effect
// (e.g. WorldMapScreen) without the fog-specific stars/shooting-stars.
export default function DriftingClouds() {
  const cloudAnims = useRef(CLOUD_LAYERS.map(c => new Animated.Value(c.initX))).current;

  useEffect(() => {
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
  }, []);

  return (
    <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]} pointerEvents="none">
      {CLOUD_LAYERS.map((cloud, i) => (
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
    </View>
  );
}
