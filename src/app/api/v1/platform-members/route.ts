import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const members = await prisma.platformMember.findMany({
      orderBy: { sortOrder: 'asc' }
    });
    return NextResponse.json(members);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN" && (session?.user as any)?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, role, description, imageUrl, socialUrl, order } = body;

    const member = await prisma.platformMember.create({
      data: {
        name,
        role,
        description,
        imageUrl,
        socialUrl,
        sortOrder: order || 0,
      }
    });

    return NextResponse.json(member);
  } catch (error) {
    console.error("Create member error:", error);
    return NextResponse.json({ error: "Failed to create member" }, { status: 500 });
  }
}
