import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertAdBannerPayload, requireAdminWriter } from "@/lib/admin-scope";

export async function GET() {
  const session = await auth();
  const w = await requireAdminWriter(session);
  if (!w.ok) return w.response;

  const ads = w.isSuper
    ? await prisma.adBanner.findMany({ orderBy: { createdAt: "desc" } })
    : await prisma.adBanner.findMany({
        where: {
          OR: [
            { universityId: w.scope.universityId! },
            { semester: { academicYear: { universityId: w.scope.universityId! } } },
            { universityId: null, semesterId: null },
          ],
        },
        orderBy: { createdAt: "desc" },
      });
  return NextResponse.json(ads);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const w = await requireAdminWriter(session);
  if (!w.ok) return w.response;

  const data = await req.json();
  const payloadErr = await assertAdBannerPayload(w.scope, data.universityId, data.semesterId);
  if (payloadErr) return payloadErr;

  const ad = await prisma.adBanner.create({ data });
  return NextResponse.json(ad, { status: 201 });
}
