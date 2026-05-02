import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import tw from 'twrnc';
import { useThemeStore } from '../../store/useThemeStore';
import { CheckCircle2 } from 'lucide-react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';

interface Props {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export function EliteSelectItem({ label, selected, onPress }: Props) {
  const { getTheme, primaryColor } = useThemeStore();
  const theme = getTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        tw`flex-row items-center justify-between px-5 py-5 rounded-2xl mb-4 border`,
        selected
          ? { backgroundColor: primaryColor + '10', borderColor: primaryColor }
          : { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
      ]}
    >
      <Text style={[tw`font-bold text-base flex-1 mr-3`, { color: selected ? primaryColor : theme.colors.text }]}>
        {label}
      </Text>
      {selected && (
        <Animated.View entering={FadeInRight}>
          <CheckCircle2 color={primaryColor} size={22} strokeWidth={3} />
        </Animated.View>
      )}
    </TouchableOpacity>
  );
}
