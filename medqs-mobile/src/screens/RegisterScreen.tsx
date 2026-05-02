import React, { useState, useEffect } from 'react';
import {
  View, Text, SafeAreaView, ScrollView,
  KeyboardAvoidingView, Platform, StatusBar, ActivityIndicator, TouchableOpacity
} from 'react-native';
import tw from 'twrnc';
import Animated, { FadeInRight, FadeOutLeft, FadeInDown } from 'react-native-reanimated';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { mobileApi } from '../lib/api';
import { storage } from '../lib/storage';
import {
  User, Mail, Lock, Eye, EyeOff,
  ChevronRight, ChevronLeft, AlertCircle,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { EliteButton } from '../components/ui/EliteButton';
import { EliteInput } from '../components/ui/EliteInput';
import { EliteSelectItem } from '../components/ui/EliteSelectItem';

export function RegisterScreen({ navigation }: any) {
  const { login } = useAuthStore();
  const { getTheme, primaryColor, isDarkMode, loadConfig } = useThemeStore();
  const theme = getTheme();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);

  // Form Data
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [universities, setUniversities] = useState<any[]>([]);
  const [uniLoading, setUniLoading] = useState(false);
  const [selectedUni, setSelectedUni] = useState<any>(null);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [facLoading, setFacLoading] = useState(false);
  const [selectedFac, setSelectedFac] = useState<any>(null);
  const [years, setYears] = useState<any[]>([]);
  const [yearLoading, setYearLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState<any>(null);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [semLoading, setSemLoading] = useState(false);
  const [selectedSem, setSelectedSem] = useState<any>(null);

  // Fetching Logic (Simplified)
  useEffect(() => {
    if (step === 1 && universities.length === 0) {
      setUniLoading(true);
      mobileApi.getUniversities().then(setUniversities).finally(() => setUniLoading(false));
    }
  }, [step]);

  useEffect(() => {
    if (selectedUni && step === 2) {
      setFacLoading(true); setFaculties([]);
      mobileApi.getFaculties(selectedUni.id).then(setFaculties).finally(() => setFacLoading(false));
    }
  }, [selectedUni, step]);

  useEffect(() => {
    if (selectedFac && step === 3) {
      setYearLoading(true); setYears([]);
      mobileApi.getAcademicYears(selectedFac.id).then(setYears).finally(() => setYearLoading(false));
    }
  }, [selectedFac, step]);

  useEffect(() => {
    if (selectedYear) {
      setSemLoading(true); setSemesters([]);
      mobileApi.getSemesters(selectedYear.id).then(setSemesters).finally(() => setSemLoading(false));
    }
  }, [selectedYear]);

  const handleNext = () => {
    setError(null);
    if (step === 0) {
      if (!name || !email || password.length < 6) return setError('يرجى إكمال البيانات بشكل صحيح');
    }
    if (step === 1 && !selectedUni) return setError('يرجى اختيار الجامعة');
    if (step === 2 && !selectedFac) return setError('يرجى اختيار الكلية');
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step < 3) setStep(step + 1);
    else handleSubmit();
  };

  const handleSubmit = async () => {
    if (!selectedSem) return setError('يرجى اختيار الترم الدراسي');
    setLoading(true);
    try {
      const result = await mobileApi.register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        universityId: selectedUni?.id,
        facultyId: selectedFac?.id,
        semesterId: selectedSem?.id,
      });
      const loginRes = await mobileApi.login({ email: email.trim().toLowerCase(), password });
      if (loginRes.token) await storage.setItem('sessionToken', loginRes.token);
      await login(loginRes.user);
      await loadConfig(loginRes.user.universityId);
    } catch (err: any) {
      setError(err?.message || 'حدث خطأ أثناء التسجيل');
    } finally {
      setLoading(false);
    }
  };

  const TITLES = ['بياناتك الأساسية', 'اختر الجامعة', 'اختر الكلية', 'المستوى الدراسي'];

  return (
    <View style={[tw`flex-1`, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      <SafeAreaView style={tw`flex-1`}>
        {/* Header */}
        <View style={tw`flex-row items-center px-6 pt-4 pb-2`}>
          <TouchableOpacity
            onPress={() => step > 0 ? setStep(step - 1) : navigation.goBack()}
            style={[tw`p-3 rounded-2xl border`, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
          >
            <ChevronLeft color={theme.colors.text} size={24} />
          </TouchableOpacity>
          <View style={tw`ml-4 flex-1`}>
            <Text style={[tw`text-2xl font-black`, { color: theme.colors.text }]}>{TITLES[step]}</Text>
            <Text style={[tw`text-xs font-bold uppercase tracking-widest`, { color: theme.colors.textMuted }]}>
              خطوة {step + 1} من 4
            </Text>
          </View>
        </View>

        {/* Step Progress Bar */}
        <View style={tw`flex-row px-6 mb-6 mt-4`}>
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={[
                tw`h-1.5 rounded-full flex-1 mx-1`,
                { backgroundColor: i <= step ? primaryColor : theme.colors.border }
              ]}
            />
          ))}
        </View>

        <ScrollView 
          contentContainerStyle={tw`px-8 pb-32`} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {error && (
            <Animated.View entering={FadeInDown} style={[tw`p-4 rounded-2xl mb-6 flex-row items-center`, { backgroundColor: theme.colors.danger + '10' }]}>
              <AlertCircle color={theme.colors.danger} size={18} style={tw`mr-2`} />
              <Text style={[tw`text-sm font-bold flex-1`, { color: theme.colors.danger }]}>{error}</Text>
            </Animated.View>
          )}

          <Animated.View key={`step-${step}`} entering={FadeInRight} exiting={FadeOutLeft}>
            {step === 0 && (
              <View>
                <EliteInput label="الاسم الكامل" value={name} onChangeText={setName} placeholder="د. أحمد حسن" icon={User} />
                <EliteInput label="البريد الإلكتروني" value={email} onChangeText={setEmail} placeholder="doctor@example.com" icon={Mail} keyboardType="email-address" />
                <EliteInput label="كلمة المرور" value={password} onChangeText={setPassword} placeholder="••••••••" icon={Lock} secureTextEntry={!showPw} rightIcon={showPw ? EyeOff : Eye} onRightIconPress={() => setShowPw(!showPw)} />
              </View>
            )}

            {step === 1 && (
              <View>
                {uniLoading ? <ActivityIndicator color={primaryColor} style={tw`my-10`} /> : universities.map(u => (
                  <EliteSelectItem key={u.id} label={u.name} selected={selectedUni?.id === u.id} onPress={() => setSelectedUni(u)} />
                ))}
              </View>
            )}

            {step === 2 && (
              <View>
                {facLoading ? <ActivityIndicator color={primaryColor} style={tw`my-10`} /> : faculties.map(f => (
                  <EliteSelectItem key={f.id} label={f.name} selected={selectedFac?.id === f.id} onPress={() => setSelectedFac(f)} />
                ))}
              </View>
            )}

            {step === 3 && (
              <View>
                <Text style={[tw`text-xs font-black mb-4 uppercase tracking-widest`, { color: theme.colors.textMuted }]}>المرحلة الأكاديمية</Text>
                {yearLoading ? <ActivityIndicator color={primaryColor} style={tw`my-4`} /> : years.map(y => (
                  <EliteSelectItem key={y.id} label={y.title || `السنة ${y.yearNumber}`} selected={selectedYear?.id === y.id} onPress={() => setSelectedYear(y)} />
                ))}

                {selectedYear && (
                  <View style={tw`mt-6`}>
                    <Text style={[tw`text-xs font-black mb-4 uppercase tracking-widest`, { color: theme.colors.textMuted }]}>الفصل الدراسي</Text>
                    {semLoading ? <ActivityIndicator color={primaryColor} style={tw`my-4`} /> : semesters.map(s => (
                      <EliteSelectItem key={s.id} label={s.title || s.name} selected={selectedSem?.id === s.id} onPress={() => setSelectedSem(s)} />
                    ))}
                  </View>
                )}
              </View>
            )}
          </Animated.View>
        </ScrollView>

        {/* Fixed Footer */}
        <View style={[tw`absolute bottom-0 left-0 right-0 px-8 pb-10 pt-4`, { backgroundColor: theme.colors.background }]}>
          <EliteButton
            title={step < 3 ? "المتابعة" : "إتمام التسجيل"}
            onPress={handleNext}
            loading={loading}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

