import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import TeamsClient from "./TeamsClient";

export const dynamic = "force-dynamic";

export default async function AdminTeamsPage() {
  const supabase = createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) redirect("/auth?mode=login");

  const dbUser = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { role: true }
  });

  const role = dbUser?.role || authUser?.user_metadata?.role;
  const isSuperAdmin = role === "SUPER_ADMIN" || authUser.email === "ahmedhassan0business@gmail.com";

  if (!isSuperAdmin) {
    redirect("/admin/dashboard");
  }

  return <TeamsClient />;
}
