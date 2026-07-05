"use client";

import { FloatingIslandNavbar } from "@/components/layout/FloatingIslandNavbar";

export function NavbarWrapper(props: {
  userImage?: string | null;
  userName?: string;
  userId: string;
}) {
  return <FloatingIslandNavbar {...props} />;
}
