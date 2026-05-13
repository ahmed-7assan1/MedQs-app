"use client";

import { useState, useRef, useEffect } from "react";
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
  ArrowUp
} from "@phosphor-icons/react";
import { useCommunityShareStore } from "@/lib/store";
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
      forumId?: string;
      roomId?: string;
      attachments?: any[];
      sharedQuestion?: any;
      poll?: any;
      hashtags?: string[];
    }
  ) => Promise<boolean>;
  circles?: { id: string; name: string }[];
  rooms?: { id: string; name: string }[];
  placeholder?: string;
  defaultRoomId?: string;
}

export function PostComposer({ user, onPost, circles: forums, rooms, placeholder, defaultRoomId }: Props) {
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

  const sharedQuestion = useCommunityShareStore((s) => s.sharedQuestion);
  const setSharedQuestion = useCommunityShareStore((s) => s.setSharedQuestion);

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
    
    // Determine if it's a forum or a room
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

    const ok = await onPost(content, firstImage, { ...options, hashtags });
    if (ok) {
      setContent("");
      setAttachments([]);
      setIsExpanded(false);
      setSharedQuestion(null);
      setIsPollMode(false);
      setPollOptions([]);
      setPollQuestion("");
    }
    setIsPosting(false);
  };

  const handleAiEnhance = async () => {
    if (!content.trim()) return;
    setIsEnhancing(true);
    try {
      const res = await fetch("/api/v1/ai/enhance-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (data.enhanced) {
        setContent(data.enhanced);
        toast.success("Post enhanced by AI! ✨");
      }
    } catch {
      toast.error("Failed to enhance text");
    } finally {
      setIsEnhancing(false);
    }
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
    return {
      url: `/api/v1/files/telegram/preview?fileId=${data.fileId}&type=${type}`,
      type,
      fileId: data.fileId,
      name: name || (file instanceof File ? file.name : "attachment")
    };
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
  const audios = attachments.filter((a: any) => a.type === "audio");
  const videos = attachments.filter((a: any) => a.type === "video");
  const documents = attachments.filter((a: any) => a.type !== "image" && a.type !== "audio" && a.type !== "video");

  return (
    <div className={cn(
      "relative rounded-[32px] bg-white/70 dark:bg-[#161523]/70 backdrop-blur-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-2xl transition-all duration-500 overflow-hidden"
    )}>
      {/* Visual Accents */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[40px] pointer-events-none" />
      
      <div className="relative p-6">
        <div className="flex gap-4">
          <img src={avatarUrl} className="h-12 w-12 rounded-2xl border border-slate-200 dark:border-white/10 shrink-0 object-cover shadow-sm" alt="" />
          <div className="flex-1 min-w-0 pt-1">
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
              className="w-full bg-transparent border-none p-0 text-[17px] text-slate-800 dark:text-white/90 placeholder:text-slate-400 dark:placeholder:text-white/20 resize-none focus:ring-0 font-medium leading-relaxed"
              style={{ minHeight: "48px" }}
            />
          </div>
        </div>

        <AnimatePresence>
          {(isExpanded || attachments.length > 0) && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              
              {/* Destination Selector if not default */}
              {!defaultRoomId && (forums?.length || 0) + (rooms?.length || 0) > 1 && (
                <div className="mt-4 flex flex-wrap gap-2 px-1">
                  {[...(forums || []), ...(rooms || [])].map(dest => (
                    <button 
                      key={dest.id}
                      onClick={() => setSelectedDestination(dest.id)}
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
                      {images.map((img: any, i: number) => (
                        <div key={i} className="relative group h-28 w-28 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-md">
                          <img src={img.url} className="h-full w-full object-cover" alt="" />
                          <button onClick={() => setAttachments(prev => prev.filter(a => a.url !== img.url))} className="absolute top-1.5 right-1.5 h-7 w-7 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-white"><X size={14} weight="bold" /></button>
                        </div>
                      ))}
                      {documents.map((att: any, i: number) => (
                        <div key={i} className="relative group h-28 w-28 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex flex-col items-center justify-center p-2 text-center shadow-md">
                          <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-1"><FileText size={20} /></div>
                          <p className="text-[9px] font-bold text-slate-500 dark:text-white/40 truncate w-full px-1">{att.name || "File"}</p>
                          <button onClick={() => setAttachments(prev => prev.filter(a => a.fileId !== att.fileId))} className="absolute top-1.5 right-1.5 h-6 w-6 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-white"><X size={12} weight="bold" /></button>
                        </div>
                      ))}
                      {videos.map((vid: any, i: number) => (
                        <div key={i} className="relative group h-28 w-28 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-md">
                          <video src={vid.url} className="h-full w-full object-cover" />
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                            <VideoCamera size={24} weight="fill" className="text-white" />
                          </div>
                          <button onClick={() => setAttachments(prev => prev.filter(a => a.url !== vid.url))} className="absolute top-1.5 right-1.5 h-7 w-7 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-white"><X size={14} weight="bold" /></button>
                        </div>
                      ))}
                      {isUploading && <div className="h-28 w-28 rounded-2xl bg-slate-100 dark:bg-white/5 border border-dashed border-slate-300 dark:border-white/20 flex items-center justify-center"><CircleNotch size={28} className="animate-spin text-primary" /></div>}
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
                </div>
              )}

              {/* Interaction Bar */}
              <div className="flex items-center justify-between mt-8 pt-5 border-t border-slate-100 dark:border-white/[0.05]">
                <div className="flex items-center gap-1.5">
                  <label className="h-11 px-4 flex items-center gap-2.5 text-slate-500 dark:text-white/30 hover:text-primary hover:bg-primary/5 rounded-2xl transition-all cursor-pointer group">
                    <ImageIcon size={22} weight="fill" className="group-hover:scale-110 transition-transform" />
                    <span className="text-[12px] font-black uppercase tracking-widest hidden sm:inline">Photo</span>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileInput} />
                  </label>
                  <label className="h-11 px-4 flex items-center gap-2.5 text-slate-500 dark:text-white/30 hover:text-primary hover:bg-primary/5 rounded-2xl transition-all cursor-pointer group">
                    <VideoCamera size={22} weight="fill" className="group-hover:scale-110 transition-transform" />
                    <span className="text-[12px] font-black uppercase tracking-widest hidden sm:inline">Video</span>
                    <input type="file" accept="video/*" className="hidden" onChange={handleFileInput} />
                  </label>
                  <button onClick={() => { setIsPollMode(true); if (pollOptions.length === 0) setPollOptions([{text:""}, {text:""}]); }} className={cn("h-11 w-11 flex items-center justify-center rounded-2xl transition-all", isPollMode ? "text-emerald-500 bg-emerald-500/10 shadow-inner shadow-emerald-500/10" : "text-slate-500 dark:text-white/30 hover:text-emerald-500 hover:bg-emerald-500/5")}>
                    <ChartBar size={22} weight="bold" />
                  </button>
                  <button onClick={() => setIsRecordingMode(!isRecordingMode)} className={cn("h-11 w-11 flex items-center justify-center rounded-2xl transition-all", isRecordingMode ? "text-primary bg-primary/10 shadow-inner shadow-primary/10" : "text-slate-500 dark:text-white/30 hover:text-primary hover:bg-primary/5")}>
                    <Microphone size={22} weight="bold" />
                  </button>
                  <button 
                    onClick={handleAiEnhance} 
                    disabled={isEnhancing || !content.trim()}
                    className={cn(
                      "h-11 px-4 flex items-center gap-2 rounded-2xl transition-all border",
                      isEnhancing 
                        ? "bg-purple-500/10 border-purple-500/20 text-purple-500" 
                        : "bg-purple-500/5 border-transparent text-purple-400 hover:border-purple-500/30 hover:bg-purple-500/10"
                    )}
                  >
                    {isEnhancing ? <CircleNotch size={18} className="animate-spin" /> : <Sparkle size={18} weight="fill" />}
                    <span className="text-[11px] font-black uppercase tracking-widest hidden lg:inline">Enhance</span>
                  </button>
                </div>

                <button 
                  onClick={handlePost} 
                  disabled={!hasContent || isPosting} 
                  className={cn(
                    "px-10 py-3 rounded-2xl text-[14px] font-black uppercase tracking-widest transition-all flex items-center justify-center min-w-[120px] relative group overflow-hidden",
                    hasContent 
                      ? "bg-primary text-white shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary-rgb),0.5)] hover:-translate-y-0.5" 
                      : "bg-slate-200 dark:bg-white/5 text-slate-400 dark:text-white/10 cursor-not-allowed"
                  )}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  {isPosting ? <CircleNotch size={20} className="animate-spin" /> : "Post"}
                </button>
              </div>

              {/* Hashtags Preview */}
              {hashtags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2 px-1">
                  {hashtags.map(tag => (
                    <span key={tag} className="text-[11px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-lg border border-primary/10">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Voice Recorder Overlay */}
              <AnimatePresence>
                {isRecordingMode && (
                  <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 15 }} className="mt-4">
                    <VoiceRecorder 
                      onStop={async (blob, duration) => {
                        const att = await uploadFile(blob, `voice_${Date.now()}.webm`);
                        setAttachments(prev => [...prev, { ...att, duration }]);
                        setIsRecordingMode(false);
                      }}
                      onCancel={() => setIsRecordingMode(false)}
                    />
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
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-0 right-0 flex justify-center z-[400] pointer-events-none"
          >
            <div className="pointer-events-auto max-w-[min(540px,calc(100vw-48px))] w-full px-4 flex justify-center">
              <button 
                onClick={() => setIsExpanded(true)}
                className="flex items-center gap-3 pr-6 pl-2.5 py-2.5 rounded-[24px] bg-white/70 dark:bg-[#161523]/70 backdrop-blur-3xl text-slate-800 dark:text-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] hover:scale-105 active:scale-95 transition-all border border-slate-200/80 dark:border-white/[0.08] group hover:border-primary/30"
              >
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                  <Plus size={18} weight="bold" className="group-hover:rotate-90 transition-transform duration-300" />
                </div>
                <span className="text-[13px] font-black uppercase tracking-widest group-hover:text-primary transition-colors">Spark Discussion</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isExpanded && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsExpanded(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              className="relative w-full max-w-2xl"
            >
               <PostComposer 
                 user={user} 
                 onPost={async (c, i, o) => {
                    const ok = await onPost(c, i, o);
                    if (ok) setIsExpanded(false);
                    return ok;
                 }}
                 circles={circles}
                 rooms={rooms}
                 placeholder="Compose your thoughts..."
               />
               <button 
                 onClick={() => setIsExpanded(false)}
                 className="absolute -top-3 -right-3 h-10 w-10 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-xl text-slate-500 hover:text-red-500 transition-all border border-slate-200 dark:border-white/10"
               >
                 <X size={20} weight="bold" />
               </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
