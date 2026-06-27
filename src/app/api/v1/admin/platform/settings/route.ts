import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAdminAction } from "@/lib/admin-logger";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (session?.user?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [siteConfig, featureFlags, telegramConfig] = await Promise.all([
      prisma.siteConfig.findFirst(),
      prisma.featureFlag.findMany({ orderBy: { key: "asc" } }),
      prisma.telegramConfig.findFirst(),
    ]);

    return NextResponse.json({ data: { siteConfig, featureFlags, telegramConfig } });
  } catch (error: any) {
    console.error("[PLATFORM_SETTINGS_GET] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { section, data } = body;

    if (section === "siteConfig") {
      const config = await prisma.siteConfig.upsert({
        where: { id: "global" },
        create: { id: "global", ...data },
        update: data,
      });
      await logAdminAction({
        adminId: session.user.id,
        action: "UPDATE",
        entityType: "SITE_CONFIG",
        description: "Updated site configuration",
        newState: data,
      });
      return NextResponse.json({ data: config });
    }

    if (section === "featureFlags") {
      const { key, enabled, universityId, payload } = data;
      const flag = await prisma.featureFlag.upsert({
        where: { universityId_key: { universityId: universityId ?? "", key } },
        create: { key, enabled, universityId: universityId ?? null, payload },
        update: { enabled, payload },
      });
      await logAdminAction({
        adminId: session.user.id,
        action: "UPDATE",
        entityType: "SETTING",
        entityId: flag.id,
        description: `Feature flag ${key} ${enabled ? "enabled" : "disabled"}`,
      });
      return NextResponse.json({ data: flag });
    }

    return NextResponse.json({ error: "Invalid section" }, { status: 400 });
  } catch (error: any) {
    console.error("[PLATFORM_SETTINGS_PATCH] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { section, data } = body;

    if (section === "featureFlags") {
      const { key, enabled, universityId, payload } = data;
      const flag = await prisma.featureFlag.create({
        data: { key, enabled, universityId: universityId ?? null, payload },
      });
      return NextResponse.json({ data: flag }, { status: 201 });
    }

    return NextResponse.json({ error: "Invalid section" }, { status: 400 });
  } catch (error: any) {
    console.error("[PLATFORM_SETTINGS_POST] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
