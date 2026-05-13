"use client";

import type { ElementType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, BookOpen, HelpCircle, Layers, Zap,
  MessageSquare, Users, Settings, Megaphone, Video, Youtube,
  FileText, GraduationCap, Copy, Library, ArrowRightLeft, Sparkles, Wand2
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_GROUPS: {
  label: string;
  items: { href: string; label: string; icon: ElementType; badge?: string }[];
}[] = [
  {
    label: "Overview",
    items: [
      { href: "/admin/dashboard",  label: "Dashboard",     icon: LayoutDashboard },
    ],
  },
  {
    label: "Academy Hub",
    items: [
      { href: "/admin/content",    label: "Academy Hub",    icon: BookOpen },
      { href: "/admin/channels",   label: "Channels Hub",      icon: Youtube },
    ],
  },
  {
    label: "Assessment",
    items: [
      { href: "/admin/questions",    label: "Assessment Hub",    icon: HelpCircle },
    ],
  },
  {
    label: "AI Studio",
    items: [
      { href: "/admin/ai-studio",    label: "AI Studio",     icon: Zap, badge: "NEW" },
      { href: "/admin/pdf-tools",    label: "PDF Tools",    icon: FileText },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/admin/users",      label: "Users",      icon: Users },
      { href: "/admin/teams",      label: "Teams",      icon: Users },
      { href: "/admin/founders",   label: "Founders",   icon: GraduationCap },
      { href: "/admin/forum",      label: "Community",  icon: MessageSquare },
      { href: "/admin/ads",        label: "Ads",        icon: Megaphone },
      { href: "/admin/settings",   label: "Settings", icon: Settings },
      { href: "/admin/audit-logs", label: "Audit Logs", icon: Copy, badge: "SEC" },
      { href: "/admin/telegram",   label: "Telegram Bot", icon: MessageSquare },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin/dashboard") return pathname === href || pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebarNav() {
  const pathname = usePathname() ?? "";

  return (
    <div className="space-y-4">
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            {group.label}
          </p>
          <div className="space-y-0.5">
            {group.items.map(({ href, label, icon: Icon, badge }) => {
              const active = isActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm transition-all duration-150",
                    active
                      ? "bg-gradient-to-r from-blue-600/20 to-indigo-600/10 font-semibold text-blue-500 dark:text-blue-400 shadow-[inset_0_0_0_1px_rgba(37,99,235,0.1)]"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon
                    className={cn("h-4 w-4 shrink-0", active ? "text-blue-500 dark:text-blue-400" : "opacity-70")}
                    aria-hidden
                  />
                  <span className="flex-1 leading-none">{label}</span>
                  {badge && (
                    <span className="rounded-full bg-violet-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-violet-500">
                      {badge}
                    </span>
                  )}
                  {active && (
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(37,99,235,0.8)]" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
