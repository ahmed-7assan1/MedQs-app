"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import type { SidebarProps } from "@/components/layout/Sidebar";

export function SidebarWrapper(props: SidebarProps) {
  const pathname = usePathname();
  const isDashboard = pathname === "/dashboard-app";

  if (isDashboard) return null;

  return <Sidebar {...props} />;
}
