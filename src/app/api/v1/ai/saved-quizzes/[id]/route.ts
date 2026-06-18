import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const quiz = await prisma.savedQuiz.findUnique({
      where: { id: params.id },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (quiz.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { published } = await req.json();
    const updated = await prisma.savedQuiz.update({
      where: { id: params.id },
      data: { published },
    });

    return NextResponse.json({ success: true, quiz: updated });
  } catch (error) {
    console.error("Failed to update saved quiz:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const quiz = await prisma.savedQuiz.findUnique({
      where: { id: params.id },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (quiz.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.savedQuiz.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete saved quiz:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
