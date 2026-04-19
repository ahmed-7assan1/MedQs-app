"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldCheck,
  LayoutDashboard,
  Settings,
  Users,
  BookOpen,
  FileText,
  MessageSquare,
  Video,
  HelpCircle,
  Layers,
  Zap,
  Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PLATFORM_COPY } from "@/lib/platform-copy";

const LINKS = [
  { href: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/settings", label: "Site settings", icon: Settings },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/content", label: "Courses", icon: BookOpen },
  { href: "/admin/lectures", label: "Lectures", icon: Video },
  { href: "/admin/past-papers", label: "Past papers / quizzes", icon: FileText },
  { href: "/admin/questions", label: "Questions", icon: HelpCircle },
  { href: "/admin/quiz-creator", label: "Quiz creator", icon: Layers },
  { href: "/admin/forum", label: "Forum", icon: MessageSquare },
  { href: "/admin/ai-tools", label: "AI tools", icon: Zap },
  { href: "/admin/ads", label: "Ads", icon: Megaphone },
];

/** Floating doctor hub menu on student pages (same routes as /admin). */
export function AdminStudentBar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  if (pathname?.startsWith("/ai-chat")) return null;

  return (
    <div className="pointer-events-none fixed bottom-24 right-4 z-[132] md:bottom-6 md:right-6">
      <div className="pointer-events-auto flex flex-col items-end gap-3">
        {open ? (
          <div
            className="mb-2 max-h-[min(70vh,440px)] w-[min(calc(100vw-2rem),15rem)] overflow-y-auto rounded-2xl border border-border/40 bg-card/95 p-2 shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-200"
            role="menu"
            aria-label={PLATFORM_COPY.doctorShortcutsMenu}
          >
            <p className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-primary/80">
              Admin Control
            </p>
            {LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-foreground hover:bg-primary/5 transition-colors"
              >
                <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                {label}
              </Link>
            ))}
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full border border-primary/30 bg-primary/90 text-primary-foreground shadow-[0_8px_30px_rgb(var(--primary-rgb)/0.2)] backdrop-blur-md transition-all hover:scale-110 active:scale-95",
            open && "rotate-45"
          )}
          aria-expanded={open}
        >
          <ShieldCheck className="h-6 w-6" aria-hidden />
        </button>
      </div>
    </div>
  );
}
