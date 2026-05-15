"use client";

import React, { useState } from "react";
import { MobileTopBar, MobileSidebar } from "./MobileDashboardComponents";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";

interface MobileDashboardWrapperProps {
  children: React.ReactNode;
  user: {
    name: string;
    role: string;
    initial: string;
  };
}

export function MobileDashboardWrapper({ children, user }: MobileDashboardWrapperProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#07080f] text-white selection:bg-[#4f5fff]/30 relative overflow-x-hidden md:hidden">
      {/* 1. STICKY TOP BAR */}
      <MobileTopBar 
        userInitial={user.initial} 
        onMenuOpen={() => setIsMenuOpen(true)} 
      />

      {/* 2. SIDEBAR (DRAWER) */}
      <MobileSidebar 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        user={user}
      />

      {/* 3. MAIN CONTENT */}
      {children}

      {/* 4. BOTTOM NAVIGATION */}
      <MobileBottomNav />
    </div>
  );
}
