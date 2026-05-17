import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session || !["ADMIN", "SUPER_ADMIN"].includes(role)) return null;
  return session;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const systemId = searchParams.get("systemId");
    const q = searchParams.get("q");

    const structures = await prisma.atlasStructure.findMany({
      where: {
        ...(systemId ? { systemId } : {}),
        ...(q ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { latin: { contains: q, mode: "insensitive" } },
            { desc: { contains: q, mode: "insensitive" } },
          ]
        } : {}),
      },
      include: { system: { select: { label: true, iconColor: true } } },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(structures);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const structure = await prisma.atlasStructure.create({ data: body });
    return NextResponse.json(structure, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
