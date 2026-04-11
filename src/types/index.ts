// types/index.ts — MedQs shared TypeScript types

export type UserRole = "STUDENT" | "ADMIN" | "SUPER_ADMIN";
export type Theme = "LIGHT" | "DARK" | "SYSTEM";
export type Difficulty = "EASY" | "MEDIUM" | "HARD";
export type ForumType = "GLOBAL" | "SEMESTER";
export type ForumStatus = "OPEN" | "RESTRICTED" | "READ_ONLY" | "CLOSED";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: UserRole;
  semesterId?: string;
  universityId?: string;
}

export interface QuestionChoice {
  key: string;
  text: string;
}

export type QuestionStemLayout = "STANDARD" | "IMAGE_OVERLAY";
export type QuestionType = "MCQ" | "ESSAY";

export interface QuestionWithChoices {
  id: string;
  questionType?: QuestionType;
  body: string;
  imageUrl?: string | null;
  stemLayout?: QuestionStemLayout;
  choices: QuestionChoice[];
  answer: string;
  essayReference?: string | null;
  explanation?: string;
  difficulty: Difficulty;
  lectureId: string;
}

export interface PostWithMeta {
  id: string;
  content: string;
  imageUrl?: string;
  interactionsDisabled: boolean;
  createdAt: string;
  author: {
    id: string;
    name: string;
    image?: string;
    rank?: { label: string; badge?: string };
  };
  _count?: { likes: number; comments: number };
  likedByMe?: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  channel: string;
  read: boolean;
  linkUrl?: string;
  createdAt: string;
}

export interface RankInfo {
  points: number;
  rank: { id: string; label: string; badge?: string; minPoints: number } | null;
  nextRank: { label: string; minPoints: number } | null;
  progress: number;
}

export interface ApiResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}
