"use client";

import { useNotificationStore, useThemeStore } from "@/lib/store";
import { 
  Bell, Search, MapPin, ChevronDown, 
  BookOpen, Layers, Target, Activity, GraduationCap, ChevronRight,
  Sun, Moon
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface HomeTopBarProps {
  userName: string;
  userImage?: string;
  location?: string;
  modules?: Array<{ id: string; name: string }>;
}

const MODULE_ICONS = [Layers, Target, BookOpen, Activity, GraduationCap, Layers];

export function HomeTopBar({ userName, userImage, location = "Medical Platform", modules = [] }: HomeTopBarProps) {
  const { unread } = useNotificationStore();
  const { theme, setTheme } = useThemeStore();
  const firstName = userName.split(" ")[0];
  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const displayModules = modules.slice(0, 6);

  return (
    <div className={cn(
      "sticky top-0 z-50 lg:hidden w-screen -mx-4 transition-all duration-300 border-b border-white/[0.03]",
      isScrolled 
        ? "bg-background/80 backdrop-blur-2xl shadow-lg" 
        : "bg-background/95 backdrop-blur-md"
    )}>
      <div className="px-4 pb-3 pt-0 space-y-3">
        {/* Top Row: Profile & Actions */}
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 rounded-full overflow-hidden border border-primary/20 p-0.5 shadow-sm bg-background/50 flex items-center justify-center">
              {userImage ? (
                <img 
                  src={userImage} 
                  alt={userName} 
                  className="h-full w-full rounded-full object-cover" 
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    e.currentTarget.parentElement?.classList.add("bg-primary/10");
                  }} 
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-primary font-bold text-[11px]">
                  {firstName[0]}
                </div>
              )}
            </div>
            <div className="flex flex-col -space-y-0.5 min-w-0">
              <p className="text-sm font-bold tracking-tight text-foreground truncate">
                Hello, <span className="text-primary">{firstName}</span>
              </p>
              <p className="text-[9px] font-medium text-muted-foreground opacity-60 truncate max-w-[140px] uppercase tracking-wider">{location}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Search Icon */}
            <button 
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted/30 border border-border/10 text-muted-foreground hover:bg-muted/50 transition-all active:scale-95"
              title="Search"
            >
              <Search className="h-[18px] w-[18px]" />
            </button>

            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted/30 border border-border/10 text-muted-foreground hover:bg-muted/50 hover:text-primary transition-all active:scale-95"
              title="Toggle theme"
            >
              {mounted && theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
            </button>
            
            <button 
              className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-muted/30 border border-border/10 text-muted-foreground hover:bg-muted/50 transition-all active:scale-95"
              title="Notifications"
            >
              <Bell className="h-[18px] w-[18px]" />
              {unread > 0 && (
                <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-background shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
              )}
            </button>
          </div>
        </div>

        {/* Collapsible Search & Modules (Only visible when NOT scrolled) */}
        <AnimatePresence>
          {!isScrolled && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="space-y-4 overflow-hidden origin-top"
            >
              {/* Search Bar - Main View */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                </div>
                <input 
                  type="text" 
                  placeholder="Search modules or lectures..."
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-muted/30 border border-border/10 shadow-inner focus:ring-2 focus:ring-primary/10 focus:border-primary/20 outline-none transition-all placeholder:text-muted-foreground/30 text-xs"
                />
              </div>

              {/* Modules Grid */}
              {displayModules.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {displayModules.map((mod, idx) => {
                    const Icon = MODULE_ICONS[idx % MODULE_ICONS.length];
                    return (
                      <Link 
                        key={mod.id}
                        href={`/modules?id=${mod.id}`}
                        className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-card/40 border border-border/20 active:scale-95 transition-all text-center group"
                      >
                        <div className="h-8 w-8 rounded-lg bg-primary/5 text-primary/70 flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="text-[9px] font-bold tracking-tight line-clamp-1 opacity-80 leading-tight">{mod.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
