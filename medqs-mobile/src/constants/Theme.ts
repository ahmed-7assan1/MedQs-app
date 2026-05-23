import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const EliteTheme = {
  light: {
    colors: {
      primary: '#6C5FF0',       // MedOneX Purple
      primaryLight: '#8B7FF5',
      primaryDark: '#534AB7',
      background: '#F8FAFC',
      surface: '#FFFFFF',
      surfaceLight: '#F1F5F9',
      card: '#FFFFFF',
      text: '#0F172A',
      textSecondary: '#475569',
      textMuted: '#94A3B8',
      border: '#E2E8F0',
      borderLight: '#F1F5F9',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
      info: '#3b82f6',
      overlay: 'rgba(15, 23, 42, 0.6)',
      tabBar: 'rgba(255, 255, 255, 0.95)',
    },
    shadows: {
      sm: {
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
      },
      md: {
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
      },
      lg: {
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1, shadowRadius: 16, elevation: 5,
      },
      xl: {
        shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15, shadowRadius: 24, elevation: 8,
      },
    }
  },
  dark: {
    colors: {
      primary: '#7C6FF5',       // MedOneX Purple (brighter for dark)
      primaryLight: '#9B8FF8',
      primaryDark: '#6C5FF0',
      background: '#07080F',    // Deep space
      surface: '#0D0E17',       // Card surface
      surfaceLight: '#13141F',
      card: '#0D0E17',
      text: '#F8FAFC',
      textSecondary: '#94A3B8',
      textMuted: '#64748B',
      border: '#1E1E30',
      borderLight: '#252540',
      success: '#34d399',
      warning: '#fbbf24',
      danger: '#f87171',
      info: '#60a5fa',
      overlay: 'rgba(0, 0, 0, 0.7)',
      tabBar: 'rgba(13, 14, 23, 0.95)',
    },
    shadows: {
      sm: {
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2, shadowRadius: 3, elevation: 1,
      },
      md: {
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3, shadowRadius: 8, elevation: 3,
      },
      lg: {
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4, shadowRadius: 16, elevation: 5,
      },
      xl: {
        shadowColor: '#6C5FF0', shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15, shadowRadius: 24, elevation: 8,
      },
    }
  },
  typography: {
    fonts: {
      regular: 'Inter_400Regular',
      bold: 'Inter_700Bold',
      black: 'Inter_900Black',
      display: 'Outfit_700Bold',
      displayBlack: 'Outfit_900Black',
    },
    sizes: {
      xs: 10,
      sm: 12,
      base: 14,
      md: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 28,
      '4xl': 32,
      '5xl': 40,
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    screen: { width, height },
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    '2xl': 32,
    full: 9999,
  },
  animation: {
    spring: { damping: 15, stiffness: 300 },
    springLight: { damping: 20, stiffness: 200 },
    springHeavy: { damping: 12, stiffness: 400 },
    timing: { duration: 300 },
  },
  gradients: {
    primary: ['#6C5FF0', '#8B7FF5'],
    accent: ['#7C6FF5', '#00E5FF'],
    success: ['#10b981', '#34d399'],
    warning: ['#f59e0b', '#fbbf24'],
    danger: ['#ef4444', '#f87171'],
    surface: ['rgba(13, 14, 23, 0.8)', 'rgba(13, 14, 23, 0.4)'],
    glass: ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)'],
  },
};

export type ThemeType = typeof EliteTheme.light;
