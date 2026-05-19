"use client";

import React from "react";

interface MobileDashboardWrapperProps {
  children: React.ReactNode;
  user?: {
    name: string;
    role: string;
    initial: string;
  };
}

export function MobileDashboardWrapper({ children }: MobileDashboardWrapperProps) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07080f] text-slate-900 dark:text-white selection:bg-[#4f5fff]/30 relative overflow-x-hidden md:hidden transition-colors duration-500">
      {/* ── Main scrollable content ── */}
      {/* pt-20 = header height + spacing | pb-32 = space for floating bottom nav */}
      <main className="pt-20 pb-32 px-4 space-y-6">
        {children}
      </main>
    </div>
  );
}
