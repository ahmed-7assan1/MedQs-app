import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { NotificationsLoader } from "@/components/notifications/NotificationsLoader";
import { AdBannerModal } from "@/components/ads/AdBannerModal";
import { AdminStudentBar } from "@/components/admin/AdminStudentBar";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { CookieConsentBanner } from "@/components/layout/CookieConsentBanner";
import { OnboardingTutorial } from "@/components/system/OnboardingTutorial";
import { SiteConfigProvider } from "@/contexts/SiteConfigContext";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { PersistentAudioPlayer } from "@/components/podcasts/PersistentAudioPlayer";
import { FloatingIslandNavbar } from "@/components/layout/FloatingIslandNavbar";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { MobileSwipeLayout } from "@/components/layout/MobileSwipeLayout";
import { PremiumNotificationPrompt } from "@/components/notifications/PremiumNotificationPrompt";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { redirect } from "next/navigation";
import { TelegramBlocker } from "@/components/system/TelegramBlocker";
import { PageTransitionProvider } from "@/components/providers/PageTransitionProvider";
import { unstable_cache } from "next/cache";

// Cache site config for 5 minutes - it rarely changes
const getCachedSiteConfig = unstable_cache(
  async () => {
    return prisma.siteConfig
      .findFirst({ select: { siteName: true, logoUrl: true } })
      .catch(() => null);
  },
  ["site-config"],
  { revalidate: 300 }
);

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  const isGuest = !authUser;

  // Pull user info from Supabase metadata (already synced) — zero DB call!
  const userMeta = authUser?.user_metadata;
  const userRole = userMeta?.role as string | undefined;
  const userSemesterId = userMeta?.semesterId as string | undefined;
  const displayName = userMeta?.nickname || userMeta?.name || "Student";
  const userImage = userMeta?.avatar_url || userMeta?.image || null;
  const sessionUserId = authUser?.id ?? "";

  // Redirect guests without semester via metadata check (fast, no DB)
  if (!isGuest && authUser) {
    const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN";
    const isSuperAdmin = userRole === "SUPER_ADMIN" || authUser?.email === "ahmedhassan0business@gmail.com";
    
    if (!isAdmin && !userSemesterId && !isSuperAdmin) {
      redirect("/register");
    }
  }

  // These two can run in parallel
  const [siteConfig, unreadCount] = await Promise.all([
    getCachedSiteConfig(),
    // Unread count: only for logged-in users, non-blocking
    isGuest || !authUser
      ? Promise.resolve(0)
      : prisma.notification
          .count({ where: { userId: authUser.id, read: false } })
          .catch(() => 0),
  ]);

  const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN";

  return (
    <>
      <TelegramBlocker>
        <SiteConfigProvider
          initial={{
            siteName: siteConfig?.siteName ?? "MedQs",
            logoUrl: siteConfig?.logoUrl ?? null,
          }}
        >
          <div className={cn("app-shell min-h-screen flex flex-col dark:bg-[#09080F] bg-white")}>
            <a href="#main-content" className="skip-link sr-only">
              Skip to main content
            </a>

            {/* Island is rendered immediately - no blocking */}
            <FloatingIslandNavbar
              userImage={userImage}
              userName={isGuest ? undefined : displayName}
              userId={isGuest ? "" : sessionUserId}
            />

            <MobileHeader
              userImage={userImage}
              userName={isGuest ? undefined : displayName}
              userId={isGuest ? "" : sessionUserId}
            />

            <Sidebar
              userName={isGuest ? "Guest" : displayName}
              userImage={userImage}
              userId={isGuest ? "" : sessionUserId}
              isAdmin={isAdmin ?? false}
              siteName={siteConfig?.siteName ?? "MedOneX"}
              logoUrl={siteConfig?.logoUrl ?? undefined}
              unreadCount={unreadCount}
              isGuest={isGuest}
            />

            <div className="main-content flex-1 flex flex-col min-w-0">
              {!isGuest && sessionUserId && <NotificationsLoader userId={sessionUserId} />}
              {!isGuest && <AdBannerModal semesterId={userSemesterId ?? undefined} />}

              <main id="main-content" className="flex-1 flex flex-col outline-none w-full pb-20 md:pb-8">
                <MobileSwipeLayout>
                  <PageTransitionProvider>
                    {children}
                  </PageTransitionProvider>
                </MobileSwipeLayout>
              </main>

              <SiteFooter />
              {!isGuest && <OnboardingTutorial />}
              <CookieConsentBanner />
              <PersistentAudioPlayer />
              <MobileBottomNav />
              {isAdmin && <AdminStudentBar />}
              <PremiumNotificationPrompt />
            </div>
          </div>
        </SiteConfigProvider>
      </TelegramBlocker>
    </>
  );
}
