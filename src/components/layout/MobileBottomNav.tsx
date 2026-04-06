"use client";

import type { ElementType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, MessageSquare, Sparkles, User } from "lucide-react";
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
    href: "/ai-chat",
    label: "Dr. Q",
    icon: Sparkles,
    match: (p) => p.startsWith("/ai-chat"),
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
    <nav
      className="fixed bottom-0 left-0 right-0 z-[118] border-t border-border/70 bg-card/90 px-1 pt-1 shadow-[0_-6px_28px_rgb(0_0_0/0.06)] backdrop-blur-xl md:hidden dark:shadow-[0_-6px_28px_rgb(0_0_0/0.35)]"
      aria-label="Primary navigation"
      style={{ paddingBottom: "max(0.35rem, env(safe-area-inset-bottom, 0px))" }}
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between gap-0.5">
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
  );
}
