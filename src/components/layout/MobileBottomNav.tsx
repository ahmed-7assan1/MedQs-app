"use client";

import type { ElementType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, BookOpenText, MessageSquare, Clapperboard, Settings2, PlusCircle, LayoutDashboard, Compass, Sparkles, BookCheck } from "lucide-react";
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
    label: "Lectures",
    icon: BookOpenText,
    match: (p) => p.startsWith("/modules"),
  },
  {
    href: "/videos",
    label: "Videos",
    icon: Clapperboard,
    match: (p) => p.startsWith("/videos"),
  },
  {
    href: "/quizzes",
    label: "Quizzes",
    icon: BookCheck,
    match: (p) => p.startsWith("/quizzes") || p.startsWith("/quiz"),
  },
  {
    href: "/ai-chat",
    label: "Dr. Q",
    icon: Sparkles,
    match: (p) => p.startsWith("/ai-chat"),
  },
];

export function MobileBottomNav() {
  const pathname = usePathname() ?? "";

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[118] flex justify-center md:hidden"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))" }}
    >
      <nav
        className={cn(
          "pointer-events-auto mx-4 mb-1 w-full max-w-[420px]",
          "rounded-[22px] border border-white/[0.05] dark:border-white/[0.02]",
          "bg-background/85 dark:bg-[#141418]/92",
          "shadow-[0_12px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_12px_48px_rgba(0,0,0,0.55)]",
          "backdrop-blur-2xl px-2 py-2"
        )}
        aria-label="Primary navigation"
      >
        <ul className="flex items-center justify-between gap-0">
          {TABS.map(({ href, label, icon: Icon, match }) => {
            const active = match(pathname);
            return (
              <li key={href} className="flex flex-1 justify-center">
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex min-w-0 flex-1 flex-col items-center gap-[3px]",
                    "rounded-[16px] px-1 py-2",
                    "transition-all duration-200 active:scale-90",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  )}
                >
                  {/* Active pill indicator */}
                  {active && (
                    <span
                      className={cn(
                        "absolute inset-0 rounded-[16px]",
                        "bg-primary/10 dark:bg-primary/[0.12]",
                        "animate-in fade-in zoom-in-90 duration-200"
                      )}
                    />
                  )}

                  {/* Icon wrapper */}
                  <span
                    className={cn(
                      "relative z-10 flex items-center justify-center",
                      "h-7 w-7 rounded-[11px] transition-all duration-200",
                      active
                        ? "text-primary scale-110"
                        : "text-muted-foreground/60 dark:text-white/35 hover:text-foreground/80"
                    )}
                  >
                    <Icon
                      className="h-[1.05rem] w-[1.05rem] transition-transform duration-200"
                      strokeWidth={active ? 2.5 : 1.8}
                      aria-hidden
                    />
                  </span>

                  {/* Label */}
                  <span
                    className={cn(
                      "relative z-10 max-w-full truncate text-center leading-none",
                      "transition-all duration-200",
                      active
                        ? "text-[9.5px] font-bold text-primary"
                        : "text-[9px] font-medium text-muted-foreground/50 dark:text-white/30"
                    )}
                    style={{ fontFeatureSettings: '"ss01"' }}
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

