import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions,
  Animated, ActivityIndicator, AppState, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C } from '../theme/colors';
import {
  signUp, signIn, resetPassword,
  resendVerification,
} from '../cloud/auth';
import { downloadSave, uploadSave, resolveConflict } from '../cloud/cloudSave';
import { migrate } from '../store/migrations';
import { sanitizeState } from '../store/sanitizeState';
import useGameStore from '../store/gameStore';

// ─────────────────────────────────────────────────────────────────────────────
// InputField MUST be defined at module level — never inside the component.
// Defining it inside causes React to treat it as a new component type on every
// render, which remounts the TextInput and dismisses the keyboard after each
// character typed.
// ─────────────────────────────────────────────────────────────────────────────
function InputField({
  icon, placeholder, value, onChangeText,
  secureTextEntry, keyboardType, returnKeyType,
  onSubmitEditing, autoCapitalize = 'none', rightElement,
}) {
  return (
    <View style={s.inputRow}>
      <Ionicons name={icon} size={14} color={C.TEXT_MUTED} style={s.inputIcon} />
      <TextInput
        style={s.input}
        placeholder={placeholder}
        placeholderTextColor={C.TEXT_DISABLED}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!!secureTextEntry}
        keyboardType={keyboardType || 'default'}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        returnKeyType={returnKeyType || 'next'}
        onSubmitEditing={onSubmitEditing}
      />
      {rightElement ?? null}
    </View>
  );
}

function friendlyError(err) {
  const msg = err?.message ?? '';
  if (msg.includes('Invalid login credentials'))        return 'Incorrect email or password.';
  if (msg.includes('Email not confirmed'))              return 'Please verify your email first.';
  if (msg.includes('User already registered'))          return 'Email already registered. Try signing in.';
  if (msg.includes('Password should be'))               return 'Password must be at least 6 characters.';
  if (msg.includes('Unable to validate email'))         return 'Invalid email address.';
  if (msg.includes('For security purposes'))            return 'Too many attempts. Try again later.';
  if (msg.includes('fetch') || msg.includes('network')) return 'Cannot reach the server. Check your connection.';
  if (err?.code === 'auth/timeout')                     return 'Request timed out. Check your connection and try again.';
  return msg || 'Something went wrong. Please try again.';
}

// Rejects after `ms` milliseconds so Supabase calls never hang indefinitely.
const AUTH_TIMEOUT_MS  = 15000;
const SYNC_TIMEOUT_MS  = 20000;

function withTimeout(promise, ms = AUTH_TIMEOUT_MS) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => {
        if (__DEV__) console.warn(`[CloudAuth] custom timeout fired after ${ms}ms`);
        reject({ code: 'auth/timeout' });
      }, ms)
    ),
  ]);
}

const RESEND_COOLDOWN = 60;
const { width: W, height: H } = Dimensions.get('window');
const CARD_W = Math.min(W * 0.88, 720);

function PrimaryBtn({ label, onPress, disabled, loading }) {
  return (
    <TouchableOpacity
      style={[s.btn, (disabled || loading) && s.btnDisabled]}
      onPress={onPress}
      activeOpacity={0.82}
      disabled={disabled || loading}
    >
      <LinearGradient
        colors={disabled || loading ? [C.BG_CARD, C.BG_CARD] : C.GRAD_PINK}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={s.btnGrad}
      >
        {loading
          ? <ActivityIndicator size="small" color={C.TEXT} />
          : <Text style={s.btnTxt}>{label}</Text>}
      </LinearGradient>
    </TouchableOpacity>
  );
}

export default function CloudAuthScreen({ navigation }) {
  const [step,        setStep]       = useState('login'); // login | signup | forgot | verify
  const [email,       setEmail]      = useState('');
  const [password,    setPassword]   = useState('');
  const [confirm,     setConfirm]    = useState('');
  const [showPass,    setShowPass]   = useState(false);
  const [loading,     setLoading]    = useState(false);
  const [error,       setError]      = useState('');
  const [info,        setInfo]       = useState('');
  const [countdown,     setCountdown]    = useState(0);
  const [verifyEmail,   setVerifyEmail]  = useState('');
  // null → hidden | 'loading' → syncing phase | 'done' → restart prompt
  const [cloudSyncState, setCloudSyncState] = useState(null);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const timerRef          = useRef(null);
  // Preserves the password across the verify step (goToStep clears password state).
  const verifyPasswordRef = useRef('');

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 320, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 320, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const startCooldown = useCallback(() => {
    setCountdown(RESEND_COOLDOWN);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const goToStep = (s) => {
    setError(''); setInfo(''); setPassword(''); setConfirm('');
    setStep(s);
  };

  // ── Cloud sync after verified sign-in ─────────────────────────────────────
  const syncAndClose = async (user) => {
    const currentUid = user.id;

    // Auth succeeded — stop the button spinner and show the loading phase.
    setLoading(false);
    setCloudSyncState('loading');

    // Snapshot the pre-login store state so we can decide how to handle conflicts.
    const existingLocal = useGameStore.getState();

    // True when a DIFFERENT user's data is sitting in the store (e.g. device sharing).
    const isDifferentUser = existingLocal.localUserId && existingLocal.localUserId !== currentUid;

    // True when the local save is unclaimed — either never logged in or just logged
    // out (resetStore sets localUserId back to null).
    // IMPORTANT: we must NOT run resolveConflict against an unclaimed local state.
    // After logout, checkTowerWeekReset() fires via onRehydrateStorage and stamps
    // updatedAt = Date.now() on the blank INITIAL_STATE. resolveConflict then sees
    // localTs > cloudTs and picks local gems/gold (150/10000) over the real cloud
    // values, permanently destroying purchased currency when it re-uploads.
    const isUnclaimed = !existingLocal.localUserId;

    if (isDifferentUser) {
      await useGameStore.getState().resetStore();
    }

    try {
      const downloadResult = await withTimeout(downloadSave(currentUid), SYNC_TIMEOUT_MS);

      if (!downloadResult.ok) {
        // Supabase returned an error (not a timeout — those throw to the catch below).
        // Don't touch the cloud save; just stamp auth info so the player can play.
        // The sync queue will retry automatically.
        useGameStore.setState({ cloudAccountEmail: user.email, localUserId: currentUid });
      } else if (downloadResult.data) {
        // ── Existing cloud save found ──────────────────────────────────────────
        // Migrate + sanitize before touching the store so an old-schema or tampered
        // cloud save can't crash or corrupt state.
        const migratedCloud = migrate(downloadResult.data, downloadResult.data.schemaVersion ?? 0);
        const cleanCloud = sanitizeState(migratedCloud) || migratedCloud;

        if (isDifferentUser || isUnclaimed) {
          // Account switch OR returning after logout — load cloud save directly.
          // Merging is unsafe here: a blank/reset local state carries a fresh
          // updatedAt from checkTowerWeekReset and would win the LWW comparison,
          // silently replacing real gems/gold with initial-state defaults.
          useGameStore.setState({ ...cleanCloud, cloudAccountEmail: user.email, localUserId: currentUid });
        } else {
          // Same authenticated user re-opening the app — merge to keep any
          // offline edits made since the last sync (e.g. gems earned mid-flight).
          const local = useGameStore.getState();
          const merged = resolveConflict(local, cleanCloud);
          useGameStore.setState({ ...merged, cloudAccountEmail: user.email, localUserId: currentUid });
          await withTimeout(uploadSave({ ...merged, cloudAccountEmail: user.email }, currentUid), SYNC_TIMEOUT_MS);
        }
      } else {
        // ── No cloud save yet (ok=true, data=null) ─────────────────────────────
        // First login for this account — upload the current local state so it
        // becomes the player's initial cloud save (preserves offline progress).
        // Note: handleSignUp already sets localUserId before syncAndClose runs,
        // so a brand-new account always hits this branch with isUnclaimed=false
        // and the local state contains the player's real offline progress.
        const local = useGameStore.getState();
        await withTimeout(uploadSave({ ...local, cloudAccountEmail: user.email }, currentUid), SYNC_TIMEOUT_MS);
        useGameStore.setState({ cloudAccountEmail: user.email, localUserId: currentUid });
      }
    } catch (e) {
      console.warn('[CloudAuth] sync error:', e?.message ?? e?.code);
      // Network timeout or unhandled error — mark the user as signed in so they
      // can keep playing. Their cloud save will sync on the next connection.
      useGameStore.setState({ cloudAccountEmail: user.email, localUserId: currentUid });
    }

    // Always reach here — transition to the restart prompt.
    setCloudSyncState('done');
  };

  // ── Submit handlers ───────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!email.trim() || !password) return;
    setLoading(true); setError(''); setInfo('');
    try {
      const user = await withTimeout(signIn(email.trim().toLowerCase(), password));
      await syncAndClose(user);
    } catch (e) {
      if (__DEV__) console.warn('[CloudAuth] login error:', JSON.stringify(e));
      // Supabase throws when email is unconfirmed — redirect to verify step
      if ((e?.message ?? '').includes('Email not confirmed')) {
        verifyPasswordRef.current = password;
        setVerifyEmail(email.trim().toLowerCase());
        setLoading(false);
        goToStep('verify');
        return;
      }
      setError(friendlyError(e));
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email.trim() || !password || !confirm) return;
    if (password !== confirm)   { setError('Passwords do not match.');               return; }
    if (password.length < 6)    { setError('Password must be at least 6 characters.'); return; }
    setLoading(true); setError(''); setInfo('');
    try {
      const user = await withTimeout(signUp(email.trim().toLowerCase(), password));

      // Only wipe local data when it belongs to a DIFFERENT existing user — this
      // stops their progress leaking into the new account.
      // A player with no prior account (localUserId === null) keeps their offline
      // progress; it will be uploaded as their first cloud save after verification.
      const existing = useGameStore.getState();
      if (existing.localUserId && existing.localUserId !== user.id) {
        await useGameStore.getState().resetStore();
      }
      // Claim this save for the newly created account immediately so that
      // syncAndClose treats the current local data as belonging to this user
      // and uploads it rather than treating it as a foreign account's data.
      useGameStore.setState({ localUserId: user.id });

      verifyPasswordRef.current = password;
      setVerifyEmail(user.email);
      startCooldown();
      setLoading(false);
      goToStep('verify');
    } catch (e) {
      setError(friendlyError(e));
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    if (!email.trim()) return;
    setLoading(true); setError(''); setInfo('');
    try {
      await withTimeout(resetPassword(email.trim().toLowerCase()));
      setInfo('Reset email sent. Check your inbox.');
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || loading) return;
    setLoading(true); setError(''); setInfo('');
    try {
      await withTimeout(resendVerification(verifyEmail));
      startCooldown();
      setInfo('New verification email sent.');
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  };

  // Silently auto-check when app returns to foreground on the verify step.
  useEffect(() => {
    if (step !== 'verify') return;
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        withTimeout(signIn(verifyEmail, verifyPasswordRef.current))
          .then(user => { if (user) syncAndClose(user); })
          .catch(() => {});
      }
    });
    return () => sub.remove();
  }, [step]);

  const handleCheckVerified = async () => {
    setLoading(true); setError('');
    try {
      const user = await withTimeout(signIn(verifyEmail, verifyPasswordRef.current));
      await syncAndClose(user);
    } catch (e) {
      if ((e?.message ?? '').includes('Email not confirmed')) {
        setError('Not verified yet. Check your inbox and click the link first.');
      } else {
        setError(friendlyError(e));
      }
      setLoading(false);
    }
  };

  // ── Shared UI pieces ──────────────────────────────────────────────────────
  const eyeToggle = (
    <TouchableOpacity onPress={() => setShowPass(p => !p)} style={s.eyeBtn} activeOpacity={0.7}>
      <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={15} color={C.TEXT_MUTED} />
    </TouchableOpacity>
  );

  // ── Step renders ──────────────────────────────────────────────────────────
  const renderRight = () => {
    if (step === 'login') return (
      <>
        <Text style={s.formTitle}>Sign In</Text>
        <InputField
          icon="mail-outline" placeholder="Email" value={email}
          onChangeText={setEmail} keyboardType="email-address"
        />
        <InputField
          icon="lock-closed-outline" placeholder="Password" value={password}
          onChangeText={setPassword} secureTextEntry={!showPass}
          returnKeyType="done" onSubmitEditing={handleLogin}
          rightElement={eyeToggle}
        />
        <View style={s.errorArea}>
          {error ? <Text style={s.errorTxt}>{error}</Text> : null}
        </View>
        <PrimaryBtn label="SIGN IN" onPress={handleLogin} loading={loading}
          disabled={!email.trim() || !password} />
        <View style={s.linksRow}>
          <TouchableOpacity onPress={() => goToStep('signup')} style={s.linkBtn}>
            <Text style={s.linkTxt}>Create Account</Text>
          </TouchableOpacity>
          <Text style={s.dot}>·</Text>
          <TouchableOpacity onPress={() => goToStep('forgot')} style={s.linkBtn}>
            <Text style={s.linkTxt}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>
      </>
    );

    if (step === 'signup') return (
      <>
        <Text style={s.formTitle}>Create Account</Text>
        <InputField
          icon="mail-outline" placeholder="Email" value={email}
          onChangeText={setEmail} keyboardType="email-address"
        />
        <InputField
          icon="lock-closed-outline" placeholder="Password (min 6 chars)" value={password}
          onChangeText={setPassword} secureTextEntry={!showPass}
          rightElement={eyeToggle}
        />
        <InputField
          icon="lock-closed-outline" placeholder="Confirm Password" value={confirm}
          onChangeText={setConfirm} secureTextEntry={!showPass}
          returnKeyType="done" onSubmitEditing={handleSignUp}
        />
        <View style={s.errorArea}>
          {error ? <Text style={s.errorTxt}>{error}</Text> : null}
        </View>
        <PrimaryBtn label="CREATE ACCOUNT" onPress={handleSignUp} loading={loading}
          disabled={!email.trim() || !password || !confirm} />
        <TouchableOpacity onPress={() => goToStep('login')} style={s.linkBtn}>
          <Text style={s.linkTxt}>Back to Sign In</Text>
        </TouchableOpacity>
      </>
    );

    if (step === 'forgot') return (
      <>
        <Text style={s.formTitle}>Reset Password</Text>
        <Text style={s.formSub}>Enter your email to receive a reset link.</Text>
        <InputField
          icon="mail-outline" placeholder="Email" value={email}
          onChangeText={setEmail} keyboardType="email-address"
          returnKeyType="done" onSubmitEditing={handleForgot}
        />
        <View style={s.errorArea}>
          {error ? <Text style={s.errorTxt}>{error}</Text> : null}
          {info  ? <Text style={s.infoTxt}>{info}</Text>  : null}
        </View>
        <PrimaryBtn label="SEND RESET EMAIL" onPress={handleForgot} loading={loading}
          disabled={!email.trim()} />
        <TouchableOpacity onPress={() => goToStep('login')} style={s.linkBtn}>
          <Text style={s.linkTxt}>Back to Sign In</Text>
        </TouchableOpacity>
      </>
    );

    if (step === 'verify') return (
      <>
        <View style={s.verifyIconRow}>
          <LinearGradient colors={[C.SUCCESS + 'CC', C.CYAN]} style={s.verifyIcon}>
            <Ionicons name="mail-open-outline" size={22} color={C.TEXT} />
          </LinearGradient>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={s.formTitle}>Verify Your Email</Text>
            <Text style={s.verifyEmail}>{verifyEmail}</Text>
          </View>
        </View>
        <Text style={s.formSub}>
          Click the link in your email (one-time use), then tap the button below.
          If you see an "expired" message on the web page, the link may already have
          worked — just tap "I've Verified" to check.
        </Text>
        <View style={s.errorArea}>
          {error ? <Text style={s.errorTxt}>{error}</Text> : null}
          {info  ? <Text style={s.infoTxt}>{info}</Text>  : null}
        </View>
        <PrimaryBtn label="I'VE VERIFIED — CONTINUE" onPress={handleCheckVerified} loading={loading} />
        <View style={s.linksRow}>
          <TouchableOpacity
            onPress={handleResend}
            disabled={countdown > 0 || loading}
            style={[s.linkBtn, (countdown > 0 || loading) && { opacity: 0.45 }]}
          >
            <Text style={s.linkTxt}>
              {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Email'}
            </Text>
          </TouchableOpacity>
          <Text style={s.dot}>·</Text>
          <TouchableOpacity onPress={() => goToStep('login')} style={s.linkBtn}>
            <Text style={s.linkTxt}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  };

  // ── Root render ───────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      <LinearGradient colors={C.GRAD_BG} style={StyleSheet.absoluteFill} pointerEvents="none" />

      <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1 }}>
        {/* Header */}
        <LinearGradient colors={C.GRAD_HEADER} style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.8}>
            <Ionicons name="chevron-back" size={22} color={C.TEXT} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>CONNECT ACCOUNT</Text>
        </LinearGradient>

        {/* Body */}
        <View style={s.body}>
          <Animated.View style={[s.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <LinearGradient colors={[C.GLASS_1, C.GLASS_2]} style={StyleSheet.absoluteFill} pointerEvents="none" />
            <View style={[StyleSheet.absoluteFill, s.cardBorder]} pointerEvents="none" />

            {/* Left branding panel */}
            <View style={s.leftPanel}>
              <LinearGradient
                colors={[C.PRIMARY + '22', C.SECONDARY + '11']}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
              <View style={s.brandIcon}>
                <LinearGradient colors={[C.PRIMARY, C.SECONDARY]} style={s.brandIconGrad}>
                  <Ionicons name="cloud-outline" size={24} color={C.TEXT} />
                </LinearGradient>
              </View>
              <Text style={s.brandTitle}>Cloud Save</Text>
              <Text style={s.brandSub}>
                Sync your progress{'\n'}across all devices.
              </Text>
            </View>

            {/* Divider */}
            <View style={s.divider} />

            {/* Right form panel */}
            <View style={s.rightPanel}>
              {renderRight()}
            </View>
          </Animated.View>
        </View>
      </SafeAreaView>

      {/* ── Cloud sync modal: loading → restart (non-dismissable) ── */}
      <Modal
        visible={cloudSyncState !== null}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={s.restartOverlay}>
          <View style={s.restartCard}>
            <LinearGradient colors={[C.BG_MID, C.BG_CARD]} style={StyleSheet.absoluteFill} pointerEvents="none" />
            <View style={[StyleSheet.absoluteFill, s.restartBorder]} pointerEvents="none" />

            {cloudSyncState === 'loading' ? (
              <>
                <View style={s.restartIconWrap}>
                  <LinearGradient colors={[C.PRIMARY, C.CYAN]} style={s.restartIconGrad}>
                    <Ionicons name="cloud-download-outline" size={26} color={C.TEXT} />
                  </LinearGradient>
                </View>
                <Text style={s.restartTitle}>LOADING SAVE</Text>
                <Text style={s.restartMsg}>
                  Fetching your cloud data…{'\n'}Please wait a moment.
                </Text>
                <ActivityIndicator size="large" color={C.PRIMARY_LIGHT} style={{ marginTop: 4 }} />
              </>
            ) : (
              <>
                <View style={s.restartIconWrap}>
                  <LinearGradient colors={[C.SUCCESS, C.CYAN]} style={s.restartIconGrad}>
                    <Ionicons name="checkmark-done-outline" size={26} color={C.TEXT} />
                  </LinearGradient>
                </View>
                <Text style={s.restartTitle}>SIGNED IN</Text>
                <Text style={s.restartMsg}>
                  Your cloud save has been loaded.{'\n'}The game must restart to apply your progress.
                </Text>
                <TouchableOpacity
                  style={s.restartBtn}
                  onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Loading' }] })}
                  activeOpacity={0.82}
                >
                  <LinearGradient colors={C.GRAD_PINK} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.restartBtnGrad}>
                    <Ionicons name="refresh-outline" size={15} color={C.TEXT} />
                    <Text style={s.restartBtnTxt}>RESTART NOW</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const CARD_H = Math.min(H * 0.78, 320);

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.BG_DEEP },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.12)',
  },
  backBtn:     { padding: 4 },
  headerTitle: { fontSize: 15, fontWeight: '900', color: C.TEXT, letterSpacing: 3 },

  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },

  card: {
    width: CARD_W, height: CARD_H,
    borderRadius: 14, overflow: 'hidden',
    flexDirection: 'row', position: 'relative',
  },
  cardBorder: { borderRadius: 14, borderWidth: 1, borderColor: C.BORDER, zIndex: 1 },

  // Left branding
  leftPanel: {
    width: '34%', alignItems: 'center', justifyContent: 'center',
    padding: 16, position: 'relative',
    borderRightWidth: 1, borderRightColor: C.BORDER_SUBTLE,
  },
  brandIcon:     { marginBottom: 10 },
  brandIconGrad: {
    width: 50, height: 50, borderRadius: 25,
    alignItems: 'center', justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 14, fontWeight: '900', color: C.TEXT,
    letterSpacing: 1, marginBottom: 6, textAlign: 'center',
  },
  brandSub: {
    fontSize: 10, color: C.TEXT_MUTED, lineHeight: 15,
    textAlign: 'center', fontWeight: '500',
  },

  divider: { width: 0 },

  // Right form
  rightPanel: {
    flex: 1, padding: 18, justifyContent: 'center',
  },

  formTitle: {
    fontSize: 14, fontWeight: '900', color: C.TEXT,
    letterSpacing: 0.5, marginBottom: 8,
  },
  formSub: {
    fontSize: 10, color: C.TEXT_MUTED, lineHeight: 14,
    marginBottom: 8, fontWeight: '500',
  },

  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 8, borderWidth: 1, borderColor: C.BORDER,
    backgroundColor: C.BG_CARD, paddingHorizontal: 10,
    height: 38, marginBottom: 6,
  },
  inputIcon: { marginRight: 7 },
  input:     { flex: 1, fontSize: 12, color: C.TEXT, fontWeight: '600' },
  eyeBtn:    { padding: 3 },

  errorArea: { minHeight: 18, justifyContent: 'center', marginBottom: 4 },
  errorTxt:  { fontSize: 10, color: C.DANGER,  fontWeight: '700' },
  infoTxt:   { fontSize: 10, color: C.SUCCESS, fontWeight: '700' },

  btn:         { borderRadius: 8, overflow: 'hidden', marginBottom: 8 },
  btnDisabled: { opacity: 0.45 },
  btnGrad:     { paddingVertical: 10, alignItems: 'center' },
  btnTxt:      { fontSize: 11, fontWeight: '900', color: C.TEXT, letterSpacing: 1.5 },

  linksRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  linkBtn:  { paddingVertical: 4 },
  linkTxt:  { fontSize: 10, color: C.TEXT_MUTED, fontWeight: '600', textDecorationLine: 'underline' },
  dot:      { color: C.TEXT_DISABLED, fontSize: 10 },

  verifyIconRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  verifyIcon: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  verifyEmail: { fontSize: 11, fontWeight: '800', color: C.PRIMARY_LIGHT, marginTop: 2 },

  // Restart modal
  restartOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.82)',
    alignItems: 'center', justifyContent: 'center',
  },
  restartCard: {
    width: 300, borderRadius: 16, overflow: 'hidden',
    alignItems: 'center', padding: 28, position: 'relative',
  },
  restartBorder: { borderRadius: 16, borderWidth: 1, borderColor: C.BORDER_STRONG },
  restartIconWrap: { marginBottom: 14 },
  restartIconGrad: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
  },
  restartTitle: {
    fontSize: 18, fontWeight: '900', color: C.TEXT,
    letterSpacing: 3, marginBottom: 10, textAlign: 'center',
  },
  restartMsg: {
    fontSize: 11, color: C.TEXT_MUTED, lineHeight: 17,
    textAlign: 'center', fontWeight: '500', marginBottom: 22,
  },
  restartBtn:     { borderRadius: 10, overflow: 'hidden', width: '100%' },
  restartBtnGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, gap: 7,
  },
  restartBtnTxt:  { fontSize: 13, fontWeight: '900', color: C.TEXT, letterSpacing: 1.5 },
});
