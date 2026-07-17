"use client";

import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";

export default function PageContainer({ children }: { children: React.ReactNode }) {
  const { isOpen, isCollapsed } = useSidebar();
  return (
    <div
      className={cn(
        "mx-auto px-6 pb-6 pt-[72px] transition-all duration-500 ease-in-out",
        isOpen && !isCollapsed
          ? "max-w-[1240px]"
          : isOpen && isCollapsed
            ? "max-w-[1360px]"
            : "max-w-[1520px]"
      )}
    >
      {children}
    </div>
  );
}
