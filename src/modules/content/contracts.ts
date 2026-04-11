export type LectureComponent =
  | "files"
  | "notes"
  | "flashcards"
  | "quiz"
  | "videos"
  | "discussion"
  | "ai_assistant";

export type LectureToggle = {
  lectureId: string;
  component: LectureComponent;
  enabled: boolean;
};

export type ContentServiceContract = {
  toggleLectureComponent: (toggle: LectureToggle) => Promise<{ ok: true }>;
  publishLecture: (lectureId: string, actorUserId: string) => Promise<{ publishedAt: string }>;
};
