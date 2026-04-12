import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { MedQsLogoMark } from "@/components/branding/MedQsLogo";
import { SiteConfigProvider } from "@/contexts/SiteConfigContext";
import { GuestSignOutButton } from "./GuestSignOutButton";

export const dynamic = "force-dynamic";

export default async function GuestQuizLayout({ children }: { children: React.ReactNode }) {
  const site = await prisma.siteConfig
    .findFirst({ select: { siteName: true, logoUrl: true } })
    .catch(() => null);
  const name = site?.siteName ?? "MedQs";

  return (
    <SiteConfigProvider initial={{ siteName: name, logoUrl: site?.logoUrl ?? null }}>
      <div className="min-h-dvh bg-background text-foreground">
        <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur-sm">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3 md:px-6">
            <Link href="/guest/past-papers" className="flex items-center gap-2 font-semibold">
              <MedQsLogoMark className="h-8 w-8" />
              <span className="font-display text-lg">{name}</span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                Guest quizzes
              </span>
            </Link>
            <GuestSignOutButton />
          </div>
        </header>
        <div className="mx-auto max-w-4xl px-4 py-6 md:px-6">{children}</div>
      </div>
    </SiteConfigProvider>
  );
}
