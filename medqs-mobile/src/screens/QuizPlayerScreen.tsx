import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, SafeAreaView, Alert,
  ActivityIndicator, StatusBar, AppState, Dimensions,
  ScrollView, Animated as RNAnimated, Platform, StyleSheet, Image
} from 'react-native';
import tw from 'twrnc';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import Svg, { Circle as SvgCircle } from 'react-native-svg';
import Animated, { FadeIn, FadeInDown, FadeInUp, SlideInRight, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import {
  ChevronLeft, Timer, CheckCircle2,
  XCircle, ArrowRight, HelpCircle,
  Award, RefreshCcw, Flag, Volume2,
  X, ChevronRight, AlertCircle, Info,
  Sparkles, Brain, Trophy, Share2
} from 'lucide-react-native';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { useQuizStore } from '../store/useQuizStore';
import { mobileApi } from '../lib/api';

const { width, height } = Dimensions.get('window');

// ─── Result Circle ──────────────────────────────────────────────────────────

const ResultCircle = ({ percentage, color }: { percentage: number; color: string }) => {
  const size = 200;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View style={tw`items-center justify-center`}>
      <Svg width={size} height={size}>
        <SvgCircle
          cx={size / 2} cy={size / 2} r={radius}
          stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth} fill="transparent"
        />
        <SvgCircle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={color} strokeWidth={strokeWidth} fill="transparent"
          strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
          strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={tw`absolute items-center justify-center`}>
        <Text style={tw`text-5xl font-black text-white`}>{Math.round(percentage)}%</Text>
        <Text style={tw`text-slate-500 font-black uppercase text-[10px] tracking-widest mt-1`}>Exam Score</Text>
      </View>
    </View>
  );
};

// ─── Main QuizPlayerScreen ───────────────────────────────────────────────────

export function QuizPlayerScreen({ route, navigation }: any) {
  const { pastPaperId } = route.params || {};
  const { user } = useAuthStore();
  const { primaryColor, primaryLight } = useThemeStore();
  const quiz = useQuizStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Focus tracking
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState !== 'active' && !quiz.isCompleted) {
        quiz.incrementFocusLoss();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    });
    return () => subscription.remove();
  }, [quiz.isCompleted]);

  // Timer logic
  useEffect(() => {
    let interval: any;
    if (!quiz.isCompleted && quiz.timeRemaining > 0 && !loading) {
      interval = setInterval(() => {
        quiz.tickTimer();
        if (quiz.timeRemaining === 60) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
      }, 1000);
    } else if (quiz.timeRemaining === 0 && !loading && !quiz.isCompleted && quiz.questions.length > 0) {
      handleSubmit();
    }
    return () => clearInterval(interval);
  }, [quiz.timeRemaining, quiz.isCompleted, loading]);

  // Initial Load
  useEffect(() => {
    const loadQuiz = async () => {
      if (!pastPaperId) return;
      try {
        quiz.reset();
        const data = await mobileApi.getPastPaperQuestions(pastPaperId);
        const transformed = (data.questions || []).map((q: any) => ({
          id: q.id,
          questionText: q.body || '',
          options: parseChoicesText(q.choices),
          correctAnswer: letterToIndex(q.answer),
          explanation: q.explanation || q.aiExplanation || '',
          image: q.imageUrl || undefined,
        }));
        quiz.setQuestions(transformed);
        quiz.setPastPaperId(pastPaperId);
        useQuizStore.setState({ timeRemaining: (data.pastPaper.timeLimitMin || 20) * 60 });
        setLoading(false);
      } catch (err: any) {
        setError(err?.message || 'Failed to load quiz');
        setLoading(false);
      }
    };
    loadQuiz();
  }, [pastPaperId]);

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    try {
      const answersArray = Object.entries(quiz.answers).map(([qid, val]) => ({
        questionId: qid,
        chosen: indexToLetter(val as number),
      }));

      const res = await mobileApi.submitQuiz({
        pastPaperId,
        answers: answersArray,
        timeTaken: (quiz.questions.length * 60) - quiz.timeRemaining,
        focusLossCount: quiz.focusLossCount
      });

      setResult(res);
      quiz.complete();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSpeak = (text: string) => {
    Speech.speak(text, { language: 'en', pitch: 1.0, rate: 0.9 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // ─── Helpers ────────────────────────────────────────────────────────────────
  function parseChoicesText(choices: any): string[] {
    if (!choices) return [];
    if (Array.isArray(choices)) return choices.map((c: any) => (typeof c === 'string' ? c : c.text || ''));
    if (typeof choices === 'object') return Object.values(choices).map((v: any) => String(v));
    if (typeof choices === 'string') return choices.split(/[A-D]\)\s*/).filter(Boolean).map((s: string) => s.trim());
    return [];
  }
  function letterToIndex(letter: string): number { return letter ? letter.toUpperCase().charCodeAt(0) - 65 : -1; }
  function indexToLetter(index: number): string { return String.fromCharCode(65 + index); }

  if (loading) {
    return (
      <View style={tw`flex-1 bg-black justify-center items-center`}>
        <ActivityIndicator size="large" color={primaryColor} />
        <Text style={tw`text-slate-500 mt-4 font-black uppercase tracking-widest`}>Syncing with Database...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={tw`flex-1 bg-black justify-center items-center px-10`}>
        <AlertCircle color="#ef4444" size={48} style={tw`mb-4`} />
        <Text style={tw`text-white text-xl font-black text-center`}>{error}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`mt-8 px-8 py-4 bg-white/5 rounded-[24px] border border-white/10`}>
          <Text style={tw`text-white font-black`}>Return to Library</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── RESULT VIEW ────────────────────────────────────────────────────────────
  if (quiz.isCompleted && result) {
    const correctCount = result.correct ?? 0;
    const total = result.totalQuestions ?? quiz.questions.length;
    const percent = result.score ?? (total > 0 ? (correctCount / total) * 100 : 0);

    return (
      <SafeAreaView style={tw`flex-1 bg-black`}>
        <StatusBar barStyle="light-content" />
        <ScrollView contentContainerStyle={tw`px-6 py-10 items-center`}>
          <Animated.View entering={FadeInDown} style={tw`items-center`}>
             <Trophy color="#fbbf24" size={48} style={tw`mb-4`} />
             <Text style={tw`text-white text-3xl font-black mb-2`}>Exam Finished!</Text>
             <Text style={tw`text-slate-500 font-bold mb-10`}>You've completed the challenge.</Text>
          </Animated.View>
          
          <Animated.View entering={FadeIn.delay(300)}>
             <ResultCircle percentage={percent} color={primaryColor} />
          </Animated.View>

          <View style={tw`flex-row justify-between w-full mt-12 gap-4`}>
            <Animated.View entering={FadeInUp.delay(500)} style={tw`flex-1 bg-[#0D1117] p-5 rounded-[32px] border border-[#1E2D4D]`}>
              <View style={tw`flex-row items-center mb-1`}>
                 <View style={tw`w-2 h-2 rounded-full bg-green-500 mr-2`} />
                 <Text style={tw`text-slate-500 text-[10px] font-black uppercase`}>Correct</Text>
              </View>
               <Text style={tw`text-white text-3xl font-black`}>{correctCount}</Text>
            </Animated.View>
            <Animated.View entering={FadeInUp.delay(600)} style={tw`flex-1 bg-[#0D1117] p-5 rounded-[32px] border border-[#1E2D4D]`}>
               <View style={tw`flex-row items-center mb-1`}>
                 <View style={tw`w-2 h-2 rounded-full bg-red-500 mr-2`} />
                 <Text style={tw`text-slate-500 text-[10px] font-black uppercase`}>Mistakes</Text>
              </View>
              <Text style={tw`text-white text-3xl font-black`}>{total - correctCount}</Text>
            </Animated.View>
          </View>

          <TouchableOpacity
            style={tw`w-full bg-[#0D1117] p-6 rounded-[32px] mt-8 border border-[#1E2D4D] flex-row items-center justify-between`}
          >
             <View style={tw`flex-row items-center`}>
                <View style={tw`w-12 h-12 bg-indigo-500/10 rounded-2xl items-center justify-center mr-4`}>
                   <Brain color="#818cf8" size={24} />
                </View>
                <View>
                   <Text style={tw`text-white font-black text-lg`}>AI Explanation</Text>
                   <Text style={tw`text-slate-500 text-xs font-bold`}>Analyze your mistakes</Text>
                </View>
             </View>
             <ChevronRight color="#4B5563" size={20} />
          </TouchableOpacity>

          <View style={tw`flex-row gap-4 mt-8`}>
             <TouchableOpacity
               onPress={() => navigation.goBack()}
               style={[tw`flex-1 py-5 rounded-[32px] items-center`, { backgroundColor: primaryColor }]}
             >
               <Text style={tw`text-white font-black text-lg`}>Continue</Text>
             </TouchableOpacity>
             <TouchableOpacity style={tw`w-20 bg-white/5 border border-white/10 rounded-[32px] items-center justify-center`}>
                <Share2 color="white" size={24} />
             </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── SESSION VIEW ───────────────────────────────────────────────────────────
  const currentQ = quiz.questions[quiz.currentIndex];
  const timerColor = quiz.timeRemaining < 60 ? '#ef4444' : primaryLight;

  return (
    <SafeAreaView style={tw`flex-1 bg-black`}>
      <StatusBar barStyle="light-content" />
      
      {/* Top Header */}
      <View style={tw`flex-row justify-between items-center px-6 py-4`}>
        <TouchableOpacity 
           onPress={() => Alert.alert('Exit Quiz', 'Your progress will be lost. Exit anyway?', [{text: 'Stay'}, {text: 'Exit', onPress: () => navigation.goBack()}])}
           style={tw`p-2 bg-white/5 rounded-xl border border-white/10`}
        >
          <X color="white" size={20} />
        </TouchableOpacity>
        
        <View style={[tw`flex-row items-center px-5 py-2 rounded-2xl border`, { borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.02)' }]}>
          <Timer color={timerColor} size={18} style={tw`mr-2`} />
          <Text style={[tw`font-black text-sm tracking-tighter`, { color: timerColor }]}>{formatTime(quiz.timeRemaining)}</Text>
        </View>

        <TouchableOpacity 
           onPress={() => { quiz.toggleFlag(currentQ.id); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
           style={tw`p-2 bg-white/5 rounded-xl border border-white/10`}
        >
          <Flag color={quiz.flagged.includes(currentQ.id) ? '#fbbf24' : 'white'} fill={quiz.flagged.includes(currentQ.id) ? '#fbbf24' : 'transparent'} size={20} />
        </TouchableOpacity>
      </View>

      {/* Progress Bar Container */}
      <View style={tw`px-6 py-2`}>
         <View style={tw`h-1.5 w-full bg-white/5 rounded-full overflow-hidden`}>
           <View style={[tw`h-full rounded-full`, { backgroundColor: primaryColor, width: `${((quiz.currentIndex + 1) / quiz.questions.length) * 100}%` }]} />
         </View>
      </View>

      <ScrollView contentContainerStyle={tw`p-6 pb-40`} showsVerticalScrollIndicator={false}>
        <View style={tw`flex-row justify-between items-center mb-8`}>
           <View style={tw`bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/20`}>
             <Text style={tw`text-teal-400 font-black text-[10px] uppercase tracking-widest`}>Question {quiz.currentIndex + 1} of {quiz.questions.length}</Text>
           </View>
           <TouchableOpacity onPress={() => handleSpeak(currentQ.questionText)} style={tw`p-2 bg-white/5 rounded-xl`}>
             <Volume2 color={primaryLight} size={20} />
           </TouchableOpacity>
        </View>

        <Text style={tw`text-white text-2xl font-black leading-9 mb-10`}>
          {currentQ.questionText}
        </Text>

        {currentQ.image && (
          <Image source={{ uri: currentQ.image }} style={tw`w-full h-56 rounded-[32px] mb-10 bg-[#0D1117] border border-[#1E2D4D]`} resizeMode="contain" />
        )}

        {/* Options */}
        <View style={tw`space-y-4`}>
          {currentQ.options.map((opt, idx) => {
            const isSelected = quiz.answers[currentQ.id] === idx;
            return (
              <TouchableOpacity
                key={idx}
                onPress={() => {
                  quiz.setAnswer(currentQ.id, idx);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }}
                activeOpacity={0.8}
                style={[
                  tw`flex-row items-center p-6 rounded-[32px] border-2 mb-4`,
                  isSelected
                    ? { borderColor: primaryColor, backgroundColor: primaryColor + '10' }
                    : { borderColor: '#1E2D4D', backgroundColor: '#0D1117' }
                ]}
              >
                <View style={[
                  tw`w-10 h-10 rounded-2xl items-center justify-center mr-4 border`,
                  isSelected
                    ? { backgroundColor: primaryColor, borderColor: primaryColor }
                    : { backgroundColor: 'transparent', borderColor: '#3B4A6B' }
                ]}>
                  <Text style={[tw`font-black`, { color: isSelected ? 'white' : '#3B4A6B' }]}>
                    {String.fromCharCode(65 + idx)}
                  </Text>
                </View>
                <Text style={[tw`flex-1 font-bold text-[15px]`, { color: isSelected ? 'white' : '#8899BB' }]}>{opt}</Text>
                {isSelected && <CheckCircle2 color={primaryColor} size={22} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom Nav */}
      <View style={tw`absolute bottom-0 left-0 right-0 p-6 bg-black border-t border-white/5 flex-row gap-4`}>
        <TouchableOpacity
          onPress={() => { quiz.setCurrentIndex(Math.max(0, quiz.currentIndex - 1)); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          disabled={quiz.currentIndex === 0}
          style={[tw`w-16 h-16 rounded-[24px] bg-[#0D1117] border border-[#1E2D4D] items-center justify-center`, quiz.currentIndex === 0 && { opacity: 0.3 }]}
        >
          <ChevronLeft color="white" size={28} />
        </TouchableOpacity>

        {quiz.currentIndex === quiz.questions.length - 1 ? (
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting}
            style={[tw`flex-1 h-16 rounded-[24px] items-center flex-row justify-center shadow-2xl`, { backgroundColor: primaryColor }]}
          >
            {submitting ? <ActivityIndicator color="white" /> : (
              <>
                <Text style={tw`text-white font-black text-lg mr-2`}>Finish Exam</Text>
                <Sparkles color="white" size={20} fill="white" />
              </>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => { quiz.setCurrentIndex(quiz.currentIndex + 1); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
            style={[tw`flex-1 h-16 rounded-[24px] bg-[#1E2D4D] items-center flex-row justify-center border border-white/10`]}
          >
            <Text style={tw`text-white font-black text-lg mr-2`}>Next Question</Text>
            <ChevronRight color="white" size={20} strokeWidth={3} />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}
