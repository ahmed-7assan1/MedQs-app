"use client";

import { useLocale } from "@/contexts/LocaleContext";

export function LandingPageWrapper({ children }: { children: React.ReactNode }) {
  const { locale } = useLocale();
  const isRtl = locale === "ar";

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className={isRtl ? "font-arabic" : ""}
      style={{ fontFamily: isRtl ? "var(--font-cairo)" : "var(--font-nunito)" }}
    >
      {children}
    </div>
  );
}
