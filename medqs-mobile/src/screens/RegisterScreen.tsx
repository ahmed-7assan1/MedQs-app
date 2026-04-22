import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import tw from 'twrnc';
import { EliteTheme } from '../constants/Theme';
import { EliteCard } from '../components/ui/EliteCard';
import { 
  Building2, Calendar, BookOpen, ChevronRight, 
  CheckCircle2, User, Phone, FileText, ArrowLeft, 
  Sparkles, GraduationCap, Mail, Lock
} from 'lucide-react-native';

import { config } from '../constants/Config';

const API_BASE = config.API_BASE;

export function RegisterScreen({ navigation }: any) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Data for selections
  const [universities, setUniversities] = useState<any[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    universityId: '',
    facultyId: '',
    yearNumber: 1,
    semesterId: '',
    nickname: '',
    studentId: '',
    bio: '',
    phone: ''
  });

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  // Fetch Universities
  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/universities`)
      .then(res => res.json())
      .then(data => setUniversities(Array.isArray(data) ? data : []))
      .catch(err => console.log('Fetch Uni Error:', err))
      .finally(() => setLoading(false));
  }, []);

  // Fetch Faculties when Uni changes
  useEffect(() => {
    if (formData.universityId) {
      fetch(`${API_BASE}/faculties?universityId=${formData.universityId}`)
        .then(res => res.json())
        .then(data => setFaculties(Array.isArray(data) ? data : []))
        .catch(err => console.log('Fetch Faculty Error:', err));
      
      // Also fetch years
      fetch(`${API_BASE}/academic-years?universityId=${formData.universityId}`)
        .then(res => res.json())
        .then(data => setYears(Array.isArray(data) ? data : []))
        .catch(err => console.log('Fetch Years Error:', err));
    }
  }, [formData.universityId]);

  // Fetch Semesters when Year changes
  useEffect(() => {
    const selectedYearObj = years.find(y => y.yearNumber === formData.yearNumber);
    if (selectedYearObj) {
      fetch(`${API_BASE}/semesters?academicYearId=${selectedYearObj.id}`)
        .then(res => res.json())
        .then(data => setSemesters(Array.isArray(data) ? data : []))
        .catch(err => console.log('Fetch Sem Error:', err));
    }
  }, [formData.yearNumber, years]);

  const handleRegister = async () => {
    if (!formData.name || !formData.email || !formData.password || !formData.nickname || !formData.studentId) {
      Alert.alert("Missing Info", "Please fill in all required fields.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      
      if (response.ok) {
        Alert.alert("Success!", "Account created. You can now login.", [
          { text: "Go to Login", onPress: () => navigation.navigate('Login') }
        ]);
      } else {
        Alert.alert("Error", data.error || "Failed to register.");
      }
    } catch (error) {
      Alert.alert("System Error", "Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={tw`flex-row justify-between mb-8`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View 
          key={i} 
          style={[
            tw`h-1.5 flex-1 mx-1 rounded-full`, 
            { backgroundColor: step >= i ? EliteTheme.colors.primary : '#e2e8f0' }
          ]} 
        />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={tw`flex-1`}>
        <ScrollView contentContainerStyle={tw`p-6 pt-10`}>
          <TouchableOpacity onPress={() => step > 1 ? prevStep() : navigation.goBack()} style={tw`mb-4`}>
             <ArrowLeft color={EliteTheme.colors.text} size={24} />
          </TouchableOpacity>
          
          <Text style={tw`text-slate-400 text-xs font-bold uppercase tracking-widest mb-1`}>Step {step} of 5</Text>
          <Text style={tw`text-slate-900 text-2xl font-bold mb-8`}>
            {step === 1 && "Create Account"}
            {step === 2 && "Your University"}
            {step === 3 && "Faculty Details"}
            {step === 4 && "Academic Level"}
            {step === 5 && "Profile Setup"}
          </Text>

          {renderStepIndicator()}

          {step === 1 && (
            <View style={tw`gap-4`}>
               <EliteCard>
                  <View style={tw`gap-4`}>
                    <View>
                      <Text style={tw`text-slate-500 font-bold mb-2 text-xs uppercase`}>Full Name</Text>
                      <View style={tw`flex-row items-center bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100`}>
                        <User color={EliteTheme.colors.textMuted} size={18} style={tw`mr-2`} />
                        <TextInput 
                          placeholder="Ex: Ahmed Hassan"
                          value={formData.name}
                          onChangeText={t => setFormData({...formData, name: t})}
                          style={tw`flex-1 text-slate-900 font-medium`}
                        />
                      </View>
                    </View>
                    <View>
                      <Text style={tw`text-slate-500 font-bold mb-2 text-xs uppercase`}>Email Address</Text>
                      <View style={tw`flex-row items-center bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100`}>
                        <Mail color={EliteTheme.colors.textMuted} size={18} style={tw`mr-2`} />
                        <TextInput 
                          placeholder="email@example.com"
                          keyboardType="email-address"
                          autoCapitalize="none"
                          value={formData.email}
                          onChangeText={t => setFormData({...formData, email: t})}
                          style={tw`flex-1 text-slate-900 font-medium`}
                        />
                      </View>
                    </View>
                    <View>
                      <Text style={tw`text-slate-500 font-bold mb-2 text-xs uppercase`}>Password</Text>
                      <View style={tw`flex-row items-center bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100`}>
                        <Lock color={EliteTheme.colors.textMuted} size={18} style={tw`mr-2`} />
                        <TextInput 
                          placeholder="••••••••"
                          secureTextEntry
                          value={formData.password}
                          onChangeText={t => setFormData({...formData, password: t})}
                          style={tw`flex-1 text-slate-900 font-medium`}
                        />
                      </View>
                    </View>
                  </View>
               </EliteCard>
               <TouchableOpacity onPress={nextStep} style={[tw`mt-4 p-5 rounded-3xl items-center justify-center flex-row shadow-lg`, { backgroundColor: EliteTheme.colors.primary }]}>
                  <Text style={tw`text-white font-bold text-lg`}>Next Step</Text>
                  <ChevronRight color="white" size={20} style={tw`ml-1`} />
               </TouchableOpacity>
            </View>
          )}

          {step === 2 && (
             <View style={tw`gap-4`}>
                <Text style={tw`text-slate-500 mb-4`}>Select your institution to customize your content.</Text>
                {loading ? (
                  <View style={tw`py-10 items-center`}>
                    <ActivityIndicator color={EliteTheme.colors.primary} size="large" />
                    <Text style={tw`text-slate-400 mt-4 font-medium`}>Fetching universities...</Text>
                  </View>
                ) : universities.length === 0 ? (
                  <View style={tw`py-10 items-center border border-dashed border-slate-200 rounded-[32px]`}>
                    <Building2 color="#cbd5e1" size={48} style={tw`mb-4`} />
                    <Text style={tw`text-slate-900 font-bold text-lg mb-2`}>No Universities Found</Text>
                    <Text style={tw`text-slate-400 text-center px-10 mb-6`}>We couldn't find any institutions. Please check your internet connection or try again.</Text>
                    <TouchableOpacity 
                      onPress={() => {
                        setLoading(true);
                        fetch(`${API_BASE}/universities`)
                          .then(res => res.json())
                          .then(data => setUniversities(Array.isArray(data) ? data : []))
                          .catch(err => console.log('Retry Error:', err))
                          .finally(() => setLoading(false));
                      }}
                      style={[tw`px-8 py-3 rounded-2xl`, { backgroundColor: EliteTheme.colors.primary }]}
                    >
                      <Text style={tw`text-white font-bold`}>Retry</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  universities.map(uni => (
                    <TouchableOpacity key={uni.id} onPress={() => { setFormData({...formData, universityId: uni.id}); nextStep(); }}>
                      <EliteCard variant={formData.universityId === uni.id ? 'elevated' : 'default'} style={formData.universityId === uni.id ? { borderColor: EliteTheme.colors.primary, borderWidth: 1 } : {}}>
                         <View style={tw`flex-row items-center`}>
                            <View style={tw`p-3 bg-blue-50 rounded-2xl mr-4`}><Building2 color={EliteTheme.colors.primary} size={24} /></View>
                            <Text style={tw`flex-1 font-bold text-lg`}>{uni.name}</Text>
                            <ChevronRight color="#cbd5e1" size={20} />
                         </View>
                      </EliteCard>
                    </TouchableOpacity>
                  ))
                )}
             </View>
          )}

          {step === 3 && (
             <View style={tw`gap-4`}>
                <Text style={tw`text-slate-500 mb-4`}>Select your faculty.</Text>
                {faculties.length === 0 ? (
                  <View style={tw`items-center py-10`}>
                    <Text style={tw`text-slate-400`}>No faculties found. Try another university.</Text>
                    <TouchableOpacity onPress={prevStep} style={tw`mt-4`}><Text style={{color: EliteTheme.colors.primary}}>Go Back</Text></TouchableOpacity>
                  </View>
                ) : faculties.map(fac => (
                  <TouchableOpacity key={fac.id} onPress={() => { setFormData({...formData, facultyId: fac.id}); nextStep(); }}>
                    <EliteCard variant={formData.facultyId === fac.id ? 'elevated' : 'default'}>
                       <View style={tw`flex-row items-center`}>
                          <View style={tw`p-3 bg-purple-50 rounded-2xl mr-4`}><GraduationCap color={EliteTheme.colors.secondary} size={24} /></View>
                          <Text style={tw`flex-1 font-bold text-lg`}>{fac.name}</Text>
                          <ChevronRight color="#cbd5e1" size={20} />
                       </View>
                    </EliteCard>
                  </TouchableOpacity>
                ))}
             </View>
          )}

          {step === 4 && (
             <View style={tw`gap-4`}>
                <Text style={tw`text-slate-500 mb-2`}>Which year are you in?</Text>
                <View style={tw`flex-row flex-wrap justify-between mb-6`}>
                   {[1, 2, 3, 4, 5, 6].map(num => (
                     <TouchableOpacity key={num} onPress={() => setFormData({...formData, yearNumber: num})} style={[tw`w-[30%] py-4 rounded-2xl border mb-3 items-center`, { borderColor: formData.yearNumber === num ? EliteTheme.colors.primary : '#f1f5f9', backgroundColor: formData.yearNumber === num ? '#eff6ff' : '#fff' }]}>
                        <Text style={[tw`font-bold text-lg`, { color: formData.yearNumber === num ? EliteTheme.colors.primary : '#94a3b8' }]}>Year {num}</Text>
                     </TouchableOpacity>
                   ))}
                </View>
                
                <Text style={tw`text-slate-500 mb-2`}>Choose your semester</Text>
                {semesters.map(sem => (
                  <TouchableOpacity key={sem.id} onPress={() => setFormData({...formData, semesterId: sem.id})} style={tw`mb-3`}>
                     <EliteCard variant={formData.semesterId === sem.id ? 'elevated' : 'default'} style={formData.semesterId === sem.id ? { borderColor: EliteTheme.colors.primary, borderWidth: 1 } : {}}>
                        <View style={tw`flex-row items-center`}>
                          <Calendar color={EliteTheme.colors.primary} size={20} style={tw`mr-3`} />
                          <Text style={tw`flex-1 font-bold`}>{sem.name}</Text>
                          {formData.semesterId === sem.id && <CheckCircle2 color={EliteTheme.colors.success} size={20} />}
                        </View>
                     </EliteCard>
                  </TouchableOpacity>
                ))}

                <TouchableOpacity 
                  disabled={!formData.semesterId} 
                  onPress={nextStep} 
                  style={[tw`mt-4 p-5 rounded-3xl items-center justify-center flex-row shadow-lg`, { backgroundColor: formData.semesterId ? EliteTheme.colors.primary : '#cbd5e1' }]}
                >
                  <Text style={tw`text-white font-bold text-lg`}>Continue</Text>
                  <ChevronRight color="white" size={20} style={tw`ml-1`} />
                </TouchableOpacity>
             </View>
          )}

          {step === 5 && (
            <View style={tw`gap-4`}>
               <EliteCard>
                  <View style={tw`gap-5`}>
                     <View>
                        <Text style={tw`text-slate-500 font-bold mb-2 text-xs uppercase`}>Username</Text>
                        <TextInput 
                          placeholder="Ex: doctor.ahmed"
                          value={formData.nickname}
                          onChangeText={t => setFormData({...formData, nickname: t})}
                          style={tw`bg-slate-50 p-4 rounded-2xl border border-slate-100 font-medium`}
                        />
                     </View>
                     <View>
                        <Text style={tw`text-slate-500 font-bold mb-2 text-xs uppercase`}>Student ID</Text>
                        <TextInput 
                          placeholder="Your University ID"
                          value={formData.studentId}
                          onChangeText={t => setFormData({...formData, studentId: t})}
                          style={tw`bg-slate-50 p-4 rounded-2xl border border-slate-100 font-medium`}
                        />
                     </View>
                     <View>
                        <Text style={tw`text-slate-500 font-bold mb-2 text-xs uppercase`}>Bio (Optional)</Text>
                        <TextInput 
                          placeholder="Tell us about yourself..."
                          multiline
                          numberOfLines={3}
                          value={formData.bio}
                          onChangeText={t => setFormData({...formData, bio: t})}
                          style={tw`bg-slate-50 p-4 rounded-2xl border border-slate-100 font-medium`}
                        />
                     </View>
                  </View>
               </EliteCard>

               <TouchableOpacity 
                 disabled={saving}
                 onPress={handleRegister} 
                 style={[tw`mt-6 p-5 rounded-3xl items-center justify-center flex-row shadow-xl`, { backgroundColor: EliteTheme.colors.success }]}
               >
                  {saving ? <ActivityIndicator color="white" /> : (
                    <>
                      <Sparkles color="white" size={20} style={tw`mr-2`} />
                      <Text style={tw`text-white font-bold text-lg`}>Create My Account</Text>
                    </>
                  )}
               </TouchableOpacity>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
