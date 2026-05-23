import React, { useState } from 'react';
import {
  View, Text, SafeAreaView, ScrollView,
  KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { mobileApi } from '../lib/api';
import { storage } from '../lib/storage';
import { Eye, EyeOff, Mail, Lock, User, AlertCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { EliteButton } from '../components/ui/EliteButton';
import { EliteInput } from '../components/ui/EliteInput';

export function RegisterScreen({ navigation }: any) {
  const { login } = useAuthStore();
  const { getTheme, primaryColor, isDarkMode } = useThemeStore();
  const theme = getTheme();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || password.length < 6) {
      setError('Please fill all fields. Password must be at least 6 characters.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setError(null);
    setLoading(true);

    try {
      await mobileApi.register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      const loginRes = await mobileApi.login({ email: email.trim().toLowerCase(), password });
      if (loginRes.token) await storage.setItem('sessionToken', loginRes.token);
      await login(loginRes.user);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
            <EliteButton
              title=""
              variant="outline"
              onPress={() => navigation.goBack()}
              style={{ width: 44, height: 44, padding: 0, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.border }}
            />
          </View>

          <Animated.View entering={FadeInDown}>
            <Text style={{ color: theme.colors.text, fontSize: 28, fontWeight: '900', letterSpacing: -0.5 }}>Create Account</Text>
            <Text style={{ color: theme.colors.textMuted, fontWeight: '600', fontSize: 14, marginTop: 8 }}>
              Join MedOneX and start your medical journey
            </Text>
          </Animated.View>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {error && (
              <Animated.View entering={FadeInDown} style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, backgroundColor: theme.colors.danger + '10', marginBottom: 20 }}>
                <AlertCircle color={theme.colors.danger} size={18} style={{ marginRight: 10 }} />
                <Text style={{ color: theme.colors.danger, fontWeight: '700', fontSize: 13, flex: 1 }}>{error}</Text>
              </Animated.View>
            )}

            <Animated.View entering={FadeInDown.delay(100)}>
              <EliteInput label="Full Name" value={name} onChangeText={(t) => { setName(t); setError(null); }} placeholder="Dr. Ahmed Hassan" icon={User} />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(150)}>
              <EliteInput label="Email" value={email} onChangeText={(t) => { setEmail(t); setError(null); }} placeholder="doctor@example.com" icon={Mail} keyboardType="email-address" />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(200)}>
              <EliteInput label="Password" value={password} onChangeText={(t) => { setPassword(t); setError(null); }} placeholder="••••••••" icon={Lock} secureTextEntry={!showPw} rightIcon={showPw ? EyeOff : Eye} onRightIconPress={() => setShowPw(!showPw)} />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(250)} style={{ marginTop: 24 }}>
              <EliteButton title="Create Account" onPress={handleRegister} loading={loading} />

              <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
                <Text style={{ color: theme.colors.textMuted, fontWeight: '600', fontSize: 13 }}>Already have an account? </Text>
                <EliteButton title="Sign In" variant="outline" onPress={() => navigation.navigate('Login')} style={{ height: 'auto', paddingVertical: 2, paddingHorizontal: 4, borderWidth: 0 }} textStyle={{ color: primaryColor, fontWeight: '800' }} />
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}