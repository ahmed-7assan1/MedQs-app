"use client";

import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/layout/SiteFooter";

export function ConditionalFooter() {
  const pathname = usePathname();
  if (pathname?.startsWith("/ai-chat") || pathname?.startsWith("/drawmed") || pathname?.startsWith("/social") || pathname?.startsWith("/modules")) return null;
  return <SiteFooter />;
}
