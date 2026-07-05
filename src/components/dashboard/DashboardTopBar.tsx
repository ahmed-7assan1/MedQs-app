"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSiteConfig } from "@/contexts/SiteConfigContext";
import { MedOneXLogoMark } from "@/components/branding/MedQsLogo";
import { useThemeStore } from "@/lib/store";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
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

export function DashboardTopBar({ data }: { data: DashboardData }) {
  const pathname = usePathname();
  const { siteName } = useSiteConfig();
  const { theme, setTheme } = useThemeStore();
  const initials = getInitials(data.firstName);
  const showImage = !!data.userImage;

  return (
    <div className="mb-6 md:mb-8">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 md:px-6 lg:px-10 pt-4 md:pt-6 lg:pt-8">
        <div className="flex items-center justify-between rounded-2xl border border-border/40 bg-background/80 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] supports-[backdrop-filter]:bg-background/60 px-4 md:px-5 py-2.5 gap-2">
          {/* Left: Logo + Name */}
          <Link href="/dashboard-app" className="flex items-center gap-2 shrink-0">
            <MedOneXLogoMark className="h-7 w-7 md:h-8 md:w-8 shrink-0 text-[#13171E] dark:text-white" interactiveColor />
            <div className="hidden sm:flex items-center gap-2">
              <div className="h-5 w-px bg-border" />
              <span className="text-sm md:text-[15px] font-bold tracking-tight text-foreground">{siteName}</span>
            </div>
          </Link>

          {/* Center: Nav Items */}
          <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-none [-webkit-scrollbar]:hidden flex-1 justify-center px-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname?.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1 md:gap-1.5 px-2 py-1.5 md:px-3 md:py-2 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors shrink-0",
                    active
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  )}
                >
                  <Icon className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0" />
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right: Theme toggle + Profile */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="grid h-8 w-8 shrink-0 place-items-center text-muted-foreground rounded-xl border border-border bg-card hover:text-foreground hover:shadow-sm transition-all"
              title="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link href="/profile/edit">
              <Avatar className="h-8 w-8 border-2 border-border hover:border-primary transition-colors cursor-pointer">
                {showImage ? (
                  <AvatarImage src={data.userImage!} alt={data.firstName} className="object-cover" />
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-xs font-black">
                    {initials}
                  </AvatarFallback>
                )}
              </Avatar>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
