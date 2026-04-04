import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { yearId: string } }) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name } = await req.json();
  const semester = await prisma.semester.create({
    data: { name, academicYearId: params.yearId },
  });
  return NextResponse.json(semester, { status: 201 });
}
