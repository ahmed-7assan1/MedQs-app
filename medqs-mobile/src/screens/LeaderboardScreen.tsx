import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, Image } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useThemeStore } from '../store/useThemeStore';
import { EliteCard } from '../components/ui/EliteCard';
import { ChevronLeft, Trophy, Medal, Star } from 'lucide-react-native';

export function LeaderboardScreen({ navigation }: any) {
  const { getTheme, primaryColor, primaryLight } = useThemeStore();
  const theme = getTheme();

  const leaders = [
    { id: 1, name: 'Ahmed Hassan', score: 9850, avatar: 'https://i.pravatar.cc/150?u=ahmed' },
    { id: 2, name: 'Dr. Sarah Ahmed', score: 9200, avatar: 'https://i.pravatar.cc/150?u=sarah' },
    { id: 3, name: 'Youssef Ali', score: 8900, avatar: 'https://i.pravatar.cc/150?u=youssef' },
    { id: 4, name: 'Nour Mohamed', score: 8400, avatar: 'https://i.pravatar.cc/150?u=nour' },
    { id: 5, name: 'Omar Khaled', score: 8100, avatar: 'https://i.pravatar.cc/150?u=omar' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, backgroundColor: theme.colors.surface, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border }}>
          <ChevronLeft color={theme.colors.text} size={24} />
        </TouchableOpacity>
        <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: 18 }}>Leaderboard</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}>
        {/* Top 3 Podium */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', height: 240, marginBottom: 32 }}>
          <View style={{ alignItems: 'center' }}>
            <Image source={{ uri: leaders[1].avatar }} style={{ width: 60, height: 60, borderRadius: 30, borderWidth: 3, borderColor: theme.colors.border, marginBottom: 8 }} />
            <View style={{ width: 80, backgroundColor: theme.colors.surface, borderTopLeftRadius: 16, borderTopRightRadius: 16, alignItems: 'center', paddingTop: 16, height: 100, borderWidth: 1, borderColor: theme.colors.border }}>
              <Text style={{ color: theme.colors.textMuted, fontWeight: '900', fontSize: 24 }}>2</Text>
              <Text style={{ color: primaryLight, fontSize: 11, fontWeight: '700', marginTop: 8 }}>{leaders[1].score}</Text>
            </View>
          </View>

          <View style={{ alignItems: 'center', marginHorizontal: 8 }}>
            <Trophy color="#fbbf24" size={32} style={{ marginBottom: 8 }} />
            <Image source={{ uri: leaders[0].avatar }} style={{ width: 76, height: 76, borderRadius: 38, borderWidth: 3, borderColor: '#fbbf24', marginBottom: 8 }} />
            <View style={{ width: 96, backgroundColor: primaryColor, borderTopLeftRadius: 16, borderTopRightRadius: 16, alignItems: 'center', paddingTop: 16, height: 140, shadowColor: primaryColor, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 }}>
              <Text style={{ color: 'white', fontWeight: '900', fontSize: 28 }}>1</Text>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '700', marginTop: 8 }}>{leaders[0].score}</Text>
            </View>
          </View>

          <View style={{ alignItems: 'center' }}>
            <Image source={{ uri: leaders[2].avatar }} style={{ width: 60, height: 60, borderRadius: 30, borderWidth: 3, borderColor: '#d97706', marginBottom: 8 }} />
            <View style={{ width: 80, backgroundColor: theme.colors.surface, borderTopLeftRadius: 16, borderTopRightRadius: 16, alignItems: 'center', paddingTop: 16, height: 80, borderWidth: 1, borderColor: theme.colors.border }}>
              <Text style={{ color: '#d97706', fontWeight: '900', fontSize: 24 }}>3</Text>
              <Text style={{ color: primaryLight, fontSize: 11, fontWeight: '700', marginTop: 8 }}>{leaders[2].score}</Text>
            </View>
          </View>
        </View>

        {/* List */}
        <EliteCard variant="glass" noPadding style={{ overflow: 'hidden' }}>
          {leaders.slice(3).map((leader, index) => (
            <View key={leader.id} style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight }}>
              <Text style={{ color: theme.colors.textMuted, fontWeight: '700', width: 24, textAlign: 'center', marginRight: 8 }}>{index + 4}</Text>
              <Image source={{ uri: leader.avatar }} style={{ width: 48, height: 48, borderRadius: 24, marginRight: 16, borderWidth: 1, borderColor: theme.colors.border }} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.colors.text, fontWeight: '700' }}>{leader.name}</Text>
              </View>
              <View style={{ backgroundColor: primaryColor + '20', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: primaryColor + '30', flexDirection: 'row', alignItems: 'center' }}>
                <Star color={primaryLight} size={12} style={{ marginRight: 4 }} />
                <Text style={{ color: primaryLight, fontWeight: '700', fontSize: 12 }}>{leader.score}</Text>
              </View>
            </View>
          ))}
        </EliteCard>
      </ScrollView>
    </SafeAreaView>
  );
}