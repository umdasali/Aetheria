import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions,
  Animated, ActivityIndicator, AppState,
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
  const [countdown,   setCountdown]  = useState(0);
  const [verifyEmail, setVerifyEmail]= useState('');

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
    try {
      const currentUid = user.id;
      const { data: cloudSave } = await withTimeout(downloadSave(), SYNC_TIMEOUT_MS);

      if (cloudSave) {
        // Protect the running app: migrate + sanitize the downloaded save before it
        // touches the store, so an old-schema or tampered cloud save can't crash or
        // corrupt state (mirrors the local AsyncStorage rehydrate guards).
        const migratedCloud = migrate(cloudSave, cloudSave.schemaVersion ?? 0);
        const cleanCloud = sanitizeState(migratedCloud) || migratedCloud;

        let local = useGameStore.getState();
        // If this device still holds a DIFFERENT user's progress, wipe it before merging
        // so account A's leftover data can never bleed into account B's cloud save.
        if (local.localUserId && local.localUserId !== currentUid) {
          await useGameStore.getState().resetStore();
          local = useGameStore.getState();
        }
        const merged = resolveConflict(local, cleanCloud);
        useGameStore.setState({ ...merged, cloudAccountEmail: user.email, localUserId: currentUid });
        await withTimeout(uploadSave({ ...merged, cloudAccountEmail: user.email }), SYNC_TIMEOUT_MS);
      } else {
        const local = useGameStore.getState();
        if (local.localUserId === currentUid) {
          await withTimeout(uploadSave({ ...local, cloudAccountEmail: user.email }), SYNC_TIMEOUT_MS);
          useGameStore.setState({ cloudAccountEmail: user.email, localUserId: currentUid });
        } else {
          await useGameStore.getState().resetStore();
          const fresh = useGameStore.getState();
          await withTimeout(uploadSave({ ...fresh, cloudAccountEmail: user.email }), SYNC_TIMEOUT_MS);
          useGameStore.setState({ cloudAccountEmail: user.email, localUserId: currentUid });
        }
      }
    } catch (e) {
      console.warn('[CloudAuth] sync error:', e?.message ?? e?.code);
      setLoading(false);
      setInfo('Signed in. Sync failed — your progress may not be current.');
      return;
    }
    navigation.goBack();
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
      await useGameStore.getState().resetStore();
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
});
