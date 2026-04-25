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
import {
  ChevronLeft, Timer, CheckCircle2,
  XCircle, ArrowRight, HelpCircle,
  Award, RefreshCcw, Flag, Volume2,
  X, ChevronRight, AlertCircle, Info
} from 'lucide-react-native';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { useQuizStore } from '../store/useQuizStore';
import { mobileApi } from '../lib/api';

const { width, height } = Dimensions.get('window');

// ─── Result Circle ──────────────────────────────────────────────────────────

const ResultCircle = ({ percentage, color }: { percentage: number; color: string }) => {
  const size = 180;
  const strokeWidth = 15;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View style={tw`items-center justify-center`}>
      <Svg width={size} height={size}>
        <SvgCircle
          cx={size / 2} cy={size / 2} r={radius}
          stroke="#1E2D4D" strokeWidth={strokeWidth} fill="transparent"
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
        <Text style={tw`text-slate-500 font-bold uppercase text-[10px] tracking-widest`}>Score</Text>
      </View>
    </View>
  );
};

// ─── Main QuizPlayerScreen ───────────────────────────────────────────────────

export function QuizPlayerScreen({ route, navigation }: any) {
  const { pastPaperId } = route.params;
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
      try {
        quiz.reset();
        const data = await mobileApi.getPastPaperQuestions(pastPaperId);
        quiz.setQuestions(data.questions);
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
        selectedOption: val
      }));

      const res = await mobileApi.submitQuiz({
        pastPaperId,
        answers: answersArray,
        timeTaken: (quiz.questions.length * 60) - quiz.timeRemaining, // Simplified
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
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (loading) {
    return (
      <View style={tw`flex-1 bg-[#07090F] justify-center items-center`}>
        <ActivityIndicator size="large" color={primaryColor} />
        <Text style={tw`text-slate-400 mt-4 font-bold`}>Loading Questions...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={tw`flex-1 bg-[#07090F] justify-center items-center px-10`}>
        <AlertCircle color="#ef4444" size={48} style={tw`mb-4`} />
        <Text style={tw`text-white text-xl font-bold text-center`}>{error}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`mt-8 p-4 bg-white/5 rounded-2xl`}>
          <Text style={tw`text-white font-bold`}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── RESULT VIEW ────────────────────────────────────────────────────────────
  if (quiz.isCompleted && result) {
    const score = result.score || 0;
    const total = quiz.questions.length;
    const percent = (score / total) * 100;

    return (
      <SafeAreaView style={tw`flex-1 bg-[#07090F]`}>
        <ScrollView contentContainerStyle={tw`px-6 py-10 items-center`}>
          <Text style={tw`text-white text-2xl font-black mb-10`}>Quiz Results</Text>
          
          <ResultCircle percentage={percent} color={primaryColor} />

          <View style={tw`flex-row justify-between w-full mt-10 gap-4`}>
            <View style={tw`flex-1 bg-[#0D1117] p-5 rounded-3xl border border-[#1E2D4D]`}>
              <Text style={tw`text-green-400 text-2xl font-black`}>{score}</Text>
              <Text style={tw`text-slate-500 text-[10px] font-bold uppercase`}>Correct</Text>
            </View>
            <View style={tw`flex-1 bg-[#0D1117] p-5 rounded-3xl border border-[#1E2D4D]`}>
              <Text style={tw`text-red-400 text-2xl font-black`}>{total - score}</Text>
              <Text style={tw`text-slate-500 text-[10px] font-bold uppercase`}>Incorrect</Text>
            </View>
          </View>

          {/* Explanation Section */}
          <View style={tw`w-full mt-8`}>
            <Text style={tw`text-white text-lg font-black mb-4`}>Quick Breakdown</Text>
            {quiz.questions.slice(0, 5).map((q, idx) => {
              const userAnswer = quiz.answers[q.id];
              const isCorrect = userAnswer === q.correctAnswer;
              return (
                <View key={q.id} style={tw`bg-[#0D1117] p-4 rounded-2xl mb-3 border border-[#1E2D4D]`}>
                  <View style={tw`flex-row justify-between mb-2`}>
                    <Text style={tw`text-slate-400 font-bold text-xs`}>Q{idx + 1}</Text>
                    {isCorrect ? <CheckCircle2 color="#10b981" size={14} /> : <XCircle color="#ef4444" size={14} />}
                  </View>
                  <Text style={tw`text-white text-sm font-medium`} numberOfLines={1}>{q.questionText}</Text>
                </View>
              );
            })}
          </View>

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[tw`w-full py-4 rounded-2xl items-center mt-10`, { backgroundColor: primaryColor }]}
          >
            <Text style={tw`text-white font-black text-lg`}>Back to Quizzes</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── SESSION VIEW ───────────────────────────────────────────────────────────
  const currentQ = quiz.questions[quiz.currentIndex];
  const timerColor = quiz.timeRemaining < 60 ? '#ef4444' : primaryLight;

  return (
    <SafeAreaView style={tw`flex-1 bg-[#07090F]`}>
      <StatusBar barStyle="light-content" />
      
      {/* Top Header */}
      <View style={tw`flex-row justify-between items-center px-6 py-4 border-b border-[#1E2D4D]`}>
        <TouchableOpacity onPress={() => Alert.alert('Exit Quiz', 'Are you sure?', [{text: 'Stay'}, {text: 'Exit', onPress: () => navigation.goBack()}])}>
          <X color="white" size={24} />
        </TouchableOpacity>
        
        <View style={[tw`flex-row items-center px-4 py-2 rounded-full border`, { borderColor: timerColor + '30', backgroundColor: timerColor + '10' }]}>
          <Timer color={timerColor} size={18} style={tw`mr-2`} />
          <Text style={[tw`font-black text-sm`, { color: timerColor }]}>{formatTime(quiz.timeRemaining)}</Text>
        </View>

        <TouchableOpacity onPress={() => quiz.toggleFlag(currentQ.id)}>
          <Flag color={quiz.flagged.includes(currentQ.id) ? '#fbbf24' : '#3B4A6B'} fill={quiz.flagged.includes(currentQ.id) ? '#fbbf24' : 'transparent'} size={24} />
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={tw`h-1 w-full bg-[#1E2D4D]`}>
        <View style={[tw`h-full`, { backgroundColor: primaryColor, width: `${((quiz.currentIndex + 1) / quiz.questions.length) * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={tw`p-6 pb-40`}>
        <View style={tw`flex-row justify-between items-center mb-6`}>
          <Text style={tw`text-slate-500 font-black text-sm`}>QUESTION {quiz.currentIndex + 1} OF {quiz.questions.length}</Text>
          <TouchableOpacity onPress={() => handleSpeak(currentQ.questionText)}>
            <Volume2 color={primaryLight} size={20} />
          </TouchableOpacity>
        </View>

        <Text style={tw`text-white text-xl font-black leading-8 mb-10`}>
          {currentQ.questionText}
        </Text>

        {currentQ.image && (
          <Image source={{ uri: currentQ.image }} style={tw`w-full h-48 rounded-3xl mb-8 bg-[#0D1117]`} resizeMode="contain" />
        )}

        {/* Options */}
        <View style={tw`gap-3`}>
          {currentQ.options.map((opt, idx) => {
            const isSelected = quiz.answers[currentQ.id] === idx;
            return (
              <TouchableOpacity
                key={idx}
                onPress={() => {
                  quiz.setAnswer(currentQ.id, idx);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={[
                  tw`flex-row items-center p-5 rounded-3xl border-2`,
                  isSelected
                    ? { borderColor: primaryColor, backgroundColor: primaryColor + '10' }
                    : { borderColor: '#1E2D4D', backgroundColor: '#0D1117' }
                ]}
              >
                <View style={[
                  tw`w-8 h-8 rounded-full items-center justify-center mr-4 border`,
                  isSelected
                    ? { backgroundColor: primaryColor, borderColor: primaryColor }
                    : { backgroundColor: 'transparent', borderColor: '#3B4A6B' }
                ]}>
                  <Text style={[tw`font-bold`, { color: isSelected ? 'white' : '#3B4A6B' }]}>
                    {String.fromCharCode(65 + idx)}
                  </Text>
                </View>
                <Text style={[tw`flex-1 font-bold text-base`, { color: isSelected ? 'white' : '#8899BB' }]}>{opt}</Text>
                {isSelected && <CheckCircle2 color={primaryColor} size={20} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom Nav */}
      <View style={tw`absolute bottom-0 left-0 right-0 p-6 bg-[#07090F] border-t border-[#1E2D4D] flex-row gap-4`}>
        <TouchableOpacity
          onPress={() => quiz.setCurrentIndex(Math.max(0, quiz.currentIndex - 1))}
          disabled={quiz.currentIndex === 0}
          style={[tw`p-4 rounded-2xl bg-[#0D1117] border border-[#1E2D4D]`, quiz.currentIndex === 0 && { opacity: 0.3 }]}
        >
          <ChevronLeft color="white" size={24} />
        </TouchableOpacity>

        {quiz.currentIndex === quiz.questions.length - 1 ? (
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting}
            style={[tw`flex-1 py-4 rounded-2xl items-center flex-row justify-center shadow-2xl`, { backgroundColor: primaryColor }]}
          >
            {submitting ? <ActivityIndicator color="white" /> : (
              <>
                <Text style={tw`text-white font-black text-lg mr-2`}>Submit Quiz</Text>
                <Award color="white" size={20} />
              </>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => quiz.setCurrentIndex(quiz.currentIndex + 1)}
            style={[tw`flex-1 py-4 rounded-2xl items-center flex-row justify-center`, { backgroundColor: '#1E2D4D' }]}
          >
            <Text style={tw`text-white font-black text-lg mr-2`}>Next Question</Text>
            <ChevronRight color="white" size={20} />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}
