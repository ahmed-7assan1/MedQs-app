import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSessionScope, isSuperAdmin } from "@/lib/tenant";
import { fail, ok } from "@/platform/api/envelope";

export async function GET(req: Request) {
  const session = await auth();
  const scope = await getSessionScope(session);
  if (!scope) return fail({ error: "Unauthorized", status: 401 });

  const { searchParams } = new URL(req.url);
  const universityId = searchParams.get("universityId");
  const facultyId = searchParams.get("facultyId");

  // Onboarding users can query by uni/faculty ID if they are authenticated.
  const targetUniId = universityId || (isSuperAdmin(scope.role) ? undefined : scope.universityId);

  const years = await prisma.academicYear.findMany({
    where: {
      universityId: targetUniId ? targetUniId : undefined,
      ...(facultyId ? { facultyId } : {}),
    },
    orderBy: { yearNumber: "asc" },
  });

  return ok({
    result: years,
    tenantKey: targetUniId || "GLOBAL",
    actor: { id: scope.userId, role: scope.role ?? "STUDENT" },
  });
}
