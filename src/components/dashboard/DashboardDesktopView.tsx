"use client";

import { useEffect, useRef } from "react";
import type { DashboardData } from "@/types/dashboard";
import { deriveTodayTasks } from "@/types/dashboard";
import { MissionControlHero } from "@/components/dashboard/sections/MissionControlHero";
import { FocusPlanCard } from "@/components/dashboard/sections/FocusPlanCard";
import { TodayQueue } from "@/components/dashboard/sections/TodayQueue";
import { QuickActionsStrip } from "@/components/dashboard/sections/QuickActionsStrip";
import { ContinueLearningSection } from "@/components/dashboard/sections/ContinueLearningSection";
import { SuggestedVideosCarousel } from "@/components/dashboard/sections/SuggestedVideosCarousel";
import { RoomsCarousel } from "@/components/dashboard/sections/RoomsCarousel";
import { CommunityPostsCarousel } from "@/components/dashboard/CommunityPostsCarousel";
import { CarouselErrorBoundary } from "@/components/dashboard/CarouselErrorBoundary";
import { useCurriculumVideos } from "@/lib/dashboard-fetch";

export function DashboardDesktopView({ data, hasAds }: { data: DashboardData; hasAds?: boolean }) {
  const { data: videosData } = useCurriculumVideos();

  const revalidationKeys = useRef({ videos: 0 }).current;

  useEffect(() => { revalidationKeys.videos++; }, [videosData]);

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
              <RoomsCarousel />
            </CarouselErrorBoundary>

            <CarouselErrorBoundary title="Community">
              <CommunityPostsCarousel />
            </CarouselErrorBoundary>

            <TodayQueue tasks={todayTasks} />

            <ContinueLearningSection data={data} />

            <CarouselErrorBoundary title="Videos" resetKey={revalidationKeys.videos}>
              <SuggestedVideosCarousel />
            </CarouselErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  );
}
