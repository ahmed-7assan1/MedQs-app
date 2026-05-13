"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Wand2, Sparkles, Cpu } from "lucide-react";
import { AIToolsTab } from "@/components/admin/ai-studio/AIToolsTab";
import { CreativeStudioTab } from "@/components/admin/ai-studio/CreativeStudioTab";
import { ColabTransferTab } from "@/components/admin/ai-studio/ColabTransferTab";

type StudioTab = "tools" | "creative" | "colab";

export default function AIStudioPage() {
  const [activeTab, setActiveTab] = useState<StudioTab>("tools");

  const TABS: { id: StudioTab; label: string; icon: any }[] = [
    { id: "tools", label: "Diagnostic Suite & Extraction", icon: Wand2 },
    { id: "creative", label: "Creative Studio", icon: Sparkles },
    { id: "colab", label: "Colab Transfer & Queue", icon: Cpu },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-6 space-y-8 pb-24">
      {/* Premium Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-500">Intelligence Hub</p>
          <h1 className="font-display text-2xl font-bold md:text-3xl">AI Studio</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Leverage advanced Large Language Models, AI Image generation, and remote processing.
          </p>
        </div>
      </div>

      {/* Glassmorphic Tabs */}
      <div className="flex gap-1.5 overflow-x-auto rounded-2xl border border-white/[0.02] bg-card/50 p-1.5 backdrop-blur-md">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2.5 rounded-xl px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-all duration-300",
              activeTab === id
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Active Tab Content */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === "tools" && <AIToolsTab />}
        {activeTab === "creative" && <CreativeStudioTab />}
        {activeTab === "colab" && <ColabTransferTab />}
      </div>
    </div>
  );
}
