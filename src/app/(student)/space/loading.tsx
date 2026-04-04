export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      <div className="mb-8 h-9 w-36 animate-pulse rounded bg-muted" />
      <div className="grid gap-6 md:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-6">
            <div className="mb-6 h-6 w-32 animate-pulse rounded bg-muted" />
            <div className="flex justify-center">
              <div className="h-48 w-48 animate-pulse rounded-full bg-muted" />
            </div>
            <div className="mt-6 flex justify-center gap-3">
              <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
              <div className="h-14 w-14 animate-pulse rounded-full bg-muted" />
              <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
