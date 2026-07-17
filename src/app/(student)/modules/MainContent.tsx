"use client";

import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";

export function MainContent({ children }: { children: React.ReactNode }) {
  const { isOpen, isCollapsed } = useSidebar();
  return (
    <main
      className={cn(
        "flex-1 min-w-0 transition-all duration-500 ease-in-out",
        !isOpen ? "lg:ml-0" : isCollapsed ? "lg:ml-16" : "lg:ml-60"
      )}
    >
      {children}
    </main>
  );
}
