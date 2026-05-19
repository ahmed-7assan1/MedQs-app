"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  UserCircle2, 
  GraduationCap, 
  ChevronRight, 
  Send, 
  ShieldCheck, 
  Palette,
  Sparkles,
  Bell,
  Sun,
  Moon,
  ToggleLeft,
  ToggleRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/lib/store";

interface SettingsClientProps {
  user: {
    name: string;
    email: string;
    image: string | null;
    role: string;
  } | null;
}

export function SettingsClient({ user }: SettingsClientProps) {
  const { theme, setTheme } = useThemeStore();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const SETTINGS_GROUPS = [
    {
      title: "Personalization",
      items: [
        {
          id: "identity",
          title: "Profile & Identity",
          desc: "Manage your name, handle, avatar, and bio.",
          icon: UserCircle2,
          color: "text-blue-500 bg-blue-50 dark:bg-blue-500/10",
          href: "/profile/edit?tab=identity",
        },
        {
          id: "branding",
          title: "Avatar & Brand",
          desc: "Customize your visual presence on the platform.",
          icon: Sparkles,
          color: "text-purple-500 bg-purple-50 dark:bg-purple-500/10",
          href: "/profile/edit?tab=branding",
        },
      ],
    },
    {
      title: "Academic & Access",
      items: [
        {
          id: "academic",
          title: "University Context",
          desc: "Align your semester, faculty, and academic year.",
          icon: GraduationCap,
          color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10",
          href: "/profile/edit?tab=academic",
        },
        {
          id: "telegram",
          title: "Telegram Hub",
          desc: "Link your account to @MedOneX_bot for AI tutoring.",
          icon: Send,
          color: "text-sky-500 bg-sky-50 dark:bg-sky-500/10",
          href: "/profile/edit?tab=telegram",
        },
      ],
    },
    {
      title: "System & Privacy",
      items: [
        {
          id: "privacy",
          title: "Privacy & Visibility",
          desc: "Ghost mode, contact visibility, and profile privacy.",
          icon: ShieldCheck,
          color: "text-orange-500 bg-orange-50 dark:bg-orange-500/10",
          href: "/profile/edit?tab=privacy",
        },
        {
          id: "notifications",
          title: "Notifications",
          desc: "Forum activity, broadcast alerts, and system pings.",
          icon: Bell,
          color: "text-rose-500 bg-rose-50 dark:bg-rose-500/10",
          href: "/notifications/settings",
        },
      ],
    },
  ];

  return (
    <div className="space-y-6 max-w-md mx-auto pb-12">
      {/* ── User Profile Header Card (Mockup Right Side) ── */}
      <div className="p-6 rounded-[28px] border border-slate-200/70 dark:border-white/[0.04] bg-white dark:bg-[#161523]/80 shadow-sm dark:shadow-none space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* User Avatar */}
            {user?.image ? (
              <img 
                src={user.image} 
                alt={user.name} 
                className="h-12 w-12 rounded-full object-cover border border-slate-200 dark:border-white/10" 
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-indigo-500 flex items-center justify-center text-white font-black text-sm uppercase shadow-sm">
                {(user?.name || "Student").charAt(0)}
              </div>
            )}
            <div>
              <h3 className="text-[16px] font-black text-slate-800 dark:text-white leading-tight">
                {user?.name || "Guest Student"}
              </h3>
              <p className="text-[11px] font-semibold text-slate-400 dark:text-white/30 mt-0.5 truncate max-w-[180px]">
                {user?.email || "guest@medonex.com"}
              </p>
            </div>
          </div>

          {/* Premium Plan Badge */}
          <div className="px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200/50 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider">
            Premium Plan
          </div>
        </div>

        {/* Manage Subscription Pill Button */}
        <Link href="/profile/edit?tab=billing" className="block">
          <motion.button 
            whileTap={{ scale: 0.97 }}
            className="w-full py-3 rounded-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-black transition-all shadow-md dark:shadow-none uppercase tracking-widest"
          >
            Manage Subscription
          </motion.button>
        </Link>
      </div>

      {/* ── Interactive Theme Mode Preferences Card ── */}
      <div className="p-5 rounded-[28px] border border-slate-200/70 dark:border-white/[0.04] bg-white dark:bg-[#161523]/80 shadow-sm dark:shadow-none space-y-4">
        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/30 px-1">
          App Customization
        </h4>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500">
              {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </div>
            <div>
              <h5 className="text-[13px] font-extrabold text-slate-800 dark:text-white">Dark Theme Mode</h5>
              <p className="text-[10px] font-semibold text-slate-400 dark:text-white/30 mt-0.5">Toggle dark/light workspace</p>
            </div>
          </div>

          {/* Golden Theme Switch Switcher */}
          <button 
            onClick={toggleTheme}
            className="focus:outline-none transition-transform active:scale-95 duration-200 shrink-0"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <div className="w-11 h-6 rounded-full bg-amber-500 p-0.5 flex justify-end items-center cursor-pointer transition-all duration-300">
                <div className="w-5 h-5 rounded-full bg-white shadow-md" />
              </div>
            ) : (
              <div className="w-11 h-6 rounded-full bg-slate-200 dark:bg-slate-800 p-0.5 flex justify-start items-center cursor-pointer transition-all duration-300">
                <div className="w-5 h-5 rounded-full bg-white shadow-md border border-slate-200" />
              </div>
            )}
          </button>
        </div>
      </div>

      {/* ── Settings Groups ── */}
      {SETTINGS_GROUPS.map((group) => (
        <div key={group.title} className="p-5 rounded-[28px] border border-slate-200/70 dark:border-white/[0.04] bg-white dark:bg-[#161523]/80 shadow-sm dark:shadow-none space-y-4">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/30 px-1">
            {group.title}
          </h4>
          <div className="space-y-4">
            {group.items.map((item) => (
              <Link 
                key={item.id} 
                href={item.href}
                className="flex items-center justify-between group active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center gap-3">
                  <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm", item.color)}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="text-[13px] font-extrabold text-slate-800 dark:text-white group-hover:text-primary transition-colors">
                      {item.title}
                    </h5>
                    <p className="text-[10px] font-semibold text-slate-400 dark:text-white/30 mt-0.5 line-clamp-1 max-w-[220px]">
                      {item.desc}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300 dark:text-white/20 transition-transform group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
