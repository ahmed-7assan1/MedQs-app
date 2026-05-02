"use client";

import { useState, useEffect } from "react";
import { Save, Sparkles, Wand2, Plus, Trash2, FileText, Loader2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface Note {
  id: string;
  content: string;
  updatedAt: string;
}

export function NotebookPanel({ lectureId }: { lectureId: string }) {
  const [note, setNote] = useState<Note | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  useEffect(() => {
    fetchNote();
  }, [lectureId]);

  async function fetchNote() {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/notebook?lectureId=${lectureId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.note) {
          setNote(data.note);
          setContent(data.note.content);
        }
      }
    } catch (err) {
      console.error("Failed to fetch note:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/v1/notebook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lectureId, content }),
      });
      if (res.ok) {
        const data = await res.json();
        setNote(data.note);
        toast.success("Note saved successfully");
      } else {
        toast.error("Failed to save note");
      }
    } catch (err) {
      toast.error("Error saving note");
    } finally {
      setSaving(false);
    }
  }

  async function handleAiAction(action: "summarize" | "flashcards") {
    if (!content.trim()) {
      toast.error("Please write something first");
      return;
    }
    setIsAiProcessing(true);
    const tid = toast.loading(action === "summarize" ? "Summarizing your notes..." : "Generating flashcards...");
    try {
      const res = await fetch("/api/v1/notebook/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lectureId, content, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI action failed");
      
      if (action === "summarize") {
        setContent(prev => prev + "\n\n--- AI Summary ---\n" + data.result);
        toast.success("Summary added!", { id: tid });
      } else {
        toast.success(`Generated ${data.count} flashcards from your notes!`, { id: tid });
      }
    } catch (err: any) {
      toast.error(err.message, { id: tid });
    } finally {
      setIsAiProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary/20" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="space-y-4">
        <div className="relative rounded-[32px] border border-black/5 dark:border-white/[0.03] bg-card overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between border-b border-black/5 dark:border-white/[0.03] px-6 py-4 bg-muted/20">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">My Lecture Notes</span>
            </div>
            <div className="flex items-center gap-2">
              {note && (
                <span className="text-[10px] text-muted-foreground/40 font-medium italic mr-2">
                  Last updated: {new Date(note.updatedAt).toLocaleTimeString()}
                </span>
              )}
              <button
                onClick={handleSave}
                disabled={saving || !content.trim()}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-[11px] font-black uppercase tracking-wider text-white shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                Save Note
              </button>
            </div>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start typing your personal notes for this lecture here... Tip: You can use AI to summarize them later!"
            className="w-full min-h-[400px] p-8 bg-transparent outline-none resize-none text-base leading-relaxed font-medium placeholder:text-muted-foreground/20 dark:text-white/80"
          />
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-[28px] border border-[#6C5FF0]/20 bg-[#6C5FF0]/5 p-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10">
            <Sparkles className="h-24 w-24 text-[#6C5FF0]" />
          </div>
          <div className="relative z-10">
            <p className="text-[13px] font-bold text-white mb-2">Smart Assistant</p>
            <p className="text-[11px] text-white/50 leading-relaxed mb-6">
              Use AI to process your notes. Summarize key points or turn your notes into flashcards.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => handleAiAction("summarize")}
                disabled={isAiProcessing || !content.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 py-3 text-[11px] font-bold text-white hover:bg-white/20 transition-all disabled:opacity-50"
              >
                <Wand2 className="h-3.5 w-3.5 text-amber-400" />
                AI Summarize
              </button>
              <button
                onClick={() => handleAiAction("flashcards")}
                disabled={isAiProcessing || !content.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#6C5FF0] py-3 text-[11px] font-bold text-white shadow-lg shadow-[#6C5FF0]/20 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" />
                Create Flashcards
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-black/5 dark:border-white/[0.03] bg-card/40 p-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-4">Lecture Context</p>
          <div className="space-y-4">
             <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                   <FileText className="h-4 w-4" />
                </div>
                <div>
                   <p className="text-[12px] font-bold">Integrated Review</p>
                   <p className="text-[10px] text-muted-foreground">Linked to this lecture</p>
                </div>
             </div>
             <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
                Your notes are private and only visible to you. They are synced across all your devices.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
