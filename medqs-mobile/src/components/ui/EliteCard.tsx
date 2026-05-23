import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import { useThemeStore } from '../../store/useThemeStore';

interface EliteCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'elevated' | 'glass' | 'outline' | 'premium';
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
          shadowOpacity: isDarkMode ? 0.25 : 0.1,
          shadowRadius: 16,
          elevation: 8,
          borderWidth: 0,
        };
      case 'glass':
        return {
          backgroundColor: isDarkMode ? 'rgba(13, 14, 23, 0.6)' : 'rgba(255, 255, 255, 0.85)',
          borderWidth: 1,
          borderColor: theme.colors.border,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDarkMode ? 0.3 : 0.05,
          shadowRadius: 12,
          elevation: 4,
        };
      case 'premium':
        return {
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
          shadowColor: theme.colors.primary,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.1,
          shadowRadius: 20,
          elevation: 6,
          overflow: 'hidden',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderStyle: 'dashed',
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
        {
          borderRadius: variant === 'glass' ? 28 : 24,
          padding: noPadding ? 0 : variant === 'outline' ? 20 : 20,
        },
        getVariantStyles(),
        style as ViewStyle,
      ]}
    >
      {children}
    </View>
  );
}