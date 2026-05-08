import { auth } from "@/lib/auth";
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
import { AdminFAB } from "@/components/admin/AdminFAB";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const isGuest = !session?.user?.id;

  // Never throw the whole shell if the DB is down — avoids a blank white page.
  const user = isGuest
    ? null
    : await prisma.user
      .findUnique({
        where: { id: session!.user!.id },
        select: { name: true, nickname: true, image: true, semesterId: true, role: true },
      })
      .catch(() => null);

  // ── Onboarding guard: redirect to /register if profile is incomplete ──────
  // Exempt: guests, admins, and pages already under /register
  if (!isGuest && user) {
    const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
    if (!isAdmin && !user.semesterId) {
      redirect("/register");
    }
  }

  const siteConfig = await prisma.siteConfig
    .findFirst({
      select: { siteName: true, logoUrl: true },
    })
    .catch(() => null);

  const unreadCount =
    isGuest || !session?.user?.id
      ? 0
      : await prisma.notification
        .count({
          where: { userId: session.user.id, read: false },
        })
        .catch(() => 0);

  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const displayName = user?.nickname || user?.name || session?.user?.name || "Student";
  const sessionUserId = session?.user?.id ?? "";

  return (
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
        
        {/* Top Island Navbar (Desktop Only Visibility handled internally) */}
        <FloatingIslandNavbar 
           userImage={isGuest ? undefined : (user?.image ?? session?.user?.image ?? undefined)}
           userName={isGuest ? undefined : displayName}
           userId={isGuest ? "" : sessionUserId}
        />

        <Sidebar
          userName={isGuest ? "Guest" : displayName}
          userImage={isGuest ? undefined : (user?.image ?? session?.user?.image ?? undefined)}
          userId={isGuest ? "" : sessionUserId}
          isAdmin={isAdmin}
          siteName={siteConfig?.siteName ?? "MedOneX"}
          logoUrl={siteConfig?.logoUrl ?? undefined}
          isGuest={isGuest}
          unreadCount={unreadCount}
        />

        <div className="main-content flex-1 flex flex-col min-w-0">
          {!isGuest && sessionUserId && <NotificationsLoader userId={sessionUserId} />}
          {!isGuest && <AdBannerModal semesterId={user?.semesterId ?? undefined} />}
          
          <main id="main-content" className="flex-1 flex flex-col outline-none w-full pb-20 md:pb-8">
            {children}
          </main>

          <SiteFooter />
          {!isGuest && <OnboardingTutorial />}
          <CookieConsentBanner />
          <PersistentAudioPlayer />
          <MobileBottomNav />
          {isAdmin && <AdminStudentBar />}
        </div>
      </div>
    </SiteConfigProvider>
  );
}
