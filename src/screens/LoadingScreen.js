import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Image, Animated,
  Easing, useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as SplashScreen from 'expo-splash-screen';
import { C } from '../theme/colors';
import { rs, rf } from '../theme/scale';
import useGameStore from '../store/gameStore';
import { HEROES } from '../data/heroes';
import { APP_INFO } from '../constants/appInfo';
import AudioManager from '../utils/AudioManager';

const TIPS = [
  'Assembling your war council…',
  'Sharpening the cards of fate…',
  'Awakening ancient heroes…',
  'Forging alliances across factions…',
  'Loading strategic formations…',
  'Summoning legendary champions…',
  'Preparing the battlefield…',
  'Charging the elemental powers…',
  'Synchronizing hero abilities…',
  'The battle is about to begin…',
];

const SPLASH_IMG = require('../../assets/splash/splash-landscape.png');

// ── Critical images rendered off-screen during loading ────────────────────────
// React Native decodes each Image source the first time it paints on screen.
// Rendering them here at 0×0 pre-warms the decode cache so every subsequent
// screen that uses these images paints instantly with no jank.
const PRELOAD_SOURCES = [
  require('../../assets/background/bg_001.webp'),
  require('../../assets/background/bg_002.webp'),
  require('../../assets/background/bg_003.webp'),
  require('../../assets/faction/EMBERVEIL.png'),
  require('../../assets/faction/GLACIARA.png'),
  require('../../assets/faction/SUNSPIRE.webp'),
  require('../../assets/faction/VERDANIA.png'),
  require('../../assets/faction/VOIDMARK.webp'),
  require('../../assets/currency/gem.png'),
  require('../../assets/currency/gold.png'),
  require('../../assets/currency/pack.png'),
  require('../../assets/currency/packs.png'),
  require('../../assets/currency/heroes.webp'),
  require('../../assets/currency/team.webp'),
  require('../../assets/enemy/boss_001.webp'),
  // First 16 hero portraits — covers the team picker and Collection first page
  ...HEROES.slice(0, 16).map(h => h.image),
];

export default function LoadingScreen({ navigation }) {
  // Live window dimensions — re-reads after the landscape orientation lock
  // settles, so the splash always fills the real screen (no stale portrait
  // width that would leave the right edge clipped).
  const { width: W, height: H } = useWindowDimensions();
  const BAR_W = W * 0.52;

  const progressAnim = useRef(new Animated.Value(0)).current;
  const tipFade      = useRef(new Animated.Value(1)).current;
  const screenFade   = useRef(new Animated.Value(0)).current;

  const [percent,  setPercent]  = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const tipRef = useRef(0);

  // Fade in loading screen, then hide native splash
  useEffect(() => {
    Animated.timing(screenFade, {
      toValue: 1, duration: 280, useNativeDriver: true,
    }).start(() => SplashScreen.hideAsync());
  }, []);

  // Progress bar — smooth cubic fill over 2400 ms to give images time to decode,
  // then navigate ONLY once BOTH the bar animation AND store hydration have finished.
  // Reading hasSeenOnboarding at mount used to race AsyncStorage rehydrate: if the bar
  // finished first, a returning player was wrongly sent to Onboarding. We now wait for
  // persist hydration and read the flag fresh at navigation time.
  useEffect(() => {
    const listenerId = progressAnim.addListener(({ value }) =>
      setPercent(Math.round(value * 100))
    );

    let navigated = false;
    let barDone   = false;
    let hydrated  = useGameStore.persist.hasHydrated();

    const tryNavigate = () => {
      if (navigated || !barDone || !hydrated) return;
      navigated = true;
      AudioManager.prewarmSFX();
      // Best-effort, fire-and-forget: retries a uid/name claim that previously
      // failed offline mid-registration (see CloudAuthScreen.js /
      // EditProfileScreen.js). Guests who never registered have nothing
      // pending here, so this is a no-op for them — claimPlayerUid/claimName
      // now only fire from CloudAuthScreen's sign-up flow, not unconditionally
      // on every launch, so an install that never registers never reserves a
      // uid/name row server-side.
      useGameStore.getState().retryPendingNameClaim();
      const seen = useGameStore.getState().hasSeenOnboarding;
      navigation.replace(seen ? 'Home' : 'Onboarding');
    };

    // onFinishHydration only fires for hydrations that complete AFTER subscribing, so we
    // seed `hydrated` from hasHydrated() above for the already-rehydrated case.
    const unsub = useGameStore.persist.onFinishHydration(() => { hydrated = true; tryNavigate(); });
    // Safety net: never hang on the splash if hydration somehow stalls.
    const hydrationFallback = setTimeout(() => { hydrated = true; tryNavigate(); }, 5000);

    Animated.timing(progressAnim, {
      toValue:  1,
      duration: 2400,
      easing:   Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(() => {
      setPercent(100);
      setTimeout(() => { barDone = true; tryNavigate(); }, 200);
    });

    return () => {
      progressAnim.removeListener(listenerId);
      if (unsub) unsub();
      clearTimeout(hydrationFallback);
    };
  }, []);

  // Rotate tips every 1.4 s with fade crossfade
  useEffect(() => {
    const id = setInterval(() => {
      Animated.timing(tipFade, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
        tipRef.current = (tipRef.current + 1) % TIPS.length;
        setTipIndex(tipRef.current);
        Animated.timing(tipFade, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      });
    }, 1400);
    return () => clearInterval(id);
  }, []);

  const barFillWidth = progressAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [0, BAR_W],
  });

  return (
    <Animated.View style={[styles.root, { opacity: screenFade }]}>

      <Image source={SPLASH_IMG} style={[StyleSheet.absoluteFill, { width: "100%", height: H }]} resizeMode="cover" />

      <LinearGradient colors={[C.BG_SCREEN + '73', 'transparent']} style={styles.vigTop} />
      <LinearGradient colors={['transparent', C.BG_SCREEN + 'B8', C.BG_SCREEN + 'F7']} style={styles.vigBottom} />

      {/* Off-screen image pre-decoder — 0×0, hidden behind the splash */}
      <View style={styles.preloadContainer} pointerEvents="none">
        {PRELOAD_SOURCES.map((src, i) => (
          <Image key={i} source={src} style={styles.preloadImg} />
        ))}
      </View>

      <View style={styles.titleArea}>
        <Text style={styles.titleMain}>AETHERIA</Text>
        <Text style={styles.titleSub}>LEGENDS UNBOUND</Text>
        <Text style={styles.titleStudio}>by {APP_INFO.studio}</Text>
      </View>

      <View style={styles.loadingArea}>
        <Animated.Text style={[styles.tip, { opacity: tipFade }]}>{TIPS[tipIndex]}</Animated.Text>

        <View style={[styles.barTrack, { width: BAR_W }]}>
          <Animated.View style={[styles.barGlow, { width: barFillWidth }]} />
          <Animated.View style={[styles.barFill, { width: barFillWidth }]}>
            <LinearGradient
              colors={[C.PRIMARY_DARK, C.PRIMARY, C.PRIMARY_LIGHT]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.barShimmer} />
          </Animated.View>
        </View>

        <Text style={styles.pctLabel}>
          LOADING{'  '}<Text style={styles.pctNum}>{percent}%</Text>
        </Text>
        <Text style={styles.copy}>© {APP_INFO.year} {APP_INFO.studio}  ·  {APP_INFO.name}  ·  v{APP_INFO.version}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.BG_SCREEN },

  vigTop:    { position: 'absolute', top: 0, left: 0, right: 0, height: '25%' },
  vigBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '42%' },

  // Off-screen preload container — clipped to 0×0, invisible to the user
  preloadContainer: {
    position: 'absolute',
    width: 0, height: 0,
    overflow: 'hidden',
  },
  preloadImg: { width: 1, height: 1 },

  titleArea: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: rs(100),
    alignItems: 'center', justifyContent: 'center', gap: rs(6),
  },
  titleMain: {
    fontSize: rf(42), fontWeight: '900', color: C.TEXT, letterSpacing: 12,
    textShadowColor: C.PRIMARY + 'E6', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 24,
  },
  titleSub:    { fontSize: rf(13), fontWeight: '700', color: C.PRIMARY_LIGHT + 'D9', letterSpacing: 7 },
  titleStudio: { fontSize: rf(12),  fontWeight: '600', color: C.TEXT_ON_DARK_DIM, letterSpacing: 2, marginTop: rs(4) },

  loadingArea: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    alignItems: 'center', paddingBottom: rs(28), gap: rs(10),
  },
  tip: { fontSize: rf(13), color: C.PRIMARY_LIGHT + 'C7', letterSpacing: 0.6, fontStyle: 'italic', marginBottom: rs(4) },

  barTrack: {
    height: rs(6), borderRadius: rs(3),
    backgroundColor: C.BORDER, overflow: 'hidden', position: 'relative',
  },
  barGlow: {
    position: 'absolute', top: -3, bottom: -3, left: 0,
    borderRadius: rs(6), backgroundColor: C.PRIMARY + '59',
  },
  barFill: {
    position: 'absolute', top: 0, bottom: 0, left: 0,
    borderRadius: rs(3), overflow: 'hidden',
  },
  barShimmer: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 1,
    backgroundColor: C.SHIMMER, borderRadius: 1,
  },
  pctLabel: { fontSize: rf(12), color: C.SHIMMER, fontWeight: '700', letterSpacing: 2.5, marginTop: rs(2) },
  pctNum:   { color: C.PRIMARY_LIGHT, fontWeight: '900' },
  copy:     { fontSize: rf(11), color: C.GLASS_7, letterSpacing: 0.8, marginTop: rs(6) },
});
