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
        return EliteTheme.shadows.medium;
      case 'glass':
        return {
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.3)',
        };
      default:
        return EliteTheme.shadows.soft;
    }
  };

  return (
    <View
      style={[
        tw`bg-white rounded-[32px]`,
        !noPadding && tw`p-5`,
        getVariantStyles() as ViewStyle,
        style,
      ]}
    >
      {children}
    </View>
  );
}
