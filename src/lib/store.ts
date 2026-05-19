"use client";
import { create } from "zustand";
import type { NotificationItem } from "@/types";

// ─── Theme store ──────────────────────────────────────────────────────────────

interface ThemeStore {
  theme: "light" | "dark" | "system";
  setTheme: (t: "light" | "dark" | "system") => void;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  theme:
    (typeof window !== "undefined"
      ? (localStorage.getItem("medqs-theme") as ThemeStore["theme"] | null)
      : null) ?? "dark",
  setTheme: (theme) => {
    set({ theme });
    if (typeof window !== "undefined") {
      localStorage.setItem("medqs-theme", theme);
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const isDark = theme === "dark" || (theme === "system" && prefersDark);
      
      const updateDOM = () => {
        document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
        document.documentElement.classList.toggle("dark", isDark);
      };

      // Ensure view transition API is available
      if (document.startViewTransition) {
        document.startViewTransition(updateDOM);
      } else {
        updateDOM();
      }
    }
  },
}));

// ─── Notification store ───────────────────────────────────────────────────────

interface NotificationStore {
  notifications: NotificationItem[];
  unread: number;
  setNotifications: (n: NotificationItem[]) => void;
  addNotification: (n: NotificationItem) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unread: 0,
  setNotifications: (raw) => {
    const notifications = Array.isArray(raw) ? raw : [];
    set({ notifications, unread: notifications.filter((n) => !n.read).length });
  },
  addNotification: (n) => {
    set((state) => ({
      notifications: [n, ...state.notifications],
      unread: state.unread + (n.read ? 0 : 1),
    }));
  },
  markRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
      unread: Math.max(0, state.unread - 1),
    }));
    fetch(`/api/v1/notifications/${id}/read`, { method: "PUT" });
  },
  markAllRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unread: 0,
    }));
    fetch("/api/v1/notifications/read-all", { method: "PUT" });
  },
}));

// ─── Quiz attempt store ───────────────────────────────────────────────────────

interface QuizStore {
  currentAnswers: Record<string, string>; // questionId → chosen key
  setAnswer: (questionId: string, key: string) => void;
  resetQuiz: () => void;
}

export const useQuizStore = create<QuizStore>((set) => ({
  currentAnswers: {},
  setAnswer: (questionId, key) =>
    set((state) => ({
      currentAnswers: { ...state.currentAnswers, [questionId]: key },
    })),
  resetQuiz: () => set({ currentAnswers: {} }),
}));
// ─── Sidebar / Nav store ───────────────────────────────────────────────────────

interface SidebarStore {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export const useSidebarStore = create<SidebarStore>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
}));

// ─── Audio store ──────────────────────────────────────────────────────────────

interface AudioTrack {
  id: string;
  url: string;
  title: string;
  artist?: string;
  image?: string;
  isSpotify?: boolean;
}

interface AudioStore {
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  isMinimized: boolean;
  currentTime: number;
  duration: number;
  seekTo: number | null; // null means no pending seek
  setTrack: (track: AudioTrack) => void;
  setIsPlaying: (playing: boolean) => void;
  setMinimized: (min: boolean) => void;
  setProgress: (current: number, total: number) => void;
  setSeek: (time: number) => void;
  clearSeek: () => void;
  stop: () => void;
}

export const useAudioStore = create<AudioStore>((set) => ({
  currentTrack: null,
  isPlaying: false,
  isMinimized: false,
  currentTime: 0,
  duration: 0,
  seekTo: null,
  setTrack: (track) => set({ currentTrack: track, isPlaying: true, isMinimized: false, currentTime: 0, duration: 0, seekTo: null }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setMinimized: (isMinimized) => set({ isMinimized }),
  setProgress: (currentTime, duration) => set({ currentTime, duration }),
  setSeek: (time) => set({ seekTo: time }),
  clearSeek: () => set({ seekTo: null }),
  stop: () => set({ currentTrack: null, isPlaying: false, currentTime: 0, duration: 0, seekTo: null }),
}));

// ─── Community Share store ───────────────────────────────────────────────────────

export interface SharedQuestionContext {
  id: string;
  body: string;
  choices: any[];
  correctAnswer: string;
  userAnswer: string | null;
  isCorrect: boolean | null;
  lectureId: string;
}

interface CommunityShareStore {
  sharedQuestion: SharedQuestionContext | null;
  setSharedQuestion: (q: SharedQuestionContext | null) => void;
}

export const useCommunityShareStore = create<CommunityShareStore>((set) => ({
  sharedQuestion: null,
  setSharedQuestion: (sharedQuestion) => set({ sharedQuestion }),
}));
