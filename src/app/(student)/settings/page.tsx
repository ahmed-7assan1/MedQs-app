import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { StudentPageShell } from "@/components/layout/StudentPageShell";
import { SettingsClient } from "@/components/settings/SettingsClient";

export default async function SettingsPage() {
  const supabase = createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  let dbUser = null;
  if (authUser) {
    dbUser = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { name: true, email: true, image: true, role: true }
    }).catch(() => null);
  }

  const userProfile = dbUser ? {
    name: dbUser.name || "Student",
    email: dbUser.email || authUser?.email || "",
    image: dbUser.image || null,
    role: dbUser.role || "STUDENT"
  } : authUser ? {
    name: authUser.user_metadata?.name || authUser.email || "Student",
    email: authUser.email || "",
    image: authUser.user_metadata?.avatar_url || null,
    role: "STUDENT"
  } : null;

  return (
    <>
      {/* Mobile */}
      <div className="md:hidden">
        <div className="px-4 pt-4 pb-12">
          <SettingsClient user={userProfile} />
        </div>
      </div>
      {/* Desktop */}
      <div className="hidden md:block">
        <StudentPageShell
          maxWidthClass="max-w-4xl"
          eyebrow="Preferences Hub"
          title="Settings Center"
          subtitle="Configure your clinical workspace, sync integrations, and manage your digital privacy with surgical precision."
        >
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <SettingsClient user={userProfile} />
          </div>
        </StudentPageShell>
      </div>
    </>
  );
}
