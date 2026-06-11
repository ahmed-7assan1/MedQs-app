"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useThemeStore, useNotificationStore } from "@/lib/store";
import { MobileBottomSheet } from "@/components/layout/MobileBottomSheet";
import { NotificationsSheet } from "@/components/layout/NotificationsSheet";
import { cn } from "@/lib/utils";
import {
  SunIcon, MoonIcon, MagnifyingGlassIcon, BellIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";

interface GlobalTopBarProps {
  userImage: string | null;
  userName?: string | null;
  userId?: string;
  isAdmin?: boolean;
  isGuest?: boolean;
}

export function GlobalTopBar({ userImage, userName, userId, isAdmin, isGuest }: GlobalTopBarProps) {
  const { theme, setTheme } = useThemeStore();
  const [mounted, setMounted] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [navSheetOpen, setNavSheetOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const unread = useNotificationStore((s) => s.unread);
  const [visible, setVisible] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastScrollY = useRef(0);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const THRESHOLD = 8;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const diff = currentScrollY - lastScrollY.current;

      if (Math.abs(diff) < THRESHOLD) {
        lastScrollY.current = currentScrollY;
        return;
      }

      if (diff > 0 && currentScrollY > 60) {
        setVisible(false);
      } else if (diff < 0) {
        setVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  return (
    <>
      <header
        className={cn(
          "fixed top-0 inset-x-0 z-[150] md:hidden pt-[env(safe-area-inset-top,0px)]",
          "transition-transform duration-300 will-change-transform",
          visible || searchOpen ? "translate-y-0" : "-translate-y-full"
        )}
      >
        <div className="rounded-b-2xl px-4 py-3 bg-background/80 backdrop-blur-3xl saturate-[1.8] border-b border-border shadow-lg">
          <AnimatePresence mode="wait">
            {searchOpen ? (
              <motion.div
                key="search"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-3"
              >
                <MagnifyingGlassIcon className="h-5 w-5 text-black dark:text-white shrink-0" />
                <input
                  ref={inputRef}
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search courses, videos, people..."
                  className="flex-1 bg-transparent text-sm font-medium text-gray-900 dark:text-white outline-none placeholder:text-gray-400 dark:placeholder:text-white/30"
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setSearchOpen(false);
                      setSearchQuery("");
                    }
                  }}
                />
                <button
                  onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                  className="shrink-0 p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-black dark:text-white"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="default"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-[1px]">
                  <button
                    onClick={() => setNavSheetOpen(true)}
                    className="shrink-0 p-1.5 -ml-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 active:scale-90 transition-all text-indigo-500 dark:text-white"
                    aria-label="Open navigation menu"
                  >
                    <motion.span
                      className="block h-7 w-7 bg-indigo-500 dark:bg-white"
                      animate={{ rotate: navSheetOpen ? -90 : 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      style={{
                        maskImage: "url(/medonex-logo.svg)",
                        maskSize: "contain",
                        maskRepeat: "no-repeat",
                        maskPosition: "center",
                        WebkitMaskImage: "url(/medonex-logo.svg)",
                        WebkitMaskSize: "contain",
                        WebkitMaskRepeat: "no-repeat",
                        WebkitMaskPosition: "center",
                      }}
                    />
                  </button>
                  <span className="font-black text-sm tracking-tight text-indigo-500 dark:text-white -ml-1.5">
                    MedOneX
                  </span>
                </div>

                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => {
                      setSearchOpen(true);
                      setTimeout(() => inputRef.current?.focus(), 100);
                    }}
                    className="shrink-0 p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 active:scale-90 transition-all text-gray-400 dark:text-white/40"
                    aria-label="Search"
                  >
                    <MagnifyingGlassIcon className="h-5 w-5" />
                  </button>

                  <button
                    onClick={() => setNotifOpen(true)}
                    className="relative shrink-0 p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 active:scale-90 transition-all text-gray-400 dark:text-white/40"
                    aria-label="Notifications"
                  >
                    <BellIcon className="h-5 w-5" />
                    {unread > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[14px] items-center justify-center rounded-full bg-indigo-500 px-1 text-[9px] font-bold leading-none text-white">
                        {unread > 9 ? "9+" : unread}
                      </span>
                    )}
                  </button>

                  {mounted && (
                    <button
                      onClick={toggleTheme}
                      className="shrink-0 p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 active:scale-90 transition-all text-gray-400 dark:text-white/40"
                      aria-label="Toggle theme"
                    >
                      {theme === "dark" ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      <MobileBottomSheet
        isOpen={navSheetOpen}
        onClose={() => setNavSheetOpen(false)}
        userImage={userImage}
        userName={userName}
        userId={userId}
        isAdmin={isAdmin}
        isGuest={isGuest}
      />

      <NotificationsSheet
        isOpen={notifOpen}
        onClose={() => setNotifOpen(false)}
      />
    </>
  );
}
