import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import tw from 'twrnc';
import { useThemeStore } from '../../store/useThemeStore';

interface EliteCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'elevated' | 'glass' | 'outline';
  noPadding?: boolean;
}

export function EliteCard({ children, style, variant = 'default', noPadding = false }: EliteCardProps) {
  const { getTheme, isDarkMode } = useThemeStore();
  const theme = getTheme();

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: theme.colors.surface,
          shadowColor: theme.colors.primary,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isDarkMode ? 0.4 : 0.1,
          shadowRadius: 12,
          elevation: 8,
        };
      case 'glass':
        return {
          backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.8)',
          borderWidth: 1,
          borderColor: theme.colors.border,
          ...(isDarkMode ? {} : { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 }),
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: theme.colors.border,
        };
      default:
        return {
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
        };
    }
  };

  return (
    <View
      style={[
        tw`rounded-[28px]`,
        !noPadding && tw`p-6`,
        getVariantStyles(),
        style as ViewStyle,
      ]}
    >
      {children}
    </View>
  );
}
