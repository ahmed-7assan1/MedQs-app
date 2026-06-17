// src/components/community-mobile/utils.ts

import type { Post, Comment, ReactionCounts, ReactionType } from "./types";

/**
 * Formats an ISO timestamp into a short relative time string (e.g. "2h", "3d", "now").
 */
export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 10) return "now";
  if (diffSec < 60) return `${diffSec}s`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d`;
  const diffWeek = Math.floor(diffDay / 7);
  if (diffWeek < 5) return `${diffWeek}w`;
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth}mo`;
  const diffYear = Math.floor(diffDay / 365);
  return `${diffYear}y`;
}

/**
 * Sums all reaction counts on a post.
 */
export function totalReactions(counts: ReactionCounts): number {
  return (
    counts.HEART +
    counts.THUMBS_UP +
    counts.BRAIN +
    counts.QUESTION +
    counts.LIGHTBULB +
    counts.HANDSHAKE
  );
}

/**
 * Compact number formatting for counters (1200 -> "1.2K").
 */
export function formatCompactNumber(value: number): string {
  if (value < 1000) return String(value);
  if (value < 1_000_000) {
    const k = value / 1000;
    return `${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}K`;
  }
  const m = value / 1_000_000;
  return `${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
}

/**
 * Extracts the first YouTube video ID from a block of text, if present.
 */
export function extractYouTubeId(text: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Extracts the first non-YouTube http(s) URL from a block of text, if present.
 */
export function extractFirstLink(text: string): string | null {
  const urlPattern = /https?:\/\/[^\s]+/g;
  const matches = text.match(urlPattern);
  if (!matches) return null;
  const nonYouTube = matches.find((url) => !extractYouTubeId(url));
  return nonYouTube ?? null;
}

/**
 * Extracts hashtags (#word) from text content.
 */
export function extractHashtags(text: string): string[] {
  const matches = text.match(/#[\p{L}0-9_]+/gu);
  if (!matches) return [];
  return Array.from(new Set(matches.map((tag) => tag.slice(1))));
}

/**
 * Lightweight markdown-ish renderer: bold (**x**), italic (*x*), inline code (`x`).
 * Returns an array of React-renderable segments handled by RichText.tsx.
 */
export type RichTextSegment =
  | { type: "text"; value: string }
  | { type: "bold"; value: string }
  | { type: "italic"; value: string }
  | { type: "code"; value: string }
  | { type: "hashtag"; value: string };

export function parseRichText(content: string): RichTextSegment[] {
  const segments: RichTextSegment[] = [];
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|#[\p{L}0-9_]+)/gu;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", value: content.slice(lastIndex, match.index) });
    }
    const token = match[0];
    if (token.startsWith("**")) {
      segments.push({ type: "bold", value: token.slice(2, -2) });
    } else if (token.startsWith("*")) {
      segments.push({ type: "italic", value: token.slice(1, -1) });
    } else if (token.startsWith("`")) {
      segments.push({ type: "code", value: token.slice(1, -1) });
    } else if (token.startsWith("#")) {
      segments.push({ type: "hashtag", value: token });
    }
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < content.length) {
    segments.push({ type: "text", value: content.slice(lastIndex) });
  }
  return segments;
}

/**
 * Builds an image grid layout class set based on attachment count (1-4+).
 */
export function getImageGridLayout(count: number): {
  containerClass: string;
  itemClass: (index: number) => string;
} {
  if (count <= 1) {
    return {
      containerClass: "grid grid-cols-1",
      itemClass: () => "aspect-video",
    };
  }
  if (count === 2) {
    return {
      containerClass: "grid grid-cols-2 gap-1.5",
      itemClass: () => "aspect-square",
    };
  }
  if (count === 3) {
    return {
      containerClass: "grid grid-cols-2 gap-1.5",
      itemClass: (index) => (index === 0 ? "row-span-2 aspect-[1/2]" : "aspect-square"),
    };
  }
  return {
    containerClass: "grid grid-cols-2 gap-1.5",
    itemClass: () => "aspect-square",
  };
}

/**
 * Normalizes a raw API post payload into the local Post shape.
 * Handles both the existing ForumPostJson format and any future v2 format.
 */
export function normalizePost(raw: any): Post {
  // Map author from API format to UserSummary
  let author: Post["author"] = null;
  if (!raw.isAnonymous && raw.author) {
    const a = raw.author;
    author = {
      id: a.id,
      name: a.name,
      avatarUrl: a.image ?? a.avatarUrl ?? null,
      rankLabel: a.rank?.label ?? a.rankLabel ?? null,
      rankBadge: a.rank?.badge ?? a.rankBadge ?? null,
    };
  }

  // Build reactionCounts from API data
  const reactions = Array.isArray(raw.reactions) ? raw.reactions : [];
  const reactionCounts: Post["reactionCounts"] = {
    HEART: 0, THUMBS_UP: 0, BRAIN: 0, QUESTION: 0, LIGHTBULB: 0, HANDSHAKE: 0,
  };
  for (const r of reactions) {
    const t = r.type as keyof typeof reactionCounts;
    if (t in reactionCounts) reactionCounts[t]++;
  }
  // Fallback: if no reactions array but _count.likes exists, treat likes as HEART
  if (reactions.length === 0 && raw._count?.likes) {
    reactionCounts.HEART = raw._count.likes;
  }

  // Determine user reaction from likedByMe or reactions array
  let userReaction: ReactionType | null = null;
  if (raw.likedByMe) {
    userReaction = "HEART";
  } else if (raw.userReaction) {
    userReaction = raw.userReaction;
  }

  // Map attachments from raw JSON to typed format
  let attachments: any[] = [];
  if (Array.isArray(raw.attachments)) {
    attachments = raw.attachments.map((a: any, i: number) => ({
      id: a.id ?? String(i),
      type: a.type ?? "image",
      url: a.url ?? a,
      name: a.name,
    }));
  }

  // Map poll options from Prisma format if needed
  let poll = raw.poll ?? null;
  if (poll && Array.isArray(poll.options)) {
    poll = {
      ...poll,
      question: poll.question,
      totalVotes: poll.totalVotes ?? 0,
      userVotedOptionId: poll.userVotedOptionId ?? null,
      expiresAt: poll.expiresAt ?? null,
      options: poll.options.map((o: any) => ({
        id: o.id,
        label: o.text ?? o.label,
        votes: o.votes ?? o._count?.votes ?? 0,
      })),
    };
  }

  return {
    id: raw.id,
    content: raw.content ?? "",
    imageUrl: raw.imageUrl ?? null,
    attachments,
    author,
    isAnonymous: Boolean(raw.isAnonymous),
    forumId: raw.forumId,
    forumName: raw.forumName ?? raw.forum?.name ?? "",
    audience: raw.audience ?? "UNIVERSITY",
    isPinned: Boolean(raw.isPinned),
    poll,
    sharedQuestionData: raw.sharedQuestionData ?? raw.sharedQuestion ?? null,
    backgroundStyle: raw.backgroundStyle ?? null,
    hashtags: Array.isArray(raw.hashtags) ? raw.hashtags : [],
    reactionCounts,
    userReaction,
    commentCount: raw.commentCount ?? raw._count?.comments ?? 0,
    shareCount: raw.shareCount ?? 0,
    isSaved: Boolean(raw.isSaved),
    createdAt: raw.createdAt,
    expiresAt: raw.expiresAt ?? null,
  };
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Normalizes a raw API comment into the local Comment shape.
 */
export function normalizeComment(raw: any): Comment {
  const author: Comment["author"] = {
    id: raw.author?.id ?? "",
    name: raw.author?.name ?? "Unknown",
    avatarUrl: raw.author?.image ?? raw.author?.avatarUrl ?? null,
    rankLabel: raw.author?.rank?.label ?? raw.author?.rankLabel ?? null,
    rankBadge: raw.author?.rank?.badge ?? raw.author?.rankBadge ?? null,
  };

  return {
    id: raw.id,
    content: raw.content ?? "",
    attachments: Array.isArray(raw.attachments) ? raw.attachments : [],
    author,
    postId: raw.postId,
    parentId: raw.parentId ?? null,
    likeCount: raw.likeCount ?? raw._count?.likes ?? 0,
    likedByMe: Boolean(raw.likedByMe),
    createdAt: raw.createdAt,
    replies: Array.isArray(raw.replies) ? raw.replies.map(normalizeComment) : undefined,
  };
}
