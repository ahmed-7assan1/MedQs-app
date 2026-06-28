import { prisma } from "@/lib/prisma";
import { SiteConfigProvider } from "@/contexts/SiteConfigContext";
import { Navbar } from "@/components/landing/Navbar";
import { FAQSection } from "@/components/landing/FAQSection";
import { Footer } from "@/components/landing/Footer";

export const dynamic = "force-static";

export default async function FAQPage() {
  const siteConfig = await prisma.siteConfig
    .findFirst({ select: { siteName: true, logoUrl: true, logoUrlDark: true } })
    .catch(() => null);

  return (
    <>
      <style>{`@keyframes slow-drift { 0%,100% { background-position: 0% 0%; } 50% { background-position: 3% 3%; } }`}</style>
      <SiteConfigProvider
        initial={{
          siteName: siteConfig?.siteName ?? "MedOneX",
          logoUrl: siteConfig?.logoUrl ?? null,
          logoUrlDark: siteConfig?.logoUrlDark ?? null,
        }}
      >
        <div className="relative min-h-screen overflow-x-hidden landing-dot-grid pt-[88px]">
          <div
            className="pointer-events-none fixed inset-0 z-0 opacity-[0.15] dark:opacity-[0.25] max-md:opacity-[0.08] max-md:dark:opacity-[0.12] animate-[slow-drift_20s_ease-in-out_infinite]"
            style={{
              background:
                "radial-gradient(ellipse 80% 60% at 0% 0%, #E7D6FF 0%, #B36BFF 25%, #7C3AED 45%, transparent 70%)",
            }}
          />
          <div
            className="pointer-events-none fixed inset-0 z-0 opacity-0 dark:opacity-[0.03]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E\")",
              backgroundSize: "128px 128px",
            }}
          />
          <div className="relative z-10">
            <Navbar />
            <FAQSection />
            <Footer />
          </div>
        </div>
      </SiteConfigProvider>
    </>
  );
}
