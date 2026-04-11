import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSessionScope, isSuperAdmin } from "@/lib/tenant";
import { fail, ok } from "@/platform/api/envelope";

export async function GET() {
  const session = await auth();
  const scope = await getSessionScope(session);
  if (!scope) return fail({ error: "Unauthorized", status: 401 });
  if (!isSuperAdmin(scope.role) && !scope.universityId) return fail({ error: "Forbidden", status: 403 });

  const years = await prisma.academicYear.findMany({
    where: isSuperAdmin(scope.role) ? undefined : { universityId: scope.universityId! },
    orderBy: { yearNumber: "asc" },
  });
  return ok({
    result: years,
    tenantKey: scope.universityId,
    actor: { id: scope.userId, role: scope.role ?? "STUDENT" },
  });
}
