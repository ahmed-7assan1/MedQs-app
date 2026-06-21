"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { 
  House, Books, Question, Sparkle, MagnifyingGlass, X,
  Chats, Clock, Gear, UsersThree, Pen,
  PlayCircle, Microphone, CornersOut, CaretDown, PaperPlaneTilt, Robot, Palette
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import { useSiteConfig } from "@/contexts/SiteConfigContext";
import { MedOneXLogoMark } from "@/components/branding/MedQsLogo";
import { ThemeVariantPicker } from "@/components/ui/ThemeVariantPicker";

const NAV_ITEMS = [
  { href: "/dashboard-app", label: "Home", icon: House },
  { href: "/modules", label: "Lectures", icon: Books },
  { href: "/videos", label: "Videos", icon: PlayCircle },
  { href: "/podcasts", label: "Podcasts", icon: Microphone },
  { href: "/past-papers", label: "Quizzes", icon: Question },
  { href: "/social", label: "Community", icon: Chats },
  { href: "/taskat", label: "Tasks", icon: Clock },
  { href: "/teams", label: "Teams", icon: UsersThree },
  { href: "/drawmed", label: "DrawMed", icon: Pen },
  { href: "/ai-chat", label: "AI Chat", icon: Robot, glow: true },
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
  const { siteName, logoUrl } = useSiteConfig();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const islandRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);

  const handleScroll = useCallback(() => {
    const currentY = window.scrollY;
    const threshold = 80;

    if (currentY < threshold) {
      setIsVisible(true);
    } else if (currentY > lastScrollY.current) {
      setIsVisible(false);
    } else {
      setIsVisible(true);
    }
    lastScrollY.current = currentY;
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

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      setIsExpanded(false);
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <motion.div
      id="desktop-nav-island"
      initial={{ y: 0 }}
      animate={{ y: isVisible ? 0 : -120 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="fixed inset-x-0 top-0 z-[200] hidden md:flex justify-center items-start px-3 pt-0 pointer-events-none"
    >
      <div
        ref={islandRef}
        className={cn(
          "pointer-events-auto relative flex flex-col items-center overflow-hidden",
          "rounded-b-[32px] rounded-t-none border-x border-b dark:border-white/10 border-black/5 border-t-0",
          "dark:bg-black/80 bg-white/90 backdrop-blur-[40px]",
          pathname === "/social" ? "shadow-none" : "shadow-[0_25px_60px_rgba(0,0,0,0.25)]",
          "transition-all duration-300 ease-out",
          isExpanded
            ? "w-full p-6"
            : "w-[min(1400px,calc(100vw-24px))] h-[68px] px-4 justify-center"
        )}
      >
        {/* COMPACT BAR — أيقونات فقط بدون كتابة */}
        {!isExpanded && (
          <div className="flex w-full items-center justify-between gap-2">
            {/* Logo */}
            <Link href="/dashboard-app" className="flex items-center gap-3 shrink-0">
              <div className="h-10 w-10 rounded-2xl overflow-hidden bg-primary/10 flex items-center justify-center border border-primary/20 hover:scale-110 transition-transform">
                {logoUrl ? (
                  <img src={logoUrl} alt={siteName} className="h-7 w-7 object-contain" />
                ) : (
                  <MedOneXLogoMark className="h-6 w-6 text-primary" interactiveColor={true} />
                )}
              </div>
            </Link>

            {/* Nav Links — أيقونات + أسماء */}
            <nav className="flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const active = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-center rounded-xl h-10 px-3 transition-all gap-2 group",
                      active
                        ? "dark:bg-white/10 bg-black/5 dark:text-white text-black"
                        : "dark:text-white/40 text-black/40 hover:text-primary dark:hover:bg-white/5 hover:bg-black/5",
                      (item as any).glow && !active && "relative"
                    )}
                  >
                    {(item as any).glow && !active && (
                      <span className="absolute inset-0 rounded-xl bg-primary/10 animate-pulse blur-sm" />
                    )}
                    <item.icon className={cn("h-4 w-4 shrink-0", active ? "text-gray-900 dark:text-white" : "group-hover:text-gray-900 dark:group-hover:text-white", (item as any).glow && !active && "text-primary/70")} />
                    <span className="text-[11px] font-black uppercase tracking-wider hidden lg:block">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </nav>

            {/* Right Side */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsExpanded(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-full dark:bg-white/5 bg-black/5 border dark:border-white/5 border-black/5 hover:border-primary/30 transition-all group"
              >
                <MagnifyingGlass className="h-4 w-4 dark:text-white/40 text-black/40 group-hover:text-primary" />
              </button>

              <div className="h-8 w-px dark:bg-white/10 bg-black/10 mx-1" />

              <button
                onClick={() => setIsExpanded(true)}
                className="hidden lg:flex h-10 w-10 items-center justify-center rounded-xl dark:bg-white/5 bg-black/5 hover:bg-primary/10 hover:text-primary transition-all dark:text-white/40 text-black/40"
                title="Theme"
              >
                <Palette className="h-4 w-4" />
              </button>

              <button
                onClick={() => {
                  if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
                  else document.exitFullscreen().catch(() => {});
                }}
                className="hidden lg:flex h-10 w-10 items-center justify-center rounded-xl dark:bg-white/5 bg-black/5 hover:bg-primary/10 hover:text-primary transition-all dark:text-white/40 text-black/40"
                title="Fullscreen"
              >
                <CornersOut className="h-4 w-4" />
              </button>

              <button
                onClick={() => setIsExpanded(true)}
                className="flex items-center gap-1.5 rounded-full p-1 hover:bg-black/5 dark:hover:bg-white/5 transition-all group"
                title="Open menu"
              >
                <div className="h-9 w-9 rounded-full overflow-hidden border-2 dark:border-white/10 border-black/5">
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
                <CaretDown className="h-3 w-3 dark:text-white/30 text-black/30" />
              </button>
            </div>
          </div>
        )}

        {/* EXPANDED PANEL — Search-focused */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              className="w-full space-y-6"
            >
              {/* Header بسيط */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-[20px] bg-primary/10 flex items-center justify-center border border-primary/20">
                    <MedOneXLogoMark className="h-7 w-7 text-primary" interactiveColor={true} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black dark:text-white text-black">{siteName || "MedOneX"}</h3>
                    <p className="text-[11px] font-black dark:text-white/30 text-black/30 uppercase tracking-[0.2em]">Quick Navigation</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setIsExpanded(false)} className="rounded-full dark:bg-white/5 bg-black/5 p-3.5 dark:text-white/40 text-black/40 hover:scale-110 transition-all" title="Close">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Search — المحور الرئيسي */}
              <div className="relative">
                <MagnifyingGlass className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 dark:text-white/20 text-black/20" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  onKeyDown={handleSearch}
                  placeholder="Search modules, lectures, peers..."
                  className="w-full h-14 rounded-[20px] dark:bg-white/5 bg-black/5 border dark:border-white/10 border-black/10 px-14 text-base font-bold dark:text-white text-black placeholder:dark:text-white/20 placeholder:text-black/30 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all"
                  autoFocus
                />
                <AnimatePresence>
                  {searchResults.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="absolute left-0 right-0 top-full mt-2 z-10 rounded-[24px] border dark:border-white/10 border-black/5 dark:bg-black/90 bg-white shadow-2xl overflow-hidden p-2"
                    >
                      {searchResults.map((item, idx) => (
                        <Link key={idx} href={item.href} onClick={() => setIsExpanded(false)}
                          className="flex items-center gap-4 p-3 hover:bg-primary/10 rounded-[16px] transition-all">
                          <span className="text-sm font-bold dark:text-white text-black">{item.label}</span>
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Quick actions — بس 3 */}
              <div className="flex gap-3">
                <Link href="/ai-chat" className="flex-1" onClick={() => setIsExpanded(false)}>
                  <button className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-primary/30 hover:scale-[1.02] transition-all">
                    <Sparkle className="h-4 w-4" /> Consult Dr. Q
                  </button>
                </Link>
                <Link href="/settings" className="flex-1" onClick={() => setIsExpanded(false)}>
                  <button className="w-full flex items-center justify-center gap-2 rounded-2xl dark:bg-white/10 bg-slate-100 px-6 py-4 text-xs font-black uppercase tracking-widest dark:text-white text-slate-800 hover:scale-[1.02] transition-all border dark:border-white/5 border-slate-200">
                    <Gear className="h-4 w-4" /> Settings
                  </button>
                </Link>
                <a href="https://t.me/MedOneX_bot" target="_blank" rel="noreferrer" className="flex-1">
                  <button className="w-full flex items-center justify-center gap-2 rounded-2xl dark:bg-white/10 bg-slate-100 px-6 py-4 text-xs font-black uppercase tracking-widest dark:text-white text-slate-800 hover:scale-[1.02] transition-all border dark:border-white/5 border-slate-200">
                    <PaperPlaneTilt className="h-4 w-4 text-sky-500" /> Telegram
                  </button>
                </a>
              </div>

              {/* Theme Picker */}
              <div>
                <p className="text-[10px] font-black dark:text-white/20 text-black/20 uppercase tracking-[0.2em] mb-3">Theme</p>
                <ThemeVariantPicker onSelect={() => setIsExpanded(false)} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}