import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, MessageSquare, Layers, User, PlaySquare, Activity } from 'lucide-react-native';
import { HomeScreen } from '../screens/HomeScreen';
import { LibraryScreen } from '../screens/LibraryScreen';
import { CommunityScreen } from '../screens/CommunityScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { VideoHubScreen } from '../screens/VideoHubScreen';
import { Atlas3DScreen } from '../screens/Atlas3DScreen';
import { useThemeStore } from '../store/useThemeStore';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, FadeIn } from 'react-native-reanimated';

const Tab = createBottomTabNavigator();

function TabButton({ route, isFocused, options, onPress }: any) {
  const { primaryColor, getTheme } = useThemeStore();
  const theme = getTheme();
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
  }));

  const Icon = options.tabBarIcon;
  const label = options.tabBarLabel ?? options.title ?? route.name;

  return (
    <Pressable
      onPressIn={() => {
        scale.value = withSpring(0.88, { damping: 14, stiffness: 300 });
        translateY.value = withSpring(-4, { damping: 14, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 14, stiffness: 300 });
        translateY.value = withSpring(0, { damping: 14, stiffness: 300 });
      }}
      onPress={onPress}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 }}
    >
      <Animated.View style={[
        {
          padding: 10,
          borderRadius: isFocused ? 20 : 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: isFocused ? 6 : 0,
        },
        isFocused && { backgroundColor: primaryColor + '20' },
        animStyle,
      ]}>
        <Icon
          color={isFocused ? primaryColor : theme.colors.textMuted}
          size={isFocused ? 20 : 20}
          strokeWidth={isFocused ? 2.5 : 2}
        />
        {isFocused && (
          <Animated.Text
            entering={FadeIn.duration(200)}
            style={{
              color: primaryColor,
              fontWeight: '800',
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            {label}
          </Animated.Text>
        )}
      </Animated.View>
      {isFocused && (
        <View style={{
          width: 4, height: 4, borderRadius: 2,
          backgroundColor: primaryColor,
          marginTop: 2,
        }} />
      )}
    </Pressable>
  );
}

function MyTabBar({ state, descriptors, navigation }: any) {
  const { getTheme, isDarkMode } = useThemeStore();
  const theme = getTheme();

  return (
    <View style={{
      position: 'absolute',
      bottom: 20,
      left: 16,
      right: 16,
      flexDirection: 'row',
      borderRadius: 32,
      paddingVertical: 4,
      paddingHorizontal: 8,
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: isDarkMode
        ? 'rgba(13, 14, 23, 0.92)'
        : 'rgba(255, 255, 255, 0.92)',
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDarkMode ? 0.5 : 0.1,
      shadowRadius: 24,
      elevation: 10,
      height: 64,
    }}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };
        return (
          <TabButton
            key={index}
            route={route}
            isFocused={isFocused}
            options={options}
            onPress={onPress}
          />
        );
      })}
    </View>
  );
}

export function TabNavigator() {
  const { getTheme } = useThemeStore();
  const theme = getTheme();

  return (
    <Tab.Navigator
      tabBar={props => <MyTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: 'Home', tabBarIcon: (props) => <Home {...props} /> }}
      />
      <Tab.Screen
        name="Library"
        component={LibraryScreen}
        options={{ tabBarLabel: 'Learn', tabBarIcon: (props) => <Layers {...props} /> }}
      />
      <Tab.Screen
        name="Video Hub"
        component={VideoHubScreen}
        options={{ tabBarLabel: 'Media', tabBarIcon: (props) => <PlaySquare {...props} /> }}
      />
      <Tab.Screen
        name="Community"
        component={CommunityScreen}
        options={{ tabBarLabel: 'Social', tabBarIcon: (props) => <MessageSquare {...props} /> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile', tabBarIcon: (props) => <User {...props} /> }}
      />
    </Tab.Navigator>
  );
}