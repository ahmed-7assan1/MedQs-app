import { NextResponse } from "next/server";

// Deprecated endpoint (previously used to link lecture Questions to a paper).
// New quiz authoring uses a dedicated `PastPaper.quizLectureId` and stores questions under that lecture.
export async function PUT() {
  return NextResponse.json(
    { error: "Deprecated. Use quiz lecture questions (PastPaper.quizLectureId) instead." },
    { status: 410 }
  );
}
