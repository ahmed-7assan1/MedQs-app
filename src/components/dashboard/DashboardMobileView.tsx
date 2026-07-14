import type { DashboardData } from "@/types/dashboard";
import { deriveTodayTasks } from "@/types/dashboard";
import { MissionControlHero } from "@/components/dashboard/sections/MissionControlHero";
import { FocusPlanCard } from "@/components/dashboard/sections/FocusPlanCard";
import { TodayQueue } from "@/components/dashboard/sections/TodayQueue";
import { QuickActionsStrip } from "@/components/dashboard/sections/QuickActionsStrip";
import { ContinueLearningSection } from "@/components/dashboard/sections/ContinueLearningSection";
import { LearningHeatmap } from "@/components/dashboard/sections/LearningHeatmap";
import { RoomsCarousel } from "@/components/dashboard/sections/RoomsCarousel";
import { CommunityPostsCarousel } from "@/components/dashboard/CommunityPostsCarousel";

export function DashboardMobileView({ data }: { data: DashboardData }) {
  const todayTasks = deriveTodayTasks(data);

  return (
    <div className="md:hidden scroll-smooth pt-3 px-3 pb-12 space-y-5 section-entrance">
      {/* 1. Welcoming Hero & Target */}
      <MissionControlHero data={data} />

      {/* 2. Today's Primary Study Action */}
      <FocusPlanCard lastLecture={data.lastLecture ?? null} firstName={data.firstName} />

      {/* 3. Study Rooms */}
      <RoomsCarousel />

      {/* 3.5 Community Posts */}
      <CommunityPostsCarousel />

      {/* 4. Today's Goal Queue */}
      <TodayQueue tasks={todayTasks} />

      {/* 5. Core Features Links */}
      <QuickActionsStrip />

      {/* 6. Course Modules Progress */}
      <ContinueLearningSection data={data} />

      {/* 7. Weekly Activity Heatmap */}
      <LearningHeatmap data={data} />
    </div>
  );
}
