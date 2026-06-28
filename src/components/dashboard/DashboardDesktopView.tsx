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

export function DashboardDesktopView({ data }: { data: DashboardData }) {
  return (
    <div className="hidden md:block">
      <div className="relative mx-auto max-w-[1440px] px-4 sm:px-6 md:px-10 pb-32 pt-4 md:pt-10 lg:pt-32">
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
      </div>
    </div>
  );
}
