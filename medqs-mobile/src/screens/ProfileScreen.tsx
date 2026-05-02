import React, { useState } from 'react';
import { 
  View, Text, TouchableOpacity, ScrollView, Image, 
  SafeAreaView, Switch, StatusBar, Dimensions, ImageBackground
} from 'react-native';
import tw from 'twrnc';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { 
  Settings, LogOut, Shield, Bell, 
  HelpCircle, ChevronRight, BookOpen, 
  Award, Clock, User as UserIcon, Download,
  Activity, Zap, Moon, CreditCard, Share2
} from 'lucide-react-native';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export function ProfileScreen({ navigation }: any) {
  const { user, logout } = useAuthStore();
  const { primaryColor, primaryLight } = useThemeStore();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const handleLogout = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    logout();
  };

  const MenuOption = ({ icon: Icon, label, value, onPress, color = "white", isLast = false, toggleValue, onToggle }: any) => (
    <TouchableOpacity 
      activeOpacity={0.7}
      onPress={onPress}
      disabled={onToggle !== undefined}
      style={[
        tw`flex-row items-center p-4`,
        !isLast && tw`border-b border-white/5`
      ]}
    >
       <View style={[tw`w-10 h-10 rounded-xl items-center justify-center mr-4`, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
          <Icon color={color} size={20} />
       </View>
       <Text style={tw`flex-1 text-white font-bold`}>{label}</Text>
       {onToggle ? (
         <Switch 
           value={toggleValue} 
           onValueChange={onToggle}
           trackColor={{ false: '#1E2D4D', true: primaryColor }}
           thumbColor={'#fff'}
         />
       ) : (
         <View style={tw`flex-row items-center`}>
            {value && <Text style={tw`text-slate-500 mr-2 font-bold`}>{value}</Text>}
            <ChevronRight color="#3B4A6B" size={18} />
         </View>
       )}
    </TouchableOpacity>
  );

  return (
    <View style={tw`flex-1 bg-black`}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={tw`pb-32`}>
        
        {/* Header / Profile Card */}
        <ImageBackground 
          source={require('../../assets/medical_login_bg.png')} 
          style={tw`pt-16 pb-12 px-6 items-center`}
          imageStyle={{ opacity: 0.1, borderBottomLeftRadius: 40, borderBottomRightRadius: 40 }}
        >
           <Animated.View entering={FadeInDown} style={tw`relative mb-6`}>
              <View style={tw`w-32 h-32 rounded-[48px] bg-[#0D1117] border-4 border-[#1E2D4D] overflow-hidden shadow-2xl`}>
                 <Image 
                   source={{ uri: user?.image || `https://ui-avatars.com/api/?name=${user?.name || 'Doctor'}&background=0D1117&color=fff&size=256` }} 
                   style={tw`w-full h-full`}
                 />
              </View>
              <View style={[tw`absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl items-center justify-center border-4 border-black`, { backgroundColor: primaryColor }]}>
                 <Zap color="white" size={16} fill="white" />
              </View>
           </Animated.View>

           <Animated.Text entering={FadeInDown.delay(100)} style={tw`text-3xl font-black text-white text-center`}>
              {user?.name || 'Medical Student'}
           </Animated.Text>
           <Animated.Text entering={FadeInDown.delay(200)} style={tw`text-slate-500 font-bold text-center mt-1`}>
              {user?.email}
           </Animated.Text>

           <Animated.View entering={FadeInDown.delay(300)} style={tw`flex-row mt-6 space-x-3`}>
              <TouchableOpacity style={tw`px-6 py-2.5 bg-white/5 border border-white/10 rounded-2xl flex-row items-center`}>
                 <CreditCard color={primaryLight} size={16} style={tw`mr-2`} />
                 <Text style={tw`text-white font-black text-xs`}>Medical ID</Text>
              </TouchableOpacity>
              <TouchableOpacity style={tw`p-2.5 bg-white/5 border border-white/10 rounded-2xl`}>
                 <Share2 color="white" size={16} />
              </TouchableOpacity>
           </Animated.View>
        </ImageBackground>

        <View style={tw`px-6 -mt-8`}>
           {/* Stats Summary */}
           <Animated.View entering={FadeInUp.delay(400)} style={tw`flex-row bg-[#0D1117] border border-[#1E2D4D] rounded-[32px] p-6 shadow-xl`}>
              <View style={tw`flex-1 items-center border-r border-white/5`}>
                 <Text style={tw`text-white font-black text-xl mb-1`}>1,250</Text>
                 <Text style={tw`text-slate-500 text-[10px] font-black uppercase tracking-widest`}>Points</Text>
              </View>
              <View style={tw`flex-1 items-center border-r border-white/5`}>
                 <Text style={tw`text-white font-black text-xl mb-1`}>#12</Text>
                 <Text style={tw`text-slate-500 text-[10px] font-black uppercase tracking-widest`}>Rank</Text>
              </View>
              <View style={tw`flex-1 items-center`}>
                 <Text style={tw`text-white font-black text-xl mb-1`}>Level 4</Text>
                 <Text style={tw`text-slate-500 text-[10px] font-black uppercase tracking-widest`}>Badge</Text>
              </View>
           </Animated.View>

           {/* Menu Groups */}
           <View style={tw`mt-10`}>
              <Text style={tw`text-slate-500 font-black text-xs uppercase tracking-widest mb-4 ml-2`}>Learning Experience</Text>
              <View style={tw`bg-[#0D1117] border border-[#1E2D4D] rounded-[32px] overflow-hidden mb-8`}>
                 <MenuOption icon={BookOpen} label="My Courses" value="12 Active" />
                 <MenuOption icon={Award} label="Achievements" value="8 Earned" />
                 <MenuOption icon={Download} label="Offline Content" isLast />
              </View>

              <Text style={tw`text-slate-500 font-black text-xs uppercase tracking-widest mb-4 ml-2`}>Settings</Text>
              <View style={tw`bg-[#0D1117] border border-[#1E2D4D] rounded-[32px] overflow-hidden mb-8`}>
                 <MenuOption icon={Bell} label="Push Notifications" onToggle={setPushEnabled} toggleValue={pushEnabled} />
                 <MenuOption icon={Moon} label="Dark Mode" onToggle={setDarkMode} toggleValue={darkMode} />
                 <MenuOption icon={Shield} label="Privacy & Security" isLast />
              </View>

              {isAdmin && (
                <>
                  <Text style={[tw`font-black text-xs uppercase tracking-widest mb-4 ml-2`, { color: primaryColor }]}>Administration</Text>
                  <View style={[tw`bg-[#0D1117] border rounded-[32px] overflow-hidden mb-8`, { borderColor: primaryColor + '40' }]}>
                     <MenuOption icon={Activity} label="Admin Dashboard" color={primaryColor} onPress={() => navigation.navigate('AdminDashboard')} isLast />
                  </View>
                </>
              )}

              <TouchableOpacity 
                onPress={handleLogout}
                style={tw`flex-row items-center p-6 bg-red-500/10 border border-red-500/20 rounded-[32px] mb-10`}
              >
                 <View style={tw`w-10 h-10 bg-red-500/20 rounded-xl items-center justify-center mr-4 border border-red-500/30`}>
                    <LogOut color="#ef4444" size={20} />
                 </View>
                 <Text style={tw`flex-1 text-red-500 font-black text-lg`}>Sign Out</Text>
                 <ChevronRight color="#ef4444" size={20} opacity={0.5} />
              </TouchableOpacity>
           </View>
        </View>

      </ScrollView>
    </View>
  );
}
