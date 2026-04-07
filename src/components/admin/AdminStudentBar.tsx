"use client";

import { useState } from "react";
import Link from "next/link";
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

  return (
    <div className="pointer-events-none fixed bottom-0 right-0 z-[132] p-4 max-md:bottom-[calc(5.85rem+env(safe-area-inset-bottom,0px))] md:p-6">
      <div className="pointer-events-auto flex flex-col items-end gap-2">
        {open ? (
          <div
            className="mb-1 max-h-[min(70vh,440px)] w-[min(calc(100vw-2rem),15rem)] overflow-y-auto rounded-xl border border-border bg-card/95 p-2 shadow-xl backdrop-blur-md"
            role="menu"
            aria-label={PLATFORM_COPY.doctorShortcutsMenu}
          >
            <p className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {PLATFORM_COPY.doctorHub}
            </p>
            <p className="px-2 pb-1.5 text-[10px] text-muted-foreground/90">
              {PLATFORM_COPY.doctorShortcutsSubtitle}
            </p>
            {LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-foreground hover:bg-muted"
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
            "flex items-center gap-2 rounded-full border border-primary/20 bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg transition hover:bg-primary/90",
            open && "ring-2 ring-ring"
          )}
          aria-expanded={open}
        >
          <ShieldCheck className="h-4 w-4" aria-hidden />
          {PLATFORM_COPY.floatingDoctorButton}
        </button>
      </div>
    </div>
  );
}
