"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Home, BookOpen, Video, Mic, HelpCircle, MessageCircle,
  Clock, Users, Pen, Sparkles, Search, X,
  Sun, Moon, Settings, Send, Folder, ChevronLeft, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSiteConfig } from "@/contexts/SiteConfigContext";
import { MedOneXLogoMark } from "@/components/branding/MedQsLogo";
import { useThemeStore } from "@/lib/store";

const NAV_ITEMS = [
  { href: "/dashboard-app", label: "Home", icon: Home },
  { href: "/modules", label: "Lectures", icon: BookOpen },
  { href: "/videos", label: "Videos", icon: Video },
  { href: "/podcasts", label: "Podcasts", icon: Mic },
  { href: "/past-papers", label: "Quizzes", icon: HelpCircle },
  { href: "/social", label: "Community", icon: MessageCircle },
  { href: "/taskat", label: "Tasks", icon: Clock },
  { href: "/teams", label: "Teams", icon: Users },
  { href: "/drawmed", label: "DrawMed", icon: Pen },
  { href: "/ai-chat", label: "AI Chat", icon: Sparkles, glow: true },
];

export function FloatingIslandNavbar({ 
  userImage, 
  userName, 
  userId 
}: { 
  userImage?: string | null; 
  userName?: string | null; 
  userId?: string 
}) {
  const pathname = usePathname();
  const { siteName } = useSiteConfig();
  const { theme, setTheme } = useThemeStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCompact, setIsCompact] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchData, setSearchData] = useState<{
    lectures: any[];
    modules: any[];
    quizzes: any[];
    users: any[];
  } | null>(null);
  const [searching, setSearching] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController>();
  const sidebarWidth = isCompact ? (isLargeScreen ? 64 : 56) : (isLargeScreen ? 220 : 180);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsLargeScreen(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsLargeScreen(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const handleExpand = useCallback(() => {
    setIsExpanded(true);
  }, []);

  const toggleCompact = useCallback(() => {
    setIsCompact(prev => !prev);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setIsExpanded(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hideSidebar = pathname && (pathname.startsWith("/ai-chat") || pathname.startsWith("/drawmed"));

  useEffect(() => {
    const offset = hideSidebar ? 0 : sidebarWidth;
    document.documentElement.style.setProperty("--sidebar-offset", `${offset}px`);
  }, [hideSidebar, sidebarWidth, isCompact]);

  if (pathname && (pathname.startsWith("/ai-chat") || pathname.startsWith("/drawmed"))) return null;

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
      .catch(() => {})
      .finally(() => {
        setSearching(false);
      });
  };

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  const avatarBlock = (size: "sm" | "md" = "md") => {
    const dim = size === "sm" ? "h-8 w-8" : "h-10 w-10";
    return (
      <div className={cn("rounded-full overflow-hidden border-2 border-border shrink-0", dim)}>
        {userImage ? (
          <img 
            src={userImage} 
            alt="Profile" 
            className="h-full w-full object-cover" 
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const nextSibling = e.currentTarget.nextElementSibling as HTMLElement;
              if (nextSibling) nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div 
          className="h-full w-full flex items-center justify-center bg-primary/10 text-primary text-xs font-black"
          style={{ display: userImage ? 'none' : 'flex' }}
        >
          {userName ? userName.charAt(0).toUpperCase() : "U"}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Sidebar — compact (icons only) or expanded (icons + labels) */}
      <div className="fixed left-0 top-0 h-full z-[calc(var(--z-navbar)+3)] hidden md:flex">
        <div
          ref={sidebarRef}
          style={{ width: sidebarWidth }}
          className={cn(
            "flex flex-col h-full border-r border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 shadow-[4px_0_30px_rgba(0,0,0,0.08)] transition-all duration-300 ease-out",
            isCompact && "cursor-pointer"
          )}
        >
          {/* Logo */}
          <div className={cn(
            "flex items-center border-b border-border/20",
            isCompact ? "justify-center pt-5 pb-4" : "gap-3 px-5 pt-5 pb-4"
          )}>
            <MedOneXLogoMark className="h-7 w-7 shrink-0 text-[#13171E] dark:text-white" interactiveColor />
            {!isCompact && (
              <span className="text-base font-bold tracking-tight text-[#13171E] dark:text-white truncate">{siteName}</span>
            )}
          </div>

          {/* Nav Items */}
          <nav className={cn(
            "flex-1 overflow-y-auto py-3 space-y-0.5",
            isCompact ? "px-1.5" : "px-2.5"
          )}>
            {NAV_ITEMS.map((item) => {
              const active = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={(e) => e.stopPropagation()}
                  className={cn(
                    "flex items-center rounded-xl transition-all duration-200 group",
                    active
                      ? "bg-primary/10 text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
                    isCompact
                      ? "justify-center h-10 w-10 mx-auto"
                      : "w-full gap-3.5 px-4 py-2.5"
                  )}
                  title={isCompact ? item.label : undefined}
                >
                  <Icon className={cn("shrink-0", item.glow && !active && "text-primary", isCompact ? "h-4 w-4" : "h-5 w-5")} />
                  {!isCompact && (
                    <span className="text-sm font-medium truncate">{item.label}</span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Bottom Section — reordered: Actions Icons → Avatar → Chevron */}
          <div className="border-t border-border/20 py-3 space-y-2">
            {/* Action Icons (top) */}
            <div className={cn(
              "flex items-center gap-1",
              isCompact ? "flex-col px-1" : "px-2"
            )}>
              <button
                onClick={(e) => { e.stopPropagation(); handleExpand(); }}
                className="grid h-8 w-8 place-items-center text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/40 transition-all"
                title="Search"
              >
                <Search className="h-3.5 w-3.5" />
              </button>
              {mounted && (
                <button
                  onClick={(e) => { e.stopPropagation(); toggleTheme(); }}
                  className="grid h-8 w-8 place-items-center text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/40 transition-all"
                  title="Toggle theme"
                >
                  {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                </button>
              )}
            </div>

            {/* Avatar + name (middle) */}
            <button
              onClick={(e) => { e.stopPropagation(); toggleCompact(); }}
              className={cn(
                "flex items-center rounded-xl hover:bg-muted/40 transition-all",
                isCompact ? "justify-center mx-auto p-1" : "gap-2.5 px-3 p-2 w-full"
              )}
              title={isCompact ? "Open menu" : undefined}
            >
              {avatarBlock("sm")}
              {!isCompact && (
                <>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-xs font-bold text-foreground truncate">{userName || "User"}</p>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                </>
              )}
            </button>

            {/* Expand/collapse Chevron (bottom) */}
            <div className={cn(
              "flex items-center",
              isCompact ? "justify-center" : "justify-end px-2"
            )}>
              <button
                onClick={(e) => { e.stopPropagation(); toggleCompact(); }}
                className="grid h-8 w-8 place-items-center text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/40 transition-all"
                title={isCompact ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isCompact ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded overlay panel — no backdrop */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{ left: sidebarWidth }}
            className="fixed top-0 h-full z-[calc(var(--z-navbar)+3)] hidden md:flex flex-col w-[400px] rounded-r-3xl border-r border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 shadow-[4px_0_30px_rgba(0,0,0,0.08)]"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border/20">
                <div className="flex items-center gap-3">
                  <MedOneXLogoMark className="h-7 w-7 shrink-0 text-[#13171E] dark:text-white" interactiveColor />
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{siteName || "MedOneX"}</h3>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Quick Navigation</p>
                  </div>
                </div>
                <button onClick={() => setIsExpanded(false)} className="grid h-8 w-8 place-items-center text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/40 transition-all" title="Close">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchInput(e.target.value)}
                    placeholder="Search modules, lectures, peers..."
                    className="w-full h-11 rounded-xl border border-border bg-background pl-10 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                    autoFocus
                  />
                  {searching && (
                    <div className="absolute bottom-0 left-2 right-2 h-0.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full w-full rounded-full bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-loading-bar" />
                    </div>
                  )}
                </div>

                {/* Categorized results or quick actions */}
                {searchData ? (() => {
                  const sections = [
                    { key: 'lectures', label: 'Lectures', icon: BookOpen, items: searchData.lectures, color: 'text-blue-500' },
                    { key: 'modules', label: 'Modules', icon: Folder, items: searchData.modules, color: 'text-amber-500' },
                    { key: 'quizzes', label: 'Quizzes', icon: HelpCircle, items: searchData.quizzes, color: 'text-emerald-500' },
                    { key: 'users', label: 'Users', icon: Users, items: searchData.users, color: 'text-purple-500' },
                  ].filter((s) => s.items.length > 0);
                  return sections.length > 0 ? (
                    <div className="space-y-5">
                      {sections.map((section) => {
                        const Icon = section.icon;
                        return (
                          <div key={section.key}>
                            <div className="flex items-center gap-2 mb-2">
                              <Icon className={`h-3.5 w-3.5 ${section.color}`} />
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{section.label}</p>
                            </div>
                            <div className="flex flex-col gap-0.5">
                              {section.items.map((item: any, idx: number) => (
                                <Link key={idx} href={item.href || '#'} onClick={() => setIsExpanded(false)}
                                  className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-secondary transition-all text-sm font-medium text-foreground">
                                  {item.label}
                                </Link>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-4">No results found</p>
                  );
                })() : (
                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Quick Actions</p>
                    <div className="flex flex-col gap-2">
                      <Link href="/ai-chat" onClick={() => setIsExpanded(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 text-primary font-semibold text-sm hover:bg-primary/20 transition-all">
                        <Sparkles className="h-4 w-4" /> Consult Dr. Q
                      </Link>
                      <Link href="/settings" onClick={() => setIsExpanded(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card text-sm font-medium text-muted-foreground hover:bg-muted/40 transition-all">
                        <Settings className="h-4 w-4" /> Settings
                      </Link>
                      <a href="https://t.me/MedOneX_bot" target="_blank" rel="noreferrer"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card text-sm font-medium text-muted-foreground hover:bg-muted/40 transition-all">
                        <Send className="h-4 w-4 text-sky-500" /> Telegram
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
