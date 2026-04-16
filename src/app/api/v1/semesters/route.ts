import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSessionScope, isSuperAdmin } from "@/lib/tenant";
import { fail, ok } from "@/platform/api/envelope";

// GET all semesters (admin)
export async function GET(req: Request) {
  const session = await auth();
  const scope = await getSessionScope(session);
  if (!scope) return fail({ error: "Unauthorized", status: 401 });

  const { searchParams } = new URL(req.url);
  const academicYearId = searchParams.get("academicYearId");

  // If a specific year is requested (onboarding), allow it if authenticated.
  // Otherwise, fallback to the user's session scope.
  const semesters = await prisma.semester.findMany({
    where: academicYearId 
      ? { academicYearId } 
      : (isSuperAdmin(scope.role)
        ? undefined
        : { academicYear: { universityId: scope.universityId! } }),
    orderBy: { name: "asc" },
  });

  return ok({
    result: semesters,
    tenantKey: scope.universityId || "GLOBAL",
    actor: { id: scope.userId, role: scope.role ?? "STUDENT" },
  });
}
