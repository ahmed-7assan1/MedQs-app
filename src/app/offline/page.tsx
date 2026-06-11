import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background text-foreground gap-6 p-8">
      <div className="h-16 w-16 rounded-full bg-muted/30 flex items-center justify-center">
        <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728m-2.829-2.829a5 5 0 000-7.07m-4.243 4.243a1 1 0 010-1.414" />
        </svg>
      </div>
      <h1 className="text-xl font-bold">You&apos;re Offline</h1>
      <p className="text-sm text-muted-foreground text-center max-w-xs">
        Please check your internet connection and try again.
      </p>
      <Link
        href="/splash"
        className="px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-widest hover:bg-primary/90 transition-colors"
      >
        Retry
      </Link>
    </div>
  );
}
