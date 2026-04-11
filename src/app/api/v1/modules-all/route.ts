import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSessionScope, isSuperAdmin } from "@/lib/tenant";
import { fail, ok } from "@/platform/api/envelope";

// GET /api/v1/modules-all - all modules for admin tree view
export async function GET() {
  const session = await auth();
  const scope = await getSessionScope(session);
  if (!scope) return fail({ error: "Unauthorized", status: 401 });

  if (!isSuperAdmin(scope.role) && !scope.universityId) {
    return fail({ error: "Forbidden", status: 403 });
  }

  const modules = await prisma.module.findMany({
    where: isSuperAdmin(scope.role)
      ? undefined
      : {
          semester: { academicYear: { universityId: scope.universityId! } },
        },
    orderBy: { name: "asc" },
    include: { semester: { select: { id: true, name: true } } },
  });
  return ok({
    result: modules,
    tenantKey: scope.universityId,
    actor: { id: scope.userId, role: scope.role ?? "STUDENT" },
  });
}
