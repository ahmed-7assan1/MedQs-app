"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search, Bell, Bookmark, ChevronDown, PanelLeft, X,
  BookOpen, Folder, HelpCircle, Users, Sparkles, Settings, Send,
  LogOut, User, CheckCheck, Clock,
} from "lucide-react";
import { useSidebar } from "@/contexts/SidebarContext";
import { setView } from "@/lib/view-store";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface TopBarProps {
  userName?: string | null;
  userImage?: string | null;
}

export default function TopBar({ userName, userImage }: TopBarProps) {
  const initials = userName
    ? userName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "A";
  const { isOpen, isCollapsed, setCollapsed, toggle, close } = useSidebar();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchData, setSearchData] = useState<{
    lectures: any[]; modules: any[]; quizzes: any[]; users: any[];
  } | null>(null);
  const [searching, setSearching] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController>();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSearchInput = (val: string) => {
    setSearchQuery(val);
    if (val.length < 3) { setSearchData(null); setSearching(false); return; }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setSearching(true);
    fetch(`/api/v1/search?q=${encodeURIComponent(val)}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        setSearchData({
          lectures: (data.lectures || []).slice(0, 4),
          modules: (data.modules || []).slice(0, 4),
          quizzes: (data.quizzes || []).slice(0, 4),
          users: (data.users || []).slice(0, 4),
        });
      })
      .catch(() => { })
      .finally(() => setSearching(false));
  };

  const handleToggle = () => {
    if (isOpen && isCollapsed) {
      setCollapsed(false);
    } else if (isOpen) {
      close();
    } else {
      toggle();
      setCollapsed(false);
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const fetchNotifications = async () => {
    setNotifLoading(true);
    try {
      const res = await fetch("/api/v1/notifications");
      if (res.ok) setNotifications(await res.json());
    } catch { /* ignore */ }
    setNotifLoading(false);
  };

  const markAsRead = async (id: string) => {
    await fetch(`/api/v1/notifications/${id}/read`, { method: "PUT" });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllAsRead = async () => {
    await fetch("/api/v1/notifications/read-all", { method: "PUT" });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header
      className={cn(
        "fixed top-0 z-40 bg-background/70 backdrop-blur-xl transition-all duration-500 ease-in-out",
        !isOpen
          ? "left-0 right-0"
          : isCollapsed
            ? "left-0 right-0 lg:left-16 lg:right-0"
            : "left-0 right-0 lg:left-60 lg:right-0",
        scrolled && "shadow-sm border-b border-border/50"
      )}
    >
      <div className={cn(
        "mx-auto flex items-center gap-4 px-6 py-4 transition-all duration-500 ease-in-out",
        isOpen && !isCollapsed
          ? "max-w-[1240px]"
          : isOpen && isCollapsed
            ? "max-w-[1360px]"
            : "max-w-[1520px]"
      )}>
      <button
        onClick={handleToggle}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-card text-muted-foreground shadow-[var(--shadow-card)] ring-1 ring-border/60 transition hover:bg-accent hover:text-foreground"
        title="Toggle sidebar"
      >
        <PanelLeft className="h-4 w-4" />
      </button>
      <div ref={searchRef} className="relative flex-1 max-w-xl">
        <div className="flex items-center gap-3 rounded-full bg-card px-4 py-2.5 shadow-[var(--shadow-card)] ring-1 ring-border/60">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => { handleSearchInput(e.target.value); if (!searchOpen) setSearchOpen(true); }}
            onFocus={() => setSearchOpen(true)}
            placeholder="Search modules, lectures, videos..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {searchQuery && (
            <button onClick={() => { setSearchQuery(""); setSearchData(null); setSearchOpen(false); }}>
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
          <kbd className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground shrink-0">
            ⌘K
          </kbd>
        </div>

        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-border/30 bg-background shadow-xl"
            >
              <div className="relative">
                {searching && (
                  <div className="absolute bottom-0 left-2 right-2 h-0.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full w-full rounded-full bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-loading-bar" />
                  </div>
                )}
              </div>

              {searchQuery.length >= 3 && (
                <div className="max-h-[50vh] overflow-y-auto px-3 py-3 space-y-4">
                  {searchData ? (() => {
                    const sections = [
                      { key: 'lectures', label: 'Lectures', icon: BookOpen, items: searchData.lectures, color: 'text-blue-500' },
                      { key: 'modules', label: 'Modules', icon: Folder, items: searchData.modules, color: 'text-amber-500' },
                      { key: 'quizzes', label: 'Quizzes', icon: HelpCircle, items: searchData.quizzes, color: 'text-emerald-500' },
                      { key: 'users', label: 'Users', icon: Users, items: searchData.users, color: 'text-purple-500' },
                    ].filter((s) => s.items.length > 0);
                    return sections.length > 0 ? (
                      sections.map((section) => {
                        const Icon = section.icon;
                        return (
                          <div key={section.key}>
                            <div className="flex items-center gap-2 mb-1.5">
                              <Icon className={`h-3 w-3 ${section.color}`} />
                              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{section.label}</span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                              {section.items.map((item: any, idx: number) => (
                                <Link
                                  key={idx}
                                  href={item.href || '#'}
                                  onClick={() => { setSearchOpen(false); setSearchQuery(""); setSearchData(null); }}
                                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-all"
                                >
                                  {item.label}
                                </Link>
                              ))}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-2">No results found</p>
                    );
                  })() : (
                    <div className="space-y-2">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Quick Actions</p>
                      <div className="flex flex-col gap-1.5">
                        <Link href="/ai-chat" onClick={() => { setSearchOpen(false); setSearchQuery(""); setSearchData(null); }}
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 bg-primary/10 text-primary font-semibold text-sm hover:bg-primary/20 transition-all">
                          <Sparkles className="h-4 w-4" /> Consult Dr. Q
                        </Link>
                        <Link href="/settings" onClick={() => { setSearchOpen(false); setSearchQuery(""); setSearchData(null); }}
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 border border-border bg-card text-sm font-medium text-muted-foreground hover:bg-muted/40 transition-all">
                          <Settings className="h-4 w-4" /> Settings
                        </Link>
                        <a href="https://t.me/MedOneX_bot" target="_blank" rel="noreferrer"
                          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 border border-border bg-card text-sm font-medium text-muted-foreground hover:bg-muted/40 transition-all">
                          <Send className="h-4 w-4 text-sky-500" /> Telegram
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setNotifOpen((p) => !p); if (!notifications.length) fetchNotifications(); setSearchOpen(false); setUserMenuOpen(false); }}
            className="relative grid h-9 w-9 place-items-center rounded-full bg-card text-foreground shadow-[var(--shadow-card)] ring-1 ring-border/60 transition hover:bg-accent"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-[14px] place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground ring-2 ring-background">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-11 z-[60] w-[380px] overflow-hidden rounded-2xl border border-border/30 bg-card shadow-xl"
              >
                <div className="flex items-center justify-between border-b border-border/20 px-4 py-3">
                  <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                      <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-[400px] overflow-y-auto">
                  {notifLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="h-5 w-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-12 text-center">
                      <Bell className="h-8 w-8 text-muted-foreground/40" />
                      <p className="text-sm font-medium text-muted-foreground">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((n: any) => {
                      const diff = Date.now() - new Date(n.createdAt).getTime();
                      const mins = Math.floor(diff / 60000);
                      const timeAgo = mins < 1 ? "Just now" : mins < 60 ? `${mins}m ago` : mins < 1440 ? `${Math.floor(mins / 60)}h ago` : `${Math.floor(mins / 1440)}d ago`;
                      return (
                        <button
                          key={n.id}
                          onClick={() => { if (!n.read) markAsRead(n.id); }}
                          className={cn(
                            "flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-muted/40",
                            !n.read && "bg-primary/5"
                          )}
                        >
                          <span className={cn(
                            "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                            n.read ? "bg-transparent" : "bg-primary"
                          )} />
                          <div className="min-w-0 flex-1">
                            <p className={cn(
                              "text-sm leading-snug",
                              !n.read ? "font-semibold text-foreground" : "font-medium text-muted-foreground"
                            )}>
                              {n.title}
                            </p>
                            {n.body && (
                              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground/70">{n.body}</p>
                            )}
                            <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground/50">
                              <Clock className="h-3 w-3" /> {timeAgo}
                            </p>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button
          onClick={() => setView("saved")}
          className="relative grid h-9 w-9 place-items-center rounded-full bg-card text-foreground shadow-[var(--shadow-card)] ring-1 ring-border/60 transition hover:bg-accent"
        >
          <Bookmark className="h-4 w-4" />
        </button>

        {/* ── Avatar + Dropdown ── */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => { setUserMenuOpen((p) => !p); setSearchOpen(false); }}
            className="flex items-center gap-2 rounded-full bg-card px-1 py-1 pr-2 shadow-[var(--shadow-card)] ring-1 ring-border/60 transition hover:bg-accent"
          >
            {userImage ? (
              <img
                src={userImage}
                alt={userName || "User"}
                className="h-7 w-7 rounded-full object-cover"
              />
            ) : (
              <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-primary to-[hsl(180,70%,40%)] text-xs font-semibold text-primary-foreground">
                {initials}
              </span>
            )}
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>

          <AnimatePresence>
            {userMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-11 z-[60] w-56 overflow-hidden rounded-2xl border border-border/30 bg-card shadow-xl"
              >
                {/* User info */}
                <div className="border-b border-border/20 px-4 py-3">
                  <p className="text-sm font-semibold text-foreground truncate">{userName || "User"}</p>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Student Account</p>
                </div>

                {/* Menu items */}
                <div className="py-1.5">
                  <Link
                    href="/profile/me"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-[13px] font-medium text-foreground hover:bg-muted/60 transition-colors"
                  >
                    <User className="h-4 w-4 text-muted-foreground" />
                    View Profile
                  </Link>
                  <Link
                    href="/profile/edit"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-[13px] font-medium text-foreground hover:bg-muted/60 transition-colors"
                  >
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    Settings
                  </Link>
                </div>

                {/* Sign out */}
                <div className="border-t border-border/20 py-1.5">
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-[13px] font-medium text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      </div>
    </header>
  );
}
