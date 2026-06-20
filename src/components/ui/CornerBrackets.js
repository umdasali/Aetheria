import React from 'react';
import { View, StyleSheet } from 'react-native';
import { C } from '../../theme/colors';

// ── CornerBrackets ──────────────────────────────────────────────────────────────
// Lightweight L-shaped tech-HUD corner accents (plain bordered Views, no SVG).
// List-cheap — use on cards/cells where HudFrame's SVG would be too heavy.
// Absolute-fills its parent (parent must be position:relative).
//
// Props: color, size, thickness, inset, corners ('all' | subset), opacity
function CornerBrackets({
  color = C.PRIMARY,
  size = 14,
  thickness = 2,
  inset = 0,
  corners = 'all',
  opacity = 1,
}) {
  const list = corners === 'all' ? ['tl', 'tr', 'br', 'bl'] : corners;
  const base = { position: 'absolute', width: size, height: size, borderColor: color, opacity };
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {list.includes('tl') && (
        <View style={[base, { top: inset, left: inset, borderTopWidth: thickness, borderLeftWidth: thickness }]} />
      )}
      {list.includes('tr') && (
        <View style={[base, { top: inset, right: inset, borderTopWidth: thickness, borderRightWidth: thickness }]} />
      )}
      {list.includes('bl') && (
        <View style={[base, { bottom: inset, left: inset, borderBottomWidth: thickness, borderLeftWidth: thickness }]} />
      )}
      {list.includes('br') && (
        <View style={[base, { bottom: inset, right: inset, borderBottomWidth: thickness, borderRightWidth: thickness }]} />
      )}
    </View>
  );
}

export default React.memo(CornerBrackets);
