import { Skeleton } from "@/components/ui/skeletons";

export function ModulesGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="relative flex items-center gap-3 rounded-2xl ring-1 ring-border/60 bg-card p-4"
        >
          <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3.5 w-full" />
            <div className="space-y-1">
              <div className="flex justify-between">
                <Skeleton className="h-2.5 w-16" />
                <Skeleton className="h-2.5 w-8" />
              </div>
              <Skeleton className="h-1.5 w-full rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
