import dynamic from "next/dynamic";
const FirebaseProvider = dynamic(() => import("@/components/providers/FirebaseProvider").then(m => m.FirebaseProvider), { ssr: false });
import { MobileChromeController } from "@/components/layout/MobileChromeController";
import { CookieConsentBanner } from "@/components/layout/CookieConsentBanner";
import { TelegramBlocker } from "@/components/system/TelegramBlocker";
import { SiteConfigProvider } from "@/contexts/SiteConfigContext";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

const getCachedSiteConfig = unstable_cache(
  async () => {
    return prisma.siteConfig
      .findFirst({ select: { siteName: true, logoUrl: true } })
      .catch(() => null);
  },
  ["site-config"],
  { revalidate: 300 }
);

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  const siteConfig = await getCachedSiteConfig();

  return (
    <div className="app-shell app-shell--immersive min-h-screen flex flex-col">
      <MobileChromeController />
      <TelegramBlocker>
        <SiteConfigProvider
          initial={{
            siteName: siteConfig?.siteName ?? "MedOneX",
            logoUrl: siteConfig?.logoUrl ?? null,
          }}
        >
          <FirebaseProvider>
            {children}
          </FirebaseProvider>
          <CookieConsentBanner />
        </SiteConfigProvider>
      </TelegramBlocker>
    </div>
  );
}
