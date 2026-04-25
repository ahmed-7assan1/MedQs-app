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
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { View, ActivityIndicator, StatusBar } from 'react-native';

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  const { user, isLoading: authLoading, checkAuth } = useAuthStore();
  const { loadConfig, primaryColor } = useThemeStore();
  const [configLoading, setConfigLoading] = useState(true);

  useEffect(() => {
    async function init() {
      // 1. Check if user is logged in
      await checkAuth();
      // 2. Load site configuration (branding, features)
      await loadConfig();
      setConfigLoading(false);
    }
    init();
  }, [checkAuth, loadConfig]);

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
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

