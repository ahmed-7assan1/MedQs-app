export type ItemType = "questions" | "flashcards" | "references" | "diagrams";

export interface LectureCache {
  lectureId: string;
  version: string;
  updatedAt: string;
  cachedAt: number;
  title: string;
  summary: string;
  content: string;
  transcript?: string;
}

export interface LectureItems {
  lectureId: string;
  itemType: ItemType;
  version: string;
  items: unknown[];
}

export interface ChatThread {
  threadId: string;
  lectureId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  lastMessageAt: number;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  lectureId: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface Components {
  content: string;
  items: string;
  transcript: string;
}

export interface LectureMeta {
  lectureId: string;
  version: string;
  updatedAt: string;
  components: Components;
}
