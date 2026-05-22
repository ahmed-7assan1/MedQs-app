"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { isImmersiveMobileRoute } from "@/lib/mobile-chrome";

/** Toggles immersive shell class (no tab bar reserve) on the student app-shell root. */
export function MobileChromeController() {
  const pathname = usePathname() ?? "";
  const immersive = isImmersiveMobileRoute(pathname);

  useEffect(() => {
    const shell = document.querySelector(".app-shell");
    if (!shell) return;
    shell.classList.toggle("app-shell--immersive", immersive);
    shell.classList.toggle("app-shell--tabbar", !immersive);
  }, [immersive]);

  return null;
}
