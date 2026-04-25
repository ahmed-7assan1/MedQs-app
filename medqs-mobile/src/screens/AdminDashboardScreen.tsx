import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator, RefreshControl } from 'react-native';
import tw from 'twrnc';
import { EliteTheme } from '../constants/Theme';
import { EliteCard } from '../components/ui/EliteCard';
import { ChevronLeft, Users, Activity, Database, Server, AlertCircle } from 'lucide-react-native';
import { api } from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';

export function AdminDashboardScreen({ navigation }: any) {
  const { user } = useAuthStore();
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
      <SafeAreaView style={tw`flex-1 bg-[${EliteTheme.colors.background}] items-center justify-center p-6`}>
        <AlertCircle color="#ef4444" size={48} style={tw`mb-4`} />
        <Text style={tw`text-white font-bold text-xl mb-2`}>Access Denied</Text>
        <Text style={tw`text-slate-400 text-center mb-6`}>You do not have permission to view the administrative dashboard.</Text>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={tw`bg-[${EliteTheme.colors.primary}] px-6 py-3 rounded-full`}
        >
          <Text style={tw`text-white font-bold`}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={tw`flex-1 bg-[${EliteTheme.colors.background}]`}>
      {/* Header */}
      <View style={tw`px-6 pt-6 pb-4 flex-row justify-between items-center`}>
         <TouchableOpacity onPress={() => navigation.goBack()} style={tw`p-2 bg-white/5 rounded-full border border-white/10`}>
            <ChevronLeft color="white" size={24} />
         </TouchableOpacity>
         <Text style={tw`text-white font-bold text-lg`}>Admin Console</Text>
         <View style={tw`w-10`} />
      </View>

      <ScrollView 
        contentContainerStyle={tw`p-6 pb-32`}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={EliteTheme.colors.primaryLight} />}
      >
        {loading ? (
          <View style={tw`py-20 items-center`}>
            <ActivityIndicator size="large" color={EliteTheme.colors.primaryLight} />
          </View>
        ) : data ? (
          <>
            <Text style={tw`text-xl font-bold text-white mb-6`}>System Overview</Text>
            
            <View style={tw`flex-row flex-wrap justify-between mb-8`}>
              <EliteCard variant="glass" style={tw`w-[48%] p-4 mb-4 items-center`}>
                <View style={tw`w-12 h-12 bg-blue-500/20 rounded-full items-center justify-center mb-3 border border-blue-500/30`}>
                  <Users color="#3b82f6" size={24} />
                </View>
                <Text style={tw`text-2xl font-bold text-white mb-1`}>{data.stats.totalUsers}</Text>
                <Text style={tw`text-slate-400 text-xs font-bold uppercase`}>Total Users</Text>
              </EliteCard>
              
              <EliteCard variant="glass" style={tw`w-[48%] p-4 mb-4 items-center`}>
                <View style={tw`w-12 h-12 bg-green-500/20 rounded-full items-center justify-center mb-3 border border-green-500/30`}>
                  <Database color="#22c55e" size={24} />
                </View>
                <Text style={tw`text-2xl font-bold text-white mb-1`}>{data.stats.totalModules}</Text>
                <Text style={tw`text-slate-400 text-xs font-bold uppercase`}>Modules</Text>
              </EliteCard>

              <EliteCard variant="glass" style={tw`w-full p-4 items-center flex-row`}>
                <View style={tw`w-12 h-12 bg-purple-500/20 rounded-full items-center justify-center mr-4 border border-purple-500/30`}>
                  <Activity color="#a855f7" size={24} />
                </View>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-2xl font-bold text-white mb-1`}>{data.stats.totalQuizzes}</Text>
                  <Text style={tw`text-slate-400 text-xs font-bold uppercase`}>Total Quizzes Generated</Text>
                </View>
              </EliteCard>
            </View>

            <Text style={tw`text-xl font-bold text-white mb-4`}>Server Health</Text>
            <EliteCard variant="glass" style={tw`p-5 mb-8`}>
              <View style={tw`flex-row justify-between items-center mb-6`}>
                <View style={tw`flex-row items-center`}>
                  <Server color={EliteTheme.colors.primaryLight} size={20} style={tw`mr-2`} />
                  <Text style={tw`text-white font-bold`}>API Status</Text>
                </View>
                <View style={tw`bg-green-500/20 px-3 py-1 rounded-full border border-green-500/30`}>
                  <Text style={tw`text-green-400 text-xs font-bold uppercase`}>{data.systemHealth.status}</Text>
                </View>
              </View>

              <View style={tw`mb-4`}>
                <View style={tw`flex-row justify-between mb-2`}>
                  <Text style={tw`text-slate-400 font-medium text-sm`}>CPU Usage</Text>
                  <Text style={tw`text-white font-bold text-sm`}>{data.systemHealth.cpuUsage}%</Text>
                </View>
                <View style={tw`h-2 w-full bg-slate-800 rounded-full overflow-hidden`}>
                   <View style={[tw`h-full bg-blue-500`, { width: `${data.systemHealth.cpuUsage}%` }]} />
                </View>
              </View>

              <View>
                <View style={tw`flex-row justify-between mb-2`}>
                  <Text style={tw`text-slate-400 font-medium text-sm`}>Memory</Text>
                  <Text style={tw`text-white font-bold text-sm`}>{data.systemHealth.memoryUsage}%</Text>
                </View>
                <View style={tw`h-2 w-full bg-slate-800 rounded-full overflow-hidden`}>
                   <View style={[tw`h-full bg-purple-500`, { width: `${data.systemHealth.memoryUsage}%` }]} />
                </View>
              </View>
            </EliteCard>

          </>
        ) : (
          <View style={tw`items-center py-10`}>
            <Text style={tw`text-slate-400`}>Failed to load data.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
