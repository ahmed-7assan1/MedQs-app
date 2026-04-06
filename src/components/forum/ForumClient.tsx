"use client";
import { useState, useEffect, useRef } from "react";
import { PostCard } from "./PostCard";
import {
  MessageSquare,
  Send,
  Loader2,
  Globe,
  Users,
  PlusCircle,
  Type,
  Link2,
  ImagePlus,
  X,
  List,
  Quote,
  Code2,
  MoreVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import type { PostWithMeta } from "@/types";
import ReactMarkdown from "react-markdown";
import { enhancePlainImageUrls, normalizeImageUrl } from "@/lib/markdown-helpers";
import { markdownComponentsWithImages } from "@/components/ui/MarkdownBody";
import { ForumPostListSkeleton } from "@/components/ui/skeleton";
import { uploadFiles } from "@/lib/uploadthing-react";

function uploadthingPublicAppId(): string {
  return (process.env.NEXT_PUBLIC_UPLOADTHING_APP_ID ?? "").trim();
}

function fileUrlFromUt(file: { url?: string; ufsUrl?: string } | undefined): string | null {
  if (!file) return null;
  const u = file.url ?? file.ufsUrl;
  return typeof u === "string" && u.length > 0 ? u : null;
}

interface Forum {
  id: string;
  name: string;
  type: string;
  status: string;
  _count: { posts: number };
}

export function ForumClient({
  forums,
  currentUserId,
  initialForumId = null,
  initialPosts = [],
}: {
  forums: Forum[];
  currentUserId: string;
  /** SSR-loaded posts for the first forum (same path as API — works if client fetch fails) */
  initialForumId?: string | null;
  initialPosts?: PostWithMeta[];
}) {
  const fallbackRef = useRef({ forumId: initialForumId, posts: initialPosts });
  fallbackRef.current = { forumId: initialForumId, posts: initialPosts };

  const [forumList, setForumList] = useState<Forum[]>(forums);
  const [activeForum, setActiveForum] = useState<Forum | null>(forums[0] ?? null);
  const [posts, setPosts] = useState<PostWithMeta[]>(() => {
    const f = forums[0];
    if (f && initialForumId === f.id) return initialPosts;
    return [];
  });
  const [loading, setLoading] = useState(false);
  const [composing, setComposing] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [postImageUrl, setPostImageUrl] = useState("");
  const [posting, setPosting] = useState(false);
  const [creatingForum, setCreatingForum] = useState(false);
  const [newForumName, setNewForumName] = useState("");
  const [inviteTokens, setInviteTokens] = useState("");
  const [inviteQuery, setInviteQuery] = useState("");
  const [inviteResults, setInviteResults] = useState<{ id: string; name: string; nickname?: string | null; studentId?: string | null }[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<{ id: string; forum: { id: string; name: string }; sender: { name: string; nickname?: string | null } }[]>([]);
  const [handlingInviteId, setHandlingInviteId] = useState<string | null>(null);
  const [privateForumMenuOpen, setPrivateForumMenuOpen] = useState(false);
  const [privateFormOpen, setPrivateFormOpen] = useState(false);
  const [tab, setTab] = useState<"feed" | "discussions">("feed");
  const [discussionScope, setDiscussionScope] = useState<"global" | "semester">("semester");
  const [feedMode, setFeedMode] = useState<"university" | "following">("university");
  const [postAudience, setPostAudience] = useState<"UNIVERSITY" | "FOLLOWERS">("UNIVERSITY");

  async function loadPosts(forumId: string) {
    if (!forumId) return;
    setLoading(true);
    try {
      const endpoint =
        tab === "feed"
          ? `/api/v1/feed?forumId=${encodeURIComponent(forumId)}&mode=${encodeURIComponent(feedMode)}`
          : `/api/v1/forums/${forumId}/posts`;
      const res = await fetch(endpoint, { credentials: "include", cache: "no-store" });
      const raw = await res.text();
      let data: unknown = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        data = null;
      }
      if (!res.ok) {
        const body = data && typeof data === "object" && data !== null ? (data as Record<string, unknown>) : null;
        const errText = body && typeof body.error === "string" ? body.error : null;
        const details = body && typeof body.details === "string" ? body.details : null;
        const code = body && typeof body.code === "string" ? body.code : null;
        const msg =
          errText ??
          (res.status === 401
            ? "Sign in again to view posts"
            : res.status === 403
              ? "You can’t view posts in this forum"
              : `Could not load posts (${res.status})`);
        let line = code ? `${msg} [${code}]` : msg;
        if (details) {
          const short = details.length > 200 ? `${details.slice(0, 200)}…` : details;
          line = `${line} — ${short}`;
        }
        toast.error(line);
        const fb = fallbackRef.current;
        if (!(forumId === fb.forumId && fb.posts.length > 0)) setPosts([]);
        return;
      }
      if (!Array.isArray(data)) {
        toast.error("Invalid response from server");
        const fb = fallbackRef.current;
        if (!(forumId === fb.forumId && fb.posts.length > 0)) setPosts([]);
        return;
      }
      setPosts(data);
    } catch {
      toast.error("Network error — could not load posts");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (activeForum) loadPosts(activeForum.id);
  }, [activeForum?.id, tab, discussionScope, feedMode]);

  useEffect(() => {
    const globalForum = forumList.find((f) => f.type === "GLOBAL") ?? forumList[0] ?? null;
    const semesterForum = forumList.find((f) => f.type === "SEMESTER") ?? globalForum;
    if (tab === "feed") setActiveForum(globalForum);
    else setActiveForum(discussionScope === "semester" ? semesterForum : globalForum);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, discussionScope, forumList.length]);

  useEffect(() => {
    function onDocClick() {
      setPrivateForumMenuOpen(false);
    }
    if (!privateForumMenuOpen) return;
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [privateForumMenuOpen]);

  useEffect(() => {
    fetch("/api/v1/forums/invites")
      .then((r) => r.json())
      .then((d) => setPendingInvites(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  async function handlePost() {
    if (!activeForum) return;
    if (!postContent.trim() && !postImageUrl.trim()) return;
    if (activeForum.status === "READ_ONLY") return toast.error("This forum is read-only");
    setPosting(true);
    try {
      const res = await fetch(`/api/v1/forums/${activeForum.id}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: postContent.trim(),
          imageUrl: postImageUrl.trim() || undefined,
          audience: postAudience,
        }),
      });
      if (res.ok) {
        const newPost = await res.json();
        setPosts((p) => [newPost, ...p]);
        setPostContent("");
        setPostImageUrl("");
        setComposing(false);
        toast.success("Post published!");
      } else {
        toast.error("Failed to post");
      }
    } finally {
      setPosting(false);
    }
  }

  async function handleCreateForum() {
    if (!newForumName.trim()) return;
    setCreatingForum(true);
    try {
      const tokens = inviteTokens
        .split(/[,\n]/g)
        .map((x) => x.trim())
        .filter(Boolean);

      const res = await fetch("/api/v1/forums/private", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newForumName.trim(),
          inviteTokens: tokens,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      toast.success("Private forum created");
      const forum = {
        ...data.forum,
        _count: { posts: 0 },
      };
      setForumList((prev) => [forum, ...prev]);
      setActiveForum(forum);
      setNewForumName("");
      setInviteTokens("");
      setPrivateFormOpen(false);
    } catch {
      toast.error("Could not create private forum");
    } finally {
      setCreatingForum(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(async () => {
      if (inviteQuery.trim().length < 2) {
        setInviteResults([]);
        return;
      }
      try {
        const res = await fetch(`/api/v1/users/search?q=${encodeURIComponent(inviteQuery.trim())}`);
        const data = await res.json();
        setInviteResults(Array.isArray(data) ? data : []);
      } catch {
        setInviteResults([]);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [inviteQuery]);

  function addInviteToken(token: string) {
    const normalized = token.trim();
    if (!normalized) return;
    const current = inviteTokens
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
    if (current.includes(normalized)) return;
    setInviteTokens([...current, normalized].join(", "));
    setInviteQuery("");
    setInviteResults([]);
  }

  async function uploadForumImage(file: File) {
    setUploadingImage(true);
    try {
      if (uploadthingPublicAppId()) {
        const uploaded = await uploadFiles("forumImage", { files: [file] });
        const url = fileUrlFromUt(uploaded[0]);
        if (url) {
          setPostImageUrl(url);
          toast.success("Image uploaded");
        } else {
          toast.error("Upload finished but no URL returned");
        }
        return;
      }

      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "forum");
      const res = await fetch("/api/v1/upload/direct", {
        method: "POST",
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(typeof data?.error === "string" ? data.error : "Image upload failed");
        return;
      }
      if (typeof data.url === "string") {
        setPostImageUrl(data.url);
        toast.success("Image uploaded");
      } else {
        toast.error("Invalid response from server");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Image upload failed";
      toast.error(msg);
    } finally {
      setUploadingImage(false);
    }
  }

  function injectFormat(type: "bold" | "italic" | "link") {
    if (type === "bold") setPostContent((v) => `${v}${v ? "\n" : ""}**bold text**`);
    if (type === "italic") setPostContent((v) => `${v}${v ? "\n" : ""}*italic text*`);
    if (type === "link") setPostContent((v) => `${v}${v ? "\n" : ""}[link title](https://example.com)`);
  }

  function injectBlock(type: "h3" | "list" | "quote" | "code") {
    if (type === "h3") setPostContent((v) => `${v}${v ? "\n\n" : ""}### Title`);
    if (type === "list") setPostContent((v) => `${v}${v ? "\n\n" : ""}- item 1\n- item 2`);
    if (type === "quote") setPostContent((v) => `${v}${v ? "\n\n" : ""}> quoted text`);
    if (type === "code") setPostContent((v) => `${v}${v ? "\n\n" : ""}\`\`\`\ncode block\n\`\`\``);
  }

  async function handleInvite(inviteId: string, action: "accept" | "decline") {
    setHandlingInviteId(inviteId);
    try {
      const res = await fetch(`/api/v1/forums/invites/${inviteId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error();
      setPendingInvites((prev) => prev.filter((i) => i.id !== inviteId));
      toast.success(action === "accept" ? "Invite accepted" : "Invite declined");
      if (action === "accept") window.location.reload();
    } catch {
      toast.error("Failed to handle invite");
    } finally {
      setHandlingInviteId(null);
    }
  }

  if (forumList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <MessageSquare className="mb-3 h-12 w-12 text-muted-foreground opacity-30" />
        <h2 className="font-display text-xl font-bold">No forums available</h2>
        <p className="text-sm text-muted-foreground">Forums will appear here once created.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Community</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your university feed and semester discussions.</p>
        </div>
        <div className="relative shrink-0">
          <button
            type="button"
            aria-label="Forum options"
            aria-expanded={privateForumMenuOpen}
            onClick={(e) => {
              e.stopPropagation();
              setPrivateForumMenuOpen((o) => !o);
            }}
            className="rounded-lg border border-border bg-card p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <MoreVertical className="h-5 w-5" />
          </button>
          {privateForumMenuOpen && (
            <div
              className="absolute right-0 z-30 mt-1 min-w-[200px] rounded-lg border border-border bg-card py-1 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                onClick={() => {
                  setPrivateFormOpen(true);
                  setPrivateForumMenuOpen(false);
                }}
              >
                <Users className="h-4 w-4 opacity-70" />
                Create private forum
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-border bg-background p-1 text-sm">
          <button
            onClick={() => setTab("feed")}
            className={cn(
              "rounded-lg px-3 py-1.5 font-semibold",
              tab === "feed" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            )}
          >
            Feed
          </button>
          <button
            onClick={() => setTab("discussions")}
            className={cn(
              "rounded-lg px-3 py-1.5 font-semibold",
              tab === "discussions" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            )}
          >
            Discussions
          </button>
        </div>

        {tab === "feed" ? (
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={feedMode}
              onChange={(e) => setFeedMode(e.target.value as any)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="university">University</option>
              <option value="following">Following</option>
            </select>
            <select
              value={postAudience}
              onChange={(e) => setPostAudience(e.target.value as any)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              title="Who can see your post?"
            >
              <option value="UNIVERSITY">Audience: University</option>
              <option value="FOLLOWERS">Audience: Followers</option>
            </select>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={discussionScope}
              onChange={(e) => setDiscussionScope(e.target.value as any)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="semester">Semester</option>
              <option value="global">University</option>
            </select>
          </div>
        )}
      </div>
      {pendingInvites.length > 0 && (
        <div className="mb-6 rounded-xl border border-amber-300/50 bg-amber-50/60 p-4 dark:border-amber-900/50 dark:bg-amber-900/20">
          <p className="mb-2 text-sm font-semibold">Pending private forum invites</p>
          <div className="space-y-2">
            {pendingInvites.map((invite) => (
              <div key={invite.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2">
                <p className="text-xs">
                  <span className="font-semibold">{invite.sender.name}</span> invited you to{" "}
                  <span className="font-semibold">{invite.forum.name}</span>
                </p>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleInvite(invite.id, "decline")}
                    disabled={handlingInviteId === invite.id}
                    className="rounded-md border border-border px-2 py-1 text-xs hover:bg-muted"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => handleInvite(invite.id, "accept")}
                    disabled={handlingInviteId === invite.id}
                    className="rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground disabled:opacity-60"
                  >
                    {handlingInviteId === invite.id ? "..." : "Accept"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {privateFormOpen && (
        <div className="mb-6 rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">Create private study forum</p>
            <button
              type="button"
              onClick={() => setPrivateFormOpen(false)}
              className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
            >
              Close
            </button>
          </div>
          <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
            <input
              value={newForumName}
              onChange={(e) => setNewForumName(e.target.value)}
              placeholder="Forum name (e.g. Pharma Team A)"
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="relative">
              <input
                value={inviteQuery}
                onChange={(e) => setInviteQuery(e.target.value)}
                placeholder="Search friends by username or ID"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {inviteResults.length > 0 && (
                <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-border bg-card p-1 shadow-lg">
                  {inviteResults.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => addInviteToken(u.studentId || u.nickname || u.name)}
                      className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted"
                    >
                      <span>{u.name}</span>
                      <span className="text-muted-foreground">@{u.nickname || u.studentId || "user"}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={handleCreateForum}
              disabled={creatingForum || !newForumName.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              {creatingForum ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
              Create
            </button>
          </div>
          <input
            value={inviteTokens}
            onChange={(e) => setInviteTokens(e.target.value)}
            placeholder="Selected invites (comma separated IDs/usernames)"
            className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      )}

      {/* Forum tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {forumList.map((forum) => (
          <button
            key={forum.id}
            onClick={() => setActiveForum(forum)}
            className={cn(
              "flex flex-shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all",
              activeForum?.id === forum.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-border/80"
            )}
          >
            {forum.type === "GLOBAL" ? (
              <Globe className="h-3.5 w-3.5" />
            ) : (
              <Users className="h-3.5 w-3.5" />
            )}
            {forum.name}
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-mono">
              {forum._count.posts}
            </span>
            {forum.status === "READ_ONLY" && (
              <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                read-only
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Compose */}
      {activeForum && activeForum.status !== "READ_ONLY" && (
        <div className="mb-6 rounded-xl border border-border bg-card p-4">
          {!composing ? (
            <button
              onClick={() => setComposing(true)}
              className="flex w-full items-center gap-3 text-sm text-muted-foreground"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                <MessageSquare className="h-4 w-4" />
              </div>
              <span className="flex-1 rounded-lg bg-muted px-3 py-2 text-left hover:bg-muted/80 transition-colors">
                Share something with your peers...
              </span>
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Type markdown on the left — formatted preview updates live on the right.
              </p>
              <div className="grid gap-3 md:grid-cols-2 md:gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Write
                  </label>
                  <textarea
                    autoFocus
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    placeholder="**Bold**, lists, links… (Markdown)"
                    rows={10}
                    className="min-h-[200px] w-full flex-1 resize-y rounded-xl border border-border bg-background px-3 py-2.5 font-mono text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Preview
                  </label>
                  <div className="min-h-[200px] rounded-xl border border-border bg-muted/40 px-3 py-2.5 dark:bg-muted/20">
                    <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-display prose-p:leading-relaxed prose-img:my-3">
                      <ReactMarkdown components={markdownComponentsWithImages}>
                        {postContent.trim()
                          ? enhancePlainImageUrls(postContent)
                          : "_Start typing to see formatting…_"}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
              <input
                value={postImageUrl}
                onChange={(e) => setPostImageUrl(e.target.value)}
                placeholder="Optional image URL (or upload below)"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
              />
              <div className="flex items-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-muted">
                  {uploadingImage ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
                  Upload image
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadForumImage(file);
                      e.currentTarget.value = "";
                    }}
                  />
                </label>
                {postImageUrl && (
                  <button
                    type="button"
                    onClick={() => setPostImageUrl("")}
                    className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-muted"
                  >
                    <X className="h-3.5 w-3.5" /> Remove image
                  </button>
                )}
              </div>
              {postImageUrl ? (
                <div className="overflow-hidden rounded-lg border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={normalizeImageUrl(postImageUrl)}
                    alt=""
                    className="max-h-48 w-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : null}
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => injectFormat("bold")} className="rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-muted">
                  <Type className="mr-1 inline h-3.5 w-3.5" /> Bold
                </button>
                <button type="button" onClick={() => injectFormat("italic")} className="rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-muted">
                  <Type className="mr-1 inline h-3.5 w-3.5" /> Italic
                </button>
                <button type="button" onClick={() => injectFormat("link")} className="rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-muted">
                  <Link2 className="mr-1 inline h-3.5 w-3.5" /> Link
                </button>
                <button type="button" onClick={() => injectBlock("h3")} className="rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-muted">
                  <Type className="mr-1 inline h-3.5 w-3.5" /> H3
                </button>
                <button type="button" onClick={() => injectBlock("list")} className="rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-muted">
                  <List className="mr-1 inline h-3.5 w-3.5" /> List
                </button>
                <button type="button" onClick={() => injectBlock("quote")} className="rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-muted">
                  <Quote className="mr-1 inline h-3.5 w-3.5" /> Quote
                </button>
                <button type="button" onClick={() => injectBlock("code")} className="rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-muted">
                  <Code2 className="mr-1 inline h-3.5 w-3.5" /> Code
                </button>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setComposing(false); setPostContent(""); setPostImageUrl(""); }}
                  className="rounded-lg px-4 py-2 text-sm hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePost}
                  disabled={posting || (!postContent.trim() && !postImageUrl.trim())}
                  className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
                >
                  {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {posting ? "Posting..." : "Post"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Posts */}
      {loading ? (
        <ForumPostListSkeleton count={4} />
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border py-12 text-center">
          <MessageSquare className="mb-3 h-10 w-10 text-muted-foreground opacity-30" />
          <p className="font-medium">No posts yet</p>
          <p className="text-sm text-muted-foreground">Be the first to post!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentUserId}
              forumName={activeForum?.name}
            />
          ))}
        </div>
      )}
    </div>
  );
}
