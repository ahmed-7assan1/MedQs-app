import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  SafeAreaView, TextInput, ActivityIndicator, RefreshControl,
  StatusBar, FlatList, Dimensions
} from 'react-native';
import tw from 'twrnc';
import Animated, {
  FadeInDown, useSharedValue, useAnimatedStyle, withSpring, withSequence
} from 'react-native-reanimated';
import {
  MessageSquare, Heart, Share2,
  MoreHorizontal, Plus, Search,
  TrendingUp, Filter, CheckCircle2, Users
} from 'lucide-react-native';
import { useThemeStore } from '../store/useThemeStore';
import { mobileApi } from '../lib/api';
import * as Haptics from 'expo-haptics';
import { Skeleton } from '../components/ui/Skeleton';

const { width } = Dimensions.get('window');

const CATEGORY_COLORS: Record<string, string> = {
  'Clinical Cases': '#ef4444',
  'Exam Prep': '#0ea5e9',
  'Announcements': '#8b5cf6',
  'Questions': '#f59e0b',
  'Medical News': '#10b981',
  ADMIN: '#8b5cf6',
  SUPER_ADMIN: '#ec4899',
};

function LikeButton({ initial, postId }: { initial: number; postId: string }) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(initial);
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const toggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSequence(withSpring(1.4), withSpring(1));
    setLiked(v => !v);
    setCount(c => liked ? c - 1 : c + 1);
    // In production: mobileApi.likePost(postId)
  };

  return (
    <TouchableOpacity
      onPress={toggle}
      activeOpacity={0.7}
      style={tw`flex-row items-center mr-4 bg-white/5 px-3 py-2 rounded-xl`}
    >
      <Animated.View style={animStyle}>
        <Heart
          color={liked ? '#ef4444' : '#4B5563'}
          fill={liked ? '#ef4444' : 'transparent'}
          size={18}
          style={tw`mr-2`}
        />
      </Animated.View>
      <Text style={tw`text-slate-400 font-black text-xs`}>{count}</Text>
    </TouchableOpacity>
  );
}

export function CommunityScreen({ navigation }: any) {
  const { primaryColor, primaryLight } = useThemeStore();
  const [posts, setPosts] = useState<any[]>([]);
  const [stats, setStats] = useState({ onlineMembers: 0, totalDiscussions: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('All Feed');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const { posts: fetchedPosts, stats: fetchedStats } = await mobileApi.getCommunity();
      setPosts(fetchedPosts || []);
      setStats(fetchedStats || { onlineMembers: 0, totalDiscussions: 0 });
    } catch (error) {
      console.warn('Failed to fetch community posts', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const filteredPosts = posts.filter(p => {
    const matchSearch = !searchQuery || p.title?.toLowerCase().includes(searchQuery.toLowerCase()) || p.content?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchTab = activeTab === 'All Feed' || p.category === activeTab;
    return matchSearch && matchTab;
  });

  const renderPost = ({ item, index }: { item: any; index: number }) => {
    const catColor = CATEGORY_COLORS[item.category] || CATEGORY_COLORS[item.authorRole] || primaryColor;
    const avatarUri = item.authorImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.authorName || 'User')}&background=0D1117&color=fff&bold=true`;

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 80).springify()}
        style={tw`bg-[#0D1117] rounded-[28px] p-5 mb-5 border border-[#1E2D4D]`}
      >
        <View style={tw`flex-row justify-between items-start mb-4`}>
          <View style={tw`flex-row items-center flex-1 mr-3`}>
            <Image
              source={{ uri: avatarUri }}
              style={tw`w-12 h-12 rounded-2xl mr-3 border border-white/10`}
            />
            <View style={tw`flex-1`}>
              <View style={tw`flex-row items-center`}>
                <Text style={tw`text-white font-black mr-2`} numberOfLines={1}>{item.authorName}</Text>
                {(item.authorRole === 'ADMIN' || item.authorRole === 'SUPER_ADMIN' || item.isPinned) && (
                  <CheckCircle2 color={catColor} size={14} fill={catColor + '20'} />
                )}
              </View>
              <Text style={tw`text-slate-500 text-xs font-bold`}>
                {item.authorRole === 'ADMIN' || item.authorRole === 'SUPER_ADMIN' ? 'MedOneX Team' : 'Student'}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={tw`p-2`} activeOpacity={0.7}>
            <MoreHorizontal color="#4B5563" size={20} />
          </TouchableOpacity>
        </View>

        {item.category && (
          <View style={[tw`self-start px-3 py-1 rounded-full mb-3`, { backgroundColor: catColor + '18' }]}>
            <Text style={[tw`text-[10px] font-black uppercase tracking-widest`, { color: catColor }]}>
              {item.category}
            </Text>
          </View>
        )}

        <Text style={tw`text-white font-black text-base mb-2`} numberOfLines={2}>
          {item.title || item.content?.substring(0, 60) + '...'}
        </Text>
        <Text style={tw`text-slate-400 leading-6 text-[15px]`} numberOfLines={3}>
          {item.content}
        </Text>

        {item.image && (
          <Image
            source={{ uri: item.image }}
            style={tw`w-full h-48 rounded-2xl mt-4 bg-slate-900`}
            resizeMode="cover"
          />
        )}

        <View style={tw`flex-row items-center pt-4 mt-2 border-t border-white/5`}>
          <LikeButton initial={item.likes || 0} postId={item.id} />

          <TouchableOpacity
            activeOpacity={0.7}
            style={tw`flex-row items-center mr-4 bg-white/5 px-3 py-2 rounded-xl`}
          >
            <MessageSquare color="#4B5563" size={18} style={tw`mr-2`} />
            <Text style={tw`text-slate-400 font-black text-xs`}>{item.comments || 0}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            style={tw`flex-row items-center bg-white/5 px-3 py-2 rounded-xl`}
          >
            <Share2 color="#4B5563" size={18} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-black`}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={tw`px-6 pt-6 pb-4 flex-row justify-between items-center`}>
        <View>
          <Text style={tw`text-white text-3xl font-black tracking-tight`}>Community</Text>
          <View style={tw`flex-row items-center mt-1`}>
            <View style={tw`w-2 h-2 rounded-full bg-green-500 mr-2`} />
            <Users color={primaryLight} size={12} style={tw`mr-1`} />
            <Text style={tw`text-slate-500 text-xs font-bold`}>{stats.onlineMembers} Medics active</Text>
            {stats.totalDiscussions > 0 && (
              <Text style={tw`text-slate-600 text-xs ml-3`}>• {stats.totalDiscussions} active discussions</Text>
            )}
          </View>
        </View>
        <TouchableOpacity
          onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
          activeOpacity={0.8}
          style={[tw`w-12 h-12 rounded-2xl items-center justify-center shadow-lg`, { backgroundColor: primaryColor }]}
        >
          <Plus color="white" size={28} strokeWidth={3} />
        </TouchableOpacity>
      </View>

      <View style={tw`px-6 pt-2`}>
        {/* Search & Filter */}
        <View style={tw`flex-row items-center mb-5`}>
          <View style={tw`flex-1 flex-row items-center bg-[#0D1117] border border-[#1E2D4D] rounded-2xl px-4 h-13`}>
            <Search color="#4B5563" size={18} style={tw`mr-3`} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search discussions..."
              placeholderTextColor="#4B5563"
              style={tw`flex-1 text-white font-semibold text-sm`}
            />
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            style={tw`w-13 h-13 bg-[#0D1117] border border-[#1E2D4D] rounded-2xl items-center justify-center ml-3`}
          >
            <Filter color="white" size={18} />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`mb-5`}>
          {['All Feed', 'Clinical Cases', 'Exam Prep', 'Questions', 'Medical News'].map((tab, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => { setActiveTab(tab); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              activeOpacity={0.8}
              style={[
                tw`px-5 py-2.5 rounded-2xl mr-3 border`,
                activeTab === tab
                  ? { backgroundColor: primaryColor, borderColor: primaryColor }
                  : tw`bg-transparent border-white/10`
              ]}
            >
              <Text style={[tw`font-black text-xs`, activeTab === tab ? tw`text-white` : tw`text-slate-400`]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Posts Feed */}
      {loading ? (
        <View style={tw`px-6 pt-2`}>
          {[1, 2, 3].map(i => <Skeleton key={i} height={200} mb={16} borderRadius={28} />)}
        </View>
      ) : (
        <FlatList
          data={filteredPosts}
          renderItem={renderPost}
          keyExtractor={item => item.id}
          contentContainerStyle={tw`px-6 pb-32 pt-2`}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />}
          ListEmptyComponent={
            <View style={tw`items-center justify-center py-20`}>
              <MessageSquare color="#1E2D4D" size={48} style={tw`mb-4`} />
              <Text style={tw`text-slate-600 font-black text-lg`}>No posts yet</Text>
              <Text style={tw`text-slate-700 text-sm mt-2 text-center`}>
                {searchQuery ? 'Try a different search' : 'Be the first to start a discussion!'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
