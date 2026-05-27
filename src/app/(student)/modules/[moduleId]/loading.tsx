import { Skeleton } from "@/components/ui/skeleton";

function SubjectCardSkeleton() {
  return (
    <div className="flex flex-row sm:flex-col items-center sm:items-stretch gap-4 sm:gap-0 bg-card border border-border/60 rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 shadow-sm sm:shadow-lg overflow-hidden">
      <div className="flex items-center justify-between sm:mb-6 shrink-0 sm:shrink-1">
        <Skeleton className="h-11 w-11 sm:h-12 md:h-14 sm:w-12 md:w-14 rounded-xl sm:rounded-2xl" />
        <Skeleton className="hidden sm:inline-block h-5 w-16 rounded-full" />
      </div>
      <div className="flex-1 min-w-0 sm:space-y-1">
        <Skeleton className="h-5 sm:h-6 md:h-7 w-3/4" />
        <Skeleton className="h-3 sm:h-3.5 w-1/2 mt-0.5 sm:mt-0" />
      </div>
      <div className="sm:w-full sm:mt-6 md:mt-8">
        <Skeleton className="hidden sm:block h-1.5 w-full rounded-full" />
        <div className="sm:hidden flex flex-col items-end gap-1">
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-1 w-12 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export default function ModuleDetailLoading() {
  return (
    <div className="min-h-screen bg-background pb-32 pt-0" aria-busy="true" aria-label="Loading module">
      {/* Mobile Title Skeleton */}
      <div className="md:hidden px-6 pb-2 pt-2 flex items-center gap-4">
        <Skeleton className="h-14 w-14 rounded-[18px]" />
        <div className="space-y-1.5 min-w-0 flex-1">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 w-36" />
        </div>
      </div>

      <div className="container mx-auto px-6 relative z-30">
        {/* Curriculum Header */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-1.5 rounded-full" />
              <div>
                <Skeleton className="h-7 w-40" />
                <Skeleton className="h-3 w-36 mt-1" />
              </div>
            </div>
            <Skeleton className="hidden sm:flex h-8 w-36 rounded-xl" />
          </div>

          {/* Subject Cards Grid */}
          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SubjectCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
