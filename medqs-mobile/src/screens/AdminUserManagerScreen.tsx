import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, TextInput, FlatList, ActivityIndicator, StatusBar, Alert, Modal } from 'react-native';
import tw from 'twrnc';
import { useThemeStore } from '../store/useThemeStore';
import { ChevronLeft, Search, User, Shield, CheckCircle, XCircle, MoreVertical, Mail, Award, Globe, BookOpen } from 'lucide-react-native';
import { mobileApi } from '../lib/api';
import Animated, { FadeInRight } from 'react-native-reanimated';

export function AdminUserManagerScreen({ navigation }: any) {
  const { getTheme, primaryColor, isDarkMode } = useThemeStore();
  const theme = getTheme();
  
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showOptions, setShowOptions] = useState(false);

  const fetchUsers = async () => {
    try {
      const data = await mobileApi.getAdminUsers();
      setUsers(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await mobileApi.updateUserStatus(userId, !currentStatus);
      setUsers(users.map(u => u.id === userId ? { ...u, isActive: !currentStatus } : u));
    } catch (err) {
      Alert.alert('Error', 'Failed to update user status');
    }
  };

  const changeRole = async (userId: string, newRole: string) => {
    try {
      await mobileApi.updateUserRole(userId, newRole);
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setShowOptions(false);
    } catch (err) {
      Alert.alert('Error', 'Failed to update role');
    }
  };

  const UserItem = ({ item }: { item: any }) => (
    <Animated.View 
      entering={FadeInRight}
      style={[tw`p-5 rounded-[28px] mb-4 border shadow-sm`, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
    >
      <View style={tw`flex-row items-center mb-4`}>
        <View style={[tw`w-14 h-14 rounded-2xl items-center justify-center mr-4`, { backgroundColor: primaryColor + '10' }]}>
          <User color={primaryColor} size={28} />
        </View>
        <View style={tw`flex-1`}>
          <View style={tw`flex-row items-center`}>
            <Text style={[tw`font-bold text-lg`, { color: theme.colors.text }]}>{item.name}</Text>
            {item.role === 'ADMIN' && (
              <View style={[tw`ml-2 px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20`]}>
                <Text style={tw`text-[8px] font-black text-purple-500 uppercase`}>Admin</Text>
              </View>
            )}
          </View>
          <Text style={[tw`text-xs`, { color: theme.colors.textMuted }]}>{item.email}</Text>
        </View>
        <TouchableOpacity 
          onPress={() => { setSelectedUser(item); setShowOptions(true); }}
          style={tw`p-2`}
        >
          <MoreVertical color={theme.colors.textMuted} size={20} />
        </TouchableOpacity>
      </View>

      <View style={tw`flex-row flex-wrap gap-2 mb-4`}>
        <View style={[tw`flex-row items-center px-3 py-1.5 rounded-xl bg-black/5`, { backgroundColor: theme.colors.background }]}>
          <Award color={primaryColor} size={12} style={tw`mr-1.5`} />
          <Text style={[tw`text-[10px] font-bold`, { color: theme.colors.text }]}>{item.points || 0} XP</Text>
        </View>
        <View style={[tw`flex-row items-center px-3 py-1.5 rounded-xl bg-black/5`, { backgroundColor: theme.colors.background }]}>
          <Globe color={theme.colors.textMuted} size={12} style={tw`mr-1.5`} />
          <Text style={[tw`text-[10px] font-bold`, { color: theme.colors.textMuted }]}>{item.university?.name || 'جامعة غير محددة'}</Text>
        </View>
        {item.semester && (
          <View style={[tw`flex-row items-center px-3 py-1.5 rounded-xl bg-black/5`, { backgroundColor: theme.colors.background }]}>
            <BookOpen color={theme.colors.textMuted} size={12} style={tw`mr-1.5`} />
            <Text style={[tw`text-[10px] font-bold`, { color: theme.colors.textMuted }]}>{item.semester?.name}</Text>
          </View>
        )}
      </View>

      <View style={tw`flex-row justify-between items-center pt-4 border-t border-dashed border-slate-700/20`}>
        <View style={tw`flex-row items-center`}>
          <View style={[tw`w-2 h-2 rounded-full mr-2`, { backgroundColor: item.isActive ? theme.colors.success : theme.colors.danger }]} />
          <Text style={[tw`text-[10px] font-black uppercase tracking-widest`, { color: item.isActive ? theme.colors.success : theme.colors.danger }]}>
            {item.isActive ? 'Active Student' : 'Disabled Account'}
          </Text>
        </View>
        <TouchableOpacity 
          onPress={() => toggleUserStatus(item.id, item.isActive)}
          style={[tw`px-4 py-2 rounded-xl border`, { 
            backgroundColor: item.isActive ? theme.colors.danger + '10' : theme.colors.success + '10',
            borderColor: item.isActive ? theme.colors.danger + '30' : theme.colors.success + '30'
          }]}
        >
          <Text style={[tw`text-[10px] font-bold uppercase`, { color: item.isActive ? theme.colors.danger : theme.colors.success }]}>
            {item.isActive ? 'تعطيل الحساب' : 'تفعيل الحساب'}
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      <View style={tw`px-6 pt-4 pb-4`}>
        <View style={tw`flex-row items-center mb-6`}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={[tw`p-3 rounded-2xl border`, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
          >
            <ChevronLeft color={theme.colors.text} size={24} />
          </TouchableOpacity>
          <View style={tw`ml-4`}>
            <Text style={[tw`font-black text-2xl`, { color: theme.colors.text }]}>إدارة المستخدمين</Text>
            <Text style={[tw`text-xs font-bold uppercase tracking-widest`, { color: theme.colors.textMuted }]}>
              {users.length} مستخدم مسجل
            </Text>
          </View>
        </View>

        <View style={[tw`h-14 rounded-2xl px-5 flex-row items-center border shadow-sm`, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Search color={theme.colors.textMuted} size={20} style={tw`mr-3`} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="البحث بالاسم أو البريد..."
            placeholderTextColor={theme.colors.textMuted}
            style={[tw`flex-1 font-bold`, { color: theme.colors.text }]}
          />
        </View>
      </View>

      {loading ? (
        <View style={tw`flex-1 items-center justify-center`}>
          <ActivityIndicator color={primaryColor} size="large" />
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <UserItem item={item} />}
          contentContainerStyle={tw`px-6 pb-32 pt-2`}
          showsVerticalScrollIndicator={false}
          onRefresh={fetchUsers}
          refreshing={refreshing}
        />
      )}

      {/* Role Options Modal */}
      <Modal visible={showOptions} transparent animationType="fade">
        <TouchableOpacity 
          style={tw`flex-1 bg-black/60 items-center justify-end pb-10`}
          onPress={() => setShowOptions(false)}
        >
          <View style={[tw`w-[90%] p-6 rounded-[32px]`, { backgroundColor: theme.colors.surface }]}>
            <Text style={[tw`text-xl font-black mb-6 text-center`, { color: theme.colors.text }]}>خيارات المستخدم</Text>
            
            <TouchableOpacity 
              onPress={() => changeRole(selectedUser.id, selectedUser.role === 'ADMIN' ? 'USER' : 'ADMIN')}
              style={[tw`flex-row items-center p-4 rounded-2xl mb-3`, { backgroundColor: theme.colors.background }]}
            >
              <Shield color={primaryColor} size={20} style={tw`mr-4`} />
              <Text style={[tw`font-bold`, { color: theme.colors.text }]}>
                {selectedUser?.role === 'ADMIN' ? 'تغيير إلى مستخدم عادي' : 'تعيين كمسؤول (Admin)'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[tw`flex-row items-center p-4 rounded-2xl`, { backgroundColor: theme.colors.danger + '10' }]}
              onPress={() => setShowOptions(false)}
            >
              <XCircle color={theme.colors.danger} size={20} style={tw`mr-4`} />
              <Text style={[tw`font-bold`, { color: theme.colors.danger }]}>إلغاء</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

