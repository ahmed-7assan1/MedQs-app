import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const agents = await prisma.customAgent.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const data = agents.map(a => ({
      id: a.id,
      name: a.name,
      description: a.description,
      creatorId: a.creatorId,
      avgRating: a.avgRating,
      ratingCount: a.ratingCount,
      usageCount: a.usageCount,
      createdAt: a.createdAt,
    }));

    return NextResponse.json({ agents: data });
  } catch (error) {
    console.error("Failed to fetch agents:", error);
    return NextResponse.json({ error: "Failed to fetch agents" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description, instructions, files, links } = await req.json();
    if (!name || !instructions) {
      return NextResponse.json({ error: "Name and instructions are required" }, { status: 400 });
    }

    const agent = await prisma.customAgent.create({
      data: {
        creatorId: session.user.id,
        name,
        description: description || null,
        instructions,
        files: files || [],
        links: links || [],
        isPublished: true,
      },
    });

    return NextResponse.json({ success: true, agent });
  } catch (error) {
    console.error("Failed to create agent:", error);
    return NextResponse.json({ error: "Failed to create agent" }, { status: 500 });
  }
}
