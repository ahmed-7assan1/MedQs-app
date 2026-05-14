"use client";

import React, { useState } from "react";
import { 
  MobileTopBar, 
  MobileSidebar, 
  MobileBottomNav 
} from "./MobileDashboardComponents";

interface MobileDashboardWrapperProps {
  children: React.ReactNode;
  user: {
    name: string;
    role: string;
    initial: string;
  };
}

export const MobileDashboardWrapper = ({ children, user }: MobileDashboardWrapperProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="md:hidden min-h-screen bg-[#07080f] text-white relative overflow-x-hidden">
      {/* Sidebar */}
      <MobileSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        user={user}
      />

      {/* Top Bar */}
      <MobileTopBar 
        userInitial={user.initial} 
        onMenuOpen={() => setIsSidebarOpen(true)} 
      />

      {/* Main Content */}
      <main className="pt-[72px] pb-[100px] px-4 space-y-7">
        {children}
      </main>

      {/* Bottom Nav */}
      <MobileBottomNav />
    </div>
  );
};
