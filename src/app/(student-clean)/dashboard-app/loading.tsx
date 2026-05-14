import {
  StudentShellHeaderSkeleton,
  DashboardStatsSkeleton,
  ListCardRowSkeleton,
  Skeleton,
} from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="relative mx-auto w-full max-w-7xl px-4 py-8 md:px-8 md:py-10">
      <StudentShellHeaderSkeleton />
      <DashboardStatsSkeleton />
      <div className="grid gap-8 lg:grid-cols-2">
        <section className="space-y-3">
          <Skeleton className="h-6 w-44" />
          <ListCardRowSkeleton lines={2} />
          <ListCardRowSkeleton lines={2} />
        </section>
        <section className="space-y-3">
          <Skeleton className="h-6 w-40" />
          <ListCardRowSkeleton lines={1} />
          <ListCardRowSkeleton lines={1} />
        </section>
      </div>
    </div>
  );
}
