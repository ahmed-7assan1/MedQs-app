import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { NotificationsLoader } from "@/components/notifications/NotificationsLoader";
import { AdBannerModal } from "@/components/ads/AdBannerModal";
import { prisma } from "@/lib/prisma";

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
    <div className="app-shell">
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
      <div className="main-content">
        {!isGuest && sessionUserId ? <NotificationsLoader userId={sessionUserId} /> : null}
        {!isGuest && <AdBannerModal semesterId={user?.semesterId ?? undefined} />}
        <main className="flex-1 pb-8">{children}</main>
      </div>
    </div>
  );
}
