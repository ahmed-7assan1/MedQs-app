// src/components/community-mobile/api.ts

import type {
  Comment,
  Forum,
  ForumInvite,
  NotificationItem,
  PaginatedResponse,
  Post,
  RankInfo,
  ReactionType,
  RoomSummary,
  UserSummary,
} from "./types";
import { normalizePost, normalizeComment } from "./utils";

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      message = body?.message ?? message;
    } catch {
      // ignore parse errors, fall back to default message
    }
    throw new ApiError(message, res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ---------- Forums ----------

export function fetchForums(): Promise<Forum[]> {
  return request<Forum[]>("/api/v1/forums");
}

export async function fetchForumPosts(
  forumId: string,
  params: { cursor?: string; limit?: number } = {}
): Promise<PaginatedResponse<Post>> {
  const search = new URLSearchParams();
  const page = params.cursor || "1";
  search.set("page", page);
  search.set("limit", String(params.limit ?? 10));
  const raw: any[] = await request<any[]>(
    `/api/v1/forums/${forumId}/posts?${search.toString()}`
  );
  const items = raw.map(normalizePost);
  const limit = params.limit ?? 10;
  const nextCursor = items.length === limit ? String(Number(page) + 1) : null;
  return { items, nextCursor, hasMore: items.length === limit };
}

export function createPost(
  forumId: string,
  payload: Record<string, unknown>
): Promise<Post> {
  return request<any>(`/api/v1/forums/${forumId}/posts`, {
    method: "POST",
    body: JSON.stringify(payload),
  }).then(normalizePost);
}

// ---------- Posts ----------

export function fetchPost(postId: string): Promise<Post> {
  return request<any>(`/api/v1/posts/${postId}`).then(normalizePost);
}

export function deletePost(postId: string): Promise<void> {
  return request<void>(`/api/v1/posts/${postId}`, { method: "DELETE" });
}

export function updatePost(
  postId: string,
  payload: Record<string, unknown>
): Promise<Post> {
  return request<any>(`/api/v1/posts/${postId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  }).then(normalizePost);
}

export function fetchReactions(postId: string) {
  return request(`/api/v1/posts/${postId}/reactions`);
}

export function toggleReaction(postId: string, type: ReactionType | null) {
  return request(`/api/v1/posts/${postId}/reactions`, {
    method: "POST",
    body: JSON.stringify({ type }),
  });
}

export function fetchComments(postId: string): Promise<Comment[]> {
  return request<any[]>(`/api/v1/posts/${postId}/comments`).then((items) =>
    items.map(normalizeComment)
  );
}

export function createComment(
  postId: string,
  payload: { content: string; parentId?: string | null; attachments?: unknown[] }
): Promise<Comment> {
  return request<any>(`/api/v1/posts/${postId}/comments`, {
    method: "POST",
    body: JSON.stringify(payload),
  }).then(normalizeComment);
}

export function deleteComment(postId: string, commentId: string): Promise<void> {
  return request<void>(`/api/v1/comments/${commentId}`, {
    method: "DELETE",
  });
}

export function likeComment(postId: string, commentId: string) {
  return request(`/api/v1/comments/${commentId}/like`, {
    method: "POST",
  });
}

export function sharePost(postId: string) {
  return request(`/api/v1/posts/${postId}/share`, { method: "POST" });
}

export function savePost(postId: string) {
  return request(`/api/mobile/posts/${postId}/save`, { method: "POST" });
}

// ---------- Notifications ----------

export function fetchNotifications(): Promise<NotificationItem[]> {
  return request<NotificationItem[]>("/api/v1/notifications");
}

export function markNotificationRead(id: string) {
  return request(`/api/v1/notifications/${id}/read`, { method: "PUT" });
}

export function markAllNotificationsRead() {
  return request(`/api/v1/notifications/read-all`, { method: "PUT" });
}

// ---------- Users ----------

export function searchUsers(query: string): Promise<UserSummary[]> {
  return request<UserSummary[]>(
    `/api/v1/users/search?q=${encodeURIComponent(query)}`
  );
}

export function fetchSuggestedUsers(): Promise<UserSummary[]> {
  return request<UserSummary[]>("/api/v1/users/suggested");
}

export function fetchUserRank(userId: string): Promise<RankInfo> {
  return request<RankInfo>(`/api/v1/users/${userId}/rank`);
}

export function toggleBlock(userId: string) {
  return request("/api/v1/block", {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
}

export function fetchBlockedUsers(): Promise<UserSummary[]> {
  return request<UserSummary[]>("/api/v1/block");
}

// ---------- Reports ----------

export function submitReport(payload: {
  targetType: string;
  targetId: string;
  reason: string;
  description?: string;
}) {
  return request("/api/v1/reports", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ---------- Rooms ----------

export function fetchRooms(): Promise<RoomSummary[]> {
  return request<RoomSummary[]>("/api/v1/rooms");
}

export function createRoom(payload: { name: string; description?: string }) {
  return request<RoomSummary>("/api/v1/rooms", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function joinRoom(inviteCode: string) {
  return request<RoomSummary>("/api/v1/rooms/join", {
    method: "POST",
    body: JSON.stringify({ inviteCode }),
  });
}

// ---------- Private forum invites ----------

export function fetchForumInvites(): Promise<ForumInvite[]> {
  return request<ForumInvite[]>("/api/v1/forums/invites");
}

export function respondToInvite(inviteId: string, status: "accepted" | "declined") {
  return request(`/api/v1/forums/invites/${inviteId}`, {
    method: "POST",
    body: JSON.stringify({ status }),
  });
}

// ---------- Saved / mine ----------

export function fetchSavedPosts(): Promise<Post[]> {
  return request<any[]>("/api/mobile/posts/saved").then((items) =>
    items.map(normalizePost)
  );
}

export function fetchMyPosts(): Promise<Post[]> {
  return request<any[]>("/api/mobile/posts/mine").then((items) =>
    items.map(normalizePost)
  );
}

export { ApiError };
