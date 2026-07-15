import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { C } from '../../theme/colors';

// ── GlassPanel ────────────────────────────────────────────────────────────────
// Frosted gradient-glass surface. With blurIntensity > 0 it renders a REAL
// expo-blur backdrop (true frosted glass — the scene behind shows through),
// then a translucent cool tint, then a glossy top sheen. With blurIntensity = 0
// it falls back to gradient-only glass (no native blur).
//
// Props:
//   blurIntensity — 0 = gradient fallback; ~18–40 = frosted. Default 0.
//   blurTint      — 'dark' | 'light' | 'default' (default 'dark')
//   blurTarget    — Android only. A ref (from expo-blur's BlurTargetView) to
//                   whatever background content sits behind this panel — the
//                   caller must wrap that content in <BlurTargetView ref={...}>.
//                   Without it, Android's real-time blur silently falls back
//                   to a flat semi-transparent tint (no actual blur). iOS
//                   ignores this prop; its blur is always real.
//   baseColor     — solid backdrop. Default: transparent when blurring (so the
//                   blur shows), else C.BG_CARD. Pass a color to override.
//   tint          — translucent body gradient over the blur (default C.GRAD_GLASS)
//   sheen         — top-edge white gloss (default true)
//   borderColor / borderWidth / radius — frame styling
//   glowColor     — optional outer bloom
//   style, children
function GlassPanel({
  blurIntensity = 0,
  blurTint = 'dark',
  blurTarget,
  baseColor,
  tint = C.GRAD_GLASS,
  sheen = true,
  borderColor = C.BORDER,
  borderWidth = 1,
  radius = 6,
  glowColor,
  style,
  children,
}) {
  const useBlur = blurIntensity > 0;
  const bg = baseColor != null ? baseColor : useBlur ? 'transparent' : C.BG_CARD;
  const glow = glowColor
    ? { shadowColor: glowColor, shadowOpacity: 0.5, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, elevation: 6 }
    : null;

  return (
    <View style={glow}>
      <View
        style={[
          styles.clip,
          { borderRadius: radius, borderWidth, borderColor, backgroundColor: bg },
          style,
        ]}
      >
        {useBlur && (
          <BlurView
            blurTarget={blurTarget}
            intensity={blurIntensity}
            tint={blurTint}
            blurMethod="dimezisBlurView"
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
        )}
        <LinearGradient colors={tint} style={StyleSheet.absoluteFill} pointerEvents="none" />
        {sheen && (
          <LinearGradient
            colors={[C.SHIMMER, 'transparent']}
            style={styles.sheen}
            pointerEvents="none"
          />
        )}
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden', position: 'relative' },
  sheen: { position: 'absolute', top: 0, left: 0, right: 0, height: '42%' },
});

export default React.memo(GlassPanel);
