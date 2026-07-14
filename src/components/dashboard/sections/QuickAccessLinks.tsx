import Link from "next/link";
import {
  BookOpen, Video, HelpCircle, MessageCircle, Trophy,
  Sparkles, Clock, Mic, Target, Pen, BookMarked, User,
} from "lucide-react";
import { SidebarLabel } from "@/components/dashboard/shared/SidebarLabel";

const links = [
  { icon: BookOpen, label: "Lectures", href: "/modules" },
  { icon: Video, label: "Videos", href: "/videos" },
  { icon: HelpCircle, label: "Quizzes", href: "/past-papers" },
  { icon: MessageCircle, label: "Social", href: "/social" },
  { icon: Trophy, label: "Ranks", href: "/leaderboard" },
  { icon: Sparkles, label: "AI Tutor", href: "/ai-chat" },
  { icon: Clock, label: "Tasks", href: "/taskat" },
  { icon: Mic, label: "Podcasts", href: "/podcasts" },
  { icon: Target, label: "Cards", href: "/study-tools/flashcards-from-text" },
  { icon: Pen, label: "DrawMed", href: "/drawmed" },
  { icon: BookMarked, label: "Library", href: "/medical-books" },
  { icon: User, label: "Profile", href: "/profile/me" },
];

export function QuickAccessLinks() {
  return (
    <div className="space-y-3">
      <SidebarLabel icon={Target} label="Quick Access" />
      
      <div className="grid grid-cols-3 gap-1.5">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-border/30 bg-card/45 backdrop-blur-sm hover:border-primary/20 hover:bg-card/65 transition-[transform,opacity,border-color,background-color] duration-200 group text-center"
            >
              <Icon className="h-4.5 w-4.5 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
              <span className="text-[9px] font-black text-muted-foreground/60 group-hover:text-foreground mt-1.5 block truncate leading-none w-full">
                {link.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
