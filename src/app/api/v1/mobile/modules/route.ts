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
        console.error("Token decode error:", e);
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // If semesterId is not in token, fetch it
    if (!semesterId) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { semesterId: true } });
      semesterId = user?.semesterId;
    }

    let where: any = {};
    if (semesterId) {
      where = { semesterId };
    }

    // Fetch full curriculum tree
    const modules = await prisma.module.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        subjects: {
          orderBy: { name: 'asc' },
          include: {
            lectures: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                title: true,
                videoUrl: true,
                order: true,
              }
            }
          }
        }
      }
    });

    return NextResponse.json(modules);
  } catch (error) {
    console.error("Mobile Modules Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
