"use client";
import Script from "next/script";

export function PuterScript() {
  return (
    <Script
      src="https://js.puter.com/v2/"
      strategy="afterInteractive"
      onError={() => console.warn("[Puter] Failed to load")}
      onLoad={() => console.info("[Puter] Loaded")}
    />
  );
}
