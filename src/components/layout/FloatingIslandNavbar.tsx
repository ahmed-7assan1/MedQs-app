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
  Menu,
  X,
  MessageSquare,
  Clock,
  Sun,
  Moon,
  Settings,
  Users,
  Heart,
  PlayCircle,
  Mic,
  Maximize
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/lib/store";
import { useSiteConfig } from "@/contexts/SiteConfigContext";
import { ChevronDown, ChevronUp } from "lucide-react";
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

const MOBILE_NAV_ITEMS = [
  { href: "/dashboard-app", label: "Home", icon: House },
  { href: "/modules", label: "Lectures", icon: BookOpenText },
  { href: "/forum", label: "Community", icon: MessageSquare },
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
    if (latest > 60) setIsScrolled(true);
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

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
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
      setSearchResults(combined.slice(0, 5));
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
    <div className="fixed inset-x-0 top-0 z-[200] flex justify-center pointer-events-none">
      <motion.div
        ref={islandRef}
        layout
        initial={{ y: 0, opacity: 0 }}
        animate={{ 
          y: 0, 
          opacity: 1,
          width: isExpanded ? "100%" : isScrolled ? (typeof window !== 'undefined' && window.innerWidth < 768 ? "300px" : "420px") : "100%",
          maxWidth: isExpanded ? "1300px" : isScrolled ? "420px" : "1350px",
          height: isExpanded ? "auto" : "64px",
        }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className={cn(
          "pointer-events-auto relative flex items-center overflow-hidden rounded-b-[32px] border-x border-b dark:border-white/10 border-black/5 dark:bg-black/70 bg-white/80 backdrop-blur-3xl shadow-[0_15px_40px_rgba(0,0,0,0.15)]",
          isExpanded ? "p-5 flex-col" : "px-4"
        )}
      >
        {/* --- COMPACT STATE --- */}
        {!isExpanded && (
          <div className="flex w-full items-center justify-between gap-4 h-full">
            {/* Logo & Navigation Group */}
            <div className="flex items-center gap-4 h-full">
              <Link href="/dashboard-app" className="flex items-center gap-3 pl-1">
                <div className="h-10 w-10 rounded-xl overflow-hidden bg-primary/5 flex items-center justify-center border border-primary/10 transition-transform hover:scale-105 active:scale-95">
                   {logoUrl ? (
                     <img src={logoUrl} alt={siteName} className="h-7 w-7 object-contain" />
                   ) : (
                     <div className="h-6 w-6 bg-primary rounded-lg" />
                   )}
                </div>
                <span className="text-[17px] font-black tracking-tighter dark:text-white text-black hidden sm:inline-block pr-2">MedOneX</span>
              </Link>

              {/* Professional Separator */}
              {!isScrolled && (
                <div className="h-8 w-[1.5px] bg-black/[0.08] dark:bg-white/[0.08] rounded-full mx-1 hidden md:block" />
              )}

              {/* Navigation Links */}
              {!isScrolled && (
                <div className="hidden md:flex items-center gap-1.5 ml-2">
                  {NAV_ITEMS.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center justify-center rounded-xl h-10 px-3 transition-all gap-2 group",
                          isActive 
                            ? "dark:bg-white/10 bg-black/5 dark:text-white text-black shadow-inner" 
                            : "dark:text-white/40 text-black/40 hover:text-black dark:hover:text-white dark:hover:bg-white/5 hover:bg-black/5"
                        )}
                        title={item.label}
                      >
                        <item.icon className={cn("h-4 w-4", isActive ? "text-primary" : "group-hover:text-primary transition-colors")} />
                        <span className={cn("text-[11px] font-bold uppercase tracking-widest", isActive ? "flex" : "hidden group-hover:flex")}>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Actions: Theme Toggle & Ask Dr. Q */}
            <div className="flex items-center gap-1.5 md:gap-2">
                {!isScrolled && mounted && (
                  <div className="hidden md:flex items-center gap-1.5 md:gap-2">
                    <button 
                      onClick={toggleTheme}
                      className="p-3 rounded-full dark:text-white/40 text-black/50 hover:text-black dark:hover:text-white dark:hover:bg-white/5 hover:bg-black/5 transition-all"
                      title="Toggle Theme"
                    >
                      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={toggleFullscreen}
                      className="p-3 rounded-full dark:text-white/40 text-black/50 hover:text-black dark:hover:text-white dark:hover:bg-white/5 hover:bg-black/5 transition-all"
                      title="Toggle Fullscreen"
                    >
                      <Maximize className="h-4 w-4" />
                    </button>
                    <Link
                      href="/settings"
                      className="p-3 rounded-full dark:text-white/40 text-black/50 hover:text-black dark:hover:text-white dark:hover:bg-white/5 hover:bg-black/5 transition-all"
                      title="Settings"
                    >
                      <Settings className="h-4 w-4" />
                    </Link>
                    <button 
                      onClick={() => setIsExpanded(true)}
                      className="p-3 rounded-full dark:text-white/40 text-black/50 hover:text-black dark:hover:text-white dark:hover:bg-white/5 hover:bg-black/5 transition-all"
                      title="Search"
                    >
                      <Search className="h-4 w-4" />
                    </button>
                  </div>
                )}
               
               <Link href="/ai-chat">
                 <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  animate={{ 
                    boxShadow: ["0 0 0px rgba(108,95,240,0)", "0 0 20px rgba(108,95,240,0.5)", "0 0 0px rgba(108,95,240,0)"]
                  }}
                  transition={{ 
                    boxShadow: { repeat: Infinity, duration: 2.5 },
                    type: "spring", stiffness: 400, damping: 10
                  }}
                  className="btn-gradient hidden lg:flex items-center gap-2 rounded-full px-6 py-2.5 text-[12px] font-black uppercase tracking-wider text-white shadow-xl"
                >
                  <Sparkles className="h-4 w-4" />
                  {!isScrolled && <span>Ask Dr. Q</span>}
                </motion.button>
              </Link>
              <div className="flex items-center gap-2 flex-shrink-0">
                 <button 
                  onClick={() => setIsExpanded(true)}
                  className="flex items-center gap-2 pl-2 pr-1 py-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-all group"
                >
                   <div className="h-9 w-9 rounded-full overflow-hidden border-2 dark:border-white/10 border-black/5 group-hover:border-primary transition-colors cursor-pointer dark:bg-white/5 bg-black/5 flex items-center justify-center relative">
                      {userImage ? (
                        <img src={userImage} alt="Profile" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-[12px] font-bold dark:text-white/50 text-black/50">
                          {userName ? userName.charAt(0).toUpperCase() : "U"}
                        </span>
                      )}
                   </div>
                   <ChevronDown className="h-3.5 w-3.5 dark:text-white/40 text-black/40 group-hover:text-primary transition-colors" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- EXPANDED STATE (MORPHED ISLAND) --- */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full space-y-8 pt-2"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner group">
                       <MedQsLogoMark className="h-7 w-7 text-primary transition-transform group-hover:scale-110 group-hover:rotate-3 duration-300" interactiveColor={true} />
                    </div>
                   <div>
                      <h3 className="text-lg font-black dark:text-white text-black">MedOneX Nav</h3>
                      <p className="text-[12px] font-bold dark:text-white/40 text-black/40 uppercase tracking-[0.2em]">Global Navigation</p>
                   </div>
                </div>
                <div className="flex items-center gap-2">
                  {mounted && (
                    <button 
                      onClick={toggleTheme}
                      className="rounded-full dark:bg-white/5 bg-black/5 p-3 dark:text-white/40 text-black/40 dark:hover:text-white hover:text-black transition-all"
                    >
                      {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    </button>
                  )}
                  <button 
                    onClick={() => setIsExpanded(false)}
                    className="rounded-full dark:bg-white/5 bg-black/5 p-3 dark:text-white/40 text-black/40 dark:hover:text-white hover:text-black transition-all"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Enhanced Search Input */}
              <div className="relative group px-1">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 dark:text-white/20 text-black/20 group-focus-within:text-primary transition-colors" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  onKeyDown={handleSearch}
                  placeholder="Type to search for anything in MedOneX..."
                  className="w-full h-16 rounded-[24px] dark:bg-white/5 bg-black/5 border dark:border-white/10 border-black/10 px-16 text-lg font-medium dark:text-white text-black dark:placeholder:text-white/20 placeholder:text-black/30 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all shadow-inner"
                  autoFocus
                />
                <kbd className="absolute right-6 top-1/2 -translate-y-1/2 hidden md:inline-block rounded-lg dark:bg-white/10 bg-black/10 px-3 py-1.5 text-xs font-bold dark:text-white/50 text-black/50">Enter</kbd>
                
                {/* Instant Results Dropdown */}
                <AnimatePresence>
                  {searchResults.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute left-0 right-0 top-full mt-2 z-[210] rounded-[24px] border dark:border-white/10 border-black/5 dark:bg-black/80 bg-white/90 backdrop-blur-3xl shadow-2xl overflow-hidden p-2"
                    >
                      {searchResults.map((item, idx) => (
                        <Link
                          key={idx}
                          href={item.href}
                          onClick={() => {
                            setIsExpanded(false);
                            setSearchResults([]);
                          }}
                          className="flex items-center gap-4 p-3 hover:bg-primary/10 rounded-[18px] transition-colors group"
                        >
                          <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center dark:text-white/40 text-black/40 group-hover:text-primary transition-colors">
                            <Search className="h-4 w-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[14px] font-bold dark:text-white text-black group-hover:text-primary transition-colors">{item.label}</span>
                            <span className="text-[11px] font-medium dark:text-white/40 text-black/40">{item.sub}</span>
                          </div>
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Quick Navigation Grid (Horizontal Layout) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-1">
                 {[...NAV_ITEMS, { href: "/settings", label: "Settings", icon: Settings }].map((item) => (
                   <Link 
                     key={item.href}
                     href={item.href}
                     onClick={() => setIsExpanded(false)}
                     className="flex items-center gap-4 rounded-[20px] dark:bg-white/[0.03] bg-black/[0.03] p-4 border dark:border-white/[0.02] border-black/[0.05] hover:shadow-md dark:hover:bg-white/[0.08] hover:bg-black/[0.08] transition-all group"
                   >
                      <div className="h-12 w-12 rounded-[14px] dark:bg-white/5 bg-black/5 flex shrink-0 items-center justify-center dark:text-white/50 text-black/50 group-hover:text-primary group-hover:bg-primary/10 transition-all shadow-sm">
                        <item.icon className="h-5 w-5" />
                      </div>
                      <span className="text-[14px] font-bold dark:text-white/70 text-black/70 group-hover:text-primary transition-colors">{item.label}</span>
                   </Link>
                 ))}
              </div>

              {/* Suggestions / Recent */}
              <div className="px-2 pb-2">
                 <p className="text-[11px] font-black dark:text-white/20 text-black/30 uppercase tracking-[0.2em] mb-4">Popular Actions</p>
                 <div className="flex flex-wrap gap-2.5">
                    {["Cardiology Teams", "Ask MedOneX AI", "Anatomy Mock Quiz", "Semester Chat"].map(tag => (
                       <button key={tag} className="px-4 py-2.5 rounded-full dark:bg-white/5 bg-black/5 border dark:border-white/5 border-black/5 text-[12px] font-bold dark:text-white/50 text-black/50 hover:text-black dark:hover:text-white dark:hover:bg-white/10 hover:bg-black/10 transition-all">
                          {tag}
                       </button>
                    ))}
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
