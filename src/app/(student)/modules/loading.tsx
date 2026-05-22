import { Skeleton } from "@/components/ui/skeleton";

function ModuleCardSkeleton() {
  return (
    <div className="rounded-2xl md:rounded-[32px] border border-white/[0.04] bg-[#0c0d18]/30 p-4 md:p-6 space-y-4 border-t-2 border-t-white/[0.03]">
      {/* Header */}
      <div className="flex items-start justify-between">
        <Skeleton className="h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      {/* Title */}
      <div className="space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      {/* Subject tags */}
      <div className="hidden sm:flex gap-1">
        <Skeleton className="h-5 w-14 rounded-md" />
        <Skeleton className="h-5 w-16 rounded-md" />
        <Skeleton className="h-5 w-12 rounded-md" />
      </div>
      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-8" />
        </div>
        <Skeleton className="h-1.5 w-full rounded-full" />
      </div>
      {/* Enter */}
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

export default function ModulesLoading() {
  return (
    <div className="min-h-screen bg-slate-950 dark:bg-[#07080f] pb-32">
      {/* Hero Skeleton */}
      <div className="relative w-full overflow-hidden">
        <div className="md:hidden absolute inset-0 bg-gradient-to-b from-primary/15 via-primary/5 to-transparent h-[200px] pointer-events-none" />
        <div className="hidden md:block absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-slate-950 dark:from-[#534AB7]/10 dark:to-[#07080f]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 dark:opacity-15 pointer-events-none" />

        <div className="relative z-20 container mx-auto px-4 sm:px-6 pb-6 md:pb-12 pt-4 md:pt-0 md:h-[350px] md:flex md:items-end" aria-busy="true" aria-label="Loading modules">
          <div className="space-y-3 md:space-y-4">
            <Skeleton className="h-5 w-32 rounded-full" />
            <Skeleton className="h-8 md:h-14 w-64 md:w-96" />
            <Skeleton className="h-4 w-72 md:w-96" />
          </div>
        </div>
      </div>

      {/* Dashboard Widgets Skeleton */}
      <div className="container mx-auto px-4 sm:px-6 space-y-8 md:space-y-12">
        <div className="flex md:hidden gap-3 overflow-x-auto no-scrollbar pb-1 pr-4">
          <Skeleton className="h-16 w-[250px] rounded-2xl shrink-0" />
          <Skeleton className="h-16 w-[220px] rounded-2xl shrink-0" />
          <Skeleton className="h-16 w-[200px] rounded-2xl shrink-0" />
        </div>
        <div className="hidden md:grid grid-cols-3 gap-4">
          <Skeleton className="h-28 rounded-[32px]" />
          <Skeleton className="h-28 rounded-[32px]" />
          <Skeleton className="h-28 rounded-[32px]" />
        </div>

        {/* Controls Skeleton */}
        <Skeleton className="h-14 md:h-16 rounded-2xl md:rounded-[28px]" />

        {/* Card Grid */}
        <div className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ModuleCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
