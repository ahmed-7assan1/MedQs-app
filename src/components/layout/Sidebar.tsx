"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
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
  User,
  Sun,
  Moon,
  ChevronDown,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useNotificationStore, useThemeStore } from "@/lib/store";
import { cn } from "@/lib/utils";

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
  { href: "/past-papers", label: "Quizzes", icon: HelpCircle },
  { href: "/forum", label: "Forum", icon: MessageSquare },
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
  const [mounted, setMounted] = useState(false);

  const notifTriggerRef = useRef<HTMLElement | null>(null);
  const desktopUserRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    if (!desktopUserOpen) return;
    function handler(e: MouseEvent) {
      if (desktopUserRef.current && !desktopUserRef.current.contains(e.target as Node)) {
        setDesktopUserOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [desktopUserOpen]);

  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
    setDesktopUserOpen(false);
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
    return logoUrl ? (
      <img src={logoUrl} alt={siteName} className={cn("h-8 w-8 rounded-lg object-contain", className)} />
    ) : (
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-primary-foreground shadow-md",
          className
        )}
        style={{ background: "hsl(var(--primary))", fontFamily: "var(--font-display)" }}
      >
        {siteName[0]}
      </div>
    );
  }

  function TopNavLink({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) {
    const active = isActive(href);
    return (
      <Link
        href={href}
        className={cn(
          "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          active
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <Icon className="h-4 w-4 opacity-90" />
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

  const notifBtnClass = "icon-btn relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-transparent hover:bg-muted";

  return (
    <>
      {/* ── Desktop: top bar ── */}
      <header className="fixed top-0 left-0 right-0 z-[120] hidden h-14 items-center overflow-visible border-b border-border/80 bg-card/90 shadow-sm backdrop-blur-md md:flex">
        <div className="mx-auto flex h-full w-full max-w-[1600px] items-center gap-4 px-4 lg:gap-6">
          <Link href="/dashboard-app" className="flex shrink-0 items-center gap-2.5">
            <BrandMark />
            <span className="font-display text-base font-bold tracking-tight text-foreground">{siteName}</span>
          </Link>

          <nav className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto py-1 lg:gap-1">
            {NAV.map(({ href, label, icon }) => (
              <TopNavLink key={href} href={href} label={label} icon={icon} />
            ))}
            {isAdmin && (
              <TopNavLink href="/admin/dashboard" label="Admin" icon={ShieldCheck} />
            )}
            {!isGuest && <TopNavLink href="/ai-chat" label="Dr. Q" icon={Sparkles} />}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            {!isGuest && (
              <button
                type="button"
                className={notifBtnClass}
                data-notif-trigger
                onClick={openNotifPanel}
                aria-expanded={notifOpen}
                aria-haspopup="dialog"
              >
                <Bell className="h-[18px] w-[18px] text-muted-foreground" />
                {totalUnread > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
                    {totalUnread > 9 ? "9+" : totalUnread}
                  </span>
                )}
              </button>
            )}

            <button
              type="button"
              className={notifBtnClass}
              onClick={toggleAppearance}
              title="Switch light / dark mode"
              aria-label="Switch light / dark mode"
            >
              {!mounted ? (
                <Moon className="h-[18px] w-[18px] text-muted-foreground opacity-40" />
              ) : theme === "dark" ||
                (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) ? (
                <Sun className="h-[18px] w-[18px] text-muted-foreground" />
              ) : (
                <Moon className="h-[18px] w-[18px] text-muted-foreground" />
              )}
            </button>

            {!isGuest ? (
              <div className="relative flex items-center gap-0.5" ref={desktopUserRef}>
                <Link
                  href="/profile/me"
                  title="Profile"
                  className="flex max-w-[10rem] items-center gap-2 rounded-lg border border-border/80 bg-background/80 px-2 py-1.5 text-left transition-colors hover:bg-muted"
                  onClick={() => setDesktopUserOpen(false)}
                >
                  {userImage ? (
                    <img
                      src={userImage}
                      alt=""
                      className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-border"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-primary-foreground"
                      style={{ background: "hsl(var(--primary))" }}
                    >
                      {initial}
                    </div>
                  )}
                  <span className="hidden min-w-0 flex-1 truncate text-sm font-medium lg:block">{userName}</span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setDesktopUserOpen((p) => !p);
                    setUserMenuOpen(false);
                  }}
                  className="icon-btn flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/60 hover:bg-muted"
                  aria-expanded={desktopUserOpen}
                  aria-haspopup="menu"
                  aria-label="Account menu"
                >
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform duration-200",
                      desktopUserOpen && "rotate-180"
                    )}
                  />
                </button>
                {desktopUserOpen && (
                  <div
                    className="absolute right-0 top-full z-[200] mt-1.5 w-52 overflow-hidden rounded-xl border border-border bg-card py-1 shadow-xl animate-fade-in"
                    role="menu"
                  >
                    <Link
                      href="/profile/me"
                      role="menuitem"
                      onClick={() => setDesktopUserOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                    >
                      <User className="h-4 w-4 text-muted-foreground" /> Profile
                    </Link>
                    <Link
                      href="/settings"
                      role="menuitem"
                      onClick={() => setDesktopUserOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                    >
                      <Settings className="h-4 w-4 text-muted-foreground" /> Settings
                    </Link>
                    <div className="my-1 h-px bg-border" />
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => signOut({ callbackUrl: "/login" })}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-muted"
                    >
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ── Mobile: top bar + h-opens drawer ── */}
      <div className="medqs-mobile-bar fixed top-0 left-0 right-0 z-[125] flex h-14 items-center justify-between border-b border-border bg-card/95 px-3 backdrop-blur-md md:hidden">
        <button
          type="button"
          className="icon-btn flex h-10 w-10 items-center justify-center rounded-lg hover:bg-muted"
          onClick={() => setMobileOpen((p) => !p)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <Link href="/dashboard-app" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
          <BrandMark className="!h-7 !w-7" />
          <span className="font-display text-sm font-semibold">{siteName}</span>
        </Link>
        <div className="flex shrink-0 items-center justify-end gap-0.5">
          <button
            type="button"
            className={notifBtnClass}
            onClick={toggleAppearance}
            aria-label="Switch light / dark mode"
          >
            {!mounted ? (
              <Moon className="h-[18px] w-[18px] opacity-40" />
            ) : theme === "dark" ||
              (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) ? (
              <Sun className="h-[18px] w-[18px]" />
            ) : (
              <Moon className="h-[18px] w-[18px]" />
            )}
          </button>
          {!isGuest ? (
            <button
              type="button"
              className={notifBtnClass}
              data-notif-trigger
              onClick={openNotifPanel}
              aria-expanded={notifOpen}
            >
              <Bell className="h-[18px] w-[18px]" />
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
          "medqs-drawer fixed bottom-0 left-0 top-14 z-[115] flex w-[min(280px,88vw)] flex-col border-r border-white/10 shadow-2xl transition-transform duration-300 ease-out md:hidden",
          "bg-[hsl(222_32%_7%)]",
          mobileOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"
        )}
        aria-hidden={!mobileOpen}
      >
        <div className="sb-rail-glow" aria-hidden />

        <div className="flex h-12 shrink-0 items-center justify-between border-b border-white/10 px-3">
          <span className="font-display text-sm font-semibold text-white">{siteName}</span>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1.5 text-white/70 hover:bg-white/10"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="sb-nav">
          <div className="sb-section-label">Main</div>
          {NAV.map(({ href, label, icon }) => (
            <DrawerLink key={href} href={href} label={label} icon={icon} />
          ))}

          {isAdmin && (
            <>
              <div className="sb-section-label">Admin</div>
              <DrawerLink href="/admin/dashboard" label="Admin Panel" icon={ShieldCheck} />
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

          <div className="sb-section-label">Appearance</div>
          <div className="flex gap-2 px-2 pb-2">
            <button
              type="button"
              className={cn(
                "flex-1 rounded-lg py-2 text-xs font-medium text-white/90 transition-colors",
                theme === "light" ? "bg-white/20" : "bg-white/5 hover:bg-white/10"
              )}
              onClick={() => setTheme("light")}
            >
              Light
            </button>
            <button
              type="button"
              className={cn(
                "flex-1 rounded-lg py-2 text-xs font-medium text-white/90 transition-colors",
                theme === "dark" ? "bg-white/20" : "bg-white/5 hover:bg-white/10"
              )}
              onClick={() => setTheme("dark")}
            >
              Dark
            </button>
          </div>
        </nav>

        <div className="sb-footer">
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
                    className="h-8 w-8 flex-shrink-0 rounded-full object-cover ring-1 ring-white/10"
                  />
                ) : (
                  <div
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                    style={{ background: "hsl(var(--primary))" }}
                  >
                    {initial}
                  </div>
                )}
                <div className="sb-user-info">
                  <p className="truncate text-xs font-semibold text-white/80">{userName}</p>
                  <p className="truncate text-[10px] text-white/35">Student</p>
                </div>
              </button>

              {userMenuOpen && (
                <div
                  className="animate-notif-pop absolute bottom-full left-0 right-0 z-50 mb-2 overflow-hidden rounded-xl border"
                  style={{
                    background: "hsl(222 24% 12%)",
                    borderColor: "hsl(222 18% 18%)",
                    boxShadow: "0 -8px 32px rgba(0,0,0,.4)",
                  }}
                >
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
                        className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs text-white/60 transition-colors hover:bg-white/5 hover:text-white"
                      >
                        <Icon style={{ width: 13, height: 13 }} /> {label}
                      </Link>
                    ))}
                  </div>
                  <div className="border-t p-1.5" style={{ borderColor: "hsl(222 18% 18%)" }}>
                    <button
                      type="button"
                      onClick={() => signOut({ callbackUrl: "/login" })}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs transition-colors"
                      style={{ color: "hsl(0 65% 60%)" }}
                    >
                      <LogOut style={{ width: 13, height: 13 }} /> Sign out
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
          className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-sm md:hidden"
          role="presentation"
          aria-hidden
          onClick={() => setMobileOpen(false)}
        />
      )}

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
