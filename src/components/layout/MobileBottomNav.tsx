"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
 HomeIcon,
 BookOpenIcon,
 UserGroupIcon,
 ClipboardDocumentListIcon,
 PlusIcon,
 SparklesIcon,
 Squares2X2Icon,
 PlayCircleIcon,
 AcademicCapIcon,
 RocketLaunchIcon,
 UsersIcon,
 TrophyIcon,
 MicrophoneIcon,
 BoltIcon,
 GlobeAltIcon,
} from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { isImmersiveMobileRoute } from "@/lib/mobile-chrome";
import { useCommunityStore } from "@/components/community-mobile/store";


interface TabDef {
 href: string;
 label: string;
 icon: typeof HomeIcon;
 match: (p: string) => boolean;
}

const TABS: TabDef[] = [
 {
 href: "/dashboard-app",
 label: "Home",
 icon: HomeIcon,
 match: (p: string) => p === "/dashboard-app" || p === "/dashboard",
 },
 {
 href: "/modules",
 label: "Modules",
 icon: BookOpenIcon,
 match: (p: string) => p.startsWith("/modules"),
 },
 {
 href: "/community",
 label: "Social",
 icon: UserGroupIcon,
 match: (p: string) => p.startsWith("/community") || p === "/social",
 },
 {
 href: "/past-papers",
 label: "QBank",
 icon: ClipboardDocumentListIcon,
 match: (p: string) => p.startsWith("/past-papers") || p.startsWith("/quiz"),
 },
];

interface ExtraPage {
 href: string;
 label: string;
 icon: typeof HomeIcon;
 match: (p: string) => boolean;
}

const EXTRA_PAGES: ExtraPage[] = [
 { href: "/videos", label: "Videos", icon: PlayCircleIcon, match: (p: string) => p.startsWith("/videos") },
 { href: "/ai-chat", label: "AI Chat", icon: SparklesIcon, match: (p: string) => p.startsWith("/ai-chat") },
 { href: "/study-tools", label: "Study Tools", icon: AcademicCapIcon, match: (p: string) => p.startsWith("/study-tools") },
 { href: "/drawmed", label: "DrawMed", icon: RocketLaunchIcon, match: (p: string) => p.startsWith("/drawmed") },
 { href: "/atlas", label: "Atlas", icon: GlobeAltIcon, match: (p: string) => p.startsWith("/atlas") },
 { href: "/teams", label: "Teams", icon: UsersIcon, match: (p: string) => p.startsWith("/teams") },
 { href: "/leaderboard", label: "Leaderboard", icon: TrophyIcon, match: (p: string) => p.startsWith("/leaderboard") },
 { href: "/podcasts", label: "Podcasts", icon: MicrophoneIcon, match: (p: string) => p.startsWith("/podcasts") },
 { href: "/taskat", label: "Taskat", icon: BoltIcon, match: (p: string) => p.startsWith("/taskat") },
];

function TabItem({ tab, pathname }: { tab: TabDef; pathname: string }) {
 const active = tab.match(pathname);
 const Icon = tab.icon;

 return (
 <Link
  href={tab.href}
  className={cn(
  "relative flex flex-col items-center justify-center gap-0.5",
  "h-full flex-1 min-h-[48px] min-w-[44px] transition-all duration-200",
  "active:scale-90"
  )}
 >
  <Icon
  className={cn(
   "h-6 w-6 transition-colors duration-200",
   active
   ? "text-gray-900 dark:text-white"
   : "text-gray-400 dark:text-white/40"
  )}
  />
  <span
  className={cn(
   "text-[10px] font-semibold tracking-wide transition-colors duration-200",
   active
   ? "text-gray-900 dark:text-white"
   : "text-gray-400 dark:text-white/35"
  )}
  >
  {tab.label}
  </span>
 </Link>
 );
}

export function MobileBottomNav() {
 const pathname = usePathname();
 const router = useRouter();
 const [visible, setVisible] = useState(true);
 const lastScrollY = useRef(0);
 const isComposerOpen = useCommunityStore((s) => s.isComposerOpen);
 const openComposer = useCommunityStore((s) => s.openComposer);
 const isSocial = pathname.startsWith("/social") || pathname.startsWith("/community");
 const [isGridOpen, setIsGridOpen] = useState(false);

 const activeExtraPage = EXTRA_PAGES.find((p) => p.match(pathname)) ?? null;
 const MoreIcon = activeExtraPage?.icon ?? Squares2X2Icon;
 const moreLabel = activeExtraPage?.label ?? "More";

 useEffect(() => {
 const SCROLL_THRESHOLD = 8;
 const BOTTOM_THRESHOLD = 50;
 let ticking = false;
 let cachedScrollHeight = document.documentElement.scrollHeight;

 const handleScroll = () => {
  if (!ticking) {
  requestAnimationFrame(() => {
   const currentScrollY = window.scrollY;
   const diff = currentScrollY - lastScrollY.current;

   const scrollBottom = window.innerHeight + window.scrollY;
   if (cachedScrollHeight - scrollBottom < BOTTOM_THRESHOLD) {
   setVisible(true);
   lastScrollY.current = currentScrollY;
   ticking = false;
   return;
   }

   if (Math.abs(diff) < SCROLL_THRESHOLD) {
   lastScrollY.current = currentScrollY;
   ticking = false;
   return;
   }

   if (diff > 0 && currentScrollY > 60) {
   setVisible(false);
   } else if (diff < 0) {
   setVisible(true);
   }

   lastScrollY.current = currentScrollY;
   ticking = false;
  });
  ticking = true;
  }
 };

 const updateCachedHeight = () => {
  cachedScrollHeight = document.documentElement.scrollHeight;
 };

 window.addEventListener("scroll", handleScroll, { passive: true });
 window.addEventListener("resize", updateCachedHeight, { passive: true });
 return () => {
  window.removeEventListener("scroll", handleScroll);
  window.removeEventListener("resize", updateCachedHeight);
 };
 }, []);

 if (isImmersiveMobileRoute(pathname)) return null;

 return (
 <>
  {/* Gradient backdrop — fixed at bottom, behind nav */}
  <div
    className={cn(
      "fixed bottom-0 left-0 right-0 pointer-events-none z-40 transition-opacity duration-300",
      (visible || isComposerOpen) ? "opacity-100" : "opacity-0"
    )}
    style={{
      height: "calc(62px + env(safe-area-inset-bottom, 0px) + 3.5rem)",
      background: "linear-gradient(to top, hsl(var(--background)), transparent)",
    }}
  />

  {/* Nav bar */}
  <div
  className={cn(
   "md:hidden fixed bottom-3 left-3 right-3 z-max backdrop-blur-xl transition-transform duration-300 ease-in-out pb-[env(safe-area-inset-bottom,0px)]",
   isComposerOpen
   ? "bg-background/80"
   :   "bg-white/85 dark:bg-black/85 shadow-[0_-8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_-8px_32px_rgba(0,0,0,0.4)]",
   isGridOpen ? "rounded-t-none rounded-b-2xl" : "rounded-2xl",
   (visible || isComposerOpen || isGridOpen) ? "translate-y-0" : "translate-y-full"
  )}
  >
  <div className="flex items-center justify-around h-[62px] px-1 relative z-20">
   {TABS.slice(0, 2).map((tab) => (
   <TabItem key={tab.href} tab={tab} pathname={pathname} />
   ))}

   {isSocial ? (
   <button
    type="button"
    onClick={() => openComposer()}
    aria-label="Create post"
    className={cn(
    "relative flex flex-col items-center justify-center gap-0.5",
    "h-full flex-1 min-h-[48px] min-w-[44px] transition-all duration-200",
    "active:scale-90"
    )}
   >
    <span className="flex items-center justify-center h-6 w-6 text-primary">
    <PlusIcon className="h-6 w-6" />
    </span>
    <span className="text-[10px] font-semibold tracking-wide text-gray-400 dark:text-white/35">
    Create
    </span>
   </button>
   ) : (
   <button
    type="button"
    onClick={() => setIsGridOpen(true)}
    aria-label={moreLabel}
    className={cn(
    "relative flex flex-col items-center justify-center gap-0.5",
    "h-full flex-1 min-h-[48px] min-w-[44px] transition-all duration-200",
    "active:scale-90"
    )}
   >
    <span className="relative flex items-center justify-center">
    <MoreIcon
     className={cn(
     "h-6 w-6 transition-colors duration-200",
     activeExtraPage
      ? "text-gray-900 dark:text-white"
      : "text-gray-400 dark:text-white/40"
     )}
    />
    {activeExtraPage && (
     <span className="absolute -bottom-2 -right-2 flex items-center justify-center">
     <Squares2X2Icon className="h-3 w-3 text-muted-foreground/60" />
     </span>
    )}
    </span>
    <span
    className={cn(
     "text-[10px] font-semibold tracking-wide transition-colors duration-200",
     activeExtraPage
     ? "text-gray-900 dark:text-white"
     : "text-gray-400 dark:text-white/35"
    )}
    >
    {moreLabel}
    </span>
   </button>
   )}

   {TABS.slice(2).map((tab) => (
    <TabItem key={tab.href} tab={tab} pathname={pathname} />
   ))}
  </div>
  </div>

  {/* Grid drawer — separate sibling, directly above nav */}
  <AnimatePresence>
   {isGridOpen && (
   <motion.div
    initial={{ y: 12, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    exit={{ y: 12, opacity: 0 }}
    transition={{ type: "spring", damping: 24, stiffness: 220 }}
    className="md:hidden fixed left-3 right-3 z-max overflow-y-auto bg-white/85 dark:bg-black/85 backdrop-blur-xl rounded-t-2xl shadow-[0_-8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_-8px_32px_rgba(0,0,0,0.4)]"
    style={{ bottom: "calc(12px + 62px + env(safe-area-inset-bottom, 0px))", maxHeight: "55vh" }}
    onClick={() => setIsGridOpen(false)}
   >
    <div className="flex flex-col items-center pt-3 pb-2" onClick={(e) => e.stopPropagation()}>
    <div className="mb-5 h-1 w-10 shrink-0 rounded-full bg-muted-foreground/20" />
    <div className="grid grid-cols-3 gap-y-6 gap-x-2 px-6 w-full max-w-sm">
     {EXTRA_PAGES.map((page) => {
     const PageIcon = page.icon;
     const isActive = page.match(pathname);
     return (
      <button
      key={page.href}
      type="button"
      onClick={() => {
       setIsGridOpen(false);
       router.push(page.href);
      }}
      className="flex flex-col items-center gap-1.5 active:scale-90 transition-transform duration-200"
      >
      <span
       className={cn(
       "flex h-12 w-12 items-center justify-center rounded-xl transition-colors",
       isActive
        ? "bg-primary/10 text-primary"
        : "bg-muted/40 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
       )}
      >
       <PageIcon className="h-6 w-6" />
      </span>
      <span
       className={cn(
       "text-[11px] font-medium text-center leading-tight",
       isActive ? "text-primary" : "text-muted-foreground"
       )}
      >
       {page.label}
      </span>
      </button>
     );
     })}
    </div>
    </div>
   </motion.div>
   )}
  </AnimatePresence>

  {/* Full-screen blur backdrop — behind nav+grid, blurs page content */}
  <AnimatePresence>
  {isGridOpen && (
   <motion.div
   initial={{ opacity: 0 }}
   animate={{ opacity: 1 }}
   exit={{ opacity: 0 }}
   transition={{ duration: 0.2 }}
   className="fixed inset-0 z-50 backdrop-blur-lg bg-black/5"
   onClick={() => setIsGridOpen(false)}
   />
  )}
  </AnimatePresence>
 </>
 );
}
