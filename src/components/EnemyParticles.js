import { useEffect, useMemo, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { C } from '../theme/colors';

// Per-tier ambient particles for the Codex enemy detail card. Mirrors the
// tier badge colors already used in CodexDetailScreen/CodexScreen so the
// particle tint always matches the badge the player already associates
// with that tier.
const TIER_CONFIG = {
  mob: {
    count: 5, minSize: 1.5, maxSize: 2.5, color: C.TEXT_MUTED,
    minDur: 3400, maxDur: 5000, minOpacity: 0.10, maxOpacity: 0.22, mode: 'rise',
  },
  'mini-boss': {
    count: 10, minSize: 2, maxSize: 3.5, color: C.WARNING,
    minDur: 2400, maxDur: 3800, minOpacity: 0.30, maxOpacity: 0.55, mode: 'rise',
  },
  boss: {
    count: 16, minSize: 2.5, maxSize: 4.5, color: C.DANGER,
    minDur: 1700, maxDur: 2900, minOpacity: 0.45, maxOpacity: 0.75, mode: 'rise',
  },
};

// The story's two climactic bosses (chapter 30's final boss and chapter 29's
// penultimate guardian) get bespoke treatments instead of the generic boss
// config — they're meant to read as categorically bigger than any other
// chapter boss the moment their card is opened.
const SPECIAL_CONFIG = {
  boss_030: {
    count: 24, minSize: 2.5, maxSize: 5, color: C.SOVEREIGN_GOLD,
    minDur: 2600, maxDur: 4200, minOpacity: 0.5, maxOpacity: 0.9, mode: 'rise',
  },
  boss_029: {
    count: 14, minSize: 3, maxSize: 6, color: C.PRIMARY_LIGHT,
    minDur: 2200, maxDur: 3600, minOpacity: 0.25, maxOpacity: 0.6, mode: 'pulse',
  },
};

function Particle({ cfg, width, height }) {
  const anim = useRef(new Animated.Value(0)).current;
  const size = useMemo(() => cfg.minSize + Math.random() * (cfg.maxSize - cfg.minSize), [cfg]);
  const left = useMemo(() => Math.random() * Math.max(1, width - size), [cfg, width, size]);
  const startTop = useMemo(() => Math.random() * height, [cfg, height]);
  const duration = useMemo(() => Math.round(cfg.minDur + Math.random() * (cfg.maxDur - cfg.minDur)), [cfg]);
  const delay = useMemo(() => Math.round(Math.random() * duration), [duration]);
  const swayAmp = useMemo(() => 6 + Math.random() * 10, [cfg]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => { loop.stop(); anim.stopAnimation(); };
  }, [anim, delay, duration]);

  if (cfg.mode === 'pulse') {
    // Hovering "watching eye" particle — breathes in place, never travels.
    const opacity = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [cfg.minOpacity, cfg.maxOpacity, cfg.minOpacity] });
    const scale = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.7, 1.15, 0.7] });
    return (
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute', left, top: startTop, width: size, height: size, borderRadius: size / 2,
          backgroundColor: cfg.color, opacity, transform: [{ scale }],
          shadowColor: cfg.color, shadowOpacity: 0.9, shadowRadius: size, shadowOffset: { width: 0, height: 0 },
        }}
      />
    );
  }

  // Rising ember/mote — drifts upward with a gentle horizontal sway, fading in and out.
  const travel = startTop + size + 20;
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -travel] });
  const translateX = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, swayAmp, 0] });
  const opacity = anim.interpolate({ inputRange: [0, 0.15, 0.8, 1], outputRange: [0, cfg.maxOpacity, cfg.minOpacity, 0] });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute', left, top: startTop, width: size, height: size, borderRadius: size / 2,
        backgroundColor: cfg.color, opacity,
        transform: [{ translateY }, { translateX }],
      }}
    />
  );
}

// <EnemyParticles tier="boss" imageKey="boss_030" width={CARD_W} height={CARD_H} />
export default function EnemyParticles({ tier, imageKey, width, height }) {
  const cfg = SPECIAL_CONFIG[imageKey] || TIER_CONFIG[tier];
  const particleIds = useMemo(() => (cfg ? Array.from({ length: cfg.count }, (_, i) => i) : []), [cfg]);

  if (!cfg || !width || !height) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particleIds.map(i => (
        <Particle key={i} cfg={cfg} width={width} height={height} />
      ))}
    </View>
  );
}
