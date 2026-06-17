// src/components/community-mobile/BottomNav.tsx
"use client";

import { usePathname, useRouter } from "next/navigation";
import { Home, Compass, Plus, Bell, User } from "lucide-react";

import { useCommunityStore } from "./store";

interface BottomNavProps {
  unreadNotificationCount?: number;
}

export default function BottomNav({ unreadNotificationCount = 0 }: BottomNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const openComposer = useCommunityStore((s) => s.openComposer);

  const tabs = [
    { id: "home", icon: Home, href: "/social", label: "Home" },
    { id: "explore", icon: Compass, href: "/social/explore", label: "Explore" },
    { id: "create", icon: Plus, href: null, label: "Create" },
    { id: "notifications", icon: Bell, href: "/social/notifications", label: "Notifications" },
    { id: "profile", icon: User, href: "/social/profile", label: "Profile" },
  ] as const;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/80 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        {tabs.map((tab) => {
          const isActive = tab.href ? pathname === tab.href : false;
          const Icon = tab.icon;

          if (tab.id === "create") {
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => openComposer()}
                className="flex flex-1 items-center justify-center"
                aria-label="Create post"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform active:scale-95">
                  <Icon className="h-5 w-5" strokeWidth={1.5} />
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => tab.href && router.push(tab.href)}
              className="relative flex flex-1 flex-col items-center gap-0.5 py-1.5"
              aria-label={tab.label}
            >
              <Icon
                className={`h-5 w-5 ${isActive ? "text-primary" : "text-muted-foreground"}`}
                strokeWidth={1.5}
                fill={isActive ? "currentColor" : "none"}
              />
              {tab.id === "notifications" && unreadNotificationCount > 0 && (
                <span className="absolute right-[28%] top-0.5 h-2 w-2 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
