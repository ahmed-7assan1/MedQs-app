"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { isImmersiveMobileRoute } from "@/lib/mobile-chrome";

/** Toggles immersive shell class (no tab bar reserve) on the parent app-shell root. */
export function MobileChromeController() {
  const pathname = usePathname() ?? "";
  const immersive = isImmersiveMobileRoute(pathname);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const shell = ref.current?.closest(".app-shell");
    if (!shell) return;
    shell.classList.toggle("app-shell--immersive", immersive);
    shell.classList.toggle("app-shell--tabbar", !immersive);
  }, [immersive]);

  return <div ref={ref} style={{ display: "contents" }} />;
}
