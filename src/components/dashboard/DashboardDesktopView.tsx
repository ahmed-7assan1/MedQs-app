"use client";

import { useState, useEffect } from "react";
import type { DashboardData } from "@/types/dashboard";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
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
import { CarouselErrorBoundary } from "@/components/dashboard/CarouselErrorBoundary";
import { useRecords, useCurriculumVideos, useCommunityPosts } from "@/lib/dashboard-fetch";

export function DashboardDesktopView({ data, hasAds }: { data: DashboardData; hasAds?: boolean }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Observe SWR state so the error boundary can recover when data loads after a failure.
  // SWR deduplicates — only one actual fetch per key regardless of how many components observe it.
  const { data: recordsData } = useRecords();
  const { data: _communityData } = useCommunityPosts();
  const { data: videosData } = useCurriculumVideos();

  const communityData = (_communityData as any)?.data ?? _communityData;

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
          <div className="flex gap-2 xl:gap-3 pl-4 sm:pl-8 lg:pl-12 h-full">
          <div className="flex-1 min-w-0 overflow-y-auto h-full pt-6 lg:pt-8 pb-0 space-y-8 md:space-y-10 section-entrance no-scrollbar pr-6 xl:pr-8">
            <MissionControlHero data={data} onToggleSidebar={() => setSidebarOpen(o => !o)} sidebarOpen={sidebarOpen} />
            <ContinueLearningSection data={data} />
            <CarouselErrorBoundary title="Records" resetKey={recordsData?.items?.length ?? 0}>
              <RecordsCarousel sidebarOpen={sidebarOpen} />
            </CarouselErrorBoundary>
            <CarouselErrorBoundary title="Community" resetKey={communityData?.items?.length ?? 0}>
              <CommunityCarouselSidebar sidebarOpen={sidebarOpen} />
            </CarouselErrorBoundary>
            <CarouselErrorBoundary title="Videos" resetKey={videosData?.items?.length ?? 0}>
              <SuggestedVideosCarousel sidebarOpen={sidebarOpen} />
            </CarouselErrorBoundary>
            <DashboardFooter />
          </div>

          <div className="hidden lg:flex shrink-0 h-full">
            <div className={cn(
              "overflow-hidden transition-all duration-500 ease-in-out h-full",
              sidebarOpen ? "w-80" : "w-0"
            )}>
              <Card className="h-full rounded-none border-border/30 shadow-sm bg-card">
                <div className="h-full overflow-y-auto no-scrollbar p-4">
                  <div className="flex flex-col gap-6 md:gap-8">
                    <SearchableSidebar>
                      <div className="shrink-0"><ActiveRoomsSidebar /></div>
                      <div className="shrink-0"><LeaderboardSidebar /></div>
                      <div className="shrink-0"><ContinueLectureCard lecture={data.lastLecture ?? null} /></div>
                      <div className="shrink-0"><QuickAccessLinks /></div>
                    </SearchableSidebar>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
