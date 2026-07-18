"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Defaults: MedOneX brand colours ─── */
const DEFAULT_GLOW: [string, string] = ["#4f46e5", "#06b6d4"];

interface AmbientVideoWrapperProps {
  /** Full URL of the thumbnail image used for colour extraction.
   *  Pass `null` for non-YouTube sources → falls back to brand colours. */
  thumbSrc: string | null;
  children: React.ReactNode;
  className?: string;
}

/**
 * AmbientVideoWrapper
 *
 * Wraps any video element with a dynamic ambient glow effect.
 * Colour is extracted from the video thumbnail using a hidden <canvas>,
 * matching the YouTube Preview project's implementation exactly.
 *
 * Usage:
 *   <AmbientVideoWrapper thumbSrc={ytThumbUrl}>
 *     <VidStackPlayer url={...} />
 *   </AmbientVideoWrapper>
 */
export function AmbientVideoWrapper({
  thumbSrc,
  children,
  className,
}: AmbientVideoWrapperProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [glow, setGlow] = useState<[string, string]>(DEFAULT_GLOW);
  const [ambientOn, setAmbientOn] = useState(true);

  const effectiveThumbSrc = thumbSrc || "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

  /* ── Colour extraction logic (ported from YouTube Preview index.tsx) ── */
  useEffect(() => {
    const img = imgRef.current;
    if (!img) {
      setGlow(DEFAULT_GLOW);
      return;
    }

    const extract = () => {
      try {
        const c = document.createElement("canvas");
        const W = (c.width = 32);
        const H = (c.height = 18);
        const ctx = c.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, W, H);
        const data = ctx.getImageData(0, 0, W, H).data;

        /**
         * Average colour of a rectangular region.
         * Skips near-black (max < 30) and near-grey (max - min < 15)
         * pixels so we always get a vibrant accent colour.
         */
        const avg = (
          x0: number,
          y0: number,
          x1: number,
          y1: number
        ): string => {
          let r = 0,
            g = 0,
            b = 0,
            n = 0;
          for (let y = y0; y < y1; y++) {
            for (let x = x0; x < x1; x++) {
              const i = (y * W + x) * 4;
              const R = data[i],
                G = data[i + 1],
                B = data[i + 2];
              const max = Math.max(R, G, B),
                min = Math.min(R, G, B);
              // skip near-black / near-grey
              if (max < 30 || max - min < 15) continue;
              r += R;
              g += G;
              b += B;
              n++;
            }
          }
          if (!n) return DEFAULT_GLOW[0];
          return `rgb(${(r / n) | 0},${(g / n) | 0},${(b / n) | 0})`;
        };

        /* Sample left half → colour 1,  right half → colour 2 */
        const left = avg(0, 0, W / 2, H);
        const right = avg(W / 2, 0, W, H);
        setGlow([left, right]);
      } catch {
        /* CORS or canvas security error — silently keep defaults */
      }
    };

    if (img.complete && img.naturalWidth) {
      extract();
    } else {
      img.addEventListener("load", extract, { once: true });
    }

    return () => img.removeEventListener("load", extract);
  }, [effectiveThumbSrc]);

  return (
    /* overflow-visible so the glow bleeds outside the player bounds */
    <div className={cn("relative isolate", className)}>
      {/* ── AMBIENT GLOW LAYER (z-index below video) ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-8 -z-0 rounded-[32px] blur-3xl transition-all duration-1000"
        style={{
          opacity: ambientOn ? 0.75 : 0,
          background: `
            radial-gradient(60% 80% at 20% 30%, ${glow[0]} 0%, transparent 60%),
            radial-gradient(60% 80% at 80% 70%, ${glow[1]} 0%, transparent 60%)
          `,
        }}
      />

      {/* ── VIDEO CONTENT ── */}
      {children}

      {/* ── AMBIENT TOGGLE BUTTON (inside player, bottom-right) ── */}
      <button
        onClick={() => setAmbientOn((v) => !v)}
        className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white backdrop-blur-sm transition-colors hover:bg-black/80"
        title="Toggle ambient glow"
        aria-label={ambientOn ? "Turn off ambient glow" : "Turn on ambient glow"}
      >
        <Sparkles className="h-3.5 w-3.5" />
        Ambient {ambientOn ? "on" : "off"}
      </button>

      {/* ── HIDDEN IMG FOR COLOUR EXTRACTION (CORS-enabled) ── */}
      <img
        ref={imgRef}
        src={effectiveThumbSrc}
        alt=""
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
        className="hidden"
      />
    </div>
  );
}
