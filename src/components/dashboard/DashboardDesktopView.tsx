"use client";

import type { DashboardData } from "@/types/dashboard";
import { MissionControlHero } from "@/components/dashboard/sections/MissionControlHero";
import { ContinueLearningSection } from "@/components/dashboard/sections/ContinueLearningSection";
import { QuickActionsHub } from "@/components/dashboard/sections/QuickActionsHub";
import { EcosystemCards } from "@/components/dashboard/sections/EcosystemCards";
import { ContinueLectureCard } from "@/components/dashboard/sections/ContinueLectureCard";
import { ActiveRoomsSidebar } from "@/components/dashboard/sections/ActiveRoomsSidebar";
import { LeaderboardSidebar } from "@/components/dashboard/sections/LeaderboardSidebar";
import { SearchableSidebar } from "@/components/dashboard/sections/SearchableSidebar";
import { CommunityCarouselSidebar } from "@/components/dashboard/sections/CommunityCarouselSidebar";
import { QuickAccessLinks } from "@/components/dashboard/sections/QuickAccessLinks";

export function DashboardDesktopView({ data, hasAds }: { data: DashboardData; hasAds?: boolean }) {
  return (
    <div className="hidden md:block">
      <div
        className="relative mx-auto pb-32 w-full"
        style={{
          maxWidth: `calc(1504px - var(--sidebar-offset, 64px))`,
          transition: "max-width .3s cubic-bezier(.2,0,0,1)",
        }}
      >
        <div className="flex gap-6 xl:gap-8 px-4 sm:px-8 lg:px-12">
          <div className="flex-1 min-w-0 space-y-8 md:space-y-10 section-entrance pt-6 lg:pt-8">
            <MissionControlHero data={data} />
            <ContinueLearningSection data={data} />
            <CommunityCarouselSidebar />
            <QuickActionsHub />
            <EcosystemCards />
          </div>

          <div
            className="sticky top-24 shrink-0 hidden lg:flex flex-col self-start"
            style={{
              width: `calc(336px - var(--sidebar-offset, 64px) * .25)`,
              transition: "width .3s cubic-bezier(.2,0,0,1)",
            }}
          >
            <aside className="flex flex-col gap-6 md:gap-8 -mt-20 pt-4 lg:pt-6 pb-8 premium-glass rounded-2xl px-4">
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
