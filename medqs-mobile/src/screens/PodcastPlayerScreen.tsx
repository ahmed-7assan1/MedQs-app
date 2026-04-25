import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Image, Dimensions } from 'react-native';
import tw from 'twrnc';
import { EliteTheme } from '../constants/Theme';
import { ChevronLeft, Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export function PodcastPlayerScreen({ route, navigation }: any) {
  const { podcastTitle, instructor } = route.params || { podcastTitle: 'Clinical Anatomy Overview', instructor: 'Dr. Sarah Ahmed' };
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0.3); // 30% for mock

  return (
    <SafeAreaView style={tw`flex-1 bg-[${EliteTheme.colors.background}]`}>
      {/* Header */}
      <View style={tw`px-6 pt-6 pb-4 flex-row justify-between items-center`}>
         <TouchableOpacity onPress={() => navigation.goBack()} style={tw`p-2 bg-white/5 rounded-full border border-white/10`}>
            <ChevronLeft color="white" size={24} />
         </TouchableOpacity>
         <Text style={tw`text-white font-bold text-lg`}>Now Playing</Text>
         <View style={tw`w-10`} />
      </View>

      <View style={tw`flex-1 px-8 items-center justify-center`}>
        {/* Cover Art */}
        <View style={[tw`rounded-[40px] overflow-hidden mb-10 shadow-2xl shadow-[${EliteTheme.colors.primaryDark}] border-4 border-white/5`, { width: width * 0.7, height: width * 0.7 }]}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1628102491629-77858ab5721d?q=80&w=1000' }} 
            style={tw`w-full h-full opacity-80`} 
          />
        </View>

        {/* Title & Info */}
        <View style={tw`items-center mb-10`}>
          <Text style={tw`text-2xl font-bold text-white text-center mb-2`} numberOfLines={2}>
            {podcastTitle}
          </Text>
          <Text style={tw`text-[${EliteTheme.colors.primaryLight}] font-medium text-lg`}>{instructor}</Text>
        </View>

        {/* Progress Bar */}
        <View style={tw`w-full mb-10`}>
          <View style={tw`h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mb-3`}>
             <View style={[tw`h-full bg-[${EliteTheme.colors.primary}] rounded-full`, { width: `${progress * 100}%` }]} />
          </View>
          <View style={tw`flex-row justify-between`}>
             <Text style={tw`text-slate-400 text-xs font-bold`}>12:45</Text>
             <Text style={tw`text-slate-400 text-xs font-bold`}>42:30</Text>
          </View>
        </View>

        {/* Controls */}
        <View style={tw`flex-row items-center justify-between w-full px-4`}>
          <TouchableOpacity style={tw`p-3`}>
             <Volume2 color="#64748b" size={24} />
          </TouchableOpacity>
          
          <View style={tw`flex-row items-center`}>
             <TouchableOpacity style={tw`p-4`}>
                <SkipBack color="white" size={32} />
             </TouchableOpacity>
             
             <TouchableOpacity 
               onPress={() => setIsPlaying(!isPlaying)}
               style={tw`w-20 h-20 bg-[${EliteTheme.colors.primary}] rounded-full items-center justify-center shadow-lg shadow-[${EliteTheme.colors.primaryDark}] mx-6`}
             >
                {isPlaying ? (
                  <Pause color="white" size={36} fill="white" />
                ) : (
                  <Play color="white" size={36} fill="white" style={tw`ml-1`} />
                )}
             </TouchableOpacity>
             
             <TouchableOpacity style={tw`p-4`}>
                <SkipForward color="white" size={32} />
             </TouchableOpacity>
          </View>

          <View style={tw`w-10`} />
        </View>
      </View>
    </SafeAreaView>
  );
}
