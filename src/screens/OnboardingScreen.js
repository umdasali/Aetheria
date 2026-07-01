import { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Animated, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import useGameStore from '../store/gameStore';
import { checkNameAvailable, claimName, NAME_PATTERN } from '../cloud/nameService';
import { C } from '../theme/colors';
import { rs, rf } from '../theme/scale';

const { width: W, height: H } = Dimensions.get('window');

const STEPS = [
  {
    icon:    'flash',
    color:   C.GOLD,
    title:   'Welcome to Aetheria',
    body:    'A tactical RPG where five factions clash for the fate of a world torn apart by dimensional war. Summon legendary heroes, forge your squad, and defeat powerful enemies across 75 story battles.',
    accent:  C.GRAD_GOLD,
  },
  {
    icon:    'people',
    color:   C.PRIMARY,
    title:   'Summon & Collect Heroes',
    body:    'Spend Gems in the Summon room to recruit heroes from five factions — Emberveil, Glaciara, Sunspire, Verdania, and Voidmark. Each hero has unique skills and a Trump Card.',
    accent:  [C.PRIMARY_DARK, C.PRIMARY],
  },
  {
    icon:    'shield',
    color:   C.CYAN,
    title:   'Build Your Team of Three',
    body:    'Choose up to 3 heroes for your active team. Mix factions for versatility, or stack a single faction for synergy. Tap a hero card in battle to switch who acts next.',
    accent:  [C.CYAN, C.PRIMARY_DARK],
  },
  {
    icon:    'thunderstorm',
    color:   C.SECONDARY,
    title:   'Battle & Trump Cards',
    body:    'Each turn, attack or use skills to build Energy. At 100⚡ your hero unleashes their Trump Card — a devastating ultimate ability. Ready? Tap below to try your first battle with your starter team.',
    accent:  C.GRAD_PINK,
  },
];

// Name key rules mirror supabase/migrations/0003_player_names.sql exactly:
// 3-16 chars, letters/digits/spaces/underscore/hyphen only.
const NAME_HINT = '3-16 characters — letters, numbers, spaces, - or _';

const NAME_STATUS = [
  { key: 'idle',      text: NAME_HINT,                    color: C.TEXT_MUTED },
  { key: 'invalid',   text: NAME_HINT,                    color: C.DANGER },
  { key: 'checking',  text: 'Checking availability…',     color: C.TEXT_MUTED },
  { key: 'available', text: 'Name is available',          color: C.SUCCESS },
  { key: 'taken',     text: 'That name is already taken', color: C.DANGER },
];

export default function OnboardingScreen({ navigation }) {
  const completeOnboarding = useGameStore(s => s.completeOnboarding);
  const updateProfile      = useGameStore(s => s.updateProfile);
  const playerUid          = useGameStore(s => s.playerUid);
  const [phase, setPhase] = useState('name'); // 'name' | 'tour'
  const [step, setStep] = useState(0);

  // ── Name entry (mandatory, blocks the tour) ─────────────────────────────────
  const [name, setName] = useState('');
  const [nameStatus, setNameStatus] = useState('idle'); // idle|invalid|checking|available|taken
  const [claiming, setClaiming] = useState(false);
  // Guards against an older in-flight checkNameAvailable() call resolving after a
  // newer one (out-of-order network responses) and overwriting nameStatus with a
  // stale result for a name the player has since changed.
  const checkIdRef = useRef(0);

  useEffect(() => {
    const trimmed = name.trim();
    if (!NAME_PATTERN.test(trimmed)) {
      checkIdRef.current += 1; // invalidate any check still in flight
      setNameStatus(trimmed.length === 0 ? 'idle' : 'invalid');
      return;
    }
    setNameStatus('checking');
    const myCheckId = ++checkIdRef.current;
    const t = setTimeout(async () => {
      const res = await checkNameAvailable(trimmed);
      if (checkIdRef.current !== myCheckId) return; // superseded by a newer edit
      // Can't verify while offline/unreachable — don't block the player over it.
      setNameStatus(res.networkError ? 'idle' : (res.available ? 'available' : 'taken'));
    }, 450);
    return () => clearTimeout(t);
  }, [name]);

  const handleClaimName = async () => {
    const trimmed = name.trim();
    if (!NAME_PATTERN.test(trimmed) || claiming) return;
    setClaiming(true);
    const res = await claimName(trimmed, playerUid);
    setClaiming(false);

    if (res.claimed) {
      updateProfile({ name: res.displayName || trimmed });
      useGameStore.setState({ serverClaimedName: res.displayName || trimmed, pendingNameClaim: null });
      setPhase('tour');
    } else if (res.networkError) {
      // Offline-friendly: let the player continue with this name locally, but
      // remember it still needs to be registered server-side — retried on the
      // next app launch (see retryPendingNameClaim() in gameStore.js).
      updateProfile({ name: trimmed });
      useGameStore.setState({ pendingNameClaim: trimmed });
      setPhase('tour');
    } else if (res.reason === 'taken') {
      setNameStatus('taken');
    } else {
      setNameStatus('invalid');
    }
  };

  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim  = useRef(new Animated.Value(1)).current;

  const current = STEPS[step];
  const isLast  = step === STEPS.length - 1;

  const animateToStep = (nextStep) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
      setStep(nextStep);
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    });
  };

  const handleNext = () => {
    if (isLast) {
      // Finish onboarding with a hands-on practice battle (the old Home "Quick
      // Battle" card now lives here). Starter team is seeded, so it's playable.
      completeOnboarding();
      navigation.replace('Battle', { practiceMode: true });
    } else {
      animateToStep(step + 1);
    }
  };

  const handleSkip = () => {
    completeOnboarding();
    navigation.replace('Home');
  };

  if (phase === 'name') {
    const nameInfo = NAME_STATUS.find(s => s.key === nameStatus) ?? NAME_STATUS[0];
    const canContinue = NAME_PATTERN.test(name.trim()) && nameStatus !== 'taken' && !claiming;

    return (
      <View style={styles.root}>
        <LinearGradient colors={C.GRAD_BG} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
          <View style={styles.shell}>
            <View style={styles.iconCol}>
              <View style={[styles.iconRing, { borderColor: C.PRIMARY + '55', backgroundColor: C.PRIMARY + '14' }]}>
                <LinearGradient
                  colors={[C.PRIMARY_DARK, C.PRIMARY]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={styles.iconGradient}
                >
                  <Ionicons name="person" size={rs(36)} color={C.TEXT} />
                </LinearGradient>
              </View>
            </View>

            <View style={styles.textCol}>
              <Text style={[styles.title, { color: C.PRIMARY_LIGHT }]}>Choose Your Name</Text>
              <Text style={styles.body}>
                This is how other Commanders will see you across Aetheria. Pick a name that's yours alone.
              </Text>

              <TextInput
                style={styles.nameInput}
                value={name}
                onChangeText={setName}
                maxLength={16}
                autoCapitalize="words"
                autoCorrect={false}
                placeholder="Your name"
                placeholderTextColor={C.TEXT_DISABLED}
                selectionColor={C.PRIMARY}
                returnKeyType="done"
                onSubmitEditing={handleClaimName}
              />
              <View style={styles.nameStatusRow}>
                {nameStatus === 'checking' && (
                  <Ionicons name="ellipsis-horizontal" size={rf(12)} color={nameInfo.color} />
                )}
                {nameStatus === 'available' && (
                  <Ionicons name="checkmark-circle" size={rf(12)} color={nameInfo.color} />
                )}
                {(nameStatus === 'taken' || nameStatus === 'invalid') && (
                  <Ionicons name="alert-circle" size={rf(12)} color={nameInfo.color} />
                )}
                <Text style={[styles.nameStatusText, { color: nameInfo.color }]}>{nameInfo.text}</Text>
              </View>

              <TouchableOpacity
                style={[styles.nextBtn, !canContinue && styles.nextBtnDisabled]}
                onPress={handleClaimName}
                activeOpacity={0.82}
                disabled={!canContinue}
              >
                <LinearGradient
                  colors={canContinue ? [C.PRIMARY_DARK, C.PRIMARY] : [C.GLASS_5, C.GLASS_5]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.nextBtnInner}
                >
                  <Text style={styles.nextText}>{claiming ? 'CLAIMING…' : 'CONTINUE'}</Text>
                  {!claiming && <Ionicons name="chevron-forward" size={rs(18)} color={C.TEXT} />}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <LinearGradient colors={C.GRAD_BG} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        {/* Skip — absolute so it doesn't affect the row layout */}
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip} activeOpacity={0.7}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>

        {/* Landscape row: icon left | text + button right */}
        <Animated.View style={[styles.shell, { opacity: fadeAnim }]}>

          {/* LEFT — icon ring */}
          <View style={styles.iconCol}>
            <View style={[styles.iconRing, { borderColor: current.color + '55', backgroundColor: current.color + '14' }]}>
              <LinearGradient
                colors={Array.isArray(current.accent) ? current.accent : [current.accent, current.accent]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.iconGradient}
              >
                <Ionicons name={current.icon} size={rs(36)} color={C.TEXT} />
              </LinearGradient>
            </View>
          </View>

          {/* RIGHT — step dots, title, body, button */}
          <View style={styles.textCol}>
            {/* Step indicator */}
            <View style={styles.stepDots}>
              {STEPS.map((_, i) => (
                <TouchableOpacity key={i} onPress={() => animateToStep(i)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <View style={[
                    styles.dot,
                    i === step
                      ? [styles.dotActive, { backgroundColor: current.color }]
                      : styles.dotInactive,
                  ]} />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.title, { color: current.color }]}>{current.title}</Text>
            <Text style={styles.body}>{current.body}</Text>

            {/* Next / Start button */}
            <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.82}>
              <LinearGradient
                colors={Array.isArray(current.accent) ? current.accent : [current.accent, current.accent]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.nextBtnInner}
              >
                <Text style={styles.nextText}>{isLast ? 'TRY A BATTLE' : 'NEXT'}</Text>
                <Ionicons name={isLast ? 'flash' : 'chevron-forward'} size={rs(18)} color={C.TEXT} />
              </LinearGradient>
            </TouchableOpacity>
          </View>

        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.BG_DEEP },
  safe: { flex: 1 },

  // Landscape row: fills the safe area, splits icon left | text right
  shell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: rs(20),
    paddingVertical: rs(12),
  },

  skipBtn: {
    position: 'absolute',
    top: rs(12), right: rs(20), zIndex: 10,
    paddingHorizontal: rs(12), paddingVertical: rs(6),
  },
  skipText: { fontSize: rf(12), color: C.TEXT_MUTED, fontWeight: '600' },

  // Left column — icon centred vertically
  iconCol: {
    width: '36%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconRing: {
    width: rs(88), height: rs(88), borderRadius: rs(44),
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
  },
  iconGradient: {
    width: rs(66), height: rs(66), borderRadius: rs(33),
    alignItems: 'center', justifyContent: 'center',
  },

  // Right column — all text + controls stacked, no overflow risk
  textCol: {
    flex: 1,
    paddingLeft: rs(28),
    justifyContent: 'center',
    gap: rs(12),
  },

  stepDots: { flexDirection: 'row', gap: rs(8) },
  dot:         { borderRadius: rs(4) },
  dotActive:   { width: rs(20), height: rs(7) },
  dotInactive: { width: rs(7), height: rs(7), backgroundColor: C.BORDER_STRONG },

  title: { fontSize: rf(18), fontWeight: '900', letterSpacing: 1 },
  body: {
    fontSize: rf(12), color: C.TEXT_SOFT, lineHeight: rf(19), letterSpacing: 0.2,
  },

  nextBtn: {
    alignSelf: 'flex-start',
    borderRadius: rs(14), overflow: 'hidden',
    shadowColor: C.PRIMARY_DARK,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 6,
    elevation: 5,
  },
  nextBtnInner: {
    flexDirection: 'row', alignItems: 'center', gap: rs(8),
    paddingVertical: rs(11), paddingHorizontal: rs(28),
  },
  nextBtnDisabled: { opacity: 0.5 },
  nextText: { fontSize: rf(13), fontWeight: '900', color: C.TEXT, letterSpacing: 1.5 },

  nameInput: {
    backgroundColor: C.BG_BASE, borderRadius: rs(8),
    borderWidth: 1, borderColor: C.BORDER,
    paddingHorizontal: rs(12), paddingVertical: rs(9),
    fontSize: rf(13), color: C.TEXT,
  },
  nameStatusRow: {
    flexDirection: 'row', alignItems: 'center', gap: rs(5),
  },
  nameStatusText: { fontSize: rf(11), fontWeight: '600' },
});
