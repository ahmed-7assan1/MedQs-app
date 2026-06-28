"use client";

import Link from "next/link";
import { ArrowRight, AlertCircle } from "lucide-react";
import type { DashboardData } from "@/types/dashboard";
import { DashboardMobileView } from "./DashboardMobileView";
import { DashboardDesktopView } from "./DashboardDesktopView";

export function DashboardShell({ data }: { data: DashboardData }) {
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200 selection:bg-primary/30 relative">
      {data.isProfileIncomplete && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-primary text-white py-2.5 px-4 md:py-3 md:px-6 flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-2 md:gap-3">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">
              Complete your academic details to unlock personalized features.
            </span>
          </div>
          <Link href="/profile/edit" className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-1.5 bg-white/20 hover:bg-white/30 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all whitespace-nowrap">
            Complete Now <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.15] dark:opacity-[0.25] max-md:opacity-[0.08] max-md:dark:opacity-[0.12]"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 0% 0%, #E7D6FF 0%, #B36BFF 25%, #7C3AED 45%, transparent 70%)",
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-0 dark:opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: "128px 128px",
        }}
      />

      <DashboardMobileView data={data} />
      <DashboardDesktopView data={data} />
    </div>
  );
}
