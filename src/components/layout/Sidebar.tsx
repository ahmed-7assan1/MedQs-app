"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import {
  LayoutDashboard, BookOpen, MessageSquare, Clock, Settings, LogOut, ShieldCheck, Bell, Menu, X, Sparkles, HelpCircle, Library, User, Sun, Moon, Search, LayoutGrid, Bookmark
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useNotificationStore, useThemeStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { MedQsLogoMark } from "@/components/branding/MedQsLogo";
import { PLATFORM_COPY } from "@/lib/platform-copy";
import { GlobalSearch } from "@/components/search/GlobalSearch";

interface NotifItem { id: string; title: string; body: string; read: boolean; createdAt: string; channel: string; }
interface SidebarProps { userName: string; userImage?: string; userId: string; isAdmin?: boolean; siteName?: string; logoUrl?: string; isGuest?: boolean; unreadCount?: number; }

const NAV = [
  { href: "/dashboard-app", label: "Dashboard", icon: LayoutDashboard },
  { href: "/modules", label: "Lectures", icon: BookOpen },
  { href: "/study-tools", label: "Study tools", icon: Library },
  { href: "/past-papers", label: "Quizzes", icon: HelpCircle },
  { href: "/forum", label: "Community", icon: MessageSquare },
  { href: "/space", label: "Student Space", icon: Clock },
];

function computeNotifPlacement(trigger: DOMRect) {
  const width = Math.min(380, Math.max(280, window.innerWidth - 24));
  const isMobile = window.innerWidth <= 768;
  let left = isMobile ? Math.max(8, Math.min(trigger.right - width, window.innerWidth - width - 8)) : trigger.right - width;
  return { top: trigger.bottom + 8, left: Math.max(8, left), width };
}

export function Sidebar({ userName, userImage, userId, isAdmin, siteName = "MedQs", logoUrl, isGuest, unreadCount = 0 }: SidebarProps) {
  const pathname = usePathname();
  const { unread } = useNotificationStore();
  const { theme, setTheme } = useThemeStore();
  const totalUnread = unread || unreadCount;

  function toggleAppearance() {
    if (typeof document === "undefined") return;
    const darkNow = document.documentElement.classList.contains("dark");
    setTheme(darkNow ? "light" : "dark");
  }

  const [notifOpen, setNotifOpen] = useState(false);
  const [notifPlacement, setNotifPlacement] = useState<{ top: number; left: number; width: number } | null>(null);
  const [notifications, setNotifications] = useState<NotifItem[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopUserOpen, setDesktopUserOpen] = useState(false);
  const [desktopUserPlacement, setDesktopUserPlacement] = useState<{ top: number; right: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const notifTriggerRef = useRef<HTMLElement | null>(null);
  const userTriggerRef = useRef<HTMLButtonElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMobileOpen(false);
    setDesktopUserOpen(false);
  }, [pathname]);

  async function loadNotifs() {
    if (notifLoading || isGuest) return;
    setNotifLoading(true);
    try {
      const res = await fetch("/api/v1/notifications?limit=20");
      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : data.notifications ?? []);
    } catch {} finally { setNotifLoading(false); }
  }

  function openNotifPanel(e: React.MouseEvent<HTMLElement>) {
    e.stopPropagation();
    setDesktopUserOpen(false);
    if (notifOpen) { setNotifOpen(false); return; }
    const btn = e.currentTarget;
    notifTriggerRef.current = btn;
    setNotifPlacement(computeNotifPlacement(btn.getBoundingClientRect()));
    void loadNotifs();
    setNotifOpen(true);
  }

  useEffect(() => {
    if (!notifOpen) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest("[data-notif-panel]") && !t.closest("[data-notif-trigger]")) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [notifOpen]);

  useEffect(() => {
    if (!desktopUserOpen) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest("[data-desktop-user-menu]") && !userTriggerRef.current?.contains(t)) setDesktopUserOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [desktopUserOpen]);

  async function markAllRead() {
    await fetch("/api/v1/notifications/read-all", { method: "PUT" }).catch(() => {});
    setNotifications((n) => n.map((x) => ({ ...x, read: true })));
  }

  const initial = userName?.[0]?.toUpperCase() ?? "U";
  const isActive = (href: string) => href === "/dashboard-app" ? pathname === href || pathname === "/dashboard" : pathname?.startsWith(href);

  function BrandMark({ className }: { className?: string }) {
    const custom = Boolean(logoUrl?.trim());
    return (
      <span className={cn("flex flex-shrink-0 items-center justify-center overflow-hidden", custom ? "h-8 w-8 rounded-md" : "h-7 w-7 rounded-lg bg-sky-500/10 ring-1 ring-sky-500/20", className)}>
        {custom ? (
          <img src={logoUrl} alt="" className="h-full w-full object-contain" referrerPolicy="no-referrer" />
        ) : (
          <MedQsLogoMark title={siteName} className="h-5 w-5 text-sky-500" />
        )}
      </span>
    );
  }

  const NavItem = ({ href, label, icon: Icon, badge }: { href: string; label: string; icon: any; badge?: number }) => {
    const active = isActive(href);
    return (
      <Link
        href={href}
        className={cn(
          "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200",
          active 
            ? "bg-sky-500 text-white shadow-md shadow-sky-500/20" 
            : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
        )}
      >
        <Icon className={cn("h-[18px] w-[18px] transition-transform group-hover:scale-110", active ? "text-white" : "")} />
        <span>{label}</span>
        {badge && badge > 0 && (
          <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white px-1.5 shadow-sm">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </Link>
    );
  };

  const desktopUserMenuPanel = mounted && desktopUserOpen ? (
    <div
      data-desktop-user-menu
      role="menu"
      className="absolute right-4 top-16 w-56 animate-in slide-in-from-top-2 fade-in rounded-2xl border border-border bg-card/95 py-2 shadow-2xl backdrop-blur-xl z-50 origin-top-right overflow-hidden"
    >
      <div className="px-4 py-2 flex flex-col gap-1 border-b border-border/50 mb-1">
         <span className="text-sm font-bold truncate">{userName}</span>
         <span className="text-xs text-muted-foreground font-medium">Student Account</span>
      </div>
      <Link href="/profile/me" className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted/80 transition-colors">
        <User className="h-4 w-4 text-muted-foreground" /> Profile
      </Link>
      <Link href="/profile/saved-questions" className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted/80 transition-colors">
        <Bookmark className="h-4 w-4 text-muted-foreground" /> Saved Questions
      </Link>
      <Link href="/settings" className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted/80 transition-colors">
        <Settings className="h-4 w-4 text-muted-foreground" /> Settings
      </Link>
      <div className="my-1 h-px bg-border/50" />
      <button onClick={() => signOut({ callbackUrl: "/login" })} className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors">
        <LogOut className="h-4 w-4" /> Sign out
      </button>
    </div>
  ) : null;

  return (
    <>
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="fixed left-0 top-0 bottom-0 z-40 hidden w-64 flex-col border-r border-border bg-card/60 backdrop-blur-2xl md:flex shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        {/* Brand */}
        <div className="flex h-16 items-center px-6">
          <Link href="/dashboard-app" className="flex items-center gap-3 overflow-hidden">
            <BrandMark />
            <span className="truncate font-display text-lg font-bold tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              {siteName}
            </span>
          </Link>
        </div>

        {/* Links */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto p-4 custom-scrollbar">
          {NAV.map(n => <NavItem key={n.href} {...n} />)}

          {isAdmin && (
            <>
              <div className="my-4 mx-3 h-px bg-border/60" />
              <NavItem href="/admin/dashboard" label={PLATFORM_COPY.doctorPanel} icon={ShieldCheck} />
            </>
          )}

          <div className="my-4 mx-3 h-px bg-border/60" />
          {!isGuest && <NavItem href="/ai-chat" label="Study with Dr. Q" icon={Sparkles} />}
          {!isGuest && <NavItem href="/settings" label="Settings" icon={Settings} />}
        </nav>
      </aside>

      {/* --- TOP BAR (Desktop & Mobile) --- */}
      <header className="fixed top-0 left-0 right-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-xl md:left-64 shadow-[0_4px_24px_rgba(0,0,0,0.02)] transition-all">
        <div className="flex items-center gap-3 md:hidden">
            <button onClick={() => setMobileOpen(true)} className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              <Menu className="h-5 w-5" />
            </button>
            <Link href="/dashboard-app" className="flex items-center gap-2">
              <BrandMark />
            </Link>
        </div>
        
        {/* Spacer for desktop left alignment of search */}
        <div className="hidden md:flex flex-1" />

        <div className="flex flex-1 md:flex-none items-center justify-end gap-2 md:gap-3">
          <div className="w-full max-w-[240px] md:w-auto">
            <GlobalSearch isGuest={isGuest} />
          </div>

          <button onClick={toggleAppearance} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors border border-transparent hover:border-border/50">
            {mounted && theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {!isGuest && (
            <button data-notif-trigger onClick={openNotifPanel} className={cn("relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors border border-transparent hover:border-border/50", notifOpen && "bg-muted border-border")}>
              <Bell className="h-4 w-4" />
              {totalUnread > 0 && <span className="absolute right-2 top-2 flex h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />}
            </button>
          )}

          {!isGuest ? (
            <button ref={userTriggerRef} onClick={() => setDesktopUserOpen(p => !p)} className="ml-1 flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted/50 ring-2 ring-transparent transition-all hover:ring-sky-500/50">
              {userImage ? <img src={userImage} alt="" className="h-full w-full object-cover" /> : <span className="text-xs font-bold text-sky-500">{initial}</span>}
            </button>
          ) : (
            <Link href="/login" className="ml-2 flex h-10 items-center gap-2 rounded-xl bg-sky-500 px-4 text-sm font-bold text-white transition-colors hover:bg-sky-600 shadow-sm shadow-sky-500/20">
               Sign In
            </Link>
          )}
        </div>
        {desktopUserMenuPanel}
        {mounted && notifOpen && notifPlacement && createPortal(
          <div data-notif-panel className="absolute z-[100] animate-in slide-in-from-top-2 fade-in rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col" style={{ top: notifPlacement.top, right: window.innerWidth - notifPlacement.left - notifPlacement.width, width: notifPlacement.width, maxHeight: 400 }}>
             <div className="flex items-center justify-between border-b border-border/50 p-4 bg-muted/10">
                <span className="font-bold">Notifications</span>
                {totalUnread > 0 && <button onClick={markAllRead} className="text-xs font-semibold text-sky-500 hover:text-sky-600">Mark all read</button>}
             </div>
             <div className="flex-1 overflow-y-auto px-2 py-2 custom-scrollbar">
                {notifLoading ? <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div> : notifications.length === 0 ? <div className="p-8 text-center text-sm text-muted-foreground">No notifications</div> : notifications.map(n => (
                   <div key={n.id} className={cn("mb-1 rounded-xl p-3 text-sm transition-colors hover:bg-muted/50", !n.read && "bg-sky-500/5 hover:bg-sky-500/10")}>
                      <p className="font-bold mb-1">{n.title}</p>
                      <p className="text-muted-foreground text-xs">{n.body}</p>
                   </div>
                ))}
             </div>
          </div>, document.body
        )}
      </header>

      {/* --- MOBILE DRAWER --- */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity" onClick={() => setMobileOpen(false)} />
          <div className="relative w-72 max-w-[calc(100vw-3rem)] bg-card shadow-2xl h-full flex flex-col border-r border-border animate-in slide-in-from-left">
             <div className="flex h-16 items-center justify-between px-6 border-b border-border/50">
               <Link href="/dashboard-app" className="flex items-center gap-3">
                 <BrandMark />
                 <span className="font-display font-bold text-foreground">{siteName}</span>
               </Link>
               <button onClick={() => setMobileOpen(false)} className="rounded-xl p-2 text-muted-foreground hover:bg-muted"><X className="h-5 w-5" /></button>
             </div>
             <nav className="flex-1 space-y-1 overflow-y-auto p-4">
                {NAV.map(n => <NavItem key={n.href} {...n} />)}
                {isAdmin && <><div className="my-4 mx-3 h-px bg-border/60" /><NavItem href="/admin/dashboard" label={PLATFORM_COPY.doctorPanel} icon={ShieldCheck} /></>}
                <div className="my-4 mx-3 h-px bg-border/60" />
                {!isGuest && <NavItem href="/ai-chat" label="Study with Dr. Q" icon={Sparkles} />}
                {!isGuest && <NavItem href="/settings" label="Settings" icon={Settings} />}
             </nav>
          </div>
        </div>
      )}
    </>
  );
}
