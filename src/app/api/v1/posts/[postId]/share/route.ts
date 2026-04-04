import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { logEngagement } from "@/lib/engagement";

export async function POST(req: NextRequest, { params }: { params: { postId: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ ok: false }, { status: 401 });
  await logEngagement(session.user.id, "share").catch(() => {});
  return NextResponse.json({ ok: true });
}
