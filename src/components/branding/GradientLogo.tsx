"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useSiteConfig } from "@/contexts/SiteConfigContext";

export function GradientLogo({
  className,
  fromColor = "#ffffff",
  toColor = "#9333ea",
}: {
  className?: string;
  fromColor?: string;
  toColor?: string;
}) {
  const { logoUrl } = useSiteConfig();
  const hasCustomLogo = logoUrl?.trim();
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (!hasCustomLogo) return;
    setImgError(false);
    const img = new Image();
    img.onerror = () => setImgError(true);
    img.onload = () => setImgError(false);
    img.src = logoUrl!;
  }, [logoUrl, hasCustomLogo]);

  if (!hasCustomLogo || imgError) return null;

  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center justify-center relative",
        className
      )}
      style={{ aspectRatio: "1 / 1" }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to bottom, ${fromColor}, ${toColor})`,
          maskImage: `url(${logoUrl})`,
          maskSize: "contain",
          maskRepeat: "no-repeat",
          maskPosition: "center",
          WebkitMaskImage: `url(${logoUrl})`,
          WebkitMaskSize: "contain",
          WebkitMaskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
        }}
      />
    </div>
  );
}
