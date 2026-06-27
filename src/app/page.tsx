import { SiteConfigProvider } from "@/contexts/SiteConfigContext";
import { prisma } from "@/lib/prisma";
import { LandingPageWrapper } from "@/components/landing/LandingPageWrapper";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { StorySection } from "@/components/landing/StorySection";
import { LogosStrip } from "@/components/landing/LogosStrip";
import { Features } from "@/components/landing/Features";
import { Testimonials } from "@/components/landing/Testimonials";
import { Family } from "@/components/landing/Family";
import { Showcase } from "@/components/landing/Showcase";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";

export const dynamic = "force-static";

export default async function HomePage() {
  const siteConfig = await prisma.siteConfig
    .findFirst({ select: { siteName: true, logoUrl: true, logoUrlDark: true } })
    .catch(() => null);

  return (
    <SiteConfigProvider
      initial={{
        siteName: siteConfig?.siteName ?? "MedOneX",
        logoUrl: siteConfig?.logoUrl ?? null,
        logoUrlDark: siteConfig?.logoUrlDark ?? null,
      }}
    >
      <LandingPageWrapper>
        {/* Purple ambient glow — brand signature */}
        <div
          className="pointer-events-none fixed inset-0 z-0 opacity-[0.15] dark:opacity-[0.25] max-md:opacity-[0.08] max-md:dark:opacity-[0.12]"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 0% 0%, #E7D6FF 0%, #B36BFF 25%, #7C3AED 45%, transparent 70%)",
          }}
        />
        {/* Dark mode noise texture */}
        <div
          className="pointer-events-none fixed inset-0 z-0 opacity-0 dark:opacity-[0.03]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E\")",
            backgroundSize: "128px 128px",
          }}
        />
        <div className="relative z-10 min-h-screen overflow-x-hidden landing-dot-grid pt-[88px]">
          <Navbar />
          <Hero />
          <StorySection />
          <LogosStrip />
          <Features />
          <Showcase />
          <Testimonials />
          <Family />
          <CTA />
          <Footer />
        </div>
      </LandingPageWrapper>
    </SiteConfigProvider>
  );
}
