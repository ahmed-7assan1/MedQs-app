import { create } from 'zustand';
import { storage } from '../lib/storage';
import { mobileApi } from '../lib/api';
import { EliteTheme, ThemeType } from '../constants/Theme';
import { Appearance } from 'react-native';

// ─── ThemeStore ───────────────────────────────────────────────────────────────
interface ThemeState {
  isDarkMode: boolean;
  primaryColor: string;
  primaryLight: string;
  siteName: string;
  logoUrl: string | null;
  enableForum: boolean;
  enableLeaderboard: boolean;
  enableAI: boolean;
  toggleDarkMode: () => void;
  getTheme: () => ThemeType;
  loadConfig: (universityId?: string) => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  isDarkMode: Appearance.getColorScheme() === 'dark',
  primaryColor: '#0ea5e9',   // default medical blue
  primaryLight: '#38bdf8',
  siteName: 'MedOneX',
  logoUrl: null,
  enableForum: true,
  enableLeaderboard: true,
  enableAI: true,

  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
  
  getTheme: () => {
    const { isDarkMode } = get();
    return isDarkMode ? EliteTheme.dark : EliteTheme.light;
  },

  loadConfig: async (universityId?: string) => {
    try {
      const cfg = await mobileApi.getSiteConfig(universityId);
      const light = cfg.primaryColor ? cfg.primaryColor + 'cc' : '#38bdf8';
      set({
        primaryColor: cfg.primaryColor || '#0ea5e9',
        primaryLight: light,
        siteName: cfg.siteName || 'MedOneX',
        logoUrl: cfg.logoUrl || null,
        enableForum: cfg.enableForum ?? true,
        enableLeaderboard: cfg.enableLeaderboard ?? true,
        enableAI: cfg.enableAI ?? true,
      });
      await storage.setItem('siteConfig', JSON.stringify(cfg));
    } catch {
      try {
        const cached = await storage.getItem('siteConfig');
        if (cached) {
          const cfg = JSON.parse(cached);
          set({ primaryColor: cfg.primaryColor || '#0ea5e9', siteName: cfg.siteName || 'MedOneX' });
        }
      } catch {}
    }
  },
}));

