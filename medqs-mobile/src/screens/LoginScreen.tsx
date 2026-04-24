import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, SafeAreaView, Image } from 'react-native';
import tw from 'twrnc';
import { useAuthStore } from '../store/useAuthStore';
import { EliteTheme } from '../constants/Theme';
import { EliteCard } from '../components/ui/EliteCard';
import { Mail, Lock, LogIn, Sparkles } from 'lucide-react-native';

import { config } from '../constants/Config';

export function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const login = useAuthStore(state => state.login);

  async function handleLogin() {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${config.API_BASE}/mobile/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      
      await login(data.user, data.token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={tw`flex-1 p-6 justify-center`}
      >
        <View style={tw`items-center mb-12`}>
           <View style={tw`w-20 h-20 bg-blue-600 rounded-[28px] items-center justify-center shadow-lg shadow-blue-200 mb-6`}>
              <Sparkles color="white" size={40} />
           </View>
           <Text style={tw`text-4xl font-extrabold text-slate-900 tracking-tight`}>MedOneX</Text>
           <Text style={tw`text-slate-400 mt-2 font-medium`}>Professional Medical Education</Text>
        </View>

        <EliteCard variant="elevated" style={tw`p-6`}>
          <Text style={tw`text-xl font-bold text-slate-900 mb-6`}>Welcome Back</Text>
          
          {error ? (
            <View style={tw`bg-red-50 p-3 rounded-xl mb-4 border border-red-100`}>
               <Text style={tw`text-red-600 text-xs font-bold text-center`}>{error}</Text>
            </View>
          ) : null}

          <View style={tw`gap-4`}>
             <View>
                <Text style={tw`text-slate-500 font-bold mb-2 text-xs uppercase`}>Email Address</Text>
                <View style={tw`flex-row items-center bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100`}>
                  <Mail color={EliteTheme.colors.textMuted} size={18} style={tw`mr-3`} />
                  <TextInput 
                    placeholder="email@example.com"
                    placeholderTextColor="#94a3af"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                    style={tw`flex-1 text-slate-900 font-medium`}
                  />
                </View>
             </View>

             <View>
                <Text style={tw`text-slate-500 font-bold mb-2 text-xs uppercase`}>Password</Text>
                <View style={tw`flex-row items-center bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100`}>
                  <Lock color={EliteTheme.colors.textMuted} size={18} style={tw`mr-3`} />
                  <TextInput 
                    placeholder="••••••••"
                    placeholderTextColor="#94a3af"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                    style={tw`flex-1 text-slate-900 font-medium`}
                  />
                </View>
             </View>

             <TouchableOpacity 
               style={[tw`p-5 rounded-3xl mt-4 items-center justify-center flex-row shadow-lg`, { backgroundColor: EliteTheme.colors.primary }]}
               onPress={handleLogin}
               disabled={loading}
             >
               {loading ? <ActivityIndicator color="white" style={tw`mr-2`} /> : <LogIn color="white" size={20} style={tw`mr-2`} />}
               <Text style={tw`text-white font-bold text-lg`}>Sign In</Text>
             </TouchableOpacity>
          </View>
        </EliteCard>

        <View style={tw`flex-row justify-center mt-10`}>
          <Text style={tw`text-slate-400 font-medium`}>New to MedOneX? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={[tw`font-bold`, { color: EliteTheme.colors.primary }]}>Create Account</Text>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
