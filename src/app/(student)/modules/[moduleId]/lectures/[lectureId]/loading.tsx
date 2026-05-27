import { Skeleton } from "@/components/ui/skeleton";

export default function LectureLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-3 pt-4 sm:px-6" aria-busy="true" aria-label="Loading lecture">
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center gap-2 mb-6">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-3" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-3" />
        <Skeleton className="h-3 w-32" />
      </div>

      {/* Hero Section */}
      <div className="rounded-2xl border border-white/[0.02] bg-card overflow-hidden mb-8">
        <Skeleton className="h-48 md:h-64 w-full" />
        <div className="p-4 md:p-6 space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 md:h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>

      {/* Content Sections */}
      <div className="space-y-8">
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-white/[0.02] bg-card p-4 space-y-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Video Player Skeleton */}
      <div className="mt-8 rounded-2xl border border-white/[0.02] bg-card overflow-hidden">
        <Skeleton className="aspect-video w-full" />
        <div className="p-4 space-y-3">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  );
}
