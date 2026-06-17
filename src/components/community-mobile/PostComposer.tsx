// src/components/community-mobile/PostComposer.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Bold,
  Italic,
  Code,
  Image as ImageIcon,
  Hash,
  BarChart2,
  EyeOff,
  Eye,
  Sparkles,
  Plus,
  Trash2,
  type LucideIcon,
} from "lucide-react";

import { BACKGROUND_STYLES } from "./types";
import { createPost, updatePost as updatePostApi, fetchPost } from "./api";
import { useCommunityStore } from "./store";

interface PostComposerProps {
  forumId: string;
  currentUserAvatarUrl?: string | null;
  currentUserName?: string;
}

interface DraftPoll {
  question: string;
  options: string[];
}

export default function PostComposer({
  forumId,
  currentUserAvatarUrl,
  currentUserName = "You",
}: PostComposerProps) {
  const isOpen = useCommunityStore((s) => s.isComposerOpen);
  const editingPostId = useCommunityStore((s) => s.composerInitialPostId);
  const closeComposer = useCommunityStore((s) => s.closeComposer);
  const prependPost = useCommunityStore((s) => s.prependPost);
  const updatePostInStore = useCommunityStore((s) => s.updatePost);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [content, setContent] = useState("");
  const [images, setImages] = useState<{ file: File; previewUrl: string }[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [backgroundStyle, setBackgroundStyle] = useState("none");
  const [showPollEditor, setShowPollEditor] = useState(false);
  const [poll, setPoll] = useState<DraftPoll>({ question: "", options: ["", ""] });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (editingPostId) {
      fetchPost(editingPostId).then((post) => {
        setContent(post.content);
        setIsAnonymous(post.isAnonymous);
        setBackgroundStyle(post.backgroundStyle ?? "none");
        if (post.poll) {
          setPoll({
            question: post.poll.question,
            options: post.poll.options.map((o) => o.label),
          });
          setShowPollEditor(true);
        }
      });
    }
    textareaRef.current?.focus();
  }, [isOpen, editingPostId]);

  function resetState() {
    setContent("");
    setImages([]);
    setIsAnonymous(false);
    setBackgroundStyle("none");
    setShowPollEditor(false);
    setPoll({ question: "", options: ["", ""] });
    setError(null);
  }

  function handleClose() {
    resetState();
    closeComposer();
  }

  function wrapSelection(prefix: string, suffix: string = prefix) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { selectionStart, selectionEnd, value } = textarea;
    const selected = value.slice(selectionStart, selectionEnd);
    const newValue =
      value.slice(0, selectionStart) + prefix + selected + suffix + value.slice(selectionEnd);
    setContent(newValue);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(selectionStart + prefix.length, selectionEnd + prefix.length);
    });
  }

  function insertHashtagPrompt() {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { selectionStart, value } = textarea;
    const needsSpace = selectionStart > 0 && value[selectionStart - 1] !== " " && value[selectionStart - 1] !== "\n";
    const insertion = `${needsSpace ? " " : ""}#`;
    const newValue = value.slice(0, selectionStart) + insertion + value.slice(selectionStart);
    setContent(newValue);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(selectionStart + insertion.length, selectionStart + insertion.length);
    });
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const next = files.map((file) => ({ file, previewUrl: URL.createObjectURL(file) }));
    setImages((prev) => [...prev, ...next].slice(0, 6));
    e.target.value = "";
  }

  function removeImage(index: number) {
    setImages((prev) => {
      const copy = [...prev];
      URL.revokeObjectURL(copy[index].previewUrl);
      copy.splice(index, 1);
      return copy;
    });
  }

  function updatePollOption(index: number, value: string) {
    setPoll((prev) => {
      const options = [...prev.options];
      options[index] = value;
      return { ...prev, options };
    });
  }

  function addPollOption() {
    setPoll((prev) => ({ ...prev, options: [...prev.options, ""] }));
  }

  function removePollOption(index: number) {
    setPoll((prev) => ({ ...prev, options: prev.options.filter((_, i) => i !== index) }));
  }

  async function handleAiEnhance() {
    if (!content.trim()) return;
    setIsEnhancing(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/ai/enhance-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("enhance failed");
      const data = await res.json();
      if (data?.content) setContent(data.content);
    } catch {
      setError("Couldn't enhance the post right now. Try again in a moment.");
    } finally {
      setIsEnhancing(false);
    }
  }

  async function uploadImages(): Promise<string[]> {
    if (images.length === 0) return [];
    const urls: string[] = [];
    for (const img of images) {
      const formData = new FormData();
      formData.append("file", img.file);
      formData.append("folder", "forum");
      const res = await fetch("/api/v1/upload/direct", { method: "POST", body: formData });
      if (!res.ok) throw new Error("upload failed");
      const data = await res.json();
      urls.push(data.url);
    }
    return urls;
  }

  async function handleSubmit() {
    if (!content.trim() && images.length === 0) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const uploadedUrls = await uploadImages();
      const validPollOptions = poll.options.map((o) => o.trim()).filter(Boolean);
      const payload: Record<string, unknown> = {
        content,
        isAnonymous,
        backgroundStyle: backgroundStyle === "none" ? null : backgroundStyle,
        attachments: uploadedUrls.map((url) => ({ type: "image", url })),
      };
      if (showPollEditor && poll.question.trim() && validPollOptions.length >= 2) {
        payload.poll = { question: poll.question.trim(), options: validPollOptions };
      }

      if (editingPostId) {
        const updated = await updatePostApi(editingPostId, payload);
        updatePostInStore(editingPostId, updated);
      } else {
        const created = await createPost(forumId, payload);
        prependPost(created);
      }
      handleClose();
    } catch {
      setError("Couldn't publish your post. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const canSubmit = (content.trim().length > 0 || images.length > 0) && !isSubmitting;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[70] bg-black/40"
            onClick={handleClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-[calc(62px+env(safe-area-inset-bottom,0px))] z-[71] flex max-h-[75vh] flex-col rounded-t-3xl bg-background shadow-2xl"
          >
            {/* Handle */}
            <div className="flex justify-center pt-2 pb-1">
              <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-full p-1.5 text-muted-foreground transition-colors active:bg-muted"
                aria-label="Close"
              >
                <X className="h-5 w-5" strokeWidth={1.5} />
              </button>
              <span className="text-sm font-semibold text-foreground">New Post</span>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-40"
              >
                {isSubmitting ? "Posting…" : editingPostId ? "Save" : "Post"}
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
              {/* Author row + textarea */}
              <div className="rounded-xl bg-muted/30 p-3">
                <div className="flex items-center gap-2.5">
                  <div className="relative h-7 w-7 overflow-hidden rounded-full bg-muted">
                    {!isAnonymous && currentUserAvatarUrl && (
                      <Image src={currentUserAvatarUrl} alt="" fill className="object-cover" />
                    )}
                    {isAnonymous && (
                      <div className="flex h-full w-full items-center justify-center">
                        <EyeOff className="h-3 w-3 text-muted-foreground" strokeWidth={1.5} />
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {isAnonymous ? "Anonymous" : currentUserName}
                  </span>
                </div>
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What's on your mind?"
                  rows={3}
                  className="mt-2 w-full resize-none border-0 bg-transparent text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
                />
              </div>

              {/* Image previews */}
              {images.length > 0 && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Images</label>
                  <div className="grid grid-cols-3 gap-2">
                    {images.map((img, index) => (
                      <div key={img.previewUrl} className="relative aspect-square overflow-hidden rounded-xl bg-muted">
                        <Image src={img.previewUrl} alt="" fill className="object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
                          aria-label="Remove image"
                        >
                          <X className="h-3 w-3" strokeWidth={2} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Poll editor */}
              {showPollEditor && (
                <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">Poll</span>
                    <button
                      type="button"
                      onClick={() => setShowPollEditor(false)}
                      className="text-xs text-muted-foreground/70 hover:text-muted-foreground"
                    >
                      Remove
                    </button>
                  </div>
                  <input
                    value={poll.question}
                    onChange={(e) => setPoll((prev) => ({ ...prev, question: e.target.value }))}
                    placeholder="Ask a question"
                    className="mt-2 w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm focus:outline-none"
                  />
                  <div className="mt-2 space-y-1.5">
                    {poll.options.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          value={option}
                          onChange={(e) => updatePollOption(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                          className="flex-1 rounded-lg border border-border/60 bg-background px-3 py-2 text-sm focus:outline-none"
                        />
                        {poll.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removePollOption(index)}
                            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
                            aria-label="Remove option"
                          >
                            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {poll.options.length < 4 && (
                    <button
                      type="button"
                      onClick={addPollOption}
                      className="mt-2 flex items-center gap-1 text-xs font-medium text-primary"
                    >
                      <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
                      Add option
                    </button>
                  )}
                </div>
              )}

              {/* Background style chips */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Background</label>
                <div className="flex items-center gap-2">
                  {BACKGROUND_STYLES.map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setBackgroundStyle(style.id)}
                      className={`h-7 w-7 rounded-full border transition-all duration-200 ${
                        backgroundStyle === style.id ? "ring-2 ring-primary ring-offset-1" : "border-border/60"
                      }`}
                      style={{ background: style.swatch === "transparent" ? undefined : style.swatch }}
                      aria-label={style.id}
                    >
                      {style.swatch === "transparent" && (
                        <span className="block h-full w-full rounded-full border border-dashed border-border" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>

            {/* Toolbar — styled like the site's bottom nav bar */}
            <div className="border-t border-border/60 bg-background/80 backdrop-blur-xl px-2 pb-2 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-0.5">
                  <ToolbarButton icon={Bold} label="Bold" onClick={() => wrapSelection("**")} />
                  <ToolbarButton icon={Italic} label="Italic" onClick={() => wrapSelection("*")} />
                  <ToolbarButton icon={Code} label="Code" onClick={() => wrapSelection("`")} />
                  <ToolbarButton
                    icon={ImageIcon}
                    label="Add image"
                    onClick={() => fileInputRef.current?.click()}
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={handleImageSelect}
                  />
                  <div className="mx-1 h-5 w-px bg-border/60" />
                  <ToolbarButton icon={Hash} label="Hashtag" onClick={insertHashtagPrompt} />
                  <ToolbarButton
                    icon={BarChart2}
                    label="Poll"
                    onClick={() => setShowPollEditor((v) => !v)}
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleAiEnhance}
                    disabled={isEnhancing || !content.trim()}
                    className="flex items-center gap-1 rounded-lg border border-border/60 bg-background/60 px-2 py-1.5 text-xs text-muted-foreground transition-colors active:bg-muted disabled:opacity-40"
                  >
                    <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} />
                    {isEnhancing ? "Enhancing…" : "AI enhance"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAnonymous((v) => !v)}
                    className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
                      isAnonymous ? "bg-foreground text-background" : "border border-border/60 bg-background/60 text-muted-foreground"
                    }`}
                  >
                    {isAnonymous ? <EyeOff className="h-3.5 w-3.5" strokeWidth={1.5} /> : <Eye className="h-3.5 w-3.5" strokeWidth={1.5} />}
                    {isAnonymous ? "Anonymous" : "Public"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function ToolbarButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="rounded-full p-2 text-muted-foreground transition-colors active:bg-muted"
    >
      <Icon className="h-4 w-4" strokeWidth={1.5} />
    </button>
  );
}
