"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { PostCardRedesigned } from "./PostCardRedesigned";
import { PostComposerRedesigned } from "./PostComposerRedesigned";
import {
  ChatCircle,
  PaperPlaneTilt,
  CircleNotch,
  Globe,
  Users,
  PlusCircle,
  TextT,
  Link as LinkIcon,
  ImageSquare,
  X,
  List,
  Quotes,
  Code,
  DotsThreeVertical,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { MedqsSelect } from "@/components/ui/MedqsSelect";
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
  currentUserRole,
  currentUserUniversityId,
  initialForumId = null,
  initialPosts = [],
}: {
  forums: Forum[];
  currentUserId: string;
  currentUserRole?: string;
  currentUserUniversityId?: string;
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
  const [tab, setTab] = useState<"feed" | "discussions">("discussions");
  const [discussionScope, setDiscussionScope] = useState<"global" | "semester">("semester");
  const [feedMode, setFeedMode] = useState<"university" | "following">("university");
  const [postAudience, setPostAudience] = useState<"UNIVERSITY" | "FOLLOWERS">("UNIVERSITY");
  const [discussionDraft, setDiscussionDraft] = useState("");
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const discussionInputRef = useRef<HTMLTextAreaElement>(null);

  const discussionPostsChronological = useMemo(() => {
    if (tab !== "discussions") return posts;
    return [...posts].reverse();
  }, [tab, posts]);

  const uniqueAuthors = useMemo(() => {
    const authors = new Map();
    posts.forEach(p => {
      if (!authors.has(p.author.id)) {
        authors.set(p.author.id, p.author);
      }
    });
    return Array.from(authors.values()).slice(0, 10);
  }, [posts]);

  useEffect(() => {
    if (tab !== "discussions") return;
    const el = chatScrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [tab, posts.length, loading]);

  useEffect(() => {
    if (tab !== "discussions" || !discussionInputRef.current) return;
    const el = discussionInputRef.current;
    el.style.height = "0px";
    el.style.height = `${Math.min(160, Math.max(44, el.scrollHeight))}px`;
  }, [discussionDraft, tab]);

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

  const isChatTab = tab === "discussions";
  const [mobileThreadsOpen, setMobileThreadsOpen] = useState(false);
  const [threadQuery, setThreadQuery] = useState("");
  const filteredForums = useMemo(() => {
    const q = threadQuery.trim().toLowerCase();
    if (!q) return forumList;
    return forumList.filter((f) => f.name.toLowerCase().includes(q));
  }, [threadQuery, forumList]);

  async function submitPost(
    content: string, 
    imageUrl: string, 
    options?: { isForumPost?: boolean; isChatMessage?: boolean; forumId?: string; attachments?: any[] }
  ): Promise<boolean> {
    const targetForumId = options?.forumId || activeForum?.id;
    if (!targetForumId) return false;
    const trimmed = content.trim();
    const img = imageUrl.trim();
    if (!trimmed && !img && (!options?.attachments || options.attachments.length === 0)) return false;
    if (activeForum?.status === "READ_ONLY") {
      toast.error("This forum is read-only");
      return false;
    }
    setPosting(true);
    try {
      const res = await fetch(`/api/v1/forums/${targetForumId}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: trimmed,
          imageUrl: img || undefined,
          attachments: options?.attachments,
          audience: postAudience,
          isForumPost: options?.isForumPost,
          isChatMessage: options?.isChatMessage,
        }),
      });
      if (res.ok) {
        const newPost = await res.json();
        setPosts((p) => [newPost, ...p]);
        toast.success(tab === "discussions" ? "Sent" : "Post published!");
        return true;
      }
      const errData = await res.json().catch(() => ({}));
      toast.error(errData.error || "Failed to post");
      return false;
    } catch {
      toast.error("Network error — could not send");
      return false;
    } finally {
      setPosting(false);
    }
  }

  async function handlePost() {
    const ok = await submitPost(postContent, postImageUrl, { isForumPost: true, isChatMessage: false });
    if (ok) {
      setPostContent("");
      setPostImageUrl("");
      setComposing(false);
    }
  }

  async function handleDiscussionSend() {
    const ok = await submitPost(discussionDraft, postImageUrl, { isForumPost: false, isChatMessage: true });
    if (ok) {
      setDiscussionDraft("");
      setPostImageUrl("");
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
      <div className="flex flex-col items-center justify-center py-48 text-center animate-in fade-in zoom-in duration-700">
        <div className="h-24 w-24 rounded-full bg-white/5 flex items-center justify-center mb-6 mx-auto border border-white/10 shadow-2xl">
           <ChatCircle size={40} weight="bold" className="text-primary" />
        </div>
        <h2 className="font-display text-3xl font-black italic tracking-tighter uppercase mb-2">No Active Nodes</h2>
        <p className="text-sm font-bold text-white/20 max-w-xs mx-auto">This sector is currently offline. No communication pools have been established for your university yet.</p>
        
        {(currentUserRole === 'ADMIN' || currentUserRole === 'SUPERADMIN') && (
           <button 
             onClick={() => setPrivateFormOpen(true)}
             className="mt-8 px-8 py-3 bg-primary text-white rounded-2xl text-[12px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/30"
           >
             Initialize First Vector
           </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex w-full flex-col font-sans",
        isChatTab
          ? "min-h-0 flex-1 px-0 pb-0 pt-20"
          : "mx-auto max-w-[700px] px-4 pt-20 pb-10"
      )}
    >
      {/* Header & Navigation */}
      <div className={cn("px-4", isChatTab ? "mb-4 shrink-0" : "mb-8")}>
        <div className="flex items-center justify-between gap-4 mb-6">
          <h1 className={cn("font-display font-bold dark:text-white text-black tracking-tight", isChatTab ? "text-2xl" : "text-4xl")}>
            Community
          </h1>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center justify-center md:justify-start mb-6">
          <div className="inline-flex rounded-2xl border border-white/[0.02] bg-white/5 p-1 backdrop-blur-md">
            <button
              onClick={() => setTab("feed")}
              className={cn(
                "rounded-xl px-8 py-2.5 text-xs font-black uppercase tracking-widest transition-all duration-300",
                tab === "feed" 
                  ? "bg-primary text-white shadow-lg shadow-primary/30" 
                  : "text-white/40 hover:text-white/70"
              )}
            >
              Feed
            </button>
            <button
              onClick={() => setTab("discussions")}
              className={cn(
                "rounded-xl px-8 py-2.5 text-xs font-black uppercase tracking-widest transition-all duration-300",
                tab === "discussions" 
                  ? "bg-primary text-white shadow-lg shadow-primary/30" 
                  : "text-white/40 hover:text-white/70"
              )}
            >
              Chat
            </button>
          </div>
        </div>

          <div className="flex items-center gap-3">
            {tab === "feed" ? (
              <>
                <MedqsSelect
                  value={feedMode}
                  onChange={(e) => setFeedMode(e.target.value as any)}
                  className="min-w-[140px] rounded-xl border-white/[0.03] bg-white/5 text-sm font-semibold h-10"
                >
                  <option value="university">University</option>
                  <option value="following">Following</option>
                </MedqsSelect>
                <MedqsSelect
                  value={postAudience}
                  onChange={(e) => setPostAudience(e.target.value as any)}
                  className="min-w-[160px] rounded-xl border-white/[0.03] bg-white/5 text-sm font-semibold h-10"
                >
                  <option value="UNIVERSITY">Public: Univ</option>
                  <option value="FOLLOWERS">Public: Mixed</option>
                </MedqsSelect>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setMobileThreadsOpen(true)}
                  className="md:hidden flex items-center gap-2 rounded-xl border border-white/[0.03] bg-white/5 px-4 py-2 text-xs font-bold text-white/70 hover:bg-white/10 active:scale-95 transition-all"
                >
                  <List size={16} weight="bold" />
                  Groups
                </button>
                <MedqsSelect
                  value={discussionScope}
                  onChange={(e) => setDiscussionScope(e.target.value as any)}
                  className="min-w-[140px] rounded-xl border-white/[0.03] bg-white/5 text-sm font-semibold h-10"
                >
                  <option value="semester">Semester</option>
                  <option value="global">University</option>
                </MedqsSelect>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Invites & Alerts */}
      <div className={cn("px-4", isChatTab && "shrink-0")}>
        {pendingInvites.length > 0 && (
          <div className="mb-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 sm:p-5 backdrop-blur-md">
            <h3 className="text-xs font-black uppercase tracking-widest text-amber-500 mb-4 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              Pending Invitations
            </h3>
            <div className="grid gap-3">
              {pendingInvites.map((invite) => (
                <div key={invite.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-white/[0.02] bg-white/5 p-4 transition-all hover:bg-white/10">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-white/90 font-bold">
                        {invite.sender.name}
                      </p>
                      <p className="text-xs text-white/40">
                        Invited you to join <span className="text-white/60 font-semibold">{invite.forum.name}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleInvite(invite.id, "decline")}
                      disabled={handlingInviteId === invite.id}
                      className="flex-1 sm:flex-none rounded-lg px-4 py-2 text-xs font-bold text-white/30 hover:bg-white/5 transition-all"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handleInvite(invite.id, "accept")}
                      disabled={handlingInviteId === invite.id}
                      className="flex-1 sm:flex-none rounded-lg bg-amber-500 px-4 py-2 text-xs font-black text-black hover:bg-amber-400 active:scale-95 transition-all shadow-lg shadow-amber-500/40"
                    >
                      {handlingInviteId === invite.id ? "..." : "Accept"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}


      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0">
        {isChatTab ? (
          <div className="grid h-full grid-cols-1 md:grid-cols-[280px_1fr] lg:grid-cols-[320px_1fr] gap-4 lg:gap-6 px-4">
            {/* Thread List - Aside */}
            <aside className="hidden md:flex flex-col min-h-0 bg-[#0F0E16]/40 rounded-3xl border border-white/[0.02] overflow-hidden backdrop-blur-sm self-start max-h-full">
              <div className="p-4 border-b border-white/[0.02] bg-white/5">
                <div className="relative">
                  <input
                    value={threadQuery}
                    onChange={(e) => setThreadQuery(e.target.value)}
                    placeholder="Filter Groups..."
                    className="w-full h-10 rounded-xl bg-black/40 border border-white/[0.03] px-4 pl-10 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-[#534AB7]"
                  />
                  <Globe size={18} weight="bold" className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2.5 space-y-1 custom-scrollbar">
                {filteredForums.map((forum) => {
                  const active = activeForum?.id === forum.id;
                  return (
                    <button
                      key={forum.id}
                      onClick={() => setActiveForum(forum)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all group",
                        active 
                          ? "bg-[#534AB7]/20 border border-[#534AB7]/30 ring-1 ring-[#534AB7]/20" 
                          : "hover:bg-white/5 border border-transparent"
                      )}
                    >
                      <div className={cn(
                        "h-10 w-10 flex items-center justify-center rounded-xl transition-all",
                        active ? "bg-[#534AB7] text-white shadow-lg shadow-[#534AB7]/40" : "bg-white/5 text-white/20 group-hover:bg-white/10 group-hover:text-white/40"
                      )}>
                        {forum.type === "GLOBAL" ? <Globe size={20} weight="bold" /> : <Users size={20} weight="bold" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={cn("truncate text-sm font-bold", active ? "text-white" : "text-white/50 group-hover:text-white/80")}>
                          {forum.name}
                        </p>
                        <p className="truncate text-[10px] font-black uppercase tracking-widest text-white/20 uppercase">
                          {forum.status === "READ_ONLY" ? "Archived" : "Live Feed"}
                        </p>
                      </div>
                      <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-black text-white/20">
                        {forum._count.posts}
                      </span>
                    </button>
                  );
                })}
              </div>
            </aside>

            {/* Mobile Drawer */}
            {mobileThreadsOpen && (
              <div className="fixed inset-0 z-[100] md:hidden animate-in fade-in duration-300">
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setMobileThreadsOpen(false)} />
                <div className="absolute left-0 top-0 h-full w-[300px] bg-[#0F0E16] border-r border-white/[0.03] flex flex-col shadow-2xl animate-in slide-in-from-left duration-500">
                  <div className="p-6 border-b border-white/[0.02] flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">Groups</h3>
                    <button onClick={() => setMobileThreadsOpen(false)} className="text-white/30 hover:text-white">
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {filteredForums.map((f) => (
                      <button
                        key={f.id}
                          onClick={() => { setActiveForum(f); setMobileThreadsOpen(false); }}
                          className={cn("flex w-full items-center gap-4 rounded-2xl p-4 text-left transition-all", activeForum?.id === f.id ? "bg-[#534AB7] text-white shadow-xl" : "bg-white/5 text-white/40")}
                        >
                           <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-black/20">
                              {f.type === "GLOBAL" ? <Globe size={20} weight="bold" /> : <Users size={20} weight="bold" />}
                           </div>
                           <span className="font-bold">{f.name}</span>
                        </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Chat Panel */}
            <section className="flex flex-col h-full bg-[#0F0E16]/60 rounded-3xl md:rounded-[32px] border border-white/[0.03] overflow-hidden shadow-2xl backdrop-blur-md">
                {/* Chat Header */}
                <header className="flex items-center justify-between px-6 py-5 border-b border-white/[0.03] bg-white/5 backdrop-blur-xl">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-[#534AB7]/10 text-[#534AB7] border border-[#534AB7]/20">
                       {activeForum?.type === "GLOBAL" ? <Globe size={24} weight="bold" /> : <Users size={24} weight="bold" />}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-black text-white truncate leading-tight">
                        {activeForum?.name ?? "Select Communication Pool"}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse"></span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#10B981]">Real-time Active</span>
                      </div>
                    </div>
                  </div>
                   <div className="flex items-center gap-2">
                     <button className="hidden sm:flex rounded-xl bg-white/5 p-2.5 text-white/30 hover:bg-white/10 hover:text-white transition-all">
                       <PaperPlaneTilt size={20} weight="bold" className="rotate-45" />
                     </button>
                  </div>
                </header>

                {/* Messages Space */}
                <div className="flex-1 flex flex-col min-h-0 bg-gradient-to-b from-transparent to-black/20">
                  {loading ? (
                    <div className="flex-1 p-6 space-y-6">
                      <ForumPostListSkeleton count={4} />
                    </div>
                  ) : activeForum ? (
                    <>
                      <div
                        ref={chatScrollRef}
                        className="flex-1 overflow-y-auto px-6 py-8 space-y-8 custom-scrollbar scroll-smooth"
                      >
                         {discussionPostsChronological.length === 0 ? (
                          <div className="flex h-full flex-col items-center justify-center text-center opacity-20 py-20 translate-y-[-20px]">
                            <div className="h-24 w-24 flex items-center justify-center rounded-full mb-6 bg-white/5 ring-1 ring-white/10">
                               <ChatCircle size={40} weight="bold" />
                            </div>
                            <h4 className="text-xl font-bold text-white mb-2 italic">Radio Silence...</h4>
                            <p className="text-sm font-medium w-64">Initialize the sequence by being the first to broadcast a message here.</p>
                          </div>
                        ) : (
                          discussionPostsChronological.map((post) => (
                            <PostCardRedesigned 
                              key={post.id} 
                              post={post} 
                              currentUserId={currentUserId} 
                            />
                          ))
                        )}
                        <div className="h-2 w-full" />
                      </div>

                      {activeForum?.status !== "READ_ONLY" && (
                        <div className="p-5 border-t border-white/[0.02] bg-black/40">
                          <div className="flex items-end gap-3 rounded-2xl bg-white/5 p-2.5 border border-white/[0.02] focus-within:border-[#534AB7]/50 focus-within:ring-4 focus-within:ring-[#534AB7]/10 transition-all ease-out duration-300">
                            <textarea
                              ref={discussionInputRef}
                              value={discussionDraft}
                              onChange={(e) => setDiscussionDraft(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  void handleDiscussionSend();
                                }
                              }}
                              placeholder="Coordinate thoughts here..."
                              className="flex-1 min-h-[46px] max-h-40 bg-transparent border-none px-3 py-3 text-sm font-medium text-white placeholder:text-white/20 focus:ring-0 resize-none leading-relaxed"
                            />
                             <button
                              onClick={handleDiscussionSend}
                              disabled={posting || !discussionDraft.trim()}
                              className="h-12 w-12 shrink-0 flex items-center justify-center bg-[#534AB7] text-white rounded-2xl transition-all shadow-xl shadow-[#534AB7]/40 hover:bg-[#6056CD] hover:scale-105 active:scale-95 disabled:opacity-20 disabled:scale-100 disabled:shadow-none"
                            >
                              {posting ? <CircleNotch size={20} weight="bold" className="animate-spin" /> : <PaperPlaneTilt size={20} weight="bold" />}
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                     <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-40">
                      <div className="h-32 w-32 flex items-center justify-center rounded-[40px] bg-white/5 ring-1 ring-white/10 mb-8 border border-white/[0.02] shadow-2xl">
                         <Users size={64} weight="bold" />
                      </div>
                      <h4 className="text-2xl font-black text-white italic mb-2 tracking-tighter">Connection Pending</h4>
                      <p className="text-sm font-bold text-white/40 max-w-[280px]">Select a discussion vector from the left console to establish real-time link.</p>
                    </div>
                  )}
                </div>
            </section>
          </div>
        ) : (
          /* Standard Feed View */
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
            <PostComposerRedesigned 
              user={{ name: "Student Profile", image: null }} 
              onPost={async (c, img, opts) => submitPost(c, img, opts)}
              forums={forumList}
            />
            
            <div className="grid gap-6">
              {posts.map((post) => (
                <PostCardRedesigned 
                  key={post.id} 
                  post={post} 
                  currentUserId={currentUserId} 
                  currentUserRole={currentUserRole}
                  currentUserUniversityId={currentUserUniversityId}
                />
              ))}
            </div>

            {!loading && posts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-40 text-center opacity-10">
                <ChatCircle size={80} weight="bold" className="mb-6" />
                <h4 className="text-3xl font-black tracking-tighter uppercase italic">No Signals Found</h4>
                <p className="text-sm font-bold mt-2">Broadcast the first transmission to initialize this sector.</p>
              </div>
            )}
            
            {loading && (
              <div className="space-y-10">
                <ForumPostListSkeleton count={3} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile Floating Action Button (FAB) */}
      <div className="md:hidden fixed bottom-24 right-6 z-50">
        <button
          onClick={() => {
            if (tab === "feed") setComposing(true);
            else discussionInputRef.current?.focus();
          }}
          className="h-14 w-14 rounded-full bg-primary text-white shadow-2xl shadow-primary/40 flex items-center justify-center active:scale-90 transition-all border-4 border-[#0F0E16]"
        >
          <PlusCircle size={28} weight="bold" />
        </button>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(83, 74, 183, 0.4);
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

