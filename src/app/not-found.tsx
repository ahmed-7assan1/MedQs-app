import Link from "next/link";
import { FileQuestion, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted ring-1 ring-border">
        <FileQuestion className="h-10 w-10 text-muted-foreground" aria-hidden />
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">404</p>
      <h1 className="mt-2 font-display text-4xl font-bold text-foreground">Page not found</h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
        This URL doesn&apos;t match any page. If you&apos;re signed in, open your dashboard from the link below.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/dashboard-app"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Home className="h-4 w-4" aria-hidden />
          Dashboard
        </Link>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
