import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAllProviderIds, PROVIDERS } from "@/lib/providers";
import { encryptKey, maskKey } from "@/lib/encryption";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = (session.user as any).role === "ADMIN" || (session.user as any).role === "SUPER_ADMIN";
  if (!isAdmin) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const adminKeys = await prisma.adminAIKeys.findUnique({
    where: { adminId: session.user.id },
  });

  const keys: Record<string, { keyPreview: string }> = {};
  if (adminKeys) {
    for (const id of getAllProviderIds()) {
      const field = `encrypted${id.charAt(0).toUpperCase() + id.slice(1)}Key`;
      const raw = (adminKeys as any)[field] as string | null | undefined;
      keys[id] = { keyPreview: maskKey(raw ?? null) };
    }
  } else {
    for (const id of getAllProviderIds()) {
      keys[id] = { keyPreview: "" };
    }
  }

  return NextResponse.json({
    keys,
    defaultAutoProvider: adminKeys?.defaultAutoProvider ?? "auto",
    featureOverrides: adminKeys?.featureOverrides ?? null,
  });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = (session.user as any).role === "ADMIN" || (session.user as any).role === "SUPER_ADMIN";
  if (!isAdmin) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const body = await req.json();
  const incoming: Record<string, { key?: string }> = body.keys ?? {};

  const data: Record<string, any> = {};
  for (const id of getAllProviderIds()) {
    const entry = incoming[id];
    if (entry && typeof entry.key === "string" && entry.key.trim()) {
      const field = `encrypted${id.charAt(0).toUpperCase() + id.slice(1)}Key`;
      data[field] = encryptKey(entry.key.trim());
    }
  }

  if (body.defaultAutoProvider !== undefined) {
    data.defaultAutoProvider = body.defaultAutoProvider;
  }
  if (body.featureOverrides !== undefined) {
    data.featureOverrides = body.featureOverrides;
  }

  if (Object.keys(data).length > 0) {
    await prisma.adminAIKeys.upsert({
      where: { adminId: session.user.id },
      create: { adminId: session.user.id, ...data },
      update: data,
    });
  }

  return NextResponse.json({ ok: true });
}
