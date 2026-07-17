"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, BookOpen, Video, Mic, HelpCircle, MessageCircle,
  Clock, Users, Pen, Sparkles, Sun, Moon, Settings, Bell, PanelLeftClose,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSiteConfig } from "@/contexts/SiteConfigContext";
import { MedOneXLogoMark } from "@/components/branding/MedQsLogo";
import { useThemeStore } from "@/lib/store";
import { useSidebar } from "@/contexts/SidebarContext";

const NAV_ITEMS = [
  { href: "/dashboard-app", label: "Home", icon: Home },
  { href: "/modules", label: "Lectures", icon: BookOpen },
  { href: "/videos", label: "Videos", icon: Video },
  { href: "/podcasts", label: "Podcasts", icon: Mic },
  { href: "/past-papers", label: "Quizzes", icon: HelpCircle },
  { href: "/social", label: "Community", icon: MessageCircle },
  { href: "/taskat", label: "Tasks", icon: Clock },
  { href: "/teams", label: "Teams", icon: Users },
  { href: "/drawmed", label: "DrawMed", icon: Pen },
  { href: "/ai-chat", label: "AI Chat", icon: Sparkles, glow: true },
];

interface ModulesSidebarProps {
  userName?: string | null;
  userImage?: string | null;
  userId?: string;
}

export default function ModulesSidebar({ userName, userImage, userId }: ModulesSidebarProps) {
  const pathname = usePathname();
  const { siteName } = useSiteConfig();
  const { theme, setTheme } = useThemeStore();
  const { isOpen, close, isCollapsed, setCollapsed } = useSidebar();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleScroll = useCallback(() => {
    if (window.scrollY > 50 && isOpen && !isCollapsed) {
      setCollapsed(true);
    }
  }, [isOpen, isCollapsed, setCollapsed]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  const initial = userName?.[0]?.toUpperCase() ?? "U";

  return (
    <aside
      className={cn(
        "fixed left-2 top-2 z-max hidden flex-col rounded-2xl shadow-lg transition-all duration-500 ease-in-out lg:flex h-[calc(100vh-16px)] bg-card dark:bg-[#0a0b10] overflow-x-hidden",
        isOpen ? "translate-x-0" : "-translate-x-full",
        isCollapsed ? "w-16" : "w-60"
      )}
    >
      {/* ── Brand ── */}
      <div className={cn(
        "flex shrink-0 items-center border-b border-border/60 h-14",
        isCollapsed ? "justify-center px-0" : "justify-between px-4"
      )}>
        <Link href="/dashboard-app" className="flex items-center gap-2.5">
          <MedOneXLogoMark className="h-6 w-6 shrink-0 text-[#13171E] dark:text-white" interactiveColor />
          {!isCollapsed && <span className="text-sm font-bold text-foreground">{siteName}</span>}
        </Link>
        {!isCollapsed && (
          <button
            onClick={close}
            className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto px-3 pb-2">
        <div className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center rounded-xl text-sm font-medium transition-all",
                  isCollapsed ? "justify-center py-2.5" : "gap-3 px-3 py-2.5",
                  active
                    ? "bg-gradient-to-r from-primary/10 to-transparent text-primary ring-1 ring-primary/20"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={cn("h-4 w-4 shrink-0", item.glow && !active && "text-primary")} />
                {!isCollapsed && <span>{item.label}</span>}
                {!isCollapsed && active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_6px_rgba(37,99,235,0.8)]" />}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── Bottom bar ── */}
      <div className="flex flex-col border-t border-border/60 px-3 py-2 gap-1 shrink-0">
        <button
          onClick={toggleTheme}
          className={cn(
            "flex items-center gap-3 rounded-xl text-sm font-medium transition-all",
            isCollapsed ? "justify-center h-9 w-9" : "px-3 py-2.5",
            "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          )}
          title={theme === "dark" ? "Light mode" : "Dark mode"}
        >
          {mounted && (theme === "dark" ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />)}
          {!isCollapsed && <span>{theme === "dark" ? "Light" : "Dark"}</span>}
        </button>

        {userId && (
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-3 rounded-xl text-sm font-medium transition-all",
              isCollapsed ? "justify-center h-9 w-9" : "px-3 py-2.5",
              "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            )}
          >
            <Settings className="h-4 w-4 shrink-0" />
            {!isCollapsed && <span>Settings</span>}
          </Link>
        )}
      </div>
    </aside>
  );
}
