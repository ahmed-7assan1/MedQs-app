import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, Image } from 'react-native';
import tw from 'twrnc';
import { EliteTheme } from '../constants/Theme';
import { EliteCard } from '../components/ui/EliteCard';
import { ChevronLeft, Trophy, Medal, Star } from 'lucide-react-native';

export function LeaderboardScreen({ navigation }: any) {
  const leaders = [
    { id: 1, name: 'Ahmed Hassan', score: 9850, avatar: 'https://i.pravatar.cc/150?u=ahmed' },
    { id: 2, name: 'Dr. Sarah Ahmed', score: 9200, avatar: 'https://i.pravatar.cc/150?u=sarah' },
    { id: 3, name: 'Youssef Ali', score: 8900, avatar: 'https://i.pravatar.cc/150?u=youssef' },
    { id: 4, name: 'Nour Mohamed', score: 8400, avatar: 'https://i.pravatar.cc/150?u=nour' },
    { id: 5, name: 'Omar Khaled', score: 8100, avatar: 'https://i.pravatar.cc/150?u=omar' },
  ];

  return (
    <SafeAreaView style={tw`flex-1 bg-[${EliteTheme.colors.background}]`}>
      {/* Header */}
      <View style={tw`px-6 pt-6 pb-4 flex-row justify-between items-center`}>
         <TouchableOpacity onPress={() => navigation.goBack()} style={tw`p-2 bg-white/5 rounded-full border border-white/10`}>
            <ChevronLeft color="white" size={24} />
         </TouchableOpacity>
         <Text style={tw`text-white font-bold text-lg`}>Leaderboard</Text>
         <View style={tw`w-10`} />
      </View>

      <ScrollView contentContainerStyle={tw`p-6 pb-32`}>
        {/* Top 3 Podium */}
        <View style={tw`flex-row justify-center items-end h-64 mb-10`}>
          {/* 2nd Place */}
          <View style={tw`items-center`}>
             <View style={tw`w-16 h-16 rounded-full border-4 border-slate-300 overflow-hidden mb-2 z-10`}>
               <Image source={{ uri: leaders[1].avatar }} style={tw`w-full h-full`} />
             </View>
             <View style={[tw`w-20 bg-slate-800 rounded-t-2xl items-center pt-4 border border-white/5`, { height: 120 }]}>
               <Text style={tw`text-slate-300 font-bold text-2xl`}>2</Text>
               <Text style={tw`text-[${EliteTheme.colors.primaryLight}] text-xs font-bold mt-2`}>{leaders[1].score}</Text>
             </View>
          </View>

          {/* 1st Place */}
          <View style={tw`items-center mx-2`}>
             <Trophy color="#fbbf24" size={32} style={tw`mb-2`} />
             <View style={tw`w-20 h-20 rounded-full border-4 border-yellow-400 overflow-hidden mb-2 z-10 shadow-lg shadow-yellow-500/20`}>
               <Image source={{ uri: leaders[0].avatar }} style={tw`w-full h-full`} />
             </View>
             <View style={[tw`w-24 bg-[${EliteTheme.colors.primary}] rounded-t-2xl items-center pt-4 shadow-lg shadow-[${EliteTheme.colors.primaryDark}]`, { height: 160 }]}>
               <Text style={tw`text-white font-black text-3xl`}>1</Text>
               <Text style={tw`text-white/80 text-sm font-bold mt-2`}>{leaders[0].score}</Text>
             </View>
          </View>

          {/* 3rd Place */}
          <View style={tw`items-center`}>
             <View style={tw`w-16 h-16 rounded-full border-4 border-amber-600 overflow-hidden mb-2 z-10`}>
               <Image source={{ uri: leaders[2].avatar }} style={tw`w-full h-full`} />
             </View>
             <View style={[tw`w-20 bg-slate-800 rounded-t-2xl items-center pt-4 border border-white/5`, { height: 100 }]}>
               <Text style={tw`text-amber-600 font-bold text-2xl`}>3</Text>
               <Text style={tw`text-[${EliteTheme.colors.primaryLight}] text-xs font-bold mt-2`}>{leaders[2].score}</Text>
             </View>
          </View>
        </View>

        {/* List */}
        <EliteCard variant="glass" style={tw`p-0 overflow-hidden`}>
           {leaders.slice(3).map((leader, index) => (
             <View key={leader.id} style={tw`flex-row items-center p-4 border-b border-white/5`}>
                <Text style={tw`text-slate-500 font-bold w-6 text-center mr-2`}>{index + 4}</Text>
                <Image source={{ uri: leader.avatar }} style={tw`w-12 h-12 rounded-full mr-4 border border-white/10`} />
                <View style={tw`flex-1`}>
                   <Text style={tw`text-white font-bold`}>{leader.name}</Text>
                </View>
                <View style={tw`bg-[${EliteTheme.colors.primary}]/20 px-3 py-1 rounded-full border border-[${EliteTheme.colors.primary}]/30 flex-row items-center`}>
                   <Star color={EliteTheme.colors.primaryLight} size={12} style={tw`mr-1`} />
                   <Text style={tw`text-[${EliteTheme.colors.primaryLight}] font-bold text-xs`}>{leader.score}</Text>
                </View>
             </View>
           ))}
        </EliteCard>
      </ScrollView>
    </SafeAreaView>
  );
}
