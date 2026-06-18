import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyMobileToken } from '@/lib/supabase/auth-helpers';
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    let userId: string | null = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
            try {
        const decoded = await verifyMobileToken(token);
        if (decoded?.id) {
          userId = decoded.id as string;
        }
      } catch (e) {
        // Handle token error
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const tasks = await prisma.userTask.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(tasks);
    } catch {
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error("Mobile Tasks Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
