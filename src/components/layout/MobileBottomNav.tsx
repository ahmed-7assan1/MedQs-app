"use client";

import type { ElementType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { House, Books, Brain, Sparkle, ChatTeardropDots, User } from "@phosphor-icons/react/dist/ssr";
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
    match: (p: string) => p.startsWith("/modules") || p.startsWith("/videos"),
  },
  {
    href: "/past-papers",
    label: "QBank",
    icon: Brain,
    match: (p: string) => p.startsWith("/past-papers") || p.startsWith("/quiz"),
  },
  {
    href: "/ai-chat",
    label: "AI",
    icon: Sparkle,
    match: (p: string) => p.startsWith("/ai-chat") || p.startsWith("/atlas"),
  },
  {
    href: "/social",
    label: "Community",
    icon: ChatTeardropDots,
    match: (p: string) => p.startsWith("/social") || p.startsWith("/community"),
  },
  {
    href: "/profile/me",
    label: "Profile",
    icon: User,
    match: (p: string) => p.startsWith("/profile") || p.startsWith("/settings") || p.startsWith("/notifications"),
  },
];

function TabItem({ tab, pathname, idx }: { tab: TabDef; pathname: string; idx: number }) {
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
      <div className="relative flex items-center justify-center">
        <tab.icon
          weight={active ? "fill" : "regular"}
          className={cn(
            "transition-all duration-300",
            active ? "h-6 w-6" : "h-6 w-6 opacity-70"
          )}
        />
        {/* Glow dot for active tab */}
        {active && (
          <motion.div
            layoutId="navGlow"
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary"
            transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
          />
        )}
      </div>
      <span
        className={cn(
          "text-[10px] font-black tracking-wider transition-all duration-300",
          active ? "text-white opacity-100" : "text-white/50 opacity-80"
        )}
      >
        {tab.label}
      </span>
    </Link>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();

  if (isImmersiveMobileRoute(pathname)) return null;

  return (
    <nav
      className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 z-[100]",
        "pb-[env(safe-area-inset-bottom,0px)]",
        "bg-[#0C0B17]/90 backdrop-blur-3xl",
        "border-t border-white/[0.04]",
        "shadow-[0_-12px_40px_rgba(0,0,0,0.3)]"
      )}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {TABS.map((tab, idx) => (
          <TabItem key={tab.href} tab={tab} pathname={pathname} idx={idx} />
        ))}
      </div>
    </nav>
  );
}
