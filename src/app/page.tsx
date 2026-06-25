import { SiteConfigProvider } from "@/contexts/SiteConfigContext";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { StorySection } from "@/components/landing/StorySection";
import { LogosStrip } from "@/components/landing/LogosStrip";
import { Features } from "@/components/landing/Features";
import { Showcase } from "@/components/landing/Showcase";
import { Testimonials } from "@/components/landing/Testimonials";
import { Family } from "@/components/landing/Family";
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
      <div className="min-h-screen overflow-x-hidden landing-dot-grid pt-[88px]">
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
    </SiteConfigProvider>
  );
}
