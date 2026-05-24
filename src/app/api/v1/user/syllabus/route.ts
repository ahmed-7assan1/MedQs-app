import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { semesterId: true },
  });

  if (!user?.semesterId) {
    return NextResponse.json({ modules: [] });
  }

  const modules = await prisma.module.findMany({
    where: { semesterId: user.semesterId },
    orderBy: { name: "asc" },
    include: {
      subjects: {
        orderBy: { name: "asc" },
        include: {
          lectures: {
            orderBy: { title: "asc" },
            select: { id: true, title: true },
          },
        },
      },
    },
  });

  return NextResponse.json({ modules });
}
