import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSessionScope, isSuperAdmin } from "@/lib/tenant";
import { fail, ok } from "@/platform/api/envelope";

// GET /api/v1/subjects-all
export async function GET() {
  const session = await auth();
  const scope = await getSessionScope(session);
  if (!scope) return fail({ error: "Unauthorized", status: 401 });
  if (!isSuperAdmin(scope.role) && !scope.universityId) return fail({ error: "Forbidden", status: 403 });

  const subjects = await prisma.subject.findMany({
    where: isSuperAdmin(scope.role)
      ? undefined
      : {
          module: { semester: { academicYear: { universityId: scope.universityId! } } },
        },
    orderBy: { name: "asc" },
  });
  return ok({
    result: subjects,
    tenantKey: scope.universityId,
    actor: { id: scope.userId, role: scope.role ?? "STUDENT" },
  });
}
