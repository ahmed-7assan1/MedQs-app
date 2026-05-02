"use client";

import { useNotificationStore, useThemeStore } from "@/lib/store";
import { 
  Bell, Search, MapPin, ChevronDown, 
  BookOpen, Layers, Target, Activity, GraduationCap, ChevronRight,
  Sun, Moon, User, Settings, LogOut, Bookmark, Sparkles, ShieldCheck,
  Video, Mic2, MessageSquare, Clock, HelpCircle, Maximize, Minimize
} from "lucide-react";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { signOut } from "next-auth/react";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { PLATFORM_COPY } from "@/lib/platform-copy";

interface HomeTopBarProps {
  userName: string;
  userImage?: string;
  location?: string;
  modules?: Array<{ id: string; name: string }>;
}

const MODULE_ICONS = [Layers, Target, BookOpen, Activity, GraduationCap, Layers];

export function HomeTopBar({ userName, userImage, location = "Medical Platform", modules = [] }: HomeTopBarProps) {
  const { unread } = useNotificationStore();
  const { theme, setTheme } = useThemeStore();
  const firstName = userName.split(" ")[0];
  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);

  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };


  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const SECTIONS = [
    { id: "lectures", name: "Lectures", href: "/modules", icon: BookOpen, color: "text-blue-400" },
    { id: "videos", name: "Videos", href: "/videos", icon: Video, color: "text-red-400" },
    { id: "podcasts", name: "Podcasts", href: "/podcasts", icon: Mic2, color: "text-green-400" },
    { id: "ai", name: "Dr. Q", href: "/ai-chat", icon: Sparkles, color: "text-amber-400" },
    { id: "quizzes", name: "Quizzes", href: "/past-papers", icon: HelpCircle, color: "text-purple-400" },
    { id: "community", name: "Community", href: "/forum", icon: MessageSquare, color: "text-pink-400" },
  ];

  return (
    <>
    <div className={cn(
      "fixed top-0 left-0 right-0 z-50 lg:hidden transition-all duration-500 border-b border-white/5",
      isScrolled 
        ? "bg-background/60 backdrop-blur-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]" 
        : "bg-background/40 backdrop-blur-2xl"
    )}>
      <div className="px-4 pb-3 pt-0 space-y-3">
        {/* Top Row: Profile & Actions */}
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="relative" ref={userRef}>
              <button
                onClick={() => { setUserOpen(o => !o); setNotifOpen(false); }}
                className={cn(
                  "h-10 w-10 shrink-0 rounded-full overflow-hidden border p-0.5 shadow-sm bg-background/50 flex items-center justify-center transition-all active:scale-95",
                  userOpen ? "border-primary ring-2 ring-primary/20" : "border-white/[0.05]"
                )}
              >
                {userImage ? (
                  <img 
                    src={userImage} 
                    alt={userName} 
                    className="h-full w-full rounded-full object-cover" 
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      e.currentTarget.parentElement?.classList.add("bg-primary/10");
                    }} 
                  />
                ) : (
                  <img 
                    src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${userName || 'User'}`} 
                    alt="" 
                    className="h-full w-full object-cover" 
                  />
                )}
              </button>

              {userOpen && (
                <div className="absolute left-0 top-12 z-[60] w-56 rounded-2xl border border-white/[0.03] bg-card/95 shadow-2xl backdrop-blur-xl overflow-hidden animate-in slide-in-from-top-2 fade-in duration-150">
                  <div className="border-b border-white/[0.02] px-4 py-3 bg-muted/20">
                    <p className="text-sm font-bold truncate">{userName}</p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{location}</p>
                  </div>
                  <div className="py-1.5">
                    <Link href="/profile/me" onClick={() => setUserOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-[13px] hover:bg-muted/60 transition-colors">
                      <User className="h-4 w-4 text-muted-foreground" /> Profile
                    </Link>
                    <Link href="/profile/saved-questions" onClick={() => setUserOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-[13px] hover:bg-muted/60 transition-colors">
                      <Bookmark className="h-4 w-4 text-muted-foreground" /> Saved Questions
                    </Link>
                    <Link href="/settings" onClick={() => setUserOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-[13px] hover:bg-muted/60 transition-colors">
                      <Settings className="h-4 w-4 text-muted-foreground" /> Settings
                    </Link>
                    {mounted && (window as any).isAdmin && (
                      <Link href="/admin/dashboard" onClick={() => setUserOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-[13px] hover:bg-muted/60 transition-colors">
                        <ShieldCheck className="h-4 w-4 text-violet-500" /> {PLATFORM_COPY.doctorPanel}
                      </Link>
                    )}
                  </div>
                  <div className="border-t border-white/[0.02] py-1.5">
                    <button onClick={() => signOut({ callbackUrl: "/login" })} className="flex w-full items-center gap-2.5 px-4 py-2 text-[13px] font-medium text-red-500 hover:bg-red-500/10 transition-colors">
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-col -space-y-0.5 min-w-0">
              <p className="text-sm font-bold tracking-tight text-foreground truncate">
                Hello, <span className="text-primary">{firstName}</span>
              </p>
              <p className="text-[9px] font-medium text-muted-foreground opacity-60 truncate max-w-[140px] uppercase tracking-wider">{location}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Search */}
            <GlobalSearch />

            {/* Fullscreen Toggle */}
            <button 
              onClick={toggleFullscreen}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted/30 border border-white/[0.05] text-muted-foreground hover:bg-muted/50 hover:text-primary transition-all active:scale-95"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? <Minimize className="h-[18px] w-[18px]" /> : <Maximize className="h-[18px] w-[18px]" />}
            </button>


            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted/30 border border-white/[0.05] text-muted-foreground hover:bg-muted/50 hover:text-primary transition-all active:scale-95"
              title="Toggle theme"
            >
              {mounted && theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
            </button>
            
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => { setNotifOpen(o => !o); setUserOpen(false); }}
                className={cn(
                  "relative flex h-10 w-10 items-center justify-center rounded-2xl bg-muted/30 border border-white/[0.05] text-muted-foreground hover:bg-muted/50 transition-all active:scale-95",
                  notifOpen && "bg-muted text-foreground ring-2 ring-primary/20"
                )}
                title="Notifications"
              >
                <Bell className="h-[18px] w-[18px]" />
                {unread > 0 && (
                  <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-background shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-12 z-[60] w-72 rounded-2xl border border-white/[0.03] bg-card/95 shadow-2xl backdrop-blur-xl overflow-hidden animate-in slide-in-from-top-2 fade-in duration-150">
                  <div className="flex items-center justify-between border-b border-white/[0.02] px-4 py-3 bg-muted/20">
                    <span className="text-sm font-semibold">Notifications</span>
                    <Link href="/notifications" onClick={() => setNotifOpen(false)} className="text-[11px] font-semibold text-primary hover:underline">View all</Link>
                  </div>
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    Check your notifications in the dedicated panel or sidebar.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Collapsible Search & Modules (Only visible when NOT scrolled) */}
        <AnimatePresence>
          {!isScrolled && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="space-y-4 overflow-hidden origin-top"
            >
              {/* Search Bar - Main View */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                </div>
                <input 
                  type="text" 
                  placeholder="Search modules or lectures..."
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-muted/30 border border-white/[0.05] shadow-inner focus:ring-2 focus:ring-primary/10 focus:border-primary/20 outline-none transition-all placeholder:text-muted-foreground/30 text-xs"
                />
              </div>

              {/* Sections Grid (Redesigned from Modules) */}
              <div className="grid grid-cols-3 gap-2">
                {SECTIONS.map((sec) => {
                  const Icon = sec.icon;
                  return (
                    <Link 
                      key={sec.id}
                      href={sec.href}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10 active:scale-95 transition-all text-center group shadow-xl"
                    >
                      <div className={cn("h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-all group-hover:scale-110", sec.color)}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] font-black tracking-tight line-clamp-1 opacity-70 leading-tight group-hover:opacity-100 transition-opacity">{sec.name}</span>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
    {/* Spacer for fixed header */}
    <div className={cn("lg:hidden transition-all duration-300", isScrolled ? "h-16" : "h-[260px]")} />
    </>
  );
}

