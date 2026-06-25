"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const EXCLUDED_PATHS = ["/", "/login", "/register", "/forgot-password", "/reset-password", "/complete-profile", "/auth"];

export function SessionPersistence() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname && !EXCLUDED_PATHS.includes(pathname)) {
      localStorage.setItem("medqs-last-path", pathname);
    }
  }, [pathname]);

  return null;
}