"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Home } from "lucide-react";

/** Catches runtime errors in student pages (not the layout). Shows UI instead of a blank screen. */
export default function StudentSegmentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[MedQs student page]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-display text-xl font-semibold text-foreground">تعذّر تحميل الصفحة</h1>
      <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
        حدث خطأ أثناء عرض المحتوى. إذا استمرت المشكلة، تحقق من اتصال الإنترنت أو من أن خادم قاعدة البيانات يعمل، ثم أعد المحاولة.
      </p>
      {process.env.NODE_ENV === "development" && error.message ? (
        <pre className="max-w-lg overflow-x-auto rounded-lg border border-border bg-muted/50 p-3 text-left text-xs text-muted-foreground">
          {error.message}
        </pre>
      ) : null}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
    </div>
  );
}
