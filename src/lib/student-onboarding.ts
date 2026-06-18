import { redirect } from "next/navigation";
import type { AuthSession as Session } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** STUDENT users must have university + semester before using the main app. */
export async function redirectIncompleteStudentToRegister(session: Session | null) {
  const id = session?.user?.id;
  if (!id) return;
  const role = (session.user as { role?: string }).role;
  if (role !== "STUDENT") return;
  try {
    const u = await prisma.user.findUnique({
      where: { id },
      select: { universityId: true, semesterId: true },
    });
    if (!u?.universityId || !u?.semesterId) redirect("/auth?mode=onboarding");
  } catch (err) {
    // Avoid a full app crash when DB is temporarily unreachable.
    // Keep user on current route; other pages can retry once DB is back.
    console.warn("[student-onboarding] DB lookup skipped:", err instanceof Error ? err.message : err);
  }
}
