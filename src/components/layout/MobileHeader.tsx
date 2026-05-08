"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { List, Bell, Sun, Moon, UserCircle, MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import { useThemeStore, useSidebarStore, useNotificationStore } from "@/lib/store";
import { useSiteConfig } from "@/contexts/SiteConfigContext";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { NotificationPanel } from "@/components/notifications/NotificationPanel";

interface MobileHeaderProps {
  userImage?: string | null;
  userName?: string | null;
  userId?: string;
}

export function MobileHeader({ userImage, userName }: MobileHeaderProps) {
  const { siteName } = useSiteConfig();
  const { toggle: toggleSidebar } = useSidebarStore();
  const { theme, setTheme } = useThemeStore();
  const { unread } = useNotificationStore();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  return (
    <>
      <header 
        className={cn(
          "fixed top-0 inset-x-0 z-[110] flex h-16 items-center justify-between px-4 md:hidden transition-all duration-300",
          scrolled 
            ? "bg-white dark:bg-[#09080F] border-b border-black/[0.05] dark:border-white/10 shadow-sm" 
            : "bg-transparent"
        )}
      >
        <div className="flex w-full items-center justify-between">
          {/* Left: Hamburger Menu */}
          <button
            onClick={toggleSidebar}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 active:scale-95 transition-all"
          >
            <List weight="bold" className="h-5 w-5 text-foreground" />
          </button>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 active:scale-95 transition-all"
            >
              <MagnifyingGlass weight="bold" className="h-5 w-5 text-foreground" />
            </button>

            {/* Notifications */}
            <button
              onClick={() => setNotifOpen(true)}
              className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 active:scale-95 transition-all"
            >
              <Bell weight="duotone" className="h-5 w-5 text-foreground" />
              {unread > 0 && (
                <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-black" />
              )}
            </button>

            {/* Theme Toggle */}
            {mounted && (
              <button
                onClick={toggleTheme}
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 active:scale-95 transition-all"
              >
                {theme === "dark" ? (
                  <Sun weight="duotone" className="h-5 w-5 text-amber-400" />
                ) : (
                  <Moon weight="duotone" className="h-5 w-5 text-slate-600" />
                )}
              </button>
            )}

            {/* Profile */}
            <Link
              href="/profile/me"
              className="flex h-10 w-10 items-center justify-center rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 active:scale-95 transition-all"
            >
              {userImage ? (
                <img src={userImage} alt={userName || "Profile"} className="h-full w-full object-cover" />
              ) : (
                <UserCircle weight="duotone" className="h-6 w-6 text-primary" />
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Global Search Backdrop/Overlay if needed or just trigger the existing GlobalSearch component */}
      {searchOpen && (
        <div className="fixed inset-0 z-[200] md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSearchOpen(false)} />
          <div className="relative pt-20 px-4">
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
    </>
  );
}
