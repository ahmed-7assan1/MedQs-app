"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sun, Moon } from "lucide-react";
import { useThemeStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { BannerCarousel } from "@/components/ads/BannerCarousel";
import { NAV_ITEMS } from "@/components/layout/FloatingIslandNavbar";
import { useDominantColor } from "@/hooks/use-dominant-color";
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

  const bannerImageUrl = hasAds && data.ads?.[0]?.imageUrl || null;
  const dominantColor = useDominantColor(bannerImageUrl);

  const avatar = (
    <div className="relative h-[100px] w-[100px] md:h-[120px] md:w-[120px] lg:h-40 lg:w-40 rounded-full border-4 border-background shadow-xl">
      {showImage ? (
        <Image
          src={data.userImage!}
          alt={data.firstName}
          fill
          priority
          sizes="(max-width: 768px) 100px, (max-width: 1024px) 120px, 160px"
          quality={95}
          className="rounded-full object-cover"
        />
      ) : (
        <div className="h-full w-full rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground text-3xl md:text-4xl lg:text-5xl font-black">
          {initials}
        </div>
      )}
    </div>
  );

  return (
    <div className="relative">
      {hasAds && data.ads ? (
        <BannerCarousel ads={data.ads} />
      ) : (
        <div className="w-full h-[180px] md:h-[220px] lg:h-[280px] rounded-t-2xl bg-gradient-to-br from-primary/30 via-accent/20 to-background" />
      )}

      {/* Dynamic glow behind content */}
      <div
        className="pointer-events-none absolute z-0 transition-all duration-1000"
        style={{
          top: "60%",
          insetInline: "5%",
          height: "40%",
          background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${dominantColor === "transparent" ? "transparent" : dominantColor.replace("rgb", "rgba").replace(")", ",0.35)")} 0%, transparent 70%)`,
          opacity: dominantColor === "transparent" ? 0 : 1,
        }}
      />

      {/* Theme toggle — top-right corner */}
      <button
        onClick={toggleTheme}
        className="absolute top-3 right-3 md:top-4 md:right-4 lg:top-5 lg:right-6 z-30 w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center bg-background/30 backdrop-blur-md border border-border/30 text-foreground/80 hover:bg-background/50 hover:text-foreground transition-all shadow-sm"
        title={isDark ? "Light Mode" : "Dark Mode"}
      >
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      {/* Nav strip — gradient fades from opaque bottom → transparent up */}
      <div className="absolute bottom-0 inset-x-0 z-20 bg-gradient-to-t from-background/95 via-background/50 via-50% to-transparent pt-10 md:pt-14 lg:pt-16">
        <div className="flex items-end justify-end overflow-x-auto scrollbar-none [-webkit-scrollbar]:hidden px-3 pb-2 md:px-4 md:pb-2.5 gap-0.5 md:gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1 md:gap-1.5 px-2 py-1.5 md:px-2.5 md:py-2 rounded-lg text-[10px] md:text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-all shrink-0",
                  active
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                    : "text-foreground/80 hover:bg-foreground/10 hover:text-foreground"
                )}
              >
                <Icon className="h-3 w-3 md:h-3.5 md:w-3.5 shrink-0" />
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Avatar — overlaps the bottom edge, above the nav bar */}
      <div className="absolute bottom-0 left-8 md:left-12 lg:left-16 z-30 translate-y-[45%]">
        {avatar}
      </div>
    </div>
  );
}
