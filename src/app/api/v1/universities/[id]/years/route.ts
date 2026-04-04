import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ─── /api/v1/universities/[id]/years ─────────────────────────────────────────

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { yearNumber } = await req.json();
  const year = await prisma.academicYear.create({
    data: { yearNumber: Number(yearNumber), universityId: params.id },
  });
  return NextResponse.json(year, { status: 201 });
}
