import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { systemId, structureId } = await req.json();

    let targetName = "Human Anatomy";
    let targetContext = "";

    if (structureId) {
      const struct = await (prisma as any).atlasStructure.findUnique({
        where: { id: structureId },
        include: { system: true }
      });
      if (struct) {
        targetName = struct.name;
        targetContext = `Structure: ${struct.name} (${struct.latin || ""})
System: ${struct.system.label}
Description: ${struct.desc}
Function: ${struct.fn || ""}
Blood Supply: ${struct.blood || ""}
Innervation: ${struct.nerve || ""}
Clinical Significance: ${struct.clinical || ""}`;
      }
    } else if (systemId) {
      const sys = await (prisma as any).atlasSystem.findUnique({
        where: { systemId },
        include: { structures: true }
      });
      if (sys) {
        targetName = sys.label;
        targetContext = `System: ${sys.label}
Description: ${sys.desc}
Structures in this system: ${sys.structures.map((s: any) => s.name).join(", ")}`;
      }
    }

    return NextResponse.json({ targetName, targetContext });
  } catch (error: any) {
    console.error("[ATLAS_CONTEXT_ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch atlas context" }, { status: 500 });
  }
}
