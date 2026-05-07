"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { 
  House, 
  BookOpenText, 
  HelpCircle, 
  Sparkles, 
  Search, 
  X,
  MessageSquare,
  Clock,
  Sun,
  Moon,
  Settings,
  Users,
  PlayCircle,
  Mic,
  Maximize,
  ChevronDown,
  Send
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/lib/store";
import { useSiteConfig } from "@/contexts/SiteConfigContext";
import { MedQsLogoMark } from "@/components/branding/MedQsLogo";

const NAV_ITEMS = [
  { href: "/dashboard-app", label: "Home", icon: House },
  { href: "/modules", label: "Lectures", icon: BookOpenText },
  { href: "/videos", label: "Videos", icon: PlayCircle },
  { href: "/podcasts", label: "Podcasts", icon: Mic },
  { href: "/past-papers", label: "Quizzes", icon: HelpCircle },
  { href: "/forum", label: "Community", icon: MessageSquare },
  { href: "/taskat", label: "Tasks", icon: Clock },
  { href: "/teams", label: "Teams", icon: Users },
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
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const { scrollY } = useScroll();
  const islandRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useThemeStore();

  const [mounted, setMounted] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 40) setIsScrolled(true);
    else setIsScrolled(false);
  });

  useEffect(() => {
    setMounted(true);
    function handleClickOutside(event: MouseEvent) {
      if (islandRef.current && !islandRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleSearchInput = async (val: string) => {
    setSearchQuery(val);
    if (val.length < 2) {
      setSearchResults([]);
      return;
    }
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
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      setIsExpanded(false);
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="fixed inset-x-0 top-0 z-[200] flex justify-center p-3 pointer-events-none">
      <motion.div
        ref={islandRef}
        layout
        initial={{ y: -20, opacity: 0 }}
        animate={{ 
          y: 0, 
          opacity: 1,
          width: isExpanded ? "100%" : isScrolled ? "min(460px, calc(100vw - 24px))" : "min(1400px, calc(100vw - 24px))",
          height: isExpanded ? "auto" : "68px",
        }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className={cn(
          "pointer-events-auto relative flex flex-col items-center overflow-hidden rounded-[32px] border dark:border-white/10 border-black/5 dark:bg-black/80 bg-white/90 backdrop-blur-[40px] shadow-[0_25px_60px_rgba(0,0,0,0.3)] transition-all duration-500",
          isExpanded ? "p-6" : "px-4 justify-center"
        )}
      >
        {/* --- COMPACT STATE --- */}
        {!isExpanded && (
          <div className="flex w-full items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/dashboard-app" className="flex items-center gap-3 shrink-0">
              <div className="h-10 w-10 rounded-2xl overflow-hidden bg-primary/10 flex items-center justify-center border border-primary/20 transition-transform hover:scale-110 active:scale-95 shadow-inner group/logo">
                 {logoUrl ? (
                   <img src={logoUrl} alt={siteName} className="h-7 w-7 object-contain" />
                 ) : (
                   <MedQsLogoMark className="h-6 w-6 text-primary" interactiveColor={true} />
                 )}
              </div>
              <span className="text-[17px] font-black tracking-tighter dark:text-white text-black hidden lg:inline-block">MedOneX</span>
            </Link>

            {/* Navigation (Desktop only, hidden when scrolled/compact) */}
            {!isScrolled && (
              <div className="hidden md:flex items-center gap-1">
                {NAV_ITEMS.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center justify-center rounded-xl h-10 px-4 transition-all gap-2 group",
                        isActive 
                          ? "dark:bg-white/10 bg-black/5 dark:text-white text-black" 
                          : "dark:text-white/40 text-black/40 hover:text-primary dark:hover:bg-white/5 hover:bg-black/5"
                      )}
                    >
                      <item.icon className={cn("h-4 w-4", isActive ? "text-primary" : "group-hover:text-primary")} />
                      <span className={cn("text-[11px] font-black uppercase tracking-widest", isActive ? "flex" : "hidden group-hover:flex")}>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Right Actions */}
            <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsExpanded(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-full dark:bg-white/5 bg-black/5 border dark:border-white/5 border-black/5 hover:border-primary/30 transition-all group"
                >
                  <Search className="h-4 w-4 dark:text-white/40 text-black/40 group-hover:text-primary transition-colors" />
                  <span className="text-[11px] font-black uppercase tracking-widest dark:text-white/20 text-black/30 group-hover:text-primary/50 transition-colors hidden sm:inline-block">Search...</span>
                </button>

                <div className="h-8 w-[1px] dark:bg-white/10 bg-black/10 mx-1" />

                {/* Fullscreen Button */}
                <button 
                  onClick={() => {
                    if (!document.fullscreenElement) {
                      document.documentElement.requestFullscreen().catch(() => {});
                    } else {
                      document.exitFullscreen().catch(() => {});
                    }
                  }}
                  className="hidden sm:flex h-10 w-10 items-center justify-center rounded-xl dark:bg-white/5 bg-black/5 hover:bg-primary/10 hover:text-primary transition-all dark:text-white/40 text-black/40"
                  title="Toggle Fullscreen"
                >
                   <Maximize className="h-4 w-4" />
                </button>

                <button 
                  onClick={() => setIsExpanded(true)}
                  className="flex items-center gap-2 rounded-full p-1 hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                >
                   <div className="h-9 w-9 rounded-full overflow-hidden border-2 dark:border-white/10 border-black/5 shadow-md">
                      {userImage ? (
                        <img src={userImage} alt="Profile" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary text-xs font-black">
                          {userName ? userName.charAt(0).toUpperCase() : "U"}
                        </div>
                      )}
                   </div>
                   <ChevronDown className="h-3 w-3 dark:text-white/30 text-black/30" />
                </button>
            </div>
          </div>
        )}

        {/* --- EXPANDED STATE --- */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="w-full space-y-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-[20px] bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
                       <MedQsLogoMark className="h-7 w-7 text-primary" interactiveColor={true} />
                    </div>
                   <div>
                      <h3 className="text-lg font-black dark:text-white text-black">MedOneX Nav</h3>
                      <p className="text-[11px] font-black dark:text-white/30 text-black/30 uppercase tracking-[0.2em]">Quick Command Center</p>
                   </div>
                </div>
                <div className="flex items-center gap-2">
                   {mounted && (
                     <button 
                       onClick={toggleTheme}
                       className="rounded-full dark:bg-white/5 bg-black/5 p-3.5 dark:text-white/40 text-black/40 hover:scale-110 active:scale-95 transition-all"
                     >
                       {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                     </button>
                   )}
                   <button 
                     onClick={() => setIsExpanded(false)}
                     className="rounded-full dark:bg-white/5 bg-black/5 p-3.5 dark:text-white/40 text-black/40 hover:scale-110 active:scale-95 transition-all"
                   >
                     <X className="h-5 w-5" />
                   </button>
                </div>
              </div>

              {/* Professional Search */}
              <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 dark:text-white/20 text-black/20 group-focus-within:text-primary transition-colors" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  onKeyDown={handleSearch}
                  placeholder="Type to search modules, lectures, or peers..."
                  className="w-full h-16 rounded-[24px] dark:bg-white/5 bg-black/5 border dark:border-white/10 border-black/10 px-16 text-lg font-black dark:text-white text-black placeholder:text-black/30 dark:placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all shadow-inner"
                  autoFocus
                />
                
                {/* Search Results */}
                <AnimatePresence>
                  {searchResults.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 15 }}
                      className="absolute left-0 right-0 top-full mt-3 z-[210] rounded-[28px] border dark:border-white/10 border-black/5 dark:bg-black/90 bg-white shadow-2xl overflow-hidden p-2 backdrop-blur-3xl"
                    >
                      {searchResults.map((item, idx) => (
                        <Link
                          key={idx}
                          href={item.href}
                          onClick={() => setIsExpanded(false)}
                          className="flex items-center gap-4 p-3.5 hover:bg-primary/10 rounded-[20px] transition-all group"
                        >
                          <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center dark:text-white/40 text-black/40 group-hover:text-primary group-hover:bg-primary/20 transition-all">
                             {item.type === "user" ? <Users className="h-4 w-4" /> :
                              item.type === "module" ? <BookOpenText className="h-4 w-4" /> :
                              item.type === "quiz" ? <HelpCircle className="h-4 w-4" /> :
                              <Search className="h-4 w-4" />}
                          </div>
                          <div className="flex flex-col">
                             <span className="text-[14px] font-black dark:text-white text-black group-hover:text-primary transition-colors">{item.label}</span>
                             <span className="text-[10px] font-black dark:text-white/30 text-black/30 uppercase tracking-widest">{item.sub}</span>
                          </div>
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Menu Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                 {[...NAV_ITEMS, { href: "/settings", label: "Settings", icon: Settings }].map((item) => (
                   <Link 
                     key={item.href}
                     href={item.href}
                     onClick={() => setIsExpanded(false)}
                     className="flex items-center gap-4 rounded-[22px] dark:bg-white/[0.03] bg-black/[0.03] p-4 border dark:border-white/[0.05] border-black/[0.05] hover:border-primary/30 hover:bg-primary/[0.02] transition-all group shadow-sm"
                   >
                      <div className="h-11 w-11 rounded-[16px] dark:bg-white/5 bg-black/5 flex shrink-0 items-center justify-center dark:text-white/50 text-black/50 group-hover:text-primary group-hover:bg-primary/10 transition-all">
                        <item.icon className="h-5 w-5" />
                      </div>
                      <span className="text-[13px] font-black dark:text-white/70 text-black/70 group-hover:text-primary transition-colors truncate">{item.label}</span>
                   </Link>
                 ))}
              </div>

              {/* Bot / AI Shortcuts */}
              <div className="flex flex-col sm:flex-row gap-3">
                 <Link href="/ai-chat" className="flex-1">
                    <button className="w-full flex items-center justify-center gap-3 rounded-2xl bg-primary px-6 py-4 text-xs font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all">
                       <Sparkles className="h-4 w-4" />
                       Consult Dr. Q
                    </button>
                 </Link>
                 <a href="https://t.me/MedOneX_bot" target="_blank" className="flex-1">
                    <button className="w-full flex items-center justify-center gap-3 rounded-2xl dark:bg-white/10 bg-slate-100 px-6 py-4 text-xs font-black uppercase tracking-[0.2em] dark:text-white text-slate-800 hover:scale-[1.02] active:scale-[0.98] transition-all border dark:border-white/5 border-slate-200">
                       <Send className="h-4 w-4 text-sky-500" />
                       Telegram Bot
                    </button>
                 </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
