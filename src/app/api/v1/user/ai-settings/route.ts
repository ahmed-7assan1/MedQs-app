import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PROVIDERS, getAllProviderIds } from "@/lib/providers";
import { encryptKey, maskKey } from "@/lib/encryption";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { adminAiKeys: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const keys: Record<string, { keyPreview: string }> = {};
  for (const id of getAllProviderIds()) {
    const cfg = PROVIDERS[id];
    const raw = (user as any)[cfg.keyField] as string | null | undefined;
    keys[id] = { keyPreview: maskKey(raw ?? null) };
  }

  let adminAiKeysPreview: Record<string, string> | null = null;
  if (user.adminAiKeys) {
    adminAiKeysPreview = {};
    for (const id of getAllProviderIds()) {
      const adminField = `encrypted${id.charAt(0).toUpperCase() + id.slice(1)}Key`;
      const raw = (user.adminAiKeys as any)[adminField] as string | null | undefined;
      adminAiKeysPreview[id] = maskKey(raw ?? null);
    }
  }

  return NextResponse.json({
    keys,
    adminAiKeys: adminAiKeysPreview,
    defaultAutoProvider: (user as any).defaultAutoProvider ?? null,
    featureOverrides: (user as any).featureOverrides ?? null,
    activeProvider: (user as any).activeProvider ?? null,
  });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const incoming: Record<string, { key?: string }> = body.keys ?? {};

  const data: Record<string, any> = {};
  for (const id of getAllProviderIds()) {
    const cfg = PROVIDERS[id];
    const entry = incoming[id];
    if (entry && typeof entry.key === "string" && entry.key.trim()) {
      data[cfg.keyField] = encryptKey(entry.key.trim());
    }
  }

  if (body.defaultAutoProvider !== undefined) {
    data.defaultAutoProvider = body.defaultAutoProvider;
  }
  if (body.featureOverrides !== undefined) {
    data.featureOverrides = body.featureOverrides;
  }
  if (body.activeProvider !== undefined) {
    data.activeProvider = body.activeProvider;
  }

  if (Object.keys(data).length > 0) {
    await prisma.user.update({
      where: { id: session.user.id },
      data,
    });
  }

  return NextResponse.json({ ok: true });
}
