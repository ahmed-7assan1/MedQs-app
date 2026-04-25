import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, SafeAreaView, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import tw from 'twrnc';
import { EliteTheme } from '../constants/Theme';
import { EliteCard } from '../components/ui/EliteCard';
import { Skeleton } from '../components/ui/Skeleton';
import { api } from '../lib/api';
import { 
  MessageSquare, Heart, Share2, 
  MoreHorizontal, Plus, Search,
  Users, MessageCircle
} from 'lucide-react-native';

export function CommunityScreen() {
  const [posts, setPosts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ onlineMembers: 0, totalDiscussions: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCommunityData = async () => {
    try {
      const data = await api.get<any>('/mobile/community');
      setPosts(data.posts || []);
      setStats(data.stats || { onlineMembers: 12, totalDiscussions: 156 });
    } catch (error) {
      console.warn("Failed to fetch community posts", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCommunityData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCommunityData();
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-[${EliteTheme.colors.background}]`}>
      <View style={tw`px-6 pt-10 pb-4 flex-row justify-between items-center`}>
         <Text style={tw`text-2xl font-bold text-white`}>Community</Text>
         <TouchableOpacity style={tw`p-2 bg-[${EliteTheme.colors.primary}] rounded-full shadow-lg shadow-[${EliteTheme.colors.primaryLight}]`}>
            <Plus color="white" size={24} />
         </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={tw`pb-32 px-6`}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={EliteTheme.colors.primary} />}
      >
        {/* Search & Tabs */}
        <View style={tw`flex-row items-center bg-white/5 rounded-2xl px-4 py-3 mb-6 border border-white/10`}>
           <Search color="#94a3b8" size={18} style={tw`mr-2`} />
           <TextInput 
             placeholder="Search discussions..." 
             placeholderTextColor="#64748b"
             style={tw`flex-1 text-white font-medium`} 
           />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`mb-8`}>
           {['All Feed', 'Questions', 'Medical News', 'Exam Prep'].map((tab, idx) => (
             <TouchableOpacity key={idx} style={[tw`px-5 py-2.5 rounded-full mr-2 border`, idx === 0 ? tw`bg-[${EliteTheme.colors.primary}] border-transparent` : tw`bg-transparent border-white/20`]}>
                <Text style={[tw`font-bold text-xs`, idx === 0 ? tw`text-white` : tw`text-slate-400`]}>{tab}</Text>
             </TouchableOpacity>
           ))}
        </ScrollView>

        {/* Stats Summary */}
        <EliteCard variant="glass" style={tw`flex-row p-5 mb-8`}>
           <View style={tw`flex-1 items-center border-r border-white/10`}>
              <Users color={EliteTheme.colors.primaryLight} size={20} />
              <Text style={tw`text-white font-bold text-lg mt-1`}>2.4k</Text>
              <Text style={tw`text-slate-400 text-[10px] uppercase font-bold`}>Members</Text>
           </View>
           <View style={tw`flex-1 items-center border-r border-white/10`}>
              <MessageCircle color={EliteTheme.colors.primaryLight} size={20} />
              <Text style={tw`text-white font-bold text-lg mt-1`}>{stats.onlineMembers}</Text>
              <Text style={tw`text-slate-400 text-[10px] uppercase font-bold`}>Online</Text>
           </View>
           <View style={tw`flex-1 items-center`}>
              <MessageSquare color={EliteTheme.colors.primaryLight} size={20} />
              <Text style={tw`text-white font-bold text-lg mt-1`}>{stats.totalDiscussions}</Text>
              <Text style={tw`text-slate-400 text-[10px] uppercase font-bold`}>Posts (7d)</Text>
           </View>
        </EliteCard>

        {/* Posts Feed */}
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height={150} borderRadius={24} style={tw`mb-4`} />
          ))
        ) : posts.length === 0 ? (
          <View style={tw`items-center justify-center py-10`}>
             <MessageSquare color="#475569" size={48} style={tw`mb-4`} />
             <Text style={tw`text-slate-500 font-medium`}>No discussions found.</Text>
          </View>
        ) : (
          posts.map(post => (
            <EliteCard key={post.id} variant="glass" style={tw`mb-4 p-5`}>
               <View style={tw`flex-row justify-between items-start mb-4`}>
                  <View style={tw`flex-row items-center`}>
                     <Image 
                       source={{ uri: post.authorImage || 'https://ui-avatars.com/api/?name=' + post.authorName + '&background=0f172a&color=2dd4bf' }} 
                       style={tw`w-10 h-10 rounded-full mr-3 border border-white/20`} 
                     />
                     <View>
                        <Text style={tw`text-white font-bold`}>{post.authorName}</Text>
                        <Text style={tw`text-slate-400 text-[10px]`}>
                          {new Date(post.createdAt).toLocaleDateString()} • <Text style={tw`text-[${EliteTheme.colors.primaryLight}]`}>{post.category}</Text>
                        </Text>
                     </View>
                  </View>
                  <TouchableOpacity><MoreHorizontal color="#64748b" size={20} /></TouchableOpacity>
               </View>
               
               <Text style={tw`text-white font-bold text-lg mb-2`}>{post.title}</Text>
               <Text style={tw`text-slate-300 leading-6 mb-4`} numberOfLines={3}>{post.content}</Text>
               
               <View style={tw`flex-row items-center border-t border-white/10 pt-4`}>
                  <TouchableOpacity style={tw`flex-row items-center mr-6`}>
                     <Heart color="#94a3b8" size={18} style={tw`mr-1`} />
                     <Text style={tw`text-slate-400 font-bold text-xs`}>{post.likes}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={tw`flex-row items-center mr-6`}>
                     <MessageSquare color="#94a3b8" size={18} style={tw`mr-1`} />
                     <Text style={tw`text-slate-400 font-bold text-xs`}>{post.comments}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={tw`flex-row items-center`}>
                     <Share2 color="#94a3b8" size={18} />
                  </TouchableOpacity>
               </View>
            </EliteCard>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
