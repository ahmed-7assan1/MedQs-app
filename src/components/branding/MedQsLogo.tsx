"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useSiteConfig } from "@/contexts/SiteConfigContext";

function DefaultLogoMark({ className }: { className?: string }) {
  return null;
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
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (!hasCustomLogo) return;
    if (!interactiveColor) return;
    setImgError(false);
    const img = new Image();
    img.onerror = () => setImgError(true);
    img.onload = () => setImgError(false);
    img.src = logoUrl!;
  }, [logoUrl, hasCustomLogo, interactiveColor]);

  if (!hasCustomLogo || imgError) return null;

  if (interactiveColor) {
    const srcLight = logoUrl!;
    const srcDark = logoUrl!.trim() || srcLight;
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
        src={logoUrl!}
        alt={title ?? siteName ?? "MedOneX"}
        className="h-full w-full max-h-full max-w-full object-contain dark:hidden transition-transform hover:scale-110 duration-300"
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
      />
      <img
        src={logoUrl!.trim() || logoUrl!}
        alt={title ?? siteName ?? "MedOneX"}
        className="h-full w-full max-h-full max-w-full object-contain hidden dark:block transition-transform hover:scale-110 duration-300"
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
      />
    </span>
  );
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
  const [imgError, setImgError] = useState(false);

  if (!hasCustomLogo || imgError) return null;

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
          onError={() => setImgError(true)}
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
