"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Home, BookOpen, Video, Mic, HelpCircle, MessageCircle,
  Clock, Users, Pen, Sparkles, Search, X,
  Maximize, Minimize, Sun, Moon, ChevronLeft, ChevronRight, Settings,
  Send
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSiteConfig } from "@/contexts/SiteConfigContext";
import { MedOneXLogoMark } from "@/components/branding/MedQsLogo";
import { ThemeVariantPicker } from "@/components/ui/ThemeVariantPicker";
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
  const router = useRouter();
  const { siteName } = useSiteConfig();
  const { theme, setTheme } = useThemeStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const sidebarWidth = isCompact ? 64 : 220;

  useEffect(() => { setMounted(true); }, []);

  const handleScroll = useCallback(() => {
    const currentY = window.scrollY;
    const threshold = 80;
    if (currentY < threshold) {
      setIsCollapsed(false);
    } else if (currentY > lastScrollY.current) {
      setIsCollapsed(true);
    } else {
      setIsCollapsed(false);
    }
    lastScrollY.current = currentY;
  }, []);

  const handleExpand = useCallback(() => {
    setIsExpanded(true);
    setIsCollapsed(false);
  }, []);

  const toggleCompact = useCallback(() => {
    setIsCompact(prev => !prev);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    const handleClickOutside = (e: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setIsExpanded(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handleScroll]);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  if (pathname && (pathname.startsWith("/ai-chat") || pathname.startsWith("/drawmed") || pathname.startsWith("/social") || pathname.startsWith("/modules"))) return null;

  const handleSearchInput = async (val: string) => {
    setSearchQuery(val);
    if (val.length < 2) { setSearchResults([]); return; }
    try {
      const res = await fetch(`/api/v1/search?q=${encodeURIComponent(val)}`);
      const data = await res.json();
      const combined = [
        ...(data.lectures || []),
        ...(data.modules || []),
        ...(data.quizzes || []),
        ...(data.users || []),
      ];
      setSearchResults(combined.slice(0, 6));
    } catch { /* silent */ }
  };

  const handleSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      setIsExpanded(false);
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
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
      {/* Collapsed avatar — sticks out from the left edge */}
      <AnimatePresence>
        {isCollapsed && !isExpanded && (
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onClick={handleExpand}
            className="fixed left-3 top-3 z-navbar hidden md:flex items-center justify-center cursor-pointer"
            title="Expand navigation"
          >
            <div className="relative">
              <div className="absolute inset-0 rounded-full opacity-20 blur-md bg-gradient-to-br from-primary/40 to-accent/40" />
              {avatarBlock("md")}
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        initial={{ x: 0 }}
        animate={{ 
          x: isCollapsed && !isExpanded ? -sidebarWidth : 0,
          opacity: isCollapsed && !isExpanded ? 0 : 1,
        }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="fixed left-0 top-0 h-full z-navbar hidden md:flex pointer-events-none"
      >
        <div
          ref={sidebarRef}
          className={cn(
            "pointer-events-auto flex flex-col h-full",
            "rounded-r-3xl border-r border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60",
            "shadow-[4px_0_30px_rgba(0,0,0,0.08)]",
            "transition-all duration-300 ease-out",
            isCompact ? "w-16" : "w-[220px]"
          )}
        >
          {/* Logo Section */}
          <div className={cn(
            "flex items-center border-b border-border/20",
            isCompact ? "justify-center px-0 pt-5 pb-4" : "gap-2.5 px-4 pt-5 pb-4"
          )}>
            <MedOneXLogoMark className="h-7 w-7 shrink-0 text-[#13171E] dark:text-white" interactiveColor />
            {!isCompact && (
              <span className="text-sm font-bold tracking-tight text-[#13171E] dark:text-white truncate">{siteName}</span>
            )}
          </div>

          {/* Nav Items — icon only or icon + label */}
          <nav className={cn(
            "flex-1 overflow-y-auto py-3 space-y-0.5",
            isCompact ? "px-1.5" : "px-2"
          )}>
            {NAV_ITEMS.map((item) => {
              const active = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center rounded-xl transition-all duration-200 group",
                    active
                      ? "bg-primary/10 text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
                    isCompact
                      ? "justify-center h-10 w-10 mx-auto"
                      : "gap-3 px-3 py-2.5"
                  )}
                  title={isCompact ? item.label : undefined}
                >
                  <Icon className={cn("h-4 w-4 shrink-0", item.glow && !active && "text-primary")} />
                  {!isCompact && (
                    <span className="text-xs font-medium truncate">{item.label}</span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Bottom Section */}
          <div className="border-t border-border/20 py-3 space-y-2">
            {/* Avatar */}
            <button
              onClick={handleExpand}
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

            {/* Action Icons + Toggle */}
            <div className={cn(
              "flex items-center gap-1",
              isCompact ? "flex-col px-1" : "px-1"
            )}>
              <button
                onClick={handleExpand}
                className="grid h-8 w-8 place-items-center text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/40 transition-all"
                title="Search"
              >
                <Search className="h-3.5 w-3.5" />
              </button>
              {mounted && (
                <button
                  onClick={toggleTheme}
                  className="grid h-8 w-8 place-items-center text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/40 transition-all"
                  title="Toggle theme"
                >
                  {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                </button>
              )}
              {!isCompact && (
                <button
                  onClick={toggleFullscreen}
                  className="hidden lg:grid h-8 w-8 place-items-center text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/40 transition-all"
                  title="Fullscreen"
                >
                  {isFullscreen ? <Minimize className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />}
                </button>
              )}
              {/* Toggle compact/full */}
              <button
                onClick={toggleCompact}
                className="grid h-8 w-8 place-items-center text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/40 transition-all"
                title={isCompact ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isCompact ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Expanded overlay panel */}
      <AnimatePresence>
        {isExpanded && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[calc(var(--z-navbar)-1)] bg-black/20 backdrop-blur-sm hidden md:block"
              onClick={() => setIsExpanded(false)}
            />
            <motion.div
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              style={{ left: sidebarWidth }}
              className="fixed top-0 h-full z-navbar hidden md:flex flex-col w-[400px] border-r border-border/40 bg-background/95 backdrop-blur-xl shadow-2xl"
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
                    onKeyDown={handleSearchKey}
                    placeholder="Search modules, lectures, peers..."
                    className="w-full h-11 rounded-xl border border-border bg-background pl-10 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                    autoFocus
                  />
                  <AnimatePresence>
                    {searchResults.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute left-0 right-0 top-full mt-2 z-10 rounded-xl border border-border bg-card shadow-xl overflow-hidden p-1"
                      >
                        {searchResults.map((item, idx) => (
                          <Link key={idx} href={item.href} onClick={() => setIsExpanded(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary transition-all text-sm font-medium text-foreground">
                            {item.label}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Quick actions */}
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

                {/* Theme Picker */}
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Theme</p>
                  <ThemeVariantPicker onSelect={() => setIsExpanded(false)} />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
