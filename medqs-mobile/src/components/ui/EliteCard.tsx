import React from 'react';
import { View, ViewStyle, Platform } from 'react-native';
import tw from 'twrnc';
import { EliteTheme } from '../../constants/Theme';

interface EliteCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'glass';
  noPadding?: boolean;
}

export function EliteCard({ children, style, variant = 'default', noPadding = false }: EliteCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'elevated':
        return EliteTheme.shadows.glow;
      case 'glass':
        return {
          backgroundColor: 'rgba(30, 41, 59, 0.7)', // Slate 800 with opacity
          borderWidth: 1,
          borderColor: EliteTheme.colors.borderLight,
        };
      default:
        return {
          backgroundColor: EliteTheme.colors.surface,
          borderWidth: 1,
          borderColor: EliteTheme.colors.border,
        };
    }
  };

  return (
    <View
      style={[
        tw`rounded-[24px]`,
        !noPadding && tw`p-5`,
        getVariantStyles() as ViewStyle,
        style,
      ]}
    >
      {children}
    </View>
  );
}
