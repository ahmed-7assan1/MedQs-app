"use client";

import Link from "next/link";
import {
  BookOpen, Video, HelpCircle, MessageCircle, Trophy,
  Sparkles, Clock, Mic, Target, Pen, BookMarked, User,
} from "lucide-react";
import { SectionHeader } from "@/components/dashboard/shared/SectionHeader";

const links = [
  { icon: BookOpen, label: "Lectures", href: "/modules" },
  { icon: Video, label: "Videos", href: "/videos" },
  { icon: HelpCircle, label: "Quizzes", href: "/past-papers" },
  { icon: MessageCircle, label: "Community", href: "/social" },
  { icon: Trophy, label: "Leaderboard", href: "/leaderboard" },
  { icon: Sparkles, label: "AI Chat", href: "/ai-chat" },
  { icon: Clock, label: "Tasks", href: "/taskat" },
  { icon: Mic, label: "Podcasts", href: "/podcasts" },
  { icon: Target, label: "Flashcards", href: "/study-tools/flashcards-from-text" },
  { icon: Pen, label: "DrawMed", href: "/drawmed" },
  { icon: BookMarked, label: "Library", href: "/medical-books" },
  { icon: User, label: "Profile", href: "/profile/me" },
];

export function QuickAccessLinks() {
  return (
    <div>
      <SectionHeader icon={Target} title="Quick Access" />
      <div className="grid grid-cols-4 gap-1">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex flex-col items-center gap-1 p-1.5 rounded-lg hover:bg-muted/30 transition-all group"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/15 group-hover:scale-105 transition-all">
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-[8px] font-bold text-muted-foreground/70 text-center leading-tight group-hover:text-foreground transition-colors">
                {link.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
