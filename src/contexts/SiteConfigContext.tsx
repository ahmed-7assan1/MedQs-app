"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface PublicSiteConfig {
  siteName: string;
  logoUrl: string | null;
  logoUrlDark: string | null;
  primaryColor: string;
  facebookUrl?: string | null;
  twitterUrl?: string | null;
  youtubeUrl?: string | null;
  instagramUrl?: string | null;
  telegramUrl?: string | null;
  whatsappUrl?: string | null;
  linkedinUrl?: string | null;
  tiktokUrl?: string | null;
  hulkLogoUrl?: string | null;
}

const DEFAULT: PublicSiteConfig = { siteName: "MedOneX", logoUrl: null, logoUrlDark: null, primaryColor: "#2563eb" };

const SiteConfigContext = createContext<PublicSiteConfig>(DEFAULT);

export function SiteConfigProvider({ children, initial }: { children: ReactNode; initial?: Partial<PublicSiteConfig> }) {
  const [cfg, setCfg] = useState<PublicSiteConfig>({ ...DEFAULT, ...initial });

  useEffect(() => {
    // Skip client re-fetch if SSR already provided the data
    if (initial?.siteName) return;
    fetch("/api/v1/admin/config")
      .then((r) => r.json())
      .then((d) => {
        if (d?.siteName) {
          setCfg((prev) => ({
            ...prev,
            siteName: d.siteName ?? prev.siteName,
            logoUrl: d.logoUrl ?? prev.logoUrl,
            logoUrlDark: d.logoUrlDark ?? prev.logoUrlDark,
            primaryColor: d.primaryColor ?? prev.primaryColor,
            facebookUrl: d.facebookUrl ?? prev.facebookUrl,
            twitterUrl: d.twitterUrl ?? prev.twitterUrl,
            youtubeUrl: d.youtubeUrl ?? prev.youtubeUrl,
            instagramUrl: d.instagramUrl ?? prev.instagramUrl,
            telegramUrl: d.telegramUrl ?? prev.telegramUrl,
            whatsappUrl: d.whatsappUrl ?? prev.whatsappUrl,
            linkedinUrl: d.linkedinUrl ?? prev.linkedinUrl,
            tiktokUrl: d.tiktokUrl ?? prev.tiktokUrl,
            hulkLogoUrl: d.hulkLogoUrl ?? prev.hulkLogoUrl,
          }));
        }
      })
      .catch(() => {/* silent — use SSR-provided initial */});
  }, []);

  return <SiteConfigContext.Provider value={cfg}>{children}</SiteConfigContext.Provider>;
}

export function useSiteConfig() {
  return useContext(SiteConfigContext);
}
