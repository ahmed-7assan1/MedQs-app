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

  // Build the where clause — ADMIN sees only their faculty's modules
  let where: Record<string, unknown> | undefined = undefined;
  if (!isSuperAdmin(scope.role)) {
    if (scope.facultyId) {
      // Scoped admin: filter by facultyId (through academicYear)
      where = {
        semester: {
          academicYear: {
            universityId: scope.universityId!,
            facultyId: scope.facultyId,
          },
        },
      };
    } else {
      // Admin without facultyId: fallback to university-wide filter
      where = {
        semester: { academicYear: { universityId: scope.universityId! } },
      };
    }
  }

  const modules = await prisma.module.findMany({
    where,
    orderBy: { name: "asc" },
    include: { semester: { select: { id: true, name: true } } },
  });
  return ok({
    result: modules,
    tenantKey: scope.universityId,
    actor: { id: scope.userId, role: scope.role ?? "STUDENT" },
  });
}
