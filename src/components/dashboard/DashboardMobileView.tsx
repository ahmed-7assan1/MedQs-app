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
import { ProfileCoverSection } from "@/components/dashboard/sections/ProfileCoverSection";

export function DashboardMobileView({ data }: { data: DashboardData }) {
  const hasAds = !!data.ads?.length;

  return (
    <div className="md:hidden scroll-smooth">
      <div className="pb-4 space-y-6">
        <div className="px-4 pt-6">
          <ProfileCoverSection data={data} hasAds={hasAds} />

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6 mt-[45px] md:mt-[54px] lg:mt-[72px]"
          >
            <MissionControlHero data={data} />
            <ContinueLearningSection data={data} />
            <QuickActionsHub />
            <EcosystemCards />
            <AIRecommendations data={data} />
            <LearningHeatmap data={data} />
            <AchievementsShelf data={data} />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
