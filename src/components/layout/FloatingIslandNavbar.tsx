"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Home, BookOpen, Video, Mic, HelpCircle, MessageCircle,
  Clock, Users, Pen, Sparkles, Search, X,
  Maximize, Minimize, Sun, Moon, ChevronDown, Settings,
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
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const islandRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);

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

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    const handleClickOutside = (e: MouseEvent) => {
      if (islandRef.current && !islandRef.current.contains(e.target as Node)) {
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

  // Shared avatar renderer
  const avatarMarkup = (
    <div className="h-8 w-8 rounded-full overflow-hidden border-2 border-border">
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

  return (
    <>
      {/* Collapsed avatar — visible only when scrolled down and not expanded */}
      <AnimatePresence>
        {isCollapsed && !isExpanded && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -10 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onClick={handleExpand}
            className="fixed top-3 right-6 z-navbar hidden md:flex items-center justify-center cursor-pointer"
            title="Expand navigation"
          >
            {/* Floating avatar — circular, no curve outward */}
            <div className="relative">
              <div className={cn(
                "absolute inset-0 rounded-full opacity-20 blur-md transition-opacity",
                "bg-gradient-to-br from-primary/40 to-accent/40"
              )} />
              <div className="relative h-10 w-10 rounded-full overflow-hidden border-2 border-border/80 shadow-lg ring-2 ring-background transition-all duration-300 hover:border-primary/40 hover:shadow-[0_0_20px_-5px_hsl(var(--primary)/0.3)]">
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
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Full floating island */}
      <motion.div
        id="desktop-nav-island"
        initial={{ y: 0 }}
        animate={{ 
          y: isCollapsed && !isExpanded ? -120 : 0,
          opacity: isCollapsed && !isExpanded ? 0 : 1,
        }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-x-0 top-0 z-navbar hidden md:flex justify-center items-start pointer-events-none"
      >
        <div
          ref={islandRef}
          className={cn(
            "pointer-events-auto relative flex flex-col items-center overflow-hidden",
            "rounded-2xl border border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60",
            "shadow-[0_8px_30px_rgba(0,0,0,0.12)]",
            "transition-all duration-300 ease-out mt-3",
            isExpanded
              ? "w-full p-6"
              : "w-[min(1200px,calc(100vw-32px))] px-5 py-2.5"
          )}
        >
          {!isExpanded && (
            <div className="flex w-full items-center justify-between gap-2">
              {/* Logo + Site Name */}
              <div className="flex items-center gap-2">
                <MedOneXLogoMark className="h-8 w-8 shrink-0 text-[#13171E] dark:text-white" interactiveColor />
                <div className="flex items-center gap-2">
                  <div className="h-6 w-px bg-[#49495A] dark:bg-white/20" />
                  <span className="text-[15px] font-bold tracking-tight text-[#13171E] dark:text-white mt-0.5">{siteName}</span>
                </div>
              </div>

              {/* Nav Links — أيقونات فقط */}
              <nav className="flex items-center justify-center gap-0.5">
                {NAV_ITEMS.map((item) => {
                  const active = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-lg transition-colors",
                        active
                          ? "text-foreground bg-secondary"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                      )}
                      title={item.label}
                    >
                      <item.icon className={cn("h-3.5 w-3.5 shrink-0", item.glow && !active && "text-primary")} />
                    </Link>
                  );
                })}
              </nav>

              {/* Right Side */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={handleExpand}
                  className="grid h-9 w-9 shrink-0 place-items-center text-muted-foreground transition-all hover:text-foreground rounded-full border border-border bg-card hover:shadow-sm"
                  title="Search"
                >
                  <Search className="h-4 w-4" />
                </button>

                <button
                  onClick={toggleFullscreen}
                  className="hidden lg:grid h-9 w-9 shrink-0 place-items-center text-muted-foreground transition-all hover:text-foreground rounded-full border border-border bg-card hover:shadow-sm"
                  title="Fullscreen"
                >
                  {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                </button>

                {mounted && (
                  <button
                    onClick={toggleTheme}
                    className="grid h-9 w-9 shrink-0 place-items-center text-muted-foreground transition-all hover:text-foreground rounded-full border border-border bg-card hover:shadow-sm"
                    title="Toggle theme"
                  >
                    {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </button>
                )}

                <button
                  onClick={handleExpand}
                  className="flex items-center gap-1 rounded-full p-1 transition-all hover:bg-secondary/50"
                  title="Open menu"
                >
                  {avatarMarkup}
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </button>
              </div>
            </div>
          )}

          {/* EXPANDED PANEL — Search + Quick Actions + Theme */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
                className="w-full space-y-6"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MedOneXLogoMark className="h-8 w-8 shrink-0 text-[#13171E] dark:text-white" interactiveColor />
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-px bg-[#49495A] dark:bg-white/20" />
                      <div>
                        <h3 className="text-sm font-bold tracking-tight text-[#13171E] dark:text-white">{siteName || "MedOneX"}</h3>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Quick Navigation</p>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setIsExpanded(false)} className="grid h-9 w-9 shrink-0 place-items-center text-muted-foreground transition-all hover:text-foreground rounded-full border border-border bg-card hover:shadow-sm" title="Close">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchInput(e.target.value)}
                    onKeyDown={handleSearchKey}
                    placeholder="Search modules, lectures, peers..."
                    className="w-full h-12 rounded-xl border border-border bg-background pl-12 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
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
                <div className="flex gap-3">
                  <Link href="/ai-chat" className="flex-1" onClick={() => setIsExpanded(false)}>
                    <button className="w-full flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-xs font-semibold text-primary-foreground shadow-[0_10px_30px_-10px_hsl(var(--primary)/0.6)] hover:opacity-90 transition-all">
                      <Sparkles className="h-4 w-4" /> Consult Dr. Q
                    </button>
                  </Link>
                  <Link href="/settings" className="flex-1" onClick={() => setIsExpanded(false)}>
                    <button className="w-full flex items-center justify-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-xs font-medium shadow-sm transition-all hover:shadow-md text-muted-foreground">
                      <Settings className="h-4 w-4" /> Settings
                    </button>
                  </Link>
                  <a href="https://t.me/MedOneX_bot" target="_blank" rel="noreferrer" className="flex-1">
                    <button className="w-full flex items-center justify-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-xs font-medium shadow-sm transition-all hover:shadow-md text-muted-foreground">
                      <Send className="h-4 w-4 text-sky-500" /> Telegram
                    </button>
                  </a>
                </div>

                {/* Theme Picker */}
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Theme</p>
                  <ThemeVariantPicker onSelect={() => setIsExpanded(false)} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}
