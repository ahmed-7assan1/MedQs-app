import { ForumPostListSkeleton } from "@/components/ui/skeleton";

export default function ForumLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div className="h-9 w-32 animate-pulse rounded-lg bg-muted" aria-hidden />
        <div className="h-10 w-10 shrink-0 animate-pulse rounded-lg bg-muted" aria-hidden />
      </div>
      <ForumPostListSkeleton count={5} />
    </div>
  );
}
