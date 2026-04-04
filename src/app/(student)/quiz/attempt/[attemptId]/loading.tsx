export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <div className="mb-6 h-4 w-32 animate-pulse rounded bg-muted" />
      <div className="mb-2 h-8 w-64 animate-pulse rounded bg-muted" />
      <div className="mb-6 h-4 w-40 animate-pulse rounded bg-muted" />
      <div className="mb-8 flex flex-col items-center rounded-2xl bg-muted/30 p-8 gap-3">
        <div className="h-16 w-28 animate-pulse rounded bg-muted" />
        <div className="h-4 w-48 animate-pulse rounded bg-muted" />
        <div className="flex gap-6">
          <div className="h-4 w-20 animate-pulse rounded bg-muted" />
          <div className="h-4 w-20 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="mb-8 flex gap-3">
        <div className="h-10 w-28 animate-pulse rounded-xl bg-muted" />
        <div className="h-10 w-24 animate-pulse rounded-xl bg-muted" />
      </div>
      <div className="mb-4 h-6 w-36 animate-pulse rounded bg-muted" />
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="h-11 w-full animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
