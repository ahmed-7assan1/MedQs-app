import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, SafeAreaView,
  RefreshControl, LayoutAnimation, Platform, UIManager, Animated as RNA,
} from 'react-native';
import { useThemeStore } from '../store/useThemeStore';
import { mobileApi } from '../lib/api';
import { Skeleton } from '../components/ui/Skeleton';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInDown, useSharedValue, useAnimatedStyle,
  withTiming, withSpring, withSequence
} from 'react-native-reanimated';
import {
  BookOpen, ChevronRight, Layers, PlayCircle,
  Search, GraduationCap, ChevronDown,
  Activity, BookMarked, Sparkles, Lock,
  Brain
} from 'lucide-react-native';

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
    width.value = withTiming(progress, { duration: 1000 });
  }, [progress]);
  const animStyle = useAnimatedStyle(() => ({ width: `${width.value}%` as any }));
  return (
    <View style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 3, marginTop: 16, overflow: 'hidden' }}>
      <Animated.View style={[{ height: '100%', borderRadius: 3 }, animStyle, { backgroundColor: color }]} />
    </View>
  );
}

function PulseDot() {
  const opacity = useSharedValue(0.3);
  useEffect(() => {
    opacity.value = withSequence(
      withTiming(1, { duration: 600 }),
      withTiming(0.3, { duration: 600 }),
    );
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#34d399', marginRight: 6 }, style]} />;
}

export function LibraryScreen({ navigation }: any) {
  const { primaryColor, primaryLight, getTheme } = useThemeStore();
  const theme = getTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modules, setModules] = useState<any[]>([]);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [stats, setStats] = useState({ overallProgress: 0, activeSubjects: 0 });

  const fetchData = useCallback(async () => {
    try {
      const data = await mobileApi.getModulesAuth();
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
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <Text style={{ color: theme.colors.text, fontSize: 28, fontWeight: '900', letterSpacing: -0.5 }}>Library</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            style={{
              width: 40, height: 40,
              backgroundColor: theme.colors.surface,
              borderRadius: 14,
              borderWidth: 1, borderColor: theme.colors.border,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Search color={theme.colors.text} size={20} />
          </TouchableOpacity>
        </View>
        <Text style={{ color: theme.colors.textMuted, fontWeight: '700', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.5 }}>
          Medical Curriculum
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />}
      >
        {/* Quick Stats */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28 }}>
          <View style={{
            flex: 1, marginRight: 12,
            backgroundColor: theme.colors.surface,
            borderRadius: 24, padding: 16,
            borderWidth: 1, borderColor: theme.colors.border,
          }}>
            <Activity color={primaryLight} size={20} style={{ marginBottom: 8 }} />
            <Text style={{ color: theme.colors.text, fontWeight: '900', fontSize: 20 }}>{stats.overallProgress}%</Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' }}>Overall Progress</Text>
          </View>
          <View style={{
            flex: 1,
            backgroundColor: theme.colors.surface,
            borderRadius: 24, padding: 16,
            borderWidth: 1, borderColor: theme.colors.border,
          }}>
            <BookMarked color="#f59e0b" size={20} style={{ marginBottom: 8 }} />
            <Text style={{ color: theme.colors.text, fontWeight: '900', fontSize: 20 }}>{stats.activeSubjects}</Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' }}>Subjects</Text>
          </View>
        </View>

        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height={100} mb={4} borderRadius={32} />
          ))
        ) : modules.length === 0 ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
            <Lock color={theme.colors.border} size={48} style={{ marginBottom: 16 }} />
            <Text style={{ color: theme.colors.textMuted, fontWeight: '900', fontSize: 18, textAlign: 'center' }}>No curriculum yet</Text>
            <Text style={{ color: theme.colors.border, fontSize: 13, textAlign: 'center', marginTop: 8 }}>
              Your faculty modules will appear here
            </Text>
          </View>
        ) : (
          modules.map((module, index) => (
            <Animated.View key={module.id} entering={FadeInDown.delay(index * 80)} style={{ marginBottom: 12 }}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => toggleModule(module.id)}
                style={{
                  padding: 20,
                  backgroundColor: theme.colors.surface,
                  borderRadius: expandedModule === module.id ? 24 : 28,
                  borderWidth: 1,
                  borderColor: expandedModule === module.id ? primaryColor + '30' : theme.colors.border,
                  borderBottomLeftRadius: expandedModule === module.id ? 0 : 28,
                  borderBottomRightRadius: expandedModule === module.id ? 0 : 28,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <View style={{
                      width: 52, height: 52, borderRadius: 16,
                      backgroundColor: primaryColor + '15',
                      alignItems: 'center', justifyContent: 'center',
                      marginRight: 14,
                      borderWidth: 1, borderColor: primaryColor + '20',
                    }}>
                      <Layers color={primaryColor} size={26} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ color: theme.colors.text, fontWeight: '900', fontSize: 16 }} numberOfLines={1}>
                          {module.name}
                        </Text>
                      </View>
                      <Text style={{ color: theme.colors.textMuted, fontSize: 11, fontWeight: '700', marginTop: 2 }}>
                        {module.subjectsCount} Subject{module.subjectsCount !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>
                  <ChevronDown
                    color={theme.colors.textMuted}
                    size={20}
                    style={{ transform: [{ rotate: expandedModule === module.id ? '180deg' : '0deg' }] }}
                  />
                </View>
                <AnimatedProgressBar progress={0} color={primaryColor} />
              </TouchableOpacity>

              {expandedModule === module.id && (
                <View style={{
                  backgroundColor: theme.colors.surface,
                  borderWidth: 1,
                  borderColor: primaryColor + '30',
                  borderTopWidth: 0,
                  borderBottomLeftRadius: 24,
                  borderBottomRightRadius: 24,
                  paddingHorizontal: 16,
                  paddingBottom: 20,
                }}>
                  {module.subjects?.length === 0 ? (
                    <Text style={{ color: theme.colors.textMuted, fontSize: 13, textAlign: 'center', paddingVertical: 16 }}>
                      No subjects yet
                    </Text>
                  ) : (
                    module.subjects?.map((subject: any) => (
                      <TouchableOpacity
                        key={subject.id}
                        activeOpacity={0.8}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          navigation.navigate('SubjectDetail', { subjectId: subject.id });
                        }}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          padding: 14,
                          backgroundColor: theme.colors.surfaceLight,
                          borderRadius: 20,
                          marginBottom: 8,
                          borderWidth: 1,
                          borderColor: theme.colors.border,
                        }}
                      >
                        <View style={{
                          width: 44, height: 44, borderRadius: 14,
                          backgroundColor: subject.color + '20',
                          alignItems: 'center', justifyContent: 'center',
                          marginRight: 14,
                        }}>
                          <GraduationCap color={subject.color} size={20} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: 13 }} numberOfLines={1}>
                            {subject.name}
                          </Text>
                          <View style={{ flexDirection: 'row', marginTop: 4, alignItems: 'center' }}>
                            <PlayCircle color={subject.color} size={11} style={{ marginRight: 4 }} />
                            <Text style={{ color: theme.colors.textMuted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' }}>
                              {subject.lectureCount} Lecture{subject.lectureCount !== 1 ? 's' : ''}
                            </Text>
                            {subject.lectureCount > 0 && (
                              <>
                                <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: theme.colors.border, marginHorizontal: 8 }} />
                                <PulseDot />
                                <Text style={{ color: theme.colors.textMuted, fontSize: 10, fontWeight: '700' }}>AI Ready</Text>
                              </>
                            )}
                          </View>
                        </View>
                        <ChevronRight color={theme.colors.textMuted} size={16} />
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