"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
 Home, BookOpen, Video, Mic, HelpCircle, MessageCircle,
 Clock, Users, Pen, Sparkles, Search, X,
 Sun, Moon, Settings, Send, Folder,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSiteConfig } from "@/contexts/SiteConfigContext";
import { MedOneXLogoMark } from "@/components/branding/MedQsLogo";
import { useThemeStore } from "@/lib/store";

export const NAV_ITEMS = [
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
 const [searchQuery, setSearchQuery] = useState("");
 const [searchData, setSearchData] = useState<{
  lectures: any[];
  modules: any[];
  quizzes: any[];
  users: any[];
 } | null>(null);
 const [searching, setSearching] = useState(false);
 const [mounted, setMounted] = useState(false);
 const [compact, setCompact] = useState(false);
 const containerRef = useRef<HTMLDivElement>(null);
 const lastScrollY = useRef(0);
 const abortRef = useRef<AbortController>();

 useEffect(() => { setMounted(true); }, []);

 // ─── Scroll collapse/expand ────────────────────────────────────────
  useEffect(() => {
   const THRESHOLD = 8;
   let ticking = false;
   const handleScroll = () => {
    if (!ticking) {
     requestAnimationFrame(() => {
      const currentScrollY = window.scrollY;
      const diff = currentScrollY - lastScrollY.current;

      if (Math.abs(diff) < THRESHOLD) {
       lastScrollY.current = currentScrollY;
       ticking = false;
       return;
      }

      if (diff > 0 && currentScrollY > 60) {
       setCompact(true);
       setIsExpanded(false);
      } else if (diff < 0) {
       setCompact(false);
      }

      lastScrollY.current = currentScrollY;
      ticking = false;
     });
     ticking = true;
    }
   };

   window.addEventListener("scroll", handleScroll, { passive: true });
   return () => window.removeEventListener("scroll", handleScroll);
  }, []);

 // ─── Click outside to close overlay ──────────────────────────────
 useEffect(() => {
  const handleClickOutside = (e: MouseEvent) => {
   if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
    setIsExpanded(false);
   }
  };
  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
 }, []);

 const handleExpand = useCallback(() => {
  setIsExpanded(prev => !prev);
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
   .catch(() => {})
   .finally(() => {
    setSearching(false);
   });
 };

 const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

 // Hidden on modules pages — ModulesSidebar handles it
 if (pathname?.startsWith("/modules")) return null;

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
   <div ref={containerRef} className="fixed top-4 left-1/2 -translate-x-1/2 z-[calc(var(--z-navbar)+3)] hidden md:block"
      style={{
        width: compact ? "360px" : "calc(100vw - 32px)",
        maxWidth: "1200px",
        transition: "width 500ms cubic-bezier(0.22,1,0.36,1)",
      }}
    >
    {/* ─── Floating Pill ─────────────────────────────────────────── */}
     <div
         className={cn(
          "flex items-center justify-between px-4 py-2.5 rounded-2xl border border-border/40 bg-background/80 supports-[backdrop-filter]:bg-background/60 shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-xl w-full",
         )}
     >
     {/* ── Left: Logo + siteName — always visible ── */}
     <Link href="/dashboard-app" className="flex items-center gap-2.5 shrink-0">
      <MedOneXLogoMark className="h-6 w-6 shrink-0 text-[#13171E] dark:text-white" interactiveColor />
      <span className="hidden sm:inline text-sm font-bold text-foreground whitespace-nowrap">{siteName}</span>
     </Link>

      {/* ── Center: nav items with labels — shrinks + fades on scroll ── */}
      <div
       className={cn(
        "flex items-center gap-0.5 flex-1 overflow-hidden transition-all duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
        compact ? "max-w-0 opacity-0" : "max-w-none opacity-100"
       )}
       style={{ pointerEvents: compact ? 'none' : 'auto' }}
      >
       <div className="w-px h-5 bg-border/30 mx-2.5 shrink-0" />

       <nav className="flex items-center justify-center gap-1 flex-1">
       {NAV_ITEMS.map((item) => {
        const active = pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
         <Link
          key={item.href}
          href={item.href}
          title={item.label}
          className={cn(
           "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all duration-200 shrink-0",
           active
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
          )}
         >
          <Icon className={cn("h-4 w-4 shrink-0", item.glow && !active && "text-primary")} />
          <span className="text-xs font-medium whitespace-nowrap leading-none">{item.label}</span>
         </Link>
        );
       })}
       </nav>

       <div className="w-px h-5 bg-border/30 mx-2.5 shrink-0" />
      </div>

     {/* ── Right: Search, Theme, Avatar — always visible ── */}
      <div className="flex items-center gap-3 shrink-0">
      <button
       onClick={handleExpand}
       className="grid h-8 w-8 place-items-center text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/40 transition-all shrink-0"
       title="Search"
      >
       <Search className="h-4 w-4" />
      </button>
      {mounted && (
       <button
        onClick={toggleTheme}
        className="grid h-8 w-8 place-items-center text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/40 transition-all shrink-0"
        title={theme === "dark" ? "Light mode" : "Dark mode"}
       >
        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
       </button>
      )}
      <Link href="/profile/me" className="shrink-0">
       {avatarBlock("sm")}
      </Link>
     </div>
    </div>

   {/* ─── Expanded Overlay (popover below pill) ──────────────────── */}
   <AnimatePresence>
    {isExpanded && (
     <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[min(480px,calc(100vw-32px))] rounded-2xl border border-border/30 bg-background/90 supports-[backdrop-filter]:bg-background/70 shadow-xl backdrop-blur-xl overflow-hidden"
     >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border/20">
       <div className="flex items-center gap-3">
        <MedOneXLogoMark className="h-6 w-6 shrink-0 text-[#13171E] dark:text-white" interactiveColor />
        <div>
         <h3 className="text-sm font-bold text-foreground">{siteName || "MedOneX"}</h3>
         <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Quick Navigation</p>
        </div>
       </div>
       <button onClick={() => setIsExpanded(false)} className="grid h-8 w-8 place-items-center text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/40 transition-all" title="Close">
        <X className="h-4 w-4" />
       </button>
      </div>

      <div className="px-5 py-4 space-y-6 max-h-[70vh] overflow-y-auto">
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
  </div>
 );
}
