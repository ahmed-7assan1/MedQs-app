export const EliteTheme = {
  light: {
    colors: {
      primary: '#0ea5e9',       // Medical Blue
      primaryLight: '#38bdf8',
      primaryDark: '#0369a1',
      background: '#F8FAFC',    // Ultra clean white/gray
      surface: '#FFFFFF',
      surfaceLight: '#F1F5F9',
      text: '#0F172A',
      textMuted: '#64748B',
      border: '#E2E8F0',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
    },
    shadows: {
      soft: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      },
    }
  },
  dark: {
    colors: {
      primary: '#0ea5e9',       // Medical Blue
      primaryLight: '#38bdf8',
      primaryDark: '#0369a1',
      background: '#07090F',    // Deep Obsidian
      surface: '#0D1117',       // Glass surface
      surfaceLight: '#161B22',
      text: '#F8FAFC',
      textMuted: '#94A3B8',
      border: '#ffffff0d',      // Transparent border
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
    },
    shadows: {
      soft: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 4,
      },
    }
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 20,
    xl: 28,
    full: 9999,
  }
};

export type ThemeType = typeof EliteTheme.light;

