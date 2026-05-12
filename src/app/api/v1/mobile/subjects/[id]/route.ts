import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decode } from "next-auth/jwt";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const authHeader = req.headers.get("authorization");
    let userId = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "";
      try {
        const decoded = await decode({ token, secret, salt: "authjs.session-token" });
        if (decoded?.id) {
          userId = decoded.id;
        }
      } catch (e) {
        // decode failed
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subjectId = params.id;

    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: {
        module: { select: { id: true, name: true } },
        lectures: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            videoUrl: true,
            order: true,
            notesMarkdown: true,
          }
        }
      }
    });

    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    return NextResponse.json(subject);
  } catch (error) {
    console.error("Mobile Subject Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
