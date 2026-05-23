import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  SafeAreaView, TextInput, Alert, RefreshControl,
  Dimensions, KeyboardAvoidingView, Platform,
} from 'react-native';
import Animated, {
  FadeInDown, useSharedValue, useAnimatedStyle, withSpring, withSequence, FadeIn,
} from 'react-native-reanimated';
import {
  MessageSquare, Heart, Share2, Plus, Search,
  TrendingUp, Users, Send, Sparkles,
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
};

function LikeButton({ initial, postId }: { initial: number; postId: string }) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(initial);
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const { getTheme } = useThemeStore();
  const theme = getTheme();

  const toggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSequence(withSpring(1.4), withSpring(1));
    setLiked(v => !v);
    setCount(c => liked ? c - 1 : c + 1);
  };

  return (
    <TouchableOpacity onPress={toggle} activeOpacity={0.7}
      style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12, backgroundColor: theme.colors.surfaceLight, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 }}>
      <Animated.View style={animStyle}>
        <Heart color={liked ? '#ef4444' : theme.colors.textMuted} fill={liked ? '#ef4444' : 'transparent'} size={16} style={{ marginRight: 6 }} />
      </Animated.View>
      <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: '700' }}>{count}</Text>
    </TouchableOpacity>
  );
}

function PostCard({ post, onComment }: { post: any; onComment: (id: string) => void }) {
  const { getTheme, primaryColor } = useThemeStore();
  const theme = getTheme();
  const catColor = CATEGORY_COLORS[post.category] || primaryColor;

  return (
    <Animated.View entering={FadeInDown.duration(400)} style={{
      backgroundColor: theme.colors.surface,
      borderRadius: 28,
      padding: 20,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    }}>
      {/* Author */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
        <Image
          source={{ uri: post.user?.image || `https://ui-avatars.com/api/?name=${post.user?.name || 'U'}&background=${encodeURIComponent(theme.colors.surfaceLight)}&color=fff` }}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.surfaceLight, marginRight: 12 }}
        />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: 13 }}>{post.user?.name || 'Anonymous'}</Text>
            <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: theme.colors.textMuted, marginHorizontal: 6 }} />
            <Text style={{ color: catColor, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' }}>{post.category}</Text>
          </View>
          <Text style={{ color: theme.colors.textMuted, fontSize: 11, marginTop: 1 }}>{post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Recent'}</Text>
        </View>
      </View>

      {/* Content */}
      <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '600', lineHeight: 22, marginBottom: 14 }}>{post.content}</Text>
      {post.imageUrl && (
        <Image source={{ uri: post.imageUrl }} style={{ width: '100%', height: 180, borderRadius: 20, marginBottom: 14, backgroundColor: theme.colors.surfaceLight }} resizeMode="cover" />
      )}

      {/* Actions */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.colors.borderLight }}>
        <LikeButton initial={post._count?.likes || 0} postId={post.id} />
        <TouchableOpacity onPress={() => onComment(post.id)} activeOpacity={0.7}
          style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12, backgroundColor: theme.colors.surfaceLight, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 }}>
          <MessageSquare color={theme.colors.textMuted} size={16} style={{ marginRight: 6 }} />
          <Text style={{ color: theme.colors.textMuted, fontSize: 12, fontWeight: '700' }}>{post._count?.comments || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.7}
          style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surfaceLight, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 }}>
          <Share2 color={theme.colors.textMuted} size={16} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

export function CommunityScreen({ navigation }: any) {
  const { primaryColor, primaryLight, getTheme } = useThemeStore();
  const theme = getTheme();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [stats, setStats] = useState({ total: 0, online: 0 });

  const fetchPosts = useCallback(async () => {
    try {
      const data = await mobileApi.getCommunity();
      setPosts(data.posts || []);
      setStats({ total: data.stats?.totalDiscussions || 0, online: data.stats?.onlineMembers || 0 });
    } catch {
      // Fallback empty
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const createPost = async () => {
    if (!newPost.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await mobileApi.createPost('all', newPost.trim());
      setNewPost('');
      fetchPosts();
    } catch { Alert.alert('Error', 'Failed to create post'); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <Text style={{ color: theme.colors.text, fontSize: 28, fontWeight: '900', letterSpacing: -0.5 }}>Community</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              backgroundColor: theme.colors.surface, borderRadius: 20,
              paddingHorizontal: 12, paddingVertical: 6,
              borderWidth: 1, borderColor: theme.colors.border,
              marginRight: 10,
            }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#34d399', marginRight: 6 }} />
              <Text style={{ color: theme.colors.textMuted, fontSize: 11, fontWeight: '700' }}>{stats.online}</Text>
            </View>
          </View>
        </View>
        <Text style={{ color: theme.colors.textMuted, fontWeight: '700', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.5 }}>
          {stats.total} Discussions
        </Text>
      </View>

      {/* Create Post */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          marginHorizontal: 24, marginBottom: 20,
          backgroundColor: theme.colors.surface,
          borderRadius: 28,
          paddingLeft: 16, paddingRight: 4, paddingVertical: 4,
          borderWidth: 1, borderColor: theme.colors.border,
        }}>
          <TextInput
            placeholder="Share your study question..."
            placeholderTextColor={theme.colors.textMuted}
            value={newPost}
            onChangeText={setNewPost}
            style={{
              flex: 1, height: 44,
              color: theme.colors.text,
              fontSize: 13, fontWeight: '600',
            }}
          />
          <TouchableOpacity onPress={createPost}
            style={{
              width: 44, height: 44, borderRadius: 22,
              backgroundColor: newPost.trim() ? primaryColor : theme.colors.surfaceLight,
              alignItems: 'center', justifyContent: 'center',
            }}
            disabled={!newPost.trim()}
          >
            <Send color={newPost.trim() ? 'white' : theme.colors.textMuted} size={18} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPosts(); }} tintColor={primaryColor} />}
      >
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={160} mb={3} borderRadius={28} />)
        ) : posts.length === 0 ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}>
            <MessageSquare color={theme.colors.border} size={48} style={{ marginBottom: 16 }} />
            <Text style={{ color: theme.colors.textMuted, fontWeight: '900', fontSize: 16 }}>No discussions yet</Text>
            <Text style={{ color: theme.colors.border, fontSize: 13, marginTop: 8, textAlign: 'center' }}>Be the first to share something!</Text>
          </View>
        ) : (
          posts.map(post => <PostCard key={post.id} post={post} onComment={(id) => navigation.navigate('LectureDetail', { postId: id })} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}