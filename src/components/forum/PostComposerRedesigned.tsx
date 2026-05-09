"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Image as ImageIcon, 
  PaperPlaneTilt, 
  CircleNotch, 
  X, 
  Microphone,
  VideoCamera,
  CalendarBlank,
  TextAlignLeft,
  Plus
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
}

export function PostComposerRedesigned({ user, onPost, forums, placeholder }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecordingMode, setIsRecordingMode] = useState(false);
  const [selectedForumId, setSelectedForumId] = useState<string>(forums?.[0]?.id || "");

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const avatarUrl = user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name || "user")}`;

  const hasContent = content.trim().length > 0 || attachments.length > 0;

  const handlePost = async () => {
    if (!hasContent) return;
    setIsPosting(true);
    const firstImage = attachments.find((a) => a.type === "image")?.url || "";
    const ok = await onPost(content, firstImage, {
      isForumPost: true,
      forumId: selectedForumId || undefined,
      attachments,
    });
    if (ok) {
      setContent("");
      setAttachments([]);
      setIsExpanded(false);
    }
    setIsPosting(false);
  };

  const uploadToTelegram = async (file: File | Blob, name?: string) => {
    const fd = new FormData();
    fd.append("file", file, name || (file instanceof File ? file.name : "file"));
    const res = await fetch("/api/v1/debug/telegram-direct-upload", { method: "POST", body: fd });
    const data = await res.json();
    if (!data.success) throw new Error("Upload failed");
    let type: "image" | "audio" | "file" = "file";
    if (file.type?.startsWith("image/")) type = "image";
    else if (file.type?.startsWith("audio/")) type = "audio";
    return {
      url: `/api/v1/files/telegram/preview?fileId=${data.fileId}&type=${type}`,
      type,
      fileId: data.fileId,
    };
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setIsUploading(true);
    try {
      const results = await Promise.all(files.map(f => uploadToTelegram(f)));
      setAttachments(prev => [...prev, ...results]);
    } catch {
      toast.error("Upload failed");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const images = attachments.filter(a => a.type === "image");
  const others = attachments.filter(a => a.type !== "image");

  return (
    <div className={cn(
      "relative rounded-[28px] bg-[#1C1B22]/60 backdrop-blur-[30px] border border-white/[0.08] shadow-2xl transition-all duration-500 overflow-hidden",
      isExpanded ? "ring-1 ring-white/10" : ""
    )}>
      {/* Mesh Glow Internal */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 blur-[60px] pointer-events-none" />

      <div className="relative p-5">
        <div className="flex gap-4">
          <img src={avatarUrl} className="h-10 w-10 rounded-full border border-white/10 shrink-0" alt="" />
          <div className="flex-1 min-w-0 pt-2">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = e.target.scrollHeight + "px";
              }}
              onFocus={() => setIsExpanded(true)}
              placeholder={placeholder || `What's on your mind, ${user.name.split(" ")[0]}?`}
              className="w-full bg-transparent border-none p-0 text-[16px] text-white/90 placeholder:text-white/20 resize-none focus:ring-0 font-medium leading-snug"
              style={{ minHeight: "44px" }}
            />
          </div>
        </div>

        <AnimatePresence>
          {(isExpanded || attachments.length > 0) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              {/* Media Grid */}
              {(images.length > 0 || isUploading) && (
                <div className="flex flex-wrap gap-3 mt-5 px-1">
                  {images.map((img, i) => (
                    <div key={i} className="relative group h-24 w-24 sm:h-28 sm:w-28 rounded-2xl overflow-hidden border border-white/10">
                      <img src={img.url} className="h-full w-full object-cover" alt="" />
                      <button 
                        onClick={() => setAttachments(prev => prev.filter(a => a.url !== img.url))}
                        className="absolute top-1 right-1 h-6 w-6 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <X size={12} weight="bold" className="text-white" />
                      </button>
                    </div>
                  ))}
                  
                  {isUploading && (
                    <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl bg-white/5 border border-dashed border-white/10 flex items-center justify-center">
                      <CircleNotch size={24} className="animate-spin text-white/20" />
                    </div>
                  )}

                  <label className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl bg-white/5 border border-dashed border-white/10 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-white/10 transition-all group">
                    <Plus size={20} className="text-white/20 group-hover:text-white/40" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/15 group-hover:text-white/30">Add More</span>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileInput} />
                  </label>
                </div>
              )}

              {/* Bottom Action Bar */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/[0.05]">
                <div className="flex items-center gap-1">
                  <button className="h-10 w-10 flex items-center justify-center text-white/30 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                    <TextAlignLeft size={20} weight="bold" />
                  </button>
                  <label className="h-10 px-3 flex items-center gap-2 text-white/30 hover:text-white hover:bg-white/5 rounded-xl transition-all cursor-pointer">
                    <ImageIcon size={20} weight="fill" />
                    <span className="text-[11px] font-black uppercase tracking-widest">Gallery</span>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileInput} />
                  </label>
                  <button className="h-10 w-10 flex items-center justify-center text-white/30 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                    <VideoCamera size={20} weight="bold" />
                  </button>
                  <button className="h-10 w-10 flex items-center justify-center text-white/30 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                    <CalendarBlank size={20} weight="bold" />
                  </button>
                  <button 
                    onClick={() => setIsRecordingMode(!isRecordingMode)}
                    className={cn("h-10 w-10 flex items-center justify-center rounded-xl transition-all", isRecordingMode ? "text-primary bg-primary/10" : "text-white/30 hover:text-white hover:bg-white/5")}
                  >
                    <Microphone size={20} weight="bold" />
                  </button>
                </div>

                <button
                  onClick={handlePost}
                  disabled={!hasContent || isPosting}
                  className={cn(
                    "px-8 py-2.5 rounded-2xl text-[13px] font-black uppercase tracking-widest transition-all shadow-xl",
                    hasContent 
                      ? "bg-[#1D74FF] text-white shadow-[#1D74FF]/30 hover:bg-[#3483FF] hover:scale-105 active:scale-95" 
                      : "bg-white/5 text-white/10 cursor-not-allowed"
                  )}
                >
                  {isPosting ? <CircleNotch size={18} className="animate-spin" /> : "Post"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isRecordingMode && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="mt-4">
              <VoiceRecorder 
                onStop={async (blob) => {
                  const att = await uploadToTelegram(blob, `voice_${Date.now()}.webm`);
                  setAttachments(prev => [...prev, att]);
                  setIsRecordingMode(false);
                }}
                onCancel={() => setIsRecordingMode(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
