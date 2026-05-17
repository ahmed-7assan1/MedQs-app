import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const systems = await prisma.atlasSystem.findMany({
      include: {
        structures: true,
      },
    });

    return NextResponse.json(systems);
  } catch (error: any) {
    console.error("[ATLAS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
