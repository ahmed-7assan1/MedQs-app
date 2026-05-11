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
  Check
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
      isChatMessage?: boolean;
      forumId?: string;
      sharedQuestion?: any;
      poll?: any;
      postType?: string;
      qaAnswer?: string;
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
  const [pollOptions, setPollOptions] = useState<{ text: string }[]>([]);
  const [isPollMode, setIsPollMode] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [isQaMode, setIsQaMode] = useState(false);
  const [qaQuestion, setQaQuestion] = useState("");
  const [qaOptions, setQaOptions] = useState<{ text: string }[]>([{ text: "" }, { text: "" }, { text: "" }, { text: "" }]);
  const [qaCorrectIdx, setQaCorrectIdx] = useState<number | null>(null);

  const sharedQuestion = useCommunityShareStore((s) => s.sharedQuestion);
  const setSharedQuestion = useCommunityShareStore((s) => s.setSharedQuestion);

  useEffect(() => {
    if (sharedQuestion) {
      setIsExpanded(true);
      // Automatically set some context text if content is empty
      if (!content) {
        setContent("Can anyone help me understand this question better?");
      }
    }
  }, [sharedQuestion]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
              {/* Shared Question Preview */}
              {sharedQuestion && (
                <div className="mx-5 mb-4 p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/10 relative group">
                  <button 
                    onClick={() => setSharedQuestion(null)}
                    className="absolute top-2 right-2 p-1 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-all text-white/60 hover:text-white"
                  >
                    <X size={14} weight="bold" />
                  </button>
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Attached Question</p>
                  <p className="text-sm font-medium text-white line-clamp-2">{sharedQuestion.body}</p>
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
