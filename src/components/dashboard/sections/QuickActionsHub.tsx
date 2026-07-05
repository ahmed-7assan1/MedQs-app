"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Zap, Sparkles, BrainCircuit, BookOpen, Search, Target, Users, PlayCircle, Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeader } from "@/components/dashboard/shared/SectionHeader";

interface QuickAction {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  desc: string;
  href: string;
  gradient: string;
  iconBg: string;
  size?: "primary" | "secondary";
}

const PRIMARY_ACTIONS: QuickAction[] = [
  { label: "Ask Dr. Q", icon: BrainCircuit, desc: "AI-powered medical assistant", href: "/ai-chat", gradient: "from-primary/20 via-primary/10 to-transparent", iconBg: "bg-primary text-primary-foreground" },
  { label: "Generate Quiz", icon: Zap, desc: "Test your knowledge instantly", href: "/quiz", gradient: "from-emerald-500/20 via-emerald-500/5 to-transparent", iconBg: "bg-emerald-500 text-white" },
  { label: "Explain Concept", icon: BookOpen, desc: "Deep-dive into any topic", href: "/study-tools", gradient: "from-blue-500/20 via-blue-500/5 to-transparent", iconBg: "bg-blue-500 text-white" },
];

const SECONDARY_ACTIONS: QuickAction[] = [
  { label: "Medical Library", icon: Search, desc: "Browse textbooks & references", href: "/medical-books", gradient: "from-violet-500/20 via-violet-500/5 to-transparent", iconBg: "bg-violet-500/10 text-violet-500" },
  { label: "Flashcards", icon: Target, desc: "AI-generated from your notes", href: "/study-tools/flashcards-from-text", gradient: "from-amber-500/20 via-amber-500/5 to-transparent", iconBg: "bg-amber-500/10 text-amber-500" },
  { label: "Study Room", icon: Users, desc: "Collaborate with peers", href: "/social", gradient: "from-rose-500/20 via-rose-500/5 to-transparent", iconBg: "bg-rose-500/10 text-rose-500" },
  { label: "DrawMed", icon: PlayCircle, desc: "Visualize with AI sketching", href: "/drawmed", gradient: "from-cyan-500/20 via-cyan-500/5 to-transparent", iconBg: "bg-cyan-500/10 text-cyan-500" },
  { label: "Podcasts", icon: Mic, desc: "Learn on the go", href: "/podcasts", gradient: "from-purple-500/20 via-purple-500/5 to-transparent", iconBg: "bg-purple-500/10 text-purple-500" },
];

function QuickActionCard({ action, index }: { action: QuickAction; index: number }) {
  const Icon = action.icon;
  const isPrimary = action.size !== "secondary";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card asChild className={cn(
        "group relative overflow-hidden rounded-2xl border-border/40 bg-card/80 shadow-sm will-change-transform transition-all duration-300 ease-out",
        isPrimary
          ? "hover:-translate-y-1 hover:shadow-lg hover:border-primary/40"
          : "hover:-translate-y-0.5 hover:shadow-md hover:border-border/60"
      )}>
        <Link href={action.href}>
          <CardContent className={cn("relative", isPrimary ? "p-4 md:p-5" : "p-3.5 flex items-center gap-3")}>
            {isPrimary && (
              <div className={cn("absolute inset-0 rounded-2xl bg-gradient-to-b opacity-0 group-hover:opacity-100 transition-opacity duration-500", action.gradient)} />
            )}

            <div className={cn(
              "relative transition-transform duration-300 group-hover:scale-110 rounded-xl",
              isPrimary ? action.iconBg : action.iconBg.replace("text-", "text-").replace("bg-", "bg-"),
              isPrimary ? "flex items-center justify-center w-10 h-10" : "flex items-center justify-center w-8 h-8 rounded-lg"
            )}>
              <Icon className={isPrimary ? "h-5 w-5" : "h-4 w-4"} />
            </div>

            <div className={cn("relative", !isPrimary && "flex-1 min-w-0")}>
              <span className={cn(
                "font-black text-foreground group-hover:text-primary transition-colors duration-300 block",
                isPrimary ? "text-sm mt-3" : "text-xs leading-tight"
              )}>
                {action.label}
              </span>
              {isPrimary && (
                <span className="text-[10px] text-muted-foreground/60 font-medium mt-0.5 block">{action.desc}</span>
              )}
            </div>
          </CardContent>
        </Link>
      </Card>
    </motion.div>
  );
}

export const QuickActionsHub = React.memo(function QuickActionsHub() {
  return (
    <div>
      <SectionHeader icon={Zap} title="Quick Actions" />

      <div className="space-y-3">
        {/* Primary actions - 3 large cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PRIMARY_ACTIONS.map((action, i) => (
            <QuickActionCard key={action.label} action={action} index={i} />
          ))}
        </div>

        {/* Secondary actions - 5 small compact cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {SECONDARY_ACTIONS.map((action, i) => (
            <QuickActionCard key={action.label} action={{ ...action, size: "secondary" }} index={i + 3} />
          ))}
        </div>
      </div>
    </div>
  );
});
