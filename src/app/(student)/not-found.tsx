import Link from "next/link";
import { FileQuestion, ArrowLeft, Home } from "lucide-react";

export default function StudentNotFound() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted ring-1 ring-border">
        <FileQuestion className="h-8 w-8 text-muted-foreground" aria-hidden />
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">404</p>
      <h1 className="mt-2 font-display text-2xl font-bold text-foreground">Page not found</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        The page you requested doesn&apos;t exist or was moved. Check the link or go back to your dashboard.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/dashboard-app"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Home className="h-4 w-4" aria-hidden />
          Dashboard
        </Link>
        <Link
          href="/social"
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Community
        </Link>
      </div>
    </div>
  );
}
