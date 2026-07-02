"use client";

export function buildLectureSystemPrompt(opts: {
  lectureTitle?: string;
  lectureContent?: string;
  selectedText?: string;
  activeSection?: string;
}): string {
  const parts: string[] = [
    "You are a medical AI tutor helping a student with their current lecture.",
  ];
  if (opts.lectureTitle) {
    parts.push(`You are helping with the lecture: "${opts.lectureTitle}".`);
  }
  if (opts.lectureContent) {
    parts.push(
      `Here is the lecture content for reference:\n${opts.lectureContent.slice(0, 10000)}`,
    );
  }
  if (opts.selectedText) {
    parts.push(
      `The user has selected this text:\n"${opts.selectedText}"\nPrioritize answering about this selection in the context of the lecture.`,
    );
  }
  if (opts.activeSection) {
    parts.push(
      `The current section/active tab is: ${opts.activeSection}. Use this to understand what part of the lecture the student is viewing.`,
    );
  }
  return parts.join("\n\n");
}
