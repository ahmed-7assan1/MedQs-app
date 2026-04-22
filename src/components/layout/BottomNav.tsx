"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, BookOpenText, Clapperboard, HelpCircle, MessagesSquare, CircleUser } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    href: "/dashboard-app",
    label: "Home",
    icon: House,
    match: (p: string) => p === "/dashboard-app" || p === "/dashboard",
  },
  {
    href: "/modules",
    label: "Lectures",
    icon: BookOpenText,
    match: (p: string) => p.startsWith("/modules"),
  },
  {
    href: "/videos",
    label: "Videos",
    icon: Clapperboard,
    match: (p: string) => p.startsWith("/videos"),
  },
  {
    href: "/past-papers",
    label: "Quizzes",
    icon: HelpCircle,
    match: (p: string) => p.startsWith("/past-papers"),
  },
  {
    href: "/profile/me",
    label: "Profile",
    icon: CircleUser,
    match: (p: string) => p.startsWith("/profile"),
  },
];

export function BottomNav() {
  const pathname = usePathname() ?? "";

  // Hide BottomNav on immersive media pages
  if (pathname.startsWith("/videos") || pathname.startsWith("/podcasts")) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[118] flex justify-center md:hidden"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))" }}
    >
      <nav
        className={cn(
          "pointer-events-auto mx-4 mb-1 w-full max-w-[440px]",
          "rounded-[22px] border border-white/[0.05] dark:border-white/[0.02]",
          "bg-background/85 dark:bg-[#141418]/92",
          "shadow-[0_12px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_12px_48px_rgba(0,0,0,0.55)]",
          "backdrop-blur-2xl px-2 py-2"
        )}
        aria-label="Primary navigation"
      >
        <ul className="flex items-center justify-between">
          {NAV_ITEMS.map(({ href, label, icon: Icon, match }) => {
            const active = match(pathname);
            return (
              <li key={href} className="flex flex-1 justify-center">
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex min-w-0 flex-1 flex-col items-center gap-[3px]",
                    "rounded-[16px] px-1 py-2",
                    "transition-all duration-200 active:scale-[0.87]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                    "select-none"
                  )}
                >
                  {/* Active background pill */}
                  {active && (
                    <span
                      className={cn(
                        "absolute inset-0 rounded-[16px]",
                        "bg-primary/[0.09] dark:bg-primary/[0.13]",
                        "animate-in fade-in zoom-in-90 duration-200"
                      )}
                    />
                  )}

                  {/* Icon */}
                  <span
                    className={cn(
                      "relative z-10 flex items-center justify-center",
                      "transition-all duration-300",
                      active
                        ? "text-primary translate-y-[-1px]"
                        : "text-muted-foreground/55 dark:text-white/30 hover:text-foreground/75"
                    )}
                  >
                    <Icon
                      className="h-[1.1rem] w-[1.1rem]"
                      strokeWidth={active ? 2.4 : 1.75}
                      aria-hidden
                    />
                  </span>

                  {/* Label */}
                  <span
                    className={cn(
                      "relative z-10 max-w-full truncate text-center leading-none",
                      "transition-colors duration-200",
                      active
                        ? "text-[9.5px] font-bold text-primary"
                        : "text-[9px] font-medium text-muted-foreground/45 dark:text-white/25"
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

