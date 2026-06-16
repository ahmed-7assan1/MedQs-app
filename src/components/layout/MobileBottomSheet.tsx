"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { X, LogOut, Settings, Sun, Moon, Monitor, Search, User } from "lucide-react";
import {
  LayoutDashboard, BookOpen, BarChart3, HelpCircle, Video,
  Mic2, MessageSquare, Clock, Sparkles, Send, Pen,
  Globe, Stethoscope, BookMarked, ShieldCheck,
} from "lucide-react";
import { useThemeStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { PLATFORM_COPY } from "@/lib/platform-copy";
import { ThemeVariantPicker } from "@/components/ui/ThemeVariantPicker";

interface MobileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  userImage?: string | null;
  userName?: string | null;
  userId?: string;
  isAdmin?: boolean;
  isGuest?: boolean;
  siteName?: string;
}

interface NavItem {
  href: string;
  label: string;
  icon: any;
  desc?: string;
}

const NAV_SECTIONS: { label: string; items: NavItem[] }[] = [
  {
    label: "Main",
    items: [
      { href: "/dashboard-app", label: "Dashboard", icon: LayoutDashboard },
      { href: "/modules", label: "Lectures", icon: BookOpen, desc: "Browse all modules" },
      { href: "/study-tools", label: "Study Tools", icon: BarChart3, desc: "Flashcards, summaries" },
    ],
  },
  {
    label: "Practice",
    items: [
      { href: "/past-papers", label: "QBank", icon: HelpCircle, desc: "Practice questions" },
    ],
  },
  {
    label: "Media",
    items: [
      { href: "/videos", label: "OneX Videos", icon: Video, desc: "Medical lectures" },
      { href: "/podcasts", label: "Podcasts", icon: Mic2, desc: "Audio learning" },
      { href: "/atlas", label: "Anatomy Atlas", icon: Globe, desc: "3D anatomy" },
    ],
  },
  {
    label: "Interactive",
    items: [
      { href: "/drawmed", label: "DrawMed", icon: Pen, desc: "Sketch & learn" },
      { href: "/community", label: "Community", icon: MessageSquare, desc: "Discuss with peers" },
      { href: "/ai-chat", label: "Dr. Q AI", icon: Sparkles, desc: "AI medical tutor" },
    ],
  },
  {
    label: "Tools",
    items: [
      { href: "/taskat", label: "Taskat", icon: Clock, desc: "Study schedule" },
      { href: "/medical-books", label: "Medical Books", icon: BookMarked, desc: "Reference library" },
      { href: "/profile/telegram", label: "Telegram", icon: Send, desc: "Stay connected" },
      { href: "/leaderboard", label: "Leaderboard", icon: User, desc: "Rankings & points" },
    ],
  },
];

export function MobileBottomSheet({
  isOpen, onClose, userImage, userName, userId, isAdmin, isGuest, siteName = "MedOneX",
}: MobileBottomSheetProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useThemeStore();
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const isActive = (href: string) =>
    href === "/dashboard-app" ? pathname === href || pathname === "/dashboard" : pathname?.startsWith(href);

  const initial = userName?.[0]?.toUpperCase() ?? "U";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm md:hidden"
          />
          <motion.div
            ref={sheetRef}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="fixed bottom-0 left-0 right-0 z-[201] flex flex-col rounded-t-[28px] bg-card border-t border-border shadow-2xl overflow-hidden max-h-[88vh] md:hidden"
          >
            {/* Handle */}
            <div className="w-full flex justify-center pt-3 pb-1 shrink-0" onClick={onClose}>
              <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-white/20" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-2 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-white/30">Menu</span>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-white/40 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-600 dark:hover:text-white transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-6 custom-scrollbar space-y-6">
              {/* User Profile */}
              {!isGuest && (
                <Link
                  href="/profile/me"
                  onClick={onClose}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.05] mt-2 active:scale-[0.98] transition-all"
                >
                  <div className="h-14 w-14 rounded-2xl overflow-hidden bg-primary/10 ring-2 ring-primary/20 shrink-0 flex items-center justify-center">
                    {userImage ? (
                      <img src={userImage} alt={userName || "User"} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-lg font-black text-primary">{initial}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-gray-900 dark:text-white truncate">{userName || "Student"}</p>
                    <p className="text-xs font-medium text-gray-500 dark:text-white/40">{isAdmin ? "Admin" : "Student"}</p>
                  </div>
                  <ChevronRightSmall />
                </Link>
              )}

              {/* Navigation Sections */}
              {NAV_SECTIONS.map((section) => (
                <div key={section.label}>
                  <div className="flex items-center gap-3 mb-2 px-1">
                    <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-gray-400 dark:text-white/25 border-l-2 border-primary pl-3">
                      {section.label}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    {section.items.map(({ href, label, icon: Icon, desc }) => {
                      const active = isActive(href);
                      return (
                        <Link
                          key={href}
                          href={href}
                          onClick={onClose}
                            className={cn(
                              "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all active:scale-[0.98]",
                              active
                                ? "bg-primary/10 dark:bg-primary/10 text-primary dark:text-primary"
                                : "text-gray-600 dark:text-white/50 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
                            )}>
                            <div className={cn(
                              "h-8 w-8 rounded-xl flex items-center justify-center shrink-0",
                              active ? "bg-primary/15 dark:bg-primary/15" : "bg-gray-100 dark:bg-white/[0.04]"
                            )}>
                              <Icon className={cn("h-[16px] w-[16px]", active ? "text-primary dark:text-primary" : "text-gray-500 dark:text-white/40")} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="block truncate">{label}</span>
                            {desc && <span className="block text-[10px] text-gray-400 dark:text-white/30 truncate">{desc}</span>}
                          </div>
                          {active && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* AI Quick Link */}
              {!isGuest && (
                <Link
                  href="/ai-chat"
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-400/10 transition-all active:scale-[0.98]"
                >
                  <Sparkles className="h-[18px] w-[18px]" /> Study with Dr. Q
                </Link>
              )}

              {/* Admin Panel */}
              {isAdmin && (
                <Link
                  href="/admin/dashboard"
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-400/10 transition-all active:scale-[0.98]"
                >
                  <ShieldCheck className="h-[18px] w-[18px]" /> {PLATFORM_COPY.doctorPanel}
                </Link>
              )}

              {/* Theme Preference */}
              <div>
                <div className="flex items-center gap-3 mb-2 px-1">
                  <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-gray-400 dark:text-white/25 border-l-2 border-primary pl-3">
                    Appearance
                  </span>
                </div>
                <div className="bg-gray-100 dark:bg-white/[0.03] p-1.5 rounded-2xl flex items-center border border-gray-200 dark:border-white/[0.05]">
                  {[
                    { value: "light" as const, icon: Sun, label: "Light" },
                    { value: "system" as const, icon: Monitor, label: "Auto" },
                    { value: "dark" as const, icon: Moon, label: "Dark" },
                  ].map(({ value, icon: Icon, label }) => (
                    <button
                      key={value}
                      onClick={() => setTheme(value)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all",
                        theme === value
                          ? "bg-white dark:bg-primary/20 text-gray-900 dark:text-white shadow-sm dark:shadow-none"
                          : "text-gray-500 dark:text-white/30"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" /> {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme Variant */}
              <div>
                <div className="flex items-center gap-3 mb-2 px-1">
                  <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-gray-400 dark:text-white/25 border-l-2 border-primary pl-3">
                    Theme
                  </span>
                </div>
                <ThemeVariantPicker compact onSelect={onClose} />
              </div>

              {/* Bottom Actions */}
              <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-white/[0.05]">
                <Link
                  href="/settings"
                  onClick={onClose}
                  className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-white/70 font-bold text-sm hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-all active:scale-[0.98]"
                >
                  <Settings className="h-4 w-4" /> Settings
                </Link>
                {!isGuest && (
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 font-bold text-sm hover:bg-red-100 dark:hover:bg-red-500/20 transition-all active:scale-[0.98]"
                  >
                    <LogOut className="h-4 w-4" /> Sign Out
                  </button>
                )}
              </div>

              <p className="text-center text-[10px] text-gray-400 dark:text-white/20">{siteName} &middot; Medical Education Platform</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function ChevronRightSmall() {
  return (
    <svg className="h-4 w-4 text-gray-300 dark:text-white/20 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}
