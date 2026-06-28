import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { invalidateSiteConfigCache } from "@/lib/get-site-config";
import { requireAdminWriter } from "@/lib/admin-scope";

export const dynamic = "force-dynamic";

const AI_AGENT_KEYS = new Set([
  "siliconFlowKey",
  "siliconFlowUrl",
  "siliconFlowModel",
  "geminiKeyOverride",
  "deepseekKeyOverride",
  "deepseekUrlOverride",
  "groqKeyOverride",
  "groqModelOverride",
  "openRouterKeyOverride",
  "openRouterModelOverride",
  "xaiKeyOverride",
  "xaiModelOverride",
  "proxyUrlOverride",
  "proxyKeyOverride",
  "anthropicKeyOverride",
  "anthropicModelOverride",
  "openAIKeyOverride",
  "openAIModelOverride",
  "aiPreferredProvider",
  "enableAI",
]);

export async function GET() {
  const session = await auth();
  const w = await requireAdminWriter(session);
  if (!w.ok) return w.response;

  const config = await prisma.siteConfig.findFirst({
    select: {
      siliconFlowKey: true,
      siliconFlowUrl: true,
      siliconFlowModel: true,
      geminiKeyOverride: true,
      deepseekKeyOverride: true,
      deepseekUrlOverride: true,
      groqKeyOverride: true,
      groqModelOverride: true,
      openRouterKeyOverride: true,
      openRouterModelOverride: true,
      xaiKeyOverride: true,
      xaiModelOverride: true,
      proxyUrlOverride: true,
      proxyKeyOverride: true,
      anthropicKeyOverride: true,
      anthropicModelOverride: true,
      openAIKeyOverride: true,
      openAIModelOverride: true,
      aiPreferredProvider: true,
      enableAI: true,
    },
  });

  if (!config) return NextResponse.json({});

  // Mask sensitive keys
  const masked = {
    ...config,
    siliconFlowKey: config.siliconFlowKey ? "••••••••" : null,
    geminiKeyOverride: config.geminiKeyOverride ? "••••••••" : null,
    deepseekKeyOverride: config.deepseekKeyOverride ? "••••••••" : null,
    groqKeyOverride: config.groqKeyOverride ? "••••••••" : null,
    openRouterKeyOverride: config.openRouterKeyOverride ? "••••••••" : null,
    xaiKeyOverride: config.xaiKeyOverride ? "••••••••" : null,
    proxyKeyOverride: config.proxyKeyOverride ? "••••••••" : null,
    anthropicKeyOverride: config.anthropicKeyOverride ? "••••••••" : null,
    openAIKeyOverride: config.openAIKeyOverride ? "••••••••" : null,
  };

  return NextResponse.json(masked);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  const w = await requireAdminWriter(session);
  if (!w.ok) return w.response;

  const raw = (await req.json()) as Record<string, unknown>;

  // Filter to only allowed AI agent keys
  const data: Record<string, unknown> = {};
  for (const k of AI_AGENT_KEYS) {
    if (Object.prototype.hasOwnProperty.call(raw, k)) {
      // Don't overwrite stored key with masked placeholder
      if (typeof raw[k] === "string" && (raw[k] as string) === "••••••••") continue;
      data[k] = raw[k];
    }
  }

  const existing = await prisma.siteConfig.findFirst();

  if (existing) {
    const config = await prisma.siteConfig.update({
      where: { id: existing.id },
      data: data as any,
    });
    invalidateSiteConfigCache();
    return NextResponse.json(config);
  } else {
    const config = await prisma.siteConfig.create({ data: data as any });
    invalidateSiteConfigCache();
    return NextResponse.json(config);
  }
}
