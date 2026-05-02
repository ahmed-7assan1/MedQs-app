import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, Dimensions,
  FlatList, ActivityIndicator, StatusBar,
} from 'react-native';
import tw from 'twrnc';
import Animated, {
  FadeIn, FadeInDown, FadeInRight,
  useSharedValue, useAnimatedStyle, withTiming, withSpring, withSequence
} from 'react-native-reanimated';
import {
  Play, Heart, MessageCircle, Share2,
  MoreVertical, Search, Music,
  CheckCircle2, TrendingUp, Pause, Volume2, VolumeX
} from 'lucide-react-native';
import { useThemeStore } from '../store/useThemeStore';
import { mobileApi } from '../lib/api';
import * as Haptics from 'expo-haptics';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';

const { width, height } = Dimensions.get('window');
const SCREEN_HEIGHT = height;

// ─── Like Button ────────────────────────────────────────────────────────────
function LikeButton({ color }: { color: string }) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(Math.floor(Math.random() * 9000) + 1000);
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const toggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scale.value = withSequence(withSpring(1.5), withSpring(1));
    setLiked(v => !v);
    setCount(c => liked ? c - 1 : c + 1);
  };

  return (
    <TouchableOpacity onPress={toggle} activeOpacity={0.8} style={tw`items-center mb-6`}>
      <View style={tw`w-14 h-14 bg-black/30 rounded-full items-center justify-center border border-white/20`}>
        <Animated.View style={animStyle}>
          <Heart color={liked ? '#ef4444' : 'white'} fill={liked ? '#ef4444' : 'transparent'} size={28} />
        </Animated.View>
      </View>
      <Text style={tw`text-white font-black text-xs mt-1`}>
        {count >= 1000 ? `${(count / 1000).toFixed(1)}K` : count}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Video Item ─────────────────────────────────────────────────────────────
function VideoItem({ item, isActive }: { item: any; isActive: boolean }) {
  const { primaryColor } = useThemeStore();
  const videoRef = useRef<Video>(null);
  const [muted, setMuted] = useState(false);
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);

  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.playAsync().catch(() => {});
      } else {
        videoRef.current.pauseAsync().catch(() => {});
      }
    }
  }, [isActive]);

  const isPlaying = status?.isLoaded ? status.isPlaying : false;
  const togglePlay = () => {
    if (!videoRef.current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    isPlaying ? videoRef.current.pauseAsync() : videoRef.current.playAsync();
  };

  return (
    <View style={{ height: SCREEN_HEIGHT, width }}>
      {/* Video */}
      {item.videoUrl ? (
        <Video
          ref={videoRef}
          source={{ uri: item.videoUrl }}
          style={tw`absolute inset-0`}
          resizeMode={ResizeMode.COVER}
          shouldPlay={isActive}
          isLooping
          isMuted={muted}
          onPlaybackStatusUpdate={s => setStatus(s)}
          posterSource={item.thumbnail ? { uri: item.thumbnail } : undefined}
          usePoster
        />
      ) : (
        <View style={[tw`absolute inset-0`, { backgroundColor: '#0D1117' }]}>
          <View style={tw`flex-1 items-center justify-center`}>
            <Play color={primaryColor} size={64} />
          </View>
        </View>
      )}

      {/* Gradient overlays */}
      <View style={[tw`absolute inset-0`, { backgroundColor: 'rgba(0,0,0,0.15)' }]} />
      <View style={[tw`absolute bottom-0 left-0 right-0`, { height: 280, backgroundColor: 'rgba(0,0,0,0.55)' }]} />

      {/* Top Controls */}
      <View style={tw`absolute top-14 right-4 flex-row items-center`}>
        <TouchableOpacity
          onPress={() => setMuted(v => !v)}
          activeOpacity={0.8}
          style={tw`p-2 bg-black/30 rounded-full mr-2 border border-white/20`}
        >
          {muted ? <VolumeX color="white" size={20} /> : <Volume2 color="white" size={20} />}
        </TouchableOpacity>
      </View>

      {/* Right Action Sidebar */}
      <View style={tw`absolute right-4 bottom-36 items-center`}>
        <LikeButton color={primaryColor} />

        <TouchableOpacity activeOpacity={0.8} style={tw`items-center mb-6`}>
          <View style={tw`w-14 h-14 bg-black/30 rounded-full items-center justify-center border border-white/20`}>
            <MessageCircle color="white" size={26} />
          </View>
          <Text style={tw`text-white font-black text-xs mt-1`}>
            {Math.floor(Math.random() * 300 + 10)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
          style={tw`items-center mb-6`}
        >
          <View style={tw`w-14 h-14 bg-black/30 rounded-full items-center justify-center border border-white/20`}>
            <Share2 color="white" size={24} />
          </View>
          <Text style={tw`text-white font-black text-xs mt-1`}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.8} style={tw`p-2`}>
          <MoreVertical color="white" size={24} />
        </TouchableOpacity>

        <Animated.View
          entering={FadeIn.delay(600)}
          style={[tw`w-12 h-12 rounded-full border-2 border-white/40 items-center justify-center bg-black/30 mt-4`]}
        >
          <Music color="white" size={18} />
        </Animated.View>
      </View>

      {/* Bottom Metadata */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={togglePlay}
        style={tw`absolute bottom-28 left-4 right-20`}
      >
        <Animated.View entering={FadeInDown.delay(200)}>
          <View style={tw`flex-row items-center mb-3`}>
            <Text style={tw`text-white font-black text-lg mr-2`}>
              @{(item.instructorName || item.subject?.name || 'MedOneX').replace(/\s+/g, '').toLowerCase()}
            </Text>
            <View style={tw`bg-blue-500 rounded-full p-0.5`}>
              <CheckCircle2 color="white" size={12} strokeWidth={4} />
            </View>
          </View>
          <Text style={tw`text-white/90 text-base font-semibold leading-6 mb-3`} numberOfLines={2}>
            {item.title}
          </Text>
          {(item.subject?.name || item.moduleName) && (
            <View style={tw`flex-row items-center bg-black/30 self-start px-3 py-1.5 rounded-full border border-white/10`}>
              <TrendingUp color={primaryColor} size={14} style={tw`mr-2`} />
              <Text style={tw`text-white text-xs font-bold`}>
                {item.subject?.name || item.moduleName}
              </Text>
            </View>
          )}
        </Animated.View>
      </TouchableOpacity>

      {/* Play/Pause Overlay */}
      {!isPlaying && isActive && (
        <Animated.View
          entering={FadeIn}
          style={tw`absolute inset-0 items-center justify-center`}
          pointerEvents="none"
        >
          <View style={tw`w-20 h-20 rounded-full bg-black/40 items-center justify-center border border-white/20`}>
            <Play color="white" size={36} fill="white" />
          </View>
        </Animated.View>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export function VideoHubScreen({ navigation }: any) {
  const { primaryColor } = useThemeStore();
  const [activeCategory, setActiveCategory] = useState('For You');
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState<any[]>([]);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);

  const fetchVideos = useCallback(async () => {
    try {
      // Fetch all lectures that have a videoUrl
      const lectures = await mobileApi.getLectures({});
      const videoLectures = lectures.filter((l: any) => l.videoUrl);
      setVideos(videoLectures);
    } catch (err) {
      console.warn('Failed to fetch video lectures:', err);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchVideos(); }, [fetchVideos]);

  const renderItem = useCallback(({ item, index }: { item: any; index: number }) => (
    <VideoItem item={item} isActive={activeVideoIndex === index} />
  ), [activeVideoIndex]);

  return (
    <View style={tw`flex-1 bg-black`}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header overlay */}
      <Animated.View
        entering={FadeInDown}
        style={tw`absolute top-0 left-0 right-0 z-10 pt-14 px-6 flex-row items-center justify-between`}
      >
        <View style={tw`flex-row items-center`}>
          {['For You', 'Following'].map(tab => (
            <TouchableOpacity
              key={tab}
              activeOpacity={0.8}
              onPress={() => { setActiveCategory(tab); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              style={tw`mr-6`}
            >
              <Text style={[tw`text-lg font-black`, activeCategory === tab ? tw`text-white` : tw`text-white/40`]}>
                {tab}
              </Text>
              {activeCategory === tab && (
                <View style={[tw`h-1 w-6 rounded-full self-center mt-1`, { backgroundColor: primaryColor }]} />
              )}
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          activeOpacity={0.8}
          style={tw`p-2 bg-black/30 rounded-full border border-white/20`}
        >
          <Search color="white" size={22} />
        </TouchableOpacity>
      </Animated.View>

      {loading ? (
        <View style={tw`flex-1 items-center justify-center`}>
          <ActivityIndicator size="large" color={primaryColor} />
          <Text style={tw`text-slate-500 mt-4 font-bold`}>Loading lectures...</Text>
        </View>
      ) : videos.length === 0 ? (
        <View style={tw`flex-1 items-center justify-center px-8`}>
          <Play color="#1E2D4D" size={64} style={tw`mb-6`} />
          <Text style={tw`text-white font-black text-2xl text-center mb-3`}>No Videos Yet</Text>
          <Text style={tw`text-slate-500 text-center text-base leading-6`}>
            Video lectures from your curriculum will appear here once they're uploaded.
          </Text>
        </View>
      ) : (
        <FlatList
          data={videos}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          onMomentumScrollEnd={e => {
            const index = Math.round(e.nativeEvent.contentOffset.y / SCREEN_HEIGHT);
            setActiveVideoIndex(index);
          }}
          snapToInterval={SCREEN_HEIGHT}
          decelerationRate="fast"
          removeClippedSubviews
          initialNumToRender={1}
          maxToRenderPerBatch={2}
          windowSize={3}
          getItemLayout={(_, index) => ({ length: SCREEN_HEIGHT, offset: SCREEN_HEIGHT * index, index })}
        />
      )}
    </View>
  );
}
