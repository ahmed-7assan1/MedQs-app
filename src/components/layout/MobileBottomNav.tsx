"use client";

import type { ElementType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { House, Books, Clock, ClipboardText, Sparkle } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

const TABS: {
  href: string;
  label: string;
  icon: ElementType;
  match: (pathname: string) => boolean;
}[] = [
  {
    href: "/dashboard-app",
    label: "Home",
    icon: House,
    match: (p) => p === "/dashboard-app" || p === "/dashboard",
  },
  {
    href: "/modules",
    label: "Library",
    icon: Books,
    match: (p) => p.startsWith("/modules"),
  },
  {
    href: "/taskat",
    label: "Schedule",
    icon: Clock,
    match: (p) => p.startsWith("/taskat"),
  },
  {
    href: "/past-papers",
    label: "Practice",
    icon: ClipboardText,
    match: (p) => p.startsWith("/past-papers") || p.startsWith("/quizzes") || p.startsWith("/quiz"),
  },
  {
    href: "/ai-chat",
    label: "Ask Dr.Q",
    icon: Sparkle,
    match: (p) => p.startsWith("/ai-chat"),
  },
];

export function MobileBottomNav() {
  const pathname = usePathname() ?? "";

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[118] flex justify-center md:hidden"
    >
      <nav
        className={cn(
          "pointer-events-auto mx-auto w-[90%] max-w-[340px]",
          "rounded-[20px] border border-black/5 dark:border-white/10",
          "bg-white dark:bg-[#09080F]",
          "shadow-lg shadow-black/5 dark:shadow-black/40",
          "px-1 py-1 relative overflow-hidden"
        )}
        aria-label="Mobile Navigation Bar"
      >
        <ul className="relative flex items-center justify-around">
          {TABS.map(({ href, label, icon: Icon, match }) => {
            const active = match(pathname);
            return (
              <li key={href} className="flex-1 relative">
                <Link
                  href={href}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5",
                    "min-h-[40px] py-1 transition-all duration-300 relative z-10",
                    active ? "text-primary" : "text-muted-foreground/60"
                  )}
                >
                  <div className="relative flex items-center justify-center h-6 w-6">
                    <Icon
                      weight={active ? "duotone" : "bold"}
                      className={cn(
                        "h-4 w-4 transition-all duration-300",
                        active ? "scale-110" : "opacity-80"
                      )}
                    />
                  </div>
                  
                  <span
                    className={cn(
                      "text-[8px] font-bold tracking-tight transition-all duration-300",
                      active ? "opacity-100" : "opacity-60"
                    )}
                  >
                    {label}
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
          })}
        </ul>
      </nav>
    </div>
  );
}
