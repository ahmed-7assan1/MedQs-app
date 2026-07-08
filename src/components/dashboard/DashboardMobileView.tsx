"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { DashboardData } from "@/types/dashboard";
import { RecordsCarousel } from "@/components/dashboard/sections/RecordsCarousel";
import { MissionControlHero } from "@/components/dashboard/sections/MissionControlHero";
import { ContinueLearningSection } from "@/components/dashboard/sections/ContinueLearningSection";
import { LearningHeatmap } from "@/components/dashboard/sections/LearningHeatmap";

type TabId = "overview" | "learn" | "social";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "learn", label: "Learn" },
  { id: "social", label: "Social" },
];

export function DashboardMobileView({ data }: { data: DashboardData }) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  return (
    <div className="md:hidden scroll-smooth pt-4">
      {/* Sticky tab bar */}
      <div className="sticky top-0 z-10 bg-background/90 px-4 pb-2 pt-1 mb-2 border-b border-border/20">
        <div className="flex gap-1 rounded-xl bg-muted/40 p-0.5">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all duration-200",
                activeTab === tab.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground/60 hover:text-foreground/80"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pb-4 space-y-6 section-entrance">
        {activeTab === "overview" && (
          <>
            <MissionControlHero data={data} />
            <LearningHeatmap data={data} />
          </>
        )}

        {activeTab === "learn" && (
          <>
            <ContinueLearningSection data={data} />
            <RecordsCarousel />
          </>
        )}

        {activeTab === "social" && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-muted/30 flex items-center justify-center mb-4">
              <span className="text-2xl">💬</span>
            </div>
            <p className="text-sm font-bold text-foreground/70">Community Feed</p>
            <p className="text-xs text-muted-foreground mt-1">Coming to mobile soon</p>
          </div>
        )}
      </div>
    </div>
  );
}
