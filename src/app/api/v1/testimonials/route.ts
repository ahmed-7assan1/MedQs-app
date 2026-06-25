import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const testimonials = await (prisma as any).testimonial.findMany({
      where: { status: "APPROVED" },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(testimonials);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch testimonials" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { content, rating, authorName } = await req.json();
    if (!content || !rating || !authorName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const testimonial = await (prisma as any).testimonial.create({
      data: {
        content,
        rating,
        authorName,
        userId: session.user.id,
        status: "PENDING",
      },
    });
    return NextResponse.json(testimonial);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create testimonial" }, { status: 500 });
  }
}
