import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, SafeAreaView,
  RefreshControl, StatusBar, LayoutAnimation, Platform, UIManager
} from 'react-native';
import tw from 'twrnc';
import Animated, {
  FadeInDown, useSharedValue, useAnimatedStyle,
  withTiming, withSpring
} from 'react-native-reanimated';
import {
  BookOpen, ChevronRight, Layers, PlayCircle,
  Search, GraduationCap, ChevronDown,
  Activity, BookMarked, Sparkles, Lock
} from 'lucide-react-native';
import { useThemeStore } from '../store/useThemeStore';
import { mobileApi } from '../lib/api';
import * as Haptics from 'expo-haptics';
import { Skeleton } from '../components/ui/Skeleton';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SUBJECT_COLORS = [
  '#f43f5e', '#0ea5e9', '#8b5cf6', '#10b981',
  '#f59e0b', '#6366f1', '#ec4899', '#14b8a6'
];

function AnimatedProgressBar({ progress, color }: { progress: number; color: string }) {
  const width = useSharedValue(0);
  useEffect(() => {
    width.value = withTiming(progress, { duration: 800 });
  }, [progress]);
  const animStyle = useAnimatedStyle(() => ({ width: `${width.value}%` as any }));
  return (
    <View style={tw`h-1.5 bg-white/5 rounded-full mt-5 overflow-hidden`}>
      <Animated.View style={[tw`h-full rounded-full`, animStyle, { backgroundColor: color }]} />
    </View>
  );
}

export function LibraryScreen({ navigation }: any) {
  const { primaryColor, primaryLight } = useThemeStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modules, setModules] = useState<any[]>([]);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [stats, setStats] = useState({ overallProgress: 0, activeSubjects: 0 });

  const fetchData = useCallback(async () => {
    try {
      const data = await mobileApi.getModulesAuth();
      // Attach color + compute progress from lecture count (server doesn't return completions)
      let totalSubjects = 0;
      const enriched = data.map((mod: any, mi: number) => {
        const subjects = (mod.subjects || []).map((sub: any, si: number) => ({
          ...sub,
          color: SUBJECT_COLORS[(mi * 3 + si) % SUBJECT_COLORS.length],
          lectures: sub.lectures || [],
          lectureCount: (sub.lectures || []).length,
        }));
        totalSubjects += subjects.length;
        return { ...mod, subjects, subjectsCount: subjects.length };
      });
      setModules(enriched);
      setStats({ overallProgress: 0, activeSubjects: totalSubjects });
    } catch (err) {
      console.warn('Failed to fetch modules:', err);
      // Fallback to empty — no mock data in production
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const toggleModule = (moduleId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedModule(expandedModule === moduleId ? null : moduleId);
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-black`}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={tw`px-6 pt-6 pb-6`}>
        <View style={tw`flex-row justify-between items-center mb-2`}>
          <Text style={tw`text-white text-3xl font-black tracking-tight`}>Library</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            style={tw`w-10 h-10 bg-[#0D1117] border border-[#1E2D4D] rounded-xl items-center justify-center`}
          >
            <Search color="white" size={20} />
          </TouchableOpacity>
        </View>
        <Text style={tw`text-slate-500 font-bold text-sm uppercase tracking-widest`}>Medical Curriculum</Text>
      </View>

      <ScrollView
        contentContainerStyle={tw`pb-32 px-6`}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />}
      >
        {/* Quick Stats */}
        <View style={tw`flex-row justify-between mb-8`}>
          <Animated.View entering={FadeInDown.delay(0)} style={tw`bg-[#0D1117] border border-[#1E2D4D] p-4 rounded-3xl flex-1 mr-3`}>
            <Activity color={primaryLight} size={20} style={tw`mb-2`} />
            <Text style={tw`text-white font-black text-lg`}>{stats.overallProgress}%</Text>
            <Text style={tw`text-slate-500 text-[10px] font-black uppercase`}>Overall Progress</Text>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(80)} style={tw`bg-[#0D1117] border border-[#1E2D4D] p-4 rounded-3xl flex-1`}>
            <BookMarked color="#f59e0b" size={20} style={tw`mb-2`} />
            <Text style={tw`text-white font-black text-lg`}>{stats.activeSubjects}</Text>
            <Text style={tw`text-slate-500 text-[10px] font-black uppercase`}>Active Subjects</Text>
          </Animated.View>
        </View>

        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height={100} mb={4} borderRadius={32} />
          ))
        ) : modules.length === 0 ? (
          <View style={tw`items-center justify-center py-20`}>
            <Lock color="#1E2D4D" size={48} style={tw`mb-4`} />
            <Text style={tw`text-slate-600 font-black text-lg text-center`}>No curriculum yet</Text>
            <Text style={tw`text-slate-700 text-sm text-center mt-2`}>Your faculty modules will appear here</Text>
          </View>
        ) : (
          modules.map((module, index) => (
            <Animated.View key={module.id} entering={FadeInDown.delay(index * 80)} style={tw`mb-4`}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => toggleModule(module.id)}
                style={[
                  tw`p-6 bg-[#0D1117] border border-[#1E2D4D] rounded-[32px]`,
                  expandedModule === module.id && tw`border-b-0 rounded-b-none`
                ]}
              >
                <View style={tw`flex-row items-center justify-between`}>
                  <View style={tw`flex-row items-center flex-1`}>
                    <View style={[tw`w-14 h-14 rounded-2xl items-center justify-center mr-4 border border-white/5`, { backgroundColor: primaryColor + '15' }]}>
                      <Layers color={primaryColor} size={28} />
                    </View>
                    <View style={tw`flex-1`}>
                      <Text style={tw`text-white font-black text-lg`} numberOfLines={1}>{module.name}</Text>
                      <Text style={tw`text-slate-500 text-xs font-bold`}>
                        {module.subjectsCount} Subject{module.subjectsCount !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>
                  <ChevronDown
                    color="#4B5563"
                    size={22}
                    style={{ transform: [{ rotate: expandedModule === module.id ? '180deg' : '0deg' }] }}
                  />
                </View>

                <AnimatedProgressBar progress={0} color={primaryColor} />
              </TouchableOpacity>

              {expandedModule === module.id && (
                <View style={tw`bg-[#0D1117] border border-[#1E2D4D] border-t-0 rounded-b-[32px] overflow-hidden px-4 pb-6`}>
                  {module.subjects?.length === 0 ? (
                    <Text style={tw`text-slate-600 text-sm text-center py-4`}>No subjects yet</Text>
                  ) : (
                    module.subjects?.map((subject: any) => (
                      <TouchableOpacity
                        key={subject.id}
                        activeOpacity={0.8}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          navigation.navigate('SubjectDetail', { subjectId: subject.id });
                        }}
                        style={tw`flex-row items-center p-4 bg-white/[0.03] rounded-2xl mb-2 border border-white/5`}
                      >
                        <View style={[tw`w-12 h-12 rounded-xl items-center justify-center mr-4`, { backgroundColor: subject.color + '20' }]}>
                          <GraduationCap color={subject.color} size={22} />
                        </View>
                        <View style={tw`flex-1`}>
                          <Text style={tw`text-white font-black text-sm`} numberOfLines={1}>{subject.name}</Text>
                          <View style={tw`flex-row mt-1 items-center`}>
                            <PlayCircle color={subject.color} size={12} style={tw`mr-1`} />
                            <Text style={tw`text-slate-500 text-[10px] font-black uppercase`}>
                              {subject.lectureCount} Lecture{subject.lectureCount !== 1 ? 's' : ''}
                            </Text>
                            {subject.lectureCount > 0 && (
                              <>
                                <View style={tw`w-1 h-1 rounded-full bg-slate-700 mx-2`} />
                                <Sparkles color={primaryLight} size={10} style={tw`mr-1`} />
                                <Text style={tw`text-slate-500 text-[10px] font-black uppercase`}>AI Ready</Text>
                              </>
                            )}
                          </View>
                        </View>
                        <ChevronRight color="#4B5563" size={18} />
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}
            </Animated.View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
