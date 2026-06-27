"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSiteConfig } from "@/contexts/SiteConfigContext";
import { useThemeStore, useNotificationStore } from "@/lib/store";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { NotificationPanel } from "@/components/notifications/NotificationPanel";
import { MobileBottomSheet } from "@/components/layout/MobileBottomSheet";

import {
  Moon, Sun, Search, Bell, List,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileHeaderProps {
  userImage: string | null;
  userName?: string | null;
  userId?: string;
  isAdmin?: boolean;
  isGuest?: boolean;
}

export function MobileHeader({ userImage, userName, userId, isAdmin, isGuest }: MobileHeaderProps) {
  const pathname = usePathname();
  const { siteName } = useSiteConfig();
  const { theme, setTheme } = useThemeStore();
  const { unread } = useNotificationStore();
  const [mounted, setMounted] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [navSheetOpen, setNavSheetOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (pathname?.startsWith("/drawmed") || pathname?.startsWith("/community") || pathname === "/social") return null;

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  // Determine page title based on pathname
  let pageTitle = siteName || "MedOneX";
  if (pathname?.includes("/dashboard")) pageTitle = "MedOneX";
  else if (pathname?.includes("/modules")) pageTitle = "Library";
  else if (pathname?.includes("/videos")) pageTitle = "Videos";
  else if (pathname?.includes("/quiz") || pathname?.includes("/past-papers")) pageTitle = "QBank";
  else if (pathname?.includes("/taskat")) pageTitle = "Taskat";
  else if (pathname?.includes("/settings")) pageTitle = "Settings";
  else if (pathname?.includes("/social") || pathname?.includes("/community")) pageTitle = "Community";
  else if (pathname?.includes("/ai-chat")) pageTitle = "Dr. Q";
  else if (pathname?.includes("/atlas")) pageTitle = "Anatomy Atlas";
  else if (pathname?.includes("/podcasts")) pageTitle = "Podcasts";
  else if (pathname?.includes("/leaderboard")) pageTitle = "Leaderboard";
  else if (pathname?.includes("/medical-books")) pageTitle = "Medical Books";
  else if (pathname?.includes("/profile")) pageTitle = "Profile";

  return (
    <>
      <header
        className={cn(
          "fixed top-0 inset-x-0 z-sticky flex h-14 items-center md:hidden",
          "pt-[env(safe-area-inset-top,0px)]",
          "bg-[#0d0d14]/80 backdrop-blur-2xl",
          "border-b border-white/[0.05]"
        )}
      >
        <div className="flex w-full items-center justify-between px-3 h-full">
          {/* Left: Menu toggle */}
          <button
            onClick={() => setNavSheetOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] active:bg-white/[0.12] border border-white/[0.08] active:scale-95 transition-all shrink-0"
            aria-label="Open navigation menu"
          >
            <List className="h-5 w-5 text-white/70" />
          </button>

          {/* Center: Page Title */}
          <div className="flex-1 text-center truncate px-2">
            <span className="text-[15px] font-black tracking-tight text-white">{pageTitle}</span>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5">
            {/* Search */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] active:bg-white/[0.12] border border-white/[0.08] active:scale-95 transition-all text-white/60"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>

            {/* Theme Toggle */}
            {mounted && (
              <button
                onClick={toggleTheme}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] active:bg-white/[0.12] border border-white/[0.08] active:scale-95 transition-all text-white/60"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Search Overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-backdrop md:hidden">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSearchOpen(false)} />
          <div className="relative px-4 pt-20">
            <GlobalSearch isGuest={!userName} />
            <button
              onClick={() => setSearchOpen(false)}
              className="mt-4 w-full py-3 bg-white/10 border border-white/10 rounded-xl text-white font-bold text-sm"
            >
              Close Search
            </button>
          </div>
        </div>
      )}

      {/* Notifications Drawer */}
      {notifOpen && <NotificationPanel onClose={() => setNotifOpen(false)} />}

      {/* Mobile Bottom Sheet Navigation (replaces sidebar) */}
      <MobileBottomSheet
        isOpen={navSheetOpen}
        onClose={() => setNavSheetOpen(false)}
        userImage={userImage}
        userName={userName}
        userId={userId}
        isAdmin={isAdmin}
        isGuest={isGuest}
      />
    </>
  );
}
