import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Line } from 'react-native-svg';
import { C } from '../../theme/colors';

// ── HudScreen ───────────────────────────────────────────────────────────────────
// Consistent screen backdrop: cool ink gradient + a faint tech grid overlay.
// One import gives every screen the same WuWa atmosphere. The grid is a static,
// non-interactive SVG (stretch viewBox) — cheap and never blocks input.
//
// Props: gradient (default C.GRAD_BG), grid (bool, default true), style, children
const GridOverlay = React.memo(function GridOverlay() {
  const lines = [];
  for (let i = 1; i < 12; i++) {
    const x = (100 / 12) * i;
    lines.push(<Line key={`v${i}`} x1={x} y1="0" x2={x} y2="100" stroke={C.BORDER_SUBTLE} strokeWidth="0.15" />);
  }
  for (let i = 1; i < 7; i++) {
    const y = (100 / 7) * i;
    lines.push(<Line key={`h${i}`} x1="0" y1={y} x2="100" y2={y} stroke={C.BORDER_SUBTLE} strokeWidth="0.15" />);
  }
  return (
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    >
      {lines}
    </Svg>
  );
});

function HudScreen({ gradient = C.GRAD_BG, grid = true, style, children }) {
  return (
    <View style={[styles.root, style]}>
      <LinearGradient colors={gradient} style={StyleSheet.absoluteFill} pointerEvents="none" />
      {grid && <GridOverlay />}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.BG_BASE },
});

export default React.memo(HudScreen);
