"use client";

import { StudyDocEditor } from "./StudyDocEditor";

export function NotebookPanel({ lectureId }: { lectureId: string }) {
  return <StudyDocEditor lectureId={lectureId} />;
}
