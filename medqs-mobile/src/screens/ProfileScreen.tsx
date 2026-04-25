import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, SafeAreaView, Switch } from 'react-native';
import tw from 'twrnc';
import { useAuthStore } from '../store/useAuthStore';
import { EliteTheme } from '../constants/Theme';
import { EliteCard } from '../components/ui/EliteCard';
import { 
  Settings, LogOut, Shield, Bell, 
  HelpCircle, ChevronRight, BookOpen, 
  Award, Clock, User as UserIcon, Download,
  Activity
} from 'lucide-react-native';

export function ProfileScreen({ navigation }: any) {
  const { user, logout } = useAuthStore();
  const [pushEnabled, setPushEnabled] = useState(true);

  const stats = [
    { label: 'Courses', value: '12', icon: BookOpen, color: '#3b82f6' },
    { label: 'Rank', value: '#4', icon: Award, color: '#f59e0b' },
    { label: 'Hours', value: '42', icon: Clock, color: '#10b981' },
  ];

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  return (
    <SafeAreaView style={tw`flex-1 bg-[${EliteTheme.colors.background}]`}>
      <ScrollView contentContainerStyle={tw`pb-32 px-6 pt-10`}>
        {/* Header */}
        <View style={tw`flex-row justify-between items-center mb-8`}>
          <Text style={tw`text-2xl font-bold text-white`}>My Profile</Text>
          <TouchableOpacity style={tw`p-2 bg-white/5 rounded-full border border-white/10`}>
             <Settings color="white" size={22} />
          </TouchableOpacity>
        </View>

        {/* Profile Info */}
        <View style={tw`items-center mb-10`}>
           <View style={tw`relative`}>
             <View style={tw`w-28 h-28 rounded-[40px] bg-slate-800 border-4 border-slate-700 overflow-hidden shadow-xl`}>
                <Image 
                  source={{ uri: user?.image || 'https://ui-avatars.com/api/?name=' + (user?.name || 'Doctor') + '&size=200&background=0D8ABC&color=fff' }} 
                  style={tw`w-full h-full`}
                />
             </View>
             <View style={tw`absolute bottom-0 right-0 w-8 h-8 bg-[${EliteTheme.colors.primary}] rounded-full border-4 border-slate-800 items-center justify-center`}>
                <Award color="white" size={12} />
             </View>
           </View>
           
           <Text style={tw`text-2xl font-bold text-white mt-6`}>{user?.name}</Text>
           <Text style={tw`text-slate-400 font-medium`}>{user?.email}</Text>
           
           <View style={tw`mt-2 px-4 py-1.5 bg-[${EliteTheme.colors.primary}]/20 rounded-full border border-[${EliteTheme.colors.primary}]/30`}>
              <Text style={tw`text-[${EliteTheme.colors.primaryLight}] text-xs font-bold`}>{user?.role || 'Medical Student'}</Text>
           </View>
        </View>

        {/* Stats Grid */}
        <View style={tw`flex-row justify-between mb-10`}>
          {stats.map((stat, idx) => (
            <View key={idx} style={tw`items-center flex-1`}>
               <View style={[tw`w-12 h-12 rounded-2xl items-center justify-center mb-2`, { backgroundColor: stat.color + '20' }]}>
                  <stat.icon color={stat.color} size={22} />
               </View>
               <Text style={tw`text-white font-bold text-lg`}>{stat.value}</Text>
               <Text style={tw`text-slate-400 text-xs font-medium`}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Admin Section */}
        {isAdmin && (
          <>
            <Text style={tw`text-xs font-bold text-[${EliteTheme.colors.primaryLight}] uppercase tracking-widest mb-4`}>Administration</Text>
            <EliteCard variant="glass" style={tw`p-0 overflow-hidden mb-8 border border-[${EliteTheme.colors.primary}]/30`}>
               <TouchableOpacity onPress={() => navigation.navigate('AdminDashboard')} style={tw`flex-row items-center p-4 bg-[${EliteTheme.colors.primaryDark}]/20`}>
                  <View style={tw`w-10 h-10 bg-[${EliteTheme.colors.primary}]/20 rounded-xl items-center justify-center mr-4 border border-[${EliteTheme.colors.primary}]/40`}>
                     <Activity color={EliteTheme.colors.primaryLight} size={20} />
                  </View>
                  <Text style={tw`flex-1 text-white font-bold`}>Admin Dashboard</Text>
                  <ChevronRight color={EliteTheme.colors.primaryLight} size={20} />
               </TouchableOpacity>
            </EliteCard>
          </>
        )}

        {/* Menu Sections */}
        <Text style={tw`text-xs font-bold text-slate-500 uppercase tracking-widest mb-4`}>Account Settings</Text>
        
        <EliteCard variant="glass" style={tw`p-0 overflow-hidden mb-8`}>
           <TouchableOpacity style={tw`flex-row items-center p-4 border-b border-white/5`}>
              <View style={tw`w-10 h-10 bg-white/5 rounded-xl items-center justify-center mr-4 border border-white/10`}>
                 <UserIcon color="white" size={20} />
              </View>
              <Text style={tw`flex-1 text-white font-bold`}>Personal Information</Text>
              <ChevronRight color="#475569" size={20} />
           </TouchableOpacity>

           <TouchableOpacity style={tw`flex-row items-center p-4 border-b border-white/5`}>
              <View style={tw`w-10 h-10 bg-white/5 rounded-xl items-center justify-center mr-4 border border-white/10`}>
                 <Download color="white" size={20} />
              </View>
              <Text style={tw`flex-1 text-white font-bold`}>My Downloads (Offline)</Text>
              <ChevronRight color="#475569" size={20} />
           </TouchableOpacity>

           <View style={tw`flex-row items-center p-4 border-b border-white/5`}>
              <View style={tw`w-10 h-10 bg-white/5 rounded-xl items-center justify-center mr-4 border border-white/10`}>
                 <Bell color="white" size={20} />
              </View>
              <Text style={tw`flex-1 text-white font-bold`}>Push Notifications</Text>
              <Switch 
                value={pushEnabled} 
                onValueChange={setPushEnabled}
                trackColor={{ false: '#334155', true: EliteTheme.colors.primary }}
                thumbColor={'#fff'}
              />
           </View>

           <TouchableOpacity style={tw`flex-row items-center p-4`}>
              <View style={tw`w-10 h-10 bg-white/5 rounded-xl items-center justify-center mr-4 border border-white/10`}>
                 <Shield color="white" size={20} />
              </View>
              <Text style={tw`flex-1 text-white font-bold`}>Privacy & Security</Text>
              <ChevronRight color="#475569" size={20} />
           </TouchableOpacity>
        </EliteCard>

        <Text style={tw`text-xs font-bold text-slate-500 uppercase tracking-widest mb-4`}>Support</Text>
        
        <EliteCard variant="glass" style={tw`p-0 overflow-hidden mb-10`}>
           <TouchableOpacity style={tw`flex-row items-center p-4 border-b border-white/5`}>
              <View style={tw`w-10 h-10 bg-white/5 rounded-xl items-center justify-center mr-4 border border-white/10`}>
                 <HelpCircle color="white" size={20} />
              </View>
              <Text style={tw`flex-1 text-white font-bold`}>Help Center</Text>
              <ChevronRight color="#475569" size={20} />
           </TouchableOpacity>

           <TouchableOpacity onPress={logout} style={tw`flex-row items-center p-4`}>
              <View style={tw`w-10 h-10 bg-red-500/20 rounded-xl items-center justify-center mr-4 border border-red-500/30`}>
                 <LogOut color="#f87171" size={20} />
              </View>
              <Text style={tw`flex-1 text-red-400 font-bold`}>Sign Out</Text>
              <ChevronRight color="#7f1d1d" size={20} />
           </TouchableOpacity>
        </EliteCard>

      </ScrollView>
    </SafeAreaView>
  );
}
