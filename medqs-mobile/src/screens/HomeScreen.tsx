import React, { useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image, SafeAreaView,
  RefreshControl, FlatList, Dimensions, ActivityIndicator,
} from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { useHomeStore } from '../store/useHomeStore';
import { useQuery } from '@tanstack/react-query';
import { mobileApi } from '../lib/api';
import { Skeleton } from '../components/ui/Skeleton';
import {
  Bell, ChevronRight, Trophy, BookOpen,
  PlayCircle, CheckCircle2, Circle, Clock,
  ArrowUpRight, AlertCircle, Brain, Sparkles, Target,
  TrendingUp, Award, Zap, GraduationCap,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

function StatCard({ label, value, icon: Icon, color, subtitle }: any) {
  const { getTheme } = useThemeStore();
  const theme = getTheme();

  return (
    <View style={{
      width: '48%',
      backgroundColor: theme.colors.surface,
      borderRadius: 24,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    }}>
      <View style={{
        width: 40, height: 40,
        borderRadius: 14,
        backgroundColor: color + '20',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 12,
      }}>
        <Icon color={color} size={20} />
      </View>
      <Text style={{
        color: theme.colors.text,
        fontSize: 22,
        fontWeight: '900',
        letterSpacing: -0.5,
      }}>{value}</Text>
      <Text style={{
        color: theme.colors.textMuted,
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginTop: 2,
      }}>{label}</Text>
      {subtitle && (
        <Text style={{
          color: theme.colors.textMuted,
          fontSize: 11,
          marginTop: 4,
        }}>{subtitle}</Text>
      )}
    </View>
  );
}

export function HomeScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const { primaryColor, primaryLight, getTheme } = useThemeStore();
  const theme = getTheme();
  const { homeData: bootstrapData } = useHomeStore();

  const { data: homeData, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['home'],
    queryFn: () => mobileApi.getHome(),
    initialData: bootstrapData,
    staleTime: 1000 * 60 * 5,
  });

  const onRefresh = useCallback(() => refetch(), [refetch]);

  const handlePress = useCallback((target: string, params?: any) => {
    navigation.navigate(target, params);
  }, [navigation]);

  if (!homeData && isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 120, paddingTop: 60, paddingHorizontal: 24 }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} mb={16} height={i < 3 ? 160 : 80} borderRadius={24} />
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor={primaryColor} />
        }
      >
        {/* ── Header ── */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 8, marginBottom: 24 }}>
          <View>
            <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>
              Welcome back
            </Text>
            <Text style={{ color: theme.colors.text, fontSize: 24, fontWeight: '900', letterSpacing: -0.5 }}>
              Hi, {homeData?.user?.name?.split(' ')[0] || user?.name?.split(' ')[0] || 'Doctor'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => handlePress('Notifications')}
            style={{
              padding: 12,
              backgroundColor: theme.colors.surface,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: theme.colors.border,
              position: 'relative',
            }}
          >
            <Bell color={theme.colors.text} size={22} />
            {(homeData?.unreadNotifs || 0) > 0 && (
              <View style={{
                position: 'absolute', top: -4, right: -4,
                backgroundColor: theme.colors.danger,
                width: 20, height: 20, borderRadius: 10,
                alignItems: 'center', justifyContent: 'center',
                borderWidth: 2, borderColor: theme.colors.background,
              }}>
                <Text style={{ color: 'white', fontSize: 10, fontWeight: '800' }}>{homeData.unreadNotifs}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ── AI Quick Action ── */}
        <View style={{ paddingHorizontal: 24, marginBottom: 28 }}>
          <TouchableOpacity
            onPress={() => handlePress('StudyAssistant')}
            activeOpacity={0.9}
            style={{
              padding: 20,
              borderRadius: 32,
              backgroundColor: primaryColor,
              flexDirection: 'row',
              alignItems: 'center',
              overflow: 'hidden',
              shadowColor: primaryColor,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 20,
              elevation: 8,
            }}
          >
            <View style={{ position: 'absolute', right: -20, bottom: -20, opacity: 0.1 }}>
              <Brain color="white" size={140} />
            </View>
            <View style={{
              width: 52, height: 52, borderRadius: 16,
              backgroundColor: 'rgba(255,255,255,0.2)',
              alignItems: 'center', justifyContent: 'center',
              marginRight: 16,
            }}>
              <Sparkles color="white" size={26} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: 'white', fontWeight: '900', fontSize: 18 }}>AI Study Assistant</Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '700' }}>
                Ask anything about your curriculum
              </Text>
            </View>
            <View style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              padding: 8, borderRadius: 12,
            }}>
              <ChevronRight color="white" size={20} strokeWidth={3} />
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Stats Grid ── */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 28 }}>
          <StatCard label="Total Points" value={(homeData?.stats?.points || 0).toLocaleString()} icon={Trophy} color="#fbbf24" subtitle="Lifetime earned" />
          <StatCard label="Rank" value={homeData?.stats?.rank?.label || 'Student'} icon={Award} color={primaryLight} />
          <StatCard label="Quizzes" value={homeData?.stats?.totalAttempts || 0} icon={BookOpen} color="#818cf8" subtitle="Completed" />
          <StatCard label="Avg Score" value={`${homeData?.stats?.avgScore || 0}%`} icon={Target} color="#34d399" subtitle="Accuracy rate" />
        </View>

        {/* ── Continue Learning ── */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 16 }}>
          <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '900' }}>Continue Learning</Text>
          <TouchableOpacity onPress={() => handlePress('Lectures')}>
            <Text style={{ color: primaryColor, fontSize: 12, fontWeight: '700' }}>See All</Text>
          </TouchableOpacity>
        </View>
        <View style={{ paddingHorizontal: 24, marginBottom: 28 }}>
          {(homeData?.recentActivity?.length || 0) > 0 ? (
            homeData.recentActivity.slice(0, 3).map((act: any) => (
              <TouchableOpacity
                key={act.id}
                onPress={() => handlePress('LectureDetail', { lectureId: act.lecture.id })}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: theme.colors.surface,
                  padding: 16,
                  borderRadius: 24,
                  marginBottom: 10,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                }}
              >
                <View style={{
                  width: 48, height: 48, borderRadius: 14,
                  backgroundColor: primaryColor + '15',
                  alignItems: 'center', justifyContent: 'center',
                  marginRight: 14,
                }}>
                  <PlayCircle color={primaryColor} size={24} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: 14 }} numberOfLines={1}>
                    {act.lecture.title}
                  </Text>
                  <Text style={{ color: theme.colors.textMuted, fontSize: 11, marginTop: 2 }}>
                    {act.lecture.subject?.name || 'Medical'}
                  </Text>
                </View>
                <ChevronRight color={theme.colors.textMuted} size={18} />
              </TouchableOpacity>
            ))
          ) : (
            <View style={{
              backgroundColor: theme.colors.surface,
              padding: 32,
              borderRadius: 24,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: theme.colors.border,
              borderStyle: 'dashed',
            }}>
              <Brain color={theme.colors.textMuted} size={36} style={{ marginBottom: 8 }} />
              <Text style={{ color: theme.colors.textMuted, fontWeight: '700' }}>No activity yet. Start learning!</Text>
            </View>
          )}
        </View>

        {/* ── Recommended Quizzes ── */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 16 }}>
          <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '900' }}>Quick Practice</Text>
          <TouchableOpacity onPress={() => handlePress('Quizzes')}>
            <Text style={{ color: primaryColor, fontSize: 12, fontWeight: '700' }}>See All</Text>
          </TouchableOpacity>
        </View>
        <View style={{ marginBottom: 28, paddingLeft: 24 }}>
          {(homeData?.suggestedPapers?.length || 0) > 0 ? (
            <FlatList
              data={homeData.suggestedPapers}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handlePress('QuizPlayer', { pastPaperId: item.id })}
                  style={{
                    backgroundColor: theme.colors.surface,
                    padding: 20,
                    borderRadius: 24,
                    marginRight: 12,
                    width: 260,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                  }}
                >
                  <View style={{
                    backgroundColor: primaryColor + '15',
                    alignSelf: 'flex-start',
                    paddingHorizontal: 10, paddingVertical: 4,
                    borderRadius: 20,
                    marginBottom: 12,
                  }}>
                    <Text style={{ color: primaryColor, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' }}>
                      {item.module?.name || 'General'}
                    </Text>
                  </View>
                  <Text style={{ color: theme.colors.text, fontWeight: '900', fontSize: 16, marginBottom: 16 }} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Clock color={theme.colors.textMuted} size={12} style={{ marginRight: 4 }} />
                      <Text style={{ color: theme.colors.textMuted, fontSize: 11 }}>20-30 min</Text>
                    </View>
                    <Text style={{ color: primaryColor, fontWeight: '700', fontSize: 11 }}>Start →</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          ) : (
            <Text style={{ color: theme.colors.textMuted, fontStyle: 'italic', paddingRight: 24 }}>
              No quizzes found for your semester.
            </Text>
          )}
        </View>

        {/* ── Daily Tasks ── */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 16 }}>
          <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '900' }}>Today's Tasks</Text>
          <TouchableOpacity onPress={() => handlePress('Taskat')}>
            <Text style={{ color: primaryColor, fontSize: 12, fontWeight: '700' }}>See All</Text>
          </TouchableOpacity>
        </View>
        <View style={{ paddingHorizontal: 24, marginBottom: 28 }}>
          {(homeData?.todayTasks?.length || 0) > 0 ? (
            homeData.todayTasks.slice(0, 5).map((task: any) => (
              <TouchableOpacity
                key={task.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: theme.colors.surface,
                  padding: 16,
                  borderRadius: 20,
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: task.completed ? primaryColor + '30' : theme.colors.border,
                }}
              >
                {task.completed ? (
                  <CheckCircle2 color={primaryColor} size={22} />
                ) : (
                  <Circle color={theme.colors.textMuted} size={22} />
                )}
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={{
                    color: theme.colors.text,
                    fontWeight: '700',
                    fontSize: 14,
                    textDecorationLine: task.completed ? 'line-through' : 'none',
                    opacity: task.completed ? 0.5 : 1,
                  }}>{task.title}</Text>
                  {task.time && (
                    <Text style={{ color: theme.colors.textMuted, fontSize: 11, marginTop: 2 }}>{task.time}</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <TouchableOpacity
              onPress={() => handlePress('Taskat')}
              style={{
                backgroundColor: theme.colors.surface,
                padding: 20,
                borderRadius: 20,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderStyle: 'dashed',
              }}
            >
              <Text style={{ color: theme.colors.textMuted, fontWeight: '700' }}>+ Add your first task</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Leaderboard Preview ── */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 16 }}>
          <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '900' }}>Top Performers</Text>
          <TouchableOpacity onPress={() => handlePress('Leaderboard')}>
            <Text style={{ color: primaryColor, fontSize: 12, fontWeight: '700' }}>See All</Text>
          </TouchableOpacity>
        </View>
        <View style={{ paddingHorizontal: 24, marginBottom: 40 }}>
          <View style={{
            backgroundColor: theme.colors.surface,
            borderRadius: 32,
            padding: 20,
            borderWidth: 1,
            borderColor: theme.colors.border,
          }}>
            {(homeData?.topUsers?.length || 0) > 0 ? (
              homeData.topUsers.slice(0, 3).map((u: any, idx: number) => (
                <View key={u.id} style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: idx < 2 ? 16 : 0,
                }}>
                  <Text style={{ color: theme.colors.textMuted, fontWeight: '900', marginRight: 16, width: 20, fontSize: 16 }}>
                    {idx + 1}
                  </Text>
                  <Image
                    source={{ uri: u.image || `https://ui-avatars.com/api/?name=${u.name}&background=${theme.colors.surface.replace('#','')}&color=${primaryColor.replace('#','')}` }}
                    style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.surfaceLight, marginRight: 14 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.colors.text, fontWeight: '700' }}>{u.name}</Text>
                    <Text style={{ color: theme.colors.textMuted, fontSize: 10, textTransform: 'uppercase', fontWeight: '700' }}>
                      {u.rank?.label || 'Student'}
                    </Text>
                  </View>
                  <Text style={{ color: primaryColor, fontWeight: '900', fontSize: 14 }}>
                    {u.points} pts
                  </Text>
                </View>
              ))
            ) : (
              <Text style={{ color: theme.colors.textMuted, textAlign: 'center' }}>No rankings yet.</Text>
            )}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
