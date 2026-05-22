"use client";

import type { ElementType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { House, Books, Clock, ClipboardText, Sparkle } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import { isImmersiveMobileRoute } from "@/lib/mobile-chrome";

const LEFT_TABS = [
  {
    href: "/dashboard-app",
    label: "HOME",
    icon: House,
    match: (p: string) => p === "/dashboard-app" || p === "/dashboard",
  },
  {
    href: "/modules",
    label: "LIBRARY",
    icon: Books,
    match: (p: string) => p.startsWith("/modules"),
  },
];

const RIGHT_TABS = [
  {
    href: "/taskat",
    label: "SCHEDULE",
    icon: Clock,
    match: (p: string) => p.startsWith("/taskat"),
  },
  {
    href: "/past-papers",
    label: "PRACTICE",
    icon: ClipboardText,
    match: (p: string) => p.startsWith("/past-papers") || p.startsWith("/quizzes") || p.startsWith("/quiz"),
  },
];

const CENTER_FAB = {
  href: "/ai-chat",
  label: "DR. Q",
  icon: Sparkle,
  match: (p: string) => p.startsWith("/ai-chat"),
};

export function MobileBottomNav() {
  return null;
}

function TabItem({ tab, pathname }: { tab: any; pathname: string }) {
  const active = tab.match(pathname);
  
  return (
    <li className="relative flex-1 flex justify-center">
      <Link
        href={tab.href}
        className={cn(
          "flex flex-col items-center justify-center gap-1",
          "h-12 w-14 transition-all duration-300 relative z-10",
          active ? "text-primary" : "text-muted-foreground"
        )}
      >
        <div className="relative flex items-center justify-center">
          <tab.icon
            weight={active ? "fill" : "bold"}
            className={cn(
              "transition-all duration-300",
              active ? "h-6 w-6" : "h-5 w-5 opacity-70"
            )}
          />
        </div>
        
        {/* Only show label when active */}
        <span
          className={cn(
            "text-[9px] font-black tracking-wider transition-all duration-300 overflow-hidden",
            active ? "opacity-100 max-h-4" : "opacity-0 max-h-0"
          )}
        >
          {tab.label}
        </span>

        {/* Liquid background pill */}
        {active && (
          <motion.div
            layoutId="activeTabPill"
            className="absolute inset-0 z-[-1] bg-primary/10 dark:bg-primary/20 rounded-xl"
            initial={false}
            transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
          />
        )}
      </Link>
    </li>
  );
}
