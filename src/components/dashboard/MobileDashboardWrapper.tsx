"use client";

import React from "react";

interface MobileDashboardWrapperProps {
  children: React.ReactNode;
  user?: {
    name: string;
    role: string;
    initial: string;
  };
  alert?: React.ReactNode;
}

export function MobileDashboardWrapper({ children, user, alert }: MobileDashboardWrapperProps) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07080f] text-slate-900 dark:text-white selection:bg-[#4f5fff]/30 relative overflow-x-hidden md:hidden transition-colors duration-500">
      {alert && <div className="px-4 py-2">{alert}</div>}
      <main className="px-4 py-4 space-y-6 min-h-0">
        {children}
      </main>
    </div>
  );
}