import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  SafeAreaView, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import tw from 'twrnc';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { mobileApi } from '../lib/api';
import { storage } from '../lib/storage';
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react-native';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://10.209.217.227:3000';

export function LoginScreen({ navigation }: any) {
  const { login } = useAuthStore();
  const { primaryColor, loadConfig } = useThemeStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      // Use NextAuth credentials endpoint
      const res = await fetch(`${API_BASE}/api/auth/callback/credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ email: email.trim().toLowerCase(), password, redirect: 'false', callbackUrl: '/' }),
        credentials: 'include',
      });

      // After credentials login, fetch user data from our mobile API
      const statsRes = await mobileApi.getUserStats();
      if (!statsRes?.user) throw new Error('Login failed');

      // Save session cookie for subsequent requests
      const cookieHeader = res.headers.get('set-cookie');
      if (cookieHeader) {
        const match = cookieHeader.match(/authjs\.session-token=([^;]+)/);
        if (match) await storage.setItem('sessionToken', match[1]);
      }

      await login(statsRes.user);
      // Load site config with user's university
      await loadConfig(statsRes.user.universityId);

    } catch (err: any) {
      setError(err?.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-[#07090F]`}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={tw`flex-1`}>
        <ScrollView contentContainerStyle={tw`flex-grow justify-center px-6 py-10`} keyboardShouldPersistTaps="handled">

          {/* Header */}
          <View style={tw`items-center mb-12`}>
            <View style={[tw`w-20 h-20 rounded-[32px] items-center justify-center mb-5`, { backgroundColor: primaryColor + '20', borderWidth: 1, borderColor: primaryColor + '40' }]}>
              <Lock color={primaryColor} size={36} />
            </View>
            <Text style={tw`text-white text-3xl font-black`}>Welcome Back 👋</Text>
            <Text style={tw`text-slate-400 mt-2 text-base`}>Login to continue your journey</Text>
          </View>

          {/* Error */}
          {error && (
            <View style={tw`flex-row items-center bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3 mb-6`}>
              <AlertCircle color="#f87171" size={18} style={tw`mr-2`} />
              <Text style={tw`text-red-400 font-bold flex-1`}>{error}</Text>
            </View>
          )}

          {/* Email */}
          <View style={tw`mb-4`}>
            <Text style={tw`text-slate-400 text-sm font-bold mb-2 uppercase tracking-widest`}>Email</Text>
            <View style={tw`flex-row items-center bg-[#0D1117] border border-[#1E2D4D] rounded-2xl px-4`}>
              <Mail color="#3B4A6B" size={18} style={tw`mr-3`} />
              <TextInput
                value={email}
                onChangeText={(t) => { setEmail(t); setError(null); }}
                placeholder="your@email.com"
                placeholderTextColor="#3B4A6B"
                keyboardType="email-address"
                autoCapitalize="none"
                style={tw`flex-1 py-4 text-white text-base`}
                accessibilityLabel="Email input"
              />
            </View>
          </View>

          {/* Password */}
          <View style={tw`mb-8`}>
            <Text style={tw`text-slate-400 text-sm font-bold mb-2 uppercase tracking-widest`}>Password</Text>
            <View style={tw`flex-row items-center bg-[#0D1117] border border-[#1E2D4D] rounded-2xl px-4`}>
              <Lock color="#3B4A6B" size={18} style={tw`mr-3`} />
              <TextInput
                value={password}
                onChangeText={(t) => { setPassword(t); setError(null); }}
                placeholder="••••••••"
                placeholderTextColor="#3B4A6B"
                secureTextEntry={!showPw}
                style={tw`flex-1 py-4 text-white text-base`}
                accessibilityLabel="Password input"
              />
              <TouchableOpacity onPress={() => setShowPw(!showPw)} accessibilityLabel={showPw ? 'Hide password' : 'Show password'}>
                {showPw ? <EyeOff color="#3B4A6B" size={18} /> : <Eye color="#3B4A6B" size={18} />}
              </TouchableOpacity>
            </View>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            style={[tw`py-4 rounded-2xl items-center mb-5`, { backgroundColor: loading ? primaryColor + '80' : primaryColor }]}
            accessibilityLabel="Login button"
          >
            {loading
              ? <ActivityIndicator color="white" />
              : <Text style={tw`text-white font-black text-lg`}>Login</Text>
            }
          </TouchableOpacity>

          {/* Register */}
          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={tw`items-center`} accessibilityLabel="Create new account">
            <Text style={tw`text-slate-400`}>
              Don't have an account?{' '}
              <Text style={[tw`font-black`, { color: primaryColor }]}>Register now</Text>
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
