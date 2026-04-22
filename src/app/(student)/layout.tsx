import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { NotificationsLoader } from "@/components/notifications/NotificationsLoader";
import { AdBannerModal } from "@/components/ads/AdBannerModal";
import { AdminStudentBar } from "@/components/admin/AdminStudentBar";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { CookieConsentBanner } from "@/components/layout/CookieConsentBanner";
import { OnboardingTutorial } from "@/components/system/OnboardingTutorial";
import { SiteConfigProvider } from "@/contexts/SiteConfigContext";
import { BottomNav } from "@/components/layout/BottomNav";
import { PersistentAudioPlayer } from "@/components/podcasts/PersistentAudioPlayer";
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
      <>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <div className={cn("app-shell flex flex-col min-h-screen")}>
          <Sidebar
            userName={isGuest ? "Guest" : displayName}
            userImage={isGuest ? undefined : (user?.image ?? session?.user?.image ?? undefined)}
            userId={isGuest ? "" : sessionUserId}
            isAdmin={isAdmin}
            siteName={siteConfig?.siteName ?? "MedQs"}
            logoUrl={siteConfig?.logoUrl ?? undefined}
            isGuest={isGuest}
            unreadCount={unreadCount}
          />
          <div className="main-content flex-1 flex flex-col pt-0 lg:pt-14 min-w-0 transition-all duration-300">
            {!isGuest && sessionUserId ? <NotificationsLoader userId={sessionUserId} /> : null}
            {!isGuest && <AdBannerModal semesterId={user?.semesterId ?? undefined} />}
            <main id="main-content" className="flex min-h-0 flex-1 flex-col pb-24 md:pb-8 outline-none w-full">
              {children}
            </main>
            <SiteFooter />
            {isAdmin && !isGuest ? <AdminStudentBar /> : null}
            {!isGuest && <OnboardingTutorial />}
            <CookieConsentBanner />
            <BottomNav />
            <PersistentAudioPlayer />
          </div>
        </div>
      </>
    </SiteConfigProvider>
  );
}
