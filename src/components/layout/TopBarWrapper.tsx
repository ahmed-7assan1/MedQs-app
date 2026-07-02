"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { GlobalTopBar } from "@/components/layout/GlobalTopBar";

export function TopBarWrapper(props: {
  userImage: string | null;
  userName?: string | null;
  userId?: string;
  isAdmin?: boolean;
  isGuest?: boolean;
}) {
  const pathname = usePathname();
  const isDashboard = pathname === "/dashboard-app";

  useEffect(() => {
    if (isDashboard) {
      document.documentElement.style.setProperty("--mobile-header-offset", "0px");
    } else {
      document.documentElement.style.setProperty(
        "--mobile-header-offset",
        "calc(var(--mobile-header-height) + env(safe-area-inset-top, 0px))"
      );
    }
  }, [isDashboard]);

  if (isDashboard) return null;

  return <GlobalTopBar {...props} />;
}
