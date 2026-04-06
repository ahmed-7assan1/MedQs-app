import { Skeleton } from "@/components/ui/skeleton";

export default function SpaceLoading() {
  return (
    <div
      className="flex min-h-[70vh] flex-col gap-4 p-4 md:p-6"
      aria-busy="true"
      aria-label="Loading study space"
    >
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-10 w-32 rounded-lg" />
        <Skeleton className="h-10 w-36 rounded-lg" />
        <Skeleton className="h-10 w-28 rounded-lg" />
      </div>
      <Skeleton className="min-h-[52vh] flex-1 rounded-2xl border border-border/60" />
    </div>
  );
}
