import { Skeleton } from "@/components/ui/skeletons";

export function DashboardDesktopSkeleton() {
  return (
    <div className="hidden md:block">
      <div className="relative mx-auto w-full pt-3 sm:pt-4 lg:pt-5" style={{ maxWidth: "1504px" }}>
        <div className="pl-4 sm:pl-6 lg:pl-8 pr-4 sm:pr-6 lg:pr-8 mb-8">
          {/* MissionControlHero Skeleton */}
          <div className="rounded-2xl p-4 md:p-5 bg-card/40 border border-border/20">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-4">
                <Skeleton className="h-20 w-20 rounded-3xl" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-5 w-24 rounded-xl" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-xl" />
                <Skeleton className="h-8 w-8 rounded-xl" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-border/10">
              <div className="flex items-center gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-3 w-10 hidden md:inline" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Strip Skeleton */}
        <div className="pl-4 sm:pl-6 lg:pl-8 pr-4 sm:pr-6 lg:pr-8 mb-10">
          <div className="flex gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-32 rounded-full" />
            ))}
          </div>
        </div>

        {/* Focus Plan Card + Leaderboard + Community + Today Queue */}
        <div className="pl-4 sm:pl-6 lg:pl-8 pr-4 sm:pr-6 lg:pr-8 space-y-12">
          {/* Focus Plan Card */}
          <div className="space-y-3">
            <Skeleton className="h-5 w-36" />
            <div className="flex items-center gap-4 p-5 bg-card/40 border border-border/20 rounded-2xl">
              <Skeleton className="h-14 w-14 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-3 w-48" />
                <Skeleton className="h-3 w-28" />
              </div>
              <div className="flex flex-col items-end gap-1">
                <Skeleton className="h-3 w-8" />
                <Skeleton className="h-2 w-16 rounded-full" />
              </div>
            </div>
          </div>

          {/* Leaderboard Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32 flex-1 rounded-xl" />
              ))}
            </div>
          </div>

          {/* Community Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="flex gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex-1 h-44 bg-card/40 border border-border/20 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-2 w-14" />
                    </div>
                  </div>
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-14 w-full rounded-lg" />
                </div>
              ))}
            </div>
          </div>

          {/* Today Queue */}
          <div className="space-y-4">
            <Skeleton className="h-5 w-28" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-4 bg-card/40 border border-border/20 rounded-xl">
                  <Skeleton className="h-5 w-5 rounded" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-64" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
