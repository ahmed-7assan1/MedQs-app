import { Skeleton } from "@/components/ui/skeletons";

export function DashboardMobileSkeleton() {
  return (
    <div className="md:hidden pb-24">
      {/* Fixed Header Skeleton */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-background py-1 px-5">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-12 rounded-full" />
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
        </div>
      </div>
      <div className="h-16" />

      <div className="px-5 space-y-6">
        {/* Achievement Rings - 4 circles */}
        <div className="flex items-center justify-between bg-card/30 rounded-2xl px-4 py-4 border border-border/10">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <Skeleton className="h-[52px] w-[52px] rounded-full" />
              <Skeleton className="h-3 w-10" />
              <Skeleton className="h-2 w-8" />
            </div>
          ))}
        </div>

        {/* Focus Card Skeleton */}
        <div className="flex items-center gap-3 p-4 bg-card/40 rounded-2xl border border-border/10">
          <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-3 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <Skeleton className="h-3 w-8" />
            <Skeleton className="h-1.5 w-14 rounded-full" />
          </div>
        </div>

        {/* Featured Card Skeleton */}
        <Skeleton className="h-32 w-full rounded-[24px]" />

        {/* Leaderboard Horizontal Scroll Skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-28 rounded-xl shrink-0" />
            ))}
          </div>
        </div>

        {/* Community Carousel Skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-40 w-72 rounded-xl bg-card/40 border border-border/20 shrink-0 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-2 w-14" />
                  </div>
                </div>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-16 w-full rounded-lg" />
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions Skeleton */}
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-16 rounded-2xl shrink-0" />
          ))}
        </div>
      </div>
    </div>
  );
}
