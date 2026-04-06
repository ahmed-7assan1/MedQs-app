import { ForumPostCardSkeleton, Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function ForumPostLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <Link
        href="/forum"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to forum
      </Link>
      <ForumPostCardSkeleton />
      <div className="mt-6 space-y-3 border-t border-border pt-6" aria-hidden>
        <Skeleton className="h-4 w-28" />
        <div className="flex gap-2">
          <Skeleton className="h-7 w-7 rounded-full" />
          <Skeleton className="h-16 flex-1 rounded-xl" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-7 w-7 rounded-full" />
          <Skeleton className="h-12 flex-1 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
