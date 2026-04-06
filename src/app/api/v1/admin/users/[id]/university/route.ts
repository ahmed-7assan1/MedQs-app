import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSessionScope, isSuperAdmin } from "@/lib/tenant";
import { z } from "zod";

const Schema = z.object({
  universityId: z.string().uuid().nullable(),
});

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  const scope = await getSessionScope(session);
  if (!scope) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSuperAdmin(scope.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid universityId" }, { status: 400 });

  const updated = await prisma.user.update({
    where: { id: params.id },
    data: { universityId: parsed.data.universityId },
    select: { id: true, universityId: true },
  });
  return NextResponse.json(updated);
}

