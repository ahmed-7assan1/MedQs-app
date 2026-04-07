import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import { prisma } from "@/lib/prisma";

/** STUDENT users must have university + semester before using the main app. */
export async function redirectIncompleteStudentToRegister(session: Session | null) {
  const id = session?.user?.id;
  if (!id) return;
  const role = (session.user as { role?: string }).role;
  if (role !== "STUDENT") return;
  const u = await prisma.user.findUnique({
    where: { id },
    select: { universityId: true, semesterId: true },
  });
  if (!u?.universityId || !u?.semesterId) redirect("/register");
}
