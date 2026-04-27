import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    let userId = null;
    let semesterId = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "";
      try {
        const { decode } = require("next-auth/jwt");
        const decoded = await decode({ token, secret, salt: "authjs.session-token" });
        if (decoded?.id) {
          userId = decoded.id;
          semesterId = decoded.semesterId;
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
