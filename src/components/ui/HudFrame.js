import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { C } from '../../theme/colors';

// ── HudFrame ───────────────────────────────────────────────────────────────────
// Angular beveled / notched border (WuWa tech-HUD). Draws the STROKE only — keep
// fills in expo-linear-gradient (cheaper). Wrap content; the frame sizes to the box.
//
// Sizing policy:
//   • width & height given  → fixed numeric path (list-safe, exact px bevel)
//   • omitted               → viewBox 0..100 + preserveAspectRatio="none" stretch
//                             (no onLayout, reflows with the parent)
//
// Props:
//   width, height      — optional fixed size (else stretch mode)
//   bevel              — corner cut size (px in fixed mode, viewBox units in stretch)
//   corners            — 'all' | array subset of ['tl','tr','br','bl']
//   stroke, strokeWidth, fill, glow, style, children
function buildBevelPath(w, h, b, corners, inset) {
  const tl = corners.includes('tl');
  const tr = corners.includes('tr');
  const br = corners.includes('br');
  const bl = corners.includes('bl');
  const x0 = inset;
  const y0 = inset;
  const x1 = w - inset;
  const y1 = h - inset;
  const seg = [];
  // start at top edge, just right of a possible TL cut
  seg.push(`M ${x0 + (tl ? b : 0)} ${y0}`);
  seg.push(`L ${x1 - (tr ? b : 0)} ${y0}`);            // top edge → TR
  if (tr) seg.push(`L ${x1} ${y0 + b}`);               // TR cut
  seg.push(`L ${x1} ${y1 - (br ? b : 0)}`);            // right edge → BR
  if (br) seg.push(`L ${x1 - b} ${y1}`);               // BR cut
  seg.push(`L ${x0 + (bl ? b : 0)} ${y1}`);            // bottom edge → BL
  if (bl) seg.push(`L ${x0} ${y1 - b}`);               // BL cut
  seg.push(`L ${x0} ${y0 + (tl ? b : 0)}`);            // left edge → TL
  if (tl) seg.push(`L ${x0 + b} ${y0}`);               // TL cut
  seg.push('Z');
  return seg.join(' ');
}

function HudFrame({
  width,
  height,
  bevel,
  corners = 'all',
  stroke = C.BORDER_STRONG,
  strokeWidth = 1,
  fill = 'none',
  glow,
  style,
  children,
}) {
  const cornerList = corners === 'all' ? ['tl', 'tr', 'br', 'bl'] : corners;
  const fixed = typeof width === 'number' && typeof height === 'number';
  const b = bevel != null ? bevel : fixed ? 12 : 8;
  const inset = strokeWidth; // keep the stroke inside the box so it isn't clipped

  const vbW = fixed ? width : 100;
  const vbH = fixed ? height : 100;
  const d = buildBevelPath(vbW, vbH, b, cornerList, inset);

  const glowStyle = glow
    ? { shadowColor: stroke, shadowOpacity: 0.6, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 5 }
    : null;

  return (
    <View style={[glowStyle, style]}>
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${vbW} ${vbH}`}
        preserveAspectRatio={fixed ? 'xMidYMid meet' : 'none'}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      >
        <Path d={d} stroke={stroke} strokeWidth={strokeWidth} fill={fill} strokeLinejoin="miter" />
      </Svg>
      {children}
    </View>
  );
}

export default React.memo(HudFrame);
