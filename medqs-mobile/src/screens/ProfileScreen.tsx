import tw from 'twrnc';
import { View, Text, TouchableOpacity } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';

export function ProfileScreen() {
  const { user, logout } = useAuthStore();

  return (
    <View style={tw`flex-1 items-center justify-center bg-slate-50 dark:bg-slate-900 p-6`}>
      <View style={tw`items-center mb-8`}>
        <View style={tw`w-24 h-24 bg-blue-100 rounded-full items-center justify-center mb-4`}>
          <Text style={tw`text-4xl text-blue-600 font-bold`}>{user?.name?.charAt(0) || 'U'}</Text>
        </View>
        <Text style={tw`text-2xl font-bold text-slate-900 dark:text-white mb-1`}>
          {user?.name || 'Medical Student'}
        </Text>
        <Text style={tw`text-slate-500 dark:text-slate-400`}>
          {user?.email}
        </Text>
      </View>

      <TouchableOpacity 
        style={tw`w-full bg-red-500 p-4 rounded-xl items-center`}
        onPress={logout}
      >
        <Text style={tw`text-white font-bold text-lg`}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}
