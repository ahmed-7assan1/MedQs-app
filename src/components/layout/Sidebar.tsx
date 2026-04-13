"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import {
  LayoutDashboard,
  BookOpen,
  MessageSquare,
  Clock,
  Settings,
  LogOut,
  ShieldCheck,
  Bell,
  Menu,
  X,
  Sparkles,
  HelpCircle,
  Library,
  User,
  Sun,
  Moon,
  ChevronDown,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useNotificationStore, useThemeStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { MedQsLogoMark } from "@/components/branding/MedQsLogo";
import { PLATFORM_COPY } from "@/lib/platform-copy";
import { GlobalSearch } from "@/components/search/GlobalSearch";

interface NotifItem {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  channel: string;
}

interface SidebarProps {
  userName: string;
  userImage?: string;
  userId: string;
  isAdmin?: boolean;
  siteName?: string;
  logoUrl?: string;
  isGuest?: boolean;
  unreadCount?: number;
}

const NAV = [
  { href: "/dashboard-app", label: "Dashboard", icon: LayoutDashboard },
  { href: "/modules", label: "Lectures", icon: BookOpen },
  { href: "/study-tools", label: "Study tools", icon: Library },
  { href: "/past-papers", label: "Quizzes", icon: HelpCircle },
  { href: "/forum", label: "Community", icon: MessageSquare },
  { href: "/space", label: "Student Space", icon: Clock },
];

function computeNotifPlacement(trigger: DOMRect): { top: number; left: number; width: number } {
  const width = Math.min(380, Math.max(280, window.innerWidth - 24));
  const maxH = 480;
  const isMobile = window.innerWidth <= 768;

  let left: number;
  let top: number;

  if (isMobile) {
    left = Math.max(8, Math.min(trigger.right - width, window.innerWidth - width - 8));
    top = trigger.bottom + 8;
    if (top + maxH > window.innerHeight - 8) {
      top = Math.max(8, trigger.top - maxH - 8);
    }
  } else {
    left = trigger.right + 12;
    if (left + width > window.innerWidth - 12) {
      left = window.innerWidth - width - 12;
    }
    top = Math.max(12, Math.min(trigger.bottom - 8, window.innerHeight - maxH - 12));
  }

  return { top, left, width };
}

export function Sidebar({
  userName,
  userImage,
  userId,
  isAdmin,
  siteName = "MedQs",
  logoUrl,
  isGuest,
  unreadCount = 0,
}: SidebarProps) {
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
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [desktopUserOpen, setDesktopUserOpen] = useState(false);
  const [desktopUserPlacement, setDesktopUserPlacement] = useState<{ top: number; left?: number; right?: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [desktopExpanded, setDesktopExpanded] = useState(true);

  // Load initial state safely
  useEffect(() => {
    try {
      const stored = localStorage.getItem("medqs-sidebar");
      if (stored === "collapsed") setDesktopExpanded(false);
    } catch {}
  }, []);

  // Sync desktop expanded state with layout margin
  useEffect(() => {
    if (typeof document !== "undefined") {
      if (desktopExpanded) {
        document.documentElement.removeAttribute("data-sidebar-collapsed");
        try { localStorage.setItem("medqs-sidebar", "expanded"); } catch {}
      } else {
        document.documentElement.setAttribute("data-sidebar-collapsed", "true");
        try { localStorage.setItem("medqs-sidebar", "collapsed"); } catch {}
      }
    }
  }, [desktopExpanded]);

  const notifTriggerRef = useRef<HTMLElement | null>(null);
  const desktopUserRef = useRef<HTMLDivElement | null>(null);
  const desktopMenuTriggerRef = useRef<HTMLButtonElement | null>(null);

  function updateDesktopUserMenuPlacement() {
    const el = desktopMenuTriggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setDesktopUserPlacement({
      top: r.top - 8,
      left: r.right + 12, // Popup to the right
    });
  }

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!notifOpen) return;
    function reposition() {
      const el = notifTriggerRef.current;
      if (!el) return;
      setNotifPlacement(computeNotifPlacement(el.getBoundingClientRect()));
    }
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [notifOpen]);

  useEffect(() => {
    if (!notifOpen) return;
    function handler(e: MouseEvent) {
      const t = e.target as HTMLElement;
      if (t.closest("[data-notif-panel]") || t.closest("[data-notif-trigger]")) return;
      setNotifOpen(false);
      setNotifPlacement(null);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [notifOpen]);

  useLayoutEffect(() => {
    if (!desktopUserOpen || !mounted) return;
    updateDesktopUserMenuPlacement();
  }, [desktopUserOpen, mounted]);

  useEffect(() => {
    if (!desktopUserOpen) return;
    function reposition() {
      updateDesktopUserMenuPlacement();
    }
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [desktopUserOpen]);

  useEffect(() => {
    if (!desktopUserOpen) return;
    function handler(e: MouseEvent) {
      const t = e.target as HTMLElement;
      if (desktopUserRef.current?.contains(t)) return;
      if (t.closest("[data-desktop-user-menu]")) return;
      setDesktopUserOpen(false);
      setDesktopUserPlacement(null);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [desktopUserOpen]);

  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
    setDesktopUserOpen(false);
    setDesktopUserPlacement(null);
  }, [pathname]);

  async function loadNotifs() {
    if (notifLoading || isGuest) return;
    setNotifLoading(true);
    try {
      const res = await fetch("/api/v1/notifications?limit=20");
      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : data.notifications ?? []);
    } catch {
      /* ignore */
    } finally {
      setNotifLoading(false);
    }
  }

  function openNotifPanel(e: React.MouseEvent<HTMLElement>) {
    e.stopPropagation();
    setUserMenuOpen(false);
    setDesktopUserOpen(false);
    setDesktopUserPlacement(null);
    if (notifOpen) {
      setNotifOpen(false);
      setNotifPlacement(null);
      notifTriggerRef.current = null;
      return;
    }
    const btn = e.currentTarget;
    notifTriggerRef.current = btn;
    setNotifPlacement(computeNotifPlacement(btn.getBoundingClientRect()));
    void loadNotifs();
    setNotifOpen(true);
  }

  async function markAllRead() {
    await fetch("/api/v1/notifications/read-all", { method: "PUT" }).catch(() => {});
    setNotifications((n) => n.map((x) => ({ ...x, read: true })));
  }

  const initial = userName?.[0]?.toUpperCase() ?? "U";
  const isActive = (href: string) =>
    href === "/dashboard-app" ? pathname === href || pathname === "/dashboard" : pathname?.startsWith(href);

  function BrandMark({ className }: { className?: string }) {
    const custom = Boolean(logoUrl?.trim());
    return (
      <span
        className={cn(
          "flex shrink-0 items-center justify-center overflow-hidden",
          custom
            ? "h-9 w-9 rounded-md"
            : "h-8 w-8 rounded-xl bg-muted/35 ring-1 ring-border/70",
          className
        )}
      >
        {custom ? (
          <img
            src={logoUrl}
            alt=""
            className="max-h-full max-w-full object-contain object-center"
            referrerPolicy="no-referrer"
          />
        ) : (
          <MedQsLogoMark title={siteName} className="h-[1.45rem] w-[1.45rem]" />
        )}
      </span>
    );
  }

  function TopNavLink({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) {
    const active = isActive(href);
    return (
      <Link
        href={href}
        className={cn(
          "flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-[color,background,box-shadow,transform] duration-150 active:scale-[0.98]",
          active
            ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
            : "text-muted-foreground hover:bg-muted/90 hover:text-foreground"
        )}
      >
        <Icon className="h-4 w-4 shrink-0 opacity-95" aria-hidden />
        <span className="hidden lg:inline">{label}</span>
      </Link>
    );
  }

  function DrawerLink({
    href,
    label,
    icon: Icon,
    badge,
  }: {
    href: string;
    label: string;
    icon: React.ElementType;
    badge?: number;
  }) {
    const active = isActive(href);
    return (
      <Link
        href={href}
        onClick={() => setMobileOpen(false)}
        className={cn("sb-link", active && "active")}
      >
        <Icon className="sb-link-icon" style={{ width: 18, height: 18 }} />
        <span className="sb-link-label">{label}</span>
        {badge && badge > 0 ? (
          <>
            <span className="sb-badge">{badge > 99 ? "99+" : badge}</span>
            <span className="sb-link-dot" />
          </>
        ) : null}
      </Link>
    );
  }

  /** Clearly interactive (not “disabled”): bordered chip + foreground icon */
  const headerControlBtnClass =
    "relative flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border/80 bg-background/85 text-foreground shadow-sm transition-[background,border-color,transform,box-shadow] hover:bg-muted hover:border-border active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

  const desktopUserMenuPanel =
    mounted && desktopUserOpen && desktopUserPlacement
      ? createPortal(
          <div
            data-desktop-user-menu
            role="menu"
            aria-label="Account"
            className="animate-fade-in w-52 overflow-hidden rounded-xl border border-border bg-card py-1 shadow-xl"
            style={{
              position: "fixed",
              top: desktopUserPlacement.top,
              left: desktopUserPlacement.left,
              bottom: "auto",
              right: "auto",
              zIndex: 99998,
            }}
          >
            <Link
              href="/profile/me"
              role="menuitem"
              onClick={() => {
                setDesktopUserOpen(false);
                setDesktopUserPlacement(null);
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted"
            >
              <User className="h-4 w-4 text-muted-foreground" aria-hidden /> Profile
            </Link>
            <Link
              href="/settings"
              role="menuitem"
              onClick={() => {
                setDesktopUserOpen(false);
                setDesktopUserPlacement(null);
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted"
            >
              <Settings className="h-4 w-4 text-muted-foreground" aria-hidden /> Settings
            </Link>
            <div className="my-1 h-px bg-border" />
            <button
              type="button"
              role="menuitem"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-destructive hover:bg-muted"
            >
              <LogOut className="h-4 w-4 shrink-0" aria-hidden /> Sign out
            </button>
          </div>,
          document.body
        )
      : null;

  const notifPanel =
    mounted && notifOpen && notifPlacement
      ? createPortal(
          <NotifPanel
            notifications={notifications}
            loading={notifLoading}
            onMarkAll={markAllRead}
            onClose={() => {
              setNotifOpen(false);
              setNotifPlacement(null);
              notifTriggerRef.current = null;
            }}
            placement={notifPlacement}
          />,
          document.body
        )
      : null;

  return (
    <>
      {/* ── Desktop: Floating Pill Navigation ── */}
      <div className="desktop-pill-nav hidden md:block">
        {/* Brand / Logo (Top Left) */}
        <div className="fixed left-6 top-6 z-50 flex items-center gap-2">
          <Link href="/dashboard-app" className="sb-logo cursor-pointer transition-transform hover:scale-105">
            <BrandMark className="mb-0 scale-100" />
          </Link>
          {/* Detached text matches reference implicitly */}
        </div>

        {/* Main Nav (Center Left) */}
        <nav className="fixed left-6 top-1/2 z-50 flex -translate-y-1/2 flex-col gap-1.5 rounded-[28px] border border-black/5 dark:border-white/5 bg-white/80 dark:bg-white/5 p-2 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] backdrop-blur-3xl">
          {NAV.map(({ href, label, icon }) => (
            <DrawerLink key={href} href={href} label={label} icon={icon} />
          ))}
          {isAdmin && (
            <>
              <div className="mx-auto my-1.5 h-px w-5 bg-black/5 dark:bg-white/10" />
              <DrawerLink href="/admin/dashboard" label={PLATFORM_COPY.doctorPanel} icon={ShieldCheck} />
            </>
          )}
        </nav>

        {/* Bottom Tools (Bottom Left) */}
        <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-1.5 rounded-[28px] border border-black/5 dark:border-white/5 bg-white/80 dark:bg-white/5 p-2 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] backdrop-blur-3xl">
          {!isGuest && <DrawerLink href="/ai-chat" label="Study with Dr. Q" icon={Sparkles} />}
          {!isGuest && <DrawerLink href="/settings" label="Settings" icon={Settings} />}
        </div>

        {/* Top Right User Controls */}
        <div className="fixed right-6 top-6 z-50 flex items-center gap-2 rounded-full border border-black/5 dark:border-white/5 bg-white/80 dark:bg-white/5 p-2 pl-4 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] backdrop-blur-3xl">
          <GlobalSearch isGuest={isGuest} />

          <button
            type="button"
            className={headerControlBtnClass}
            onClick={toggleAppearance}
            title="Toggle Theme"
          >
            {!mounted ? (
              <Moon className="h-[18px] w-[18px]" />
            ) : theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) ? (
              <Sun className="h-[18px] w-[18px]" />
            ) : (
              <Moon className="h-[18px] w-[18px]" />
            )}
          </button>

          {!isGuest && (
            <button
              type="button"
              className={cn(headerControlBtnClass, notifOpen && "bg-muted")}
              data-notif-trigger
              onClick={openNotifPanel}
            >
              <Bell className="h-[18px] w-[18px]" />
              {totalUnread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[hsl(142_71%_45%)] text-[9px] font-bold text-white shadow-sm">
                  {totalUnread > 9 ? "9+" : totalUnread}
                </span>
              )}
            </button>
          )}

          {!isGuest ? (
            <div className="relative ml-1">
              <button
                type="button"
                className="sb-user flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-border/40 transition-all hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                onClick={() => setDesktopUserOpen((p) => !p)}
                ref={desktopMenuTriggerRef}
              >
                {userImage ? (
                  <img src={userImage} alt={userName} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-primary text-xs font-semibold text-primary-foreground">
                    {initial}
                  </div>
                )}
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="ml-2 flex h-9 items-center gap-2 rounded-full bg-primary pl-3 pr-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <User className="h-4 w-4" /> Sign In
            </Link>
          )}
        </div>
      </div>


      {/* ── Mobile: top bar + h-opens drawer ── */}
      <div className="medqs-mobile-bar fixed top-0 left-0 right-0 z-40 flex h-14 items-center justify-between border-b border-border/80 bg-card/92 px-3 backdrop-blur-xl md:hidden">
        <button
          type="button"
          className="icon-btn flex h-10 w-10 items-center justify-center rounded-lg hover:bg-muted"
          onClick={() => setMobileOpen((p) => !p)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <Link
          href="/dashboard-app"
          className="flex min-w-0 items-center gap-2.5 text-foreground"
          onClick={() => setMobileOpen(false)}
        >
          <BrandMark />
          <span className="truncate font-display text-sm font-semibold leading-tight">{siteName}</span>
        </Link>
        <div className="flex shrink-0 items-center justify-end gap-1">
          <GlobalSearch isGuest={isGuest} />
          <button
            type="button"
            className={headerControlBtnClass}
            onClick={toggleAppearance}
            aria-label="Switch light / dark mode"
          >
            {!mounted ? (
              <Moon className="h-[18px] w-[18px] opacity-80" aria-hidden />
            ) : theme === "dark" ||
              (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) ? (
              <Sun className="h-[18px] w-[18px]" aria-hidden />
            ) : (
              <Moon className="h-[18px] w-[18px]" aria-hidden />
            )}
          </button>
          {!isGuest ? (
            <button
              type="button"
              className={headerControlBtnClass}
              data-notif-trigger
              onClick={openNotifPanel}
              aria-expanded={notifOpen}
            >
              <Bell className="h-[18px] w-[18px]" aria-hidden />
              {totalUnread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                  {totalUnread > 9 ? "9+" : totalUnread}
                </span>
              )}
            </button>
          ) : null}
        </div>
      </div>

      {/* ── Mobile drawer ── */}
      <aside
        className={cn(
          "medqs-drawer fixed left-0 z-50 flex w-[min(320px,94vw)] flex-col overflow-hidden shadow-2xl transition-transform duration-300 ease-out md:hidden",
          "top-14 h-[calc(100dvh-3.5rem)] max-h-[calc(100dvh-3.5rem)] border-r border-border dark:border-white/10 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]",
          mobileOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"
        )}
        aria-hidden={!mobileOpen}
      >
        <div className="sb-rail-glow" aria-hidden />

        <div className="shrink-0 border-b border-border px-4 py-3.5 dark:border-white/10">
          <p className="font-display text-base font-semibold leading-snug text-foreground dark:text-white">{siteName}</p>
        </div>

        <nav className="sb-nav min-h-0 flex-1">
          <div className="sb-section-label">Main</div>
          {NAV.map(({ href, label, icon }) => (
            <DrawerLink key={href} href={href} label={label} icon={icon} />
          ))}

          {isAdmin && (
            <>
              <div className="sb-section-label">{PLATFORM_COPY.doctorHub}</div>
              <DrawerLink href="/admin/dashboard" label={PLATFORM_COPY.doctorPanel} icon={ShieldCheck} />
            </>
          )}

          <div className="sb-section-label">Tools</div>

          {!isGuest && (
            <button
              type="button"
              className={cn("sb-link w-full text-left", notifOpen && "active")}
              data-notif-trigger
              onClick={openNotifPanel}
              aria-expanded={notifOpen}
            >
              <Bell className="sb-link-icon" style={{ width: 18, height: 18 }} />
              <span className="sb-link-label">Notifications</span>
              {totalUnread > 0 && (
                <>
                  <span className="sb-badge">{totalUnread > 99 ? "99+" : totalUnread}</span>
                  <span className="sb-link-dot" />
                </>
              )}
            </button>
          )}

          {!isGuest && <DrawerLink href="/ai-chat" label="Study with Dr. Q" icon={Sparkles} />}
        </nav>

        <div className="sb-footer shrink-0 border-t border-border/80 bg-card/50 pb-1 dark:border-white/10">
          {!isGuest && (
            <DrawerLink href="/settings" label="Settings" icon={Settings} />
          )}

          {!isGuest ? (
            <div className="relative">
              <button type="button" className="sb-user w-full text-left" onClick={() => setUserMenuOpen((p) => !p)}>
                {userImage ? (
                  <img
                    src={userImage}
                    alt={userName}
                    className="h-8 w-8 flex-shrink-0 rounded-full object-cover ring-1 ring-border dark:ring-white/10"
                  />
                ) : (
                  <div
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold text-primary-foreground"
                    style={{ background: "hsl(var(--primary))" }}
                  >
                    {initial}
                  </div>
                )}
                <div className="sb-user-info">
                  <p className="truncate text-xs font-semibold text-foreground dark:text-white/80">{userName}</p>
                  <p className="truncate text-[10px] text-muted-foreground dark:text-white/35">Student</p>
                </div>
              </button>

              {userMenuOpen && (
                <div className="animate-notif-pop absolute bottom-full left-0 right-0 z-50 mb-2 overflow-hidden rounded-xl border border-border bg-card shadow-xl dark:border-[hsl(222_18%_18%)] dark:bg-[hsl(222_24%_12%)] dark:shadow-[0_-8px_32px_rgba(0,0,0,.4)]">
                  <div className="space-y-0.5 p-1.5">
                    {[
                      { href: "/profile/me", label: "View Profile", icon: User },
                      { href: "/settings", label: "Settings", icon: Settings },
                    ].map(({ href, label, icon: Icon }) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => {
                          setUserMenuOpen(false);
                          setMobileOpen(false);
                        }}
                        className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground dark:text-white/60 dark:hover:bg-white/5 dark:hover:text-white"
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" /> {label}
                      </Link>
                    ))}
                  </div>
                  <div className="border-t border-border p-1.5 dark:border-[hsl(222_18%_18%)]">
                    <button
                      type="button"
                      onClick={() => signOut({ callbackUrl: "/login" })}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs text-destructive transition-colors hover:bg-destructive/10 dark:hover:bg-white/5"
                    >
                      <LogOut className="h-3.5 w-3.5 shrink-0" /> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <DrawerLink href="/login" label="Sign in" icon={User} />
          )}
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-x-0 bottom-0 top-14 z-[45] bg-black/40 backdrop-blur-[2px] dark:bg-black/55 md:hidden"
          role="presentation"
          aria-hidden
          onClick={() => setMobileOpen(false)}
        />
      )}

      {desktopUserMenuPanel}
      {notifPanel}

    </>
  );
}

function NotifPanel({
  notifications,
  loading,
  onMarkAll,
  onClose,
  placement,
}: {
  notifications: NotifItem[];
  loading: boolean;
  onMarkAll: () => void;
  onClose: () => void;
  placement: { top: number; left: number; width: number };
}) {
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div
      data-notif-panel
      role="dialog"
      aria-label="Notifications"
      className="animate-notif-pop medqs-notif-panel"
      style={{
        position: "fixed",
        top: placement.top,
        left: placement.left,
        width: placement.width,
        maxHeight: "min(480px, calc(100vh - 24px))",
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        borderRadius: 16,
        background: "hsl(var(--card))",
        border: "1px solid hsl(var(--border))",
        boxShadow:
          "0 24px 48px rgba(0,0,0,.12), 0 0 0 1px rgba(255,255,255,.06) inset, 0 0 80px hsl(var(--primary) / .08)",
        overflow: "hidden",
        backdropFilter: "blur(12px)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 16px",
          borderBottom: "1px solid hsl(var(--border))",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Bell style={{ width: 16, height: 16, color: "hsl(var(--primary))" }} />
          <span style={{ fontSize: 14, fontWeight: 600 }}>Notifications</span>
          {unreadCount > 0 && (
            <span
              style={{
                background: "hsl(var(--primary))",
                color: "white",
                borderRadius: 20,
                padding: "2px 8px",
                fontSize: 10,
                fontWeight: 700,
              }}
            >
              {unreadCount}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={onMarkAll}
              style={{
                fontSize: 11,
                color: "hsl(var(--primary))",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              Mark all read
            </button>
          )}
          <button type="button" onClick={onClose} className="icon-btn" style={{ width: 28, height: 28 }}>
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {loading ? (
          <div style={{ padding: "24px 16px", textAlign: "center" }}>
            <div className="animate-pulse-soft" style={{ fontSize: 12, color: "hsl(var(--muted-foreground))" }}>
              Loading…
            </div>
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: "32px 16px", textAlign: "center", color: "hsl(var(--muted-foreground))", fontSize: 13 }}>
            No notifications yet
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid hsl(var(--border) / .5)",
                background: n.read ? "transparent" : "hsl(var(--primary) / .05)",
                cursor: "pointer",
                transition: "background .12s",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: n.read ? 400 : 600,
                      margin: "0 0 2px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {n.title}
                  </p>
                  <p style={{ fontSize: 11, color: "hsl(var(--muted-foreground))", margin: 0, lineHeight: 1.5 }}>
                    {n.body}
                  </p>
                </div>
                {!n.read && (
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "hsl(var(--primary))",
                      flexShrink: 0,
                      marginTop: 3,
                    }}
                  />
                )}
              </div>
              <p style={{ fontSize: 10, color: "hsl(var(--muted-foreground))", margin: "4px 0 0" }}>
                {new Date(n.createdAt).toLocaleDateString("en", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
