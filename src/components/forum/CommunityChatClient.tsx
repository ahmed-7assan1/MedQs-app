"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { MessageBubble } from "./MessageBubble";
import { VoiceRecorder } from "./VoiceRecorder";
import {
  PaperPlaneTilt,
  Microphone,
  Image as ImageIcon,
  Paperclip,
  X,
  CircleNotch,
  Users,
  ArrowDown,
  DownloadSimple,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

interface Author {
  id: string;
  name: string;
  image?: string | null;
  role: string;
  rank?: { label: string; badge?: string | null } | null;
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  author: Author;
  attachments?: any;
}

interface Props {
  currentUserId: string;
  currentUserName: string;
  currentUserImage?: string | null;
  universityName?: string;
  initialMessages: Message[];
}

export function CommunityChatClient({
  currentUserId,
  currentUserName,
  currentUserImage,
  universityName,
  initialMessages,
}: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const latestIdRef = useRef<string>(initialMessages[initialMessages.length - 1]?.id || "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ──────────────────────────────────────────────────────────────────
  // Scroll helpers
  // ──────────────────────────────────────────────────────────────────
  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "instant" });
  }, []);

  useEffect(() => {
    scrollToBottom(false);
  }, []);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setIsAtBottom(distFromBottom < 80);
    setShowScrollDown(distFromBottom > 200);
  };

  // ──────────────────────────────────────────────────────────────────
  // Polling for new messages every 4s
  // ──────────────────────────────────────────────────────────────────
  const fetchNewMessages = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/community/messages?limit=20");
      if (!res.ok) return;
      const data = await res.json();
      const incoming: Message[] = data.messages || [];
      if (!incoming.length) return;

      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const fresh = incoming.filter((m) => !existingIds.has(m.id));
        if (!fresh.length) return prev;
        const updated = [...prev, ...fresh];
        latestIdRef.current = updated[updated.length - 1].id;
        return updated;
      });

      // Auto-scroll if we were at bottom
      if (isAtBottom) setTimeout(() => scrollToBottom(), 50);
    } catch {}
  }, [isAtBottom, scrollToBottom]);

  useEffect(() => {
    pollingRef.current = setInterval(fetchNewMessages, 4000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [fetchNewMessages]);

  // ──────────────────────────────────────────────────────────────────
  // Send message
  // ──────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!text.trim() && attachments.length === 0) return;
    setIsSending(true);

    try {
      const res = await fetch("/api/v1/community/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text.trim(), attachments }),
      });
      const data = await res.json();
      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
        setText("");
        setAttachments([]);
        if (textareaRef.current) textareaRef.current.style.height = "auto";
        setTimeout(() => scrollToBottom(), 50);
      }
    } catch {
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ──────────────────────────────────────────────────────────────────
  // File upload to Telegram
  // ──────────────────────────────────────────────────────────────────
  const uploadToTelegram = async (file: File | Blob, name?: string) => {
    const fd = new FormData();
    const fileName = name || (file instanceof File ? file.name : `file_${Date.now()}`);
    fd.append("file", file, fileName);

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

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>, accept: string) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
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
    setIsRecording(false);
    setIsUploading(true);
    try {
      const att = await uploadToTelegram(blob, `voice_${Date.now()}.webm`);
      // Send voice immediately as a message
      const res = await fetch("/api/v1/community/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "", attachments: [att] }),
      });
      const data = await res.json();
      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
        setTimeout(() => scrollToBottom(), 50);
      }
    } catch {
      toast.error("Failed to send voice note");
    } finally {
      setIsUploading(false);
    }
  };

  const removeAttachment = (i: number) =>
    setAttachments((prev) => prev.filter((_, idx) => idx !== i));

  // Auto-grow textarea
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
  };

  // ──────────────────────────────────────────────────────────────────
  // Group messages by date
  // ──────────────────────────────────────────────────────────────────
  const grouped = messages.reduce<{ label: string; items: Message[] }[]>((acc, msg) => {
    const label = new Date(msg.createdAt).toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
    const last = acc[acc.length - 1];
    if (!last || last.label !== label) acc.push({ label, items: [msg] });
    else last.items.push(msg);
    return acc;
  }, []);

  return (
    <div className="flex flex-col h-[100dvh] bg-[#0B0A14] overflow-hidden">
      {/* ── Header ── */}
      <div className="flex-shrink-0 flex items-center gap-4 px-4 py-3 bg-[#12101E]/90 border-b border-white/[0.05] backdrop-blur-2xl">
        <div className="relative h-11 w-11 shrink-0">
          <div className="h-full w-full rounded-2xl bg-gradient-to-br from-[#534AB7] to-[#AFA9EC] flex items-center justify-center shadow-lg">
            <Users size={22} weight="fill" className="text-white" />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 bg-emerald-500 rounded-full border-2 border-[#12101E]" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-[15px] font-black text-white tracking-tight truncate">
            {universityName || "Community"} · Discussion
          </h1>
          <p className="text-[11px] text-white/30 font-bold">All members • Tap to send</p>
        </div>
      </div>

      {/* ── Messages ── */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5 no-scrollbar"
        style={{ backgroundImage: "radial-gradient(ellipse at top, #1a1530 0%, #0B0A14 70%)" }}
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 opacity-30">
            <Users size={56} className="text-white" />
            <p className="text-white font-black text-lg">No messages yet</p>
            <p className="text-white/50 text-sm text-center">Be the first to say something to the group!</p>
          </div>
        )}

        {grouped.map(({ label, items }) => (
          <div key={label}>
            {/* Date separator */}
            <div className="flex items-center justify-center py-3">
              <div className="px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.05]">
                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">{label}</span>
              </div>
            </div>

            {items.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isMine={msg.author.id === currentUserId}
              />
            ))}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Scroll to bottom button */}
      <AnimatePresence>
        {showScrollDown && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={() => scrollToBottom()}
            className="absolute bottom-24 right-5 h-10 w-10 rounded-full bg-[#534AB7] text-white flex items-center justify-center shadow-2xl shadow-[#534AB7]/40 z-20"
          >
            <ArrowDown size={20} weight="bold" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Composer ── */}
      <div className="flex-shrink-0 border-t border-white/[0.05] bg-[#12101E]/95 backdrop-blur-2xl px-3 py-3">
        {/* Voice Recorder Mode */}
        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mb-3"
            >
              <VoiceRecorder
                onStop={handleVoiceStop}
                onCancel={() => setIsRecording(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="flex gap-2 mb-3 flex-wrap">
            {attachments.map((a, i) => (
              <div key={i} className="relative group rounded-xl overflow-hidden border border-white/10 bg-black/20">
                {a.type === "image" ? (
                  <img src={a.url} alt="" className="h-16 w-16 object-cover" />
                ) : a.type === "audio" ? (
                  <div className="h-16 w-16 flex flex-col items-center justify-center bg-[#534AB7]/20">
                    <Microphone size={20} weight="fill" className="text-[#AFA9EC]" />
                    <span className="text-[8px] font-black text-white/50 mt-1">Voice</span>
                  </div>
                ) : (
                  <div className="h-16 w-16 flex flex-col items-center justify-center bg-white/5">
                    <DownloadSimple size={20} weight="bold" className="text-[#AFA9EC]" />
                    <span className="text-[8px] font-black text-white/40 mt-1">File</span>
                  </div>
                )}
                <button
                  onClick={() => removeAttachment(i)}
                  className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                >
                  <X size={10} weight="bold" className="text-white" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Row */}
        {!isRecording && (
          <div className="flex items-end gap-2">
            {/* Attach buttons */}
            <div className="flex gap-1.5 pb-2">
              <label className="h-9 w-9 flex items-center justify-center rounded-2xl text-white/30 hover:text-[#AFA9EC] hover:bg-[#534AB7]/10 transition-all cursor-pointer">
                <ImageIcon size={20} weight="bold" />
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileInput(e, "image/*")}
                  disabled={isUploading}
                />
              </label>
              <label className="h-9 w-9 flex items-center justify-center rounded-2xl text-white/30 hover:text-[#AFA9EC] hover:bg-[#534AB7]/10 transition-all cursor-pointer">
                <Paperclip size={20} weight="bold" />
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileInput(e, "*/*")}
                  disabled={isUploading}
                />
              </label>
            </div>

            {/* Text input */}
            <div className="flex-1 flex items-end bg-white/[0.04] border border-white/[0.07] rounded-[22px] overflow-hidden px-4 py-2.5">
              <textarea
                ref={textareaRef}
                value={text}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                placeholder="Message..."
                rows={1}
                className="w-full bg-transparent resize-none text-[14px] text-white placeholder:text-white/20 focus:outline-none font-medium leading-relaxed max-h-[140px] overflow-y-auto no-scrollbar"
              />
            </div>

            {/* Send / Mic */}
            <div className="pb-1">
              {text.trim() || attachments.length > 0 ? (
                <button
                  onClick={handleSend}
                  disabled={isSending}
                  className="h-10 w-10 rounded-2xl bg-[#534AB7] text-white flex items-center justify-center shadow-lg shadow-[#534AB7]/40 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSending || isUploading ? (
                    <CircleNotch size={20} weight="bold" className="animate-spin" />
                  ) : (
                    <PaperPlaneTilt size={20} weight="fill" className="ml-0.5" />
                  )}
                </button>
              ) : (
                <button
                  onClick={() => setIsRecording(true)}
                  className="h-10 w-10 rounded-2xl bg-white/[0.06] border border-white/[0.07] text-white/40 hover:text-[#AFA9EC] hover:bg-[#534AB7]/10 flex items-center justify-center transition-all"
                >
                  <Microphone size={20} weight="bold" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Uploading indicator */}
        {isUploading && (
          <div className="flex items-center gap-2 mt-2 ml-2">
            <CircleNotch size={14} weight="bold" className="animate-spin text-[#AFA9EC]" />
            <span className="text-[11px] font-bold text-white/30">Uploading to secure storage...</span>
          </div>
        )}
      </div>
    </div>
  );
}
