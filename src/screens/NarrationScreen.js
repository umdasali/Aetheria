import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, Animated, Dimensions, useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '../theme/colors';
import { rs, rf } from '../theme/scale';
import AudioManager from '../utils/AudioManager';
import { CHAPTER_DEFS } from '../data/story';
import { getEnemyImage } from '../data/enemies';

const { width: W, height: H } = Dimensions.get('window');
// ~4% of screen height, clamped between 12px (small phones) and 24px (large tablets)
const LBOX    = Math.min(24, Math.max(12, Math.floor(H * 0.04)));
const LEFT_W  = Math.floor(W * 0.42);
const TYPE_MS = 26;
const N_PARTS = 14;

// ─── Floating particle ────────────────────────────────────────────────────────
function Particle({ color, delay, duration, x, size }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 0,        useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);
  const ty      = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -(H * 0.65)] });
  const opacity = anim.interpolate({ inputRange: [0, 0.07, 0.78, 1], outputRange: [0, 0.9, 0.38, 0] });
  return (
    <Animated.View style={{
      position: 'absolute', left: x, bottom: rs(28),
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: color, opacity,
      transform: [{ translateY: ty }],
    }} />
  );
}

// ─── NarrationScreen ──────────────────────────────────────────────────────────
export default function NarrationScreen({ navigation, route }) {
  const { top: topInset, bottom: bottomInset, left: leftInset, right: rightInset } = useSafeAreaInsets();
  const { width: W, height: H } = useWindowDimensions();
  const { stage, enemyGroup, autoSkip } = route.params || {};
  // Guard against a missing/malformed nav entry (restored state, etc.) — the
  // mount effect below navigates away and the component early-returns null.
  const invalidParams = !stage || !Array.isArray(enemyGroup?.enemies) || enemyGroup.enemies.length === 0;

  const chapter   = CHAPTER_DEFS.find(c => c.id === stage?.chapterId);
  const mainEnemy = enemyGroup?.enemies?.[(enemyGroup?.enemies?.length || 1) - 1];
  const enemyImg  = mainEnemy ? getEnemyImage(mainEnemy.imageKey) : null;
  const isBoss    = stage?.part === 3;
  const chColor   = chapter?.color  || C.PRIMARY;
  const chAccent  = chapter?.accent || C.PRIMARY_LIGHT;
  // chColor is used only for ambient/atmospheric effects (gradient tints, glow, decorative line).
  // chFg is the interactive foreground color — always uses chAccent which is guaranteed to be
  // a bright, visible hue. Chapters 21-25 have near-black chColor values that would render
  // text, borders, and icons invisible against the dark background.
  const chFg      = chAccent;

  const [dlgIdx,     setDlgIdx]     = useState(0);
  const [shown,      setShown]      = useState('');
  const [typing,     setTyping]     = useState(true);
  const [showCursor, setShowCursor] = useState(true);
  const typeTimer  = useRef(null);
  const cursorRef  = useRef(null);

  // ── Animated values ──────────────────────────────────────────────────────
  const screenFade = useRef(new Animated.Value(0)).current;
  const imgScale   = useRef(new Animated.Value(0.7)).current;
  const imgFade    = useRef(new Animated.Value(0)).current;
  const floatY     = useRef(new Animated.Value(0)).current;
  const glowPulse  = useRef(new Animated.Value(0.2)).current;
  const dlgSlide   = useRef(new Animated.Value(48)).current;
  const dlgFade    = useRef(new Animated.Value(0)).current;
  const spkScale   = useRef(new Animated.Value(0.8)).current;
  const btnPulse   = useRef(new Animated.Value(1)).current;
  const linePulse  = useRef(new Animated.Value(0.4)).current;

  // ── Story BGM — keep playing while narration is shown ────────────────────
  useEffect(() => {
    AudioManager.startStoryBGM();
    return () => AudioManager.stopStoryBGM();
  }, []);

  // ── Screen entrance + loops ───────────────────────────────────────────────
  useEffect(() => {
    Animated.parallel([
      Animated.timing(screenFade, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(imgScale,   { toValue: 1, friction: 5, tension: 65, useNativeDriver: true }),
      Animated.timing(imgFade,    { toValue: 1, duration: 950, useNativeDriver: true }),
    ]).start();

    // Float
    const floatLoop = Animated.loop(Animated.sequence([
      Animated.timing(floatY, { toValue: -13, duration: 2900, useNativeDriver: true }),
      Animated.timing(floatY, { toValue:   0, duration: 2900, useNativeDriver: true }),
    ]));
    floatLoop.start();

    // Glow
    const glowLoop = Animated.loop(Animated.sequence([
      Animated.timing(glowPulse, { toValue: 0.68, duration: 1800, useNativeDriver: true }),
      Animated.timing(glowPulse, { toValue: 0.18, duration: 1800, useNativeDriver: true }),
    ]));
    glowLoop.start();

    // Decorative line
    const lineLoop = Animated.loop(Animated.sequence([
      Animated.timing(linePulse, { toValue: 1.0, duration: 1600, useNativeDriver: true }),
      Animated.timing(linePulse, { toValue: 0.4, duration: 1600, useNativeDriver: true }),
    ]));
    lineLoop.start();

    // Cursor blink
    cursorRef.current = setInterval(() => setShowCursor(v => !v), 480);

    return () => {
      floatLoop.stop();
      glowLoop.stop();
      lineLoop.stop();
      clearInterval(typeTimer.current);
      clearInterval(cursorRef.current);
    };
  }, []);

  // ── Battle button pulse ───────────────────────────────────────────────────
  const btnPulseLoop = useRef(null);
  const pulseBattleBtn = useCallback(() => {
    btnPulseLoop.current?.stop();
    btnPulseLoop.current = Animated.loop(Animated.sequence([
      Animated.timing(btnPulse, { toValue: 1.07, duration: 620, useNativeDriver: true }),
      Animated.timing(btnPulse, { toValue: 1.00, duration: 620, useNativeDriver: true }),
    ]));
    btnPulseLoop.current.start();
  }, []);
  useEffect(() => () => btnPulseLoop.current?.stop(), []);

  // ── Typewriter + slide-in per dialogue ───────────────────────────────────
  const startDlg = useCallback((idx) => {
    setShown('');
    setTyping(true);
    dlgSlide.setValue(48);
    dlgFade.setValue(0);
    spkScale.setValue(0.78);

    Animated.parallel([
      Animated.timing(dlgSlide, { toValue: 0, duration: 260, useNativeDriver: true }),
      Animated.timing(dlgFade,  { toValue: 1, duration: 260, useNativeDriver: true }),
      Animated.spring(spkScale, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }),
    ]).start();

    const full = stage.dialogues[idx].text;
    let i = 0;
    clearInterval(typeTimer.current);
    typeTimer.current = setInterval(() => {
      i++;
      setShown(full.slice(0, i));
      if (i >= full.length) {
        clearInterval(typeTimer.current);
        setTyping(false);
        if (idx === stage.dialogues.length - 1) pulseBattleBtn();
      }
    }, TYPE_MS);
  }, [stage, pulseBattleBtn]);

  useEffect(() => {
    if (invalidParams) {
      navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home');
      return;
    }
    // If this is a retry, skip narration and go straight to battle
    if (autoSkip) {
      navigation.replace('Battle', {
        chapterEnemies:  enemyGroup,
        chapterId:       stage.id,
        chapterRewards:  stage.rewards,
        fromStory:       true,
      });
      return; // Don't start typewriter
    }
    startDlg(0);
  }, []);

  // Invalid entry — render nothing; the mount effect navigates away.
  if (invalidParams) return null;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const skipTyping = () => {
    if (!typing) return;
    clearInterval(typeTimer.current);
    setShown(stage.dialogues[dlgIdx].text);
    setTyping(false);
    if (dlgIdx === stage.dialogues.length - 1) pulseBattleBtn();
  };

  const handlePrev = () => {
    if (dlgIdx > 0) { const n = dlgIdx - 1; setDlgIdx(n); startDlg(n); }
  };

  const handleNext = () => {
    if (typing) { skipTyping(); return; }
    if (dlgIdx < stage.dialogues.length - 1) { const n = dlgIdx + 1; setDlgIdx(n); startDlg(n); }
  };

  const handleBeginBattle = () => {
    clearInterval(typeTimer.current);
    clearInterval(cursorRef.current);
    navigation.replace('Battle', {
      chapterEnemies:  enemyGroup,
      chapterId:       stage.id,
      chapterRewards:  stage.rewards,
      fromStory:       true,
    });
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const isLast    = dlgIdx === stage.dialogues.length - 1;
  const partLabel = isBoss ? '☠  BOSS FIGHT' : stage.part === 2 ? '⚔  ELITE FIGHT' : '⚡  BATTLE';
  const partColor = isBoss ? C.DANGER : chFg;

  const particles = Array.from({ length: N_PARTS }, (_, i) => ({
    delay:    i * 360,
    duration: 3200 + (i % 5) * 350,
    x:        (LEFT_W / N_PARTS) * i + 6,
    size:     2 + (i % 3) * 2,
  }));

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Animated.View style={[S.root, { opacity: screenFade }]}>

      {/* Atmospheric background */}
      <LinearGradient
        colors={[C.BG_VOID, chColor + '12', C.BG_VOID, C.BG_VOID]}
        start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Side vignette */}
      <LinearGradient
        colors={[chColor + '08', 'transparent', chColor + '08']}
        start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Cinematic letterbox bars */}
      <View style={S.lbTop} />
      <View style={[S.lbBottom, { height: LBOX + bottomInset }]} />

      {/* Back button — positioned over the letterbox */}
      <TouchableOpacity
        style={[S.backBtn, { top: LBOX + topInset + 8, left: leftInset + 10 }]}
        onPress={() => { AudioManager.playButtonSFX(); navigation.goBack(); }}
        activeOpacity={0.75}
      >
        <Ionicons name="chevron-back" size={rs(20)} color={C.TEXT_ON_DARK} />
      </TouchableOpacity>

      <View style={[S.body, { marginTop: LBOX + topInset, marginBottom: LBOX + bottomInset, marginLeft: leftInset, marginRight: rightInset }]}>

        {/* ── LEFT PANEL: enemy image ────────────────────────── */}
        <View style={S.leftPanel}>

          {/* Ambient particles */}
          {particles.map((p, i) => (
            <Particle key={i} color={chColor + 'BB'} delay={p.delay} duration={p.duration} x={p.x} size={p.size} />
          ))}

          {/* Glow disc */}
          <Animated.View style={[S.glowDisc, {
            backgroundColor: chColor + '22',
            shadowColor: chColor,
            opacity: glowPulse,
          }]} />

          {/* Enemy image — floating + scale entrance */}
          <Animated.View style={{
            transform: [{ translateY: floatY }, { scale: imgScale }],
            opacity: imgFade,
          }}>
            <Image source={enemyImg} style={S.enemyImg} resizeMode="contain" />
          </Animated.View>

          {/* Enemy name badge */}
          <View style={[S.enemyLabel, { borderColor: chColor + '60', backgroundColor: C.OVERLAY_3 }]}>
            <Text style={[S.enemyLabelTxt, { color: chAccent }]} numberOfLines={1}>
              {mainEnemy.name.toUpperCase()}
            </Text>
          </View>

          {/* Tier badge */}
          <View style={[S.tierBadge, {
            backgroundColor: partColor + '18',
            borderColor: partColor + '55',
          }]}>
            <Text style={[S.tierBadgeTxt, { color: partColor }]}>{mainEnemy.tier.toUpperCase()}</Text>
          </View>
        </View>

        {/* ── RIGHT PANEL: narration ─────────────────────────── */}
        <View style={S.rightPanel}>

          {/* Stage header */}
          <View style={S.stageHdr}>
            <View style={[S.partBadge, { backgroundColor: partColor + '18', borderColor: partColor }]}>
              <Text style={[S.partBadgeTxt, { color: partColor }]}>{partLabel}</Text>
            </View>
            <View style={[S.chChip, { backgroundColor: chColor + '22' }]}>
              <Text style={[S.chChipTxt, { color: chAccent }]}>CH {stage.chapterId}</Text>
            </View>
          </View>

          <Text style={S.stageTitle} numberOfLines={1}>{stage.title.toUpperCase()}</Text>

          {/* Animated accent line */}
          <Animated.View style={[S.accentLine, { backgroundColor: chColor, opacity: linePulse }]} />

          {/* Dialogue box — tap to skip typewriter */}
          <TouchableOpacity activeOpacity={1} onPress={skipTyping} style={[S.dlgBox, { borderColor: chColor + '28' }]}>
            <LinearGradient
              colors={[C.SHADOW + 'A6', C.SHADOW + '61']}
              style={StyleSheet.absoluteFill}
            />

            <Animated.View style={{ transform: [{ translateY: dlgSlide }], opacity: dlgFade }}>
              {/* Speaker + counter */}
              <Animated.View style={[S.spkRow, { transform: [{ scale: spkScale }] }]}>
                <View style={[S.spkBadge, { borderColor: chFg, backgroundColor: chColor + '22' }]}>
                  <Text style={[S.spkTxt, { color: chFg }]}>
                    {stage.dialogues[dlgIdx].speaker.toUpperCase()}
                  </Text>
                </View>
                <Text style={S.dlgCount}>{dlgIdx + 1} / {stage.dialogues.length}</Text>
              </Animated.View>

              {/* Typewriter text + cursor */}
              <Text style={S.dlgTxt}>
                {shown}{typing && showCursor ? <Text style={{ color: chFg }}>▌</Text> : ''}
              </Text>

              {typing && <Text style={S.tapHint}>tap anywhere to skip</Text>}
            </Animated.View>
          </TouchableOpacity>

          {/* Progress dots */}
          <View style={S.dotsRow}>
            {stage.dialogues.map((_, i) => (
              <View key={i} style={[S.dot, {
                backgroundColor: i === dlgIdx ? chFg : chFg + '2E',
                width: i === dlgIdx ? rs(18) : rs(6),
              }]} />
            ))}
          </View>

          {/* Navigation controls */}
          <View style={S.controls}>
            {dlgIdx > 0 ? (
              <TouchableOpacity style={S.prevBtn} onPress={handlePrev}>
                <Ionicons name="chevron-back" size={rs(22)} color={C.TEXT_ON_DARK_WEAK} />
                <Text style={S.prevTxt}>Prev</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ flex: 1 }} />
            )}

            {!isLast ? (
              <TouchableOpacity style={[S.nextBtn, { borderColor: chFg + 'AA' }]} onPress={handleNext}>
                <Text style={[S.nextTxt, { color: chFg }]}>
                  {typing ? 'Skip' : 'Next'}
                </Text>
                <Ionicons name={typing ? 'play-skip-forward' : 'chevron-forward'} size={rs(21)} color={chFg} />
              </TouchableOpacity>
            ) : (
              <Animated.View style={{ transform: [{ scale: btnPulse }] }}>
                <TouchableOpacity onPress={handleBeginBattle} activeOpacity={0.85}>
                  <LinearGradient
                    colors={isBoss ? [C.DANGER, C.DANGER_DARK] : C.GRAD_PINK}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={S.battleBtn}
                  >
                    <Ionicons name={isBoss ? 'skull' : 'flash'} size={rs(21)} color={C.TEXT} />
                    <Text style={S.battleBtnTxt}>
                      {isBoss ? 'BOSS BATTLE' : 'BEGIN BATTLE'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>

        </View>
      </View>
    </Animated.View>
  );
}

const S = StyleSheet.create({
  root:     { flex: 1, backgroundColor: C.BG_VOID },
  lbTop:    { position: 'absolute', top: 0, left: 0, right: 0, height: LBOX, backgroundColor: C.BG_VOID, zIndex: 10 },
  lbBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: LBOX, backgroundColor: C.BG_VOID, zIndex: 10 },
  backBtn:  { position: 'absolute', zIndex: 20, padding: rs(8), borderRadius: rs(20), backgroundColor: C.OVERLAY_2 },
  body:     { flex: 1, flexDirection: 'row' },

  // Left
  leftPanel:    { width: LEFT_W, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  glowDisc:     { position: 'absolute', width: LEFT_W * 0.75, height: LEFT_W * 0.75, borderRadius: LEFT_W * 0.375, shadowRadius: 55, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, elevation: 35 },
  enemyImg:     { width: LEFT_W * 0.88, height: (H - LBOX * 2) * 0.8 },
  enemyLabel:   { position: 'absolute', bottom: rs(28), left: rs(12), right: rs(12), borderWidth: 1, borderRadius: rs(5), paddingHorizontal: rs(8), paddingVertical: rs(4), alignItems: 'center' },
  enemyLabelTxt:{ fontSize: rf(12), fontWeight: '800', letterSpacing: 2.5 },
  tierBadge:    { position: 'absolute', top: rs(10), left: rs(10), borderWidth: 1, borderRadius: rs(4), paddingHorizontal: rs(7), paddingVertical: rs(3) },
  tierBadgeTxt: { fontSize: rf(11), fontWeight: '900', letterSpacing: 1.5 },

  // Right
  rightPanel: { flex: 1, paddingHorizontal: rs(16), paddingVertical: rs(12), justifyContent: 'center', gap: rs(8) },

  stageHdr:    { flexDirection: 'row', alignItems: 'center', gap: rs(8) },
  partBadge:   { borderWidth: 1, borderRadius: rs(5), paddingHorizontal: rs(9), paddingVertical: rs(3) },
  partBadgeTxt:{ fontSize: rf(12), fontWeight: '900', letterSpacing: 1 },
  chChip:      { borderRadius: rs(5), paddingHorizontal: rs(8), paddingVertical: rs(3) },
  chChipTxt:   { fontSize: rf(12), fontWeight: '800', letterSpacing: 1 },

  stageTitle:  { fontSize: rf(15), fontWeight: '900', color: C.TEXT, letterSpacing: 3 },
  accentLine:  { height: 2, borderRadius: 1, width: '100%' },

  dlgBox:  { flex: 1, borderRadius: rs(10), padding: rs(12), overflow: 'hidden', borderWidth: 1, minHeight: rs(100) },
  spkRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: rs(9) },
  spkBadge:{ borderRadius: rs(5), borderWidth: 1, paddingHorizontal: rs(9), paddingVertical: rs(3) },
  spkTxt:  { fontSize: rf(13), fontWeight: '900', letterSpacing: 1.8 },
  dlgCount:{ fontSize: rf(12), color: C.TEXT_ON_DARK_DIM, fontWeight: '600' },
  dlgTxt:  { fontSize: rf(13), color: C.FLASH_WHITE + 'E0', lineHeight: rf(20), fontWeight: '500' },
  tapHint: { fontSize: rf(12), color: C.GLASS_8, marginTop: rs(7), fontStyle: 'italic' },

  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: rs(5) },
  dot:     { height: rs(6), borderRadius: rs(3) },

  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  prevBtn:  { flexDirection: 'row', alignItems: 'center', gap: rs(3), paddingVertical: rs(9), paddingHorizontal: rs(10), flex: 1 },
  prevTxt:  { fontSize: rf(12), color: C.TEXT_ON_DARK_WEAK, fontWeight: '600' },
  nextBtn:  { flexDirection: 'row', alignItems: 'center', gap: rs(4), borderWidth: 1, borderRadius: rs(8), paddingHorizontal: rs(16), paddingVertical: rs(9) },
  nextTxt:  { fontSize: rf(13), fontWeight: '700' },
  battleBtn:   { flexDirection: 'row', alignItems: 'center', gap: rs(8), borderRadius: rs(10), paddingHorizontal: rs(22), paddingVertical: rs(12) },
  battleBtnTxt:{ fontSize: rf(13), fontWeight: '900', color: C.TEXT, letterSpacing: 1 },
});
