import { PastPaperListSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function PastPapersLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
      <div className="mb-8" aria-hidden>
        <Skeleton className="h-9 w-48 md:h-10" />
        <Skeleton className="mt-2 h-4 w-56" />
      </div>
      <PastPaperListSkeleton count={6} />
    </div>
  );
}
