import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, SafeAreaView,
  FlatList, Dimensions, Animated,
} from 'react-native';
import tw from 'twrnc';
import { useThemeStore } from '../store/useThemeStore';
import { storage } from '../lib/storage';
import { BookOpen, Brain, Trophy } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const ONBOARDING_KEY = 'onboarding_done_v1';

const SLIDES = [
  {
    icon: BookOpen,
    title: 'Learn the Right Way',
    subtitle: 'Lectures, quizzes, and a question bank for every subject in your curriculum — all in one place.',
    gradient: ['#0d9488', '#0f766e'],
  },
  {
    icon: Brain,
    title: 'Study with AI',
    subtitle: 'Get AI explanations for any question and identify your weak spots in seconds.',
    gradient: ['#6366f1', '#4f46e5'],
  },
  {
    icon: Trophy,
    title: 'Challenge Peers',
    subtitle: 'Earn points, top the leaderboard, and prove you are the best in your class.',
    gradient: ['#f59e0b', '#d97706'],
  },
];

interface OnboardingScreenProps {
  navigation: any;
}

export function OnboardingScreen({ navigation }: OnboardingScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const { primaryColor } = useThemeStore();

  const handleNext = async () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
      setCurrentIndex(currentIndex + 1);
    } else {
      await storage.setItem(ONBOARDING_KEY, 'true');
      navigation.replace('Login');
    }
  };

  const handleSkip = async () => {
    await storage.setItem(ONBOARDING_KEY, 'true');
    navigation.replace('Login');
  };

  const renderSlide = ({ item }: { item: typeof SLIDES[0] }) => {
    const IconComponent = item.icon;
    return (
      <View style={[tw`items-center justify-center px-10`, { width }]}>
        <View
          style={[
            tw`w-32 h-32 rounded-[48px] items-center justify-center mb-10 shadow-2xl`,
            { backgroundColor: item.gradient[0] + '30', borderWidth: 1, borderColor: item.gradient[0] + '50' },
          ]}
        >
          <IconComponent color={item.gradient[0]} size={56} />
        </View>
        <Text style={tw`text-white text-3xl font-black text-center mb-4 leading-10`}>{item.title}</Text>
        <Text style={tw`text-slate-400 text-base text-center leading-7`}>{item.subtitle}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-[#07090F]`}>
      {/* Skip */}
      <TouchableOpacity onPress={handleSkip} style={tw`absolute top-14 right-6 z-10`}>
        <Text style={tw`text-slate-400 font-bold`}>Skip</Text>
      </TouchableOpacity>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(idx);
        }}
        style={tw`flex-1 mt-16`}
      />

      {/* Dots */}
      <View style={tw`flex-row justify-center mb-10`}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[
              tw`h-2 rounded-full mx-1`,
              {
                width: i === currentIndex ? 24 : 8,
                backgroundColor: i === currentIndex ? primaryColor : '#1E2D4D',
              },
            ]}
          />
        ))}
      </View>

      {/* CTA */}
      <View style={tw`px-6 pb-10`}>
        <TouchableOpacity
          onPress={handleNext}
          style={[tw`py-4 rounded-2xl items-center`, { backgroundColor: primaryColor }]}
        >
          <Text style={tw`text-white font-black text-lg`}>
            {currentIndex < SLIDES.length - 1 ? 'Next' : 'Get Started 🚀'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
