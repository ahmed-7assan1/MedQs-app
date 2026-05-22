"use client";
import { useRef, useState } from "react";
import { motion, useMotionValue, useTransform, animate, PanInfo } from "framer-motion";
import { cn } from "@/lib/utils";

interface SwipeCarouselProps {
  items: React.ReactNode[];
  className?: string;
  itemWidth?: number;
  gap?: number;
  showArrows?: boolean;
}

export function SwipeCarousel({
  items, className, itemWidth = 240, gap = 12, showArrows = false,
}: SwipeCarouselProps) {
  const [idx, setIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);

  function goTo(i: number) {
    const clamped = Math.max(0, Math.min(i, items.length - 1));
    animate(x, -clamped * (itemWidth + gap), { type: "spring", stiffness: 300, damping: 30 });
    setIdx(clamped);
  }

  function handleDragEnd(_: any, info: PanInfo) {
    const threshold = 50;
    if (info.offset.x < -threshold) goTo(idx + 1);
    else if (info.offset.x > threshold) goTo(idx - 1);
  }

  return (
    <div className={cn("relative", className)}>
      <div ref={containerRef} className="overflow-hidden" style={{ maskImage: "linear-gradient(to right, black 85%, transparent 98%)", WebkitMaskImage: "linear-gradient(to right, black 85%, transparent 98%)" }}>
        <motion.div
          className="flex"
          style={{ x, gap }}
          drag="x"
          dragConstraints={containerRef}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
        >
          {items.map((item, i) => (
            <div key={i} style={{ minWidth: itemWidth }} className="shrink-0">
              {item}
            </div>
          ))}
        </motion.div>
      </div>
      {showArrows && items.length > 1 && (
        <div className="flex justify-center gap-2 mt-3">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === idx ? "w-6 bg-primary" : "w-1.5 bg-white/20"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
