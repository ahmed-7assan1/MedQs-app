import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image, SafeAreaView,
  RefreshControl, FlatList, Dimensions, ActivityIndicator, Alert, StatusBar
} from 'react-native';
import tw from 'twrnc';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { mobileApi } from '../lib/api';
import { Skeleton } from '../components/ui/Skeleton';
import {
  Bell, ChevronRight, Trophy, BookOpen,
  PlayCircle, CheckCircle2, Circle, Clock,
  ArrowUpRight, AlertCircle, LayoutDashboard, Brain
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

// ─── Sub-Components ──────────────────────────────────────────────────────────

const SectionHeader = ({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) => {
  const { primaryColor } = useThemeStore();
  return (
    <View style={tw`flex-row justify-between items-center mb-4 px-6`}>
      <Text style={tw`text-xl font-outfit-black text-white`}>{title}</Text>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={[tw`font-inter-bold text-sm`, { color: primaryColor }]}>See All</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const StatItem = ({ label, value, icon: Icon, color }: any) => (
  <View style={tw`w-[48%] bg-[#0D1117] border border-[#1E2D4D] rounded-3xl p-4 mb-4`}>
    <View style={[tw`w-10 h-10 rounded-2xl items-center justify-center mb-3`, { backgroundColor: color + '20' }]}>
      <Icon color={color} size={20} />
    </View>
    <Text style={tw`text-white text-lg font-inter-black`}>{value}</Text>
    <Text style={tw`text-slate-500 text-xs font-inter-bold uppercase tracking-widest`}>{label}</Text>
  </View>
);

// ─── Main HomeScreen ─────────────────────────────────────────────────────────

export function HomeScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const { primaryColor, primaryLight } = useThemeStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [homeData, setHomeData] = useState<any>(null);

  const fetchData = useCallback(async (isRefreshing = false) => {
    if (!isRefreshing) setLoading(true);
    setError(null);
    try {
      const data = await mobileApi.getHome();
      setHomeData(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to connect. Check your internet.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(true);
  };

  const handlePress = (target: string, params?: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate(target, params);
  };

  const toggleTask = async (taskId: string, completed: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await mobileApi.toggleTask(taskId, !completed);
      // Optimistic update
      setHomeData((prev: any) => ({
        ...prev,
        todayTasks: prev.todayTasks.map((t: any) =>
          t.id === taskId ? { ...t, completed: !completed } : t
        )
      }));
    } catch (err) {
      Alert.alert('Error', 'Failed to update task');
    }
  };

  if (error && !homeData) {
    return (
      <SafeAreaView style={tw`flex-1 bg-[#07090F] justify-center items-center px-10`}>
        <AlertCircle color="#ef4444" size={64} style={tw`mb-4`} />
        <Text style={tw`text-white text-xl font-bold text-center mb-2`}>Connection Error</Text>
        <Text style={tw`text-slate-400 text-center mb-8`}>{error}</Text>
        <TouchableOpacity
          onPress={() => fetchData()}
          style={[tw`px-10 py-4 rounded-2xl`, { backgroundColor: primaryColor }]}
        >
          <Text style={tw`text-white font-black`}>Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={tw`flex-1 bg-[#07090F]`}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`pb-32 pt-6`}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />
        }
      >
        {/* ── Header ── */}
        <View style={tw`flex-row justify-between items-center mb-8 px-6`}>
          <View>
            <Text style={tw`text-slate-400 text-sm font-inter-bold uppercase tracking-widest mb-1`}>Welcome back</Text>
            <Text style={tw`text-white text-2xl font-outfit-black`}>
              Hi, {homeData?.user?.name?.split(' ')[0] || user?.name?.split(' ')[0] || 'Doctor'} 👋
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => handlePress('Notifications')}
            style={tw`p-3 bg-[#0D1117] rounded-2xl border border-[#1E2D4D] relative`}
          >
            <Bell color="white" size={24} />
            {homeData?.unreadNotifs > 0 && (
              <View style={tw`absolute -top-1 -right-1 bg-red-500 w-5 h-5 rounded-full items-center justify-center border-2 border-[#07090F]`}>
                <Text style={tw`text-white text-[10px] font-bold`}>{homeData.unreadNotifs}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Ads Carousel ── */}
        {loading ? (
          <View style={tw`px-6 mb-8`}>
            <Skeleton height={160} borderRadius={24} />
          </View>
        ) : homeData?.adBanners?.length > 0 && (
          <FlatList
            data={homeData.adBanners}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => item.linkUrl && Alert.alert('External Link', item.linkUrl)}
                style={[tw`px-6`, { width }]}
              >
                <Image
                  source={{ uri: item.imageUrl }}
                  style={[tw`w-full h-40 rounded-3xl`, { backgroundColor: '#0D1117' }]}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            )}
            style={tw`mb-8`}
          />
        )}

        {/* ── Stats Grid ── */}
        <View style={tw`flex-row flex-wrap justify-between px-6 mb-4`}>
          {loading ? (
            [1, 2, 3, 4].map(i => <View key={i} style={tw`w-[48%] mb-4`}><Skeleton height={100} borderRadius={24} /></View>)
          ) : (
            <>
              <StatItem label="Points" value={homeData?.stats?.points || 0} icon={Trophy} color="#fbbf24" />
              <StatItem label="Global Rank" value={`#${homeData?.stats?.rank?.label || 'N/A'}`} icon={ArrowUpRight} color={primaryLight} />
              <StatItem label="Total Quizzes" value={homeData?.stats?.totalAttempts || 0} icon={BookOpen} color="#6366f1" />
              <StatItem label="Avg. Score" value={`${homeData?.stats?.avgScore || 0}%`} icon={CheckCircle2} color="#10b981" />
            </>
          )}
        </View>

        {/* ── Continue Learning ── */}
        <SectionHeader title="Continue Learning" onSeeAll={() => handlePress('Lectures')} />
        <View style={tw`px-6 mb-8`}>
          {loading ? (
            <Skeleton height={80} borderRadius={24} />
          ) : homeData?.recentActivity?.length > 0 ? (
            homeData.recentActivity.slice(0, 3).map((act: any) => (
              <TouchableOpacity
                key={act.id}
                onPress={() => handlePress('LectureDetail', { lectureId: act.lecture.id })}
                style={tw`flex-row items-center bg-[#0D1117] p-4 rounded-3xl mb-3 border border-[#1E2D4D]`}
              >
                <View style={tw`w-12 h-12 rounded-xl bg-teal-500/10 items-center justify-center mr-4`}>
                  <PlayCircle color="#2dd4bf" size={24} />
                </View>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-white font-bold text-base`} numberOfLines={1}>{act.lecture.title}</Text>
                  <Text style={tw`text-slate-500 text-xs`}>{act.lecture.subject.name}</Text>
                </View>
                <ChevronRight color="#3B4A6B" size={20} />
              </TouchableOpacity>
            ))
          ) : (
            <View style={tw`bg-[#0D1117] p-8 rounded-3xl items-center border border-dashed border-[#1E2D4D]`}>
              <Brain color="#3B4A6B" size={32} style={tw`mb-2`} />
              <Text style={tw`text-slate-400 font-bold`}>No activity yet. Start a lecture!</Text>
            </View>
          )}
        </View>

        {/* ── Recommended Quizzes ── */}
        <SectionHeader title="Recommended Quiz" onSeeAll={() => handlePress('Quizzes')} />
        <View style={tw`px-6 mb-8`}>
          {loading ? (
            <Skeleton height={120} borderRadius={24} />
          ) : homeData?.suggestedPapers?.length > 0 ? (
            <FlatList
              data={homeData.suggestedPapers}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handlePress('QuizPlayer', { pastPaperId: item.id })}
                  style={tw`bg-[#0D1117] p-5 rounded-3xl mr-4 border border-[#1E2D4D] w-64`}
                >
                  <View style={tw`bg-indigo-500/10 self-start px-3 py-1 rounded-full mb-3`}>
                    <Text style={tw`text-indigo-400 text-[10px] font-black uppercase`}>{item.module.name}</Text>
                  </View>
                  <Text style={tw`text-white font-black text-lg mb-4`} numberOfLines={2}>{item.title}</Text>
                  <View style={tw`flex-row items-center justify-between mt-auto`}>
                    <View style={tw`flex-row items-center`}>
                      <Clock color="#3B4A6B" size={12} style={tw`mr-1`} />
                      <Text style={tw`text-slate-500 text-xs`}>20-30 mins</Text>
                    </View>
                    <Text style={[tw`font-bold text-xs`, { color: primaryLight }]}>Start Now →</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          ) : (
            <Text style={tw`text-slate-500 italic`}>No quizzes found for your semester.</Text>
          )}
        </View>

        {/* ── Today's Tasks ── */}
        <SectionHeader title="Today's Tasks" onSeeAll={() => handlePress('Taskat')} />
        <View style={tw`px-6 mb-8`}>
          {loading ? (
            <Skeleton height={60} borderRadius={24} />
          ) : homeData?.todayTasks?.length > 0 ? (
            homeData.todayTasks.map((task: any) => (
              <TouchableOpacity
                key={task.id}
                onPress={() => toggleTask(task.id, task.completed)}
                style={[tw`flex-row items-center bg-[#0D1117] p-4 rounded-2xl mb-2 border`, { borderColor: task.completed ? primaryColor + '40' : '#1E2D4D' }]}
              >
                {task.completed ? <CheckCircle2 color={primaryColor} size={22} /> : <Circle color="#3B4A6B" size={22} />}
                <View style={tw`flex-1 ml-4`}>
                  <Text style={[tw`text-white font-bold`, task.completed && tw`text-slate-500 line-through`]}>{task.title}</Text>
                  {task.time && <Text style={tw`text-slate-500 text-xs`}>{task.time}</Text>}
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <TouchableOpacity onPress={() => handlePress('Taskat')} style={tw`bg-[#0D1117] p-5 rounded-2xl border border-dashed border-[#1E2D4D] items-center`}>
              <Text style={tw`text-slate-400 font-bold`}>+ Add your first task</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Mini Leaderboard ── */}
        <SectionHeader title="Top Performers" onSeeAll={() => handlePress('Leaderboard')} />
        <View style={tw`px-6 mb-10`}>
          <View style={tw`bg-[#0D1117] rounded-[32px] p-6 border border-[#1E2D4D]`}>
            {loading ? (
              [1, 2, 3].map(i => <Skeleton key={i} mb={4} height={50} />)
            ) : homeData?.topUsers?.length > 0 ? (
              homeData.topUsers.map((u: any, idx: number) => (
                <View key={u.id} style={[tw`flex-row items-center mb-4`, idx === 2 && tw`mb-0`]}>
                  <Text style={tw`text-slate-500 font-black mr-4 w-4`}>{idx + 1}</Text>
                  <Image source={{ uri: u.image || `https://ui-avatars.com/api/?name=${u.name}&background=0D1117&color=fff` }} style={tw`w-10 h-10 rounded-full bg-slate-800 mr-4`} />
                  <View style={tw`flex-1`}>
                    <Text style={tw`text-white font-bold`}>{u.name}</Text>
                    <Text style={tw`text-slate-500 text-[10px] uppercase font-bold`}>{u.rank?.label || 'Student'}</Text>
                  </View>
                  <Text style={[tw`font-black`, { color: primaryLight }]}>{u.points} pts</Text>
                </View>
              ))
            ) : (
              <Text style={tw`text-slate-500 text-center`}>No rankings yet.</Text>
            )}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
