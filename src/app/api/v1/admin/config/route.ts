import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdminWriter } from "@/lib/admin-scope";

export async function GET() {
  const config = await prisma.siteConfig.findFirst();
  return NextResponse.json(config ?? {});
}

const BRANDING_KEYS = new Set([
  "siteName",
  "logoUrl",
  "faviconUrl",
  "primaryColor",
  "fontSans",
  "fontArabic",
]);

function pickBranding(data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of BRANDING_KEYS) {
    if (Object.prototype.hasOwnProperty.call(data, k)) out[k] = data[k];
  }
  return out;
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  const w = await requireAdminWriter(session);
  if (!w.ok) return w.response;

  const raw = (await req.json()) as Record<string, unknown>;
  const data = w.isSuper ? raw : pickBranding(raw);

  if (!w.isSuper && Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No branding fields in request" }, { status: 400 });
  }

  const existing = await prisma.siteConfig.findFirst();
  const id = existing?.id;

  if (!w.isSuper) {
    if (!id) {
      return NextResponse.json({ error: "Site config not initialized" }, { status: 503 });
    }
    const merged = { ...existing, ...data } as Record<string, unknown>;
    const config = await prisma.siteConfig.update({
      where: { id },
      data: {
        siteName: typeof merged.siteName === "string" ? merged.siteName : existing.siteName,
        logoUrl: merged.logoUrl === null || typeof merged.logoUrl === "string" ? merged.logoUrl : existing.logoUrl,
        faviconUrl:
          merged.faviconUrl === null || typeof merged.faviconUrl === "string"
            ? merged.faviconUrl
            : existing.faviconUrl,
        primaryColor: typeof merged.primaryColor === "string" ? merged.primaryColor : existing.primaryColor,
        fontSans: typeof merged.fontSans === "string" ? merged.fontSans : existing.fontSans,
        fontArabic: typeof merged.fontArabic === "string" ? merged.fontArabic : existing.fontArabic,
      },
    });
    return NextResponse.json(config);
  }

  const config = await prisma.siteConfig.upsert({
    where: { id: id ?? "default" },
    create: data as any,
    update: data as any,
  });

  return NextResponse.json(config);
}
