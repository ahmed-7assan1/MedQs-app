"use client";

import React from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
  Book,
  Video,
  HelpCircle,
  Target,
  MessageCircle,
  Users,
  DoorOpen,
  BrainCircuit,
  Search,
  Pen,
  Mic,
  LayoutDashboard,
  Clock,
  Award,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SiteSection {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  iconBg: string;
}

const CATEGORIES: { label: string; icon: React.ComponentType<{ className?: string }>; color: string; sections: SiteSection[] }[] = [
  {
    label: "Learn",
    icon: GraduationCap,
    color: "text-blue-500",
    sections: [
      { label: "Lectures", href: "/modules", icon: Book, gradient: "from-sky-500/20 via-sky-500/5 to-transparent", iconBg: "bg-sky-500/15 text-sky-500" },
      { label: "Videos", href: "/videos", icon: Video, gradient: "from-blue-500/20 via-blue-500/5 to-transparent", iconBg: "bg-blue-500/15 text-blue-500" },
      { label: "Quizzes", href: "/past-papers", icon: HelpCircle, gradient: "from-emerald-500/20 via-emerald-500/5 to-transparent", iconBg: "bg-emerald-500/15 text-emerald-500" },
      { label: "Flashcards", href: "/study-tools/flashcards-from-text", icon: Target, gradient: "from-amber-500/20 via-amber-500/5 to-transparent", iconBg: "bg-amber-500/15 text-amber-500" },
    ],
  },
  {
    label: "Social",
    icon: MessageCircle,
    color: "text-rose-500",
    sections: [
      { label: "Community", href: "/social", icon: MessageCircle, gradient: "from-rose-500/20 via-rose-500/5 to-transparent", iconBg: "bg-rose-500/15 text-rose-500" },
      { label: "Teams", href: "/teams", icon: Users, gradient: "from-indigo-500/20 via-indigo-500/5 to-transparent", iconBg: "bg-indigo-500/15 text-indigo-500" },
      { label: "Rooms", href: "/community", icon: DoorOpen, gradient: "from-violet-500/20 via-violet-500/5 to-transparent", iconBg: "bg-violet-500/15 text-violet-500" },
    ],
  },
  {
    label: "Tools",
    icon: BrainCircuit,
    color: "text-primary",
    sections: [
      { label: "AI Chat", href: "/ai-chat", icon: BrainCircuit, gradient: "from-primary/20 via-primary/5 to-transparent", iconBg: "bg-primary/15 text-primary" },
      { label: "Medical Library", href: "/medical-books", icon: Search, gradient: "from-violet-500/20 via-violet-500/5 to-transparent", iconBg: "bg-violet-500/15 text-violet-500" },
      { label: "DrawMed", href: "/drawmed", icon: Pen, gradient: "from-cyan-500/20 via-cyan-500/5 to-transparent", iconBg: "bg-cyan-500/15 text-cyan-500" },
      { label: "Podcasts", href: "/podcasts", icon: Mic, gradient: "from-purple-500/20 via-purple-500/5 to-transparent", iconBg: "bg-purple-500/15 text-purple-500" },
    ],
  },
  {
    label: "Progress",
    icon: Award,
    color: "text-emerald-500",
    sections: [
      { label: "Dashboard", href: "/dashboard-app", icon: LayoutDashboard, gradient: "from-emerald-500/20 via-emerald-500/5 to-transparent", iconBg: "bg-emerald-500/15 text-emerald-500" },
      { label: "Tasks", href: "/taskat", icon: Clock, gradient: "from-orange-500/20 via-orange-500/5 to-transparent", iconBg: "bg-orange-500/15 text-orange-500" },
    ],
  },
];

function SiteSectionsModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "gap-0 p-0 border-border/40 bg-background",
        "max-w-2xl w-full",
        "max-sm:h-full max-sm:max-h-full max-sm:rounded-none sm:max-h-[85vh]",
      )}>
        <VisuallyHidden>
          <DialogTitle>Explore MedOneX</DialogTitle>
          <DialogDescription>Navigate to all site sections</DialogDescription>
        </VisuallyHidden>

        <div className="flex items-center justify-between px-5 pt-5 pb-2 border-b border-border/20">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4 text-primary" />
            <span className="text-sm font-black text-foreground">Explore MedOneX</span>
          </div>
        </div>

        <div className="overflow-y-auto p-5 space-y-5">
          {CATEGORIES.map((cat) => {
            const CatIcon = cat.icon;
            return (
              <div key={cat.label}>
                <div className="flex items-center gap-1.5 mb-2.5">
                  <CatIcon className={cn("h-3.5 w-3.5", cat.color)} />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">{cat.label}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {cat.sections.map((section) => {
                    const SectionIcon = section.icon;
                    return (
                      <Link
                        key={section.label}
                        href={section.href}
                        onClick={() => onOpenChange(false)}
                        className="group relative flex items-center gap-2.5 p-2.5 rounded-xl border border-border/30 bg-card/40 hover:bg-card/80 hover:border-border/60 transition-all hover:-translate-y-0.5 hover:shadow-sm"
                      >
                        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className={cn(
                          "relative flex items-center justify-center w-7 h-7 rounded-lg transition-transform duration-200 group-hover:scale-110",
                          section.iconBg
                        )}>
                          <SectionIcon className="h-3.5 w-3.5" />
                        </div>
                        <span className="relative text-[11px] font-semibold text-foreground group-hover:text-primary transition-colors duration-200 leading-tight">
                          {section.label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function SiteSectionsTrigger({ className }: { className?: string }) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "flex items-center justify-center h-9 w-9 rounded-xl border border-border/40 bg-card/60 text-muted-foreground/50 hover:text-muted-foreground/70 hover:bg-card/80 hover:border-border/60 transition-all shrink-0",
          className
        )}
      >
        <LayoutDashboard className="h-4 w-4" />
      </button>
      <SiteSectionsModal open={open} onOpenChange={setOpen} />
    </>
  );
}
