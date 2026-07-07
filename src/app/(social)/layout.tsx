import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { CACHE_TTL } from "@/lib/cache-tags";

const FirebaseProvider = dynamic(() => import("@/components/providers/FirebaseProvider").then(m => m.FirebaseProvider), { ssr: false });
import { MobileChromeController } from "@/components/layout/MobileChromeController";
import { CookieConsentBanner } from "@/components/layout/CookieConsentBanner";
import { TelegramBlocker } from "@/components/system/TelegramBlocker";
import { PuterScript } from "@/components/system/PuterScript";
import { SiteConfigProvider } from "@/contexts/SiteConfigContext";
import { GlobalTopBar } from "@/components/layout/GlobalTopBar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";

const getCachedSiteConfig = unstable_cache(
  async () => {
    return prisma.siteConfig
      .findFirst({ select: { siteName: true, logoUrl: true } })
      .catch(() => null);
  },
  ["site-config"],
  { revalidate: CACHE_TTL.SITE_CONFIG }
);

export default async function SocialLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  const isGuest = !authUser;
  const sessionUserId = authUser?.id ?? "";

  const dbUser = !isGuest ? await prisma.user.findUnique({
    where: { id: sessionUserId },
    select: { name: true, nickname: true, image: true, role: true }
  }) : null;

  const displayName = dbUser?.nickname || dbUser?.name || authUser?.user_metadata?.name || "Student";
  const userImage = dbUser?.image || authUser?.user_metadata?.avatar_url || authUser?.user_metadata?.image || null;
  const resolvedRole = dbUser?.role || authUser?.user_metadata?.role as string | undefined;
  const isAdmin = resolvedRole === "ADMIN" || resolvedRole === "SUPER_ADMIN";

  const siteConfig = await getCachedSiteConfig();

  return (
    <div className="app-shell app-shell--tabbar min-h-screen flex flex-col bg-background/80">
      <MobileChromeController />
      <PuterScript />
      <TelegramBlocker>
        <SiteConfigProvider
          initial={{
            siteName: siteConfig?.siteName ?? "MedOneX",
            logoUrl: siteConfig?.logoUrl ?? null,
          }}
        >
          <FirebaseProvider>
            <GlobalTopBar
              userImage={userImage}
              userName={displayName}
              userId={sessionUserId}
              isAdmin={isAdmin}
              isGuest={isGuest}
            />
            {children}
            <MobileBottomNav />
            <CookieConsentBanner />
          </FirebaseProvider>
        </SiteConfigProvider>
      </TelegramBlocker>
    </div>
  );
}
