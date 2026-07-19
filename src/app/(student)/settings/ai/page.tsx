import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { StudentPageShell } from "@/components/layout/StudentPageShell";
import { AIKeysClient } from "@/components/settings/AIKeysClient";

export default async function AISettingsPage() {
  const supabase = createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  let dbUser = null;
  if (authUser) {
    dbUser = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { id: true, name: true, email: true, image: true, role: true }
    }).catch(() => null);
  }

  const userProfile = dbUser ? {
    id: dbUser.id,
    name: dbUser.name || "Student",
    email: dbUser.email || authUser?.email || "",
    image: dbUser.image || null,
    role: dbUser.role || "STUDENT"
  } : authUser ? {
    id: authUser.id,
    name: authUser.user_metadata?.name || authUser.email || "Student",
    email: authUser.email || "",
    image: authUser.user_metadata?.avatar_url || null,
    role: "STUDENT"
  } : null;

  if (!userProfile) {
    return <div className="p-8 text-center text-muted-foreground">Please sign in to manage AI keys.</div>;
  }

  return (
    <>
      {/* Mobile */}
      <div className="md:hidden min-h-screen cinematic-bg">
        <div className="px-4 pt-6 pb-12">
          <AIKeysClient />
        </div>
      </div>
      {/* Desktop */}
      <div className="hidden md:block">
        <StudentPageShell
          maxWidthClass="max-w-4xl"
          eyebrow="API Keys"
          title="AI Provider Keys"
          subtitle="Add your own API keys to use your preferred AI provider. Keys are encrypted at rest."
        >
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <AIKeysClient />
          </div>
        </StudentPageShell>
      </div>
    </>
  );
}
