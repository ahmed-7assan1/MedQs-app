import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdminWriter } from "@/lib/admin-scope";
import { isAdminRole } from "@/lib/tenant";
import { type FacultyCategory } from "@/lib/faculty-categories";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !isAdminRole((session.user as any).role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") as FacultyCategory;
  const query = searchParams.get("query") || "";
  const type = searchParams.get("type"); // VIDEO, QUESTION, FILE

  if (!category) {
    return NextResponse.json({ error: "Faculty category is required" }, { status: 400 });
  }

  // 1. Fetch explicitly shared resources
  const sharedResources = await (prisma as any).libraryResource.findMany({
    where: {
      category,
      type: type ? type : undefined,
      OR: query ? [
        { title: { contains: query, mode: "insensitive" } },
        { payload: { path: ["keywords"], array_contains: query } }
      ] : undefined
    },
    orderBy: { createdAt: "desc" },
    include: {
      sourceBook: { select: { title: true, author: true } }
    }
  });

  // 2. Aggregate non-private Lectures
  const lectures = (type === null || type === "VIDEO") ? await prisma.lecture.findMany({
    where: {
      title: query ? { contains: query, mode: "insensitive" } : undefined,
      subject: {
        module: {
          semester: {
            academicYear: {
              faculty: { category: category as any } as any
            }
          }
        }
      }
    },
    include: {
      subject: {
        include: {
          module: {
            include: {
              semester: {
                include: {
                  academicYear: {
                    include: { faculty: { include: { university: { select: { name: true } } } } }
                  }
                }
              }
            }
          }
        }
      }
    },
    take: 50,
  }) : [];

  // 3. Aggregate non-private PastPapers
  const papers = (type === null || type === "QUESTION") ? await prisma.pastPaper.findMany({
    where: {
      title: query ? { contains: query, mode: "insensitive" } : undefined,
      isPrivate: false,
      semester: {
        academicYear: {
          faculty: { category: category as any } as any
        }
      }
    },
    include: {
      semester: {
        include: {
          academicYear: {
            include: { faculty: { include: { university: { select: { name: true } } } } }
          }
        }
      }
    },
    take: 50,
  }) : [];

  // Combine results into a single "Discovery Library" view
  const discovery = [
    ...sharedResources.map((r: any) => ({ ...r, originType: "SHARED" })),
    ...lectures.map((l: any) => ({
      id: l.id,
      title: l.title,
      type: "VIDEO",
      url: l.videoUrl,
      createdAt: l.createdAt,
      originType: "LECTURE",
      university: l.subject?.module?.semester?.academicYear?.faculty?.university?.name || "Global University",
      moduleName: l.subject?.module?.name,
    })),
    ...papers.map((p: any) => ({
      id: p.id,
      title: p.title,
      type: "QUESTION",
      createdAt: p.createdAt,
      originType: "PAST_PAPER",
      university: p.semester?.academicYear?.faculty?.university?.name || "Global University",
      moduleName: (p as any).module?.name || p.semester?.academicYear?.faculty?.name,
    })),
  ];

  return NextResponse.json(discovery);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const w = await requireAdminWriter(session);
  if (!w.ok) return w.response;

  const body = await req.json();
  const { title, type, url, payload, category, sourceBookId } = body;

  if (!title || !type || !category) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const resource = await (prisma as any).libraryResource.create({
    data: {
      title,
      type,
      url,
      payload,
      category,
      sourceBookId,
      originUniId: w.scope.universityId,
      sharedBy: session?.user?.id
    }
  });

  return NextResponse.json(resource);
}
