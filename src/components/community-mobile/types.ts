// src/components/community-mobile/types.ts

export type ForumType = "GLOBAL" | "SEMESTER" | "PRIVATE";
export type ForumStatus = "OPEN" | "CLOSED" | "READ_ONLY";
export type PostAudience = "UNIVERSITY" | "FOLLOWERS";
export type ReactionType =
  | "HEART"
  | "THUMBS_UP"
  | "BRAIN"
  | "QUESTION"
  | "LIGHTBULB"
  | "HANDSHAKE";

export type FeedFilter = "latest" | "trending" | "media" | "pinned";

export interface UserSummary {
  id: string;
  name: string;
  avatarUrl: string | null;
  rankLabel?: string | null;
  rankBadge?: string | null;
  points?: number;
  isFollowing?: boolean;
  isBlocked?: boolean;
}

export interface PollOption {
  id: string;
  label: string;
  votes: number;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  totalVotes: number;
  userVotedOptionId?: string | null;
  expiresAt?: string | null;
}

export interface SharedQuestionData {
  id: string;
  prompt: string;
  choices: { id: string; label: string }[];
  subjectName?: string;
  correctChoiceId?: string;
}

export interface Attachment {
  id: string;
  type: "image" | "audio" | "file";
  url: string;
  name?: string;
  durationSeconds?: number;
}

export interface ReactionCounts {
  HEART: number;
  THUMBS_UP: number;
  BRAIN: number;
  QUESTION: number;
  LIGHTBULB: number;
  HANDSHAKE: number;
}

export interface Post {
  id: string;
  content: string;
  imageUrl: string | null;
  attachments: Attachment[];
  author: UserSummary | null; // null when isAnonymous
  isAnonymous: boolean;
  forumId: string;
  forumName?: string;
  audience: PostAudience;
  isPinned: boolean;
  poll: Poll | null;
  sharedQuestionData: SharedQuestionData | null;
  backgroundStyle: string | null;
  hashtags: string[];
  reactionCounts: ReactionCounts;
  userReaction: ReactionType | null;
  commentCount: number;
  shareCount: number;
  isSaved: boolean;
  createdAt: string;
  expiresAt: string | null;
}

export interface Comment {
  id: string;
  content: string;
  attachments: Attachment[];
  author: UserSummary;
  postId: string;
  parentId: string | null;
  likeCount: number;
  likedByMe: boolean;
  createdAt: string;
  replies?: Comment[];
}

export interface Forum {
  id: string;
  name: string;
  type: ForumType;
  status: ForumStatus;
  unreadCount?: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  channel: string;
  read: boolean;
  createdAt: string;
}

export interface RoomSummary {
  id: string;
  name: string;
  description: string | null;
  inviteCode: string;
  ownerId: string;
  memberCount?: number;
}

export interface ForumInvite {
  id: string;
  forumId: string;
  forumName: string;
  senderId: string;
  senderName: string;
  status: "pending" | "accepted" | "declined";
}

export interface RankInfo {
  label: string;
  minPoints: number;
  badge: string;
  points: number;
  position: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export const REACTION_META: Record<
  ReactionType,
  { icon: string; label: string; colorClass: string; activeClass: string }
> = {
  HEART: {
    icon: "Heart",
    label: "Like",
    colorClass: "text-rose-500",
    activeClass: "bg-rose-500/10 text-rose-500",
  },
  THUMBS_UP: {
    icon: "ThumbsUp",
    label: "Support",
    colorClass: "text-sky-500",
    activeClass: "bg-sky-500/10 text-sky-500",
  },
  BRAIN: {
    icon: "Brain",
    label: "Smart",
    colorClass: "text-violet-500",
    activeClass: "bg-violet-500/10 text-violet-500",
  },
  QUESTION: {
    icon: "HelpCircle",
    label: "Confused",
    colorClass: "text-amber-500",
    activeClass: "bg-amber-500/10 text-amber-500",
  },
  LIGHTBULB: {
    icon: "Lightbulb",
    label: "Idea",
    colorClass: "text-yellow-500",
    activeClass: "bg-yellow-500/10 text-yellow-500",
  },
  HANDSHAKE: {
    icon: "Handshake",
    label: "Support",
    colorClass: "text-emerald-500",
    activeClass: "bg-emerald-500/10 text-emerald-500",
  },
};

export const REACTION_ORDER: ReactionType[] = [
  "HEART",
  "THUMBS_UP",
  "BRAIN",
  "QUESTION",
  "LIGHTBULB",
  "HANDSHAKE",
];

export interface ReportReason {
  id: string;
  label: string;
}

export const REPORT_REASONS: ReportReason[] = [
  { id: "spam", label: "Spam" },
  { id: "harassment", label: "Harassment or bullying" },
  { id: "misinformation", label: "Medical misinformation" },
  { id: "hate_speech", label: "Hate speech" },
  { id: "inappropriate", label: "Inappropriate content" },
  { id: "impersonation", label: "Impersonation" },
  { id: "academic_dishonesty", label: "Academic dishonesty" },
  { id: "other", label: "Other" },
];

export const BACKGROUND_STYLES: { id: string; swatch: string }[] = [
  { id: "none", swatch: "transparent" },
  { id: "indigo", swatch: "#eef0ff" },
  { id: "rose", swatch: "#fdf0f2" },
  { id: "emerald", swatch: "#eef7f1" },
  { id: "amber", swatch: "#fdf6ea" },
  { id: "slate", swatch: "#f1f2f4" },
];
