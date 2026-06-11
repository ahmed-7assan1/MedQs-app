"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useThemeStore } from "@/lib/store";
import { MobileBottomSheet } from "@/components/layout/MobileBottomSheet";
import { cn } from "@/lib/utils";
import {
  SunIcon, MoonIcon, MagnifyingGlassIcon, Square2StackIcon,
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
        <div className="rounded-b-2xl px-4 py-3 bg-white/80 dark:bg-[#0d0d14]/90 backdrop-blur-3xl saturate-[1.8] border-b border-white/30 dark:border-white/[0.07] shadow-lg dark:shadow-none">
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
                <button
                  onClick={() => setNavSheetOpen(true)}
                  className="shrink-0 p-1.5 -ml-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 active:scale-90 transition-all text-black dark:text-white"
                  aria-label="Open navigation menu"
                >
                  <Square2StackIcon className="h-5 w-5" />
                </button>

                <div className="flex items-center gap-2 flex-1 justify-center">
                  <img
                    src="/medonex-logo.svg"
                    alt="Medonex"
                    className="h-6 w-auto object-contain"
                  />
                  <span className="font-black text-sm tracking-tight text-gray-900 dark:text-white">
                    MedOneX
                  </span>
                </div>

                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => {
                      setSearchOpen(true);
                      setTimeout(() => inputRef.current?.focus(), 100);
                    }}
                    className="shrink-0 p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 active:scale-90 transition-all text-black dark:text-white"
                    aria-label="Search"
                  >
                    <MagnifyingGlassIcon className="h-5 w-5" />
                  </button>

                  {mounted && (
                    <button
                      onClick={toggleTheme}
                      className="shrink-0 p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 active:scale-90 transition-all text-black dark:text-white"
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
    </>
  );
}
