import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const agent = await prisma.customAgent.findUnique({
      where: { id: params.id },
    });

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    await prisma.customAgent.update({
      where: { id: params.id },
      data: { usageCount: { increment: 1 } },
    });

    return NextResponse.json({
      instructions: agent.instructions,
      files: agent.files,
      links: agent.links,
      name: agent.name,
      description: agent.description,
    });
  } catch (error) {
    console.error("Failed to load agent:", error);
    return NextResponse.json({ error: "Failed to load agent" }, { status: 500 });
  }
}
