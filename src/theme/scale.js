/**
 * Responsive scale utility — landscape-only game at reference 960px wide.
 *
 * rs(n)  — scales spacing / border-radii / icon sizes / fixed dimensions
 * rf(n)  — scales font sizes (tighter clamp so text stays legible on phones)
 *
 * Both work in StyleSheet.create (module-level snapshot) and in components via
 * makeScale(liveW) for truly live updates on window resize (Expo web / foldables).
 *
 * Reference 960 puts a typical landscape phone (~844px) at scale 0.88 so styles
 * render close to their design values. Tablets (1024–1200px) land at ~1.07–1.25.
 */
import { Dimensions } from 'react-native';

const BASE_W = 960;

const { width: W } = Dimensions.get('window');

// Sizes: 0.70 – 1.30 of the design value
export const scale  = Math.max(0.70, Math.min(1.30, W / BASE_W));

// Fonts: 0.80 – 1.18 — narrower range keeps text legible even on small phones
const fScale = Math.max(0.80, Math.min(1.18, W / BASE_W));

/** Responsive size — use for padding, margin, width, height, borderRadius, gap */
export const rs = n => Math.max(1, Math.round(n * scale));

/** Responsive font size — minimum 10 px to stay legible */
export const rf = n => Math.max(10, Math.round(n * fScale));

/**
 * makeScale(liveW) — call inside a component that uses useWindowDimensions()
 * so the returned helpers are re-computed on every resize.
 *
 * Example:
 *   const { width: W } = useWindowDimensions();
 *   const { rs, rf } = makeScale(W);
 */
export function makeScale(liveW) {
  const s  = Math.max(0.70, Math.min(1.30, liveW / BASE_W));
  const fs = Math.max(0.80, Math.min(1.18, liveW / BASE_W));
  return {
    scale: s,
    rs: n => Math.max(1, Math.round(n * s)),
    rf: n => Math.max(10, Math.round(n * fs)),
  };
}
