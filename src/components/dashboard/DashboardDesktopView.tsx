"use client";

import dynamic from "next/dynamic";
import type { DashboardData } from "@/types/dashboard";
import { MissionControlHero } from "@/components/dashboard/sections/MissionControlHero";
import { ContinueLearningSection } from "@/components/dashboard/sections/ContinueLearningSection";
import { QuickActionsHub } from "@/components/dashboard/sections/QuickActionsHub";
import { EcosystemCards } from "@/components/dashboard/sections/EcosystemCards";
import { ProfileCoverSection } from "@/components/dashboard/sections/ProfileCoverSection";
import { ContinueLectureCard } from "@/components/dashboard/sections/ContinueLectureCard";
import { CommunityCarouselSidebar } from "@/components/dashboard/sections/CommunityCarouselSidebar";

const AIRecommendations = dynamic(() => import("@/components/dashboard/sections/AIRecommendations").then(m => m.AIRecommendations), { ssr: false });
const LearningHeatmap = dynamic(() => import("@/components/dashboard/sections/LearningHeatmap").then(m => m.LearningHeatmap), { ssr: false });
const AchievementsShelf = dynamic(() => import("@/components/dashboard/sections/AchievementsShelf").then(m => m.AchievementsShelf), { ssr: false });

export function DashboardDesktopView({ data, hasAds }: { data: DashboardData; hasAds?: boolean }) {
  return (
    <div className="hidden md:block">
      <div className="relative mx-auto max-w-[1440px] px-4 sm:px-6 md:px-6 lg:px-10 pb-32 pt-4 md:pt-6 lg:pt-8">
        <ProfileCoverSection data={data} hasAds={!!hasAds} />

        <div className="mt-[45px] md:mt-[54px] lg:mt-[72px] flex gap-6 xl:gap-8">
          <div className="flex-1 min-w-0 space-y-8 md:space-y-12">
            <MissionControlHero data={data} />
            <ContinueLearningSection data={data} />
            <QuickActionsHub />
            <EcosystemCards />
            <AIRecommendations data={data} />
            <LearningHeatmap data={data} />
            <AchievementsShelf data={data} />
          </div>

          <aside className="w-[320px] shrink-0 hidden lg:flex flex-col gap-5">
            <ContinueLectureCard lecture={data.lastLecture ?? null} />
            <CommunityCarouselSidebar />
          </aside>
        </div>
      </div>
    </div>
  );
}
