"use client";

import { motion } from "framer-motion";
import { fadeUp } from "@/components/dashboard/shared/animations";
import { QuickActionCard } from "@/components/dashboard/RedesignedComponents";

const ACTIONS = [
  { label: "Ask Dr. Q", iconName: "Brain", color: "bg-primary text-white", href: "/ai-chat" },
  { label: "Generate Quiz", iconName: "Zap", color: "bg-emerald-500 text-white", href: "/quiz" },
  { label: "Explain Concept", iconName: "BookOpen", color: "bg-blue-500 text-white", href: "/study-tools" },
  { label: "Open Library", iconName: "Search", color: "bg-violet-500 text-white", href: "/medical-books" },
  { label: "Create Flashcards", iconName: "Target", color: "bg-amber-500 text-white", href: "/study-tools/flashcards-from-text" },
  { label: "Join Study Room", iconName: "Users", color: "bg-rose-500 text-white", href: "/social" },
  { label: "Open DrawMed", iconName: "PlayCircle", color: "bg-cyan-500 text-white", href: "/drawmed" },
  { label: "Browse Podcasts", iconName: "Mic", color: "bg-purple-500 text-white", href: "/podcasts" },
];

export function QuickActionsHub() {
  return (
    <motion.div variants={fadeUp}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Quick Actions</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {ACTIONS.map((action, i) => (
          <QuickActionCard key={i} {...action} />
        ))}
      </div>
    </motion.div>
  );
}
