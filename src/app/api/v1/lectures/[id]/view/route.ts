import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { trackLectureView } from "@/lib/lecture-activity";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await req.json().catch(() => ({}));
  const source = typeof payload?.source === "string" ? payload.source : undefined;

  await trackLectureView(userId, params.id, source);
  return NextResponse.json({ ok: true });
}

