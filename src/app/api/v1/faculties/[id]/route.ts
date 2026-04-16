import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdminWriter } from "@/lib/admin-scope";

// PUT /api/v1/faculties/[id]
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  const w = await requireAdminWriter(session);
  if (!w.ok) return w.response;

  const { name, logoUrl } = await req.json();
  const faculty = await prisma.faculty.update({
    where: { id: params.id },
    data: {
      ...(name?.trim() ? { name: name.trim() } : {}),
      ...(logoUrl !== undefined ? { logoUrl } : {}),
    },
  });

  return NextResponse.json(faculty);
}

// DELETE /api/v1/faculties/[id]
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  const w = await requireAdminWriter(session);
  if (!w.ok) return w.response;

  await prisma.faculty.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
