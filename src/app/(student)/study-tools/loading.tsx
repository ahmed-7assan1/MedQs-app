import { ListCardRowSkeleton, StudentShellHeaderSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function StudyToolsLoading() {
  return (
    <div className="relative mx-auto w-full max-w-7xl px-4 py-8 md:px-8 md:py-10">
      <StudentShellHeaderSkeleton />
      <Skeleton className="mb-10 h-40 w-full max-w-4xl rounded-2xl" />
      <Skeleton className="mb-6 h-7 w-48" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <ListCardRowSkeleton key={i} lines={3} />
        ))}
      </div>
    </div>
  );
}
