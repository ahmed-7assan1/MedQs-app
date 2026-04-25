import { create } from 'zustand';
import { storage } from '../lib/storage';
import { mobileApi } from '../lib/api';

// ─── Full schema-accurate User shape ─────────────────────────────────────────
export interface AuthUser {
  id: string;
  name: string;
  nickname?: string;
  email: string;
  image?: string;
  role: 'STUDENT' | 'ADMIN' | 'SUPER_ADMIN';
  points: number;
  theme: 'LIGHT' | 'DARK' | 'SYSTEM';
  semesterId?: string;
  facultyId?: string;
  universityId?: string;
  handle?: string;
  bio?: string;
  rank?: { id: string; label: string; badge?: string };
  university?: { id: string; name: string };
  semester?: { id: string; name: string };
  faculty?: { id: string; name: string; category: string };
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  login: (user: AuthUser) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateUser: (partial: Partial<AuthUser>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,

  login: async (user) => {
    await storage.setItem('user', JSON.stringify(user));
    set({ user, isLoading: false });
  },

  logout: async () => {
    await storage.removeItem('user');
    await storage.removeItem('sessionToken');
    await storage.removeItem('siteConfig');
    set({ user: null });
  },

  checkAuth: async () => {
    try {
      const userStr = await storage.getItem('user');
      if (userStr) {
        const user: AuthUser = JSON.parse(userStr);
        set({ user, isLoading: false });
        // Refresh user stats in background
        try {
          const fresh = await mobileApi.getUserStats();
          if (fresh?.user) {
            const updated = { ...user, ...fresh.user };
            await storage.setItem('user', JSON.stringify(updated));
            set({ user: updated });
          }
        } catch {}
      } else {
        set({ user: null, isLoading: false });
      }
    } catch {
      set({ user: null, isLoading: false });
    }
  },

  updateUser: (partial) => {
    const current = get().user;
    if (!current) return;
    const updated = { ...current, ...partial };
    set({ user: updated });
    storage.setItem('user', JSON.stringify(updated));
  },
}));
