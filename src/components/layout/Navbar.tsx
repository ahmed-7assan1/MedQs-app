"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import {
  Bell, Sun, Moon, Monitor, Menu, X, Video,
  BookOpen, LayoutDashboard, MessageSquare, Clock, FileText,
  User, Settings, LogOut, Trophy, ShieldCheck, BellOff, Mic2
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useThemeStore, useNotificationStore } from "@/lib/store";
import { NotificationPanel } from "@/components/notifications/NotificationPanel";
import { cn } from "@/lib/utils";
import { MedQsLogoMark } from "@/components/branding/MedQsLogo";
import { PLATFORM_COPY } from "@/lib/platform-copy";

const navLinks = [
  { href: "/dashboard",    label: "Dashboard",   icon: LayoutDashboard },
  { href: "/modules",      label: "Modules",     icon: BookOpen },
  { href: "/past-papers",  label: "Papers",      icon: FileText },
  { href: "/videos",       label: "Videos",      icon: Video },
  { href: "/podcasts",     label: "Podcasts",    icon: Mic2 },
  { href: "/forum",        label: "Forum",       icon: MessageSquare },
  { href: "/leaderboard",  label: "Leaderboard", icon: Trophy },
  { href: "/taskat",       label: "Taskat",      icon: Clock },
];

interface NavbarProps {
  userName: string;
  userImage?: string;
  userId: string;
  isAdmin?: boolean;
  siteName?: string;
  logoUrl?: string;
}

export function Navbar({ userName, userImage, userId, isAdmin, siteName = "MedOneX", logoUrl }: NavbarProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useThemeStore();
  const { unread } = useNotificationStore();
  const [notifOpen, setNotifOpen]   = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const themeOptions = [
    { val: "light" as const, icon: Sun },
    { val: "dark"  as const, icon: Moon },
    { val: "system" as const, icon: Monitor },
  ];

  const initials = userName
    .split(" ")
    .map(w => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.02] bg-background/95 backdrop-blur-xl">
      <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 flex-shrink-0">
          {logoUrl ? (
            <img src={logoUrl} alt={siteName} className="h-8 w-8 rounded-lg object-contain" />
          ) : (
            <MedQsLogoMark title={siteName} className="h-8 w-8" />
          )}
          <span className="font-display text-lg font-bold tracking-tight">{siteName}</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-0.5 md:flex">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] transition-all duration-200",
                pathname?.startsWith(href)
                  ? "bg-white/[0.08] text-white font-medium"
                  : "text-white/40 hover:text-white/80 hover:bg-white/[0.04]"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <div className="hidden sm:flex items-center rounded-lg border border-white/[0.03] bg-muted p-0.5">
            {themeOptions.map(({ val, icon: Icon }) => (
              <button
                key={val}
                onClick={() => setTheme(val)}
                className={cn(
                  "rounded-md p-1.5 transition-colors",
                  theme === val
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title={val}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>

          {/* Notifications bell */}
          <div className="relative">
            <button
              onClick={() => { setNotifOpen(p => !p); setUserMenuOpen(false); }}
              className="relative flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted transition-colors"
            >
              <Bell className="h-4.5 w-4.5" />
              {unread > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </button>
            {notifOpen && <NotificationPanel onClose={() => setNotifOpen(false)} />}
          </div>

          {/* User avatar + dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => { setUserMenuOpen(p => !p); setNotifOpen(false); }}
              className="flex h-9 w-9 items-center justify-center rounded-full transition-all hover:ring-2 hover:ring-primary/30 active:scale-95"
            >
              {userImage ? (
                <img
                  src={userImage}
                  alt={userName}
                  className="h-8 w-8 rounded-full object-cover ring-1 ring-white/[0.03]"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {initials}
                </div>
              )}
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-11 z-[60] w-56 rounded-2xl border border-white/[0.03] bg-card/95 shadow-2xl backdrop-blur-xl overflow-hidden animate-in slide-in-from-top-2 fade-in duration-150">
                {/* User info */}
                <div className="border-b border-white/[0.02] px-4 py-3 bg-muted/20">
                  <p className="text-sm font-bold truncate text-foreground">{userName}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Student account</p>
                </div>

                {/* Menu items */}
                <div className="py-1.5">
                  <Link href="/profile/me" onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-[13px] hover:bg-muted/60 transition-colors">
                    <User className="h-4 w-4 text-muted-foreground" /> View Profile
                  </Link>
                  <Link href="/profile/edit" onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-[13px] hover:bg-muted/60 transition-colors">
                    <Settings className="h-4 w-4 text-muted-foreground" /> Edit Profile
                  </Link>
                  <Link href="/notifications/settings" onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-[13px] hover:bg-muted/60 transition-colors">
                    <BellOff className="h-4 w-4 text-muted-foreground" /> Notification Settings
                  </Link>
                  {isAdmin && (
                    <Link href="/admin/dashboard" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-[13px] hover:bg-muted/60 transition-colors">
                      <ShieldCheck className="h-4 w-4 text-blue-500" /> {PLATFORM_COPY.doctorPanel}
                    </Link>
                  )}
                </div>

                {/* Sign out */}
                <div className="border-t border-white/[0.02] py-1.5">
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-[13px] font-medium text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted md:hidden"
            onClick={() => setMobileOpen(p => !p)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="border-t border-white/[0.03] bg-background px-4 py-3 md:hidden">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors",
                pathname?.startsWith(href)
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
          {/* Mobile theme */}
          <div className="mt-3 flex gap-2 border-t border-white/[0.03] pt-3">
            {themeOptions.map(({ val, icon: Icon }) => (
              <button key={val} onClick={() => setTheme(val)}
                className={cn("flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs capitalize transition-colors",
                  theme === val ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}>
                <Icon className="h-3.5 w-3.5" /> {val}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

