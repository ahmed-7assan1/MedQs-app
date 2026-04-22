import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { MedQsLogoMark } from "@/components/branding/MedQsLogo";
import { SiteConfigProvider } from "@/contexts/SiteConfigContext";
import { AdminSidebarNav } from "@/components/admin/AdminSidebarNav";
import { AdminMobileNav } from "../../components/admin/AdminMobileNav";
import { PLATFORM_COPY } from "@/lib/platform-copy";
import { LayoutDashboard, ArrowLeft } from "lucide-react";

import { NextAuthProvider } from "@/components/providers/NextAuthProvider";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") redirect("/dashboard");

  const hubBadge = role === "SUPER_ADMIN" ? "Platform" : "Doctor";

  const siteConfig = await prisma.siteConfig
    .findFirst({ select: { siteName: true, logoUrl: true } })
    .catch(() => null);

  const siteName = siteConfig?.siteName ?? "MedQs";

  return (
    <NextAuthProvider session={session}>
      <SiteConfigProvider initial={{ siteName, logoUrl: siteConfig?.logoUrl ?? null }}>
        <div className="flex min-h-screen bg-background">

          {/* ── Desktop Sidebar ──────────────────────────────────────── */}
          <aside className="hidden w-60 shrink-0 border-r border-white/[0.02] md:flex md:flex-col"
            style={{ background: "hsl(var(--card)/0.7)", backdropFilter: "blur(16px)" }}>

            {/* Logo header */}
            <div className="flex h-14 items-center gap-2.5 px-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-md shadow-blue-500/30">
                <MedQsLogoMark className="h-5 w-5 shrink-0 brightness-0 invert" title="MedQs" />
              </div>
              <span className="font-display text-sm font-bold tracking-tight">{siteName}</span>
              <span className="ml-auto rounded-lg bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-500"
                title={PLATFORM_COPY.doctorHub}>
                {hubBadge}
              </span>
            </div>

            {/* Navigation */}
            <nav className="flex flex-1 flex-col overflow-y-auto px-3 py-4" aria-label={PLATFORM_COPY.doctorHub}>
              <AdminSidebarNav />
            </nav>

            {/* Back to student view */}
            <div className="border-t border-white/[0.02] p-3">
              <Link href="/dashboard-app"
                className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground">
                <ArrowLeft className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {PLATFORM_COPY.studentView}
              </Link>
            </div>
          </aside>

          {/* ── Mobile top bar + drawer ───────────────────────────────── */}
          <AdminMobileNav siteName={siteName} hubBadge={hubBadge} />

          {/* ── Main content ─────────────────────────────────────────── */}
          <div className="flex flex-1 flex-col overflow-auto">
            <main className="flex-1 pb-8">{children}</main>
          </div>

        </div>
      </SiteConfigProvider>
    </NextAuthProvider>
  );
}
