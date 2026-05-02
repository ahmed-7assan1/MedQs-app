import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    const isAdmin = (session?.user as any)?.role === "ADMIN" || (session?.user as any)?.role === "SUPER_ADMIN";
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const config = await (prisma.siteConfig as any).findFirst({
      select: {
        stabilityAIKey: true,
        assemblyAIKey: true,
        uploadcarePublicKey: true
      }
    }).catch(() => null);

    return NextResponse.json({
      stability: config?.stabilityAIKey ? "••••••••" : "",
      assembly: config?.assemblyAIKey ? "••••••••" : "",
      uploadcare: config?.uploadcarePublicKey || ""
    });
  } catch (error: any) {
    return NextResponse.json({ stability: "", assembly: "", uploadcare: "", error: error.message });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const isAdmin = (session?.user as any)?.role === "ADMIN" || (session?.user as any)?.role === "SUPER_ADMIN";
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { provider, key } = await req.json();
    const config = await (prisma.siteConfig as any).findFirst();
    const id = config?.id || "default";

    const updateData: any = {};
    if (provider === "stability") updateData.stabilityAIKey = key;
    if (provider === "assembly") updateData.assemblyAIKey = key;
    if (provider === "uploadcare") updateData.uploadcarePublicKey = key;

    await (prisma.siteConfig as any).upsert({
      where: { id },
      create: { id, ...updateData },
      update: updateData
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
