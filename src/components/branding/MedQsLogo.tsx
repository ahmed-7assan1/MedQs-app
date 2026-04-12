"use client";

import { cn } from "@/lib/utils";
import { useSiteConfig } from "@/contexts/SiteConfigContext";

type LogoVariant = "default" | "onDark";

/** FALLBACK static path — used when no logo URL is stored in DB yet */
const STATIC_LOGO = "/logo.png.png";

/**
 * MedQsLogoMark — reads the logo URL from SiteConfigContext (set by admin).
 * Falls back to /logo.png.png.
 * In light mode the logo gets a white bg chip so transparent-bg PNGs look clean.
 * In dark mode it renders as-is.
 */
export function MedQsLogoMark({
  className,
  title,
  variant = "default",
}: {
  className?: string;
  title?: string;
  variant?: LogoVariant;
}) {
  const { logoUrl, siteName } = useSiteConfig();
  const src = logoUrl?.trim() || STATIC_LOGO;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-lg",
        // White background chip — visible only in light mode so PNG transparency looks right.
        // In dark mode we rely on the logo having its own dark-friendly design.
        "bg-white dark:bg-transparent",
        className
      )}
    >
      <img
        src={src}
        alt={title ?? siteName ?? "MedQs"}
        className="h-full w-full object-contain"
        referrerPolicy="no-referrer"
      />
    </span>
  );
}

/** Wordmark — hidden because the new logo image already contains the text. */
export function MedQsWordmark({
  className,
  variant = "default",
}: {
  className?: string;
  variant?: LogoVariant;
}) {
  // Logo image already contains "MedQs" text — no need to render duplicate text.
  return null;
}

/** Full lockup (icon + optional tagline) used on landing / auth screens. */
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
  const { logoUrl, siteName } = useSiteConfig();
  const src = logoUrl?.trim() || STATIC_LOGO;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        className
      )}
    >
      <div className={cn("flex items-center justify-center rounded-2xl bg-white p-2 shadow-sm dark:bg-white/5", iconClassName)}>
        <img
          src={src}
          alt={siteName ?? "MedQs"}
          className="w-[200px] max-w-full object-contain"
          referrerPolicy="no-referrer"
        />
      </div>
      {showTagline && (
        <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Medical Education Platform
        </p>
      )}
    </div>
  );
}
