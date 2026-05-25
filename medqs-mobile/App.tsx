import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { RootNavigator } from './src/navigation/RootNavigator';
import * as SplashScreen from 'expo-splash-screen';
import * as Updates from 'expo-updates';
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

function UpdateChecker({ children }: { children: React.ReactNode }) {
  const [updateStatus, setUpdateStatus] = useState<'checking' | 'ready' | 'none'>('checking');

  useEffect(() => {
    (async () => {
      if (__DEV__) { setUpdateStatus('none'); return; }
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          setUpdateStatus('ready');
        } else {
          setUpdateStatus('none');
        }
      } catch {
        setUpdateStatus('none');
      }
    })();
  }, []);

  if (updateStatus === 'checking') return null;
  if (updateStatus === 'ready') {
    return (
      <View style={{ flex: 1, backgroundColor: '#07080F', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Text style={{ fontSize: 48, marginBottom: 24 }}>✨</Text>
        <Text style={{ color: 'white', fontSize: 22, fontWeight: '900', textAlign: 'center', marginBottom: 8 }}>Update Available</Text>
        <Text style={{ color: '#94A3B8', fontSize: 14, textAlign: 'center', marginBottom: 32 }}>A new version is ready.{'\n'}Restart to see the latest features.</Text>
        <TouchableOpacity onPress={() => Updates.reloadAsync()} style={{ paddingHorizontal: 32, paddingVertical: 16, backgroundColor: '#6C5FF0', borderRadius: 20 }}>
          <Text style={{ color: 'white', fontWeight: '900', fontSize: 15 }}>Restart Now</Text>
        </TouchableOpacity>
      </View>
    );
  }
  return <>{children}</>;
}

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
        <UpdateChecker>
          <ErrorBoundary>
            <RootNavigator />
          </ErrorBoundary>
        </UpdateChecker>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
