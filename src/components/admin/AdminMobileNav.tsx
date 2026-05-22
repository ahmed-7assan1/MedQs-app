"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ArrowLeft } from "lucide-react";
import { MedOneXLogoMark } from "@/components/branding/MedQsLogo";
import { AdminSidebarNav } from "@/components/admin/AdminSidebarNav";
import { PLATFORM_COPY } from "@/lib/platform-copy";

interface AdminMobileNavProps {
  siteName: string;
  hubBadge: string;
  isSuperAdmin?: boolean;
}

export function AdminMobileNav({ siteName, hubBadge, isSuperAdmin = false }: AdminMobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* ── Mobile top-bar (only on mobile) ── */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-3 border-b border-gray-200/10 bg-background/90 px-4 backdrop-blur-md md:hidden">
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200/10 bg-card/80 text-muted-foreground transition-colors hover:text-foreground"
        >
          <Menu className="h-4.5 w-4.5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow shadow-blue-500/30">
            <MedOneXLogoMark className="h-5 w-5 brightness-0 invert" />
          </div>
          <span className="font-display text-sm font-bold truncate">{siteName}</span>
          <span className="rounded-md bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-blue-500">
            {hubBadge}
          </span>
        </div>
      </div>

      {/* ── Spacer so content doesn't hide under top-bar ── */}
      <div className="h-14 md:hidden" />

      {/* ── Drawer backdrop ── */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Drawer panel ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-gray-200/10 bg-background/95 backdrop-blur-xl transition-transform duration-300 md:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Drawer header */}
        <div className="flex h-14 items-center gap-2.5 px-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-md shadow-blue-500/30">
            <MedOneXLogoMark className="h-6 w-6 brightness-0 invert" />
          </div>
          <span className="font-display text-sm font-bold truncate">{siteName}</span>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200/10 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav
          className="flex-1 overflow-y-auto px-3 py-4"
          onClick={() => setOpen(false)}
        >
          <AdminSidebarNav isSuperAdmin={isSuperAdmin} />
        </nav>

        {/* Back link */}
        <div className="border-t border-gray-200/10 p-3">
          <Link href="/dashboard-app"
            className="flex items-center gap-2 rounded-xl px-2.5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            onClick={() => setOpen(false)}>
            <ArrowLeft className="h-4 w-4 shrink-0" />
            {PLATFORM_COPY.studentView}
          </Link>
        </div>
      </aside>
    </>
  );
}
