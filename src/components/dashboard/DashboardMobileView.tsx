"use client";

import dynamic from "next/dynamic";
import type { DashboardData } from "@/types/dashboard";
import { MissionControlHero } from "@/components/dashboard/sections/MissionControlHero";
import { ContinueLearningSection } from "@/components/dashboard/sections/ContinueLearningSection";
import { QuickActionsHub } from "@/components/dashboard/sections/QuickActionsHub";
import { EcosystemCards } from "@/components/dashboard/sections/EcosystemCards";
import { ProfileCoverSection } from "@/components/dashboard/sections/ProfileCoverSection";

const AIRecommendations = dynamic(() => import("@/components/dashboard/sections/AIRecommendations").then(m => m.AIRecommendations), { ssr: false });
const LearningHeatmap = dynamic(() => import("@/components/dashboard/sections/LearningHeatmap").then(m => m.LearningHeatmap), { ssr: false });
const AchievementsShelf = dynamic(() => import("@/components/dashboard/sections/AchievementsShelf").then(m => m.AchievementsShelf), { ssr: false });

export function DashboardMobileView({ data }: { data: DashboardData }) {
  const hasAds = !!data.ads?.length;

  return (
    <div className="md:hidden scroll-smooth">
      <div className="pb-4 space-y-6">
        <div className="px-4 pt-6">
          <ProfileCoverSection data={data} hasAds={hasAds} />

          <div
            className="space-y-6 mt-[45px] md:mt-[54px] lg:mt-[72px]"
          >
            <MissionControlHero data={data} />
            <ContinueLearningSection data={data} />
            <QuickActionsHub />
            <EcosystemCards />
            <AIRecommendations data={data} />
            <LearningHeatmap data={data} />
            <AchievementsShelf data={data} />
          </div>
        </div>
      </div>
    </div>
  );
}
