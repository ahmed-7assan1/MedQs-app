import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSessionScope, isSuperAdmin } from "@/lib/tenant";
import { fail, ok } from "@/platform/api/envelope";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const universityId = searchParams.get("universityId");
  const facultyId = searchParams.get("facultyId");

  const targetUniId = universityId;

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
    actor: { id: scope?.userId || "anonymous", role: scope?.role ?? "STUDENT" },
  });
}
