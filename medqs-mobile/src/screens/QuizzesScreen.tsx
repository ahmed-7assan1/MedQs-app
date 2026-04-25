import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, SafeAreaView,
  RefreshControl, ActivityIndicator, StatusBar, Image
} from 'react-native';
import tw from 'twrnc';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { mobileApi } from '../lib/api';
import { Skeleton } from '../components/ui/Skeleton';
import {
  Search, Filter, ChevronRight, BookOpen,
  Clock, Award, History, Bookmark, Layers, AlertCircle
} from 'lucide-react-native';

// ─── Quiz Card ──────────────────────────────────────────────────────────────

const QuizCard = ({ quiz, onPress }: any) => {
  const { primaryColor, primaryLight } = useThemeStore();
  const diffColor = 
    quiz.difficulty === 'Hard' ? '#ef4444' : 
    quiz.difficulty === 'Medium' ? '#f59e0b' : '#10b981';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={tw`bg-[#0D1117] border border-[#1E2D4D] rounded-3xl p-5 mb-4`}
    >
      <View style={tw`flex-row justify-between items-start mb-4`}>
        <View style={tw`flex-1 mr-4`}>
          <View style={tw`flex-row items-center mb-2`}>
            <View style={tw`bg-indigo-500/10 px-2 py-0.5 rounded-full mr-2`}>
              <Text style={tw`text-indigo-400 text-[10px] font-black uppercase tracking-tighter`}>
                {quiz.module?.name || 'General'}
              </Text>
            </View>
            <View style={[tw`px-2 py-0.5 rounded-full`, { backgroundColor: diffColor + '15' }]}>
              <Text style={[tw`text-[10px] font-black uppercase tracking-tighter`, { color: diffColor }]}>
                {quiz.difficulty || 'Normal'}
              </Text>
            </View>
          </View>
          <Text style={tw`text-white text-lg font-black leading-6`} numberOfLines={2}>
            {quiz.title}
          </Text>
        </View>
        <View style={[tw`w-12 h-12 rounded-2xl items-center justify-center`, { backgroundColor: primaryColor + '10' }]}>
          <BookOpen color={primaryColor} size={24} />
        </View>
      </View>

      <View style={tw`flex-row items-center justify-between pt-4 border-t border-[#1E2D4D]`}>
        <View style={tw`flex-row items-center`}>
          <View style={tw`flex-row items-center mr-4`}>
            <Layers color="#3B4A6B" size={14} style={tw`mr-1.5`} />
            <Text style={tw`text-slate-500 text-xs font-bold`}>{quiz.questionCount || 0} Questions</Text>
          </View>
          <View style={tw`flex-row items-center`}>
            <Clock color="#3B4A6B" size={14} style={tw`mr-1.5`} />
            <Text style={tw`text-slate-500 text-xs font-bold`}>{quiz.timeLimitMin || 20} mins</Text>
          </View>
        </View>
        <Text style={[tw`font-black text-xs`, { color: primaryLight }]}>Start →</Text>
      </View>
    </TouchableOpacity>
  );
};

// ─── Main QuizzesScreen ──────────────────────────────────────────────────────

export function QuizzesScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const { primaryColor, primaryLight } = useThemeStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // all, history, saved
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchQuizzes = useCallback(async (isRefreshing = false) => {
    if (!isRefreshing) setLoading(true);
    setError(null);
    try {
      let data: any[] = [];
      if (activeTab === 'all') {
        data = await mobileApi.getPastPapers({ semesterId: user?.semesterId || '' });
      } else if (activeTab === 'history') {
        data = await mobileApi.getQuizHistory();
      } else if (activeTab === 'saved') {
        data = await mobileApi.getSavedQuestions(); // Actually should be saved quizzes if exists
      }
      setQuizzes(data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load quizzes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, user?.semesterId]);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchQuizzes(true);
  };

  const handleStartQuiz = (quiz: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    navigation.navigate('QuizPlayer', { pastPaperId: quiz.id });
  };

  const TABS = [
    { id: 'all', label: 'Explore', icon: Layers },
    { id: 'history', label: 'History', icon: History },
    { id: 'saved', label: 'Saved', icon: Bookmark },
  ];

  return (
    <SafeAreaView style={tw`flex-1 bg-[#07090F]`}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={tw`px-6 pt-6 pb-4`}>
        <Text style={tw`text-3xl font-black text-white mb-2`}>MCQ Bank</Text>
        <Text style={tw`text-slate-500 text-sm font-bold`}>Practice makes perfect, Doctor.</Text>
      </View>

      {/* Tabs */}
      <View style={tw`flex-row px-6 mb-6 mt-2`}>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab(tab.id);
              }}
              style={[
                tw`flex-row items-center px-4 py-2.5 rounded-2xl mr-3 border`,
                isActive 
                  ? { backgroundColor: primaryColor + '15', borderColor: primaryColor + '40' }
                  : { backgroundColor: '#0D1117', borderColor: '#1E2D4D' }
              ]}
            >
              <Icon color={isActive ? primaryColor : '#3B4A6B'} size={16} style={tw`mr-2`} />
              <Text style={[tw`font-bold text-xs`, { color: isActive ? 'white' : '#475569' }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* List */}
      <FlatList
        data={quizzes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={tw`px-6 pb-32`}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />}
        ListEmptyComponent={
          loading ? (
            <View>
              {[1, 2, 3, 4].map(i => <Skeleton key={i} height={140} borderRadius={32} mb={4} />)}
            </View>
          ) : error ? (
            <View style={tw`items-center py-10`}>
              <AlertCircle color="#ef4444" size={48} style={tw`mb-4`} />
              <Text style={tw`text-white font-bold mb-2`}>{error}</Text>
              <TouchableOpacity onPress={() => fetchQuizzes()} style={[tw`px-6 py-2 rounded-xl`, { backgroundColor: primaryColor }]}>
                <Text style={tw`text-white font-bold`}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={tw`items-center py-20`}>
              <Text style={tw`text-slate-500 font-bold`}>No quizzes found in this category.</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <QuizCard 
            quiz={activeTab === 'history' ? item.pastPaper : item} 
            onPress={() => handleStartQuiz(activeTab === 'history' ? item.pastPaper : item)} 
          />
        )}
      />
    </SafeAreaView>
  );
}
