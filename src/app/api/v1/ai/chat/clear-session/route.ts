import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { pdfTextCache, buildCacheKey, telemetry } from "@/lib/session-cache";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { lectureId } = body;

  if (lectureId) {
    const pdfKey = buildCacheKey(userId, lectureId);
    pdfTextCache.delete(pdfKey);
    telemetry.pdfCacheCleared++;
  }

  return NextResponse.json({ ok: true });
}
