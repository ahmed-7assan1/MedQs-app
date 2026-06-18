import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyMobileToken } from '@/lib/supabase/auth-helpers';
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    let userId = null;
    let semesterId = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
            try {
        const decoded = await verifyMobileToken(token);
        if (decoded?.id) {
          userId = decoded.id as string;
          semesterId = decoded.semesterId as string | null;
        }
      } catch (e) {
        // Handle token error
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!semesterId) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { semesterId: true } });
      semesterId = user?.semesterId;
    }

    if (!semesterId) {
      return NextResponse.json([]);
    }

    const quizzes = await prisma.pastPaper.findMany({
      where: {
        semesterId,
        // @ts-ignore
        isPrivate: false,
      },
      orderBy: { createdAt: "desc" },
      include: {
        module: { select: { name: true } },
        _count: { select: { attempts: true } },
      },
    });

    return NextResponse.json(quizzes);
  } catch (error) {
    console.error("Mobile Quizzes Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
