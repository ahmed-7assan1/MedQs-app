"use client";

import { useState, useRef, useCallback } from "react";

interface ImageCarouselProps {
  images: { url: string; caption?: string }[];
}

export function ImageCarousel({ images }: ImageCarouselProps) {
  const [index, setIndex] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.offsetWidth);
    setIndex(idx);
  }, []);

  if (images.length === 0) return null;

  return (
    <div className="relative overflow-hidden rounded-xl" style={{ maxHeight: 360 }}>
      <div
        ref={ref}
        onScroll={handleScroll}
        className="community-swipe-container"
      >
        {images.map((img, i) => (
          <div key={i} className="community-swipe-slide relative">
            <img
              src={img.url}
              alt={img.caption || ""}
              className="w-full object-cover select-none pointer-events-none"
              style={{ maxHeight: 360, minHeight: 200, background: "var(--bg-secondary)" }}
              draggable={false}
            />
            {img.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                <span className="text-xs text-white/70">{img.caption}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <>
          <div className="absolute top-3 right-3 community-glass-card rounded-full px-2 py-0.5 text-xs tabular-nums font-medium" style={{ color: "var(--text-primary)" }}>
            {index + 1} / {images.length}
          </div>
          <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-1">
            {images.map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === index ? 18 : 6,
                  height: 4,
                  background: i === index ? "var(--brand)" : "rgba(255,255,255,0.4)",
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
