import 'react-native-gesture-handler';
// Pre-warm Supabase client on app start so the session is restored from
// AsyncStorage before the user opens CloudAuthScreen.
import './src/cloud/supabaseConfig';
import React, { useEffect, useRef, useState } from 'react';
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
    NavigationBar.setHidden(true);
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!navRef.current || navRef.current.canGoBack()) return false;
      setQuitVisible(true);
      return true;
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
            {/* Loading is always the entry point — replaces itself with Home when done */}
            <Stack.Screen
              name="Loading"
              component={LoadingScreen}
              options={{ animation: 'none' }}
            />
            <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ animation: 'fade' }} />
            <Stack.Screen name="Home"       component={HomeScreen}       />
            <Stack.Screen name="Story"      component={StoryScreen}      />
            <Stack.Screen name="Narration"  component={NarrationScreen}  options={{ animation: 'fade' }} />
            <Stack.Screen name="Battle"     component={BattleScreen}     />
            <Stack.Screen name="Victory"     component={VictoryScreen}     options={{ animation: 'fade' }} />
            <Stack.Screen name="DailyReward" component={DailyRewardScreen} options={{ animation: 'fade' }} />
            <Stack.Screen name="Collection" component={CollectionScreen} />
            <Stack.Screen name="TeamBuild"  component={TeamBuildScreen}  />
            <Stack.Screen name="Summon"     component={SummonScreen}     />
            <Stack.Screen name="HeroDetail" component={HeroDetailScreen} />
            <Stack.Screen name="Profile"     component={ProfileScreen}    />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ animation: 'fade' }} />
            <Stack.Screen name="Settings"    component={SettingsScreen}   options={{ animation: 'fade' }} />
            <Stack.Screen name="WorldMap"    component={WorldMapScreen}   options={{ animation: 'fade' }} />
            <Stack.Screen name="DailyQuests" component={DailyQuestScreen} options={{ animation: 'fade' }} />
            <Stack.Screen name="Tower"       component={TowerScreen}      options={{ animation: 'fade' }} />
            <Stack.Screen name="TowerShop"   component={TowerShopScreen}  options={{ animation: 'fade' }} />
            <Stack.Screen name="Shop"        component={ShopScreen}       options={{ animation: 'fade' }} />
            <Stack.Screen name="CloudAuth"   component={CloudAuthScreen}  options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="PullHistory"  component={PullHistoryScreen}  options={{ animation: 'fade' }} />
            <Stack.Screen name="Achievements" component={AchievementScreen}  options={{ animation: 'fade' }} />
            <Stack.Screen name="Leaderboard"  component={LeaderboardScreen}  options={{ animation: 'fade' }} />
            <Stack.Screen name="Events"       component={EventScreen}        options={{ animation: 'fade' }} />
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
