/** Client-only saved forum posts (localStorage). */

export const FORUM_SAVED_POSTS_KEY = "medqs-forum-saved-posts-v1";

/** Dispatch after mutating saved posts so profile UI can refresh without polling. */
export const SAVED_POSTS_CHANGED_EVENT = "medqs-saved-posts-changed";

export function notifySavedPostsChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SAVED_POSTS_CHANGED_EVENT));
}

export type SavedPostSnapshot = {
  id: string;
  content: string;
  imageUrl?: string | null;
  createdAt: string;
  authorId: string;
  authorName: string;
  forumName?: string | null;
};

export function loadSavedPosts(): SavedPostSnapshot[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FORUM_SAVED_POSTS_KEY);
    if (!raw) return [];
    const p = JSON.parse(raw) as unknown;
    if (!Array.isArray(p)) return [];
    return p.filter(
      (x): x is SavedPostSnapshot =>
        !!x &&
        typeof x === "object" &&
        typeof (x as SavedPostSnapshot).id === "string" &&
        typeof (x as SavedPostSnapshot).content === "string"
    );
  } catch {
    return [];
  }
}

export function isPostSaved(postId: string): boolean {
  return loadSavedPosts().some((p) => p.id === postId);
}

export function savePostSnapshot(s: SavedPostSnapshot): void {
  const cur = loadSavedPosts().filter((p) => p.id !== s.id);
  cur.unshift(s);
  try {
    localStorage.setItem(FORUM_SAVED_POSTS_KEY, JSON.stringify(cur.slice(0, 200)));
    notifySavedPostsChanged();
  } catch {
    /* quota */
  }
}

export function removeSavedPost(postId: string): void {
  const cur = loadSavedPosts().filter((p) => p.id !== postId);
  try {
    localStorage.setItem(FORUM_SAVED_POSTS_KEY, JSON.stringify(cur));
    notifySavedPostsChanged();
  } catch {
    /* ignore */
  }
}
