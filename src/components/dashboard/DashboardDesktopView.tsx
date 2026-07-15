"use client";

import type { DashboardData } from "@/types/dashboard";
import { deriveTodayTasks } from "@/types/dashboard";
import { MissionControlHero } from "@/components/dashboard/sections/MissionControlHero";
import { FocusPlanCard } from "@/components/dashboard/sections/FocusPlanCard";
import { TodayQueue } from "@/components/dashboard/sections/TodayQueue";
import { QuickActionsStrip } from "@/components/dashboard/sections/QuickActionsStrip";
import { LeaderboardCarousel } from "@/components/dashboard/sections/LeaderboardCarousel";
import { CommunityPostsCarousel } from "@/components/dashboard/CommunityPostsCarousel";
import { CarouselErrorBoundary } from "@/components/dashboard/CarouselErrorBoundary";

export function DashboardDesktopView({ data, hasAds }: { data: DashboardData; hasAds?: boolean }) {
  const todayTasks = deriveTodayTasks(data);

  return (
    <div className="hidden md:block">
      <div
        className="relative mx-auto w-full pt-3 sm:pt-4 lg:pt-5"
        style={{
          maxWidth: "1504px",
          transition: "max-width .3s cubic-bezier(.2,0,0,1)",
        }}
      >
        <div className="pl-4 sm:pl-6 lg:pl-8 pr-4 sm:pr-6 lg:pr-8 mb-8">
          <CarouselErrorBoundary title="Hero">
            <MissionControlHero data={data} />
          </CarouselErrorBoundary>
        </div>

        <div className="pl-4 sm:pl-6 lg:pl-8 pr-4 sm:pr-6 lg:pr-8 mb-10">
          <QuickActionsStrip />
        </div>

        <div className="pl-4 sm:pl-6 lg:pl-8 pr-4 sm:pr-6 lg:pr-8">
          <div className="flex-1 min-w-0 pb-12 space-y-12 section-entrance">
            <FocusPlanCard lastLecture={data.lastLecture ?? null} firstName={data.firstName} />

            <CarouselErrorBoundary title="Rooms">
              <LeaderboardCarousel />
            </CarouselErrorBoundary>

            <CarouselErrorBoundary title="Community">
              <CommunityPostsCarousel />
            </CarouselErrorBoundary>

            <TodayQueue tasks={todayTasks} />
          </div>
        </div>
      </div>
    </div>
  );
}
