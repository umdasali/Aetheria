import React from 'react';
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C } from '../../theme/colors';
import CornerBrackets from './CornerBrackets';

// ── GlowButton ──────────────────────────────────────────────────────────────────
// Angular gradient-gloss CTA with hairline glow border, top sheen, corner brackets
// and outer bloom. Standardizes the game's primary call-to-action buttons.
//
// Props:
//   onPress, label, icon (node, leading), disabled
//   gradient   — fill gradient array (default C.GRAD_PINK = cyan gloss)
//   glowColor  — outer bloom + bracket color (default C.PRIMARY)
//   height, radius, brackets (bool), style, textStyle
function GlowButton({
  onPress,
  label,
  icon,
  disabled = false,
  gradient = C.GRAD_PINK,
  glowColor = C.PRIMARY,
  height = 44,
  radius = 4,
  brackets = true,
  style,
  textStyle,
}) {
  const fill = disabled ? [C.BG_RAISED, C.BG_MID] : gradient;
  const glow = disabled
    ? null
    : { shadowColor: glowColor, shadowOpacity: 0.55, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, elevation: 6 };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled}
      style={[glow, { opacity: disabled ? 0.5 : 1 }, style]}
    >
      <View style={[styles.clip, { height, borderRadius: radius, borderColor: disabled ? C.BORDER : C.BORDER_HUD }]}>
        <LinearGradient
          colors={fill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient colors={[C.GLASS_SHEEN, 'transparent']} style={styles.sheen} pointerEvents="none" />
        <View style={styles.row}>
          {icon ? <View style={styles.icon}>{icon}</View> : null}
          {label != null && (
            <Text style={[styles.label, textStyle]} numberOfLines={1}>
              {label}
            </Text>
          )}
        </View>
        {brackets && !disabled && (
          <CornerBrackets color={C.PRIMARY_LIGHT} size={9} thickness={1.5} inset={2} corners={['tl', 'br']} />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden', borderWidth: 1, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  sheen: { position: 'absolute', top: 0, left: 0, right: 0, height: '50%' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, gap: 7 },
  icon: { justifyContent: 'center', alignItems: 'center' },
  label: {
    color: C.BG_DEEP,
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});

export default React.memo(GlowButton);
