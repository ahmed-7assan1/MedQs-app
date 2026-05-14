import { createClient } from "@/lib/supabase/server";
import { SiteConfigProvider } from "@/contexts/SiteConfigContext";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { redirect } from "next/navigation";
import { TelegramBlocker } from "@/components/system/TelegramBlocker";
import { PageTransitionProvider } from "@/components/providers/PageTransitionProvider";
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

export default async function CleanStudentLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  const isGuest = !authUser;

  const userMeta = authUser?.user_metadata;
  const userRole = userMeta?.role as string | undefined;
  const userSemesterId = userMeta?.semesterId as string | undefined;

  if (!isGuest && authUser) {
    const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN";
    const isSuperAdmin = userRole === "SUPER_ADMIN" || authUser?.email === "ahmedhassan0business@gmail.com";

    if (!isAdmin && !userSemesterId && !isSuperAdmin) {
      redirect("/register");
    }
  }

  const siteConfig = await getCachedSiteConfig();

  return (
    <TelegramBlocker>
      <SiteConfigProvider
        initial={{
          siteName: siteConfig?.siteName ?? "MedQs",
          logoUrl: siteConfig?.logoUrl ?? null,
        }}
      >
        <div className="min-h-screen dark:bg-[#07080f] bg-white">
          <PageTransitionProvider>
            {children}
          </PageTransitionProvider>
        </div>
      </SiteConfigProvider>
    </TelegramBlocker>
  );
}
