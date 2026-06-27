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
    const search = searchParams.get("search") || "";
    const universityId = searchParams.get("universityId");
    const facultyId = searchParams.get("facultyId");
    const role = searchParams.get("role");
    const status = searchParams.get("status") || "all";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const cursor = searchParams.get("cursor");
    const limit = Math.min(Math.max(1, parseInt(searchParams.get("limit") || "50") || 50), 100);

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { studentId: { contains: search } },
        { studentCode: { contains: search } },
      ];
    }
    if (universityId) where.universityId = universityId;
    if (facultyId) where.facultyId = facultyId;
    if (role) where.role = role;
    if (status === "banned") where.isBanned = true;
    else if (status === "active") where.isBanned = false;
    else if (status === "warned") where.warningCount = { gt: 0 };

    const orderBy: any = {};
    const validSorts = ["createdAt", "lastSeenAt", "points", "name", "lastActivityAt"];
    if (validSorts.includes(sortBy)) {
      orderBy[sortBy] = sortOrder === "asc" ? "asc" : "desc";
    } else {
      orderBy.createdAt = "desc";
    }

    const users = await prisma.user.findMany({
      where,
      orderBy,
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      select: {
        id: true, name: true, email: true, image: true, role: true,
        points: true, isBanned: true, warningCount: true,
        studentId: true, studentCode: true,
        createdAt: true, lastSeenAt: true, lastActivityAt: true,
        university: { select: { id: true, name: true } },
        faculty: { select: { id: true, name: true } },
        semester: { select: { id: true, name: true } },
      },
    });

    const hasMore = users.length > limit;
    const data = hasMore ? users.slice(0, limit) : users;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    const total = await prisma.user.count({ where });

    return NextResponse.json({
      data,
      meta: { total, hasMore, nextCursor },
    });
  } catch (error: any) {
    console.error("[PLATFORM_USERS] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
