"use client";

import type { ElementType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, MessageSquare, User } from "lucide-react";
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
    icon: LayoutDashboard,
    match: (p) => p === "/dashboard-app" || p === "/dashboard",
  },
  {
    href: "/modules",
    label: "Lectures",
    icon: BookOpen,
    match: (p) => p.startsWith("/modules"),
  },
  {
    href: "/forum",
    label: "Community",
    icon: MessageSquare,
    match: (p) => p.startsWith("/forum"),
  },
  {
    href: "/profile/me",
    label: "Profile",
    icon: User,
    match: (p) => p.startsWith("/profile"),
  },
];

/**
 * Primary routes on small screens — matches app-style bottom bars (clarity + logical flow).
 */
export function MobileBottomNav() {
  const pathname = usePathname() ?? "";

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[118] flex justify-center md:hidden"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom, 0px))" }}
    >
    <nav
      className="pointer-events-auto mx-3 mb-2 w-full max-w-md rounded-[2rem] border border-border/80 bg-card/95 px-1.5 py-1.5 shadow-[0_8px_32px_rgb(0_0_0/0.12),0_2px_8px_rgb(0_0_0/0.06)] backdrop-blur-xl dark:border-border/60 dark:bg-card/92 dark:shadow-[0_8px_36px_rgb(0_0_0/0.45)]"
      aria-label="Primary navigation"
    >
      <ul className="flex items-stretch justify-between gap-0.5">
        {TABS.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={href} className="flex min-w-0 flex-1 justify-center">
              <Link
                href={href}
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-semibold transition-[color,transform] duration-150 active:scale-[0.96]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
                aria-current={active ? "page" : undefined}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors",
                    active ? "bg-primary/12 text-primary" : "bg-transparent"
                  )}
                >
                  <Icon className="h-[1.125rem] w-[1.125rem]" strokeWidth={active ? 2.35 : 2} aria-hidden />
                </span>
                <span className="max-w-full truncate leading-none">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
    </div>
  );
}
