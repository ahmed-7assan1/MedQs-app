import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, SafeAreaView } from 'react-native';
import tw from 'twrnc';
import { useAuthStore } from '../store/useAuthStore';
import { EliteTheme } from '../constants/Theme';
import { EliteCard } from '../components/ui/EliteCard';
import { 
  Search, Bell, MapPin, ChevronRight, 
  Stethoscope, Brain, Heart, Activity, 
  Eye, Droplet 
} from 'lucide-react-native';

import { Skeleton } from '../components/ui/Skeleton';

export function HomeScreen() {
  const { user } = useAuthStore();
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const categories = [
    { name: 'Anatomy', icon: Stethoscope, color: '#f8fafc', iconColor: '#3b82f6' },
    { name: 'Physiology', icon: Heart, color: '#fef2f2', iconColor: '#ef4444' },
    { name: 'Neurology', icon: Brain, color: '#f5f3ff', iconColor: '#8b5cf6' },
    { name: 'Pathology', icon: Activity, color: '#ecfdf5', iconColor: '#10b981' },
    { name: 'Surgery', icon: Droplet, color: '#fffbeb', iconColor: '#f59e0b' },
    { name: 'More', icon: ChevronRight, color: '#f1f5f9', iconColor: '#64748b' },
  ];

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <ScrollView contentContainerStyle={tw`pb-32 px-6 pt-10`}>
        {/* Header Section */}
        <View style={tw`flex-row justify-between items-center mb-6`}>
          <View>
             <Text style={tw`text-slate-900 text-2xl font-bold`}>Hello, {user?.name?.split(' ')[0] || 'Doctor'}</Text>
             <View style={tw`flex-row items-center mt-1`}>
                <MapPin color={EliteTheme.colors.primary} size={14} />
                <Text style={tw`text-slate-400 text-xs ml-1 font-medium`}>{user?.university?.name || 'MedQs Platform'}</Text>
             </View>
          </View>
          <View style={tw`flex-row space-x-3 items-center`}>
            <TouchableOpacity style={tw`p-2 bg-slate-50 rounded-full border border-slate-100`}>
              <Bell color={EliteTheme.colors.text} size={20} />
            </TouchableOpacity>
            <View style={tw`w-10 h-10 rounded-full bg-slate-200 border-2 border-slate-50 overflow-hidden`}>
               <Image 
                 source={{ uri: user?.image || 'https://ui-avatars.com/api/?name=' + (user?.name || 'Doctor') }} 
                 style={tw`w-full h-full`}
               />
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <View style={tw`flex-row items-center bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 mb-8`}>
           <Search color="#94a3b8" size={20} style={tw`mr-3`} />
           <TextInput 
             placeholder="Search for subjects or MCQs"
             placeholderTextColor="#94a3b8"
             style={tw`flex-1 text-slate-900 font-medium`}
           />
        </View>

        {/* Category Grid */}
        {loading ? (
          <View style={tw`flex-row flex-wrap justify-between mb-8`}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <View key={i} style={tw`w-[30%] items-center mb-6`}>
                 <Skeleton width={64} height={64} borderRadius={24} style={tw`mb-2`} />
                 <Skeleton width={40} height={12} />
              </View>
            ))}
          </View>
        ) : (
          <View style={tw`flex-row flex-wrap justify-between mb-8`}>
            {categories.map((cat, idx) => (
              <TouchableOpacity key={idx} style={tw`w-[30%] items-center mb-6`}>
                 <View style={[tw`w-16 h-16 rounded-3xl items-center justify-center mb-2`, { backgroundColor: cat.color }]}>
                    <cat.icon color={cat.iconColor} size={26} />
                 </View>
                 <Text style={tw`text-slate-600 text-xs font-bold`}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Hero Card */}
        {loading ? (
          <Skeleton height={100} borderRadius={32} style={tw`mb-8`} />
        ) : (
          <EliteCard style={tw`bg-[#10b981] p-0 overflow-hidden mb-8 shadow-lg shadow-emerald-200`}>
            <View style={tw`flex-row p-5`}>
               <View style={tw`bg-white/20 p-3 rounded-2xl items-center justify-center mr-4 w-16 h-20`}>
                 <Text style={tw`text-white font-bold text-xs uppercase`}>Mon</Text>
                 <Text style={tw`text-white font-bold text-2xl`}>21</Text>
                 <Text style={tw`text-white font-bold text-xs`}>Jan</Text>
               </View>
               <View style={tw`flex-1 justify-center`}>
                  <Text style={tw`text-white/80 text-xs font-bold uppercase tracking-widest`}>Next Session</Text>
                  <Text style={tw`text-white text-xl font-bold`}>Clinical Cardiology</Text>
                  <Text style={tw`text-white/70 text-xs mt-1 font-medium`}>Specialized Lecture • 12:15 PM</Text>
               </View>
            </View>
          </EliteCard>
        )}

        {/* List Section: Recommended */}
        <View style={tw`flex-row justify-between items-center mb-4`}>
           <Text style={tw`text-xl font-bold text-slate-900`}>Recommended</Text>
           <TouchableOpacity>
              <Text style={[tw`font-bold text-sm`, { color: EliteTheme.colors.primary }]}>See All</Text>
           </TouchableOpacity>
        </View>

        <EliteCard style={tw`flex-row items-center p-4`}>
          <Image 
            source={{ uri: 'https://ui-avatars.com/api/?name=Dr+Ahmed&background=3b82f6&color=fff' }}
            style={tw`w-14 h-14 rounded-2xl mr-4`}
          />
          <View style={tw`flex-1`}>
             <Text style={tw`text-slate-900 font-bold text-lg`}>Dr. Ahmed Hassan</Text>
             <Text style={tw`text-slate-400 text-xs font-medium`}>Cardiologist • Professor</Text>
             <View style={tw`flex-row items-center mt-2`}>
                <View style={tw`bg-emerald-50 px-2 py-0.5 rounded-full`}>
                   <Text style={tw`text-emerald-600 text-[10px] font-bold`}>Verified</Text>
                </View>
                <Text style={tw`text-slate-300 mx-2`}>•</Text>
                <Text style={tw`text-slate-500 text-[10px] font-bold`}>1,2k reviews</Text>
             </View>
          </View>
          <TouchableOpacity style={tw`p-2`}>
             <ChevronRight color="#cbd5e1" size={24} />
          </TouchableOpacity>
        </EliteCard>

      </ScrollView>
    </SafeAreaView>
  );
}
