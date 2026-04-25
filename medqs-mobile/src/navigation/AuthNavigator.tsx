import tw from 'twrnc';
import { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { storage } from '../lib/storage';
import { View, ActivityIndicator } from 'react-native';

const Stack = createNativeStackNavigator();

export function AuthNavigator() {
  const [initialRoute, setInitialRoute] = useState<string | null>(null);

  useEffect(() => {
    async function checkOnboarding() {
      const done = await storage.getItem('onboarding_done_v1');
      setInitialRoute(done === 'true' ? 'Login' : 'Onboarding');
    }
    checkOnboarding();
  }, []);

  if (!initialRoute) {
    return (
      <View style={tw`flex-1 bg-[#07090F] justify-center items-center`}>
        <ActivityIndicator color="#0d9488" />
      </View>
    );
  }

  return (
    <Stack.Navigator 
      initialRouteName={initialRoute}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}
