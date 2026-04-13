"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface PublicSiteConfig {
  siteName: string;
  logoUrl: string | null;
  logoUrlDark: string | null;
  primaryColor: string;
}

const DEFAULT: PublicSiteConfig = { siteName: "MedQs", logoUrl: null, logoUrlDark: null, primaryColor: "#2563eb" };

const SiteConfigContext = createContext<PublicSiteConfig>(DEFAULT);

export function SiteConfigProvider({ children, initial }: { children: ReactNode; initial?: Partial<PublicSiteConfig> }) {
  const [cfg, setCfg] = useState<PublicSiteConfig>({ ...DEFAULT, ...initial });

  useEffect(() => {
    // Re-fetch on the client so any admin changes propagate without a full reload
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
