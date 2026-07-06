"use client";

import { useState, useEffect } from "react";
import type { DashboardData } from "@/types/dashboard";
import { cn } from "@/lib/utils";
import { MissionControlHero } from "@/components/dashboard/sections/MissionControlHero";
import { ContinueLearningSection } from "@/components/dashboard/sections/ContinueLearningSection";
import { ContinueLectureCard } from "@/components/dashboard/sections/ContinueLectureCard";
import { ActiveRoomsSidebar } from "@/components/dashboard/sections/ActiveRoomsSidebar";
import { LeaderboardSidebar } from "@/components/dashboard/sections/LeaderboardSidebar";
import { SearchableSidebar } from "@/components/dashboard/sections/SearchableSidebar";
import { RecordsCarousel } from "@/components/dashboard/sections/RecordsCarousel";
import { CommunityCarouselSidebar } from "@/components/dashboard/sections/CommunityCarouselSidebar";
import { QuickAccessLinks } from "@/components/dashboard/sections/QuickAccessLinks";
import { SuggestedVideosCarousel } from "@/components/dashboard/sections/SuggestedVideosCarousel";
import { DashboardFooter } from "@/components/dashboard/sections/DashboardFooter";

export function DashboardDesktopView({ data, hasAds }: { data: DashboardData; hasAds?: boolean }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1280px)");
    setSidebarOpen(mq.matches);
    const handler = (e: MediaQueryListEvent) => setSidebarOpen(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <div className="hidden md:block">
      <div
        className="relative mx-auto w-full h-screen overflow-hidden"
        style={{
          maxWidth: `calc(1504px - var(--sidebar-offset, 64px))`,
          transition: "max-width .3s cubic-bezier(.2,0,0,1)",
        }}
      >
        <div className="flex gap-6 xl:gap-8 px-4 sm:px-8 lg:px-12 h-full">
          <div className="flex-1 min-w-0 overflow-y-auto h-full pt-6 lg:pt-8 pb-0 space-y-8 md:space-y-10 section-entrance no-scrollbar">
            <MissionControlHero data={data} onToggleSidebar={() => setSidebarOpen(o => !o)} sidebarOpen={sidebarOpen} />
            <ContinueLearningSection data={data} />
            <RecordsCarousel />
            <CommunityCarouselSidebar />
            <SuggestedVideosCarousel />
            <DashboardFooter />
          </div>

          <div className="hidden lg:flex shrink-0 h-full">
            <div className={cn(
              "overflow-hidden transition-all duration-500 ease-in-out h-full",
              sidebarOpen ? "w-[calc(336px-var(--sidebar-offset,64px)*.25)]" : "w-0"
            )}>
              <aside className="flex flex-col gap-6 md:gap-8 pt-4 lg:pt-6 pb-8 premium-glass rounded-2xl pl-4 pr-3 overflow-y-auto no-scrollbar min-h-0 h-full w-[calc(336px-var(--sidebar-offset,64px)*.25)]">
                <SearchableSidebar>
                  <div className="shrink-0"><ActiveRoomsSidebar /></div>
                  <div className="shrink-0"><LeaderboardSidebar /></div>
                  <div className="shrink-0"><ContinueLectureCard lecture={data.lastLecture ?? null} /></div>
                  <div className="shrink-0"><QuickAccessLinks /></div>
                </SearchableSidebar>
              </aside>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
