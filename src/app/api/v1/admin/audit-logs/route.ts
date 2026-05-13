import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { teamMemberships: true },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN" && !user.isLeader) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const take = parseInt(searchParams.get("take") || "50");
    const skip = parseInt(searchParams.get("skip") || "0");

    let whereClause: any = {};

    // Super Admin sees everything. Others see logs for their team.
    if (user.role !== "SUPER_ADMIN") {
      // Find the teams this user leads
      const myTeams = await prisma.medicalTeam.findMany({
        where: { members: { some: { userId: user.id, role: "ADMIN" } } },
        select: { id: true },
      });
      const teamIds = myTeams.map((t) => t.id);

      if (teamIds.length > 0) {
        whereClause = {
          OR: [
            { teamId: { in: teamIds } },
            { userId: user.id },
          ],
        };
      } else {
        // If not leading a team, only see own actions
        whereClause = { userId: user.id };
      }
    }

    const logs = await (prisma as any).auditLog.findMany({
      where: whereClause,
      include: {
        user: { select: { name: true, email: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    });

    const total = await (prisma as any).auditLog.count({ where: whereClause });

    return NextResponse.json({ logs, total });
  } catch (error: any) {
    console.error("AuditLogs API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
