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
  Plus,
  ChartBar,
  Trash,
  Check,
  Ghost,
  Palette
} from "@phosphor-icons/react";
import { useCommunityShareStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { VoiceRecorder } from "./VoiceRecorder";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { SharedQuestionBlock } from "../quiz/SharedQuestionBlock";

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
      sharedQuestion?: any;
      poll?: any;
      postType?: string;
      qaAnswer?: string;
      attachments?: any[];
      isAnonymous?: boolean;
      backgroundStyle?: string;
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
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState<string | null>(null);
  const [isRecordingMode, setIsRecordingMode] = useState(false);
  const [selectedForumId, setSelectedForumId] = useState<string>(forums?.[0]?.id || "");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [backgroundStyle, setBackgroundStyle] = useState<string>("");
  const [showBackgroundPicker, setShowBackgroundPicker] = useState(false);
  const [customBgs, setCustomBgs] = useState<string[]>([]);
  const bgUploadRef = useRef<HTMLInputElement>(null);

  const isClassName = (style: string) => {
    if (!style) return true;
    return !style.startsWith("data:") && !style.startsWith("http") && !style.startsWith("url(");
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("medqs_custom_bgs");
      if (saved) {
        try {
          setCustomBgs(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const toastId = toast.loading("Processing background image...");
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxW = 800;
        const maxH = 600;
        let w = img.width;
        let h = img.height;
        if (w > maxW || h > maxH) {
          const ratio = Math.min(maxW / w, maxH / h);
          w = w * ratio;
          h = h * ratio;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          canvas.toBlob(async (blob) => {
            if (!blob) {
              toast.error("Failed to process background", { id: toastId });
              return;
            }
            try {
              toast.loading("Uploading background to Telegram...", { id: toastId });
              const uploaded = await uploadToTelegram(blob, "background.jpg");
              const bgUrl = uploaded.url;

              const updated = [...customBgs, bgUrl];
              setCustomBgs(updated);
              localStorage.setItem("medqs_custom_bgs", JSON.stringify(updated));
              setBackgroundStyle(bgUrl);
              toast.success("Background uploaded to Telegram!", { id: toastId });
            } catch {
              toast.error("Upload to Telegram failed", { id: toastId });
            }
          }, "image/jpeg", 0.65);
        } else {
          toast.error("Failed to process background", { id: toastId });
        }
      };
      img.onerror = () => toast.error("Failed to load image", { id: toastId });
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };
  const [pollOptions, setPollOptions] = useState<{ text: string }[]>([]);
  const [isPollMode, setIsPollMode] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [isQaMode, setIsQaMode] = useState(false);
  const [qaQuestion, setQaQuestion] = useState("");
  const [qaOptions, setQaOptions] = useState<{ text: string }[]>([{ text: "" }, { text: "" }, { text: "" }, { text: "" }]);
  const [qaCorrectIdx, setQaCorrectIdx] = useState<number | null>(null);

  const [mentionSearch, setMentionSearch] = useState<string | null>(null);
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [selectedSuggestIdx, setSelectedSuggestIdx] = useState(0);

  const sharedQuestion = useCommunityShareStore((s) => s.sharedQuestion);
  const setSharedQuestion = useCommunityShareStore((s) => s.setSharedQuestion);

  useEffect(() => {
    if (sharedQuestion) {
      setIsExpanded(true);
      if (!content) {
        setContent("Can anyone help me understand this question better?");
      }
    }
  }, [sharedQuestion]);

  useEffect(() => {
    if (mentionSearch === null) {
      setSuggestedUsers([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/v1/users/search?q=${mentionSearch}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestedUsers(data);
          setSelectedSuggestIdx(0);
        }
      } catch {}
    }, 200);
    return () => clearTimeout(timer);
  }, [mentionSearch]);

  const checkMentions = (val: string, selectionStart: number) => {
    const textBeforeCursor = val.substring(0, selectionStart);
    const lastAtIdx = textBeforeCursor.lastIndexOf("@");
    if (lastAtIdx !== -1) {
      const query = textBeforeCursor.substring(lastAtIdx + 1);
      if (!query.includes(" ") && query.length >= 0) {
        setMentionSearch(query);
        return;
      }
    }
    setMentionSearch(null);
  };

  const insertMention = (user: any) => {
    const val = content;
    const selectionStart = textareaRef.current?.selectionStart || 0;
    const textBeforeCursor = val.substring(0, selectionStart);
    const lastAtIdx = textBeforeCursor.lastIndexOf("@");
    if (lastAtIdx === -1) return;

    const userHandle = user.nickname || user.name.replace(/\s+/g, "_");
    const replacement = `@${userHandle} `;
    
    const newVal = val.substring(0, lastAtIdx) + replacement + val.substring(selectionStart);
    setContent(newVal);
    setMentionSearch(null);
    setSuggestedUsers([]);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const cursorPosition = lastAtIdx + replacement.length;
        textareaRef.current.setSelectionRange(cursorPosition, cursorPosition);
      }
    }, 10);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (suggestedUsers.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedSuggestIdx(prev => (prev + 1) % suggestedUsers.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedSuggestIdx(prev => (prev - 1 + suggestedUsers.length) % suggestedUsers.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(suggestedUsers[selectedSuggestIdx]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setMentionSearch(null);
        setSuggestedUsers([]);
        return;
      }
    }
  };

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const avatarUrl = user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name || "user")}`;

  const hasContent = content.trim().length > 0 || attachments.length > 0 || isPollMode || isQaMode;

  const handlePost = async () => {
    if (!hasContent) return;
    setIsPosting(true);
    const firstImage = attachments.find((a) => a.type === "image")?.url || "";
    
    // Build poll data
    const pollData = isPollMode && pollQuestion && pollOptions.filter(o => o.text.trim()).length > 1
      ? { question: pollQuestion, options: pollOptions.filter(o => o.text.trim()).map(o => o.text) }
      : undefined;
    
    // Build Q&A data  
    const qaData = isQaMode && qaQuestion && qaOptions.filter(o => o.text.trim()).length >= 2
      ? { question: qaQuestion, options: qaOptions.filter(o => o.text.trim()).map(o => o.text) }
      : undefined;
    const qaAnswer = isQaMode && qaCorrectIdx !== null ? qaOptions[qaCorrectIdx]?.text : undefined;

    const ok = await onPost(content, firstImage, {
      isForumPost: true,
      forumId: selectedForumId || undefined,
      attachments,
      sharedQuestion,
      postType: isQaMode ? 'qa' : isPollMode ? 'poll' : 'post',
      poll: pollData || qaData,
      qaAnswer,
      isAnonymous,
      backgroundStyle,
    });
    if (ok) {
      setContent("");
      setAttachments([]);
      setIsExpanded(false);
      setSharedQuestion(null);
      setIsPollMode(false);
      setIsQaMode(false);
      setPollOptions([]);
      setPollQuestion("");
      setQaQuestion("");
      setQaOptions([{ text: "" }, { text: "" }, { text: "" }, { text: "" }]);
      setQaCorrectIdx(null);
      setIsAnonymous(false);
      setBackgroundStyle("");
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

  const handleVideoInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024 * 1024) {
      toast.error("Video must be under 2GB");
      return;
    }
    setIsUploadingVideo(true);
    setVideoUploadProgress("Uploading to Telegram...");
    setIsExpanded(true);
    try {
      const fd = new FormData();
      fd.append("file", file, file.name);
      const res = await fetch("/api/v1/debug/telegram-direct-upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!data.success) throw new Error("Upload failed");
      setAttachments(prev => [...prev, {
        url: `/api/v1/telegram/video/${data.chatId}/${data.messageId}?fileId=${data.fileId}`,
        type: "video",
        fileId: data.fileId,
        chatId: data.chatId,
        messageId: data.messageId,
        name: file.name,
      }]);
      toast.success("Video uploaded to Telegram!");
    } catch {
      toast.error("Video upload failed");
    } finally {
      setIsUploadingVideo(false);
      setVideoUploadProgress(null);
      e.target.value = "";
    }
  };

  const videos = attachments.filter(a => a.type === "video");
  const images = attachments.filter(a => a.type === "image");
  const others = attachments.filter(a => a.type !== "image" && a.type !== "video");

  return (
    <div className={cn(
      "relative rounded-[28px] bg-[#1C1B22]/60 backdrop-blur-[30px] border border-white/[0.08] shadow-2xl transition-all duration-500 overflow-hidden",
      isExpanded ? "ring-1 ring-white/10" : ""
    )}>
      {/* Mesh Glow Internal */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 blur-[60px] pointer-events-none" />

      <div className="relative p-5">
        <div className="flex gap-4">
          <div className="relative">
            <img src={isAnonymous ? `https://api.dicebear.com/7.x/avataaars/svg?seed=anonymous` : avatarUrl} className="h-10 w-10 rounded-full border border-white/10 shrink-0" alt="" />
            {isAnonymous && (
              <div className="absolute -bottom-1 -right-1 bg-purple-500 text-white rounded-full p-0.5 border border-black">
                <Ghost size={8} weight="fill" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 pt-2 relative">
            <div 
              className={cn(
                "relative rounded-2xl transition-all duration-300 overflow-hidden",
                backgroundStyle ? "shadow-lg border border-white/10 min-h-[180px] flex items-center justify-center p-6" : "",
                backgroundStyle && (isClassName(backgroundStyle) ? backgroundStyle : "bg-cover bg-center")
              )}
              style={backgroundStyle && !isClassName(backgroundStyle) ? { backgroundImage: `url("${backgroundStyle}")` } : undefined}
            >
              {/* Tint Overlay for Images to ensure readable text */}
              {backgroundStyle && (!isClassName(backgroundStyle) || backgroundStyle.includes("url")) && (
                <div className="absolute inset-0 bg-black/45 z-0" />
              )}
              
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => {
                  const val = e.target.value;
                  setContent(val);
                  checkMentions(val, e.target.selectionStart);
                  e.target.style.height = "auto";
                  e.target.style.height = e.target.scrollHeight + "px";
                }}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsExpanded(true)}
                placeholder={placeholder || (isAnonymous ? "Post anonymously..." : `What's on your mind, ${user.name.split(" ")[0]}?`)}
                className={cn(
                  "w-full bg-transparent border-none p-0 focus:ring-0 resize-none z-10",
                  backgroundStyle 
                    ? "text-white placeholder:text-white/60 text-xl font-extrabold text-center leading-normal" 
                    : "text-white/90 placeholder:text-white/20 text-[16px] font-medium leading-snug"
                )}
                style={{ minHeight: backgroundStyle ? "100px" : "44px" }}
              />
            </div>

            {suggestedUsers.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-[#19182C] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-48 overflow-y-auto">
                {suggestedUsers.map((user, idx) => (
                  <button
                    key={user.id}
                    onClick={() => insertMention(user)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2 text-right transition-colors hover:bg-white/5",
                      idx === selectedSuggestIdx ? "bg-primary/20" : ""
                    )}
                  >
                    <img
                      src={user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`}
                      className="h-6 w-6 rounded-full border border-white/10"
                      alt=""
                    />
                    <div className="flex flex-col text-right">
                      <span className="text-xs font-black text-white">{user.name}</span>
                      {user.nickname && <span className="text-[10px] text-white/40">@{user.nickname}</span>}
                    </div>
                  </button>
                ))}
              </div>
            )}
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
              {/* Shared Question Preview */}
              {sharedQuestion && (
                <div className="mx-5 mb-4 relative group">
                  <button 
                    onClick={() => setSharedQuestion(null)}
                    className="absolute -top-2 -right-2 z-10 p-1.5 bg-red-500 rounded-full shadow-lg text-white hover:bg-red-600 transition-all"
                  >
                    <X size={14} weight="bold" />
                  </button>
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 ml-1">Attached Question</p>
                  <SharedQuestionBlock question={sharedQuestion as any} className="bg-indigo-500/5 border-indigo-500/20" />
                </div>
              )}

              {/* Q&A Creation UI */}
              {isQaMode && (
                <div className="mx-5 mb-4 p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Create Q&A Question</p>
                    <button onClick={() => setIsQaMode(false)} className="text-white/40 hover:text-white">
                      <X size={14} weight="bold" />
                    </button>
                  </div>
                  <input
                    value={qaQuestion}
                    onChange={(e) => setQaQuestion(e.target.value)}
                    placeholder="Write the question..."
                    className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-400/50 mb-3"
                  />
                  <p className="text-[10px] text-white/30 font-bold mb-2">Answer choices — click ✓ to mark correct answer:</p>
                  <div className="space-y-2">
                    {qaOptions.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <button
                          onClick={() => setQaCorrectIdx(qaCorrectIdx === idx ? null : idx)}
                          className={cn("h-7 w-7 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all",
                            qaCorrectIdx === idx ? "bg-emerald-500 border-emerald-500 text-white" : "border-white/20 text-white/20 hover:border-emerald-400"
                          )}
                        >
                          {qaCorrectIdx === idx ? <Check size={14} weight="bold" /> : <span className="text-[10px] font-black">{idx + 1}</span>}
                        </button>
                        <input
                          value={opt.text}
                          onChange={(e) => {
                            const n = [...qaOptions];
                            n[idx].text = e.target.value;
                            setQaOptions(n);
                          }}
                          placeholder={`Choice ${idx + 1}${qaCorrectIdx === idx ? ' ✓ Correct' : ''}`}
                          className={cn("flex-1 bg-black/20 border rounded-xl p-2.5 text-sm text-white focus:outline-none transition-all",
                            qaCorrectIdx === idx ? "border-emerald-500/40 focus:border-emerald-500" : "border-white/10 focus:border-primary/50"
                          )}
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-white/20 mt-3">Students will see the question and choices but not the correct answer until they answer.</p>
                </div>
              )}

              {/* Poll Creation UI */}
              {isPollMode && (
                <div className="mx-5 mb-4 p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Create Poll</p>
                    <button onClick={() => setIsPollMode(false)} className="text-white/40 hover:text-white">
                      <X size={14} weight="bold" />
                    </button>
                  </div>
                  <input
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                    placeholder="Ask a question..."
                    className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-primary/50 mb-3"
                  />
                  <div className="space-y-2">
                    {pollOptions.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          value={opt.text}
                          onChange={(e) => {
                            const newOpts = [...pollOptions];
                            newOpts[idx].text = e.target.value;
                            setPollOptions(newOpts);
                          }}
                          placeholder={`Option ${idx + 1}`}
                          className="flex-1 bg-black/20 border border-white/10 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-primary/50"
                        />
                        {pollOptions.length > 2 && (
                          <button onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))} className="p-2 text-red-400 hover:bg-red-400/10 rounded-xl">
                            <Trash size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {pollOptions.length < 5 && (
                    <button 
                      onClick={() => setPollOptions([...pollOptions, { text: "" }])}
                      className="mt-3 text-[11px] font-black uppercase text-emerald-400 flex items-center gap-1 hover:text-emerald-300"
                    >
                      <Plus size={12} weight="bold" /> Add Option
                    </button>
                  )}
                </div>
              )}

              {/* Video Preview */}
              {(videos.length > 0 || isUploadingVideo) && (
                <div className="mt-5 space-y-2">
                  {videos.map((v, i) => (
                    <div key={i} className="relative group rounded-2xl overflow-hidden border border-indigo-500/30 bg-black">
                      <video
                        src={v.url}
                        controls
                        className="w-full max-h-64 object-contain"
                        preload="metadata"
                      />
                      <div className="absolute top-2 left-2 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1">
                        <VideoCamera size={12} className="text-indigo-400" />
                        <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Telegram</span>
                      </div>
                      <button
                        onClick={() => setAttachments(prev => prev.filter(a => a.url !== v.url))}
                        className="absolute top-2 right-2 h-7 w-7 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <X size={12} weight="bold" className="text-white" />
                      </button>
                    </div>
                  ))}
                  {isUploadingVideo && (
                    <div className="flex items-center gap-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 px-5 py-4">
                      <CircleNotch size={20} className="animate-spin text-indigo-400 shrink-0" />
                      <div>
                        <p className="text-[12px] font-black text-indigo-300">{videoUploadProgress || "Uploading..."}</p>
                        <p className="text-[10px] text-indigo-400/60">Storing securely on Telegram</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

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
                  <label className={cn("h-10 px-3 flex items-center gap-2 rounded-xl transition-all cursor-pointer", videos.length > 0 || isUploadingVideo ? "text-indigo-400 bg-indigo-400/10" : "text-white/30 hover:text-white hover:bg-white/5")}>
                    <VideoCamera size={20} weight="bold" />
                    <span className="text-[11px] font-black uppercase tracking-widest">Video</span>
                    <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoInput} />
                  </label>
                  <button 
                    onClick={() => {
                      setIsPollMode(true);
                      setIsQaMode(false);
                      if (pollOptions.length === 0) setPollOptions([{text:""}, {text:""}]);
                    }}
                    className={cn("h-10 w-10 flex items-center justify-center rounded-xl transition-all", isPollMode ? "text-emerald-400 bg-emerald-400/10" : "text-white/30 hover:text-white hover:bg-white/5")}
                  >
                    <ChartBar size={20} weight="bold" />
                  </button>
                  <button 
                    onClick={() => {
                      setIsQaMode(true);
                      setIsPollMode(false);
                    }}
                    title="Create Q&A Question"
                    className={cn("h-10 px-2 flex items-center gap-1 rounded-xl transition-all text-[11px] font-black", isQaMode ? "text-amber-400 bg-amber-400/10" : "text-white/30 hover:text-white hover:bg-white/5")}
                  >
                    <span>Q&A</span>
                  </button>
                  <button 
                    onClick={() => setIsRecordingMode(!isRecordingMode)}
                    className={cn("h-10 w-10 flex items-center justify-center rounded-xl transition-all", isRecordingMode ? "text-primary bg-primary/10" : "text-white/30 hover:text-white hover:bg-white/5")}
                  >
                    <Microphone size={20} weight="bold" />
                  </button>
                  <button 
                    onClick={() => setIsAnonymous(!isAnonymous)}
                    title="Post Anonymously"
                    className={cn("h-10 w-10 flex items-center justify-center rounded-xl transition-all", isAnonymous ? "text-purple-400 bg-purple-400/10" : "text-white/30 hover:text-white hover:bg-white/5")}
                  >
                    <Ghost size={20} weight={isAnonymous ? "fill" : "bold"} />
                  </button>
                  <div className="relative">
                    <button 
                      onClick={() => setShowBackgroundPicker(!showBackgroundPicker)}
                      type="button"
                      title="Background Style"
                      className={cn("h-10 w-10 flex items-center justify-center rounded-xl transition-all", backgroundStyle ? "text-pink-400 bg-pink-400/10" : "text-white/30 hover:text-white hover:bg-white/5")}
                    >
                      <Palette size={20} weight={backgroundStyle ? "fill" : "bold"} />
                    </button>
                    
                    {showBackgroundPicker && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowBackgroundPicker(false)} />
                        <div className="absolute bottom-full left-0 mb-2 flex bg-[#1C1B22] border border-white/10 rounded-xl p-2.5 gap-2.5 shadow-2xl z-50 flex-wrap w-[220px]">
                          {/* File input for custom background image upload */}
                          <input 
                            type="file" 
                            accept="image/*" 
                            ref={bgUploadRef} 
                            onChange={handleBgUpload} 
                            className="hidden" 
                          />
                          
                          {/* Upload '+' Icon Button */}
                          <button
                            type="button"
                            onClick={() => bgUploadRef.current?.click()}
                            title="Upload Custom Image Background"
                            className="h-8 w-8 rounded-full border-2 border-dashed border-white/20 hover:border-primary flex items-center justify-center text-white/40 hover:text-primary transition-all shrink-0"
                          >
                            <Plus size={16} weight="bold" />
                          </button>

                          {/* Default/Reset Option */}
                          <button
                            type="button"
                            onClick={() => setBackgroundStyle("")}
                            className={cn(
                              "h-8 w-8 rounded-full transition-all hover:scale-110 shadow-sm shrink-0 bg-transparent border border-white/20",
                              backgroundStyle === "" ? "ring-2 ring-white scale-110" : ""
                            )}
                          />

                          {/* Predefined Gradients */}
                          {[
                            "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500",
                            "bg-gradient-to-br from-blue-500 to-cyan-400",
                            "bg-gradient-to-br from-emerald-500 to-teal-400",
                            "bg-gradient-to-br from-orange-500 to-red-500",
                            "bg-gradient-to-br from-gray-800 to-black",
                          ].map((grad, idx) => (
                            <button
                              key={`grad-${idx}`}
                              type="button"
                              onClick={() => setBackgroundStyle(grad)}
                              className={cn(
                                "h-8 w-8 rounded-full transition-all hover:scale-110 shadow-sm shrink-0", 
                                grad, 
                                backgroundStyle === grad ? "ring-2 ring-white scale-110" : ""
                              )}
                            />
                          ))}

                          {/* Custom Uploaded Backgrounds */}
                          {customBgs.map((bgUrl, idx) => (
                            <button
                              key={`custom-${idx}`}
                              type="button"
                              onClick={() => setBackgroundStyle(bgUrl)}
                              style={{ backgroundImage: `url("${bgUrl}")` }}
                              className={cn(
                                "h-8 w-8 rounded-full transition-all hover:scale-110 shadow-sm shrink-0 bg-cover bg-center", 
                                backgroundStyle === bgUrl ? "ring-2 ring-white scale-110" : ""
                              )}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <button
                  onClick={handlePost}
                  disabled={!hasContent || isPosting}
                  title="Publish Post"
                  className={cn(
                    "h-11 w-11 rounded-2xl transition-all flex items-center justify-center shadow-xl shrink-0",
                    hasContent 
                      ? "bg-[#1D74FF] text-white shadow-[#1D74FF]/30 hover:bg-[#3483FF] hover:scale-105 active:scale-95" 
                      : "bg-white/5 text-white/10 cursor-not-allowed"
                  )}
                >
                  {isPosting ? <CircleNotch size={18} className="animate-spin" /> : <PaperPlaneTilt size={18} weight="bold" />}
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
