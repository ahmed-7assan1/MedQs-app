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
    <div className="min-h-screen bg-[#09080F] text-white selection:bg-primary/30 relative overflow-x-hidden md:hidden">
      {children}
    </div>
  );
}
