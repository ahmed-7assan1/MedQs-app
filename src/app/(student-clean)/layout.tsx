import { createClient } from "@/lib/supabase/server";
import dynamic from "next/dynamic";
import { SiteConfigProvider } from "@/contexts/SiteConfigContext";
import { NavbarWrapper } from "@/components/layout/NavbarWrapper";
import { TopBarWrapper } from "@/components/layout/TopBarWrapper";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { MobileChromeController } from "@/components/layout/MobileChromeController";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { redirect } from "next/navigation";
import { TelegramBlocker } from "@/components/system/TelegramBlocker";
import { PuterScript } from "@/components/system/PuterScript";
import { PageTransitionProvider } from "@/components/providers/PageTransitionProvider";
import { unstable_cache } from "next/cache";
import { CACHE_TTL } from "@/lib/cache-tags";

const Sidebar = dynamic(() => import("@/components/layout/SidebarWrapper").then(m => m.SidebarWrapper), { ssr: false });
const FirebaseProvider = dynamic(() => import("@/components/providers/FirebaseProvider").then(m => m.FirebaseProvider), { ssr: false });

const getCachedSiteConfig = unstable_cache(
  async () => {
    return prisma.siteConfig
      .findFirst({ select: { siteName: true, logoUrl: true } })
      .catch(() => null);
  },
  ["site-config"],
  { revalidate: CACHE_TTL.SITE_CONFIG }
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

  let resolvedRole = dbUser?.role || authUser?.user_metadata?.role as string | undefined;
  let resolvedSemesterId = dbUser?.semesterId || authUser?.user_metadata?.semesterId as string | undefined;
  let displayName = dbUser?.nickname || dbUser?.name || authUser?.user_metadata?.name || "Student";
  const userImage = dbUser?.image || authUser?.user_metadata?.avatar_url || authUser?.user_metadata?.image || null;
  let isAdmin = resolvedRole === "ADMIN" || resolvedRole === "SUPER_ADMIN";

  // Fallback sync: if Prisma has no academic data but Supabase metadata does, upsert now
  if (!isGuest && authUser && (!dbUser || !resolvedSemesterId) && authUser?.user_metadata?.semesterId) {
    try {
      const meta = authUser.user_metadata;
      const metaName = meta?.name as string | undefined;
      const metaUniId = meta?.universityId as string | undefined;
      const metaFacId = meta?.facultyId as string | undefined;
      const metaSemId = meta?.semesterId as string | undefined;

      if (!dbUser) {
        const codeSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const studentCode = `USR-${Date.now().toString().slice(-6)}-${codeSuffix}`;
        await prisma.user.create({
          data: {
            id: authUser.id,
            email: authUser.email!,
            name: metaName || authUser.email?.split('@')[0] || "Student",
            universityId: metaUniId,
            facultyId: metaFacId,
            semesterId: metaSemId,
            role: "STUDENT",
            studentCode,
          }
        });
      } else {
        await prisma.user.update({
          where: { id: authUser.id },
          data: {
            semesterId: metaSemId,
            ...(metaUniId && { universityId: metaUniId }),
            ...(metaFacId && { facultyId: metaFacId }),
            ...(metaName && { name: metaName }),
          }
        });
      }

      // Re-evaluate from the freshly-synced metadata
      resolvedSemesterId = metaSemId;
      resolvedRole = resolvedRole || "STUDENT";
      displayName = metaName || displayName;
      isAdmin = resolvedRole === "ADMIN" || resolvedRole === "SUPER_ADMIN";
    } catch (e) {
      console.error("[layout] Profile sync error:", e);
    }
  }

  // Redirect logic
  if (!isGuest && authUser) {
    const isSuperAdmin = resolvedRole === "SUPER_ADMIN" || authUser?.email === "ahmedhassan0business@gmail.com";
    if (!isAdmin && !resolvedSemesterId && !isSuperAdmin) {
      redirect("/register");
    }
  }

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
        <div className="app-shell app-shell--tabbar min-h-screen bg-background/90 flex flex-col">

          {/* Purple ambient glow — brand signature */}
          <div
            className="pointer-events-none fixed inset-0 z-0 opacity-[0.15] dark:opacity-[0.25] max-md:opacity-[0.08]"
            style={{
              background:
                "radial-gradient(ellipse 80% 60% at 0% 0%, #E7D6FF 0%, #B36BFF 25%, #7C3AED 45%, transparent 70%)",
            }}
          />

          <MobileChromeController />
          {/* Desktop Navigation */}
          <NavbarWrapper
            userImage={userImage}
            userName={isGuest ? undefined : displayName}
            userId={isGuest ? "" : sessionUserId}
          />

          {/* Floating Mobile Header */}
          <TopBarWrapper
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
        </div>
      </SiteConfigProvider>
    </TelegramBlocker>
    </FirebaseProvider>
    </>
  );
}
