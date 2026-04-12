import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { MedQsLogoMark } from "@/components/branding/MedQsLogo";
import { SiteConfigProvider } from "@/contexts/SiteConfigContext";
import { AdminSidebarNav } from "@/components/admin/AdminSidebarNav";
import { PLATFORM_COPY } from "@/lib/platform-copy";
import { ChevronRight } from "lucide-react";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") redirect("/dashboard");

  const hubBadge = role === "SUPER_ADMIN" ? "Platform" : "Doctor";

  const siteConfig = await prisma.siteConfig
    .findFirst({ select: { siteName: true, logoUrl: true } })
    .catch(() => null);

  return (
    <SiteConfigProvider initial={{ siteName: siteConfig?.siteName ?? "MedQs", logoUrl: siteConfig?.logoUrl ?? null }}>
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-56 shrink-0 border-r border-border bg-card/75 backdrop-blur-md md:flex md:flex-col">
        <div className="flex h-14 items-center gap-2 border-b border-border/80 bg-card/50 px-4 backdrop-blur-sm">
          <MedQsLogoMark className="h-7 w-7 shrink-0" title="MedQs" />
          <span className="font-display text-base font-bold tracking-tight">{siteConfig?.siteName ?? "MedQs"}</span>
          <span
            className="ml-auto rounded-lg bg-primary/12 px-1.5 py-0.5 text-[10px] font-semibold text-primary"
            title={PLATFORM_COPY.doctorHub}
          >
            {hubBadge}
          </span>
        </div>

        <nav
          className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4"
          aria-label={PLATFORM_COPY.doctorHub}
        >
          <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {PLATFORM_COPY.teachingWorkspace}
          </p>
          <AdminSidebarNav />
        </nav>

        <div className="border-t border-border/80 p-3">
          <Link
            href="/dashboard-app"
            className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {PLATFORM_COPY.studentView}
          </Link>
        </div>
      </aside>

      <div className="flex-1 overflow-auto">
        <main className="min-h-screen">{children}</main>
      </div>
    </div>
  </SiteConfigProvider>
  );
}
