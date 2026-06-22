import { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { C, RANK } from '../../theme/colors';

const CHAR_H = 13;
const TRAIL_LEN = 10;

// Character sets per rank — each pool mixes meaningful tokens + symbols
const CHAR_SETS = {
  // C — hex dump aesthetic: raw bytes, addresses, classic green matrix
  C: [
    '0','1','2','3','4','5','6','7','8','9',
    'A','B','C','D','E','F',
    '0','x','F','F','0','0','A','E','B','C',   // 0xFF, 0xAE style
    '#','%','&','|','>','<',
  ],
  // B — cipher / data stream: katakana glyphs + hex pairs
  B: [
    'ア','イ','ウ','エ','オ','カ','キ','ク','ケ','コ',
    'サ','シ','ス','セ','ソ','ナ','ニ','ヌ','ネ','ノ',
    '0','1','2','3','4','5','6','7','8','9',
    'A','B','C','D','E','F','x','#',
  ],
  // A — neural signal: half-width kana + latin glyphs + signal chars
  A: [
    'ｱ','ｲ','ｳ','ｴ','ｵ','ｶ','ｷ','ｸ','ｹ','ｺ',
    'ｻ','ｼ','ｽ','ｾ','ｿ','ﾀ','ﾁ','ﾂ','ﾃ','ﾄ',
    'A','B','C','D','E','F','G','H','I','J',
    '0','1','2','3','4','5','6','7','8','9',
    '±','×','÷','≠','≈','∂','λ','π',
  ],
  // S — full katakana — dense, fast, pink surge
  S: [
    'ア','イ','ウ','エ','オ','カ','キ','ク','ケ','コ',
    'サ','シ','ス','セ','ソ','タ','チ','ツ','テ','ト',
    'ナ','ニ','ヌ','ネ','ノ','ハ','ヒ','フ','ヘ','ホ',
    'マ','ミ','ム','メ','モ','ラ','リ','ル','レ','ロ',
    'ヤ','ユ','ヨ','ワ','ヲ','ン',
    '0','1','2','3','4','5','6','7','8','9',
  ],
  // SOVEREIGN — divine code: katakana + math operators + esoteric symbols + gold hex
  SOVEREIGN: [
    'ア','イ','ウ','エ','オ','カ','キ','ク','ケ','コ',
    'サ','シ','ス','セ','ソ','タ','チ','ツ','テ','ト',
    '∑','∆','∞','∂','√','∫','∮','≡','≜','⊕',
    '◈','◉','✦','✧','⬡','⬢','★','☆','⟁','⟐',
    'F','F','D','7','0','0','A','U','R','A',   // FFD700 AURA
    '0','x','G','O','L','D',
  ],
};

// Colors pulled from RANK tokens so matrix rain matches the rank badge palette
const RANK_CFG = {
  C:         { cols: 12, minDur: 3500, maxDur: 6000, head: RANK.C.glow,         trail: RANK.C.bg },
  B:         { cols: 14, minDur: 3000, maxDur: 5500, head: RANK.B.glow,         trail: RANK.B.bg },
  A:         { cols: 16, minDur: 2500, maxDur: 5000, head: RANK.A.glow,         trail: RANK.A.bg },
  S:         { cols: 18, minDur: 2000, maxDur: 4200, head: RANK.S.glow,         trail: RANK.S.bg },
  SOVEREIGN: { cols: 20, minDur: 1500, maxDur: 3500, head: RANK.SOVEREIGN.glow, trail: RANK.SOVEREIGN.bg },
};

function randChar(set) {
  return set[Math.floor(Math.random() * set.length)] ?? '0';
}

// Single falling column — translateY loop from above to below container
function MatrixColumn({ x, chars, head, trail, duration, containerH }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(anim, { toValue: 1, duration, useNativeDriver: true })
    );
    loop.start();
    return () => { loop.stop(); anim.stopAnimation(); };
  }, []);

  const colH = chars.length * CHAR_H;
  const ty   = anim.interpolate({
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
            height: CHAR_H, lineHeight: CHAR_H,
            fontSize: 11,
            fontWeight: i === 0 ? '900' : '600',
            color: i === 0 ? head : trail,
            opacity: i === 0 ? 1 : Math.max(0.04, 1 - i / TRAIL_LEN),
          }}
        >
          {ch}
        </Text>
      ))}
    </Animated.View>
  );
}

// All require() calls must be static — no dynamic paths allowed.
// SOVEREIGN falls back to S-Rank until its own video is added.
const RANK_VIDEOS = {
  C:         require('../../../assets/video/C-Rank.mp4'),
  B:         require('../../../assets/video/B-Rank.mp4'),
  A:         require('../../../assets/video/A-Rank.mp4'),
  S:         require('../../../assets/video/S-Rank.mp4'),
  SOVEREIGN: require('../../../assets/video/Sovereign-Rank.mp4'),
};

export default function ForgeViz({ rank = 'C' }) {
  const [dim, setDim] = useState({ w: 0, h: 0 });
  const cfg     = RANK_CFG[rank] ?? RANK_CFG.C;
  const charSet = CHAR_SETS[rank] ?? CHAR_SETS.C;

  // expo-video: loop + muted background video — initial source is rank-specific
  const player = useVideoPlayer(
    RANK_VIDEOS[rank] ?? RANK_VIDEOS.C,
    p => { p.loop = true; p.muted = true; p.play(); }
  );

  // Swap video when rank changes (e.g. after fusion on the Forge tab).
  // replaceAsync loads off the main thread — avoids the UI-freeze warning from replace().
  useEffect(() => {
    const src = RANK_VIDEOS[rank] ?? RANK_VIDEOS.C;
    player.replaceAsync(src).then(() => player.play()).catch(() => {});
  }, [rank]);

  // Generate columns once per rank / container-width
  const columns = useMemo(() => {
    if (!dim.w) return [];
    const colW = Math.floor(dim.w / cfg.cols);
    return Array.from({ length: cfg.cols }, (_, i) => ({
      id:       i,
      x:        i * colW,
      chars:    Array.from(
        { length: TRAIL_LEN + Math.floor(Math.random() * 8) },
        () => randChar(charSet),
      ),
      duration: Math.round(cfg.minDur + Math.random() * (cfg.maxDur - cfg.minDur)),
    }));
  }, [rank, dim.w]);

  return (
    <View
      style={StyleSheet.absoluteFill}
      onLayout={e => setDim({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      {/* Looping rank video */}
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
      />

      {/* Dark veil so matrix stays legible */}
      <View style={styles.overlay} pointerEvents="none" />

      {/* Matrix rain */}
      {dim.w > 0 && (
        <View style={[StyleSheet.absoluteFill, styles.rain]} pointerEvents="none">
          {columns.map(col => (
            <MatrixColumn
              key={col.id}
              x={col.x}
              chars={col.chars}
              head={cfg.head}
              trail={cfg.trail}
              duration={col.duration}
              containerH={dim.h}
            />
          ))}
        </View>
      )}

      {/* Pulsating rank badge at centre */}
      {dim.w > 0 && <PulsingRankBadge rank={rank} cx={dim.w / 2} cy={dim.h / 2} />}
    </View>
  );
}

// ── Pulsating rank circle ─────────────────────────────────────────────────────
function PulsingRankBadge({ rank, cx, cy }) {
  const rc      = RANK[rank] ?? RANK.C;
  const isSov   = rank === 'SOVEREIGN';
  const label   = isSov ? '✦' : rank;
  const CORE    = 52;
  const RING    = 90;
  const DUR     = 1600;
  const RINGS   = 2;   // extra ring for SOVEREIGN

  const anims = useRef(Array.from({ length: RINGS }, () => new Animated.Value(0))).current;

  useEffect(() => {
    const loops = anims.map((a, i) => {
      const loop = Animated.loop(
        Animated.timing(a, { toValue: 1, duration: DUR, useNativeDriver: true })
      );
      const t = setTimeout(() => loop.start(), (DUR / RINGS) * i);
      return { loop, t };
    });
    return () => loops.forEach(({ loop, t }) => { loop.stop(); clearTimeout(t); });
  }, []);

  const ringStyle = (anim) => ({
    position: 'absolute',
    left: cx - RING / 2, top: cy - RING / 2,
    width: RING, height: RING, borderRadius: RING / 2,
    borderWidth: isSov ? 2.5 : 2,
    borderColor: rc.glow,
    opacity:   anim.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0, 0.9, 0] }),
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] }) }],
  });

  return (
    <>
      {anims.map((a, i) => (
        <Animated.View key={i} pointerEvents="none" style={ringStyle(a)} />
      ))}

      {/* Core badge */}
      <View
        pointerEvents="none"
        style={[styles.rankCore, {
          left: cx - CORE / 2, top: cy - CORE / 2,
          width: CORE, height: CORE, borderRadius: CORE / 2,
          backgroundColor: rc.bg + '33',
          borderColor: rc.glow,
          borderWidth: isSov ? 2.5 : 2,
        }]}
      >
        {/* {isSov && <Text style={[styles.rankCoreSub, { color: C.SOVEREIGN_GOLD, fontSize: 32 }]}>🐉</Text>} */}
        <Text style={[styles.rankCoreTxt, { color: isSov ? C.SOVEREIGN_GOLD : rc.text, fontSize: isSov ? 22 : 18 }]}>{isSov ? 'SOV' : label }</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay:     { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: C.OVERLAY_3 },
  rain:        { overflow: 'hidden' },
  rankCore:    { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  rankCoreSub: { fontSize: 6, fontWeight: '900', letterSpacing: 1.5, marginBottom: 1, opacity: 0.85 },
  rankCoreTxt: { fontWeight: '900', letterSpacing: 1 },
});
