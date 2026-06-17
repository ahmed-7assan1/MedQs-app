import { createClient } from "@/lib/supabase/server";
import dynamic from "next/dynamic";
import { SiteConfigProvider } from "@/contexts/SiteConfigContext";
import { FloatingIslandNavbar } from "@/components/layout/FloatingIslandNavbar";
import { GlobalTopBar } from "@/components/layout/GlobalTopBar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { GlobalPostComposer } from "@/components/layout/GlobalPostComposer";
import { MobileChromeController } from "@/components/layout/MobileChromeController";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { redirect } from "next/navigation";
import { TelegramBlocker } from "@/components/system/TelegramBlocker";
import { PageTransitionProvider } from "@/components/providers/PageTransitionProvider";
import { unstable_cache } from "next/cache";

const Sidebar = dynamic(() => import("@/components/layout/Sidebar").then(m => m.Sidebar), { ssr: false });
const FirebaseProvider = dynamic(() => import("@/components/providers/FirebaseProvider").then(m => m.FirebaseProvider), { ssr: false });

const getCachedSiteConfig = unstable_cache(
  async () => {
    return prisma.siteConfig
      .findFirst({ select: { siteName: true, logoUrl: true } })
      .catch(() => null);
  },
  ["site-config"],
  { revalidate: 300 }
);

export default async function CleanStudentLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  const isGuest = !authUser;

  const sessionUserId = authUser?.id ?? "";

  // Parallelize non-dependent fetches
  const [siteConfig, dbUser] = await Promise.all([
    getCachedSiteConfig(),
    !isGuest ? prisma.user.findUnique({
      where: { id: sessionUserId },
      select: { name: true, nickname: true, image: true, semesterId: true, role: true }
    }) : Promise.resolve(null)
  ]);

  const resolvedRole = dbUser?.role || authUser?.user_metadata?.role as string | undefined;
  const resolvedSemesterId = dbUser?.semesterId || authUser?.user_metadata?.semesterId as string | undefined;
  const displayName = dbUser?.nickname || dbUser?.name || authUser?.user_metadata?.name || "Student";
  const userImage = dbUser?.image || authUser?.user_metadata?.avatar_url || authUser?.user_metadata?.image || null;
  const isAdmin = resolvedRole === "ADMIN" || resolvedRole === "SUPER_ADMIN";

  // Redirect logic
  if (!isGuest && authUser) {
    const isSuperAdmin = resolvedRole === "SUPER_ADMIN" || authUser?.email === "ahmedhassan0business@gmail.com";
    if (!isAdmin && !resolvedSemesterId && !isSuperAdmin) {
      redirect("/register");
    }
  }

  return (
    <FirebaseProvider>
    <TelegramBlocker>
      <SiteConfigProvider
        initial={{
          siteName: siteConfig?.siteName ?? "MedOneX",
          logoUrl: siteConfig?.logoUrl ?? null,
        }}
      >
        <div className="app-shell app-shell--tabbar min-h-screen bg-background flex flex-col">
          <MobileChromeController />
          {/* Desktop Navigation */}
          <FloatingIslandNavbar
            userImage={userImage}
            userName={isGuest ? undefined : displayName}
            userId={isGuest ? "" : sessionUserId}
          />

          {/* Floating Mobile Header */}
          <GlobalTopBar
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
            isGuest={isGuest}
          />

          <div className="main-content flex-1 flex flex-col min-w-0">
            <main id="main-content" className="flex-1 flex flex-col outline-none w-full min-h-0 md:pb-8">
              <PageTransitionProvider>{children}</PageTransitionProvider>
            </main>
          </div>

          {/* Mobile Bottom Navigation */}
          <MobileBottomNav />
          <GlobalPostComposer
            currentUserName={displayName}
            currentUserAvatarUrl={userImage}
          />
        </div>
      </SiteConfigProvider>
    </TelegramBlocker>
    </FirebaseProvider>
  );
}
