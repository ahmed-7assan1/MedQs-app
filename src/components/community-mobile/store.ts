// src/components/community-mobile/store.ts
// Extends the app's existing Zustand store (store.ts) with a community slice.
// If a global store already exists, merge this slice into it via `create()`'s
// combine/slices pattern instead of instantiating a second store.

import { create } from "zustand";
import type { Forum, FeedFilter, Post, ReactionType } from "./types";

interface CommunityState {
  activeForumId: string | null;
  forums: Forum[];
  activeFilter: FeedFilter;
  posts: Post[];
  isComposerOpen: boolean;
  composerInitialPostId: string | null; // set when editing an existing post
  activeCommentsPostId: string | null;
  reportTarget: { type: "post" | "comment" | "user"; id: string } | null;
  feedScrolled: boolean;

  setForums: (forums: Forum[]) => void;
  setActiveForum: (forumId: string) => void;
  setActiveFilter: (filter: FeedFilter) => void;
  setPosts: (posts: Post[]) => void;
  prependPost: (post: Post) => void;
  appendPosts: (posts: Post[]) => void;
  removePost: (postId: string) => void;
  updatePost: (postId: string, patch: Partial<Post>) => void;
  applyReaction: (postId: string, type: ReactionType | null, previous: ReactionType | null) => void;

  openComposer: (postId?: string) => void;
  closeComposer: () => void;
  openComments: (postId: string) => void;
  closeComments: () => void;
  openReport: (type: "post" | "comment" | "user", id: string) => void;
  closeReport: () => void;
  setFeedScrolled: (scrolled: boolean) => void;
}

export const useCommunityStore = create<CommunityState>((set) => ({
  activeForumId: null,
  forums: [],
  activeFilter: "latest",
  posts: [],
  isComposerOpen: false,
  composerInitialPostId: null,
  activeCommentsPostId: null,
  reportTarget: null,
  feedScrolled: false,

  setForums: (forums) =>
    set((state) => ({
      forums,
      activeForumId: state.activeForumId ?? forums[0]?.id ?? null,
    })),
  setActiveForum: (forumId) => set({ activeForumId: forumId, posts: [] }),
  setActiveFilter: (filter) => set({ activeFilter: filter }),
  setPosts: (posts) => set({ posts }),
  prependPost: (post) => set((state) => ({ posts: [post, ...state.posts] })),
  appendPosts: (posts) =>
    set((state) => ({ posts: [...state.posts, ...posts] })),
  removePost: (postId) =>
    set((state) => ({ posts: state.posts.filter((p) => p.id !== postId) })),
  updatePost: (postId, patch) =>
    set((state) => ({
      posts: state.posts.map((p) => (p.id === postId ? { ...p, ...patch } : p)),
    })),
  applyReaction: (postId, nextType, previousType) =>
    set((state) => ({
      posts: state.posts.map((p) => {
        if (p.id !== postId) return p;
        const counts = { ...p.reactionCounts };
        if (previousType) counts[previousType] = Math.max(0, counts[previousType] - 1);
        if (nextType) counts[nextType] = counts[nextType] + 1;
        return { ...p, reactionCounts: counts, userReaction: nextType };
      }),
    })),

  openComposer: (postId) =>
    set({ isComposerOpen: true, composerInitialPostId: postId ?? null }),
  closeComposer: () => set({ isComposerOpen: false, composerInitialPostId: null }),
  openComments: (postId) => set({ activeCommentsPostId: postId }),
  closeComments: () => set({ activeCommentsPostId: null }),
  openReport: (type, id) => set({ reportTarget: { type, id } }),
  closeReport: () => set({ reportTarget: null }),
  setFeedScrolled: (scrolled) => set({ feedScrolled: scrolled }),
}));
