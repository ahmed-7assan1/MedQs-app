"use client";

import type { ElementType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  HelpCircle,
  Layers,
  Zap,
  MessageSquare,
  Users,
  Settings,
  Megaphone,
  Video,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

const adminLinks: { href: string; label: string; icon: ElementType }[] = [
  { href: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/content", label: "Courses", icon: BookOpen },
  { href: "/admin/lectures", label: "Lectures", icon: Video },
  { href: "/admin/past-papers", label: "Past Papers", icon: FileText },
  { href: "/admin/questions", label: "Questions", icon: HelpCircle },
  { href: "/admin/quiz-creator", label: "Quiz Creator", icon: Layers },
  { href: "/admin/ai-tools", label: "AI Tools", icon: Zap },
  { href: "/admin/forum", label: "Community", icon: MessageSquare },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/ads", label: "Ads", icon: Megaphone },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin/dashboard") {
    return pathname === href || pathname === "/admin";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebarNav() {
  const pathname = usePathname() ?? "";

  return (
    <>
      {adminLinks.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm transition-colors",
              active
                ? "bg-primary font-medium text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
            {label}
          </Link>
        );
      })}
    </>
  );
}
