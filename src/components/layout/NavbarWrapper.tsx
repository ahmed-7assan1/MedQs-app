"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { FloatingIslandNavbar } from "@/components/layout/FloatingIslandNavbar";

export function NavbarWrapper(props: {
  userImage?: string | null;
  userName?: string;
  userId: string;
}) {
  const pathname = usePathname();
  const isDashboard = pathname === "/dashboard-app";

  useEffect(() => {
    if (isDashboard) {
      document.documentElement.style.setProperty("--sidebar-offset", "0px");
    }
  }, [isDashboard]);

  if (isDashboard) return null;

  return <FloatingIslandNavbar {...props} />;
}
