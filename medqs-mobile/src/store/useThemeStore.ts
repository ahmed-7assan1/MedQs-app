import { create } from 'zustand';
import { storage } from '../lib/storage';
import { mobileApi } from '../lib/api';

// ─── ThemeStore ───────────────────────────────────────────────────────────────
// Fetches primaryColor from /api/mobile/site-config at startup
interface ThemeState {
  primaryColor: string;
  primaryLight: string;
  siteName: string;
  logoUrl: string | null;
  enableForum: boolean;
  enableLeaderboard: boolean;
  enableAI: boolean;
  loadConfig: (universityId?: string) => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  primaryColor: '#0d9488',   // default teal — overwritten by site-config
  primaryLight: '#14b8a6',
  siteName: 'MedOneX',
  logoUrl: null,
  enableForum: true,
  enableLeaderboard: true,
  enableAI: true,

  loadConfig: async (universityId?: string) => {
    try {
      const cfg = await mobileApi.getSiteConfig(universityId);
      // Derive a lighter shade — add transparency approximation
      const light = cfg.primaryColor ? cfg.primaryColor + 'cc' : '#14b8a6';
      set({
        primaryColor: cfg.primaryColor || '#0d9488',
        primaryLight: light,
        siteName: cfg.siteName || 'MedOneX',
        logoUrl: cfg.logoUrl || null,
        enableForum: cfg.enableForum ?? true,
        enableLeaderboard: cfg.enableLeaderboard ?? true,
        enableAI: cfg.enableAI ?? true,
      });
      // Persist for offline
      await storage.setItem('siteConfig', JSON.stringify(cfg));
    } catch {
      // Offline fallback: use cached config
      try {
        const cached = await storage.getItem('siteConfig');
        if (cached) {
          const cfg = JSON.parse(cached);
          set({ primaryColor: cfg.primaryColor || '#0d9488', siteName: cfg.siteName || 'MedOneX' });
        }
      } catch {}
    }
  },
}));
