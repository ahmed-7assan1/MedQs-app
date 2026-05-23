import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-primary/10", className)}
      {...props}
    />
  )
}

export { Skeleton }

/** Forum / feed style post card skeleton */
export function ForumPostCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-[92%]" />
        <Skeleton className="h-3 w-[78%]" />
      </div>
      <div className="mt-4 flex gap-3 border-t border-border pt-3">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
  );
}

export function ForumPostListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading posts">
      {Array.from({ length: count }).map((_, i) => (
        <ForumPostCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function StudentShellHeaderSkeleton({ withSubtitle = true }: { withSubtitle?: boolean }) {
  return (
    <header className="mb-8 md:mb-10" aria-hidden>
      <Skeleton className="h-3 w-28" />
      <Skeleton className="mt-3 h-9 w-56 max-w-full md:h-10 md:w-72" />
      {withSubtitle ? <Skeleton className="mt-3 h-4 w-full max-w-xl" /> : null}
      <div
        className="mt-6 h-px w-full max-w-lg bg-gradient-to-r from-primary/25 via-border/80 to-transparent"
        aria-hidden
      />
    </header>
  );
}

export function DashboardStatsSkeleton() {
  return (
    <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4" aria-hidden>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-2 h-8 w-16" />
          <Skeleton className="mt-2 h-3 w-28" />
        </div>
      ))}
    </div>
  );
}

export function ListCardRowSkeleton({ lines = 2 }: { lines?: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-5 w-48 max-w-[85%]" />
          {Array.from({ length: lines }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-full max-w-md" />
          ))}
        </div>
        <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
      </div>
    </div>
  );
}

export function ModuleListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading modules">
      {Array.from({ length: count }).map((_, i) => (
        <ListCardRowSkeleton key={i} lines={3} />
      ))}
    </div>
  );
}

export function PastPaperListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading past papers">
      {Array.from({ length: count }).map((_, i) => (
        <ListCardRowSkeleton key={i} lines={2} />
      ))}
    </div>
  );
}

export function LeaderboardSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:px-6" aria-busy="true" aria-label="Loading leaderboard">
      <div className="mb-6 flex justify-center gap-2">
        <Skeleton className="h-9 w-28 rounded-full" />
        <Skeleton className="h-9 w-28 rounded-full" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
            <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-5 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}
