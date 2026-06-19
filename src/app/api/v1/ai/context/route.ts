import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { verifyMobileToken } from '@/lib/supabase/auth-helpers';
import { buildStudentContext } from "@/lib/ai-context-builder";

export async function GET(req: NextRequest) {
  let userId: string | null = null;
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const token = authHeader.substring(7);
      const decoded = await verifyMobileToken(token);
      if (decoded?.id) userId = decoded.id as string;
    } catch {}
  }
  if (!userId) {
    const session = await auth();
    userId = session?.user?.id ?? null;
  }
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const message = req.nextUrl.searchParams.get("message") || undefined;

  try {
    const context = await buildStudentContext(userId, message);
    return NextResponse.json({ context, detected: !!message });
  } catch (err) {
    console.error("[AI Context] Error:", err);
    return NextResponse.json({ context: "", error: "Failed to build context" }, { status: 500 });
  }
}
