"use client";

import React, { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

interface InfiniteScrollContainerProps {
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
  endComponent?: React.ReactNode;
  className?: string;
  threshold?: number;
}

/**
 * A reusable container for implementing infinite scrolling with IntersectionObserver.
 * Tracks a hidden sentinel element at the bottom and triggers onLoadMore when visible.
 */
export function InfiniteScrollContainer({
  onLoadMore,
  hasMore,
  isLoading,
  children,
  loadingComponent,
  endComponent,
  className = "",
  threshold = 0.1,
}: InfiniteScrollContainerProps) {
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Trigger if intersecting, has more content, and not currently loading
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          onLoadMore();
        }
      },
      { threshold }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading, onLoadMore, threshold]);

  return (
    <div className={className}>
      {children}
      
      {/* Sentinel / Loading area */}
      <div ref={observerTarget} className="w-full py-8 flex items-center justify-center min-h-[100px]">
        {isLoading ? (
          loadingComponent || (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">
                Fetching more data...
              </p>
            </div>
          )
        ) : !hasMore && endComponent ? (
          endComponent
        ) : null}
      </div>
    </div>
  );
}
