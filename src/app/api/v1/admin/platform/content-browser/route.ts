import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "universities";

    switch (type) {
      case "universities": {
        const data = await prisma.university.findMany({
          orderBy: { name: "asc" },
          include: {
            _count: { select: { users: true, faculties: true, academicYears: true, posts: true } },
          },
        });
        return NextResponse.json({ data });
      }
      case "faculties": {
        const universityId = searchParams.get("universityId");
        const where: any = {};
        if (universityId) where.universityId = universityId;
        const data = await prisma.faculty.findMany({
          where,
          orderBy: { name: "asc" },
          include: {
            _count: { select: { users: true, academicYears: true, medicalTeams: true } },
            university: { select: { id: true, name: true } },
          },
        });
        return NextResponse.json({ data });
      }
      case "lectures": {
        const subjectId = searchParams.get("subjectId");
        const search = searchParams.get("search");
        const where: any = {};
        if (subjectId) where.subjectId = subjectId;
        if (search) where.title = { contains: search, mode: "insensitive" };
        const data = await prisma.lecture.findMany({
          where,
          orderBy: { order: "asc" },
          take: 100,
          include: {
            subject: { select: { id: true, name: true } },
            _count: { select: { questions: true, videos: true, files: true } },
          },
        });
        return NextResponse.json({ data });
      }
      case "questions": {
        const lectureId = searchParams.get("lectureId");
        const search = searchParams.get("search");
        const where: any = {};
        if (lectureId) where.lectureId = lectureId;
        if (search) where.body = { contains: search, mode: "insensitive" };
        const data = await prisma.question.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: 100,
          include: {
            lecture: { select: { id: true, title: true } },
            _count: { select: { reports: true, savedBy: true } },
          },
        });
        return NextResponse.json({ data });
      }
      case "past-papers": {
        const search = searchParams.get("search");
        const where: any = {};
        if (search) where.title = { contains: search, mode: "insensitive" };
        const data = await prisma.pastPaper.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: 100,
          include: {
            semester: { select: { id: true, name: true } },
            module: { select: { id: true, name: true } },
            _count: { select: { attempts: true, questionReports: true } },
          },
        });
        return NextResponse.json({ data });
      }
      default:
        return NextResponse.json({ error: `Unknown content type: ${type}` }, { status: 400 });
    }
  } catch (error: any) {
    console.error("[PLATFORM_CONTENT_BROWSER] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
