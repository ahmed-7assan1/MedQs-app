"use client";

import React, { useState } from "react";
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
  ToggleRight,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

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

  const supabase = createClient();
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwShow, setPwShow] = useState({ current: false, new: false, confirm: false });
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState("");

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    setPwSuccess(false);

    if (!pwCurrent || !pwNew || !pwConfirm) {
      setPwError("Please fill in all password fields.");
      return;
    }
    if (pwNew.length < 6) {
      setPwError("New password must be at least 6 characters.");
      return;
    }
    if (pwNew !== pwConfirm) {
      setPwError("New passwords do not match.");
      return;
    }

    setPwLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password: pwCurrent,
      });
      if (signInError) {
        setPwError("Current password is incorrect.");
        setPwLoading(false);
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: pwNew });
      if (updateError) {
        setPwError(updateError.message);
        setPwLoading(false);
        return;
      }

      await fetch("/api/v1/auth/sync-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pwNew }),
      });

      setPwSuccess(true);
      setPwCurrent(""); setPwNew(""); setPwConfirm("");
      toast.success("Password updated successfully!");
    } catch {
      setPwError("An error occurred. Please try again.");
    } finally {
      setPwLoading(false);
    }
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
      <div className="p-6 rounded-[28px] border border-border bg-card shadow-sm space-y-5">
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

      {/* ── Password Change Card ── */}
      <div className="p-5 rounded-[28px] border border-border bg-card shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-rose-50 dark:bg-rose-500/10 text-rose-500 shrink-0">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/30">
              Password & Security
            </h4>
            <p className="text-[9px] font-semibold text-slate-400 dark:text-white/20 mt-0.5">
              Update your login credentials
            </p>
          </div>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-3">
          <div className="relative">
            <input type={pwShow.current ? "text" : "password"} value={pwCurrent} onChange={e => setPwCurrent(e.target.value)} placeholder="Current Password" autoComplete="current-password"
              className="w-full rounded-xl border border-white/[0.06] bg-black/20 dark:bg-white/5 px-4 py-3 pr-10 text-xs font-bold text-foreground outline-none focus:border-primary/40 transition-all placeholder:text-muted-foreground/30" />
            <button type="button" onClick={() => setPwShow(p => ({ ...p, current: !p.current }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground">
              {pwShow.current ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
          <div className="relative">
            <input type={pwShow.new ? "text" : "password"} value={pwNew} onChange={e => setPwNew(e.target.value)} placeholder="New Password" autoComplete="new-password"
              className="w-full rounded-xl border border-white/[0.06] bg-black/20 dark:bg-white/5 px-4 py-3 pr-10 text-xs font-bold text-foreground outline-none focus:border-primary/40 transition-all placeholder:text-muted-foreground/30" />
            <button type="button" onClick={() => setPwShow(p => ({ ...p, new: !p.new }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground">
              {pwShow.new ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
          <div className="relative">
            <input type={pwShow.confirm ? "text" : "password"} value={pwConfirm} onChange={e => setPwConfirm(e.target.value)} placeholder="Confirm New Password" autoComplete="new-password"
              className="w-full rounded-xl border border-white/[0.06] bg-black/20 dark:bg-white/5 px-4 py-3 pr-10 text-xs font-bold text-foreground outline-none focus:border-primary/40 transition-all placeholder:text-muted-foreground/30" />
            <button type="button" onClick={() => setPwShow(p => ({ ...p, confirm: !p.confirm }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground">
              {pwShow.confirm ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>

          {pwError && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold">
              <AlertTriangle className="h-3 w-3 shrink-0" /> {pwError}
            </div>
          )}

          {pwSuccess && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-bold">
              <CheckCircle2 className="h-3 w-3 shrink-0" /> Password updated successfully!
            </div>
          )}

          <button type="submit" disabled={pwLoading}
            className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-white text-[10px] font-black uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2">
            {pwLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Update Password"}
          </button>
        </form>
      </div>

      {/* ── Interactive Theme Mode Preferences Card ── */}
      <div className="p-5 rounded-[28px] border border-border bg-card shadow-sm space-y-4">
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
                <div className="w-5 h-5 rounded-full bg-white shadow-md border border-border" />
              </div>
            )}
          </button>
        </div>
      </div>

      {/* ── Settings Groups ── */}
      {SETTINGS_GROUPS.map((group) => (
        <div key={group.title} className="p-5 rounded-[28px] border border-border bg-card shadow-sm space-y-4">
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

      {/* ── Clear App Cache ── */}
      <div className="p-5 rounded-[28px] border border-border bg-card shadow-sm space-y-4">
        <button
          onClick={async () => {
            if (!("caches" in window)) {
              toast.error("Cache API not available in this browser.");
              return;
            }
            const keys = await caches.keys();
            await Promise.all(keys.map((k) => caches.delete(k)));
            toast.success("App cache cleared! Reloading…");
            setTimeout(() => window.location.reload(), 1200);
          }}
          className="flex items-center justify-between w-full group active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm bg-red-50 dark:bg-red-500/10 text-red-500">
              <Trash2 className="h-5 w-5" />
            </div>
            <div className="text-left">
              <h5 className="text-[13px] font-extrabold text-red-500 group-hover:text-red-400 transition-colors">
                Clear App Cache
              </h5>
              <p className="text-[10px] font-semibold text-slate-400 dark:text-white/30 mt-0.5">
                Free up storage &amp; reset cached pages
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-red-300 dark:text-red-500/30 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
}
