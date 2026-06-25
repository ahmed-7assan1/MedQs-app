import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TestimonialsAdminClient } from "./TestimonialsAdminClient";

export const dynamic = "force-dynamic";

export default async function AdminTestimonialsPage() {
  const supabase = createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) redirect("/auth?mode=login");

  return <TestimonialsAdminClient />;
}
