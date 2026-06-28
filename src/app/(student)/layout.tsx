import { createClient } from "@/lib/supabase/server";
import dynamic from "next/dynamic";
const Sidebar = dynamic(() => import("@/components/layout/Sidebar").then(m => m.Sidebar), { ssr: false });
const AmbientGlow = dynamic(() => import("@/components/ui/AmbientGlow").then(m => m.AmbientGlow), { ssr: false });
const FirebaseProvider = dynamic(() => import("@/components/providers/FirebaseProvider").then(m => m.FirebaseProvider), { ssr: false });
import { NotificationsLoader } from "@/components/notifications/NotificationsLoader";
import { AdBannerModal } from "@/components/ads/AdBannerModal";
import { AdminStudentBar } from "@/components/admin/AdminStudentBar";
import { ConditionalFooter } from "@/components/layout/ConditionalFooter";
import { CookieConsentBanner } from "@/components/layout/CookieConsentBanner";
import { OnboardingTutorial } from "@/components/system/OnboardingTutorial";
import { SiteConfigProvider } from "@/contexts/SiteConfigContext";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { MobileBottomSheet } from "@/components/layout/MobileBottomSheet";
import { PersistentAudioPlayer } from "@/components/podcasts/PersistentAudioPlayer";
import { FloatingIslandNavbar } from "@/components/layout/FloatingIslandNavbar";
import { GlobalTopBar } from "@/components/layout/GlobalTopBar";
import { MobileSwipeLayout } from "@/components/layout/MobileSwipeLayout";
import { MobileChromeController } from "@/components/layout/MobileChromeController";
import { PuterScript } from "@/components/system/PuterScript";
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

  const sessionUserId = authUser?.id ?? "";
  
  // Fetch fresh user data from Prisma for consistency
  const dbUser = !isGuest ? await prisma.user.findUnique({
    where: { id: sessionUserId },
    select: { name: true, nickname: true, image: true, semesterId: true, role: true }
  }) : null;

  const userRole = dbUser?.role || authUser?.user_metadata?.role as string | undefined;
  const userSemesterId = dbUser?.semesterId || authUser?.user_metadata?.semesterId as string | undefined;
  const displayName = dbUser?.nickname || dbUser?.name || authUser?.user_metadata?.name || "Student";
  const userImage = dbUser?.image || authUser?.user_metadata?.avatar_url || authUser?.user_metadata?.image || null;

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
      <PuterScript />
      <FirebaseProvider>
      <TelegramBlocker>
        <SiteConfigProvider
          initial={{
            siteName: siteConfig?.siteName ?? "MedOneX",
            logoUrl: siteConfig?.logoUrl ?? null,
          }}
        >
          <AmbientGlow />
          <div className={cn("app-shell app-shell--tabbar min-h-screen flex flex-col bg-background/80")}>
            <MobileChromeController />
            <a href="#main-content" className="skip-link sr-only">
              Skip to main content
            </a>

            {/* Island is rendered immediately - no blocking */}
            <FloatingIslandNavbar
              userImage={userImage}
              userName={isGuest ? undefined : displayName}
              userId={isGuest ? "" : sessionUserId}
            />

            <GlobalTopBar
              userImage={userImage}
              userName={isGuest ? undefined : displayName}
              userId={isGuest ? "" : sessionUserId}
              isAdmin={isAdmin}
              isGuest={isGuest}
            />

            <div className="hidden md:block">
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
            </div>

            <div className="main-content flex-1 flex flex-col min-w-0">
              {!isGuest && sessionUserId && <NotificationsLoader userId={sessionUserId} />}
              {!isGuest && <AdBannerModal semesterId={userSemesterId ?? undefined} />}

              <main id="main-content" className="flex-1 flex flex-col outline-none w-full min-h-0 md:pb-8">
                <MobileSwipeLayout>
                  <PageTransitionProvider>
                    {children}
                  </PageTransitionProvider>
                </MobileSwipeLayout>
              </main>

              <div className="hidden md:block">
                <ConditionalFooter />
              </div>
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
      </FirebaseProvider>
    </>
  );
}
