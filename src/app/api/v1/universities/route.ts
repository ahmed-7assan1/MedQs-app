import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdminWriter } from "@/lib/admin-scope";

export async function GET() {
  try {
    const unis = await prisma.university.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, logoUrl: true },
    });
    return NextResponse.json(unis, {
      headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=7200" },
    });
  } catch (error) {
    console.error("GET /api/v1/universities error:", error);
    return NextResponse.json({ error: "Failed to fetch universities" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const w = await requireAdminWriter(session);
  if (!w.ok) return w.response;
  if (!w.isSuper) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { name, logoUrl } = await req.json();
    const uni = await prisma.university.create({ data: { name, logoUrl } });
    return NextResponse.json(uni, { status: 201 });
  } catch (error) {
    console.error("POST /api/v1/universities error:", error);
    return NextResponse.json({ error: "Failed to create university" }, { status: 500 });
  }
}
