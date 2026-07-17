import { Skeleton } from "@/components/ui/skeletons";

export function ModuleDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background pb-32 pt-0">
      {/* ── DESKTOP HERO SKELETON ── */}
      <div className="relative hidden md:flex h-[400px] w-full overflow-hidden items-center">
        <div className="container mx-auto px-6 relative z-20 pt-20">
          <div className="flex flex-col md:flex-row items-center md:items-center gap-8">
            <Skeleton className="h-32 w-32 rounded-[32px] rotate-3 shrink-0" />
            <div className="flex-1 text-left space-y-3">
              <Skeleton className="h-5 w-36 rounded-full" />
              <Skeleton className="h-20 w-[500px]" />
              <div className="flex items-center gap-6 pt-2">
                <div className="space-y-1">
                  <Skeleton className="h-7 w-12" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-6 w-px" />
                <div className="space-y-1">
                  <Skeleton className="h-7 w-12" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-6 w-px" />
                <div className="space-y-1">
                  <Skeleton className="h-7 w-12" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MOBILE TITLE ROW SKELETON ── */}
      <div className="md:hidden px-6 pb-2 pt-2 flex items-center gap-4">
        <Skeleton className="h-14 w-14 rounded-[18px] shrink-0" />
        <div className="space-y-1.5 min-w-0 flex-1">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>

      <div className="container mx-auto px-6 -mt-8 relative z-30">
        {/* ── CURRICULUM HEADER SKELETON ── */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-1.5 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-7 w-36" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
          <Skeleton className="hidden sm:flex h-9 w-40 rounded-xl" />
        </div>

        {/* ── SUBJECTS GRID SKELETON ── */}
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-card border border-border/60 rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6"
            >
              <div className="flex items-center justify-between sm:mb-6">
                <Skeleton className="h-11 w-11 sm:h-12 md:h-14 sm:w-12 md:w-14 rounded-xl sm:rounded-2xl" />
                <Skeleton className="hidden sm:block h-5 w-20 rounded-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-5 w-36 sm:w-44" />
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-1 w-1 rounded-full" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <div className="hidden sm:block mt-6 md:mt-8 space-y-1">
                <div className="flex justify-between">
                  <Skeleton className="h-2.5 w-12" />
                  <Skeleton className="h-2.5 w-8" />
                </div>
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
