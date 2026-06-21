"use client";

import { cn } from "@/lib/utils";
import { useSiteConfig } from "@/contexts/SiteConfigContext";

function DefaultLogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center",
        className
      )}
    >
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full"
      >
        <rect x="2" y="2" width="28" height="28" rx="8" className="fill-current opacity-20" />
        <path
          d="M16 8v16M8 16h16"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}


type LogoVariant = "default" | "onDark";

export function MedOneXLogoMark({
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
  const { logoUrl, siteName } = useSiteConfig();
  const hasCustomLogo = logoUrl?.trim();

  if (hasCustomLogo) {
    const srcLight = logoUrl!;
    const srcDark = logoUrl?.trim() || srcLight;

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
              maskSize: "contain",
              maskRepeat: "no-repeat",
              maskPosition: "center",
              WebkitMaskImage: `url(${srcLight})`,
              WebkitMaskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
            }}
          />
          <span
            className="absolute inset-0 bg-current hidden dark:block transition-colors duration-300"
            style={{
              maskImage: `url(${srcDark})`,
              maskSize: "contain",
              maskRepeat: "no-repeat",
              maskPosition: "center",
              WebkitMaskImage: `url(${srcDark})`,
              WebkitMaskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
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
        <img
          src={srcLight}
          alt={title ?? siteName ?? "MedOneX"}
          className="h-full w-full max-h-full max-w-full object-contain dark:hidden transition-transform hover:scale-110 duration-300"
          referrerPolicy="no-referrer"
        />
        <img
          src={srcDark}
          alt={title ?? siteName ?? "MedOneX"}
          className="h-full w-full max-h-full max-w-full object-contain hidden dark:block transition-transform hover:scale-110 duration-300"
          referrerPolicy="no-referrer"
        />
      </span>
    );
  }

  return <DefaultLogoMark className={className} />;
}

export const MedQsLogoMark = MedOneXLogoMark;

export function MedOneXWordmark({
  className,
  variant = "default",
}: {
  className?: string;
  variant?: LogoVariant;
}) {
  return null;
}

export function MedOneXLogoLockup({
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
  const hasCustomLogo = logoUrl?.trim();

  if (hasCustomLogo) {
    const src = logoUrl!;
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

  return null;
}
