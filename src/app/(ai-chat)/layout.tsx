import { auth } from "@/lib/auth";
import { SiteConfigProvider } from "@/contexts/SiteConfigContext";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function AIChatLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  const siteConfig = await prisma.siteConfig
    .findFirst({
      select: { siteName: true, logoUrl: true },
    })
    .catch(() => null);

  return (
    <SiteConfigProvider
      initial={{
        siteName: siteConfig?.siteName ?? "MedQs",
        logoUrl: siteConfig?.logoUrl ?? null,
      }}
    >
      <div className="min-h-screen bg-[#12111A]">
        {children}
      </div>
    </SiteConfigProvider>
  );
}
