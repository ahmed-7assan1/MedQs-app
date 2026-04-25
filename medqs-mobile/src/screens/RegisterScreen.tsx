import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, SafeAreaView,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, FlatList,
} from 'react-native';
import tw from 'twrnc';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { mobileApi } from '../lib/api';
import { storage } from '../lib/storage';
import {
  User, Mail, Lock, Eye, EyeOff,
  Building2, BookOpen, ChevronRight, ChevronLeft, AlertCircle, CheckCircle2,
} from 'lucide-react-native';

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ h = 56, mb = 3 }: { h?: number; mb?: number }) {
  return <View style={[tw`bg-[#1E2D4D] rounded-2xl w-full`, { height: h, marginBottom: mb * 4 }]} />;
}

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepDots({ current, total, color }: { current: number; total: number; color: string }) {
  return (
    <View style={tw`flex-row justify-center mb-10`}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            tw`h-2 rounded-full mx-1`,
            { width: i === current ? 24 : 8, backgroundColor: i <= current ? color : '#1E2D4D' },
          ]}
        />
      ))}
    </View>
  );
}

// ─── Selectable list item ─────────────────────────────────────────────────────
function SelectItem({ label, selected, onPress, color }: { label: string; selected: boolean; onPress: () => void; color: string }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityLabel={label}
      style={[
        tw`flex-row items-center justify-between px-5 py-4 rounded-2xl mb-3 border`,
        selected
          ? { backgroundColor: color + '15', borderColor: color + '60' }
          : { backgroundColor: '#0D1117', borderColor: '#1E2D4D' },
      ]}
    >
      <Text style={[tw`font-bold text-base`, { color: selected ? color : '#8899BB' }]}>{label}</Text>
      {selected && <CheckCircle2 color={color} size={20} />}
    </TouchableOpacity>
  );
}

// ─── Main RegisterScreen ──────────────────────────────────────────────────────
export function RegisterScreen({ navigation }: any) {
  const { login } = useAuthStore();
  const { primaryColor, loadConfig } = useThemeStore();

  const [step, setStep] = useState(0); // 0..3
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);

  // Step 0 — credentials
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Step 1 — university
  const [universities, setUniversities] = useState<any[]>([]);
  const [uniLoading, setUniLoading] = useState(false);
  const [selectedUni, setSelectedUni] = useState<any>(null);

  // Step 2 — faculty
  const [faculties, setFaculties] = useState<any[]>([]);
  const [facLoading, setFacLoading] = useState(false);
  const [selectedFac, setSelectedFac] = useState<any>(null);

  // Step 3 — year + semester
  const [years, setYears] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [yearLoading, setYearLoading] = useState(false);
  const [semLoading, setSemLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState<any>(null);
  const [selectedSem, setSelectedSem] = useState<any>(null);

  // Fetch universities when entering step 1
  useEffect(() => {
    if (step === 1 && universities.length === 0) {
      setUniLoading(true);
      mobileApi.getUniversities()
        .then((data) => setUniversities(data || []))
        .catch(() => setError('Failed to load universities. Please try again.'))
        .finally(() => setUniLoading(false));
    }
  }, [step]);

  // Fetch faculties when university selected
  useEffect(() => {
    if (selectedUni && step === 2) {
      setFacLoading(true); setFaculties([]);
      mobileApi.getFaculties(selectedUni.id)
        .then((data) => setFaculties(data || []))
        .catch(() => setError('Failed to load faculties.'))
        .finally(() => setFacLoading(false));
    }
  }, [selectedUni, step]);

  // Fetch academic years when entering step 3
  useEffect(() => {
    if (selectedFac && step === 3) {
      setYearLoading(true); setYears([]);
      mobileApi.getAcademicYears(selectedFac.id)
        .then((data) => setYears(data || []))
        .catch(() => setError('Failed to load academic years.'))
        .finally(() => setYearLoading(false));
    }
  }, [selectedFac, step]);

  // Fetch semesters when year selected
  useEffect(() => {
    if (selectedYear) {
      setSemLoading(true); setSemesters([]);
      mobileApi.getSemesters(selectedYear.id)
        .then((data) => setSemesters(data || []))
        .catch(() => setError('Failed to load semesters.'))
        .finally(() => setSemLoading(false));
    }
  }, [selectedYear]);

  const validateStep0 = () => {
    if (!name.trim()) return setError('Enter your full name'), false;
    if (!email.trim() || !email.includes('@')) return setError('Invalid email'), false;
    if (password.length < 6) return setError('Password must be at least 6 characters'), false;
    return true;
  };

  const handleNext = () => {
    setError(null);
    if (step === 0 && !validateStep0()) return;
    if (step === 1 && !selectedUni) return setError('Please select a university');
    if (step === 2 && !selectedFac) return setError('Please select a faculty');
    if (step < 3) setStep(step + 1);
    else handleSubmit();
  };

  const handleSubmit = async () => {
    if (!selectedSem) return setError('Please select a semester');
    setLoading(true); setError(null);
    try {
      const result = await mobileApi.register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        universityId: selectedUni?.id,
        facultyId: selectedFac?.id,
        semesterId: selectedSem?.id,
      });

      if (!result?.user) throw new Error('Registration failed');

      // Auto login after register
      const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://10.209.217.227:3000';
      const res = await fetch(`${API_BASE}/api/auth/callback/credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ email: email.trim().toLowerCase(), password, redirect: 'false', callbackUrl: '/' }),
        credentials: 'include',
      });
      const cookieHeader = res.headers.get('set-cookie');
      if (cookieHeader) {
        const match = cookieHeader.match(/authjs\.session-token=([^;]+)/);
        if (match) await storage.setItem('sessionToken', match[1]);
      }

      await login(result.user);
      await loadConfig(result.user.universityId);
    } catch (err: any) {
      setError(err?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const TITLES = ['Create Account', 'Select University', 'Select Faculty', 'Select Year & Semester'];

  return (
    <SafeAreaView style={tw`flex-1 bg-[#07090F]`}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={tw`flex-1`}>
        {/* Top bar */}
        <View style={tw`flex-row items-center px-6 pt-6 pb-2`}>
          <TouchableOpacity
            onPress={() => step > 0 ? setStep(step - 1) : navigation.goBack()}
            style={tw`p-2 bg-white/5 rounded-full border border-white/10 mr-4`}
            accessibilityLabel="Back"
          >
            <ChevronLeft color="white" size={22} />
          </TouchableOpacity>
          <View style={tw`flex-1`}>
            <Text style={tw`text-white font-black text-xl`}>{TITLES[step]}</Text>
            <Text style={tw`text-slate-500 text-xs`}>Step {step + 1} of 4</Text>
          </View>
        </View>

        <StepDots current={step} total={4} color={primaryColor} />

        {/* Error banner */}
        {error && (
          <View style={tw`mx-6 mb-4 flex-row items-center bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3`}>
            <AlertCircle color="#f87171" size={16} style={tw`mr-2`} />
            <Text style={tw`text-red-400 font-bold flex-1 text-sm`}>{error}</Text>
            <TouchableOpacity onPress={() => setError(null)}><Text style={tw`text-red-400`}>✕</Text></TouchableOpacity>
          </View>
        )}

        <ScrollView contentContainerStyle={tw`px-6 pb-10`} keyboardShouldPersistTaps="handled">

          {/* ── STEP 0: Credentials ── */}
          {step === 0 && (
            <View>
              <View style={tw`mb-4`}>
                <Text style={tw`text-slate-400 text-xs font-bold mb-2 uppercase tracking-widest`}>Full Name</Text>
                <View style={tw`flex-row items-center bg-[#0D1117] border border-[#1E2D4D] rounded-2xl px-4`}>
                  <User color="#3B4A6B" size={18} style={tw`mr-3`} />
                  <TextInput value={name} onChangeText={setName} placeholder="Dr. John Doe" placeholderTextColor="#3B4A6B" style={tw`flex-1 py-4 text-white`} accessibilityLabel="Name input" />
                </View>
              </View>
              <View style={tw`mb-4`}>
                <Text style={tw`text-slate-400 text-xs font-bold mb-2 uppercase tracking-widest`}>Email</Text>
                <View style={tw`flex-row items-center bg-[#0D1117] border border-[#1E2D4D] rounded-2xl px-4`}>
                  <Mail color="#3B4A6B" size={18} style={tw`mr-3`} />
                  <TextInput value={email} onChangeText={setEmail} placeholder="your@email.com" placeholderTextColor="#3B4A6B" keyboardType="email-address" autoCapitalize="none" style={tw`flex-1 py-4 text-white`} accessibilityLabel="Email input" />
                </View>
              </View>
              <View style={tw`mb-8`}>
                <Text style={tw`text-slate-400 text-xs font-bold mb-2 uppercase tracking-widest`}>Password</Text>
                <View style={tw`flex-row items-center bg-[#0D1117] border border-[#1E2D4D] rounded-2xl px-4`}>
                  <Lock color="#3B4A6B" size={18} style={tw`mr-3`} />
                  <TextInput value={password} onChangeText={setPassword} placeholder="At least 6 characters" placeholderTextColor="#3B4A6B" secureTextEntry={!showPw} style={tw`flex-1 py-4 text-white`} accessibilityLabel="Password input" />
                  <TouchableOpacity onPress={() => setShowPw(!showPw)} accessibilityLabel="Show/Hide password">
                    {showPw ? <EyeOff color="#3B4A6B" size={18} /> : <Eye color="#3B4A6B" size={18} />}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* ── STEP 1: University ── */}
          {step === 1 && (
            <View>
              {uniLoading
                ? [1,2,3,4].map(i => <Skeleton key={i} />)
                : universities.length === 0
                  ? (
                    <View style={tw`items-center py-10`}>
                      <Text style={tw`text-slate-400 mb-4`}>No universities available</Text>
                      <TouchableOpacity onPress={() => { setUniLoading(true); mobileApi.getUniversities().then(setUniversities).catch(() => setError('Failed to load')).finally(() => setUniLoading(false)); }} style={[tw`px-6 py-3 rounded-2xl`, { backgroundColor: primaryColor }]}>
                        <Text style={tw`text-white font-bold`}>Try Again</Text>
                      </TouchableOpacity>
                    </View>
                  )
                  : universities.map((u) => (
                    <SelectItem key={u.id} label={u.name} selected={selectedUni?.id === u.id} onPress={() => { setSelectedUni(u); setSelectedFac(null); setSelectedYear(null); setSelectedSem(null); }} color={primaryColor} />
                  ))
              }
            </View>
          )}

          {/* ── STEP 2: Faculty ── */}
          {step === 2 && (
            <View>
              {facLoading
                ? [1,2,3].map(i => <Skeleton key={i} />)
                : faculties.length === 0
                  ? (
                    <View style={tw`items-center py-10`}>
                      <Text style={tw`text-slate-400 mb-4`}>No faculties available for this university</Text>
                      <TouchableOpacity onPress={() => { setFacLoading(true); mobileApi.getFaculties(selectedUni.id).then(setFaculties).finally(() => setFacLoading(false)); }} style={[tw`px-6 py-3 rounded-2xl`, { backgroundColor: primaryColor }]}>
                        <Text style={tw`text-white font-bold`}>Try Again</Text>
                      </TouchableOpacity>
                    </View>
                  )
                  : faculties.map((f) => (
                    <SelectItem key={f.id} label={f.name} selected={selectedFac?.id === f.id} onPress={() => { setSelectedFac(f); setSelectedYear(null); setSelectedSem(null); }} color={primaryColor} />
                  ))
              }
            </View>
          )}

          {/* ── STEP 3: Year + Semester ── */}
          {step === 3 && (
            <View>
              <Text style={tw`text-slate-400 font-bold text-sm uppercase tracking-widest mb-4`}>Academic Year</Text>
              {yearLoading
                ? [1,2,3].map(i => <Skeleton key={i} />)
                : years.map((y) => (
                  <SelectItem key={y.id} label={y.title || `Year ${y.yearNumber}`} selected={selectedYear?.id === y.id} onPress={() => { setSelectedYear(y); setSelectedSem(null); }} color={primaryColor} />
                ))
              }

              {selectedYear && (
                <>
                  <Text style={tw`text-slate-400 font-bold text-sm uppercase tracking-widest mb-4 mt-6`}>Semester</Text>
                  {semLoading
                    ? [1,2].map(i => <Skeleton key={i} />)
                    : semesters.map((s) => (
                      <SelectItem key={s.id} label={s.title || s.name} selected={selectedSem?.id === s.id} onPress={() => setSelectedSem(s)} color={primaryColor} />
                    ))
                  }
                </>
              )}
            </View>
          )}

        </ScrollView>

        {/* Bottom CTA */}
        <View style={tw`px-6 pb-8`}>
          <TouchableOpacity
            onPress={handleNext}
            disabled={loading}
            style={[tw`py-4 rounded-2xl items-center flex-row justify-center`, { backgroundColor: loading ? primaryColor + '80' : primaryColor }]}
            accessibilityLabel={step < 3 ? 'Next' : 'Create Account'}
          >
            {loading
              ? <ActivityIndicator color="white" />
              : <>
                  <Text style={tw`text-white font-black text-lg ml-2`}>{step < 3 ? 'Next' : 'Create Account 🎉'}</Text>
                  {step < 3 && <ChevronRight color="white" size={20} />}
                </>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={tw`items-center mt-5`} accessibilityLabel="Login">
            <Text style={tw`text-slate-400`}>
              Already have an account?{' '}
              <Text style={[tw`font-black`, { color: primaryColor }]}>Login</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
