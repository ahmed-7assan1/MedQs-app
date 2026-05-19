"use client";

import type { ElementType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { House, Books, Clock, ClipboardText, Sparkle } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

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
  const pathname = usePathname() ?? "";

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[118] flex justify-center md:hidden"
    >
      <div className="relative mx-auto w-[92%] max-w-[400px]">
        {/* Center FAB - Renders absolutely positioned above the nav */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-6 z-20 pointer-events-auto">
          <Link href={CENTER_FAB.href} className="group relative flex items-center justify-center">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-primary/40 rounded-full blur-xl scale-150 opacity-50 group-hover:opacity-80 transition-opacity" />
            
            {/* Button itself */}
            <div className={cn(
              "relative flex h-14 w-14 items-center justify-center rounded-full shadow-2xl transition-transform active:scale-95",
              CENTER_FAB.match(pathname) 
                ? "bg-primary text-primary-foreground border-2 border-white/20" 
                : "bg-gradient-to-tr from-primary to-violet-500 text-white border-2 border-white/10"
            )}>
              <CENTER_FAB.icon weight="fill" className="h-6 w-6" />
            </div>
            {/* Label below FAB */}
            <span className="absolute -bottom-4 text-[9px] font-black tracking-widest uppercase text-foreground/80 whitespace-nowrap">
              {CENTER_FAB.label}
            </span>
          </Link>
        </div>

        <nav
          className={cn(
            "pointer-events-auto w-full",
            "rounded-[24px] border border-white/10",
            "bg-background/70 backdrop-blur-2xl",
            "shadow-[0_8px_32px_rgba(0,0,0,0.12)]",
            "px-2 py-2 relative overflow-hidden"
          )}
          aria-label="Mobile Navigation Bar"
        >
          <ul className="relative flex items-center justify-between">
            {/* Left Tabs */}
            <div className="flex flex-1 justify-around pr-6">
              {LEFT_TABS.map((tab) => <TabItem key={tab.href} tab={tab} pathname={pathname} />)}
            </div>

            {/* Spacer for FAB */}
            <div className="w-12 shrink-0" />

            {/* Right Tabs */}
            <div className="flex flex-1 justify-around pl-6">
              {RIGHT_TABS.map((tab) => <TabItem key={tab.href} tab={tab} pathname={pathname} />)}
            </div>
          </ul>
        </nav>
      </div>
    </div>
  );
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
