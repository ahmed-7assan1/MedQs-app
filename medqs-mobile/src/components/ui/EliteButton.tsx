import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleProp, ViewStyle, TextStyle } from 'react-native';
import tw from 'twrnc';
import { useThemeStore } from '../../store/useThemeStore';
import * as Haptics from 'expo-haptics';

interface Props {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
}

export function EliteButton({ title, onPress, loading, variant = 'primary', style, textStyle, disabled }: Props) {
  const { getTheme, primaryColor } = useThemeStore();
  const theme = getTheme();

  const handlePress = () => {
    if (loading || disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  const getVariantStyle = () => {
    switch (variant) {
      case 'primary':
        return { backgroundColor: primaryColor };
      case 'secondary':
        return { backgroundColor: theme.colors.surfaceLight };
      case 'outline':
        return { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.colors.border };
      case 'danger':
        return { backgroundColor: theme.colors.danger };
      default:
        return { backgroundColor: primaryColor };
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      disabled={loading || disabled}
      style={[
        tw`h-14 rounded-2xl items-center justify-center px-6`,
        getVariantStyle(),
        disabled && tw`opacity-50`,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? primaryColor : 'white'} />
      ) : (
        <Text
          style={[
            tw`font-bold text-base`,
            { color: variant === 'outline' ? theme.colors.text : 'white' },
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}
