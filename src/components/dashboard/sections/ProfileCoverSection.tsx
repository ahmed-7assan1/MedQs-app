"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { Sun, Moon } from "lucide-react";
import { useThemeStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { BannerCarousel } from "@/components/ads/BannerCarousel";
import { NAV_ITEMS } from "@/components/layout/FloatingIslandNavbar";
import type { DashboardData } from "@/types/dashboard";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ProfileCoverSection({ data, hasAds }: { data: DashboardData; hasAds: boolean }) {
  const pathname = usePathname();
  const { theme, setTheme } = useThemeStore();
  const isDark = theme === "dark";
  const toggleTheme = () => setTheme(isDark ? "light" : "dark");
  const initials = getInitials(data.firstName);
  const showImage = !!data.userImage;

  const avatar = (
    <Avatar className="h-[100px] w-[100px] md:h-[120px] md:w-[120px] lg:h-40 lg:w-40 border-4 border-background shadow-xl">
      {showImage ? (
        <AvatarImage src={data.userImage!} alt={data.firstName} className="object-cover" />
      ) : (
        <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-3xl md:text-4xl lg:text-5xl font-black">
          {initials}
        </AvatarFallback>
      )}
    </Avatar>
  );

  return (
    <div className="relative">
      {hasAds && data.ads ? (
        <BannerCarousel ads={data.ads} />
      ) : (
        <div className="w-full h-[180px] md:h-[220px] lg:h-[280px] rounded-t-2xl bg-gradient-to-br from-primary/30 via-accent/20 to-background" />
      )}

      {/* Theme toggle — top-right corner */}
      <Button
        variant="outline"
        size="sm"
        onClick={toggleTheme}
        className="absolute top-3 right-3 md:top-4 md:right-4 lg:top-5 lg:right-6 z-30 w-8 h-8 md:w-9 md:h-9 rounded-xl bg-background/30 backdrop-blur-md border-border/30 shadow-sm"
        title={isDark ? "Light Mode" : "Dark Mode"}
      >
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>

      {/* Nav strip — gradient fades from opaque bottom → transparent up */}
      <div className="absolute bottom-0 inset-x-0 z-20 bg-gradient-to-t from-background/95 via-background/50 via-50% to-transparent pt-10 md:pt-14 lg:pt-16">
        <div className="flex items-end justify-end overflow-x-auto scrollbar-none [-webkit-scrollbar]:hidden px-3 pb-2 md:px-4 md:pb-2.5 gap-0.5 md:gap-1">
          {useMemo(() => NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1 md:gap-1.5 px-2 py-1.5 md:px-2.5 md:py-2 rounded-lg text-[10px] md:text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors shrink-0",
                  active
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                    : "text-foreground hover:bg-foreground/10 hover:text-foreground"
                )}
              >
                <Icon className="h-3 w-3 md:h-3.5 md:w-3.5 shrink-0" />
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            );
          }), [pathname])}
        </div>
      </div>

      {/* Avatar — overlaps the bottom edge, above the nav bar */}
      <div className="absolute bottom-0 left-8 md:left-12 lg:left-16 z-30 translate-y-[45%]">
        {avatar}
      </div>
    </div>
  );
}
