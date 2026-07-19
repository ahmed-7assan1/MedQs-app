"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  Image as ImageIcon,
  CircleNotch,
  X,
  Microphone,
  VideoCamera,
  FileText,
  Plus,
  ChartBar,
  Trash,
  Sparkle,
  ArrowUp,
  Ghost,
  Palette,
  Check,
  PaperPlaneTilt,
  TextB,
  TextItalic,
  TextStrikethrough,
  TextUnderline,
  ListBullets,
  ListNumbers,
  TextIndent,
  Code,
  CodeBlock,
  TextHOne,
  TextHTwo
} from "@phosphor-icons/react";
import { useCommunityShareStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { VoiceRecorder } from "./VoiceRecorder";
import { useAIKey } from "@/hooks/useAIKey";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { ProfessionalVideoPlayer } from "@/components/ui/ProfessionalVideoPlayer";
import { LinkPreview, YouTubePreview } from "./LinkPreview";

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
      forumId?: string;
      roomId?: string;
      attachments?: any[];
      sharedQuestion?: any;
      poll?: any;
      hashtags?: string[];
      isAnonymous?: boolean;
      backgroundStyle?: string;
    }
  ) => Promise<boolean>;
  circles?: { id: string; name: string }[];
  rooms?: { id: string; name: string }[];
  placeholder?: string;
  defaultRoomId?: string;
}

const MAX_CHARS = 2000;

export function PostComposer({ user, onPost, circles: forums, rooms, placeholder, defaultRoomId }: Props) {
  const { getKey } = useAIKey();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isRecordingMode, setIsRecordingMode] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<string>(defaultRoomId || forums?.[0]?.id || "");
  const [pollOptions, setPollOptions] = useState<{ text: string }[]>([]);
  const [isPollMode, setIsPollMode] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (idx: number) => setDragIndex(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIndex(idx);
  };
  const handleDragLeave = () => setDragOverIndex(null);
  const handleDrop = (idx: number) => {
    if (dragIndex === null || dragIndex === idx) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }
    const updated = [...attachments];
    const [moved] = updated.splice(dragIndex, 1);
    updated.splice(idx, 0, moved);
    setAttachments(updated);
    setDragIndex(null);
    setDragOverIndex(null);
  };
  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

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
        try { setCustomBgs(JSON.parse(saved)); } catch {}
      }
    }
  }, []);

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxW = 800, maxH = 600;
        let w = img.width, h = img.height;
        if (w > maxW || h > maxH) {
          const ratio = Math.min(maxW / w, maxH / h);
          w = w * ratio; h = h * ratio;
        }
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          canvas.toBlob(async (blob) => {
            if (!blob) return;
            try {
              const uploaded = await uploadFile(blob, "background.jpg");
              const bgUrl = uploaded.url;
              const updated = [...customBgs, bgUrl];
              setCustomBgs(updated);
              localStorage.setItem("medqs_custom_bgs", JSON.stringify(updated));
              setBackgroundStyle(bgUrl);
            } catch {}
          }, "image/jpeg", 0.65);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const [mentionSearch, setMentionSearch] = useState<string | null>(null);
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [selectedSuggestIdx, setSelectedSuggestIdx] = useState(0);

  const sharedQuestion = useCommunityShareStore((s) => s.sharedQuestion);
  const setSharedQuestion = useCommunityShareStore((s) => s.setSharedQuestion);

  useEffect(() => {
    if (mentionSearch === null) { setSuggestedUsers([]); return; }
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

  const insertMention = (targetUser: any) => {
    const val = content;
    const selectionStart = textareaRef.current?.selectionStart || 0;
    const textBeforeCursor = val.substring(0, selectionStart);
    const lastAtIdx = textBeforeCursor.lastIndexOf("@");
    if (lastAtIdx === -1) return;
    const userHandle = targetUser.nickname || targetUser.name.replace(/\s+/g, "_");
    const replacement = `@${userHandle} `;
    const newVal = val.substring(0, lastAtIdx) + replacement + val.substring(selectionStart);
    setContent(newVal);
    setMentionSearch(null);
    setSuggestedUsers([]);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(lastAtIdx + replacement.length, lastAtIdx + replacement.length);
      }
    }, 10);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (suggestedUsers.length > 0) {
      if (e.key === "ArrowDown") { e.preventDefault(); setSelectedSuggestIdx(prev => (prev + 1) % suggestedUsers.length); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setSelectedSuggestIdx(prev => (prev - 1 + suggestedUsers.length) % suggestedUsers.length); return; }
      if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); insertMention(suggestedUsers[selectedSuggestIdx]); return; }
      if (e.key === "Escape") { e.preventDefault(); setMentionSearch(null); setSuggestedUsers([]); return; }
    }
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 150);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const tags = content.match(/#[\w\u0621-\u064A]+/g) || [];
    setHashtags([...new Set(tags)]);
  }, [content]);

  useEffect(() => {
    if (sharedQuestion) {
      setIsExpanded(true);
      if (!content) setContent("What do you think about this question?");
    }
  }, [sharedQuestion]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const avatarUrl = user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name || "user")}`;

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 150 && isExpanded && !content.trim() && attachments.length === 0) {
        setIsExpanded(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isExpanded, content, attachments]);

  const hasContent = content.trim().length > 0 || attachments.length > 0;

  const handlePost = async () => {
    if (!hasContent) return;
    setIsPosting(true);
    const firstImage = attachments.find((a) => a.type === "image")?.url || "";
    const isRoom = rooms?.some(r => r.id === selectedDestination);
    const options = {
      isForumPost: !isRoom,
      forumId: isRoom ? undefined : selectedDestination,
      roomId: isRoom ? selectedDestination : undefined,
      attachments,
      sharedQuestion,
      poll: isPollMode && pollQuestion && pollOptions.filter(o => o.text.trim()).length > 1 ? {
        question: pollQuestion,
        options: pollOptions.filter(o => o.text.trim()).map(o => o.text)
      } : undefined
    };
    const ok = await onPost(content, firstImage, { ...options, hashtags, isAnonymous, backgroundStyle });
    if (ok) {
      setContent("");
      setAttachments([]);
      setIsExpanded(false);
      setSharedQuestion(null);
      setIsPollMode(false);
      setPollOptions([]);
      setPollQuestion("");
      setIsAnonymous(false);
      setBackgroundStyle("");
    }
    setIsPosting(false);
  };

  const handleAiEnhance = async () => {
    if (!content.trim()) return;
    setIsEnhancing(true);
    try {
      const siliconflowKey = getKey("siliconflow");
      if (siliconflowKey) {
        const systemPrompt = `You are a professional social media editor for a medical student community called MedOneX. The student wants to enhance their post to be more professional, engaging, and clear. - Maintain the original meaning and language. - If it's a question, make it sound inquisitive and smart. - If it's information, make it authoritative but friendly. - Add relevant emojis if appropriate (but don't overdo it). - Fix any grammar or spelling mistakes. - DO NOT add hashtags (the system adds them separately). - Return ONLY the enhanced content, with no introductory or concluding remarks.`;
        const sfRes = await fetch("https://api.siliconflow.com/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${siliconflowKey}` },
          body: JSON.stringify({
            model: "deepseek-ai/DeepSeek-R1",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: `Please enhance this post content:\n\n${content}` },
            ],
          }),
        });
        const sfData = await sfRes.json();
        const enhanced = sfData?.choices?.[0]?.message?.content?.trim();
        if (enhanced) { setContent(enhanced); return; }
      }
      const res = await fetch("/api/v1/ai/enhance-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (data.enhanced) setContent(data.enhanced);
    } catch {} finally { setIsEnhancing(false); }
  };

  const uploadFile = async (file: File | Blob, name?: string) => {
    const fd = new FormData();
    fd.append("file", file, name || (file instanceof File ? file.name : "file"));
    const res = await fetch("/api/v1/debug/telegram-direct-upload", { method: "POST", body: fd });
    const data = await res.json();
    if (!data.success) throw new Error("Upload failed");
    let type: "image" | "audio" | "video" | "file" = "file";
    if (file.type?.startsWith("image/")) type = "image";
    else if (file.type?.startsWith("audio/")) type = "audio";
    else if (file.type?.startsWith("video/")) type = "video";
    return { url: `/api/v1/files/telegram/preview?fileId=${data.fileId}&type=${type}`, type, fileId: data.fileId, name: name || (file instanceof File ? file.name : "attachment") };
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setIsUploading(true);
    try {
      const results = await Promise.all(files.map(f => uploadFile(f)));
      setAttachments(prev => [...prev, ...results]);
    } catch { toast.error("Upload failed"); }
    finally { setIsUploading(false); e.target.value = ""; }
  };

  const images = attachments.filter((a: any) => a.type === "image");
  const audios = attachments.filter((a: any) => a.type === "audio" || a.type === "telegram_audio");
  const videos = attachments.filter((a: any) => a.type === "video" || a.type === "telegram_video");
  const documents = attachments.filter((a: any) => a.type !== "image" && a.type !== "audio" && a.type !== "telegram_audio" && a.type !== "video" && a.type !== "telegram_video");

  const inlineTelegramVideo = useMemo(() => {
    if (attachments.length > 0) return null;
    const match = content.match(/https?:\/\/(?:www\.)?(?:t\.me|telegram\.me)\/([a-zA-Z0-9_]+)\/(\d+)/i);
    return match ? match[0] : null;
  }, [content, attachments]);

  const formatText = (before: string, after: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);
    const newText = content.substring(0, start) + before + selected + after + content.substring(end);
    setContent(newText);
    setTimeout(() => {
      textarea.focus();
      const cursorPos = start + before.length + selected.length + after.length;
      if (selected) textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
      else textarea.setSelectionRange(cursorPos, cursorPos);
    }, 10);
  };

  const formatBlock = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const lineStart = content.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = content.indexOf('\n', start);
    const rest = lineEnd === -1 ? '' : content.substring(lineEnd);
    const line = content.substring(lineStart, lineEnd === -1 ? content.length : lineEnd);
    const before = content.substring(0, lineStart);
    const newText = before + prefix + line + suffix + rest;
    setContent(newText);
  };

  return (
    <div className={cn(
      "relative rounded-2xl sm:rounded-[32px] bg-card/70 backdrop-blur-3xl border border-border shadow-2xl transition-all duration-500 overflow-hidden"
    )}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[40px] pointer-events-none" />

      <div className="relative p-4 sm:p-6">
        <div className="flex gap-3 sm:gap-4">
          <div className="relative">
            <img src={isAnonymous ? `https://api.dicebear.com/7.x/avataaars/svg?seed=anonymous` : avatarUrl} className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-white/10 shrink-0 object-cover shadow-sm" alt="" />
            {isAnonymous && (
              <div className="absolute -bottom-1 -right-1 bg-purple-500 text-white rounded-full p-0.5 border-2 border-white dark:border-[#161523]">
                <Ghost size={10} weight="fill" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 pt-0.5 sm:pt-1 relative">
            <div
              className={cn(
                "relative rounded-2xl transition-all duration-300 overflow-hidden",
                backgroundStyle ? "shadow-lg border border-slate-200/50 dark:border-white/10 min-h-[140px] sm:min-h-[180px] flex items-center justify-center p-4 sm:p-6" : "",
                backgroundStyle && (isClassName(backgroundStyle) ? backgroundStyle : "bg-cover bg-center")
              )}
              style={backgroundStyle && !isClassName(backgroundStyle) ? { backgroundImage: `url("${backgroundStyle}")` } : undefined}
            >
              {backgroundStyle && (!isClassName(backgroundStyle) || backgroundStyle.includes("url")) && (
                <div className="absolute inset-0 bg-black/45 z-0" />
              )}

              <textarea dir="auto"
                ref={textareaRef}
                value={content}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val.length > MAX_CHARS) {
                    e.target.value = val.substring(0, MAX_CHARS);
                    setContent(val.substring(0, MAX_CHARS));
                    checkMentions(val.substring(0, MAX_CHARS), e.target.selectionStart);
                  } else {
                    setContent(val);
                    checkMentions(val, e.target.selectionStart);
                  }
                  e.target.style.height = "auto";
                  e.target.style.height = e.target.scrollHeight + "px";
                }}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsExpanded(true)}
                placeholder={placeholder || (isAnonymous ? "Post anonymously..." : `What's on your mind, ${user.name.split(" ")[0]}?`)}
                className={cn(
                  "w-full bg-transparent border-none p-0 focus:ring-0 resize-none z-10",
                  backgroundStyle
                    ? "text-white placeholder:text-white/60 text-lg sm:text-xl font-extrabold text-center leading-normal"
                    : "text-sm sm:text-[17px] text-slate-800 dark:text-white/90 placeholder:text-slate-400 dark:placeholder:text-white/20 font-medium leading-relaxed"
                )}
                style={{ minHeight: backgroundStyle ? "80px" : "40px" }}
              />
            </div>

            {suggestedUsers.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-dropdown max-h-48 overflow-y-auto">
                {suggestedUsers.map((u, idx) => (
                  <button
                    key={u.id}
                    onClick={() => insertMention(u)}
                    className={cn(
                      "w-full flex-row flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-slate-100 dark:hover:bg-white/5",
                      idx === selectedSuggestIdx ? "bg-primary/10 dark:bg-primary/20" : ""
                    )}
                  >
                    <img src={u.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.name)}`} className="h-7 w-7 rounded-full border border-slate-200 dark:border-white/10" alt="" />
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-800 dark:text-white">{u.name}</span>
                      {u.nickname && <span className="text-[10px] text-slate-400 dark:text-white/40">@{u.nickname}</span>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <AnimatePresence>
          {(isExpanded || attachments.length > 0) && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">

              {/* Formatting Toolbar */}
              <div className="flex items-center gap-0.5 mt-3 mb-1 px-0.5 overflow-x-auto">
                {[
                  { icon: TextB, title: "Bold", action: () => formatText("**", "**") },
                  { icon: TextItalic, title: "Italic", action: () => formatText("*", "*") },
                  { icon: TextStrikethrough, title: "Strikethrough", action: () => formatText("~~", "~~") },
                  { icon: TextUnderline, title: "Underline", action: () => formatText("<u>", "</u>") },
                ].map((btn, i) => (
                  <button key={i} onClick={btn.action} title={btn.title}
                    className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 dark:text-white/30 hover:text-primary hover:bg-primary/5 transition-all shrink-0"
                  >
                    <btn.icon size={15} weight="bold" />
                  </button>
                ))}
                <div className="w-px h-5 bg-slate-200 dark:bg-white/10 mx-1 shrink-0" />
                {[
                  { icon: TextHOne, title: "Heading 1", action: () => formatBlock("# ") },
                  { icon: TextHTwo, title: "Heading 2", action: () => formatBlock("## ") },
                ].map((btn, i) => (
                  <button key={i} onClick={btn.action} title={btn.title}
                    className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 dark:text-white/30 hover:text-primary hover:bg-primary/5 transition-all shrink-0"
                  >
                    <btn.icon size={15} weight="bold" />
                  </button>
                ))}
                <div className="w-px h-5 bg-slate-200 dark:bg-white/10 mx-1 shrink-0" />
                {[
                  { icon: ListBullets, title: "Bullet List", action: () => formatBlock("- ") },
                  { icon: ListNumbers, title: "Numbered List", action: () => formatBlock("1. ") },
                  { icon: TextIndent, title: "Blockquote", action: () => formatBlock("> ") },
                ].map((btn, i) => (
                  <button key={i} onClick={btn.action} title={btn.title}
                    className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 dark:text-white/30 hover:text-primary hover:bg-primary/5 transition-all shrink-0"
                  >
                    <btn.icon size={15} weight="bold" />
                  </button>
                ))}
                <div className="w-px h-5 bg-slate-200 dark:bg-white/10 mx-1 shrink-0" />
                {[
                  { icon: Code, title: "Inline Code", action: () => formatText("`", "`") },
                  { icon: CodeBlock, title: "Code Block", action: () => formatBlock("```\n", "\n```") },
                ].map((btn, i) => (
                  <button key={i} onClick={btn.action} title={btn.title}
                    className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 dark:text-white/30 hover:text-primary hover:bg-primary/5 transition-all shrink-0"
                  >
                    <btn.icon size={15} weight="bold" />
                  </button>
                ))}
              </div>

              {/* Link Preview & YouTube Preview */}
              {isExpanded && !backgroundStyle && (
                <>
                  <YouTubePreview content={content} />
                  <LinkPreview content={content} />
                </>
              )}

              {/* Destination Selector */}
              {!defaultRoomId && (forums?.length || 0) + (rooms?.length || 0) > 1 && (
                <div className="mt-4 flex flex-wrap gap-2 px-1">
                  {[...(forums || []), ...(rooms || [])].map(dest => (
                    <button key={dest.id} onClick={() => setSelectedDestination(dest.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                        selectedDestination === dest.id
                          ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                          : "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white/30 border-transparent hover:border-slate-300 dark:hover:border-white/10"
                      )}
                    >
                      {dest.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Shared Question */}
              {sharedQuestion && (
                <div className="mt-4 p-4 rounded-2xl border border-primary/30 bg-primary/5 relative group">
                  <button onClick={() => setSharedQuestion(null)} className="absolute top-2 right-2 p-1.5 bg-slate-200 dark:bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-all text-slate-500 dark:text-white/60 hover:text-red-500">
                    <X size={14} weight="bold" />
                  </button>
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-2">Reference Question</p>
                  <p className="text-sm font-medium text-slate-700 dark:text-white line-clamp-2">{sharedQuestion.body}</p>
                </div>
              )}

              {/* Poll Creation */}
              {isPollMode && (
                <div className="mt-4 p-5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02]">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Create Poll</p>
                    <button onClick={() => setIsPollMode(false)} className="text-slate-400 hover:text-red-500"><X size={16} weight="bold" /></button>
                  </div>
                  <input value={pollQuestion} onChange={(e) => setPollQuestion(e.target.value)} placeholder="Poll Question..." className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl p-3.5 text-sm focus:outline-none focus:border-primary transition-all mb-3" />
                  <div className="space-y-2">
                    {pollOptions.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input value={opt.text} onChange={(e) => { const n = [...pollOptions]; n[idx].text = e.target.value; setPollOptions(n); }} placeholder={`Option ${idx + 1}`} className="flex-1 bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-primary transition-all" />
                        {pollOptions.length > 2 && <button onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))} className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl"><Trash size={18} /></button>}
                      </div>
                    ))}
                  </div>
                  {pollOptions.length < 5 && <button onClick={() => setPollOptions([...pollOptions, { text: "" }])} className="mt-4 text-[11px] font-black uppercase text-emerald-500 flex items-center gap-2 hover:translate-x-1 transition-transform"><Plus size={14} weight="bold" /> Add Option</button>}
                </div>
              )}

              {/* Attachments Grid */}
              {(attachments.length > 0 || isUploading) && (
                <div className="flex flex-col gap-4 mt-6 px-1">
                  {(images.length > 0 || documents.length > 0 || isUploading) && (
                    <div className="flex flex-wrap gap-4">
                      {images.length > 0 && (
                        <div className="w-full">
                          <div className={cn("grid gap-1.5 rounded-2xl overflow-hidden", images.length === 1 ? "grid-cols-1" : images.length === 2 ? "grid-cols-2" : "grid-cols-2")}>
                            {images.slice(0, 4).map((img: any, i: number) => {
                              const total = images.length;
                              const isDragOver = dragOverIndex !== null && attachments.indexOf(img) === dragOverIndex;
                              return (
                                <div key={i} draggable onDragStart={() => handleDragStart(attachments.indexOf(img))} onDragOver={(e) => handleDragOver(e, attachments.indexOf(img))} onDragLeave={handleDragLeave} onDrop={() => handleDrop(attachments.indexOf(img))} onDragEnd={handleDragEnd}
                                  className={cn("relative group overflow-hidden bg-slate-100 dark:bg-black/20 cursor-grab active:cursor-grabbing transition-all",
                                    total === 1 ? "w-full max-h-[400px] min-h-[200px]" :
                                    total === 3 && i === 0 ? "row-span-2 h-full min-h-[220px]" :
                                    total === 3 ? "h-[105px] sm:h-[140px]" : "h-[130px] sm:h-[180px]",
                                    isDragOver ? "ring-2 ring-primary scale-[1.02] z-10" : "",
                                    dragIndex === attachments.indexOf(img) ? "opacity-50" : ""
                                  )}
                                >
                                  <img src={img.url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" alt="" />
                                  <button onClick={() => setAttachments(prev => prev.filter(a => a.url !== img.url))} className="absolute top-2 right-2 h-7 w-7 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-white z-10 hover:bg-red-500"><X size={14} weight="bold" /></button>
                                  {i === 3 && total > 4 && (
                                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                                      <span className="text-white text-2xl font-black drop-shadow-lg">+{total - 4}</span>
                                    </div>
                                  )}
                                  <div className="absolute top-2 left-2 h-6 w-6 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/></svg>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {documents.map((att: any, i: number) => {
                        const idx = attachments.indexOf(att);
                        const isDragOver = dragOverIndex === idx;
                        return (
                          <div key={i} draggable onDragStart={() => handleDragStart(idx)} onDragOver={(e) => handleDragOver(e, idx)} onDragLeave={handleDragLeave} onDrop={() => handleDrop(idx)} onDragEnd={handleDragEnd}
                            className={cn("relative group h-24 w-24 sm:h-28 sm:w-28 rounded-2xl bg-slate-100 dark:bg-white/5 border flex flex-col items-center justify-center p-2 text-center shadow-md transition-all cursor-grab active:cursor-grabbing",
                              isDragOver ? "border-primary ring-2 ring-primary scale-105 z-10" : "border-slate-200 dark:border-white/10 hover:border-primary/30",
                              dragIndex === idx ? "opacity-50" : ""
                            )}
                          >
                            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-1"><FileText size={18} weight="bold" /></div>
                            <p className="text-[9px] font-bold text-slate-500 dark:text-white/40 truncate w-full px-1">{att.name || "File"}</p>
                            <button onClick={() => setAttachments(prev => prev.filter(a => a.fileId !== att.fileId))} className="absolute top-1.5 right-1.5 h-6 w-6 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-white hover:bg-red-500"><X size={12} weight="bold" /></button>
                          </div>
                        );
                      })}
                      {videos.map((vid: any, i: number) => {
                        const idx = attachments.indexOf(vid);
                        const isDragOver = dragOverIndex === idx;
                        return (
                          <div key={i} draggable onDragStart={() => handleDragStart(idx)} onDragOver={(e) => handleDragOver(e, idx)} onDragLeave={handleDragLeave} onDrop={() => handleDrop(idx)} onDragEnd={handleDragEnd}
                            className={cn("relative group h-24 w-24 sm:h-28 sm:w-28 rounded-2xl overflow-hidden border shadow-md transition-all cursor-grab active:cursor-grabbing",
                              isDragOver ? "border-primary ring-2 ring-primary scale-105 z-10" : "border-slate-200 dark:border-white/10",
                              dragIndex === idx ? "opacity-50" : ""
                            )}
                          >
                            <video src={vid.url} className="h-full w-full object-cover" />
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                              <VideoCamera size={24} weight="fill" className="text-white" />
                            </div>
                            <button onClick={() => setAttachments(prev => prev.filter(a => a.url !== vid.url))} className="absolute top-1.5 right-1.5 h-6 w-6 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-white hover:bg-red-500"><X size={12} weight="bold" /></button>
                          </div>
                        );
                      })}
                      {isUploading && <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl bg-slate-100 dark:bg-white/5 border border-dashed border-slate-300 dark:border-white/20 flex items-center justify-center"><CircleNotch size={28} className="animate-spin text-primary" /></div>}
                    </div>
                  )}

                  {audios.map((att: any, i: number) => (
                    <div key={i} className="relative flex items-center gap-4 p-3 bg-slate-100/80 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 group">
                      <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary"><Microphone size={20} weight="fill" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Voice Note Preview</p>
                        <audio src={att.url} controls className="w-full h-8" />
                      </div>
                      <button onClick={() => setAttachments(prev => prev.filter(a => a.fileId !== att.fileId))} className="h-8 w-8 bg-slate-200 dark:bg-white/10 rounded-full flex items-center justify-center text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-all"><X size={14} weight="bold" /></button>
                    </div>
                  ))}

                  {inlineTelegramVideo && (
                    <div className="mt-4 rounded-[24px] overflow-hidden border border-emerald-500/25 bg-black shadow-lg">
                      <div className="relative w-full aspect-video">
                        <ProfessionalVideoPlayer src={inlineTelegramVideo} className="w-full h-full" />
                        <div className="absolute top-2 left-2 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1 z-10">
                          <VideoCamera size={12} className="text-emerald-400" />
                          <span className="text-[10px] font-black text-emerald-300 uppercase tracking-widest text-right">Telegram Link Preview</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Interaction Bar */}
              <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100 dark:border-white/[0.05]">
                <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                  <label className="h-9 sm:h-11 px-2 sm:px-3 flex items-center gap-1.5 sm:gap-2.5 text-slate-500 dark:text-white/30 hover:text-primary hover:bg-primary/5 rounded-xl sm:rounded-2xl transition-all cursor-pointer group">
                    <ImageIcon className="w-[18px] h-[18px] sm:w-[22px] sm:h-[22px]" weight="fill" />
                    <span className="text-[10px] sm:text-[12px] font-black uppercase tracking-widest hidden sm:inline">Photo</span>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileInput} />
                  </label>
                  <label className="h-9 sm:h-11 px-2 sm:px-3 flex items-center gap-1.5 sm:gap-2.5 text-slate-500 dark:text-white/30 hover:text-primary hover:bg-primary/5 rounded-xl sm:rounded-2xl transition-all cursor-pointer group">
                    <VideoCamera className="w-[18px] h-[18px] sm:w-[22px] sm:h-[22px]" weight="fill" />
                    <span className="text-[10px] sm:text-[12px] font-black uppercase tracking-widest hidden sm:inline">Video</span>
                    <input type="file" accept="video/*" className="hidden" onChange={handleFileInput} />
                  </label>
                  <button onClick={() => { setIsPollMode(true); if (pollOptions.length === 0) setPollOptions([{text:""}, {text:""}]); }} className={cn("h-9 w-9 sm:h-11 sm:w-11 flex items-center justify-center rounded-xl sm:rounded-2xl transition-all", isPollMode ? "text-emerald-500 bg-emerald-500/10 shadow-inner" : "text-slate-500 dark:text-white/30 hover:text-emerald-500 hover:bg-emerald-500/5")}>
                    <ChartBar className="w-[18px] h-[18px] sm:w-[22px] sm:h-[22px]" weight="bold" />
                  </button>
                  <button onClick={() => setIsRecordingMode(!isRecordingMode)} className={cn("h-9 w-9 sm:h-11 sm:w-11 flex items-center justify-center rounded-xl sm:rounded-2xl transition-all", isRecordingMode ? "text-primary bg-primary/10 shadow-inner" : "text-slate-500 dark:text-white/30 hover:text-primary hover:bg-primary/5")}>
                    <Microphone className="w-[18px] h-[18px] sm:w-[22px] sm:h-[22px]" weight="bold" />
                  </button>
                  <button onClick={() => setIsAnonymous(!isAnonymous)} title="Post Anonymously"
                    className={cn("h-9 w-9 sm:h-11 sm:w-11 flex items-center justify-center rounded-xl sm:rounded-2xl transition-all", isAnonymous ? "text-purple-500 bg-purple-500/10 shadow-inner" : "text-slate-500 dark:text-white/30 hover:text-purple-500 hover:bg-purple-500/5")}
                  >
                    <Ghost className="w-[18px] h-[18px] sm:w-[22px] sm:h-[22px]" weight={isAnonymous ? "fill" : "bold"} />
                  </button>
                  <div className="relative">
                    <button onClick={() => setShowBackgroundPicker(!showBackgroundPicker)} type="button" title="Background Style"
                      className={cn("h-9 w-9 sm:h-11 sm:w-11 flex items-center justify-center rounded-xl sm:rounded-2xl transition-all", backgroundStyle ? "text-pink-500 bg-pink-500/10 shadow-inner" : "text-slate-500 dark:text-white/30 hover:text-pink-500 hover:bg-pink-500/5")}
                    >
                      <Palette className="w-[18px] h-[18px] sm:w-[22px] sm:h-[22px]" weight={backgroundStyle ? "fill" : "bold"} />
                    </button>
                    {showBackgroundPicker && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowBackgroundPicker(false)} />
                        <div className="absolute bottom-full left-0 mb-2 flex bg-card border border-border rounded-2xl p-2.5 gap-2.5 shadow-2xl z-50 flex-wrap w-[220px]">
                          <input type="file" accept="image/*" ref={bgUploadRef} onChange={handleBgUpload} className="hidden" />
                          <button type="button" onClick={() => bgUploadRef.current?.click()} title="Upload Custom Image Background"
                            className="h-8 w-8 rounded-full border-2 border-dashed border-slate-300 dark:border-white/20 hover:border-primary flex items-center justify-center text-slate-400 hover:text-primary transition-all shrink-0"
                          >
                            <Plus size={16} weight="bold" />
                          </button>
                          <button type="button" onClick={() => setBackgroundStyle("")}
                            className={cn("h-8 w-8 rounded-full transition-all hover:scale-110 shadow-sm shrink-0 bg-transparent border border-slate-300 dark:border-white/20", backgroundStyle === "" ? "ring-2 ring-primary dark:ring-white scale-110" : "")}
                          />
                          {[
                            "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500",
                            "bg-gradient-to-br from-blue-500 to-cyan-400",
                            "bg-gradient-to-br from-emerald-500 to-teal-400",
                            "bg-gradient-to-br from-orange-500 to-red-500",
                            "bg-gradient-to-br from-gray-800 to-black",
                          ].map((grad, idx) => (
                            <button key={`grad-${idx}`} type="button" onClick={() => setBackgroundStyle(grad)}
                              className={cn("h-8 w-8 rounded-full transition-all hover:scale-110 shadow-sm shrink-0", grad, backgroundStyle === grad ? "ring-2 ring-primary dark:ring-white scale-110" : "")}
                            />
                          ))}
                          {customBgs.map((bgUrl, idx) => (
                            <button key={`custom-${idx}`} type="button" onClick={() => setBackgroundStyle(bgUrl)} style={{ backgroundImage: `url("${bgUrl}")` }}
                              className={cn("h-8 w-8 rounded-full transition-all hover:scale-110 shadow-sm shrink-0 bg-cover bg-center", backgroundStyle === bgUrl ? "ring-2 ring-primary dark:ring-white scale-110" : "")}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  <button onClick={handleAiEnhance} disabled={isEnhancing || !content.trim()} title="Enhance with AI"
                    className={cn("h-9 w-9 sm:h-11 sm:w-11 flex items-center justify-center rounded-xl sm:rounded-2xl transition-all border shrink-0",
                      isEnhancing ? "bg-purple-500/10 border-purple-500/20 text-purple-500" : "bg-purple-500/5 border-transparent text-purple-400 hover:border-purple-500/30 hover:bg-purple-500/10"
                    )}
                  >
                    {isEnhancing ? <CircleNotch size={16} className="animate-spin" /> : <Sparkle size={16} weight="fill" />}
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <span className={cn(
                    "text-[10px] font-black tabular-nums transition-colors",
                    content.length > MAX_CHARS - 100 ? "text-amber-500" : content.length > MAX_CHARS - 200 ? "text-slate-400 dark:text-white/30" : "text-slate-400 dark:text-white/20"
                  )}>
                    {content.length}/{MAX_CHARS}
                  </span>
                  <button onClick={handlePost} disabled={!hasContent || isPosting} title="Publish Post"
                    className={cn("h-9 w-9 sm:h-11 sm:w-11 rounded-xl sm:rounded-2xl transition-all flex items-center justify-center relative group overflow-hidden shrink-0",
                      hasContent ? "bg-primary text-white shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary-rgb),0.5)] hover:-translate-y-0.5" : "bg-slate-200 dark:bg-white/5 text-slate-400 dark:text-white/10 cursor-not-allowed"
                    )}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    {isPosting ? <CircleNotch size={18} className="animate-spin" /> : <PaperPlaneTilt size={18} weight="bold" />}
                  </button>
                </div>
              </div>

              {/* Hashtags Preview */}
              {hashtags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2 px-1">
                  {hashtags.map(tag => (
                    <span key={tag} className="text-[11px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-lg border border-primary/10">{tag}</span>
                  ))}
                </div>
              )}

              {/* Voice Recorder Overlay */}
              <AnimatePresence>
                {isRecordingMode && (
                  <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 15 }} className="mt-4">
                    <VoiceRecorder onStop={async (blob, duration) => {
                      const att = await uploadFile(blob, `voice_${Date.now()}.webm`);
                      setAttachments(prev => [...prev, { ...att, duration }]);
                      setIsRecordingMode(false);
                    }} onCancel={() => setIsRecordingMode(false)} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/** Floating Sticky Version of the Post Composer */
export function FloatingPostIsland({ user, onPost, circles, rooms }: Props) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 150);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <AnimatePresence>
        {isScrolled && !isExpanded && (
          <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
            className="fixed left-0 right-0 flex justify-center z-navbar pointer-events-none max-md:bottom-[calc(var(--mobile-tabbar-reserve)+env(safe-area-inset-bottom,0px)+0.5rem)] md:bottom-8"
          >
            <div className="pointer-events-auto max-w-[min(540px,calc(100vw-48px))] w-full px-4 flex justify-center">
              <button onClick={() => setIsExpanded(true)}
                className="flex items-center gap-3 pr-6 pl-2.5 py-2.5 rounded-[24px] bg-card/70 backdrop-blur-3xl text-foreground shadow-[0_20px_50px_rgba(0,0,0,0.15)] hover:scale-105 active:scale-95 transition-all border border-border group hover:border-primary/30"
              >
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                  <Plus size={18} weight="bold" className="group-hover:rotate-90 transition-transform duration-300" />
                </div>
                <span className="text-[14px] font-bold">Create Post</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-modal flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => { setIsExpanded(false); }}
          >
            <motion.div initial={{ y: 100, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 100, opacity: 0, scale: 0.95 }}
              className="w-full max-w-[min(640px,calc(100vw-16px))] mx-0 sm:mx-4 mb-0 sm:mb-8 max-h-[90dvh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <PostComposer user={user} onPost={async (content, imageUrl, options) => {
                const ok = await onPost(content, imageUrl, options);
                if (ok) setIsExpanded(false);
                return ok;
              }} circles={circles} rooms={rooms} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
