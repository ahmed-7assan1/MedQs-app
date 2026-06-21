"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useNotificationStore } from "@/lib/store";
import { MobileBottomSheet } from "@/components/layout/MobileBottomSheet";
import { NotificationsSheet } from "@/components/layout/NotificationsSheet";
import { SearchResultsPanel } from "@/components/layout/SearchResultsPanel";
import { cn } from "@/lib/utils";
import {
  MagnifyingGlassIcon, BellIcon, PlusIcon,
  XMarkIcon, ChevronDownIcon,
} from "@heroicons/react/24/solid";
import { useCommunityStore } from "@/components/community-mobile/store";

interface GlobalTopBarProps {
  userImage: string | null;
  userName?: string | null;
  userId?: string;
  isAdmin?: boolean;
  isGuest?: boolean;
}

const SOCIAL_PATHS = ["/social", "/community"];

export function GlobalTopBar({ userImage, userName, userId, isAdmin, isGuest }: GlobalTopBarProps) {
  const pathname = usePathname();
  const isSocial = SOCIAL_PATHS.some((p) => pathname?.startsWith(p));

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [navSheetOpen, setNavSheetOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const unread = useNotificationStore((s) => s.unread);
  const [visible, setVisible] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastScrollY = useRef(0);

  // Social page state from community store
  const forums = useCommunityStore((s) => s.forums);
  const activeForumId = useCommunityStore((s) => s.activeForumId);
  const setActiveForum = useCommunityStore((s) => s.setActiveForum);
  const activeFilter = useCommunityStore((s) => s.activeFilter);
  const setActiveFilter = useCommunityStore((s) => s.setActiveFilter);
  const openComposer = useCommunityStore((s) => s.openComposer);
  const feedScrolled = useCommunityStore((s) => s.feedScrolled);
  const [forumsExpanded, setForumsExpanded] = useState(false);

  useEffect(() => {
    // Don't collapse on social page — it uses full-screen layout with its own scroll
    if (isSocial) return;
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
  }, [isSocial]);

  if (pathname?.startsWith("/quiz") || pathname?.startsWith("/ai-chat")) return null;

  const title = isSocial
    ? "MedOneX Community"
    : pathname?.includes("/modules")
      ? "Modules"
      : pathname?.includes("/past-papers")
        ? "Quizzes & Past Papers"
        : "MedOneX";

  return (
    <>
      <header
        className={cn(
          "fixed top-0 inset-x-0 z-[150] md:hidden pt-[env(safe-area-inset-top,0px)]",
          "transition-transform duration-300 will-change-transform",
          (visible || searchOpen || isSocial) ? "translate-y-0" : "-translate-y-full"
        )}
      >
        <div className="bg-white/85 backdrop-blur-xl saturate-[1.5] dark:bg-black/85 dark:backdrop-blur-xl dark:saturate-[1.5] border-b border-gray-200/50 dark:border-white/[0.05] shadow-[0_4px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_32px_rgba(0,0,0,0.4)]">
          <div className="px-4 py-3 rounded-b-2xl">
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
                    className="flex-1 bg-transparent text-sm font-medium text-gray-900 dark:text-white outline-none placeholder:text-gray-500 dark:placeholder:text-white/30"
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
                      className={cn(
                        "shrink-0 p-1.5 -ml-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 active:scale-90 transition-all",
                        pathname?.includes("/modules") || pathname?.includes("/past-papers") ? "text-gray-500 dark:text-white/60" : "text-gray-900 dark:text-white"
                      )}
                      aria-label="Open navigation menu"
                    >
                      <motion.span
                        className={cn(
                          "block h-7 w-7",
                          pathname?.includes("/modules") || pathname?.includes("/past-papers") ? "bg-gray-500 dark:bg-white/60" : "bg-gray-900 dark:bg-white"
                        )}
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
                    <span className={cn(
                      "font-black text-sm tracking-tight -ml-1.5",
                      pathname?.includes("/modules") || pathname?.includes("/past-papers") ? "text-gray-500 dark:text-white/60" : "text-gray-900 dark:text-white"
                    )}>
                      {title}
                    </span>
                  </div>

                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => {
                        setSearchOpen(true);
                        setTimeout(() => inputRef.current?.focus(), 100);
                      }}
                      className="shrink-0 p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 active:scale-90 transition-all text-gray-500 dark:text-white/60"
                      aria-label="Search"
                    >
                      <MagnifyingGlassIcon className="h-5 w-5" />
                    </button>

                    {isSocial && (
                      <button
                        onClick={() => openComposer()}
                        className="shrink-0 p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 active:scale-90 transition-all text-gray-500 dark:text-white/60"
                        aria-label="Create post"
                      >
                        <PlusIcon className="h-5 w-5" />
                      </button>
                    )}

                    <button
                      onClick={() => setNotifOpen(true)}
                      className="relative shrink-0 p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 active:scale-90 transition-all text-gray-500 dark:text-white/60"
                      aria-label="Notifications"
                    >
                      <BellIcon className="h-5 w-5" />
                      {unread > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[14px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold leading-none text-white">
                          {unread > 9 ? "9+" : unread}
                        </span>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Social page: forum tabs + filter pills — collapse on feed scroll */}
          {isSocial && (
            <motion.div
              animate={{ height: feedScrolled ? 0 : "auto", opacity: feedScrolled ? 0 : 1 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden border-t border-border/40"
            >
              {/* Forum tabs — collapsible, closed by default */}
              <AnimatePresence initial={false}>
                {forumsExpanded && (
                  <motion.div
                    key="forum-tabs"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center gap-1 overflow-x-auto px-4 py-2 no-scrollbar">
                      {forums.map((forum) => {
                        const isActive = forum.id === activeForumId;
                        return (
                          <button
                            key={forum.id}
                            type="button"
                            onClick={() => setActiveForum(forum.id)}
                            className={cn(
                              "relative flex-1 rounded-xl py-2 text-center text-xs font-medium whitespace-nowrap transition-colors duration-200",
                              isActive ? "bg-muted text-foreground" : "text-muted-foreground"
                            )}
                          >
                            {forumTypeLabel(forum.type)}
                            {Boolean(forum.unreadCount) && (
                              <span className="absolute right-2 top-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Filter pills with toggle */}
              <FilterPillsInline
                active={activeFilter}
                onChange={setActiveFilter}
                forumsExpanded={forumsExpanded}
                onToggleForums={() => setForumsExpanded((v) => !v)}
              />
            </motion.div>
          )}
        </div>
      </header>

      <SearchResultsPanel
        query={searchQuery}
        isOpen={searchOpen}
        onClose={() => { setSearchOpen(false); setSearchQuery(""); }}
      />

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

function forumTypeLabel(type: string): string {
  switch (type) {
    case "GLOBAL": return "Global";
    case "SEMESTER": return "Semester";
    case "PRIVATE": return "Private";
    default: return type;
  }
}

const FILTERS = [
  { id: "latest" as const, label: "Latest" },
  { id: "trending" as const, label: "Trending" },
  { id: "media" as const, label: "Media" },
  { id: "pinned" as const, label: "Pinned" },
];

function FilterPillsInline({
  active, onChange, forumsExpanded, onToggleForums
}: {
  active: string;
  onChange: (f: any) => void;
  forumsExpanded?: boolean;
  onToggleForums?: () => void;
}) {
  return (
    <div className="flex items-center gap-1 px-4 py-2.5">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-1">
        {FILTERS.map((filter) => {
          const isActive = filter.id === active;
          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => onChange(filter.id)}
              className="relative flex-shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors duration-200"
            >
              {isActive && (
                <motion.span
                  layoutId="filter-pill-bg"
                  transition={{ type: "spring", damping: 28, stiffness: 320 }}
                  className="absolute inset-0 rounded-full bg-primary"
                />
              )}
              <span className={`relative ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`}>
                {filter.label}
              </span>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={onToggleForums}
        className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-muted/50 active:scale-90 transition-all"
        aria-label={forumsExpanded ? "Collapse forums" : "Expand forums"}
      >
        <motion.span
          animate={{ rotate: forumsExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="block"
        >
          <ChevronDownIcon className="h-4 w-4" />
        </motion.span>
      </button>
    </div>
  );
}
