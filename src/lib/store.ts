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
      : null) ?? "light",
  setTheme: (theme) => {
    set({ theme });
    if (typeof window !== "undefined") {
      localStorage.setItem("medqs-theme", theme);
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const isDark = theme === "dark" || (theme === "system" && prefersDark);
      document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
      document.documentElement.classList.toggle("dark", isDark);
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
