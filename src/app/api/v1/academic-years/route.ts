import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSessionScope, isSuperAdmin } from "@/lib/tenant";
import { fail, ok } from "@/platform/api/envelope";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const universityId = searchParams.get("universityId");
  const facultyId = searchParams.get("facultyId");

  const years = await prisma.academicYear.findMany({
    where: {
      ...(universityId ? { universityId } : {}),
      ...(facultyId ? { facultyId } : {}),
    },
    orderBy: { yearNumber: "asc" },
  });

  return ok({
    result: years,
    tenantKey: universityId || "GLOBAL"
  });
}
