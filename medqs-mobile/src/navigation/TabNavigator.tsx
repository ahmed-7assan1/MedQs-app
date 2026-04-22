import React from 'react';
import { View, TouchableOpacity, Text, SafeAreaView } from 'react-native';
import tw from 'twrnc';
import { EliteTheme } from '../constants/Theme';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, BookOpen, PenTool, User } from 'lucide-react-native';
import { HomeScreen } from '../screens/HomeScreen';
import { LibraryScreen } from '../screens/LibraryScreen';
import { QuizzesScreen } from '../screens/QuizzesScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

function MyTabBar({ state, descriptors, navigation }: any) {
  return (
    <View style={tw`absolute bottom-8 left-10 right-10 flex-row bg-[#0f172a] rounded-full p-2 items-center justify-between shadow-lg`}>
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
            style={tw`flex-1 items-center justify-center py-2 h-12`}
          >
            <View style={[
              tw`p-2 px-4 rounded-full flex-row items-center`,
              isFocused ? tw`bg-white` : {}
            ]}>
              <Icon color={isFocused ? "#0f172a" : "#94a3b8"} size={22} />
              {isFocused && (
                <Text style={tw`text-[#0f172a] font-bold ml-2 text-xs`}>{label}</Text>
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
        options={{ tabBarIcon: (props) => <BookOpen {...props} /> }}
      />
      <Tab.Screen 
        name="Quizzes" 
        component={QuizzesScreen} 
        options={{ tabBarIcon: (props) => <PenTool {...props} /> }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ tabBarIcon: (props) => <User {...props} /> }}
      />
    </Tab.Navigator>
  );
}
