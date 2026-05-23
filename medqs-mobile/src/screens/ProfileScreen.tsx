import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Image,
  SafeAreaView, Switch, Dimensions,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Settings, LogOut, Shield, Bell,
  HelpCircle, ChevronRight, BookOpen,
  Award, Clock, User as UserIcon, Download,
  Activity, Zap, Moon, CreditCard, Share2,
} from 'lucide-react-native';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export function ProfileScreen({ navigation }: any) {
  const { user, logout } = useAuthStore();
  const { primaryColor, primaryLight, getTheme, isDarkMode, toggleDarkMode } = useThemeStore();
  const theme = getTheme();

  const [pushEnabled, setPushEnabled] = useState(true);
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const handleLogout = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    logout();
  };

  const MenuOption = ({ icon: Icon, label, value, onPress, color, isLast, toggleValue, onToggle }: any) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      disabled={onToggle !== undefined}
      style={{
        flexDirection: 'row', alignItems: 'center', padding: 16,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: theme.colors.borderLight,
      }}
    >
      <View style={{
        width: 40, height: 40, borderRadius: 14,
        backgroundColor: theme.colors.surfaceLight,
        alignItems: 'center', justifyContent: 'center',
        marginRight: 16,
      }}>
        <Icon color={color || theme.colors.text} size={20} />
      </View>
      <Text style={{ flex: 1, color: theme.colors.text, fontWeight: '700', fontSize: 14 }}>{label}</Text>
      {onToggle ? (
        <Switch
          value={toggleValue}
          onValueChange={onToggle}
          trackColor={{ false: theme.colors.border, true: primaryColor + '60' }}
          thumbColor={toggleValue ? primaryColor : theme.colors.textMuted}
        />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {value && <Text style={{ color: theme.colors.textMuted, marginRight: 8, fontWeight: '700', fontSize: 12 }}>{value}</Text>}
          <ChevronRight color={theme.colors.textMuted} size={16} />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>

        {/* ── Profile Header ── */}
        <View style={{
          paddingTop: 40, paddingBottom: 48,
          paddingHorizontal: 24,
          alignItems: 'center',
          backgroundColor: theme.colors.background,
          borderBottomLeftRadius: 48,
          borderBottomRightRadius: 48,
        }}>
          {/* Avatar */}
          <Animated.View entering={FadeInDown} style={{ position: 'relative', marginBottom: 20 }}>
            <View style={{
              width: 120, height: 120, borderRadius: 40,
              backgroundColor: theme.colors.surface,
              borderWidth: 3, borderColor: primaryColor + '40',
              overflow: 'hidden',
              shadowColor: primaryColor,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.2,
              shadowRadius: 20,
              elevation: 8,
            }}>
              <Image
                source={{ uri: user?.image || `https://ui-avatars.com/api/?name=${user?.name || 'Doctor'}&background=${encodeURIComponent(theme.colors.surface.replace('#',''))}&color=${primaryColor.replace('#','')}&size=256` }}
                style={{ width: '100%', height: '100%' }}
              />
            </View>
            <View style={{
              position: 'absolute', bottom: -4, right: -4,
              width: 40, height: 40, borderRadius: 16,
              backgroundColor: primaryColor,
              alignItems: 'center', justifyContent: 'center',
              borderWidth: 3, borderColor: theme.colors.background,
              shadowColor: primaryColor,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            }}>
              <Zap color="white" size={18} fill="white" />
            </View>
          </Animated.View>

          {/* Name & Email */}
          <Animated.Text entering={FadeInDown.delay(100)}
            style={{ color: theme.colors.text, fontSize: 26, fontWeight: '900', textAlign: 'center', letterSpacing: -0.5 }}>
            {user?.name || 'Medical Student'}
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(150)}
            style={{ color: theme.colors.textMuted, fontWeight: '700', textAlign: 'center', marginTop: 4, fontSize: 13 }}>
            {user?.email}
          </Animated.Text>

          {/* Action Buttons */}
          <Animated.View entering={FadeInDown.delay(200)}
            style={{ flexDirection: 'row', marginTop: 20, gap: 12 }}>
            <TouchableOpacity style={{
              paddingHorizontal: 20, paddingVertical: 10,
              backgroundColor: theme.colors.surface,
              borderRadius: 20,
              borderWidth: 1, borderColor: theme.colors.border,
              flexDirection: 'row', alignItems: 'center',
            }}>
              <CreditCard color={primaryLight} size={16} style={{ marginRight: 8 }} />
              <Text style={{ color: theme.colors.text, fontWeight: '800', fontSize: 11, textTransform: 'uppercase' }}>Medical ID</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{
              padding: 12,
              backgroundColor: theme.colors.surface,
              borderRadius: 16,
              borderWidth: 1, borderColor: theme.colors.border,
            }}>
              <Share2 color={theme.colors.text} size={18} />
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* ── Stats Summary ── */}
        <View style={{ paddingHorizontal: 24, marginTop: -28, marginBottom: 28 }}>
          <Animated.View entering={FadeInDown.delay(300)}
            style={{
              flexDirection: 'row',
              backgroundColor: theme.colors.surface,
              borderRadius: 32,
              padding: 24,
              borderWidth: 1, borderColor: theme.colors.border,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 5,
            }}>
            <View style={{ flex: 1, alignItems: 'center', borderRightWidth: 1, borderRightColor: theme.colors.borderLight }}>
              <Text style={{ color: theme.colors.text, fontWeight: '900', fontSize: 22, marginBottom: 4 }}>1,250</Text>
              <Text style={{ color: theme.colors.textMuted, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>Points</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'center', borderRightWidth: 1, borderRightColor: theme.colors.borderLight }}>
              <Text style={{ color: theme.colors.text, fontWeight: '900', fontSize: 22, marginBottom: 4 }}>#12</Text>
              <Text style={{ color: theme.colors.textMuted, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>Rank</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ color: theme.colors.text, fontWeight: '900', fontSize: 22, marginBottom: 4 }}>Lv.4</Text>
              <Text style={{ color: theme.colors.textMuted, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>Badge</Text>
            </View>
          </Animated.View>
        </View>

        {/* ── Menu Sections ── */}
        <View style={{ paddingHorizontal: 24 }}>
          {/* Learning */}
          <Text style={{
            color: theme.colors.textMuted, fontWeight: '800',
            fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5,
            marginBottom: 12, marginLeft: 4,
          }}>Learning</Text>
          <View style={{
            backgroundColor: theme.colors.surface,
            borderRadius: 28,
            borderWidth: 1, borderColor: theme.colors.border,
            marginBottom: 28, overflow: 'hidden',
          }}>
            <MenuOption icon={BookOpen} label="My Courses" value="12 Active" />
            <MenuOption icon={Award} label="Achievements" value="8 Earned" color="#fbbf24" />
            <MenuOption icon={Download} label="Downloads" value="34 MB" isLast />
          </View>

          {/* Settings */}
          <Text style={{
            color: theme.colors.textMuted, fontWeight: '800',
            fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5,
            marginBottom: 12, marginLeft: 4,
          }}>Settings</Text>
          <View style={{
            backgroundColor: theme.colors.surface,
            borderRadius: 28,
            borderWidth: 1, borderColor: theme.colors.border,
            marginBottom: 28, overflow: 'hidden',
          }}>
            <MenuOption icon={Bell} label="Notifications" onToggle={setPushEnabled} toggleValue={pushEnabled} />
            <MenuOption icon={Moon} label="Dark Mode" onToggle={() => toggleDarkMode()} toggleValue={isDarkMode} />
            <MenuOption icon={Shield} label="Privacy" isLast />
          </View>

          {/* Admin */}
          {isAdmin && (
            <>
              <Text style={{
                color: primaryColor, fontWeight: '800',
                fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5,
                marginBottom: 12, marginLeft: 4,
              }}>Administration</Text>
              <View style={{
                backgroundColor: theme.colors.surface,
                borderRadius: 28,
                borderWidth: 1, borderColor: primaryColor + '30',
                marginBottom: 28, overflow: 'hidden',
              }}>
                <MenuOption icon={Activity} label="Admin Dashboard" color={primaryColor} onPress={() => navigation.navigate('AdminDashboard')} isLast />
              </View>
            </>
          )}

          {/* Logout */}
          <TouchableOpacity
            onPress={handleLogout}
            style={{
              flexDirection: 'row', alignItems: 'center',
              padding: 20,
              backgroundColor: theme.colors.danger + '10',
              borderRadius: 28,
              borderWidth: 1, borderColor: theme.colors.danger + '20',
              marginBottom: 20,
            }}
          >
            <View style={{
              width: 44, height: 44, borderRadius: 16,
              backgroundColor: theme.colors.danger + '20',
              alignItems: 'center', justifyContent: 'center',
              marginRight: 16,
            }}>
              <LogOut color={theme.colors.danger} size={20} />
            </View>
            <Text style={{ flex: 1, color: theme.colors.danger, fontWeight: '900', fontSize: 16 }}>Sign Out</Text>
            <ChevronRight color={theme.colors.danger} size={20} style={{ opacity: 0.5 }} />
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}