import React, { useEffect, useRef } from 'react';
import { View, Animated, ViewStyle, StyleSheet } from 'react-native';
import tw from 'twrnc';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  mb?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 20, borderRadius = 8, mb = 0, style }: SkeletonProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.1, 0.3],
  });

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height: height as any,
          borderRadius,
          backgroundColor: '#1E2D4D',
          opacity,
          marginBottom: mb * 4,
        },
        style,
      ]}
    />
  );
}
