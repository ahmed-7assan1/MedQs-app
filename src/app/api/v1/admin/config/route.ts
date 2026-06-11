import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSiteConfig, invalidateSiteConfigCache } from "@/lib/get-site-config";
import { requireAdminWriter } from "@/lib/admin-scope";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = await getSiteConfig();
  return NextResponse.json(config ?? {});
}

const BRANDING_KEYS = new Set([
  "siteName",
  "logoUrl",
  "logoUrlDark",
  "faviconUrl",
  "pwaIconUrl",
  "primaryColor",
  "fontSans",
  "fontArabic",
  "facebookUrl",
  "twitterUrl",
  "youtubeUrl",
  "instagramUrl",
  "telegramUrl",
  "whatsappUrl",
  "hulkLogoUrl",
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
        logoUrlDark: merged.logoUrlDark === null || typeof merged.logoUrlDark === "string" ? merged.logoUrlDark : existing.logoUrlDark,
        faviconUrl:
          merged.faviconUrl === null || typeof merged.faviconUrl === "string"
            ? merged.faviconUrl
            : existing.faviconUrl,
        pwaIconUrl:
          merged.pwaIconUrl === null || typeof merged.pwaIconUrl === "string"
            ? merged.pwaIconUrl
            : existing.pwaIconUrl,
        primaryColor: typeof merged.primaryColor === "string" ? merged.primaryColor : existing.primaryColor,
        fontSans: typeof merged.fontSans === "string" ? merged.fontSans : existing.fontSans,
        fontArabic: typeof merged.fontArabic === "string" ? merged.fontArabic : existing.fontArabic,
        facebookUrl: merged.facebookUrl === null || typeof merged.facebookUrl === "string" ? merged.facebookUrl : existing.facebookUrl,
        twitterUrl: merged.twitterUrl === null || typeof merged.twitterUrl === "string" ? merged.twitterUrl : existing.twitterUrl,
        youtubeUrl: merged.youtubeUrl === null || typeof merged.youtubeUrl === "string" ? merged.youtubeUrl : existing.youtubeUrl,
        instagramUrl: merged.instagramUrl === null || typeof merged.instagramUrl === "string" ? merged.instagramUrl : existing.instagramUrl,
        telegramUrl: merged.telegramUrl === null || typeof merged.telegramUrl === "string" ? merged.telegramUrl : existing.telegramUrl,
        whatsappUrl: merged.whatsappUrl === null || typeof merged.whatsappUrl === "string" ? merged.whatsappUrl : existing.whatsappUrl,
        hulkLogoUrl: merged.hulkLogoUrl === null || typeof merged.hulkLogoUrl === "string" ? merged.hulkLogoUrl : existing.hulkLogoUrl,
      },
    });
    invalidateSiteConfigCache();
    return NextResponse.json(config);
  }

  const config = await prisma.siteConfig.upsert({
    where: { id: id ?? "default" },
    create: data as any,
    update: data as any,
  });

  invalidateSiteConfigCache();
  return NextResponse.json(config);
}
