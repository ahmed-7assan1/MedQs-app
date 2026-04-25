import React from 'react';
import { View, TouchableOpacity, Text, SafeAreaView, Platform } from 'react-native';
import tw from 'twrnc';
import { EliteTheme } from '../constants/Theme';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, BookOpen, MessageSquare, User, CheckSquare, Layers, PlaySquare } from 'lucide-react-native';
import { HomeScreen } from '../screens/HomeScreen';
import { LibraryScreen } from '../screens/LibraryScreen';
import { CommunityScreen } from '../screens/CommunityScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { VideoHubScreen } from '../screens/VideoHubScreen';

const Tab = createBottomTabNavigator();

function MyTabBar({ state, descriptors, navigation }: any) {
  return (
    <View style={[
      tw`absolute bottom-6 left-6 right-6 flex-row rounded-[32px] p-2 items-center justify-between shadow-2xl`,
      { height: 70, borderTopWidth: 0, backgroundColor: 'rgba(15, 23, 42, 0.85)' }
    ]}>
      {state.routes.map((route: any, index: any) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel !== undefined ? options.tabBarLabel : options.title !== undefined ? options.title : route.name;
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
             navigation.navigate(route.name, route.params);
          }
        };

        const Icon = options.tabBarIcon;

        return (
          <TouchableOpacity
            key={index}
            onPress={onPress}
            style={tw`flex-1 items-center justify-center`}
          >
            <View style={[
              tw`p-2.5 px-4 rounded-2xl flex-row items-center`,
              isFocused ? { backgroundColor: EliteTheme.colors.primary } : {}
            ]}>
              <Icon color={isFocused ? "white" : EliteTheme.colors.textMuted} size={20} />
              {isFocused && (
                <Text style={tw`text-white font-bold ml-2 text-[10px] uppercase tracking-tighter`}>{label}</Text>
              )}
            </View>
          </TouchableOpacity>
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
        sceneContainerStyle: { backgroundColor: EliteTheme.colors.background }
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ tabBarIcon: (props) => <Home {...props} /> }}
      />
      <Tab.Screen 
        name="Library" 
        component={LibraryScreen} 
        options={{ tabBarIcon: (props) => <Layers {...props} /> }}
      />
      <Tab.Screen 
        name="Video Hub" 
        component={VideoHubScreen} 
        options={{ tabBarIcon: (props) => <PlaySquare {...props} /> }}
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
