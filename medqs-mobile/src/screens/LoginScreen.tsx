import React, { useState } from 'react';
import {
  View, Text, SafeAreaView, ScrollView,
  KeyboardAvoidingView, Platform, StatusBar, Image
} from 'react-native';
import tw from 'twrnc';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { mobileApi } from '../lib/api';
import { storage } from '../lib/storage';
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { EliteButton } from '../components/ui/EliteButton';
import { EliteInput } from '../components/ui/EliteInput';

export function LoginScreen({ navigation }: any) {
  const { login } = useAuthStore();
  const { getTheme, primaryColor, isDarkMode, loadConfig } = useThemeStore();
  const theme = getTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('يرجى إدخال البيانات المطلوبة');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setError(null);
    setLoading(true);

    try {
      const res = await mobileApi.login({ 
        email: email.trim().toLowerCase(), 
        password 
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
      setError(err?.message || 'خطأ في الدخول. يرجى التأكد من البيانات.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[tw`flex-1`, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={tw`flex-1`}
      >
        <SafeAreaView style={tw`flex-1`}>
          <ScrollView 
            contentContainerStyle={tw`flex-grow px-8 py-12 justify-center`} 
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >

            {/* Logo Area */}
            <Animated.View 
              entering={FadeInUp.delay(200)}
              style={tw`items-center mb-16`}
            >
              <View style={[
                tw`w-24 h-24 rounded-3xl items-center justify-center mb-6`,
                { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }
              ]}>
                <Lock color={primaryColor} size={42} strokeWidth={2.5} />
              </View>
              
              <Text style={[tw`text-3xl font-black tracking-tight`, { color: theme.colors.text }]}>MedOneX</Text>
              <Text style={[tw`mt-2 text-center font-medium`, { color: theme.colors.textMuted }]}>
                مرحباً بك في منصة المستقبل الطبية
              </Text>
            </Animated.View>

            {/* Error Message */}
            {error && (
              <Animated.View 
                entering={FadeInDown}
                style={[tw`flex-row items-center p-4 rounded-2xl mb-6`, { backgroundColor: theme.colors.danger + '10' }]}
              >
                <AlertCircle color={theme.colors.danger} size={20} style={tw`mr-3`} />
                <Text style={[tw`text-sm font-bold flex-1`, { color: theme.colors.danger }]}>{error}</Text>
              </Animated.View>
            )}

            {/* Input Group */}
            <Animated.View entering={FadeInDown.delay(400)} style={tw`w-full`}>
              <EliteInput
                label="البريد الإلكتروني"
                value={email}
                onChangeText={(t) => { setEmail(t); setError(null); }}
                placeholder="doctor@example.com"
                icon={Mail}
                keyboardType="email-address"
              />

              <EliteInput
                label="كلمة المرور"
                value={password}
                onChangeText={(t) => { setPassword(t); setError(null); }}
                placeholder="••••••••"
                icon={Lock}
                secureTextEntry={!showPw}
                rightIcon={showPw ? EyeOff : Eye}
                onRightIconPress={() => setShowPw(!showPw)}
              />

              <EliteButton
                title="تسجيل الدخول"
                onPress={handleLogin}
                loading={loading}
                style={tw`mt-4`}
              />
            </Animated.View>

            {/* Bottom Links */}
            <Animated.View 
              entering={FadeInDown.delay(600)}
              style={tw`mt-12 items-center flex-row justify-center`}
            >
              <Text style={[tw`font-medium`, { color: theme.colors.textMuted }]}>ليس لديك حساب؟ </Text>
              <Animated.View>
                <EliteButton
                  title="إنشاء حساب جديد"
                  variant="outline"
                  onPress={() => navigation.navigate('Register')}
                  style={tw`h-auto py-1 px-2 border-0`}
                  textStyle={[tw`font-bold`, { color: primaryColor }]}
                />
              </Animated.View>
            </Animated.View>

          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

