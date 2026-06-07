"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  LayoutDashboard, BookOpen, MessageSquare, Clock, Settings, LogOut,
  ShieldCheck, Bell, X, Sparkles, HelpCircle, Library, User,
  Sun, Moon, Bookmark, Menu, Search as SearchIcon, BarChart3, Video, Mic2,
  Maximize, Minimize, Youtube, Send
} from "lucide-react";

import { signOut } from "next-auth/react";
import { useNotificationStore, useThemeStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { MedOneXLogoMark } from "@/components/branding/MedQsLogo";
import { PLATFORM_COPY } from "@/lib/platform-copy";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import toast from "react-hot-toast";

interface NotifItem { id: string; title: string; body: string; read: boolean; createdAt: string; channel: string; }
interface SidebarProps {
  userName: string; userImage?: string; userId: string;
  isAdmin?: boolean; siteName?: string; logoUrl?: string;
  isGuest?: boolean; unreadCount?: number;
}

export const NAV = [
  { href: "/dashboard-app", label: "Dashboard", icon: LayoutDashboard },
  { href: "/modules", label: "Lectures", icon: BookOpen },
  { href: "/study-tools", label: "Study Tools", icon: BarChart3 },
  { href: "/past-papers", label: "Quizzes", icon: HelpCircle },
  { href: "/videos", label: "OneX Videos", icon: Video },
  { href: "/videos/reels", label: "Reels", icon: Youtube },
  { href: "/podcasts", label: "Podcasts", icon: Mic2 },
  { href: "/social", label: "Community", icon: MessageSquare },
  { href: "/taskat", label: "Taskat", icon: Clock },
  { href: "/profile/telegram", label: "Telegram Link", icon: Send },
];


export function Sidebar({ userName, userImage, userId, isAdmin, siteName = "MedOneX", logoUrl, isGuest, unreadCount = 0 }: SidebarProps) {
  function Logo() {
    if (logoUrl?.trim()) {
      return <MedOneXLogoMark title={siteName} className="h-8 w-8 text-primary" interactiveColor={true} />;
    }
    return <MedOneXLogoMark title={siteName} className="h-8 w-8 text-primary" interactiveColor={true} />;
  }
  const pathname = usePathname();
  if (pathname?.startsWith("/drawmed")) return null;
  const { unread } = useNotificationStore();
  const { setTheme } = useThemeStore();
  const totalUnread = unread || unreadCount;

  const [mounted, setMounted] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotifItem[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const userRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { setUserOpen(false); setNotifOpen(false); }, [pathname]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function loadNotifs() {
    if (notifLoading || isGuest) return;
    setNotifLoading(true);
    try {
      const res = await fetch("/api/v1/notifications?limit=20");
      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : data.notifications ?? []);
    } catch { } finally { setNotifLoading(false); }
  }

  async function markAllRead() {
    await fetch("/api/v1/notifications/read-all", { method: "PUT" }).catch(() => { });
    setNotifications(n => n.map(x => ({ ...x, read: true })));
  }

  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handler = () => {
      const doc = document as any;
      setIsFullscreen(!!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement));
    };
    document.addEventListener("fullscreenchange", handler);
    document.addEventListener("webkitfullscreenchange", handler);
    document.addEventListener("mozfullscreenchange", handler);
    document.addEventListener("MSFullscreenChange", handler);
    return () => {
      document.removeEventListener("fullscreenchange", handler);
      document.removeEventListener("webkitfullscreenchange", handler);
      document.removeEventListener("mozfullscreenchange", handler);
      document.removeEventListener("MSFullscreenChange", handler);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      const doc = document as any;
      const docEl = doc.documentElement;
      const requestFullScreen = docEl.requestFullScreen || docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
      const cancelFullScreen = doc.exitFullscreen || doc.cancelFullScreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;
      const isFs = doc.fullscreenElement || doc.mozFullScreenElement || doc.webkitFullscreenElement || doc.msFullscreenElement;

      if (!isFs) {
        if (requestFullScreen) await requestFullScreen.call(docEl).catch(() => {});
        else toast.error("Fullscreen not supported on this browser (e.g. iOS Safari). Add to Home Screen instead.");
      } else {
        if (cancelFullScreen) await cancelFullScreen.call(doc).catch(() => {});
      }
    } catch (err) {
      console.error(err);
    }
  };

  const isActive = (href: string) =>
    href === "/dashboard-app" ? pathname === href || pathname === "/dashboard" : pathname?.startsWith(href);

  const initial = userName?.[0]?.toUpperCase() ?? "U";

  return (
    <>
      {/* ── Desktop Top Nav (Disabled in favor of FloatingIslandNavbar) ── */}
      {/* 
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-40 hidden h-[52px] items-center border-b border-white/[0.07] bg-[#131220] px-6 lg:flex"
        )}
      >
        <div className="flex-1 flex items-center">
          <Link href="/dashboard-app" className="flex items-center text-[16px] font-bold tracking-tight">
            <span className="text-white">Med</span>
            <span className="text-white/60 font-medium">One</span>
            <span className="text-primary text-[110%] ml-0.5 font-black">X</span>
          </Link>
        </div>

        <nav className="flex items-center gap-1">
          {NAV.map(({ href, label }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-[12px] font-bold transition-all uppercase tracking-wider",
                  active ? "text-primary bg-primary/10" : "text-white/35 hover:text-white/60 hover:bg-white/5"
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex-1 flex items-center justify-end gap-3">
          <div className="flex items-center gap-1">
            <GlobalSearch isGuest={isGuest} />
            
            <button
              onClick={toggleFullscreen}
              className="p-2 text-white/35 hover:text-white transition-colors"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </button>

            {!isGuest && (
              <Link href="/ai-chat" className="hidden xl:flex items-center gap-1.5 rounded-full btn-gradient px-4 py-1.5 text-[11px] font-black uppercase tracking-wider shadow-lg shadow-primary/20">
                <Sparkles className="h-3 w-3" />
                Ask Dr. Q
              </Link>
            )}

            {!isGuest && (
              <div ref={notifRef} className="relative">
                <button
                  onClick={() => { if (!notifOpen) void loadNotifs(); setNotifOpen(o => !o); setUserOpen(false); }}
                  className={cn(
                    "p-2 text-white/35 hover:text-white transition-colors relative",
                    notifOpen && "text-white"
                  )}
                >
                  <Bell className="h-4 w-4" />
                  {totalUnread > 0 && <span className="absolute top-2 right-2 h-1.5 w-1.5 bg-primary rounded-full" />}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 top-12 w-80 rounded-2xl border border-white/[0.07] bg-[#131220] shadow-2xl overflow-hidden py-2 animate-in fade-in slide-in-from-top-2">
                    <p className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white/20">Notifications</p>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.map(n => (
                        <div key={n.id} className="px-4 py-3 hover:bg-white/5 border-b border-white/[0.03]">
                          <p className="text-[12px] font-bold text-white/90">{n.title}</p>
                          <p className="text-[11px] text-white/40 mt-0.5">{n.body}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <Link href="/settings" className="p-2 text-white/35 hover:text-white transition-colors">
              <Settings className="h-4 w-4" />
            </Link>
          </div>

          <div ref={userRef} className="relative">
            <button onClick={() => setUserOpen(!userOpen)} className="h-8 w-8 rounded-xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center">
              {userImage ? (
                <img src={userImage} alt="" className="h-full w-full object-cover" />
              ) : (
                <img 
                  src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${userName || 'User'}`} 
                  alt="" 
                  className="h-full w-full object-cover" 
                />
              )}
            </button>
            {userOpen && (
              <div className="absolute right-0 top-12 w-48 rounded-2xl border border-white/[0.07] bg-[#131220] shadow-2xl py-2 animate-in fade-in slide-in-from-top-2">
                <Link href="/profile/me" className="block px-4 py-2 text-[12px] font-bold text-white/40 hover:text-white hover:bg-white/5 transition-colors">Profile</Link>
                <div className="h-px bg-white/[0.03] my-1" />
                <button onClick={() => signOut({ callbackUrl: "/login" })} className="w-full text-left px-4 py-2 text-[12px] font-bold text-red-500 hover:bg-red-500/10 transition-colors">Sign Out</button>
              </div>
            )}
          </div>
        </div>
      </header>
      */}



      {/* ── CSS Animations ── */}
      <style jsx global>{`
        @keyframes slideInFromLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        @keyframes slideInX {
          from { transform: scaleX(0); transform-origin: left; }
          to { transform: scaleX(1); transform-origin: left; }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      `}</style>
    </>
  );
}

