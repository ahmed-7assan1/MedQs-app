"use client";

import { cn } from "@/lib/utils";
import { useSiteConfig } from "@/contexts/SiteConfigContext";

type LogoVariant = "default" | "onDark";

/** FALLBACK static path — used when no logo URL is stored in DB yet */
const STATIC_LOGO = "/logo.png";

/**
 * MedOneXLogoMark — reads the logo URL from SiteConfigContext (set by admin).
 * Falls back to /logo.png.
 * In light mode the logo gets a white bg chip so transparent-bg PNGs look clean.
 * In dark mode it renders as-is.
 */
export function MedQsLogoMark({
  className,
  title,
  variant = "default",
  style,
  interactiveColor = false,
}: {
  className?: string;
  title?: string;
  variant?: LogoVariant;
  style?: React.CSSProperties;
  interactiveColor?: boolean;
}) {
  const { logoUrl, logoUrlDark, siteName } = useSiteConfig();
  const srcLight = logoUrl?.trim() || STATIC_LOGO;
  const srcDark = logoUrlDark?.trim() || srcLight;

  if (interactiveColor) {
    return (
      <span
        style={style}
        className={cn(
          "inline-flex shrink-0 items-center justify-center relative",
          className
        )}
      >
        <span 
          className="absolute inset-0 bg-current dark:hidden transition-colors duration-300"
          style={{ 
             maskImage: `url(${srcLight})`, 
             maskSize: 'contain', 
             maskRepeat: 'no-repeat', 
             maskPosition: 'center', 
             WebkitMaskImage: `url(${srcLight})`, 
             WebkitMaskSize: 'contain', 
             WebkitMaskRepeat: 'no-repeat', 
             WebkitMaskPosition: 'center' 
          }}
        />
        <span 
          className="absolute inset-0 bg-current hidden dark:block transition-colors duration-300"
          style={{ 
             maskImage: `url(${srcDark})`, 
             maskSize: 'contain', 
             maskRepeat: 'no-repeat', 
             maskPosition: 'center', 
             WebkitMaskImage: `url(${srcDark})`, 
             WebkitMaskSize: 'contain', 
             WebkitMaskRepeat: 'no-repeat', 
             WebkitMaskPosition: 'center' 
          }}
        />
      </span>
    );
  }

  return (
    <span
      style={style}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full overflow-hidden",
        className
      )}
    >
      {/* Light Mode Logo */}
      <img
        src={srcLight}
        alt={title ?? siteName ?? "MedOneX"}
        className="h-full w-full max-h-full max-w-full object-contain dark:hidden transition-transform hover:scale-110 duration-300"
        referrerPolicy="no-referrer"
      />
      {/* Dark Mode Logo */}
      <img
        src={srcDark}
        alt={title ?? siteName ?? "MedOneX"}
        className="h-full w-full max-h-full max-w-full object-contain hidden dark:block transition-transform hover:scale-110 duration-300"
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
  // Logo image already contains "MedOneX" text — no need to render duplicate text.
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
          alt={siteName ?? "MedOneX"}
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
