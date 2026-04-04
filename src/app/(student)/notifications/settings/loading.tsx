export default function Loading() {
  return (
    <div className="mx-auto max-w-lg px-4 py-8 md:px-6">
      <div className="mb-8 space-y-2">
        <div className="h-9 w-64 animate-pulse rounded bg-muted" />
        <div className="h-4 w-48 animate-pulse rounded bg-muted" />
      </div>
      <div className="space-y-3">
        {[0, 1].map(i => (
          <div key={i} className="flex items-center justify-between rounded-xl border border-border px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 animate-pulse rounded-lg bg-muted" />
              <div className="space-y-1.5">
                <div className="h-4 w-36 animate-pulse rounded bg-muted" />
                <div className="h-3 w-48 animate-pulse rounded bg-muted" />
              </div>
            </div>
            <div className="h-6 w-11 animate-pulse rounded-full bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
