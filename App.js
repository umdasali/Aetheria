import 'react-native-gesture-handler';
// Pre-warm Supabase client on app start so the session is restored from
// AsyncStorage before the user opens CloudAuthScreen.
import './src/cloud/supabaseConfig';
import React, { useEffect, useRef, useState } from 'react';
import { configure as rcConfigure, setUserId as rcSetUserId, logOut as rcLogOut } from './src/utils/RevenueCatManager';
import { onAuthChanged } from './src/cloud/auth';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, BackHandler, Modal, View, Text, TouchableOpacity } from 'react-native';
import { C } from './src/theme/colors';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SplashScreen from 'expo-splash-screen';
import { NavigationBar } from 'expo-navigation-bar';

import ErrorBoundary     from './src/components/ErrorBoundary';
import LoadingScreen     from './src/screens/LoadingScreen';
import OnboardingScreen  from './src/screens/OnboardingScreen';
import HomeScreen        from './src/screens/HomeScreen';
import StoryScreen       from './src/screens/StoryScreen';
import NarrationScreen   from './src/screens/NarrationScreen';
import VictoryScreen      from './src/screens/VictoryScreen';
import DailyRewardScreen  from './src/screens/DailyRewardScreen';
import BattleScreen       from './src/screens/BattleScreen';
import CollectionScreen  from './src/screens/CollectionScreen';
import TeamBuildScreen   from './src/screens/TeamBuildScreen';
import SummonScreen      from './src/screens/SummonScreen';
import HeroDetailScreen  from './src/screens/HeroDetailScreen';
import ProfileScreen     from './src/screens/ProfileScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import SettingsScreen    from './src/screens/SettingsScreen';
import WorldMapScreen    from './src/screens/WorldMapScreen';
import DailyQuestScreen  from './src/screens/DailyQuestScreen';
import TowerScreen       from './src/screens/TowerScreen';
import TowerShopScreen   from './src/screens/TowerShopScreen';
import ResourceDungeonScreen from './src/screens/ResourceDungeonScreen';
import ShopScreen        from './src/screens/ShopScreen';
import CloudAuthScreen   from './src/screens/CloudAuthScreen';
import PullHistoryScreen  from './src/screens/PullHistoryScreen';
import AchievementScreen  from './src/screens/AchievementScreen';
import LeaderboardScreen  from './src/screens/LeaderboardScreen';
import EventScreen        from './src/screens/EventScreen';

// Hold the native splash until LoadingScreen signals it's ready
SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();

export default function App() {
  const navRef             = useRef(null);
  const [quitVisible, setQuitVisible] = useState(false);

  useEffect(() => {
    try { NavigationBar.setHidden(true); } catch (_) {}
  }, []);

  // Initialize RevenueCat once on startup, then keep its userId in sync with
  // Supabase auth so purchases are always tied to the correct account.
  useEffect(() => {
    const { getUser } = require('./src/cloud/auth');
    const initialUser = getUser();
    rcConfigure(initialUser?.id ?? null);
    const unsub = onAuthChanged(user => {
      if (user) rcSetUserId(user.id);
      else rcLogOut();
    });
    return unsub;
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!navRef.current) return false;
      const routeName = navRef.current.getCurrentRoute?.()?.name;
      // On the main menu (Home) — or anywhere there's nothing left to go back
      // to — the device back button confirms exit instead of navigating away.
      // Every other screen keeps normal back navigation. (BattleScreen registers
      // its own handler that runs first and shows its "Quit Battle?" prompt.)
      if (routeName === 'Home' || !navRef.current.canGoBack()) {
        setQuitVisible(true);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ErrorBoundary>
        <StatusBar hidden />
        <NavigationContainer ref={navRef}>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              animation: 'fade',
              contentStyle: { backgroundColor: C.BG_SCREEN },
            }}
          >
            <Stack.Screen name="Loading"      component={LoadingScreen}         options={{ animation: 'none' }} />
            <Stack.Screen name="Onboarding"   component={OnboardingScreen}      />
            <Stack.Screen name="Home"         component={HomeScreen}            />
            <Stack.Screen name="Story"        component={StoryScreen}           />
            <Stack.Screen name="Narration"    component={NarrationScreen}       />
            <Stack.Screen name="Battle"       component={BattleScreen}          />
            <Stack.Screen name="Victory"      component={VictoryScreen}         />
            <Stack.Screen name="DailyReward"  component={DailyRewardScreen}     />
            <Stack.Screen name="Collection"   component={CollectionScreen}      />
            <Stack.Screen name="TeamBuild"    component={TeamBuildScreen}       />
            <Stack.Screen name="Summon"       component={SummonScreen}          />
            <Stack.Screen name="HeroDetail"   component={HeroDetailScreen}      />
            <Stack.Screen name="Profile"      component={ProfileScreen}         />
            <Stack.Screen name="EditProfile"  component={EditProfileScreen}     />
            <Stack.Screen name="Settings"     component={SettingsScreen}        />
            <Stack.Screen name="WorldMap"     component={WorldMapScreen}        />
            <Stack.Screen name="DailyQuests"  component={DailyQuestScreen}      />
            <Stack.Screen name="Tower"        component={TowerScreen}           />
            <Stack.Screen name="TowerShop"    component={TowerShopScreen}       />
            <Stack.Screen name="Dungeons"     component={ResourceDungeonScreen} />
            <Stack.Screen name="Shop"         component={ShopScreen}            />
            <Stack.Screen name="CloudAuth"    component={CloudAuthScreen}       />
            <Stack.Screen name="PullHistory"  component={PullHistoryScreen}     />
            <Stack.Screen name="Achievements" component={AchievementScreen}     />
            <Stack.Screen name="Leaderboard"  component={LeaderboardScreen}     />
            <Stack.Screen name="Events"       component={EventScreen}           />
          </Stack.Navigator>
        </NavigationContainer>

        {/* ── Quit-game confirmation modal ───────────────────────────── */}
        <Modal
          visible={quitVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setQuitVisible(false)}
        >
          <View style={styles.quitOverlay}>
            <View style={styles.quitCard}>
              <Text style={styles.quitTitle}>QUIT GAME?</Text>
              <Text style={styles.quitSub}>Are you sure you want to quit the game?</Text>
              <View style={styles.quitBtns}>
                <TouchableOpacity
                  style={[styles.quitBtn, styles.quitBtnYes]}
                  onPress={() => BackHandler.exitApp()}
                  activeOpacity={0.82}
                >
                  <Text style={styles.quitBtnTxt}>YES</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.quitBtn, styles.quitBtnNo]}
                  onPress={() => setQuitVisible(false)}
                  activeOpacity={0.82}
                >
                  <Text style={styles.quitBtnTxt}>NO</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.BG_SCREEN },

  quitOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quitCard: {
    width: 300,
    borderRadius: 14,
    backgroundColor: C.BG_BASE,
    borderWidth: 1,
    borderColor: C.BORDER_STRONG,
    padding: 28,
    alignItems: 'center',
    shadowColor: C.PRIMARY,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 12,
  },
  quitTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: C.TEXT,
    letterSpacing: 3,
    marginBottom: 10,
  },
  quitSub: {
    fontSize: 12,
    color: C.TEXT_MUTED,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  quitBtns: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  quitBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  quitBtnYes: {
    backgroundColor: C.DANGER,
  },
  quitBtnNo: {
    backgroundColor: C.GLASS_3,
    borderWidth: 1,
    borderColor: C.BORDER_STRONG,
  },
  quitBtnTxt: {
    fontSize: 14,
    fontWeight: '900',
    color: C.TEXT,
    letterSpacing: 1.5,
  },
});
