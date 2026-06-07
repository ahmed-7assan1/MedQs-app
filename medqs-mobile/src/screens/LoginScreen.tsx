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
import { Eye, EyeOff, Mail, Lock, Sparkles, AlertCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { EliteButton } from '../components/ui/EliteButton';
import { EliteInput } from '../components/ui/EliteInput';

export function LoginScreen({ navigation }: any) {
  const { login, guestLogin } = useAuthStore();
  const { getTheme, primaryColor, isDarkMode, loadConfig } = useThemeStore();
  const theme = getTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setError(null);
    setLoading(true);

    try {
      const res = await mobileApi.login({
        email: email.trim().toLowerCase(),
        password,
      });

      if (res.token) {
        await storage.setItem('sessionToken', res.token);
      }
      await login(res.user);
      if (res.user.universityId) {
        await loadConfig(res.user.universityId);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      setError(err?.message || 'Invalid credentials. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, justifyContent: 'center' }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Logo & Branding */}
            <Animated.View entering={FadeInDown.delay(100)} style={{ alignItems: 'center', marginBottom: 48 }}>
              <View style={{
                width: 88, height: 88, borderRadius: 28,
                backgroundColor: primaryColor + '15',
                alignItems: 'center', justifyContent: 'center',
                marginBottom: 20,
                borderWidth: 1, borderColor: primaryColor + '25',
              }}>
                <Sparkles color={primaryColor} size={40} strokeWidth={2} />
              </View>
              <Text style={{ color: theme.colors.text, fontSize: 30, fontWeight: '900', letterSpacing: -0.5 }}>
                MedOneX
              </Text>
              <Text style={{ color: theme.colors.textMuted, fontWeight: '600', fontSize: 14, marginTop: 8, textAlign: 'center' }}>
                Your AI-powered medical study platform
              </Text>
            </Animated.View>

            {/* Error */}
            {error && (
              <Animated.View entering={FadeInDown} style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, backgroundColor: theme.colors.danger + '10', marginBottom: 20 }}>
                <AlertCircle color={theme.colors.danger} size={18} style={{ marginRight: 10 }} />
                <Text style={{ color: theme.colors.danger, fontWeight: '700', fontSize: 13, flex: 1 }}>{error}</Text>
              </Animated.View>
            )}

            {/* Form */}
            <Animated.View entering={FadeInDown.delay(300)}>
              <EliteInput
                label="Email"
                value={email}
                onChangeText={(t) => { setEmail(t); setError(null); }}
                placeholder="doctor@example.com"
                icon={Mail}
                keyboardType="email-address"
              />

              <EliteInput
                label="Password"
                value={password}
                onChangeText={(t) => { setPassword(t); setError(null); }}
                placeholder="••••••••"
                icon={Lock}
                secureTextEntry={!showPw}
                rightIcon={showPw ? EyeOff : Eye}
                onRightIconPress={() => setShowPw(!showPw)}
              />

              <EliteButton
                title="Sign In"
                onPress={handleLogin}
                loading={loading}
                style={{ marginTop: 16 }}
              />
            </Animated.View>

            {/* Bottom Links */}
            <Animated.View entering={FadeInDown.delay(500)} style={{ marginTop: 40, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}>
              <Text style={{ color: theme.colors.textMuted, fontWeight: '600', fontSize: 13 }}>
                Don't have an account?{' '}
              </Text>
              <EliteButton
                title="Create One"
                variant="outline"
                onPress={() => navigation.navigate('Register')}
                style={{ height: 'auto', paddingVertical: 2, paddingHorizontal: 4, borderWidth: 0 }}
                textStyle={{ color: primaryColor, fontWeight: '800' }}
              />
            </Animated.View>

            {/* Skip Login */}
            <Animated.View entering={FadeInDown.delay(600)} style={{ marginTop: 24, alignItems: 'center' }}>
              <EliteButton
                title="Skip & Browse as Guest"
                variant="outline"
                onPress={async () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); await guestLogin(); }}
                style={{ borderColor: theme.colors.textMuted + '30' }}
                textStyle={{ color: theme.colors.textMuted, fontWeight: '600', fontSize: 13 }}
              />
            </Animated.View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}