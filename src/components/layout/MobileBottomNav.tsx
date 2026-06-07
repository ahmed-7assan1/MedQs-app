"use client";

import type { ElementType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  House, Books, Brain, Sparkle, User,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import { isImmersiveMobileRoute } from "@/lib/mobile-chrome";

interface TabDef {
  href: string;
  label: string;
  icon: ElementType;
  match: (p: string) => boolean;
}

const TABS: TabDef[] = [
  {
    href: "/dashboard-app",
    label: "Home",
    icon: House,
    match: (p: string) => p === "/dashboard-app" || p === "/dashboard",
  },
  {
    href: "/modules",
    label: "Learn",
    icon: Books,
    match: (p: string) => p.startsWith("/modules") || p.startsWith("/videos") || p.startsWith("/study-tools"),
  },
  {
    href: "/ai-chat",
    label: "Dr. Q",
    icon: Sparkle,
    match: (p: string) => p.startsWith("/ai-chat") || p.startsWith("/atlas"),
  },
  {
    href: "/past-papers",
    label: "QBank",
    icon: Brain,
    match: (p: string) => p.startsWith("/past-papers") || p.startsWith("/quiz"),
  },
  {
    href: "/profile/me",
    label: "Profile",
    icon: User,
    match: (p: string) => p.startsWith("/profile") || p.startsWith("/settings") || p.startsWith("/notifications"),
  },
];

function TabItem({ tab, pathname }: { tab: TabDef; pathname: string }) {
  const active = tab.match(pathname);

  return (
    <Link
      href={tab.href}
      className={cn(
        "relative flex flex-col items-center justify-center gap-0.5",
        "h-full flex-1 min-h-[48px] min-w-[44px] transition-all duration-300",
        "active:scale-90"
      )}
    >
      <div className="relative flex items-center justify-center h-6 w-6">
        <tab.icon
          weight={active ? "fill" : "regular"}
          className={cn(
            "transition-all duration-300",
            active ? "h-5 w-5" : "h-5 w-5"
          )}
        />
      </div>
      <span
        className={cn(
          "text-[9px] font-black tracking-wider transition-all duration-300",
          active ? "text-white" : "text-white/35"
        )}
      >
        {tab.label}
      </span>
      {active && (
        <motion.div
          layoutId="blogNavDot"
          className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-0.5 w-5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
          transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
        />
      )}
    </Link>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();

  if (isImmersiveMobileRoute(pathname)) return null;

  return (
    <div
      className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 z-[100] pointer-events-none",
        "pb-[env(safe-area-inset-bottom,0px)]"
      )}
    >
      <nav
        className={cn(
          "pointer-events-auto mx-4 mb-3 rounded-2xl",
          "bg-[#0d0d14]/85 backdrop-blur-2xl",
          "border border-white/[0.06]",
          "shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
        )}
      >
        <div className="flex items-center justify-around h-[60px] px-1 relative">
          {TABS.map((tab) => (
            <TabItem key={tab.href} tab={tab} pathname={pathname} />
          ))}
        </div>
      </nav>
    </div>
  );
}
