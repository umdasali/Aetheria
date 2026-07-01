import { useEffect, useRef, useMemo, useState } from 'react';
import { View, Text, Animated, StyleSheet, useWindowDimensions } from 'react-native';
import { FACTION_MATRIX } from '../theme/colors';
const CHAR_H   = 13;
const TRAIL    = 9;

// ─── Per-faction character sets ───────────────────────────────────────────────
const CHAR_SETS = {
  // EMBERVEIL — fire kanji + ember hex + lava symbols
  EMBERVEIL: [
    '炎','火','焔','燃','熱','煙','灼','炽',
    'F','F','4','5','0','0','A','5',
    '◈','♨','╬','◊','▲','△','⬡',
    '0','x','F','F','6','B','3','5',
  ],
  // GLACIARA — ice kanji + nordic runes + cryo hex
  GLACIARA: [
    '氷','冷','雪','凍','霜','結','寒','晶',
    'ᚱ','ᚦ','ᚨ','ᚾ','ᛁ','ᛏ','ᛚ','ᛜ',
    '0','0','B','4','D','8','8','1',
    '◆','◇','❄','✦','⬡','⬢','▷',
  ],
  // SUNSPIRE — holy kanji + sacred symbols + gold hex
  SUNSPIRE: [
    '光','聖','神','輝','祈','天','明','照',
    '☀','✧','★','⊕','✶','✴','☆','✺',
    'F','F','D','7','0','0','C','9',
    'I','V','X','L','C','M','Ω','Φ',
  ],
  // VERDANIA — nature kanji + botanical runes + green hex
  VERDANIA: [
    '葉','森','木','草','花','実','芽','根',
    '⬢','⊕','◉','✦','❧','☘','♧','✿',
    '2','E','C','C','7','1','2','7',
    'A','E','6','C','F','5','2','B',
  ],
  // VOIDMARK — void kanji + arcane operators + purple hex
  VOIDMARK: [
    '虚','闇','滅','空','無','冥','幽','霊',
    '∑','∆','∞','∂','√','∫','≡','⊕',
    '◈','⟁','⟐','✦','★','☆','⬡','◉',
    '9','B','5','9','B','6','8','E',
  ],
  // KHEMARA — sand/moon kanji + celestial symbols + amber hex
  KHEMARA: [
    '砂','月','星','時','夢','遥','幻','蜃',
    '☽','☾','✦','✧','⊛','⊕','◌','◎',
    'C','9','A','8','4','C','F','F',
    'F','3','C','D','A','B','7','8',
  ],
};

// ─── Per-faction column/speed config ─────────────────────────────────────────
const FACTION_CFG = {
  EMBERVEIL: { cols: 10, minDur: 1600, maxDur: 3000 },
  GLACIARA:  { cols: 11, minDur: 3200, maxDur: 5800 },
  SUNSPIRE:  { cols:  9, minDur: 2200, maxDur: 4200 },
  VERDANIA:  { cols: 10, minDur: 2600, maxDur: 5000 },
  VOIDMARK:  { cols: 12, minDur: 1400, maxDur: 2800 },
  KHEMARA:   { cols:  9, minDur: 2800, maxDur: 5200 },
};

function randChar(set) {
  return set[Math.floor(Math.random() * set.length)] ?? '0';
}

// ─── Single falling column ────────────────────────────────────────────────────
function MatrixColumn({ x, chars, head, trail, duration, containerH }) {
  const anim = useRef(new Animated.Value(0)).current;
  const colH = chars.length * CHAR_H;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(anim, { toValue: 1, duration, useNativeDriver: true })
    );
    loop.start();
    return () => { loop.stop(); anim.stopAnimation(); };
  }, []);

  const ty = anim.interpolate({
    inputRange:  [0, 1],
    outputRange: [-colH, containerH + CHAR_H],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={{ position: 'absolute', left: x, top: 0, transform: [{ translateY: ty }] }}
    >
      {chars.map((ch, i) => (
        <Text
          key={i}
          style={{
            height: CHAR_H,
            lineHeight: CHAR_H,
            fontSize: 11,
            fontWeight: i === 0 ? '900' : '600',
            color: i === 0 ? head : trail,
            opacity: i === 0 ? 1 : Math.max(0.03, 1 - i / TRAIL),
          }}
        >
          {ch}
        </Text>
      ))}
    </Animated.View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function FactionParticles({ faction }) {
  const { width: W, height: H } = useWindowDimensions();
  const cfg     = FACTION_CFG[faction];
  const colors  = FACTION_MATRIX[faction];
  const charSet = CHAR_SETS[faction];
  const [dim, setDim] = useState({ w: W, h: H });

  const columns = useMemo(() => {
    if (!cfg || !dim.w) return [];
    const colW = Math.floor(dim.w / cfg.cols);
    return Array.from({ length: cfg.cols }, (_, i) => ({
      id:       i,
      x:        i * colW,
      chars:    Array.from(
        { length: TRAIL + Math.floor(Math.random() * 6) },
        () => randChar(charSet),
      ),
      duration: Math.round(cfg.minDur + Math.random() * (cfg.maxDur - cfg.minDur)),
    }));
  }, [faction, dim.w]);

  if (!cfg || !colors) return null;

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      onLayout={e => setDim({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      <View style={styles.rain} pointerEvents="none">
        {columns.map(col => (
          <MatrixColumn
            key={col.id}
            x={col.x}
            chars={col.chars}
            head={colors.head}
            trail={colors.trail}
            duration={col.duration}
            containerH={dim.h}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rain: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    overflow: 'hidden',
    opacity:  0.30,
  },
});
