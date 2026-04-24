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

  let where: Record<string, unknown> | undefined = undefined;
  if (!isSuperAdmin(scope.role)) {
    if (scope.facultyId) {
      where = {
        module: {
          semester: {
            academicYear: {
              universityId: scope.universityId!,
              facultyId: scope.facultyId,
            },
          },
        },
      };
    } else {
      where = {
        module: { semester: { academicYear: { universityId: scope.universityId! } } },
      };
    }
  }

  const subjects = await prisma.subject.findMany({
    where,
    orderBy: { name: "asc" },
  });
  return ok({
    result: subjects,
    tenantKey: scope.universityId,
    actor: { id: scope.userId, role: scope.role ?? "STUDENT" },
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    }
  });
}
