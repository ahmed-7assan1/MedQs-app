import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Offline",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-background px-6 py-16 text-center">
      <p className="text-xs font-semibold uppercase tracking-widest text-primary">MedOneX</p>
      <h1 className="font-display text-2xl font-bold text-foreground">You&apos;re offline</h1>
      <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
        Check your connection. Cached pages may still work; try again when you&apos;re back online.
      </p>
      <Link
        href="/"
        className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        Try again
      </Link>
    </div>
  );
}
