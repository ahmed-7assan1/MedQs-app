export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6 space-y-3">
      <div className="mb-8 h-9 w-40 animate-pulse rounded-lg bg-muted" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 animate-pulse rounded-lg bg-muted" />
            <div className="space-y-2">
              <div className="h-4 w-48 animate-pulse rounded bg-muted" />
              <div className="h-3 w-32 animate-pulse rounded bg-muted" />
            </div>
          </div>
          <div className="h-9 w-20 animate-pulse rounded-lg bg-muted" />
        </div>
      ))}
    </div>
  );
}
