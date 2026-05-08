"use client";

import { useState, useRef } from "react";
import { Bold, Italic, Image as ImageIcon, Send, Loader2, X, MessageSquareShare, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { MedqsSelect } from "@/components/ui/MedqsSelect";

interface Props {
  user: {
    name: string;
    image?: string | null;
  };
  onPost: (content: string, imageUrl: string, options?: { isForumPost?: boolean; isChatMessage?: boolean; forumId?: string, attachments?: any[] }) => Promise<boolean>;
  forums?: { id: string; name: string }[];
}

export function PostComposerRedesigned({ user, onPost, forums }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [threadTo, setThreadTo] = useState<string>("");
  const [isThreadEnabled, setIsThreadEnabled] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const initials = user.name
    ? user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : "??";

  const handlePost = async () => {
    if (!content.trim() && attachments.length === 0) return;
    setIsPosting(true);
    // Backward compatibility: use first image for legacy imageUrl field
    const firstImage = attachments.find(a => a.type === 'image')?.url || "";
    const ok = await onPost(content, firstImage, {
      isForumPost: true,
      isChatMessage: isThreadEnabled,
      forumId: isThreadEnabled && threadTo ? threadTo : undefined,
      attachments
    });
    if (ok) {
      setContent("");
      setAttachments([]);
      setIsExpanded(false);
      setIsThreadEnabled(false);
    }
    setIsPosting(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    if (attachments.length + files.length > 10) {
      alert("Maximum 10 attachments allowed per post.");
      return;
    }

    setIsUploading(true);
    
    for (const file of files) {
      if (file.type.startsWith("video/")) {
        alert(`${file.name}: Videos are not supported in Forum storage.`);
        continue;
      }

      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/v1/debug/telegram-direct-upload", { method: "POST", body: fd });
        const data = await res.json();
        if (data.success) {
          const type = file.type.startsWith("image/") ? "image" : "file";
          const newAttachment = {
            url: `/api/v1/files/telegram/preview?fileId=${data.fileId}&type=${type}`,
            type,
            fileId: data.fileId
          };
          setAttachments(prev => [...prev, newAttachment]);
        }
      } catch (err) {
        console.error("Upload failed", err);
      }
    }
    
    setIsUploading(false);
    e.target.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const injectText = (prefix: string, suffix: string = "") => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;
    const before = text.substring(0, start);
    const after = text.substring(end);
    const selected = text.substring(start, end);
    const newText = `${before}${prefix}${selected}${suffix}${after}`;
    setContent(newText);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  return (
    <div className={cn(
      "mb-6 rounded-3xl border border-white/[0.05] bg-[#161523]/60 backdrop-blur-xl transition-all duration-500 shadow-2xl",
      isExpanded ? "p-6" : "p-4"
    )}>
      <div className="flex gap-4">
        {/* Avatar */}
        <div className="shrink-0 h-12 w-12 flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#534AB7] to-[#AFA9EC] border border-white/10 text-white font-black text-sm shadow-lg">
          {user.image ? (
            <img src={user.image} className="h-full w-full rounded-2xl object-cover" alt="" />
          ) : initials}
        </div>

        {/* Input Area */}
        <div className="flex-1 min-w-0">
          {!isExpanded ? (
            <button
              onClick={() => setIsExpanded(true)}
              className="w-full h-12 px-6 text-left text-white/20 bg-white/5 border border-white/[0.02] rounded-2xl hover:bg-white/[0.08] transition-all text-[15px] font-medium"
            >
              Share something with the community...
            </button>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <textarea
                ref={textareaRef}
                autoFocus
                placeholder="What's on your mind?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full bg-transparent border-none p-0 focus:ring-0 text-[17px] text-white placeholder:text-white/10 resize-none min-h-[120px] leading-relaxed font-medium"
              />

              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {attachments.map((at, i) => (
                    <div key={i} className="relative group rounded-xl overflow-hidden border border-white/10 shadow-xl bg-black/20">
                      {at.type === 'image' ? (
                        <img src={at.url} className="h-24 w-24 object-cover" alt="" />
                      ) : (
                        <div className="h-24 w-24 flex flex-col items-center justify-center p-2 text-center bg-white/5">
                           <Download className="h-6 w-6 text-[#AFA9EC] mb-1" />
                           <span className="text-[8px] font-black uppercase text-white/40 truncate w-full">File</span>
                        </div>
                      )}
                      <button
                        onClick={() => removeAttachment(i)}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 shadow-lg hover:bg-red-500 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {attachments.length < 10 && (
                    <label className="h-24 w-24 flex items-center justify-center rounded-xl border-2 border-dashed border-white/10 hover:border-[#534AB7] hover:bg-[#534AB7]/5 transition-all cursor-pointer">
                      <ImageIcon className="h-6 w-6 text-white/20" />
                      <input type="file" multiple className="hidden" onChange={handleFileUpload} />
                    </label>
                  )}
                </div>
              )}

              {/* Toolbar */}
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => injectText("**", "**")}
                    className="p-2.5 text-white/30 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                  >
                    <Bold className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => injectText("*", "*")}
                    className="p-2.5 text-white/30 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                  >
                    <Italic className="h-4 w-4" />
                  </button>
                  <label className="p-2.5 text-white/30 hover:text-[#AFA9EC] hover:bg-[#534AB7]/10 rounded-xl transition-all cursor-pointer group">
                    {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImageIcon className="h-5 w-5" />}
                    <input type="file" multiple className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                  </label>
                  
                  {forums && forums.length > 0 && (
                    <div className="flex items-center gap-2 ml-2 pl-3 border-l border-white/5">
                      <button
                        type="button"
                        onClick={() => setIsThreadEnabled(!isThreadEnabled)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-black uppercase tracking-wider transition-all",
                          isThreadEnabled 
                            ? "bg-[#534AB7] text-white shadow-lg shadow-[#534AB7]/30" 
                            : "text-white/20 hover:text-white/40"
                        )}
                      >
                        <MessageSquareShare className="h-4 w-4" />
                        Thread
                      </button>

                      {isThreadEnabled && (
                        <div className="animate-in slide-in-from-left-2 duration-300">
                          <MedqsSelect
                            value={threadTo}
                            onChange={(e) => setThreadTo(e.target.value)}
                            placeholder="Target..."
                            className="w-32 h-10 text-[10px] bg-white/5 border-white/10"
                          >
                            {forums.map(f => (
                              <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                          </MedqsSelect>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex flex-col items-end">
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-widest transition-colors",
                      content.length > 4500 ? "text-orange-500" : "text-white/10"
                    )}>
                      {content.length} / 5000
                    </span>
                  </div>
                  <button
                    onClick={handlePost}
                    disabled={isPosting || (!content.trim() && attachments.length === 0)}
                    className="flex items-center gap-2 px-8 py-3 bg-[#534AB7] text-white rounded-2xl text-[14px] font-black uppercase tracking-widest hover:bg-[#6056CD] hover:scale-105 disabled:opacity-20 disabled:scale-100 transition-all shadow-xl shadow-[#534AB7]/30"
                  >
                    {isPosting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Broadcast
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

