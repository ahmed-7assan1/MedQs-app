"use client";

import Link from "next/link";
import { AlertCircle, ArrowRight } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { DashboardData } from "@/types/dashboard";
import { DashboardMobileView } from "./DashboardMobileView";
import { DashboardDesktopView } from "./DashboardDesktopView";
import { useScrollPreservation } from "@/hooks/useScrollPreservation";

export function DashboardShell({ data }: { data: DashboardData }) {
  useScrollPreservation();
  const hasAds = !!data.ads?.length;
  return (
    <div className="min-h-screen text-foreground transition-colors duration-200 selection:bg-primary/30 relative">
      {data.isProfileIncomplete && (
        <Alert className="fixed top-0 left-0 right-0 z-50 rounded-none border-0 bg-primary text-white py-2.5 px-4 md:py-3 md:px-6 flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-2 md:gap-3">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <AlertDescription className="text-[10px] md:text-xs font-black uppercase tracking-widest text-white">
              Complete your academic details to unlock personalized features.
            </AlertDescription>
          </div>
          <Link href="/profile/edit" className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-1.5 bg-white/20 hover:bg-white/30 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all whitespace-nowrap">
            Complete Now <ArrowRight className="h-3 w-3" />
          </Link>
        </Alert>
      )}

      <DashboardMobileView data={data} />
      <DashboardDesktopView data={data} hasAds={hasAds} />
    </div>
  );
}
