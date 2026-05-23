import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Image, Dimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useThemeStore } from '../store/useThemeStore';
import { ChevronLeft, Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export function PodcastPlayerScreen({ route, navigation }: any) {
  const { podcastTitle, instructor } = route.params || { podcastTitle: 'Clinical Anatomy Overview', instructor: 'Dr. Sarah Ahmed' };
  const { getTheme, primaryColor, primaryLight } = useThemeStore();
  const theme = getTheme();
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0.3);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, backgroundColor: theme.colors.surface, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border }}>
          <ChevronLeft color={theme.colors.text} size={24} />
        </TouchableOpacity>
        <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: 18 }}>Now Playing</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={{ flex: 1, paddingHorizontal: 32, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View entering={FadeInDown} style={{
          width: width * 0.7, height: width * 0.7, borderRadius: 40,
          overflow: 'hidden', marginBottom: 40,
          borderWidth: 3, borderColor: primaryColor + '30',
          shadowColor: primaryColor,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.2,
          shadowRadius: 24,
          elevation: 10,
        }}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1628102491629-77858ab5721d?q=80&w=1000' }}
            style={{ width: '100%', height: '100%', opacity: 0.85 }}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100)} style={{ alignItems: 'center', marginBottom: 40 }}>
          <Text style={{ color: theme.colors.text, fontSize: 22, fontWeight: '900', textAlign: 'center', marginBottom: 8 }} numberOfLines={2}>
            {podcastTitle}
          </Text>
          <Text style={{ color: primaryLight, fontWeight: '600', fontSize: 16 }}>{instructor}</Text>
        </Animated.View>

        {/* Progress */}
        <View style={{ width: '100%', marginBottom: 40 }}>
          <View style={{ height: 6, width: '100%', backgroundColor: theme.colors.surfaceLight, borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
            <View style={{ height: '100%', backgroundColor: primaryColor, borderRadius: 3, width: `${progress * 100}%` }} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: theme.colors.textMuted, fontSize: 11, fontWeight: '700' }}>12:45</Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: 11, fontWeight: '700' }}>42:30</Text>
          </View>
        </View>

        {/* Controls */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: 16 }}>
          <TouchableOpacity style={{ padding: 12 }}>
            <Volume2 color={theme.colors.textMuted} size={24} />
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity style={{ padding: 16 }}>
              <SkipBack color={theme.colors.text} size={28} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsPlaying(!isPlaying)}
              style={{
                width: 80, height: 80, borderRadius: 40,
                backgroundColor: primaryColor,
                alignItems: 'center', justifyContent: 'center',
                marginHorizontal: 24,
                shadowColor: primaryColor,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
                elevation: 8,
              }}
            >
              {isPlaying ? <Pause color="white" size={34} fill="white" /> : <Play color="white" size={34} fill="white" style={{ marginLeft: 3 }} />}
            </TouchableOpacity>

            <TouchableOpacity style={{ padding: 16 }}>
              <SkipForward color={theme.colors.text} size={28} />
            </TouchableOpacity>
          </View>

          <View style={{ width: 10 }} />
        </View>
      </View>
    </SafeAreaView>
  );
}