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
  const [isExpanded, setIsExpanded] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      setIsExpanded(false);
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="fixed inset-x-0 top-6 z-[200] hidden md:flex justify-center px-4 pointer-events-none">
      <motion.div
        ref={islandRef}
        layout
        initial={{ y: -20, opacity: 0 }}
        animate={{ 
          y: 0, 
          opacity: 1,
          width: isExpanded ? "100%" : isScrolled ? "380px" : "1250px",
          maxWidth: isExpanded ? "1300px" : "1350px",
          height: isExpanded ? "auto" : "60px",
        }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className={cn(
          "pointer-events-auto relative flex items-center overflow-hidden rounded-[30px] border dark:border-white/10 border-black/5 dark:bg-black/70 bg-white/80 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)]",
          isExpanded ? "p-5 flex-col" : "px-4"
        )}
      >
        {/* --- COMPACT STATE --- */}
        {!isExpanded && (
          <div className="flex w-full items-center justify-between gap-4 h-full">
            {/* Logo Section */}
            <Link href="/dashboard-app" className="flex items-center gap-2.5 pl-1">
              <div className="h-9 w-9 rounded-[14px] bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
                 <MedQsLogoMark className="h-5 w-5 text-primary" interactiveColor={true} />
              </div>
              {!isScrolled && (
                <span className="text-[16px] font-black tracking-tighter dark:text-white text-black">MedOneX</span>
              )}
            </Link>

            {/* Navigation Pips/Links */}
            <div className="flex items-center gap-2">
              {!isScrolled ? (
                <>
                  {NAV_ITEMS.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center justify-center rounded-full h-11 w-11 transition-all",
                          isActive 
                            ? "dark:bg-white/10 bg-black/5 dark:text-white text-black shadow-inner" 
                            : "dark:text-white/40 text-black/40 hover:text-black dark:hover:text-white dark:hover:bg-white/5 hover:bg-black/5"
                        )}
                        title={item.label}
                      >
                        <item.icon className="h-4 w-4" />
                      </Link>
                    );
                  })}
                </>
              ) : (
                <button 
                  onClick={() => setIsExpanded(true)}
                  className="flex items-center gap-2 rounded-full dark:bg-white/5 bg-black/5 px-5 py-2.5 text-[13px] font-bold dark:text-white/40 text-black/50 dark:hover:text-white hover:text-black transition-all"
                >
                  <Menu className="h-4 w-4" />
                  Menu
                </button>
              )}
            </div>

            {/* Actions: Theme Toggle & Ask Dr. Q */}
            <div className="flex items-center gap-1.5 md:gap-2">
               {!isScrolled && mounted && (
                 <>
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
                 </>
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
              <Link href="/profile/me" className="flex-shrink-0 ml-1">
                 <div className="h-10 w-10 rounded-full overflow-hidden border-2 dark:border-white/10 border-black/5 hover:border-primary transition-colors cursor-pointer dark:bg-white/5 bg-black/5 flex items-center justify-center">
                    {userImage ? (
                      <img src={userImage} alt={userName || "Profile"} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-[12px] font-bold dark:text-white/50 text-black/50">
                        {userName ? userName.charAt(0).toUpperCase() : "U"}
                      </span>
                    )}
                 </div>
              </Link>
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
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearch}
                  placeholder="Press Enter to search for anything in MedOneX..."
                  className="w-full h-16 rounded-[24px] dark:bg-white/5 bg-black/5 border dark:border-white/10 border-black/10 px-16 text-lg font-medium dark:text-white text-black dark:placeholder:text-white/20 placeholder:text-black/30 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all shadow-inner"
                  autoFocus
                />
                <kbd className="absolute right-6 top-1/2 -translate-y-1/2 hidden md:inline-block rounded-lg dark:bg-white/10 bg-black/10 px-3 py-1.5 text-xs font-bold dark:text-white/50 text-black/50">Enter</kbd>
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
