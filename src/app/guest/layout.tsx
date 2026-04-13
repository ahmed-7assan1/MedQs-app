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
        <div className="flex justify-center p-3 md:pt-6">
          <header className="z-40 w-full max-w-4xl rounded-[2rem] border border-white/20 bg-gradient-to-r from-blue-500/95 via-indigo-500/95 to-violet-500/95 shadow-[0_12px_40px_rgba(37,99,235,0.25)] backdrop-blur-xl transition-all">
            <div className="flex items-center justify-between gap-3 px-6 py-3.5 text-white">
              <Link href="/guest/past-papers" className="flex items-center gap-2 font-semibold transition-transform hover:scale-105">
                <div className="rounded-xl bg-white/10 p-1 backdrop-blur-md ring-1 ring-white/20">
                  <MedQsLogoMark className="h-7 w-7 text-white drop-shadow-md" style={{ filter: "brightness(0) invert(1)" }} />
                </div>
                <span className="font-display text-xl tracking-wide text-white drop-shadow-sm">{name}</span>
                <span className="ml-1 rounded-full bg-white/20 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-white shadow-sm ring-1 ring-white/30 backdrop-blur-sm">
                  Guest Mode
                </span>
              </Link>
              <div className="[&_button]:!border-white/20 [&_button]:!bg-white/10 [&_button]:!text-white hover:[&_button]:!bg-white/20 [&_button]:!shadow-none [&_button]:!ring-white/30">
                <GuestSignOutButton />
              </div>
            </div>
          </header>
        </div>
        <div className="mx-auto max-w-4xl px-4 py-4 md:px-6 md:py-6">{children}</div>
      </div>
    </SiteConfigProvider>
  );
}
