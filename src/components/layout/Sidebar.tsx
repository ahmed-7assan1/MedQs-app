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
import { useNotificationStore, useThemeStore, useSidebarStore } from "@/lib/store";
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
  const { isOpen: mobileOpen, close: setMobileClose, toggle: toggleMobile } = useSidebarStore();
  const [userOpen, setUserOpen] = useState(false);

  const userRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { setMobileClose(); setUserOpen(false); setNotifOpen(false); }, [pathname, setMobileClose]);

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

      {/* ══════════════════════════════════════════════
          MOBILE FULL-SCREEN SIDE PANEL (slides from left)
      ══════════════════════════════════════════════ */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[150] lg:hidden" style={{ isolation: "isolate" }}>
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-[6px]"
            onClick={setMobileClose}
            aria-hidden
          />

          {/* Panel */}
          <div
            className="absolute left-0 top-0 bottom-0 w-72 max-w-[90vw] flex flex-col bg-card border-r border-white/10 shadow-2xl"
            style={{ animation: "slideInFromLeft 300ms cubic-bezier(0.16,1,0.3,1)" }}
          >
            {/* Panel header */}
            <div className="flex h-14 items-center justify-between px-5">
              <div className="flex items-center gap-2">
                {logoUrl?.trim()
                  ? <MedOneXLogoMark className="h-7 w-7 text-primary" interactiveColor={true} />
                  : <MedOneXLogoMark className="h-7 w-7 text-primary" interactiveColor={true} />}
                <span className="font-display text-[15px] font-extrabold">{siteName}</span>
              </div>
              <button
                onClick={setMobileClose}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Nav sections */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
              {/* Section 1: MAIN */}
              <div>
                <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/60 border-l-2 border-primary/50 pl-3">Main</p>
                <div className="space-y-0.5">
                  {[NAV[0], NAV[1], NAV[2]].map(({ href, label, icon: Icon }) => {
                    const active = isActive(href);
                    return (
                      <Link key={href} href={href} onClick={setMobileClose}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all",
                          active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                        )}>
                        <Icon className={cn("h-[18px] w-[18px] flex-shrink-0", active && "text-primary")} />
                        <span>{label}</span>
                        {active && <span className="ml-auto h-2 w-2 rounded-full bg-primary" />}
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Section 2: PRACTICE */}
              <div>
                <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/60 border-l-2 border-primary/50 pl-3">Practice</p>
                <div className="space-y-0.5">
                  {[NAV[3]].map(({ href, label, icon: Icon }) => {
                    const active = isActive(href);
                    return (
                      <Link key={href} href={href} onClick={setMobileClose}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all",
                          active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                        )}>
                        <Icon className={cn("h-[18px] w-[18px] flex-shrink-0", active && "text-primary")} />
                        <span>{label}</span>
                        {active && <span className="ml-auto h-2 w-2 rounded-full bg-primary" />}
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Section 3: MEDIA */}
              <div>
                <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/60 border-l-2 border-primary/50 pl-3">Media</p>
                <div className="space-y-0.5">
                  {[NAV[4], NAV[5]].map(({ href, label, icon: Icon }) => {
                    const active = isActive(href);
                    return (
                      <Link key={href} href={href} onClick={setMobileClose}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all",
                          active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                        )}>
                        <Icon className={cn("h-[18px] w-[18px] flex-shrink-0", active && "text-primary")} />
                        <span>{label}</span>
                        {active && <span className="ml-auto h-2 w-2 rounded-full bg-primary" />}
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Section 4: COMMUNITY */}
              <div>
                <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/60 border-l-2 border-primary/50 pl-3">Community</p>
                <div className="space-y-0.5">
                  {[NAV[6], NAV[7]].map(({ href, label, icon: Icon, badge }: any) => {
                    const active = isActive(href);
                    return (
                      <Link key={href} href={href} onClick={setMobileClose}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all",
                          active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                        )}>
                        <Icon className={cn("h-[18px] w-[18px] flex-shrink-0", active && "text-primary")} />
                        <span>{label}</span>
                        {badge && <span className="ml-auto text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/20 text-primary">{badge}</span>}
                        {active && !badge && <span className="ml-auto h-2 w-2 rounded-full bg-primary" />}
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Section 3: TOOLS */}
              <div>
                <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/60 border-l-2 border-primary/50 pl-3">Tools</p>
                <div className="space-y-0.5">
                  {[NAV[7]].map(({ href, label, icon: Icon }) => {
                    const active = isActive(href);
                    return (
                      <Link key={href} href={href} onClick={setMobileClose}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all",
                          active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                        )}>
                        <Icon className={cn("h-[18px] w-[18px] flex-shrink-0", active && "text-primary")} />
                        <span>{label}</span>
                        {active && <span className="ml-auto h-2 w-2 rounded-full bg-primary" />}
                      </Link>
                    );
                  })}
                  {!isGuest && (
                    <Link href="/ai-chat" onClick={setMobileClose}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-amber-500 hover:bg-amber-500/10 transition-all">
                      <Sparkles className="h-[18px] w-[18px]" /> Study with Dr. Q
                    </Link>
                  )}
                  {isAdmin && (
                    <Link href="/admin/dashboard" onClick={setMobileClose}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-violet-500 hover:bg-violet-500/10 transition-all">
                      <ShieldCheck className="h-[18px] w-[18px]" /> {PLATFORM_COPY.doctorPanel}
                    </Link>
                  )}
                </div>
              </div>

              {/* Mobile search */}
              <div className="border-t border-white/[0.02] pt-3">
                <GlobalSearch isGuest={isGuest} />
              </div>
            </nav>

            {/* Bottom: user info */}
            {!isGuest && (
              <div className="border-t border-white/[0.02] p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/10 ring-2 ring-primary/20">
                    {userImage
                      ? <img src={userImage} alt="" className="h-full w-full object-cover" />
                      : <span className="text-sm font-extrabold text-primary">{initial}</span>}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{userName}</p>
                    <p className="text-xs text-muted-foreground">{isAdmin ? "Admin" : "Student"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/settings" onClick={setMobileClose}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-muted transition-colors">
                    <Settings className="h-3.5 w-3.5" /> Settings
                  </Link>
                    <button onClick={() => signOut({ callbackUrl: "/login" })}
                      className="flex items-center justify-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-500/15 transition-colors">
                      <LogOut className="h-3.5 w-3.5" /> Out
                    </button>
                    <button onClick={toggleFullscreen}
                      className="col-span-2 flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-muted transition-colors">
                      {isFullscreen ? <Minimize className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />}
                      {isFullscreen ? "Exit Fullscreen" : "Fullscreen Mode"}
                    </button>
                  </div>

                <p className="mt-3 text-center text-[10px] text-muted-foreground/50">{siteName} · Medical Education Platform</p>
              </div>
            )}
          </div>
        </div>
      )}

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

