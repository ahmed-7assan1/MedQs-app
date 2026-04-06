import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertAdBanner, assertAdBannerPayload, requireAdminWriter } from "@/lib/admin-scope";

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  const session = await auth();
  const w = await requireAdminWriter(session);
  if (!w.ok) return w.response;
  const { id } = await Promise.resolve(ctx.params);
  let err = await assertAdBanner(w.scope, id);
  if (err) return err;

  const existing = await prisma.adBanner.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data = await req.json();
  const merged = {
    universityId: data.universityId !== undefined ? data.universityId : existing.universityId,
    semesterId: data.semesterId !== undefined ? data.semesterId : existing.semesterId,
  };
  err = await assertAdBannerPayload(w.scope, merged.universityId, merged.semesterId);
  if (err) return err;

  const ad = await prisma.adBanner.update({ where: { id }, data });
  return NextResponse.json(ad);
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  const session = await auth();
  const w = await requireAdminWriter(session);
  if (!w.ok) return w.response;
  const { id } = await Promise.resolve(ctx.params);
  const err = await assertAdBanner(w.scope, id);
  if (err) return err;

  await prisma.adBanner.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
