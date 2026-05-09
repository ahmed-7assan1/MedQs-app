"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Image as ImageIcon,
  PaperPlaneTilt,
  CircleNotch,
  X,
  Microphone,
  DownloadSimple,
  Video,
  Smiley,
  Textbox,
  Globe,
  Hash
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { VoiceRecorder } from "./VoiceRecorder";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  user: {
    name: string;
    image?: string | null;
    id?: string;
  };
  onPost: (
    content: string,
    imageUrl: string,
    options?: {
      isForumPost?: boolean;
      isChatMessage?: boolean;
      forumId?: string;
      attachments?: any[];
    }
  ) => Promise<boolean>;
  forums?: { id: string; name: string }[];
  placeholder?: string;
  compact?: boolean;
}

export function PostComposerRedesigned({ user, onPost, forums, placeholder, compact }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecordingMode, setIsRecordingMode] = useState(false);
  const [selectedForumId, setSelectedForumId] = useState<string>(forums?.[0]?.id || "");

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  const avatarUrl =
    user.image ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name || "user")}`;

  const hasContent = content.trim().length > 0 || attachments.length > 0;

  const handlePost = async () => {
    if (!hasContent) return;
    setIsPosting(true);
    const firstImage = attachments.find((a) => a.type === "image")?.url || "";
    const ok = await onPost(content, firstImage, {
      isForumPost: true,
      isChatMessage: false,
      forumId: selectedForumId || undefined,
      attachments,
    });
    if (ok) {
      setContent("");
      setAttachments([]);
      setIsExpanded(false);
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    }
    setIsPosting(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handlePost();
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 180) + "px";
  };

  const uploadToTelegram = async (file: File | Blob, name?: string) => {
    const fd = new FormData();
    const fileName = name || (file instanceof File ? file.name : `file_${Date.now()}`);
    fd.append("file", file, fileName);
    const res = await fetch("/api/v1/debug/telegram-direct-upload", {
      method: "POST",
      body: fd,
    });
    const data = await res.json();
    if (!data.success) throw new Error("Upload failed");
    let type: "image" | "audio" | "file" = "file";
    if ((file as File).type?.startsWith("image/")) type = "image";
    else if ((file as File).type?.startsWith("audio/")) type = "audio";
    return {
      url: `/api/v1/files/telegram/preview?fileId=${data.fileId}&type=${type}`,
      type,
      fileId: data.fileId,
    };
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (attachments.length + files.length > 10) {
      toast.error("Max 10 attachments");
      return;
    }
    setIsUploading(true);
    try {
      const results = await Promise.all(files.map((f) => uploadToTelegram(f)));
      setAttachments((prev) => [...prev, ...results]);
    } catch {
      toast.error("Upload failed. Try again.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleVoiceStop = async (blob: Blob) => {
    setIsRecordingMode(false);
    setIsUploading(true);
    try {
      const att = await uploadToTelegram(blob, `voice_${Date.now()}.webm`);
      setAttachments((prev) => [...prev, att]);
    } catch {
      toast.error("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const removeAttachment = (i: number) =>
    setAttachments((prev) => prev.filter((_, idx) => idx !== i));

  const images = attachments.filter((a) => a.type === "image");
  const others = attachments.filter((a) => a.type !== "image");

  return (
    <div
      className={cn(
        "rounded-[24px] bg-[#18172A]/80 border border-white/[0.06] backdrop-blur-2xl transition-all duration-300 overflow-hidden",
        isExpanded ? "shadow-2xl shadow-black/40 border-white/[0.1]" : "shadow-lg"
      )}
    >
      {/* ── Collapsed pill ── */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full flex items-center gap-3 p-4"
        >
          <img
            src={avatarUrl}
            alt=""
            className="h-10 w-10 rounded-2xl object-cover border border-white/10 flex-shrink-0"
          />
          <span className="flex-1 text-left text-[15px] text-white/20 font-medium">
            {placeholder || "What's on your mind?"}
          </span>
          <div className="flex items-center gap-2 opacity-40">
            <ImageIcon size={20} />
            <Microphone size={20} />
          </div>
        </button>
      )}

      {/* ── Expanded state ── */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center gap-3 p-4 pb-3 border-b border-white/[0.05]">
              <img
                src={avatarUrl}
                alt=""
                className="h-10 w-10 rounded-2xl object-cover border border-white/10 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-black text-white">{user.name}</p>
                {forums && forums.length > 1 && (
                  <select
                    value={selectedForumId}
                    onChange={(e) => setSelectedForumId(e.target.value)}
                    className="mt-0.5 text-[10px] font-black uppercase tracking-widest text-[#AFA9EC] bg-transparent border-none focus:outline-none cursor-pointer"
                  >
                    {forums.map((f) => (
                      <option key={f.id} value={f.id} className="bg-[#18172A] text-white">
                        {f.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <button
                onClick={() => {
                  setIsExpanded(false);
                  setContent("");
                  setAttachments([]);
                }}
                className="h-8 w-8 flex items-center justify-center rounded-full bg-white/5 text-white/30 hover:bg-white/10 transition-all"
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            {/* Recording Mode */}
            {isRecordingMode ? (
              <div className="p-4">
                <VoiceRecorder
                  onStop={handleVoiceStop}
                  onCancel={() => setIsRecordingMode(false)}
                />
              </div>
            ) : (
              <>
                {/* Textarea */}
                <div className="px-4 pt-3 pb-2">
                  <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={handleTextChange}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    placeholder="What's on your mind?"
                    rows={3}
                    className="w-full bg-transparent border-none p-0 text-[16px] text-white placeholder:text-white/15 resize-none focus:outline-none font-medium leading-relaxed min-h-[80px] max-h-[180px] overflow-y-auto"
                  />
                </div>

                {/* Image Grid Preview */}
                {images.length > 0 && (
                  <div
                    className={cn(
                      "mx-4 mb-3 grid gap-1.5 rounded-2xl overflow-hidden",
                      images.length === 1 ? "grid-cols-1" : images.length === 2 ? "grid-cols-2" : images.length >= 3 ? "grid-cols-3" : ""
                    )}
                  >
                    {images.slice(0, 5).map((img, i) => (
                      <div key={i} className="relative group aspect-square">
                        <img
                          src={img.url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        {i === 4 && images.length > 5 && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <span className="text-2xl font-black text-white">+{images.length - 5}</span>
                          </div>
                        )}
                        <button
                          onClick={() => {
                            const idx = attachments.findIndex((a) => a.url === img.url);
                            if (idx !== -1) removeAttachment(idx);
                          }}
                          className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <X size={12} weight="bold" className="text-white" />
                        </button>
                      </div>
                    ))}
                    {/* Add More */}
                    {images.length < 10 && (
                      <label className="aspect-square flex items-center justify-center bg-white/[0.03] border border-dashed border-white/10 rounded-xl cursor-pointer hover:bg-white/[0.06] transition-all group">
                        <div className="flex flex-col items-center gap-1 text-white/20 group-hover:text-white/40 transition-colors">
                          <span className="text-2xl font-thin">+</span>
                          <span className="text-[9px] font-black uppercase tracking-widest">Add More</span>
                        </div>
                        <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileInput} />
                      </label>
                    )}
                  </div>
                )}

                {/* Non-image attachments */}
                {others.length > 0 && (
                  <div className="mx-4 mb-3 flex flex-wrap gap-2">
                    {others.map((att, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-2 group"
                      >
                        {att.type === "audio" ? (
                          <Microphone size={16} weight="fill" className="text-[#AFA9EC]" />
                        ) : (
                          <DownloadSimple size={16} weight="bold" className="text-[#AFA9EC]" />
                        )}
                        <span className="text-[11px] font-black text-white/50 uppercase tracking-widest">
                          {att.type === "audio" ? "Voice Note" : "File"}
                        </span>
                        <button
                          onClick={() => {
                            const idx = attachments.findIndex((a) => a.url === att.url);
                            if (idx !== -1) removeAttachment(idx);
                          }}
                          className="text-white/20 hover:text-red-400 transition-colors ml-1"
                        >
                          <X size={12} weight="bold" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Toolbar */}
            <div className="flex items-center gap-2 px-4 py-3 border-t border-white/[0.05]">
              {/* Left: action icons */}
              <div className="flex items-center gap-0.5 flex-1">
                <label
                  className={cn(
                    "h-9 w-9 flex items-center justify-center rounded-xl transition-all cursor-pointer",
                    "text-white/30 hover:text-[#AFA9EC] hover:bg-[#534AB7]/10"
                  )}
                  title="Add Photo"
                >
                  <ImageIcon size={20} weight="bold" />
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileInput}
                    disabled={isUploading}
                  />
                </label>

                <label
                  className="h-9 w-9 flex items-center justify-center rounded-xl text-white/30 hover:text-[#AFA9EC] hover:bg-[#534AB7]/10 transition-all cursor-pointer"
                  title="Add File"
                >
                  <Textbox size={20} weight="bold" />
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileInput}
                    disabled={isUploading}
                  />
                </label>

                <button
                  onClick={() => setIsRecordingMode(!isRecordingMode)}
                  disabled={isUploading}
                  className={cn(
                    "h-9 w-9 flex items-center justify-center rounded-xl transition-all",
                    isRecordingMode
                      ? "bg-red-500/10 text-red-400"
                      : "text-white/30 hover:text-[#AFA9EC] hover:bg-[#534AB7]/10"
                  )}
                  title="Voice Note"
                >
                  <Microphone size={20} weight={isRecordingMode ? "fill" : "bold"} />
                </button>

                {isUploading && (
                  <div className="flex items-center gap-1.5 ml-2">
                    <CircleNotch size={14} className="animate-spin text-[#AFA9EC]" />
                    <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">
                      Uploading...
                    </span>
                  </div>
                )}
              </div>

              {/* Char count */}
              {content.length > 3000 && (
                <span
                  className={cn(
                    "text-[10px] font-black",
                    content.length > 4800 ? "text-red-400" : "text-white/20"
                  )}
                >
                  {5000 - content.length}
                </span>
              )}

              {/* Post Button */}
              <button
                onClick={handlePost}
                disabled={isPosting || !hasContent}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[13px] font-black uppercase tracking-widest transition-all",
                  hasContent
                    ? "bg-[#534AB7] text-white shadow-lg shadow-[#534AB7]/40 hover:bg-[#6056CD] hover:scale-[1.02] active:scale-[0.98]"
                    : "bg-white/[0.04] text-white/20 border border-white/[0.04] cursor-not-allowed"
                )}
              >
                {isPosting ? (
                  <CircleNotch size={16} className="animate-spin" />
                ) : (
                  <PaperPlaneTilt size={16} weight="fill" />
                )}
                Post
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
