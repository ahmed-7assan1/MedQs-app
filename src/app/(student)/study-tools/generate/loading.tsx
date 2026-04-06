import { StudentShellHeaderSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function StudyToolsGenerateLoading() {
  return (
    <div className="relative mx-auto w-full max-w-3xl px-4 py-8 md:px-8 md:py-10">
      <StudentShellHeaderSkeleton />
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  );
}
