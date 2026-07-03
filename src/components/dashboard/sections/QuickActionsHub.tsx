"use client";

import React from "react";
import { Zap } from "lucide-react";
import { SectionHeader } from "@/components/dashboard/shared/SectionHeader";
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

export const QuickActionsHub = React.memo(function QuickActionsHub() {
  return (
    <div>
      <SectionHeader icon={Zap} title="Quick Actions" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {ACTIONS.map((action, i) => (
          <QuickActionCard key={i} {...action} />
        ))}
      </div>
    </div>
  );
});
