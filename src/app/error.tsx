"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Home } from "lucide-react";

/**
 * Root error boundary — required so Next.js always has a valid error UI under `app/layout`.
 * Nested `(student)/error.tsx` handles most in-app pages; this catches the rest (e.g. auth, landing).
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[MedQs]", error);
  }, [error]);

  const message = error instanceof Error ? error.message : String(error ?? "Unknown error");

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <h1 className="font-display text-xl font-semibold text-foreground">حدث خطأ</h1>
      <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
        تعذّر تحميل هذا الجزء. جرّب الزر أدناه أو حدّث الصفحة.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          إعادة المحاولة
        </button>
        <Link
          href="/dashboard-app"
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Home className="h-4 w-4" aria-hidden />
          Dashboard
        </Link>
      </div>
      {process.env.NODE_ENV === "development" && message ? (
        <pre className="mt-2 max-h-40 max-w-lg overflow-auto rounded-lg border border-border bg-muted/50 p-3 text-left text-xs text-muted-foreground">
          {message}
        </pre>
      ) : null}
    </div>
  );
}
