import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, Dimensions, Image } from 'react-native';
import tw from 'twrnc';
import { EliteTheme } from '../constants/Theme';
import { Play, Heart, MessageCircle, Share2, MoreVertical, Search, ArrowLeft } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export function VideoHubScreen({ navigation }: any) {
  const [activeCategory, setActiveCategory] = useState('For You');
  
  const videos = [
    {
      id: 1,
      title: 'Quick review of the Cranial Nerves II - XII',
      instructor: 'Dr. Sarah',
      likes: '12.4K',
      comments: '342',
      thumbnail: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=1000'
    },
    {
      id: 2,
      title: 'Understanding ECG Basics in 60 Seconds',
      instructor: 'Dr. Ahmed',
      likes: '8.1K',
      comments: '120',
      thumbnail: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=1000'
    }
  ];

  return (
    <SafeAreaView style={tw`flex-1 bg-[${EliteTheme.colors.background}]`}>
      {/* Header */}
      <View style={tw`px-6 pt-6 pb-4 flex-row justify-between items-center`}>
         <Text style={tw`text-2xl font-bold text-white`}>Video Hub</Text>
         <TouchableOpacity style={tw`w-10 h-10 rounded-full bg-white/10 items-center justify-center border border-white/10`}>
            <Search color="white" size={20} />
         </TouchableOpacity>
      </View>

      {/* Categories */}
      <View style={tw`px-6 mb-6`}>
         <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['For You', 'Anatomy', 'Physiology', 'Clinical', 'Surgery'].map((cat, idx) => (
              <TouchableOpacity 
                key={idx}
                onPress={() => setActiveCategory(cat)}
                style={[
                  tw`px-5 py-2.5 rounded-full mr-3 border`,
                  activeCategory === cat ? tw`bg-[${EliteTheme.colors.primary}] border-transparent` : tw`bg-transparent border-white/20`
                ]}
              >
                 <Text style={[tw`font-bold text-xs`, activeCategory === cat ? tw`text-white` : tw`text-white/60`]}>{cat}</Text>
              </TouchableOpacity>
            ))}
         </ScrollView>
      </View>

      {/* Feed (TikTok style cards) */}
      <ScrollView 
        pagingEnabled 
        showsVerticalScrollIndicator={false}
        snapToInterval={height * 0.65}
        decelerationRate="fast"
      >
         {videos.map((vid) => (
           <View key={vid.id} style={[tw`w-full bg-black relative mb-4 rounded-3xl overflow-hidden mx-4`, { height: height * 0.6, width: width - 32 }]}>
              <Image source={{ uri: vid.thumbnail }} style={[tw`absolute opacity-60`, { width: '100%', height: '100%' }]} />
              
              <View style={tw`absolute inset-0 items-center justify-center`}>
                 <TouchableOpacity style={tw`w-16 h-16 bg-black/40 rounded-full items-center justify-center backdrop-blur-md border border-white/20`}>
                    <Play color="white" size={30} fill="white" style={tw`ml-1`} />
                 </TouchableOpacity>
              </View>

              {/* Right Sidebar Actions */}
              <View style={tw`absolute right-4 bottom-20 items-center gap-6`}>
                 <TouchableOpacity style={tw`items-center`}>
                    <Heart color="white" size={28} />
                    <Text style={tw`text-white font-bold text-xs mt-1 shadow-md`}>{vid.likes}</Text>
                 </TouchableOpacity>
                 <TouchableOpacity style={tw`items-center`}>
                    <MessageCircle color="white" size={28} />
                    <Text style={tw`text-white font-bold text-xs mt-1 shadow-md`}>{vid.comments}</Text>
                 </TouchableOpacity>
                 <TouchableOpacity style={tw`items-center`}>
                    <Share2 color="white" size={28} />
                    <Text style={tw`text-white font-bold text-xs mt-1 shadow-md`}>Share</Text>
                 </TouchableOpacity>
                 <TouchableOpacity style={tw`items-center mt-2`}>
                    <MoreVertical color="white" size={24} />
                 </TouchableOpacity>
              </View>

              {/* Bottom Info */}
              <View style={tw`absolute bottom-0 left-0 right-16 p-4 pt-10 bg-gradient-to-t from-black/80 to-transparent`}>
                 <Text style={tw`text-white font-bold text-base mb-1 shadow-md`}>{vid.instructor}</Text>
                 <Text style={tw`text-white/90 text-sm leading-5 shadow-md`} numberOfLines={2}>
                   {vid.title}
                 </Text>
              </View>
           </View>
         ))}
      </ScrollView>
    </SafeAreaView>
  );
}
