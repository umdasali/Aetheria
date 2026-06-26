import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, TouchableOpacity, PanResponder, Animated, Dimensions, Alert, ActivityIndicator, Linking, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import useGameStore from '../store/gameStore';
import AudioManager from '../utils/AudioManager';
import { C } from '../theme/colors';
import { onAuthChanged, getUser, signOut, deleteAccount } from '../cloud/auth';
import { syncNow, getLastSyncTime } from '../cloud/syncQueue';
import { APP_INFO } from '../constants/appInfo';

const { width: W } = Dimensions.get('window');
const SLIDER_W = Math.min(340, W * 0.42);

// ── Slider component ──────────────────────────────────────────────────────────

function VolumeSlider({ value, onChange, color, disabled }) {
  const trackRef  = useRef(null);
  const trackX    = useRef(0);
  const trackW    = useRef(SLIDER_W);
  const fillAnim  = useRef(new Animated.Value(value)).current;

  // Sync fill when value prop changes (e.g. when muted externally)
  useEffect(() => {
    Animated.timing(fillAnim, { toValue: value, duration: 80, useNativeDriver: false }).start();
  }, [value]);

  const clamp = (x) => Math.max(0, Math.min(1, x));

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder:  () => !disabled,
      onPanResponderGrant: (evt) => {
        const rel = clamp((evt.nativeEvent.pageX - trackX.current) / trackW.current);
        fillAnim.setValue(rel);
        onChange(rel);
      },
      onPanResponderMove: (evt) => {
        const rel = clamp((evt.nativeEvent.pageX - trackX.current) / trackW.current);
        fillAnim.setValue(rel);
        onChange(rel);
      },
    })
  ).current;

  const fillWidth = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SLIDER_W],
  });

  return (
    <View
      ref={trackRef}
      style={[styles.track, disabled && { opacity: 0.35 }]}
      onLayout={({ nativeEvent }) => {
        trackW.current = nativeEvent.layout.width;
      }}
      onStartShouldSetResponder={() => false}
      {...panResponder.panHandlers}
    >
      {/* Background rail */}
      <View
        style={[styles.trackRail]}
        onLayout={(e) => {
          e.target.measure((_, __, ___, ____, px) => { trackX.current = px; });
        }}
      />
      {/* Fill */}
      <Animated.View style={[styles.trackFill, { width: fillWidth, backgroundColor: color }]} />
      {/* Thumb */}
      <Animated.View
        style={[
          styles.thumb,
          { borderColor: color, transform: [{ translateX: fillAnim.interpolate({ inputRange: [0, 1], outputRange: [-8, SLIDER_W - 8] }) }] },
        ]}
      />
    </View>
  );
}

// ── SettingRow ────────────────────────────────────────────────────────────────

function SettingRow({ icon, label, hint, value, onChange, color, muted, onMuteToggle, onTest }) {
  const pct = Math.round(value * 100);

  return (
    <View style={styles.row}>
      <LinearGradient colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']} style={StyleSheet.absoluteFill} />
      <View style={[styles.rowBorder, { borderColor: color + '30' }]} />

      {/* Icon + label */}
      <View style={[styles.rowIcon, { backgroundColor: color + '1A', borderColor: color + '40' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <View style={styles.rowLabel}>
        <Text style={styles.rowTitle}>{label}</Text>
        <Text style={[styles.rowHint, { color: color + 'AA' }]}>{hint}</Text>
      </View>

      {/* Percentage */}
      <Text style={[styles.pct, { color: muted ? C.TEXT_DISABLED : color }]}>
        {muted ? 'MUTED' : `${pct}%`}
      </Text>

      {/* Slider */}
      <VolumeSlider value={muted ? 0 : value} onChange={onChange} color={color} disabled={muted} />

      {/* Live-test button (SFX only) */}
      {onTest && (
        <TouchableOpacity
          style={[styles.muteBtn, { marginLeft: 0 }]}
          onPress={onTest}
          activeOpacity={0.75}
          disabled={muted}
        >
          <Ionicons name="play" size={14} color={muted ? C.TEXT_DISABLED : color} />
        </TouchableOpacity>
      )}

      {/* Mute toggle */}
      <TouchableOpacity style={[styles.muteBtn, muted && { borderColor: C.DANGER }]} onPress={onMuteToggle} activeOpacity={0.75}>
        <Ionicons
          name={muted ? 'volume-mute' : 'volume-high-outline'}
          size={16}
          color={muted ? C.DANGER : C.TEXT_MUTED}
        />
      </TouchableOpacity>
    </View>
  );
}

const TABS = [
  { key: 'audio', label: 'AUDIO',  icon: 'musical-notes-outline' },
  { key: 'cloud', label: 'CLOUD',  icon: 'cloud-outline' },
  { key: 'about', label: 'ABOUT',  icon: 'information-circle-outline' },
];

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function SettingsScreen({ navigation }) {
  const settings          = useGameStore(s => s.settings);
  const updateSettings    = useGameStore(s => s.updateSettings);
  const cloudAccountEmail = useGameStore(s => s.cloudAccountEmail);

  const [activeTab,  setActiveTab]  = useState('audio');
  const [musicVol,   setMusicVol]   = useState(settings.musicVolume ?? 0.65);
  const [sfxVol,     setSfxVol]     = useState(settings.sfxVolume   ?? 0.75);
  const [musicMute,  setMusicMute]  = useState(settings.musicMute   ?? false);
  const [sfxMute,    setSfxMute]    = useState(settings.sfxMute     ?? false);

  const [authUser,  setAuthUser]  = useState(getUser());
  const [lastSync,  setLastSync]  = useState(null);
  const [syncing,   setSyncing]   = useState(false);
  const [signingOut,     setSignOut]       = useState(false);
  const [deleting,       setDeleting]      = useState(false);
  const [restartVisible, setRestartVisible] = useState(false);

  // Keep auth state in sync; re-read on focus so returning from CloudAuth is instant
  useEffect(() => onAuthChanged(setAuthUser), []);

  // Load last sync time once on mount — handleSyncNow updates it manually after that
  useEffect(() => {
    getLastSyncTime().then(setLastSync);
  }, []);

  const handleSyncNow = useCallback(async () => {
    setSyncing(true);
    const result = await syncNow(() => useGameStore.getState());
    setSyncing(false);
    if (result.ok) {
      setLastSync(Date.now());
      Alert.alert('Synced', 'Your progress has been saved to the cloud.');
    } else {
      Alert.alert('Sync Failed', 'Could not reach the server. Try again later.');
    }
  }, []);

  const handleSignOut = useCallback(() => {
    Alert.alert(
      'Disconnect Account',
      'This will sign you out and reset all local progress. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect & Reset',
          style: 'destructive',
          onPress: async () => {
            setSignOut(true);
            await signOut();
            await useGameStore.getState().resetStore();
            setSignOut(false);
            setRestartVisible(true);
          },
        },
      ]
    );
  }, []);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Delete Account',
      'This permanently deletes your account and cloud save, and erases your progress on this device. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you absolutely sure?',
              'Your account, cloud save, and local progress will be gone forever.',
              [
                { text: 'Keep My Account', style: 'cancel' },
                {
                  text: 'Delete Forever',
                  style: 'destructive',
                  onPress: async () => {
                    setDeleting(true);
                    try {
                      await deleteAccount();
                      await useGameStore.getState().resetStore();
                      useGameStore.setState({ cloudAccountEmail: null, localUserId: null });
                      setDeleting(false);
                      Alert.alert('Account Deleted', 'Your account and data have been removed.', [
                        { text: 'OK', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Loading' }] }) },
                      ]);
                    } catch (e) {
                      setDeleting(false);
                      Alert.alert(
                        'Deletion Failed',
                        e?.message || 'Could not delete your account. Please check your connection and try again.'
                      );
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  }, [navigation]);

  // Apply persisted volumes + mute state to AudioManager on mount
  useEffect(() => {
    const mMute = settings.musicMute ?? false;
    const sMute = settings.sfxMute   ?? false;
    AudioManager.setMusicVolume(mMute ? 0 : (settings.musicVolume ?? 0.65));
    AudioManager.setSFXVolume(sMute   ? 0 : (settings.sfxVolume   ?? 0.75));
  }, []);

  // Play home BGM while on this screen so the player can live-test music volume.
  // Re-read auth state on every focus so returning from CloudAuth is instant.
  useFocusEffect(
    useCallback(() => {
      setAuthUser(getUser());
      AudioManager.playHome();
      return () => AudioManager.pauseHome();
    }, [])
  );

  const switchTab = useCallback((key) => {
    AudioManager.playButtonSFX();
    setActiveTab(key);
  }, []);

  const handleMusicChange = useCallback((vol) => {
    setMusicVol(vol);
    AudioManager.setMusicVolume(musicMute ? 0 : vol);
    updateSettings({ musicVolume: vol });
  }, [musicMute, updateSettings]);

  const handleSFXChange = useCallback((vol) => {
    setSfxVol(vol);
    AudioManager.setSFXVolume(sfxMute ? 0 : vol);
    updateSettings({ sfxVolume: vol });
  }, [sfxMute, updateSettings]);

  const toggleMusicMute = useCallback(() => {
    const next = !musicMute;
    setMusicMute(next);
    AudioManager.setMusicVolume(next ? 0 : musicVol);
    updateSettings({ musicMute: next });
  }, [musicMute, musicVol, updateSettings]);

  const toggleSFXMute = useCallback(() => {
    const next = !sfxMute;
    setSfxMute(next);
    AudioManager.setSFXVolume(next ? 0 : sfxVol);
    updateSettings({ sfxMute: next });
  }, [sfxMute, sfxVol, updateSettings]);

  const testSFX = useCallback(() => {
    AudioManager.playButtonSFX();
  }, []);

  return (
    <View style={styles.root}>
      <LinearGradient colors={C.GRAD_BG} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <SafeAreaView edges={['top', 'left', 'right']}>
        <LinearGradient colors={C.GRAD_HEADER} style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.8}>
            <Ionicons name="chevron-back" size={22} color={C.TEXT} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>SETTINGS</Text>
            <Text style={styles.headerSub}>Audio · About</Text>
          </View>
          <View style={styles.headerIcon}>
            <Ionicons name="settings" size={20} color="rgba(255,255,255,0.45)" />
          </View>
        </LinearGradient>
      </SafeAreaView>

      <SafeAreaView style={styles.body} edges={['bottom', 'left', 'right']}>

        {/* ── Tab bar ── */}
        <View style={styles.tabBar}>
          <LinearGradient
            colors={['rgba(6,2,18,0.88)', 'rgba(10,4,24,0.80)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={[StyleSheet.absoluteFill, styles.tabBarBorder]} />

          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={styles.tabBtn}
                onPress={() => switchTab(tab.key)}
                activeOpacity={0.8}
              >
                {active && (
                  <LinearGradient
                    colors={[C.PRIMARY + '40', C.PRIMARY + '18']}
                    style={StyleSheet.absoluteFill}
                  />
                )}
                <Ionicons
                  name={tab.icon}
                  size={16}
                  color={active ? C.PRIMARY_LIGHT : C.TEXT_MUTED}
                />
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
                {active && <View style={styles.tabUnderline} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Tab content ── */}
        {activeTab === 'audio' ? (

          <View style={styles.section}>
            <SettingRow
              icon="musical-notes-outline"
              label="Background Music"
              hint="Home and battle BGM volume"
              value={musicVol}
              onChange={handleMusicChange}
              color={C.PRIMARY_LIGHT}
              muted={musicMute}
              onMuteToggle={toggleMusicMute}
            />
            <SettingRow
              icon="flash-outline"
              label="Sound Effects"
              hint="Attack, card flip and UI sounds"
              value={sfxVol}
              onChange={handleSFXChange}
              color={C.CYAN}
              muted={sfxMute}
              onMuteToggle={toggleSFXMute}
              onTest={testSFX}
            />
          </View>

        ) : activeTab === 'cloud' ? (

          <View style={styles.section}>
            {/* Account card */}
            <View style={styles.cloudCard}>
              <LinearGradient colors={[C.GLASS_1, C.GLASS_2]} style={StyleSheet.absoluteFill} />
              <View style={[styles.rowBorder, { borderColor: C.BORDER }]} />
              <View style={styles.cloudRow}>
                <View style={[styles.rowIcon, {
                  backgroundColor: authUser ? C.SUCCESS + '1A' : C.PRIMARY + '1A',
                  borderColor:     authUser ? C.SUCCESS + '40' : C.PRIMARY + '40',
                }]}>
                  <Ionicons
                    name={authUser ? 'cloud-done-outline' : 'cloud-offline-outline'}
                    size={18}
                    color={authUser ? C.SUCCESS : C.PRIMARY_LIGHT}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>
                    {authUser ? 'Account Connected' : 'Not Connected'}
                  </Text>
                  <Text style={[styles.rowHint, { color: authUser ? C.SUCCESS + 'CC' : C.TEXT_MUTED }]} numberOfLines={1}>
                    {authUser ? (cloudAccountEmail || authUser.email || 'Syncing enabled') : 'Tap to connect and sync progress'}
                  </Text>
                </View>
                {authUser ? (
                  <TouchableOpacity
                    style={[styles.cloudBtn, { borderColor: C.DANGER + '60' }]}
                    onPress={handleSignOut}
                    activeOpacity={0.75}
                    disabled={signingOut}
                  >
                    {signingOut
                      ? <ActivityIndicator size="small" color={C.DANGER} />
                      : <Text style={[styles.cloudBtnText, { color: C.DANGER }]}>DISCONNECT</Text>
                    }
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.cloudBtn, { borderColor: C.PRIMARY + '60' }]}
                    onPress={() => navigation.navigate('CloudAuth')}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.cloudBtnText, { color: C.PRIMARY_LIGHT }]}>CONNECT</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Sync now + account deletion — only when signed in */}
            {authUser ? (
              <>
                <View style={styles.cloudCard}>
                  <LinearGradient colors={[C.GLASS_1, C.GLASS_2]} style={StyleSheet.absoluteFill} />
                  <View style={[styles.rowBorder, { borderColor: C.BORDER }]} />
                  <View style={styles.cloudRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle}>Last Synced</Text>
                      <Text style={[styles.rowHint, { color: C.TEXT_MUTED }]}>
                        {lastSync ? new Date(lastSync).toLocaleString() : 'Not synced this session'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.cloudBtn, { borderColor: C.CYAN + '60' }]}
                      onPress={handleSyncNow}
                      activeOpacity={0.75}
                      disabled={syncing}
                    >
                      {syncing
                        ? <ActivityIndicator size="small" color={C.CYAN} />
                        : <Text style={[styles.cloudBtnText, { color: C.CYAN }]}>SYNC NOW</Text>
                      }
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Danger zone — account deletion (App Store / Play requirement) */}
                <View style={styles.cloudCard}>
                  <LinearGradient colors={[C.GLASS_1, C.GLASS_2]} style={StyleSheet.absoluteFill} />
                  <View style={[styles.rowBorder, { borderColor: C.DANGER + '40' }]} />
                  <View style={styles.cloudRow}>
                    <View style={[styles.rowIcon, { backgroundColor: C.DANGER + '1A', borderColor: C.DANGER + '40' }]}>
                      <Ionicons name="trash-outline" size={18} color={C.DANGER} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle}>Delete Account</Text>
                      <Text style={[styles.rowHint, { color: C.TEXT_MUTED }]} numberOfLines={2}>
                        Permanently removes your account, cloud save and local progress.
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.cloudBtn, { borderColor: C.DANGER + '60' }]}
                      onPress={handleDeleteAccount}
                      activeOpacity={0.75}
                      disabled={deleting}
                    >
                      {deleting
                        ? <ActivityIndicator size="small" color={C.DANGER} />
                        : <Text style={[styles.cloudBtnText, { color: C.DANGER }]}>DELETE</Text>
                      }
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            ) : null}
          </View>

        ) : (

          <View style={styles.infoCard}>
            <LinearGradient colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']} style={StyleSheet.absoluteFill} />
            <View style={[styles.rowBorder, { borderColor: C.BORDER }]} />

            <View style={styles.infoLayout}>
              {/* Left: Branding */}
              <View style={styles.infoBrand}>
                <Text style={styles.gameTitle}>AETHERIA</Text>
                <Text style={styles.gameSubtitle}>Legends Unbound</Text>
                <View style={[styles.infoDivider, { marginVertical: 8 }]} />
                <Text style={styles.gameDesc} numberOfLines={5}>
                  {APP_INFO.factionCount} factions. {APP_INFO.heroCount} legends. One war to decide the fate of Aetheria.
                  Collect heroes, forge squads, and unleash Trump Cards across {APP_INFO.stageCount} story-driven battles.
                </Text>
              </View>

              {/* Vertical divider */}
              <View style={styles.infoVDivider} />

              {/* Right: Info rows */}
              <View style={styles.infoRows}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Studio</Text>
                  <Text style={styles.infoVal}>{APP_INFO.studio}</Text>
                </View>
                <View style={styles.infoDivider} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Website</Text>
                  <Text style={[styles.infoVal, { flex: 1, textAlign: 'right' }]} numberOfLines={1}>{APP_INFO.website}</Text>
                </View>
                <View style={styles.infoDivider} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Version</Text>
                  <Text style={styles.infoVal}>{APP_INFO.version}</Text>
                </View>
                <View style={styles.infoDivider} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Build</Text>
                  <Text style={styles.infoVal}>Expo 56 · RN 0.85</Text>
                </View>
                <View style={styles.infoDivider} />
                <TouchableOpacity
                  style={styles.infoRow}
                  onPress={() => { AudioManager.playButtonSFX(); Linking.openURL(APP_INFO.privacyUrl).catch(() => {}); }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.infoLabel}>Privacy Policy</Text>
                  <Ionicons name="open-outline" size={14} color={C.PRIMARY_LIGHT} />
                </TouchableOpacity>
                <View style={styles.infoDivider} />
                <TouchableOpacity
                  style={styles.infoRow}
                  onPress={() => { AudioManager.playButtonSFX(); Linking.openURL(APP_INFO.termsUrl).catch(() => {}); }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.infoLabel}>Terms of Service</Text>
                  <Ionicons name="open-outline" size={14} color={C.PRIMARY_LIGHT} />
                </TouchableOpacity>
                <View style={styles.infoDivider} />
                <TouchableOpacity
                  style={styles.infoRow}
                  onPress={() => { AudioManager.playButtonSFX(); Linking.openURL(APP_INFO.accountDeletionUrl).catch(() => {}); }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.infoLabel}>Account Deletion</Text>
                  <Ionicons name="open-outline" size={14} color={C.PRIMARY_LIGHT} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

        )}

      </SafeAreaView>

      {/* ── Forced restart modal (non-dismissable) ── */}
      <Modal
        visible={restartVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.restartOverlay}>
          <View style={styles.restartCard}>
            <LinearGradient colors={[C.BG_MID, C.BG_CARD]} style={StyleSheet.absoluteFill} pointerEvents="none" />
            <View style={[StyleSheet.absoluteFill, styles.restartBorder]} pointerEvents="none" />
            <View style={styles.restartIconWrap}>
              <LinearGradient colors={[C.DANGER, C.PRIMARY]} style={styles.restartIconGrad}>
                <Ionicons name="power-outline" size={26} color={C.TEXT} />
              </LinearGradient>
            </View>
            <Text style={styles.restartTitle}>SIGNED OUT</Text>
            <Text style={styles.restartMsg}>
              Your session has ended and local data has been reset.{'\n'}The game must restart to continue.
            </Text>
            <TouchableOpacity
              style={styles.restartBtn}
              onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Loading' }] })}
              activeOpacity={0.82}
            >
              <LinearGradient colors={C.GRAD_PINK} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.restartBtnGrad}>
                <Ionicons name="refresh-outline" size={15} color={C.TEXT} />
                <Text style={styles.restartBtnTxt}>RESTART NOW</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.BG_DEEP },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 10, gap: 10,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.12)',
  },
  backBtn:     { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: C.TEXT, letterSpacing: 4 },
  headerSub:   { fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 1 },
  headerIcon:  { padding: 6 },

  // Body
  body: { flex: 1, paddingHorizontal: 20, paddingTop: 14, gap: 14 },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    borderRadius: 12, overflow: 'hidden',
    position: 'relative',
    borderWidth: 1, borderColor: C.BORDER,
  },
  tabBarBorder: { borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, paddingVertical: 11, position: 'relative', overflow: 'hidden',
  },
  tabLabel: {
    fontSize: 11, fontWeight: '800', color: C.TEXT_MUTED, letterSpacing: 1.5,
  },
  tabLabelActive: { color: C.PRIMARY_LIGHT },
  tabUnderline: {
    position: 'absolute', bottom: 0, left: 16, right: 16,
    height: 2, borderRadius: 1, backgroundColor: C.PRIMARY_LIGHT,
  },

  // Section (audio tab content wrapper)
  section: { gap: 10 },

  // Setting row
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 12, overflow: 'hidden',
    paddingHorizontal: 14, paddingVertical: 14,
    position: 'relative',
  },
  rowBorder: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 12, borderWidth: 1,
  },
  rowIcon: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  rowLabel: { width: 160 },
  rowTitle: { fontSize: 12, fontWeight: '800', color: C.TEXT, letterSpacing: 0.3 },
  rowHint:  { fontSize: 9,  fontWeight: '600', marginTop: 2 },

  pct: { width: 48, fontSize: 11, fontWeight: '900', textAlign: 'right' },

  // Slider track
  track: {
    width: SLIDER_W, height: 28,
    justifyContent: 'center', position: 'relative',
  },
  trackRail: {
    position: 'absolute', left: 0, right: 0,
    height: 5, borderRadius: 3, backgroundColor: C.BG_BOTTOM,
  },
  trackFill: {
    position: 'absolute', left: 0,
    height: 5, borderRadius: 3,
  },
  thumb: {
    position: 'absolute',
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: C.THUMB,
    borderWidth: 2,
    shadowColor: C.SHADOW, shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 4,
    elevation: 4,
  },

  // Mute button
  muteBtn: {
    width: 36, height: 36, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: C.BORDER,
    marginLeft: 4,
  },

  // Cloud tab
  cloudCard: {
    borderRadius: 12, overflow: 'hidden',
    paddingHorizontal: 14, paddingVertical: 14,
    position: 'relative',
  },
  cloudRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  cloudBtn: {
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 8, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
    minWidth: 80,
  },
  cloudBtnText: {
    fontSize: 10, fontWeight: '800', letterSpacing: 0.8,
  },
  cloudError: {
    fontSize: 10, color: C.DANGER, marginTop: 8,
    fontWeight: '600',
  },

  // Info card
  infoCard: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  infoLayout: {
    flex: 1, flexDirection: 'row',
    paddingHorizontal: 16, paddingVertical: 12, gap: 16,
  },
  infoBrand: {
    flex: 1, justifyContent: 'center',
  },
  infoVDivider: {
    width: 1, backgroundColor: C.BORDER_SUBTLE,
  },
  infoRows: {
    flex: 1.4, justifyContent: 'center',
  },
  gameTitle: {
    fontSize: 18, fontWeight: '900', color: C.GOLD,
    letterSpacing: 5,
  },
  gameSubtitle: {
    fontSize: 11, fontWeight: '700', color: C.TEXT_MUTED,
    letterSpacing: 1.5,
  },
  gameDesc: {
    fontSize: 11, color: C.TEXT_SOFT, lineHeight: 17,
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 7,
  },
  infoDivider: { height: 1, backgroundColor: C.BORDER_SUBTLE },
  infoLabel: { fontSize: 12, fontWeight: '700', color: C.TEXT_SOFT },
  infoVal:   { fontSize: 12, fontWeight: '800', color: C.TEXT_MUTED },

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
  restartBtnTxt: { fontSize: 13, fontWeight: '900', color: C.TEXT, letterSpacing: 1.5 },
});
