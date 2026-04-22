"use client";

import { useState, useRef } from "react";
import { Bold, Italic, Image as ImageIcon, Send, Loader2, X, MessageSquareShare } from "lucide-react";
import { cn } from "@/lib/utils";
import { MedqsSelect } from "@/components/ui/MedqsSelect";

interface Props {
  user: {
    name: string;
    image?: string | null;
  };
  onPost: (content: string, imageUrl: string, options?: { isForumPost?: boolean; isChatMessage?: boolean; forumId?: string }) => Promise<boolean>;
  uploadImage: (file: File) => Promise<string | null>;
  forums?: { id: string; name: string }[];
}

export function PostComposerRedesigned({ user, onPost, uploadImage, forums }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [threadTo, setThreadTo] = useState<string>("");
  const [isThreadEnabled, setIsThreadEnabled] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const initials = user.name
    ? user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : "??";

  const handlePost = async () => {
    if (!content.trim() && !imageUrl.trim()) return;
    setIsPosting(true);
    const ok = await onPost(content, imageUrl, {
      isForumPost: true,
      isChatMessage: isThreadEnabled,
      forumId: isThreadEnabled && threadTo ? threadTo : undefined
    });
    if (ok) {
      setContent("");
      setImageUrl("");
      setIsExpanded(false);
      setIsThreadEnabled(false);
    }
    setIsPosting(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const url = await uploadImage(file);
    if (url) setImageUrl(url);
    setIsUploading(false);
    e.target.value = "";
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
      "mb-6 rounded-2xl border border-white/[0.02] bg-white/[0.04] transition-all duration-300",
      isExpanded ? "p-4" : "p-3"
    )}>
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-[#534AB7]/20 border border-[#534AB7]/30 text-[#AFA9EC] font-medium text-sm">
          {user.image ? (
            <img src={user.image} className="h-full w-full rounded-full object-cover" alt="" />
          ) : initials}
        </div>

        {/* Input Area */}
        <div className="flex-1 min-w-0">
          {!isExpanded ? (
            <button
              onClick={() => setIsExpanded(true)}
              className="w-full h-10 px-4 text-left text-white/30 bg-white/[0.02] border border-white/[0.02] rounded-xl hover:bg-white/[0.04] transition-colors text-[14px]"
            >
              What's on your mind?
            </button>
          ) : (
            <div className="space-y-3">
              <textarea
                ref={textareaRef}
                autoFocus
                placeholder="What's on your mind?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full bg-transparent border-none p-0 focus:ring-0 text-[15px] text-white placeholder:text-white/20 resize-none min-h-[100px]"
              />

              {imageUrl && (
                <div className="relative inline-block group">
                  <img src={imageUrl} className="h-32 w-auto rounded-lg border border-white/[0.1] object-cover" alt="" />
                  <button
                    onClick={() => setImageUrl("")}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}

              {/* Toolbar */}
              <div className="flex items-center justify-between pt-3 border-t border-white/[0.02]">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => injectText("**", "**")}
                    className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                    title="Bold"
                  >
                    <Bold className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => injectText("*", "*")}
                    className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                    title="Italic"
                  >
                    <Italic className="h-4 w-4" />
                  </button>
                  <label className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer">
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                  </label>
                  
                  {forums && forums.length > 0 && (
                    <div className="flex items-center gap-2 ml-2 pl-2 border-l border-white/[0.05]">
                      <button
                        type="button"
                        onClick={() => setIsThreadEnabled(!isThreadEnabled)}
                        className={cn(
                          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all",
                          isThreadEnabled 
                            ? "bg-[#534AB7]/20 text-[#AFA9EC] border border-[#534AB7]/30" 
                            : "text-white/20 hover:text-white/40 border border-transparent"
                        )}
                      >
                        <MessageSquareShare className="h-3.5 w-3.5" />
                        Thread
                      </button>
                      
                      {isThreadEnabled && (
                        <MedqsSelect
                          value={threadTo}
                          onChange={(e) => setThreadTo(e.target.value)}
                          placeholder="Select chat..."
                          className="w-32 h-8 text-[10px]"
                        >
                          {forums.map(f => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                          ))}
                        </MedqsSelect>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className={cn(
                    "text-[11px] font-medium transition-colors",
                    content.length > 4500 ? "text-orange-500" : "text-white/20"
                  )}>
                    {content.length}/5000
                  </span>
                  <button
                    onClick={handlePost}
                    disabled={isPosting || (!content.trim() && !imageUrl.trim())}
                    className="flex items-center gap-2 px-5 py-2 bg-[#534AB7] text-white rounded-full text-[13px] font-medium hover:bg-[#534AB7]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#534AB7]/20"
                  >
                    {isPosting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Post
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

