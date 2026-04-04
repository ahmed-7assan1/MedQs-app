import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/v1/universities
export async function GET() {
  const unis = await prisma.university.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(unis);
}

// POST /api/v1/universities
export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, logoUrl } = await req.json();
  const uni = await prisma.university.create({ data: { name, logoUrl } });
  return NextResponse.json(uni, { status: 201 });
}
