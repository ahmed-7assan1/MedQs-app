"use client";
import Link from "next/link";
import { Sparkles } from "lucide-react";

/** Floating Dr. Q entry on dashboard only. */
export function DashboardDrQFab({ isAdmin = false }: { isAdmin?: boolean }) {
  // Hide Dr. Q FAB if admin shield is present to avoid clutter on mobile
  if (isAdmin) return null;

  return (
    <Link
      href="/ai-chat"
      className="fixed z-[132] flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-2 ring-background transition hover:scale-105 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 max-md:right-4 max-md:bottom-[calc(80px+env(safe-area-inset-bottom,16px))] md:bottom-8 md:right-8"
      aria-label="Open Dr. Q study assistant"
    >
      <div className="ai-glow-orb absolute h-full w-full opacity-40" />
      <Sparkles className="h-6 w-6 relative z-10" aria-hidden />
    </Link>
  );
}
