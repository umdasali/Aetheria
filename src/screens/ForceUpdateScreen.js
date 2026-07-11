import React from 'react';
import { View, Text, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../theme/colors';
import HudScreen from '../components/ui/HudScreen';
import GlassPanel from '../components/ui/GlassPanel';
import GlowButton from '../components/ui/GlowButton';
import { APP_INFO } from '../constants/appInfo';

const DEFAULT_MESSAGE =
  'A new version of Aetheria: Legends Unbound is available with fixes and improvements. Please update to continue playing.';

// Blocking screen — reached only from LoadingScreen when checkForceUpdate()
// (src/cloud/versionCheck.js) reports the installed build is below the
// platform's min_version. There is no navigation route back to Home from
// here: the hardware back button falls through to App.js's generic
// "!canGoBack() -> show quit confirm" handler, so the only way past this
// screen is to actually update and relaunch.
export default function ForceUpdateScreen({ route }) {
  const storeUrl = route?.params?.storeUrl;
  const message  = route?.params?.message || DEFAULT_MESSAGE;

  const handleUpdate = () => {
    if (storeUrl) Linking.openURL(storeUrl).catch(() => {});
  };

  return (
    <HudScreen>
      <View style={styles.center}>
        <GlassPanel style={styles.card} borderColor={C.WARNING} glowColor={C.WARNING} radius={14}>
          <View style={styles.iconWrap}>
            <Ionicons name="cloud-download-outline" size={54} color={C.WARNING} />
          </View>
          <Text style={styles.title}>UPDATE REQUIRED</Text>
          <Text style={styles.message}>{message}</Text>
          <GlowButton
            label="UPDATE NOW"
            onPress={handleUpdate}
            gradient={C.GRAD_GOLD}
            glowColor={C.WARNING}
            height={50}
            style={styles.button}
          />
          <Text style={styles.version}>Installed version: {APP_INFO.version}</Text>
        </GlassPanel>
      </View>
    </HudScreen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  card: {
    width: 380,
    maxWidth: '100%',
    paddingHorizontal: 28,
    paddingVertical: 26,
    alignItems: 'center',
  },
  iconWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.WARNING + '24',
    borderWidth: 1,
    borderColor: C.WARNING + '66',
    marginBottom: 16,
  },
  title: {
    fontSize: 19,
    fontWeight: '900',
    color: C.TEXT,
    letterSpacing: 2.5,
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 13,
    color: C.TEXT_ON_DARK_SOFT,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 22,
  },
  button: { width: '100%' },
  version: {
    fontSize: 10,
    color: C.TEXT_DISABLED,
    letterSpacing: 0.5,
    marginTop: 16,
  },
});
