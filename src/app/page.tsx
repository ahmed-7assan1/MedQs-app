import { Story } from "@/components/landing/Story";
import { SiteConfigProvider } from "@/contexts/SiteConfigContext";
import { CapsuleWrapper } from "@/components/story/CapsuleWrapper";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
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
      <CapsuleWrapper>
        <Story />
      </CapsuleWrapper>
    </SiteConfigProvider>
  );
}
