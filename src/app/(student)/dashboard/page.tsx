import { auth } from "@/lib/auth";
import { redirectIncompleteStudentToRegister } from "@/lib/student-onboarding";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/landing");
  await redirectIncompleteStudentToRegister(session);
  redirect("/dashboard-app");
}
