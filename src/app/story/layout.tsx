import { SiteConfigProvider } from "@/contexts/SiteConfigContext";
import { prisma } from "@/lib/prisma";
import { CapsuleWrapper } from "@/components/story/CapsuleWrapper";

export const dynamic = "force-dynamic";

export default async function StoryLayout({ children }: { children: React.ReactNode }) {
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
        {children}
      </CapsuleWrapper>
    </SiteConfigProvider>
  );
}
