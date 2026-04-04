"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

type LogoVariant = "default" | "onDark";

/**
 * Vector MedQs emblem: broken ring, DNA strands, arrow with cross + heart, magnifier.
 * Colors come from `.medqs-logo` / `.medqs-logo--onDark` in globals.css.
 */
export function MedQsLogoMark({
  className,
  title,
  variant = "default",
}: {
  className?: string;
  /** Accessible label (e.g. site name) */
  title?: string;
  variant?: LogoVariant;
}) {
  const raw = useId().replace(/:/g, "");
  const g = {
    ring: `ml-${raw}-ring`,
    arrow: `ml-${raw}-arrow`,
    dna: `ml-${raw}-dna`,
    glass: `ml-${raw}-glass`,
  };

  return (
    <svg
      className={cn(
        "medqs-logo shrink-0 overflow-visible",
        variant === "onDark" && "medqs-logo--on-dark",
        className
      )}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title ?? "MedQs"}
    >
      <title>{title ?? "MedQs"}</title>
      <defs>
        <linearGradient id={g.ring} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--ml-ring-hi)" />
          <stop offset="55%" stopColor="var(--ml-sky)" />
          <stop offset="100%" stopColor="var(--ml-ring-lo)" />
        </linearGradient>
        <linearGradient id={g.arrow} x1="20%" y1="100%" x2="80%" y2="0%">
          <stop offset="0%" stopColor="var(--ml-deep)" />
          <stop offset="45%" stopColor="var(--ml-mid)" />
          <stop offset="100%" stopColor="var(--ml-cyan)" />
        </linearGradient>
        <linearGradient id={g.dna} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--ml-navy)" />
          <stop offset="100%" stopColor="var(--ml-sky)" />
        </linearGradient>
        <linearGradient id={g.glass} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--ml-cyan)" />
          <stop offset="100%" stopColor="var(--ml-mid)" />
        </linearGradient>
      </defs>

      {/* Broken ring — gap ~7 o'clock for DNA */}
      <circle
        cx="50"
        cy="50"
        r="33.5"
        stroke={`url(#${g.ring})`}
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray="178 48"
        transform="rotate(128 50 50)"
      />

      {/* DNA double helix (enters from gap) */}
      <path
        d="M 14 78 C 22 68, 28 62, 36 54 C 44 46, 48 42, 52 36"
        stroke={`url(#${g.dna})`}
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity="0.92"
      />
      <path
        d="M 20 84 C 28 74, 34 68, 42 60 C 50 52, 52 48, 56 42"
        stroke={`url(#${g.dna})`}
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity="0.65"
      />
      <path
        d="M 18 81 L 22 77 M 24 75 L 28 71 M 32 66 L 36 62 M 40 58 L 44 54"
        stroke="var(--ml-ring-hi)"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.5"
      />

      {/* Arrow body + head */}
      <path
        d="M 50 15 L 64 54 L 56 54 L 56 78 L 44 78 L 44 54 L 36 54 Z"
        fill={`url(#${g.arrow})`}
        stroke="var(--ml-navy)"
        strokeWidth="0.35"
        strokeOpacity="0.35"
      />

      {/* Soft highlight on arrow */}
      <path
        d="M 50 18 L 60 50 L 54 50 L 52 44 Z"
        fill="var(--ml-cyan)"
        fillOpacity="0.22"
      />

      {/* Medical cross */}
      <path
        d="M 50 26 V 38 M 44 32 H 56"
        stroke="var(--ml-cross)"
        strokeWidth="3.2"
        strokeLinecap="round"
      />

      {/* Heart inside cross (scaled MD-style heart, centered on cross) */}
      <g transform="translate(47.72 29.91) scale(0.19)">
        <path
          fill="var(--ml-heart)"
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        />
      </g>

      {/* Magnifying glass at helix / shaft junction */}
      <circle
        cx="33"
        cy="61"
        r="5.5"
        stroke={`url(#${g.glass})`}
        strokeWidth="2.2"
        fill="var(--ml-glass-fill)"
        fillOpacity="0.25"
      />
      <path
        d="M 37 65 L 44 72"
        stroke="var(--ml-mid)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** “Med” + “Qs” wordmark only (nav / footer). */
export function MedQsWordmark({
  className,
  variant = "default",
}: {
  className?: string;
  variant?: LogoVariant;
}) {
  return (
    <span
      className={cn(
        "medqs-logo font-display font-bold tracking-tight",
        variant === "onDark" && "medqs-logo--on-dark",
        className
      )}
    >
      <span className="text-[var(--ml-text-med)]">Med</span>
      <span className="text-[var(--ml-text-qs)]">Qs</span>
    </span>
  );
}

/** Icon + MedQs split colors + optional tagline (for auth / marketing). */
export function MedQsLogoLockup({
  className,
  showTagline = true,
  variant = "default",
  iconClassName,
}: {
  className?: string;
  showTagline?: boolean;
  variant?: LogoVariant;
  iconClassName?: string;
}) {
  return (
    <div
      className={cn(
        "medqs-logo flex flex-col items-center text-center",
        variant === "onDark" && "medqs-logo--on-dark",
        className
      )}
    >
      <MedQsLogoMark className={cn("mb-3 h-14 w-14", iconClassName)} variant={variant} />
      <MedQsWordmark className="text-3xl" variant={variant} />
      {showTagline ? (
        <p
          className="mt-2 max-w-[16rem] text-[10px] font-semibold uppercase leading-snug tracking-[0.2em] text-[var(--ml-tagline)]"
        >
          Medical education platform
        </p>
      ) : null}
    </div>
  );
}
