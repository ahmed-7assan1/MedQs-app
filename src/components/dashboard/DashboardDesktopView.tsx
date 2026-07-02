"use client";

import { motion } from "framer-motion";
import { containerVariants } from "@/components/dashboard/shared/animations";
import type { DashboardData } from "@/types/dashboard";
import { MissionControlHero } from "@/components/dashboard/sections/MissionControlHero";
import { ContinueLearningSection } from "@/components/dashboard/sections/ContinueLearningSection";
import { QuickActionsHub } from "@/components/dashboard/sections/QuickActionsHub";
import { EcosystemCards } from "@/components/dashboard/sections/EcosystemCards";
import { AIRecommendations } from "@/components/dashboard/sections/AIRecommendations";
import { LearningHeatmap } from "@/components/dashboard/sections/LearningHeatmap";
import { AchievementsShelf } from "@/components/dashboard/sections/AchievementsShelf";
import { ProfileSidebar } from "@/components/dashboard/sections/ProfileSidebar";
import { ProfileCoverSection } from "@/components/dashboard/sections/ProfileCoverSection";

export function DashboardDesktopView({ data, hasAds }: { data: DashboardData; hasAds?: boolean }) {
  return (
    <div className="hidden md:block">
      <div className="relative mx-auto max-w-[1440px] px-4 sm:px-6 md:px-6 lg:px-10 pb-32 pt-4 md:pt-6 lg:pt-8">
        <ProfileCoverSection data={data} hasAds={!!hasAds} />

        <div className="flex gap-6 xl:gap-8 mt-[45px] md:mt-[54px] lg:mt-[72px]">
          {/* Left: Profile Sidebar (hidden on smaller desktop) */}
          <aside className="w-[260px] xl:w-[280px] shrink-0 hidden lg:block">
            <div className="sticky top-6">
              <ProfileSidebar data={data} />
            </div>
          </aside>

          {/* Right: Main Content */}
          <main className="flex-1 min-w-0">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-8 md:space-y-12"
            >
              <MissionControlHero data={data} />
              <ContinueLearningSection data={data} />
              <QuickActionsHub />
              <EcosystemCards />
              <AIRecommendations data={data} />
              <LearningHeatmap data={data} />
              <AchievementsShelf data={data} />
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
}
