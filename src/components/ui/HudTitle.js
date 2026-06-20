import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { C, withAlpha } from '../../theme/colors';

// ── HudTitle ────────────────────────────────────────────────────────────────────
// Angular section header: skewed accent tick + uppercase glowing label + trailing
// hairline rule. Matches the tech-HUD type treatment used across screens.
//
// Props: text, accent, size, rule (trailing line, default true), style, textStyle
function HudTitle({ text, accent = C.PRIMARY, size = 13, rule = true, style, textStyle }) {
  return (
    <View style={[styles.row, style]}>
      <View style={[styles.tick, { backgroundColor: accent, shadowColor: accent }]} />
      <Text
        style={[
          styles.title,
          { fontSize: size, textShadowColor: withAlpha(accent, 0.5) },
          textStyle,
        ]}
        numberOfLines={1}
      >
        {String(text).toUpperCase()}
      </Text>
      {rule && <View style={styles.rule} />}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  tick: {
    width: 4,
    height: 16,
    marginRight: 9,
    transform: [{ skewX: '-14deg' }],
    shadowOpacity: 0.8,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 0 },
  },
  title: {
    color: C.TEXT,
    fontWeight: '900',
    letterSpacing: 2.5,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  rule: { flex: 1, height: 1, backgroundColor: C.BORDER, marginLeft: 12 },
});

export default React.memo(HudTitle);
