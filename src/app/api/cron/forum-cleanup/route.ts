import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Deletes forum posts older than 10 days from non-admin users (saves DB space).
 * Secure with CRON_SECRET — set in Vercel env; Vercel Cron sends Authorization: Bearer <CRON_SECRET>.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  }
  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);

  const result = await prisma.post.deleteMany({
    where: {
      createdAt: { lt: cutoff },
      author: { role: { notIn: ["ADMIN", "SUPER_ADMIN"] } },
    },
  });

  return NextResponse.json({ ok: true, deletedPosts: result.count });
}

export const dynamic = "force-dynamic";
