import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator, RefreshControl, StatusBar } from 'react-native';
import tw from 'twrnc';
import { useThemeStore } from '../store/useThemeStore';
import { ChevronLeft, Users, Activity, Database, Server, AlertCircle, Shield, Settings, ChevronRight } from 'lucide-react-native';
import { api } from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';
import Animated, { FadeInDown } from 'react-native-reanimated';

export function AdminDashboardScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const { getTheme, primaryColor, isDarkMode } = useThemeStore();
  const theme = getTheme();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<any>(null);

  const fetchAdminData = async () => {
    try {
      const response = await api.get<any>('/mobile/admin');
      setData(response);
    } catch (error) {
      console.warn("Failed to fetch admin data", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAdminData();
  };

  if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
    return (
      <SafeAreaView style={[tw`flex-1 items-center justify-center p-6`, { backgroundColor: theme.colors.background }]}>
        <AlertCircle color={theme.colors.danger} size={48} style={tw`mb-4`} />
        <Text style={[tw`font-bold text-xl mb-2`, { color: theme.colors.text }]}>Access Denied</Text>
        <Text style={[tw`text-center mb-6`, { color: theme.colors.textMuted }]}>You do not have permission to view the administrative dashboard.</Text>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={[tw`px-6 py-3 rounded-full`, { backgroundColor: primaryColor }]}
        >
          <Text style={tw`text-white font-bold`}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <View style={[tw`w-[48%] p-5 rounded-3xl mb-4 border shadow-sm`, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <View style={[tw`w-10 h-10 rounded-2xl items-center justify-center mb-3`, { backgroundColor: color + '15' }]}>
        <Icon color={color} size={20} />
      </View>
      <Text style={[tw`text-2xl font-black mb-0.5`, { color: theme.colors.text }]}>{value}</Text>
      <Text style={[tw`text-[10px] font-bold uppercase tracking-widest`, { color: theme.colors.textMuted }]}>{label}</Text>
    </View>
  );

  const MenuButton = ({ icon: Icon, title, subtitle, onPress }: any) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[tw`flex-row items-center p-5 rounded-3xl mb-4 border shadow-sm`, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
    >
      <View style={[tw`w-12 h-12 rounded-2xl items-center justify-center mr-4`, { backgroundColor: primaryColor + '10' }]}>
        <Icon color={primaryColor} size={24} />
      </View>
      <View style={tw`flex-1`}>
        <Text style={[tw`font-bold text-base`, { color: theme.colors.text }]}>{title}</Text>
        <Text style={[tw`text-xs`, { color: theme.colors.textMuted }]}>{subtitle}</Text>
      </View>
      <ChevronRight color={theme.colors.textMuted} size={20} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      {/* Header */}
      <View style={tw`px-6 pt-4 pb-4 flex-row items-center`}>
         <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={[tw`p-3 rounded-2xl border`, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
        >
            <ChevronLeft color={theme.colors.text} size={24} />
         </TouchableOpacity>
         <View style={tw`ml-4`}>
          <Text style={[tw`font-black text-2xl`, { color: theme.colors.text }]}>Admin Console</Text>
          <View style={tw`flex-row items-center`}>
            <Shield color={primaryColor} size={12} style={tw`mr-1`} />
            <Text style={[tw`text-[10px] font-bold uppercase tracking-widest`, { color: primaryColor }]}>Secure Management</Text>
          </View>
         </View>
      </View>

      <ScrollView 
        contentContainerStyle={tw`px-6 pb-32 pt-4`}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={tw`py-20 items-center`}>
            <ActivityIndicator size="large" color={primaryColor} />
          </View>
        ) : (
          <>
            <Animated.View entering={FadeInDown.delay(100)} style={tw`flex-row flex-wrap justify-between mb-8`}>
              <StatCard icon={Users} label="Total Users" value={data?.stats?.totalUsers || 0} color="#3b82f6" />
              <StatCard icon={Database} label="Modules" value={data?.stats?.totalModules || 0} color="#10b981" />
              <StatCard icon={Activity} label="Quizzes" value={data?.stats?.totalQuizzes || 0} color="#8b5cf6" />
              <StatCard icon={Server} label="CPU Usage" value={`${data?.systemHealth?.cpuUsage || 0}%`} color="#f59e0b" />
            </Animated.View>

            <Text style={[tw`text-xs font-black mb-4 uppercase tracking-widest ml-1`, { color: theme.colors.textMuted }]}>Management Tools</Text>
            
            <Animated.View entering={FadeInDown.delay(200)}>
              <MenuButton 
                icon={Users} 
                title="User Management" 
                subtitle="Activate accounts, change roles, & stats" 
                onPress={() => navigation.navigate('AdminUserManager')} 
              />
              <MenuButton 
                icon={Activity} 
                title="Quiz Manager" 
                subtitle="Create and monitor student assessments" 
                onPress={() => navigation.navigate('AdminQuizManager')} 
              />
              <MenuButton 
                icon={Database} 
                title="Content Studio" 
                subtitle="Manage lectures, videos, and files" 
                onPress={() => {}} 
              />
              <MenuButton 
                icon={Settings} 
                title="Platform Settings" 
                subtitle="Global configuration & features toggle" 
                onPress={() => {}} 
              />
            </Animated.View>

            <Text style={[tw`text-xs font-black mb-4 mt-4 uppercase tracking-widest ml-1`, { color: theme.colors.textMuted }]}>Server Health</Text>
            
            <Animated.View entering={FadeInDown.delay(300)} style={[tw`p-6 rounded-3xl border shadow-sm`, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
               <View style={tw`flex-row justify-between items-center mb-6`}>
                <View style={tw`flex-row items-center`}>
                  <Server color={primaryColor} size={20} style={tw`mr-2`} />
                  <Text style={[tw`font-bold`, { color: theme.colors.text }]}>API Status</Text>
                </View>
                <View style={[tw`px-3 py-1 rounded-full border`, { backgroundColor: theme.colors.success + '10', borderColor: theme.colors.success + '30' }]}>
                  <Text style={[tw`text-xs font-bold uppercase`, { color: theme.colors.success }]}>{data?.systemHealth?.status || 'Online'}</Text>
                </View>
              </View>

              <View style={tw`mb-4`}>
                <View style={tw`flex-row justify-between mb-2`}>
                  <Text style={[tw`font-medium text-sm`, { color: theme.colors.textMuted }]}>Memory Usage</Text>
                  <Text style={[tw`font-bold text-sm`, { color: theme.colors.text }]}>{data?.systemHealth?.memoryUsage || 0}%</Text>
                </View>
                <View style={[tw`h-1.5 w-full rounded-full overflow-hidden`, { backgroundColor: theme.colors.background }]}>
                   <View style={[tw`h-full rounded-full`, { width: `${data?.systemHealth?.memoryUsage || 0}%`, backgroundColor: primaryColor }]} />
                </View>
              </View>
            </Animated.View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

