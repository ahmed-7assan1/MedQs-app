"use client";

import type { ElementType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, BookOpenText, Sparkles, BookCheck, Clock } from "lucide-react";
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
    icon: BookOpenText,
    match: (p) => p.startsWith("/modules"),
  },
  {
    href: "/taskat",
    label: "Schedule",
    icon: Clock,
    match: (p) => p.startsWith("/taskat"),
  },
  {
    href: "/quizzes",
    label: "Practice",
    icon: BookCheck,
    match: (p) => p.startsWith("/quizzes") || p.startsWith("/quiz"),
  },
  {
    href: "/ai-chat",
    label: "Ask Dr.Q",
    icon: Sparkles,
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
          "pointer-events-auto mx-4 w-[92%] max-w-[420px]",
          "rounded-[28px] border border-white/[0.1] dark:border-white/[0.05]",
          "bg-white/80 dark:bg-black/80",
          "shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)]",
          "backdrop-blur-xl px-2 py-2"
        )}
        aria-label="Mobile Navigation Bar"
      >
        <ul className="flex items-center justify-around">
          {TABS.map(({ href, label, icon: Icon, match }) => {
            const active = match(pathname);
            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1",
                    "min-h-[48px] min-w-[48px] py-1 transition-all duration-300",
                    "active:scale-90"
                  )}
                >
                  <div className="relative flex items-center justify-center h-8 w-8">
                    {active && (
                      <span className="absolute inset-0 bg-primary/20 dark:bg-primary/30 blur-md rounded-full animate-pulse" />
                    )}
                    <Icon
                      className={cn(
                        "h-6 w-6 transition-all duration-300",
                        active ? "text-primary scale-110 drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]" : "text-muted-foreground/60"
                      )}
                      strokeWidth={active ? 2.5 : 2}
                    />
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-bold tracking-tight transition-colors duration-300",
                      active ? "text-primary" : "text-muted-foreground/50"
                    )}
                  >
                    {label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

