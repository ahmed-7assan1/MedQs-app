"use client";

import { motion } from "framer-motion";
import { BrainCircuit, Folder, BookOpen, MessageCircle, Edit3 } from "lucide-react";
import Link from "next/link";

interface QuickActionItem {
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  colorClass: string;
  bgGradient: string;
}

const ACTIONS: QuickActionItem[] = [
  {
    label: "Ask Dr. Q",
    desc: "AI Medical Tutor",
    icon: BrainCircuit,
    href: "/ai-chat",
    colorClass: "text-primary",
    bgGradient: "from-primary/10 via-primary/5 to-transparent",
  },
  {
    label: "Modules",
    desc: "Course modules & topics",
    icon: Folder,
    href: "/modules",
    colorClass: "text-sky-500",
    bgGradient: "from-sky-500/10 via-sky-500/5 to-transparent",
  },
  {
    label: "Medical Library",
    desc: "Textbooks & reference manuals",
    icon: BookOpen,
    href: "/medical-books",
    colorClass: "text-blue-500",
    bgGradient: "from-blue-500/10 via-blue-500/5 to-transparent",
  },
  {
    label: "Community",
    desc: "Connect & collaborate",
    icon: MessageCircle,
    href: "/social",
    colorClass: "text-emerald-500",
    bgGradient: "from-emerald-500/10 via-emerald-500/5 to-transparent",
  },
  {
    label: "DrawMed",
    desc: "AI anatomy sketch board",
    icon: Edit3,
    href: "/drawmed",
    colorClass: "text-rose-500",
    bgGradient: "from-rose-500/10 via-rose-500/5 to-transparent",
  },
];

export function QuickActionsStrip() {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-xs font-black uppercase tracking-wider text-foreground">Quick Actions</h3>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {ACTIONS.map((action, i) => {
          const Icon = action.icon;
          return (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="relative"
            >
              <Link href={action.href}>
                <div className="quick-action-strip-card rounded-2xl p-4 cursor-pointer flex flex-col items-center text-center group h-full">
                  <div className={`absolute inset-0 bg-gradient-to-br ${action.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl`} />
                  
                  <div className={`relative flex items-center justify-center w-11 h-11 rounded-xl bg-card border border-border/30 shadow-sm group-hover:scale-105 group-hover:-translate-y-0.5 group-hover:shadow-md transition-all duration-300 ${action.colorClass}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  
                  <div className="relative mt-3 min-w-0">
                    <span className="block text-xs font-black text-foreground group-hover:text-primary transition-colors leading-none truncate">
                      {action.label}
                    </span>
                    <span className="text-[9px] text-muted-foreground/50 mt-1 block leading-none truncate">
                      {action.desc}
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
