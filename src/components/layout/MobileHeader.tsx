"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSiteConfig } from "@/contexts/SiteConfigContext";
import { useThemeStore, useSidebarStore, useNotificationStore } from "@/lib/store";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { NotificationPanel } from "@/components/notifications/NotificationPanel";
import { NavigationSheet } from "@/components/layout/NavigationSheet";
import { ProfileBottomSheet } from "@/components/layout/ProfileBottomSheet";

import { 
  Moon, 
  Sun, 
  Search, 
  Bell, 
  ChevronDown, 
  Upload, 
  Users, 
  LogOut, 
  MessageCircle, 
  Loader2, 
  FileText 
} from "lucide-react";
import { List, MagnifyingGlass } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";


interface MobileHeaderProps {
  userImage: string | null;
  userName?: string | null;
  userId?: string;
}

export function MobileHeader({ userImage, userName, userId }: MobileHeaderProps) {
  const pathname = usePathname();
  if (pathname?.startsWith("/drawmed")) return null;
  const { siteName } = useSiteConfig();
  const { theme, setTheme } = useThemeStore();
  const { toggle: toggleSidebar } = useSidebarStore();
  const { unread } = useNotificationStore();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [navSheetOpen, setNavSheetOpen] = useState(false); // New state

  const [imageError, setImageError] = useState(false);


  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 10);
      
      // Hide on scroll down, show on scroll up
      if (currentScrollY > lastScrollY.current && currentScrollY > 60) {
        setHidden(true);
      } else if (currentScrollY < lastScrollY.current) {
        setHidden(false);
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  // Determine page title based on pathname
  let pageTitle = siteName || "MedOneX";
  if (pathname?.includes("/dashboard")) pageTitle = "Dashboard";
  else if (pathname?.includes("/modules")) pageTitle = "Library";
  else if (pathname?.includes("/videos")) pageTitle = "OneX Videos";
  else if (pathname?.includes("/quiz") || pathname?.includes("/past-papers")) pageTitle = "Practice";
  else if (pathname?.includes("/taskat")) pageTitle = "Schedule";
  else if (pathname?.includes("/settings")) pageTitle = "Settings";
  else if (pathname?.includes("/social") || pathname?.includes("/community")) pageTitle = "Community";
  else if (pathname?.includes("/ai-chat")) pageTitle = "Dr. Q";

  return (
    <>
      <header 
        className={cn(
          "fixed top-0 inset-x-0 z-[150] flex min-h-14 items-center md:hidden transition-transform duration-300",
          "pt-[env(safe-area-inset-top,0px)]",
          hidden ? "-translate-y-full" : "translate-y-0"
        )}
      >
        <div className={cn(
          "flex w-full items-center justify-between px-4 py-2 transition-all duration-300 border-b",
          scrolled 
            ? "bg-white/95 dark:bg-[#07080f]/80 backdrop-blur-xl border-black/10 dark:border-white/[0.05]" 
            : "bg-transparent border-transparent"
        )}>
          {/* Left: Avatar (Opens Bottom Sheet) */}
          <button
            onClick={() => setNavSheetOpen(true)}
            className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full overflow-hidden bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 active:scale-95 transition-all shrink-0"
          >
            {userImage && !imageError ? (
              <img 
                src={userImage} 
                alt={userName || "Profile"} 
                className="h-full w-full object-cover" 
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-[#4f5fff] to-[#7b5fff] text-white font-bold text-sm uppercase">
                {(userName || "S").charAt(0)}
              </div>
            )}
          </button>

          {/* Center: Dynamic Title */}
          <div className="flex-1 text-center truncate px-2">
            <span className="text-[14px] font-black tracking-tight text-foreground">{pageTitle}</span>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSidebar}
              className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-black/[0.04] dark:bg-white/[0.06] border border-black/5 dark:border-white/10 shadow-sm active:scale-95 transition-all text-foreground/80 hover:text-foreground"
              aria-label="Open navigation menu"
            >
              <List weight="bold" className="h-5 w-5" />
            </button>
            {/* Search */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-black/[0.04] dark:bg-white/[0.06] border border-black/5 dark:border-white/10 shadow-sm active:scale-95 transition-all text-foreground/80 hover:text-foreground"
            >
              <MagnifyingGlass weight="bold" className="h-5 w-5" />
            </button>

            {/* Notifications */}
            <button
              onClick={() => setNotifOpen(true)}
              className="relative flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-black/[0.04] dark:bg-white/[0.06] border border-black/5 dark:border-white/10 shadow-sm active:scale-95 transition-all text-foreground/80 hover:text-foreground"
            >
              <Bell weight="duotone" className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 border border-white dark:border-[#07080f]" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Global Search Backdrop/Overlay if needed or just trigger the existing GlobalSearch component */}
      {searchOpen && (
        <div className="fixed inset-0 z-[200] md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSearchOpen(false)} />
          <div className="relative px-4" style={{ paddingTop: "var(--mobile-header-offset)" }}>
             <GlobalSearch isGuest={!userName} />
             <button 
               onClick={() => setSearchOpen(false)}
               className="mt-4 w-full py-3 bg-white/10 dark:bg-black/40 border border-white/10 rounded-xl text-white font-bold"
             >
               Close Search
             </button>
          </div>
        </div>
      )}

      {/* Notifications Drawer */}
      {notifOpen && <NotificationPanel onClose={() => setNotifOpen(false)} />}

      {/* Profile Bottom Sheet */}
      <ProfileBottomSheet 
        isOpen={navSheetOpen} 
        onClose={() => setNavSheetOpen(false)} 
        userImage={userImage}
        userName={userName}
        userId={userId}
      />
    </>
  );
}
