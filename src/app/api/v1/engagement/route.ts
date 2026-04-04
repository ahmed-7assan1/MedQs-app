import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { logEngagement } from "@/lib/engagement";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userId, action } = await req.json();
  // Use authenticated user ID (ignore body userId for security)
  const result = await logEngagement(session.user.id, action);
  return NextResponse.json(result);
}
