"use client";

import { usePathname } from "next/navigation";
import { FloatingIslandNavbar } from "@/components/layout/FloatingIslandNavbar";

export function NavbarWrapper(props: {
  userImage?: string | null;
  userName?: string;
  userId: string;
}) {
  const pathname = usePathname();
  if (pathname === "/dashboard-app") return null;

  return <FloatingIslandNavbar {...props} />;
}
