import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

export async function GET(req: Request) {
  try {
    // 1. Authenticate the request via Bearer token
    const authHeader = req.headers.get("authorization");
    let userId = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "";
      // NextAuth token decoding
      try {
        const { decode } = require("next-auth/jwt");
        const decoded = await decode({ token, secret, salt: "authjs.session-token" });
        if (decoded?.id) {
          userId = decoded.id;
        }
      } catch (e) {
        console.error("Token decode error:", e);
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch User Profile & Dashboard Data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        university: true,
        semester: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 3. Get recent or upcoming lectures for "Next Session"
    const upcomingLectures = await prisma.lecture.findMany({
      where: user.semesterId ? {
        subject: {
          semesterId: user.semesterId
        }
      } : {},
      orderBy: { order: 'desc' },
      take: 1,
      include: {
        subject: {
          include: { module: true }
        }
      }
    });

    // 4. Get recommended content (e.g., top subjects)
    const recommendedSubjects = await prisma.subject.findMany({
      take: 4,
      orderBy: { lectures: { _count: 'desc' } },
      select: { id: true, name: true }
    });

    // 5. Structure the response for the mobile app
    const data = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        university: user.university?.name || null,
        semester: user.semester?.name || null,
      },
      nextSession: upcomingLectures.length > 0 ? {
        id: upcomingLectures[0].id,
        title: upcomingLectures[0].title,
        subject: upcomingLectures[0].subject.name,
        module: upcomingLectures[0].subject.module?.name || null,
        date: new Date(), // Lecture doesn't have createdAt
      } : null,
      recommended: recommendedSubjects,
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Mobile Home Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
