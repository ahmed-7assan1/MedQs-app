"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface CarouselAd {
  id: string;
  imageUrl: string;
  linkUrl?: string | null;
}

interface BannerCarouselProps {
  ads: CarouselAd[];
}

export function BannerCarousel({ ads }: BannerCarouselProps) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % ads.length);
  }, [ads.length]);

  const goTo = useCallback((idx: number) => {
    setCurrent(idx);
  }, []);

  useEffect(() => {
    if (ads.length <= 1) return;
    timerRef.current = setInterval(next, 5000);
    return () => clearInterval(timerRef.current);
  }, [ads.length, next]);

  if (!ads.length) return null;

  const ad = ads[current];

  const inner = (
    <div className="relative w-full h-full overflow-hidden">
      {ads.map((a, idx) => (
        <div
          key={a.id}
          className={cn(
            "absolute inset-0 transition-opacity duration-700",
            idx === current ? "opacity-100 z-10" : "opacity-0 z-0"
          )}
        >
          <Image
            src={a.imageUrl}
            alt=""
            fill
            className="object-cover"
            priority={idx === 0}
            sizes="(max-width: 768px) 100vw, (max-width: 1440px) 90vw, 1440px"
          />
        </div>
      ))}

      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-20" />

      {ads.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-30">
          {ads.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goTo(idx)}
              className={cn(
                "rounded-full transition-all duration-300",
                idx === current
                  ? "w-6 h-1.5 bg-white"
                  : "w-1.5 h-1.5 bg-white/40 hover:bg-white/60"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="relative w-full h-[180px] md:h-[220px] lg:h-[280px] rounded-2xl overflow-hidden shadow-lg bg-muted">
      {ad.linkUrl ? (
        <Link href={ad.linkUrl} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
          {inner}
        </Link>
      ) : (
        inner
      )}
    </div>
  );
}
