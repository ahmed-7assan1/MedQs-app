"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  FileText,
  Layers,
  HelpCircle,
  Video,
  Sparkles,
  PlayCircle,
  ChevronRight,
  GraduationCap,
  X,
  Loader2,
  Clock,
  ArrowLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LectureClient } from "@/components/content/LectureClient";
import ReactMarkdown from "react-markdown";
import { markdownComponentsWithImages } from "@/components/ui/MarkdownBody";
import { enhancePlainImageUrls } from "@/lib/markdown-helpers";
import { AIAssistantPanel } from "@/components/ai/AIAssistant";
import toast from "react-hot-toast";

type TabId = "overview" | "video" | "flashcards" | "questions" | "notes";

export function LectureExperienceClient({ lecture, moduleId }: { lecture: any; moduleId: string }) {
  const [active, setActive] = useState<TabId>("overview");
  const [showAiChat, setShowAiChat] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const tabs: { id: TabId; label: string; icon: any }[] = [
    { id: "overview", label: "Overview", icon: Layers },
    { id: "video", label: "Video", icon: Video },
    { id: "flashcards", label: "Flashcards", icon: HelpCircle },
    { id: "questions", label: "Quiz", icon: HelpCircle },
    { id: "notes", label: "Study Notes", icon: FileText },
  ];

  async function handleAnalyze() {
    setIsAnalyzing(true);
    const tid = toast.loading("AI is analyzing lecture content...");
    try {
      const res = await fetch("/api/v1/admin/ai/manus-agent", {
        method: "POST",
        body: JSON.stringify({ lectureId: lecture.id, url: "" }),
      });
      if (res.ok) {
        toast.success("Analysis complete! New cards and notes added.", { id: tid });
        window.location.reload();
      } else {
        toast.error("Analysis failed. Ensure valid lecture materials are attached.", { id: tid });
      }
    } catch (e) {
      toast.error("Connection error.", { id: tid });
    } finally {
      setIsAnalyzing(false);
    }
  }

  const base = `/modules/${moduleId}/lectures/${lecture.id}`;
  const extras = lecture.extras || {};

  return (
    <div className="flex flex-col min-h-screen bg-[#09080F] text-white">
      {/* ── Minimalist Hero ── */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#131220] to-[#09080F] pb-12 pt-8">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <Link href={`/modules/${moduleId}`} className="mb-6 inline-flex items-center gap-2 text-xs font-bold text-white/40 hover:text-white transition-colors">
            <ArrowLeft className="h-3 w-3" /> Back to Module
          </Link>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary ring-1 ring-primary/20">
                  {lecture?.subject?.name || "Academic Lecture"}
                </span>
              </div>
              <h1 className="font-display text-4xl font-black tracking-tight text-white md:text-5xl">
                {lecture.title.toLowerCase()}
              </h1>
              <p className="mt-3 text-sm font-medium text-white/40">
                {lecture?.flashcards?.length || 0} Flashcards • {lecture?.questions?.length || 0} Quiz Items
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2.5 text-xs font-bold text-white/70 hover:bg-white/10 transition-all border border-white/5"
              >
                {isAnalyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                Analyze
              </button>
              <button
                onClick={() => setShowAiChat(true)}
                className="btn-gradient flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-bold shadow-lg shadow-primary/20"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Ask Dr. Q
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Tab Navigation ── */}
      <div className="sticky top-0 z-50 border-b border-white/5 bg-[#09080F]/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <div className="flex gap-8 overflow-x-auto scrollbar-hide py-4">
            {tabs.map((tab) => {
              const active_ = active === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActive(tab.id)}
                  className={cn(
                    "relative whitespace-nowrap text-xs font-bold uppercase tracking-widest transition-colors",
                    active_ ? "text-primary" : "text-white/30 hover:text-white/60"
                  )}
                >
                  {tab.label}
                  {active_ && (
                    <span className="absolute -bottom-[17px] left-0 h-[2px] w-full bg-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Content Body ── */}
      <main className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {active === "overview" && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.isArray(extras?.overviewCards) && extras.overviewCards.length > 0 ? (
                extras.overviewCards.map((card: any, i: number) => (
                  <div key={i} className="rounded-2xl border border-white/5 bg-[#131220] p-6 shadow-sm">
                    <h5 className="mb-3 font-display text-base font-bold text-white">{card?.title}</h5>
                    <p className="text-sm leading-relaxed text-white/50">{card?.body}</p>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-20 text-center">
                  <Layers className="mx-auto h-10 w-10 text-white/10 mb-4" />
                  <p className="text-white/20 font-bold uppercase tracking-widest text-[10px]">No overview concepts found</p>
                </div>
              )}
            </div>
          )}

          {active === "video" && (
            <div className="flex flex-col items-center justify-center py-24 rounded-3xl border border-white/5 bg-[#131220] text-center">
              <PlayCircle className="h-16 w-16 text-primary mb-6" />
              <h3 className="text-xl font-bold text-white">Lecture Video Studio</h3>
              <p className="mt-2 text-white/40 max-w-sm text-sm">Access the interactive player with timestamps and shared notes.</p>
              <Link href={`${base}/video`} className="btn-gradient mt-8 rounded-xl px-8 py-3 text-sm font-bold">
                Open Player
              </Link>
            </div>
          )}

          {active === "flashcards" && (
            <div className="min-h-[400px]">
              {Array.isArray(lecture?.flashcards) && lecture.flashcards.length > 0 ? (
                <LectureClient flashcards={lecture.flashcards} questions={[]} mode="flashcards" />
              ) : (
                <div className="py-24 text-center rounded-2xl border border-dashed border-white/5">
                  <p className="text-white/20 font-bold uppercase tracking-widest text-[10px]">No flashcards available</p>
                </div>
              )}
            </div>
          )}

          {active === "questions" && (
            <div className="min-h-[400px]">
              {Array.isArray(lecture?.questions) && lecture.questions.length > 0 ? (
                <LectureClient flashcards={[]} questions={lecture.questions} mode="questions" />
              ) : (
                <div className="py-24 text-center rounded-2xl border border-dashed border-white/5">
                  <p className="text-white/20 font-bold uppercase tracking-widest text-[10px]">No quiz items available</p>
                </div>
              )}
            </div>
          )}

          {active === "notes" && (
            <div className="rounded-3xl border border-white/5 bg-[#131220] p-8 md:p-12 shadow-xl">
              {lecture?.notesMarkdown ? (
                <div className="prose prose-invert prose-sm max-w-none prose-headings:font-display prose-headings:font-bold prose-p:text-white/70">
                  <ReactMarkdown components={markdownComponentsWithImages}>
                    {enhancePlainImageUrls(lecture.notesMarkdown)}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="py-24 text-center">
                  <FileText className="mx-auto h-10 w-10 text-white/10 mb-4" />
                  <p className="text-white/20 font-bold uppercase tracking-widest text-[10px]">Notes haven't been generated yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* --- CHAT MODAL --- */}
      {showAiChat && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl bg-[#131220] rounded-3xl border border-white/10 shadow-2xl h-[80vh] overflow-hidden flex flex-col">
             <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <h3 className="font-bold">Ask Dr. Q</h3>
                <button onClick={() => setShowAiChat(false)} className="text-white/40 hover:text-white transition-colors">
                   <X className="h-5 w-5" />
                </button>
             </div>
             <div className="flex-1 overflow-hidden">
                <AIAssistantPanel embedded={true} fullPage={true} lectureId={lecture.id} lectureTitle={lecture.title} />
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
