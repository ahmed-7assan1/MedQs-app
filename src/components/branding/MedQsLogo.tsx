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
  style,
}: {
  className?: string;
  title?: string;
  variant?: LogoVariant;
  style?: React.CSSProperties;
}) {
  const { logoUrl, logoUrlDark, siteName } = useSiteConfig();
  const srcLight = logoUrl?.trim() || STATIC_LOGO;
  const srcDark = logoUrlDark?.trim() || srcLight;

  return (
    <span
      style={style}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full",
        className
      )}
    >
      {/* Light Mode Logo */}
      <img
        src={srcLight}
        alt={title ?? siteName ?? "MedQs"}
        className="h-full w-full object-contain dark:hidden"
        referrerPolicy="no-referrer"
      />
      {/* Dark Mode Logo */}
      <img
        src={srcDark}
        alt={title ?? siteName ?? "MedQs"}
        className="h-full w-full object-contain hidden dark:block"
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
      <div className={cn("flex items-center justify-center", iconClassName)}>
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
