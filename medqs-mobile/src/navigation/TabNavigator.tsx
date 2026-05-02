import React from 'react';
import { View, Text, Pressable } from 'react-native';
import tw from 'twrnc';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, MessageSquare, Layers, User, PlaySquare, Activity } from 'lucide-react-native';
import { HomeScreen } from '../screens/HomeScreen';
import { LibraryScreen } from '../screens/LibraryScreen';
import { CommunityScreen } from '../screens/CommunityScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { VideoHubScreen } from '../screens/VideoHubScreen';
import { Atlas3DScreen } from '../screens/Atlas3DScreen';
import { useThemeStore } from '../store/useThemeStore';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const Tab = createBottomTabNavigator();

function TabButton({ route, isFocused, options, onPress }: any) {
  const { primaryColor, getTheme } = useThemeStore();
  const theme = getTheme();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const Icon = options.tabBarIcon;
  const label = options.tabBarLabel ?? options.title ?? route.name;

  return (
    <Pressable
      onPressIn={() => { scale.value = withSpring(0.88, { damping: 14, stiffness: 300 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 14, stiffness: 300 }); }}
      onPress={onPress}
      style={tw`flex-1 items-center justify-center`}
    >
      <Animated.View style={[
        tw`p-2.5 px-3 rounded-2xl flex-row items-center`,
        animStyle,
        isFocused ? { backgroundColor: primaryColor } : {}
      ]}>
        <Icon color={isFocused ? 'white' : theme.colors.textMuted} size={18} />
        {isFocused && (
          <Text style={tw`text-white font-bold ml-2 text-[10px] uppercase tracking-tighter`}>{label}</Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

function MyTabBar({ state, descriptors, navigation }: any) {
  const { getTheme } = useThemeStore();
  const theme = getTheme();
  
  return (
    <View style={[
      tw`absolute bottom-6 left-4 right-4 flex-row rounded-[32px] p-2 items-center justify-between shadow-2xl border`,
      { 
        height: 70, 
        backgroundColor: theme.colors.surface + 'EE',
        borderColor: theme.colors.border
      }
    ]}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
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
        options={{ tabBarIcon: (props) => <Home {...props} /> }}
      />
      <Tab.Screen 
        name="Atlas" 
        component={Atlas3DScreen} 
        options={{ tabBarLabel: 'Atlas', tabBarIcon: (props) => <Activity {...props} /> }}
      />
      <Tab.Screen 
        name="Video Hub" 
        component={VideoHubScreen} 
        options={{ tabBarLabel: 'Video', tabBarIcon: (props) => <PlaySquare {...props} /> }}
      />
      <Tab.Screen 
        name="Community" 
        component={CommunityScreen} 
        options={{ tabBarIcon: (props) => <MessageSquare {...props} /> }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ tabBarIcon: (props) => <User {...props} /> }}
      />
    </Tab.Navigator>
  );
}

