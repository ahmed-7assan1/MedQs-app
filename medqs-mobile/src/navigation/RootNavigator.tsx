import tw from 'twrnc';
import { useEffect, useState } from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabNavigator } from './TabNavigator';
import { AuthNavigator } from './AuthNavigator';
import { SubjectDetailScreen } from '../screens/SubjectDetailScreen';
import { QuizPlayerScreen } from '../screens/QuizPlayerScreen';
import { LectureDetailScreen } from '../screens/LectureDetailScreen';
import { PodcastPlayerScreen } from '../screens/PodcastPlayerScreen';
import { LeaderboardScreen } from '../screens/LeaderboardScreen';
import { AdminDashboardScreen } from '../screens/AdminDashboardScreen';
import { AdminUserManagerScreen } from '../screens/AdminUserManagerScreen';
import { AdminQuizManagerScreen } from '../screens/AdminQuizManagerScreen';
import { StudyAssistantScreen } from '../screens/StudyAssistantScreen';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { useHomeStore } from '../store/useHomeStore';
import { mobileApi } from '../lib/api';
import { View, ActivityIndicator, StatusBar } from 'react-native';
import { logErrorToFile } from '../lib/debug_logger';

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  const { user, isLoading: authLoading, checkAuth, updateUser } = useAuthStore();
  const { setConfig, primaryColor } = useThemeStore();
  const { setHomeData, setLoading: setHomeLoading } = useHomeStore();
  const [configLoading, setConfigLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        // 1. Initial auth check (checks local storage only)
        await checkAuth();
        
        // 2. Fetch Bootstrap data (Batched API)
        // This returns fresh user stats, site config, and home dashboard
        const { config, user: freshUser, home } = await mobileApi.getBootstrap();
        
        if (config) setConfig(config);
        if (freshUser) updateUser(freshUser);
        if (home) setHomeData(home);
        
      } catch (err) {
        console.error('[RootNavigator] Bootstrap failed:', err);
        logErrorToFile(err);
      } finally {
        setConfigLoading(false);
        setHomeLoading(false);
      }
    }
    init();
  }, [checkAuth, setConfig, updateUser, setHomeData, setHomeLoading]);

  if (authLoading || configLoading) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-[#07090F]`}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={primaryColor || "#3b82f6"} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={DarkTheme}>
      <StatusBar barStyle="light-content" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="MainTabs" component={TabNavigator} />
            <Stack.Screen name="SubjectDetail" component={SubjectDetailScreen} />
            <Stack.Screen name="QuizPlayer" component={QuizPlayerScreen} />
            <Stack.Screen name="LectureDetail" component={LectureDetailScreen} />
            <Stack.Screen name="PodcastPlayer" component={PodcastPlayerScreen} />
            <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
            <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
            <Stack.Screen name="AdminUserManager" component={AdminUserManagerScreen} />
            <Stack.Screen name="AdminQuizManager" component={AdminQuizManagerScreen} />
            <Stack.Screen name="StudyAssistant" component={StudyAssistantScreen} />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

