"use client";
import { cn } from "@/lib/utils";

interface SkeletonLoaderProps {
  className?: string;
  variant?: "card" | "text" | "circle" | "rect";
  width?: string;
  height?: string;
}

export function SkeletonLoader({ className, variant = "text", width, height }: SkeletonLoaderProps) {
  const base = "relative overflow-hidden bg-white/[0.04] rounded-xl";
  const shimmer = "before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r before:from-transparent before:via-white/[0.04] before:to-transparent before:animate-[shimmer_1.5s_infinite]";

  const variants = {
    card: "h-32 w-full rounded-2xl",
    text: "h-4 w-full",
    circle: "h-10 w-10 rounded-full",
    rect: "h-20 w-full",
  };

  return (
    <div
      className={cn(base, shimmer, variants[variant], className)}
      style={{ width, height }}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="space-y-3 p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
      <div className="flex items-center gap-3">
        <SkeletonLoader variant="circle" className="h-10 w-10" />
        <div className="flex-1 space-y-2">
          <SkeletonLoader className="h-4 w-3/4" />
          <SkeletonLoader className="h-3 w-1/2" />
        </div>
      </div>
      <SkeletonLoader variant="rect" className="h-24" />
      <div className="flex gap-2">
        <SkeletonLoader className="h-8 w-20" />
        <SkeletonLoader className="h-8 w-20" />
      </div>
    </div>
  );
}

export function PageSkeleton({ lines = 6 }: { lines?: number }) {
  return (
    <div className="space-y-4 p-4">
      <SkeletonLoader className="h-8 w-1/2" />
      <SkeletonLoader className="h-4 w-3/4" />
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLoader key={i} className="h-20 w-full" />
      ))}
    </div>
  );
}
