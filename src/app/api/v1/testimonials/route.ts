import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000;

function checkRateLimit(userId: string): boolean {
  const last = rateLimitMap.get(userId);
  const now = Date.now();
  if (last && now - last < RATE_LIMIT_WINDOW) return false;
  rateLimitMap.set(userId, now);
  return true;
}

export async function GET() {
  try {
    const testimonials = await prisma.testimonial.findMany({
      where: { status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        content: true,
        rating: true,
        authorName: true,
        universityName: true,
        createdAt: true,
      },
    });
    return NextResponse.json(testimonials, {
      headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=600" },
    });
  } catch (error) {
    console.error("GET /api/v1/testimonials error:", error);
    return NextResponse.json({ error: "Failed to fetch testimonials" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!checkRateLimit(session.user.id)) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }
  try {
    const { content, rating } = await req.json();
    if (!content || !rating) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { university: true },
    });
    const testimonial = await prisma.testimonial.create({
      data: {
        content,
        rating,
        authorName: user?.name?.trim() || user?.nickname || session.user.email || "User",
        universityName: user?.university?.name ?? null,
        userId: session.user.id,
        status: "PENDING",
      },
    });
    return NextResponse.json(testimonial);
  } catch (error) {
    console.error("POST /api/v1/testimonials error:", error);
    return NextResponse.json({ error: "Failed to create testimonial" }, { status: 500 });
  }
}
