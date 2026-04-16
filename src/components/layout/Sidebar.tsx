"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  LayoutDashboard, BookOpen, MessageSquare, Clock, Settings, LogOut,
  ShieldCheck, Bell, X, Sparkles, HelpCircle, Library, User,
  Sun, Moon, Bookmark, Menu, Search as SearchIcon, BarChart3
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useNotificationStore, useThemeStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { MedQsLogoMark } from "@/components/branding/MedQsLogo";
import { PLATFORM_COPY } from "@/lib/platform-copy";
import { GlobalSearch } from "@/components/search/GlobalSearch";

interface NotifItem { id: string; title: string; body: string; read: boolean; createdAt: string; channel: string; }
interface SidebarProps {
  userName: string; userImage?: string; userId: string;
  isAdmin?: boolean; siteName?: string; logoUrl?: string;
  isGuest?: boolean; unreadCount?: number;
}

export const NAV = [
  { href: "/dashboard-app", label: "Dashboard",   icon: LayoutDashboard },
  { href: "/modules",       label: "Lectures",     icon: BookOpen },
  { href: "/study-tools",   label: "Study Tools",  icon: BarChart3 },
  { href: "/past-papers",   label: "Quizzes",      icon: HelpCircle },
  { href: "/forum",         label: "Community",    icon: MessageSquare },
  { href: "/taskat",        label: "Taskat",       icon: Clock },
];

export function Sidebar({ userName, userImage, userId, isAdmin, siteName = "MedQs", logoUrl, isGuest, unreadCount = 0 }: SidebarProps) {
  const pathname = usePathname();
  const { unread } = useNotificationStore();
  const { theme, setTheme } = useThemeStore();
  const totalUnread = unread || unreadCount;

  const [mounted, setMounted] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotifItem[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const userRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { setMobileOpen(false); setUserOpen(false); setNotifOpen(false); }, [pathname]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close mobile on escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setMobileOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Prevent body scroll when mobile open
  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  // Swipe-to-close
  useEffect(() => {
    if (!mobileOpen) return;
    let startX = 0;
    const onTouchStart = (e: TouchEvent) => { startX = e.touches[0].clientX; };
    const onTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches[0].clientX - startX > 60) setMobileOpen(false);
    };
    document.addEventListener("touchstart", onTouchStart);
    document.addEventListener("touchend", onTouchEnd);
    return () => { document.removeEventListener("touchstart", onTouchStart); document.removeEventListener("touchend", onTouchEnd); };
  }, [mobileOpen]);

  function isDark() {
    return typeof document !== "undefined" && document.documentElement.classList.contains("dark");
  }
  function toggleAppearance() { setTheme(isDark() ? "light" : "dark"); }

  async function loadNotifs() {
    if (notifLoading || isGuest) return;
    setNotifLoading(true);
    try {
      const res = await fetch("/api/v1/notifications?limit=20");
      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : data.notifications ?? []);
    } catch {} finally { setNotifLoading(false); }
  }

  async function markAllRead() {
    await fetch("/api/v1/notifications/read-all", { method: "PUT" }).catch(() => {});
    setNotifications(n => n.map(x => ({ ...x, read: true })));
  }

  const isActive = (href: string) =>
    href === "/dashboard-app" ? pathname === href || pathname === "/dashboard" : pathname?.startsWith(href);

  const initial = userName?.[0]?.toUpperCase() ?? "U";

  function Logo() {
    if (logoUrl?.trim()) {
      return <img src={logoUrl} alt={siteName} className="h-8 w-8 rounded-lg object-contain dark:brightness-0 dark:invert transition-all" />;
    }
    return <MedQsLogoMark title={siteName} className="h-8 w-8 dark:text-white" />;
  }

  return (
    <>
      {/* ══════════════════════════════════════════════
          TOP BAR
      ══════════════════════════════════════════════ */}
      <header
        className="fixed top-0 left-0 right-0 z-40 flex h-14 items-center border-b border-white/5 bg-background/85 backdrop-blur-[14px]"
        style={{ boxShadow: "0 1px 12px rgba(0,0,0,0.18)" }}
      >
        <div className="mx-auto flex h-full w-full max-w-screen-xl items-center gap-0 px-4 lg:px-6">

          {/* ── Logo ── */}
          <Link href="/dashboard-app" className="group flex items-center gap-2.5 flex-shrink-0 mr-4">
            <div className="relative transition-transform group-hover:scale-105">
              <Logo />
            </div>
            <span className="hidden font-display text-[15px] font-extrabold tracking-tight text-foreground sm:block select-none">
              {siteName}
            </span>
          </Link>

          {/* Vertical divider */}
          <div className="mr-4 h-5 w-px bg-border/60 flex-shrink-0 hidden lg:block" />

          {/* ── Desktop Nav ── */}
          <nav className="hidden lg:flex items-center gap-0.5 flex-1">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all duration-150 select-none",
                    active
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-3.5 w-3.5 flex-shrink-0 transition-colors",
                      active ? "text-primary" : ""
                    )}
                  />
                  {label}
                  {/* Animated underline */}
                  {active && (
                    <span
                      className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-primary"
                      style={{ animation: "slideInX 200ms ease-out" }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex-1 lg:flex-none" />

          {/* ── Right actions ── */}
          <div className="flex items-center gap-0.5">
            {/* Desktop Search */}
            <div className="hidden sm:block mr-1">
              <GlobalSearch isGuest={isGuest} />
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggleAppearance}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
              title="Toggle theme"
            >
              {mounted && isDark()
                ? <Sun className="h-[17px] w-[17px]" />
                : <Moon className="h-[17px] w-[17px]" />}
            </button>

            {/* Notifications */}
            {!isGuest && (
              <div ref={notifRef} className="relative">
                <button
                  onClick={() => { if (!notifOpen) void loadNotifs(); setNotifOpen(o => !o); setUserOpen(false); }}
                  className={cn(
                    "relative flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-all hover:bg-muted hover:text-foreground",
                    notifOpen && "bg-muted text-foreground"
                  )}
                >
                  <Bell className="h-[17px] w-[17px]" />
                  {totalUnread > 0 && (
                    <span className="absolute right-[9px] top-[9px] flex h-2 w-2 rounded-full bg-red-500 ring-2 ring-background"
                      style={{ boxShadow: "0 0 6px rgba(239,68,68,0.8)" }} />
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 top-11 z-50 w-80 rounded-2xl border border-border/80 bg-card/95 shadow-2xl backdrop-blur-xl overflow-hidden animate-in slide-in-from-top-2 fade-in duration-150">
                    <div className="flex items-center justify-between border-b border-border/50 px-4 py-3 bg-muted/20">
                      <span className="text-sm font-semibold">Notifications</span>
                      {totalUnread > 0 && (
                        <button onClick={markAllRead} className="text-[11px] font-semibold text-primary hover:underline" >Mark all read</button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto custom-scrollbar">
                      {notifLoading ? (
                        <div className="p-6 text-center text-sm text-muted-foreground">Loading...</div>
                      ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 p-8 text-muted-foreground">
                          <Bell className="h-8 w-8 opacity-20" />
                          <p className="text-sm">No notifications</p>
                        </div>
                      ) : notifications.map(n => (
                        <div key={n.id} className={cn("border-b border-border/30 px-4 py-3 text-sm hover:bg-muted/40 transition-colors", !n.read && "bg-primary/5")}>
                          <p className="font-medium leading-tight">{n.title}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User avatar */}
            {!isGuest ? (
              <div ref={userRef} className="relative ml-0.5">
                <button
                  onClick={() => { setUserOpen(o => !o); setNotifOpen(false); }}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl ring-2 transition-all duration-200",
                    userOpen ? "ring-primary" : "ring-border hover:ring-primary/50"
                  )}
                  style={{ boxShadow: userOpen ? "0 0 0 4px rgba(99,102,241,0.15)" : undefined }}
                >
                  {userImage
                    ? <img src={userImage} alt="" className="h-full w-full object-cover" />
                    : <span className="flex h-full w-full items-center justify-center bg-primary/10 text-[12px] font-extrabold text-primary">{initial}</span>}
                </button>

                {userOpen && (
                  <div className="absolute right-0 top-11 z-50 w-56 rounded-2xl border border-border/80 bg-card/95 shadow-2xl backdrop-blur-xl overflow-hidden animate-in slide-in-from-top-2 fade-in duration-150">
                    <div className="border-b border-border/50 px-4 py-3 bg-muted/20">
                      <p className="text-sm font-bold truncate">{userName}</p>
                      <p className="text-xs text-muted-foreground">{isAdmin ? "Admin Account" : "Student"}</p>
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
                      {isAdmin && (
                        <Link href="/admin/dashboard" onClick={() => setUserOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-[13px] hover:bg-muted/60 transition-colors">
                          <ShieldCheck className="h-4 w-4 text-violet-500" /> {PLATFORM_COPY.doctorPanel}
                        </Link>
                      )}
                      {!isGuest && (
                        <Link href="/ai-chat" onClick={() => setUserOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-[13px] hover:bg-muted/60 transition-colors">
                          <Sparkles className="h-4 w-4 text-amber-400" /> Study with Dr. Q
                        </Link>
                      )}
                    </div>
                    <div className="border-t border-border/50 py-1.5">
                      <button onClick={() => signOut({ callbackUrl: "/login" })} className="flex w-full items-center gap-2.5 px-4 py-2 text-[13px] font-medium text-red-500 hover:bg-red-500/10 transition-colors">
                        <LogOut className="h-4 w-4" /> Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="ml-1.5 flex h-9 items-center rounded-xl bg-primary px-4 text-[13px] font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                Sign In
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="ml-1 flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all lg:hidden"
              aria-label="Open menu"
            >
              <div className="flex flex-col gap-[5px] w-[17px]">
                <span className="h-[1.5px] w-full rounded-full bg-current transition-all" />
                <span className="h-[1.5px] w-[75%] rounded-full bg-current transition-all" />
                <span className="h-[1.5px] w-full rounded-full bg-current transition-all" />
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════
          MOBILE FULL-SCREEN SIDE PANEL (slides from right)
      ══════════════════════════════════════════════ */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" style={{ isolation: "isolate" }}>
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-[3px]"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />

          {/* Panel */}
          <div
            className="absolute right-0 top-0 bottom-0 w-72 max-w-[90vw] flex flex-col bg-card border-l border-border/60 shadow-2xl"
            style={{ animation: "slideInFromRight 280ms cubic-bezier(0.16,1,0.3,1)" }}
          >
            {/* Panel header */}
            <div className="flex h-14 items-center justify-between border-b border-border/50 px-5">
              <div className="flex items-center gap-2">
                {logoUrl?.trim()
                  ? <img src={logoUrl} alt={siteName} className="h-7 w-7 rounded-md object-contain dark:brightness-0 dark:invert" />
                  : <MedQsLogoMark className="h-7 w-7 dark:text-white" />}
                <span className="font-display text-[15px] font-extrabold">{siteName}</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
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
                      <Link key={href} href={href} onClick={() => setMobileOpen(false)}
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
                  {[NAV[3], NAV[4]].map(({ href, label, icon: Icon }) => {
                    const active = isActive(href);
                    return (
                      <Link key={href} href={href} onClick={() => setMobileOpen(false)}
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

              {/* Section 3: TOOLS */}
              <div>
                <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/60 border-l-2 border-primary/50 pl-3">Tools</p>
                <div className="space-y-0.5">
                  <Link href="/taskat" onClick={() => setMobileOpen(false)}
                    className={cn("flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all",
                      isActive("/taskat") ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground")}>
                    <Clock className={cn("h-[18px] w-[18px]", isActive("/taskat") && "text-primary")} />
                    Taskat
                  </Link>
                  {!isGuest && (
                    <Link href="/ai-chat" onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-amber-500 hover:bg-amber-500/10 transition-all">
                      <Sparkles className="h-[18px] w-[18px]" /> Study with Dr. Q
                    </Link>
                  )}
                  {isAdmin && (
                    <Link href="/admin/dashboard" onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-violet-500 hover:bg-violet-500/10 transition-all">
                      <ShieldCheck className="h-[18px] w-[18px]" /> {PLATFORM_COPY.doctorPanel}
                    </Link>
                  )}
                </div>
              </div>

              {/* Mobile search */}
              <div className="border-t border-border/40 pt-3">
                <GlobalSearch isGuest={isGuest} />
              </div>
            </nav>

            {/* Bottom: user info */}
            {!isGuest && (
              <div className="border-t border-border/50 p-4">
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
                  <Link href="/settings" onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-muted transition-colors">
                    <Settings className="h-3.5 w-3.5" /> Settings
                  </Link>
                  <button onClick={() => signOut({ callbackUrl: "/login" })}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-500/15 transition-colors">
                    <LogOut className="h-3.5 w-3.5" /> Sign out
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
        @keyframes slideInFromRight {
          from { transform: translateX(100%); }
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
