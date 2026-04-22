import tw from 'twrnc';
import { View, Text } from 'react-native';

export function LibraryScreen() {
  return (
    <View style={tw`flex-1 items-center justify-center bg-slate-50 dark:bg-slate-900`}>
      <Text style={tw`text-xl font-bold text-slate-900 dark:text-white`}>
        Medical Library
      </Text>
    </View>
  );
}
