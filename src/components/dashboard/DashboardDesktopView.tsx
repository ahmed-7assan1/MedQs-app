"use client";

import type { DashboardData } from "@/types/dashboard";
import { MissionControlHero } from "@/components/dashboard/sections/MissionControlHero";
import { ContinueLearningSection } from "@/components/dashboard/sections/ContinueLearningSection";
import { ContinueLectureCard } from "@/components/dashboard/sections/ContinueLectureCard";
import { ActiveRoomsSidebar } from "@/components/dashboard/sections/ActiveRoomsSidebar";
import { LeaderboardSidebar } from "@/components/dashboard/sections/LeaderboardSidebar";
import { SearchableSidebar } from "@/components/dashboard/sections/SearchableSidebar";
import { CommunityCarouselSidebar } from "@/components/dashboard/sections/CommunityCarouselSidebar";
import { QuickAccessLinks } from "@/components/dashboard/sections/QuickAccessLinks";
import { SuggestedVideosCarousel } from "@/components/dashboard/sections/SuggestedVideosCarousel";

export function DashboardDesktopView({ data, hasAds }: { data: DashboardData; hasAds?: boolean }) {
  return (
    <div className="hidden md:block">
      <div
        className="relative mx-auto w-full h-dvh overflow-hidden"
        style={{
          maxWidth: `calc(1504px - var(--sidebar-offset, 64px))`,
          transition: "max-width .3s cubic-bezier(.2,0,0,1)",
        }}
      >
        <div className="flex gap-6 xl:gap-8 px-4 sm:px-8 lg:px-12 h-full">
          <div className="flex-1 min-w-0 overflow-y-auto h-full pt-6 lg:pt-8 pb-32 space-y-8 md:space-y-10 section-entrance no-scrollbar">
            <MissionControlHero data={data} />
            <ContinueLearningSection data={data} />
            <CommunityCarouselSidebar />
            <SuggestedVideosCarousel />
          </div>

          <div
            className="shrink-0 hidden lg:flex flex-col self-start h-full"
            style={{
              width: `calc(336px - var(--sidebar-offset, 64px) * .25)`,
              transition: "width .3s cubic-bezier(.2,0,0,1)",
            }}
          >
            <aside className="flex flex-col gap-6 md:gap-8 pt-4 lg:pt-6 pb-8 premium-glass rounded-2xl px-4 overflow-y-auto no-scrollbar">
              <SearchableSidebar>
                <ActiveRoomsSidebar />
                <LeaderboardSidebar />
                <ContinueLectureCard lecture={data.lastLecture ?? null} />
                <QuickAccessLinks />
              </SearchableSidebar>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
