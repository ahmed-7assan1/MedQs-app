"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  BookOpenIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/solid";
import { cn } from "@/lib/utils";
import { isImmersiveMobileRoute } from "@/lib/mobile-chrome";
import { useCommunityStore } from "@/components/community-mobile/store";

interface TabDef {
  href: string;
  label: string;
  icon: typeof HomeIcon;
  match: (p: string) => boolean;
}

const TABS: TabDef[] = [
  {
    href: "/dashboard-app",
    label: "Home",
    icon: HomeIcon,
    match: (p: string) => p === "/dashboard-app" || p === "/dashboard",
  },
  {
    href: "/modules",
    label: "Modules",
    icon: BookOpenIcon,
    match: (p: string) => p.startsWith("/modules"),
  },
  {
    href: "/community",
    label: "Social",
    icon: UserGroupIcon,
    match: (p: string) => p.startsWith("/community") || p === "/social",
  },
  {
    href: "/past-papers",
    label: "QBank",
    icon: ClipboardDocumentListIcon,
    match: (p: string) => p.startsWith("/past-papers") || p.startsWith("/quiz"),
  },
];

function TabItem({ tab, pathname }: { tab: TabDef; pathname: string }) {
  const active = tab.match(pathname);
  const Icon = tab.icon;

  return (
    <Link
      href={tab.href}
      className={cn(
        "relative flex flex-col items-center justify-center gap-0.5",
        "h-full flex-1 min-h-[48px] min-w-[44px] transition-all duration-200",
        "active:scale-90"
      )}
    >
      <Icon
        className={cn(
          "h-6 w-6 transition-colors duration-200",
          active
            ? "text-primary dark:text-primary"
            : "text-gray-400 dark:text-white/40"
        )}
      />
      <span
        className={cn(
          "text-[10px] font-semibold tracking-wide transition-colors duration-200",
          active
            ? "text-primary dark:text-primary"
            : "text-gray-400 dark:text-white/35"
        )}
      >
        {tab.label}
      </span>
    </Link>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const isComposerOpen = useCommunityStore((s) => s.isComposerOpen);

  useEffect(() => {
    const SCROLL_THRESHOLD = 8;
    const BOTTOM_THRESHOLD = 50;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const diff = currentScrollY - lastScrollY.current;

      // At bottom of page → always show
      const scrollBottom = window.innerHeight + window.scrollY;
      const docHeight = document.documentElement.scrollHeight;
      if (docHeight - scrollBottom < BOTTOM_THRESHOLD) {
        setVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      if (Math.abs(diff) < SCROLL_THRESHOLD) {
        lastScrollY.current = currentScrollY;
        return;
      }

      if (diff > 0 && currentScrollY > 60) {
        setVisible(false);
      } else if (diff < 0) {
        setVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (isImmersiveMobileRoute(pathname)) return null;

  return (
    <div
      className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 z-[10000]",
        isComposerOpen 
          ? "bg-background/80 backdrop-blur-xl pb-[env(safe-area-inset-bottom,0px)]" 
          : "bg-gradient-to-t from-background via-background/60 to-transparent backdrop-blur-3xl saturate-[1.8] rounded-t-2xl border-t border-gray-200/50 dark:border-white/[0.05] shadow-[0_-8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_-8px_32px_rgba(0,0,0,0.4)] pb-[env(safe-area-inset-bottom,0px)]",
        "transition-transform duration-300 will-change-transform",
        (visible || isComposerOpen) ? "translate-y-0" : "translate-y-full"
      )}
    >
      <div className="flex items-center justify-around h-[62px] px-1">
        {TABS.map((tab) => (
          <TabItem key={tab.href} tab={tab} pathname={pathname} />
        ))}
      </div>
    </div>
  );
}
