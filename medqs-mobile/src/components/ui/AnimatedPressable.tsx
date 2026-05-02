/**
 * AnimatedPressable
 * Drop-in replacement for TouchableOpacity with a spring scale micro-animation.
 * Usage:
 *   <AnimatedPressable onPress={...} style={...}>
 *     <Text>Press me</Text>
 *   </AnimatedPressable>
 */
import React from 'react';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { StyleProp, ViewStyle } from 'react-native';

interface AnimatedPressableProps {
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  scaleTo?: number;
  disabled?: boolean;
}

export function AnimatedPressable({
  onPress,
  style,
  children,
  scaleTo = 0.93,
  disabled = false,
}: AnimatedPressableProps) {
  const scale = useSharedValue(1);

  const tap = Gesture.Tap()
    .runOnJS(true)
    .onBegin(() => {
      if (!disabled) scale.value = withSpring(scaleTo, { damping: 15, stiffness: 300 });
    })
    .onFinalize(() => {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    })
    .onEnd(() => {
      if (!disabled && onPress) onPress();
    });

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <GestureDetector gesture={tap}>
      <Animated.View style={[style, animStyle]}>{children}</Animated.View>
    </GestureDetector>
  );
}
