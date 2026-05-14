import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { MedOneXLogoMark } from "@/components/branding/MedQsLogo";
import { SiteConfigProvider } from "@/contexts/SiteConfigContext";
import { GuestSignOutButton } from "./GuestSignOutButton";

export const dynamic = "force-dynamic";

export default async function GuestQuizLayout({ children }: { children: React.ReactNode }) {
  const site = await prisma.siteConfig
    .findFirst({ select: { siteName: true, logoUrl: true } })
    .catch(() => null);
  const name = site?.siteName ?? "MedOneX";

  return (
    <SiteConfigProvider initial={{ siteName: name, logoUrl: site?.logoUrl ?? null }}>
      <div className="min-h-dvh bg-background text-foreground">
        <header className="fixed top-0 left-0 right-0 z-50 flex h-16 w-full items-center justify-between border-b border-border bg-background/80 px-4 md:px-8 backdrop-blur-xl shadow-sm transition-all">
            <Link href="/guest/past-papers" className="flex items-center gap-3 transition-transform hover:scale-105">
              <div className="flex flex-shrink-0 items-center justify-center h-8 w-8 rounded-lg bg-sky-500/10 ring-1 ring-sky-500/20">
                <MedOneXLogoMark className="h-5 w-5 text-sky-500" interactiveColor={true} />
              </div>
              <span className="font-display text-lg font-bold tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">{name}</span>
              <span className="hidden sm:inline-flex ml-2 rounded-full bg-sky-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-500 ring-1 ring-sky-500/20">
                Guest Mode
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <GuestSignOutButton />
            </div>
        </header>
        <div className="mx-auto max-w-5xl px-4 pt-24 pb-12 md:px-8 md:pt-28">{children}</div>
      </div>
    </SiteConfigProvider>
  );
}
