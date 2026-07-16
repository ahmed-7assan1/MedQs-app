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
}

const PRIMARY_ACTIONS: QuickAction[] = [
  { label: "Ask Dr. Q", icon: BrainCircuit, desc: "AI-powered medical assistant", href: "/ai-chat", gradient: "from-primary/20 via-primary/10 to-transparent", iconBg: "bg-primary text-primary-foreground" },
  { label: "Generate Quiz", icon: Zap, desc: "Test your knowledge instantly", href: "/quiz", gradient: "from-sky-500/20 via-sky-500/5 to-transparent", iconBg: "bg-sky-500 text-white" },
  { label: "Explain Concept", icon: BookOpen, desc: "Deep-dive into any topic", href: "/study-tools", gradient: "from-blue-500/20 via-blue-500/5 to-transparent", iconBg: "bg-blue-500 text-white" },
];

const SECONDARY_ACTIONS: QuickAction[] = [
  { label: "Medical Library", icon: Search, desc: "Browse textbooks & references", href: "/medical-books", gradient: "from-violet-500/20 via-violet-500/5 to-transparent", iconBg: "bg-violet-500/15 text-violet-500" },
  { label: "Flashcards", icon: Target, desc: "AI-generated from your notes", href: "/study-tools/flashcards-from-text", gradient: "from-amber-500/20 via-amber-500/5 to-transparent", iconBg: "bg-amber-500/15 text-amber-500" },
  { label: "Study Room", icon: Users, desc: "Collaborate with peers", href: "/social", gradient: "from-rose-500/20 via-rose-500/5 to-transparent", iconBg: "bg-rose-500/15 text-rose-500" },
  { label: "DrawMed", icon: PlayCircle, desc: "Visualize with AI sketching", href: "/drawmed", gradient: "from-cyan-500/20 via-cyan-500/5 to-transparent", iconBg: "bg-cyan-500/15 text-cyan-500" },
  { label: "Podcasts", icon: Mic, desc: "Learn on the go", href: "/podcasts", gradient: "from-purple-500/20 via-purple-500/5 to-transparent", iconBg: "bg-purple-500/15 text-purple-500" },
];

function PrimaryCard({ action, index }: { action: QuickAction; index: number }) {
  const Icon = action.icon;
  const isDrQ = index === 0;

  return (
    <motion.div
      className={isDrQ ? "sm:col-span-2" : ""}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link href={action.href} className="group block">
        <Card className={cn(
          "relative overflow-hidden rounded-2xl border-border/40 bg-card/40 backdrop-blur-sm shadow-sm will-change-transform transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:border-primary/40",
          isDrQ ? "hover:shadow-primary/10" : "hover:shadow-sky-500/10"
        )}>
          <CardContent className="relative p-5 md:p-6">
            <div className={cn("absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500", action.gradient)} />
            <div className="relative flex items-center gap-4">
              <div className={cn(
                "flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-0.5 group-hover:shadow-lg shrink-0",
                action.iconBg
              )}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <span className="block text-base font-black text-foreground group-hover:text-primary transition-colors duration-300">
                  {action.label}
                </span>
                <span className="text-[10px] text-muted-foreground font-medium mt-0.5 block">{action.desc}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

function SecondaryCard({ action, index }: { action: QuickAction; index: number }) {
  const Icon = action.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link href={action.href} className="group block">
        <Card className="overflow-hidden rounded-2xl border-border/40 bg-card/40 backdrop-blur-sm shadow-sm will-change-transform transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg">
          <CardContent className="p-3.5 relative">
            <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl", action.gradient)} />
            <div className="relative flex items-center gap-3">
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-0.5 group-hover:shadow-lg shrink-0",
                action.iconBg
              )}>
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors duration-300">{action.label}</span>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

export const QuickActionsHub = React.memo(function QuickActionsHub() {
  return (
    <div>
      <SectionHeader icon={Zap} title="Quick Actions" />

      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PRIMARY_ACTIONS.map((action, i) => (
            <PrimaryCard key={action.label} action={action} index={i} />
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {SECONDARY_ACTIONS.map((action, i) => (
            <SecondaryCard key={action.label} action={action} index={i + 3} />
          ))}
        </div>
      </div>
    </div>
  );
});
