import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Admins can manage templates, or fetch all templates for exporting
    const templates = await prisma.documentTemplate.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json({ templates });
  } catch (error: any) {
    console.error("GET /api/v1/templates error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, fileUrl } = body;

    if (!name || !fileUrl) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const template = await prisma.documentTemplate.create({
      data: {
        name,
        fileUrl,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ success: true, template });
  } catch (error: any) {
    console.error("POST /api/v1/templates error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
