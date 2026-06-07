import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { RootNavigator } from './src/navigation/RootNavigator';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts, Inter_400Regular, Inter_700Bold, Inter_900Black } from '@expo-google-fonts/inter';
import { Outfit_400Regular, Outfit_700Bold, Outfit_900Black } from '@expo-google-fonts/outfit';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ErrorBoundary from './src/components/ui/ErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, gcTime: 1000 * 60 * 60 * 24 },
  },
});

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular, Inter_700Bold, Inter_900Black,
    Outfit_400Regular, Outfit_700Bold, Outfit_900Black,
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        await SplashScreen.hideAsync();
      } catch {}
      if (!fontsLoaded) return;
      setTimeout(() => setReady(true), 100);
    }
    if (fontsLoaded) init();
  }, [fontsLoaded]);

  if (!fontsLoaded || !ready) {
    return (
      <View style={{ flex: 1, backgroundColor: '#07080F', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#6C5FF0" size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <RootNavigator />
        </ErrorBoundary>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
