"use client";
import { cn } from "@/lib/utils";

interface StickyActionBarProps {
  children: React.ReactNode;
  className?: string;
}

export function StickyActionBar({ children, className }: StickyActionBarProps) {
  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40",
        "bg-gradient-to-t from-[#09080F] via-[#09080F]/95 to-transparent",
        "pb-[calc(5.85rem+env(safe-area-inset-bottom,0px))] pt-6 px-4",
        className
      )}
    >
      {children}
    </div>
  );
}
