"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileText, Layers, HelpCircle, Video, Sparkles, PlayCircle,
  ArrowLeft, CheckCircle2, BookOpen, Brain, Zap, Star,
  AlignLeft, ChevronRight, Music2, Mic2, Radio, ExternalLink,
  Youtube, Play, Download, FileImage, FolderArchive,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LectureClient } from "@/components/content/LectureClient";
import ReactMarkdown from "react-markdown";
import { markdownComponentsWithImages } from "@/components/ui/MarkdownBody";
import { enhancePlainImageUrls } from "@/lib/markdown-helpers";
import { AIAssistantPanel } from "@/components/ai/AIAssistant";

type TabId = "overview" | "video" | "recordings" | "flashcards" | "questions" | "notes" | "drq";

const TAB_META: Record<string, { icon: any; color: string }> = {
  overview:   { icon: Layers,       color: "text-violet-500"  },
  video:      { icon: PlayCircle,   color: "text-sky-500"     },
  materials:  { icon: FolderArchive,color: "text-orange-500"  },
  recordings: { icon: Mic2,         color: "text-pink-500"    },
  flashcards: { icon: Brain,        color: "text-amber-500"   },
  questions:  { icon: CheckCircle2, color: "text-emerald-500" },
  notes:      { icon: AlignLeft,    color: "text-rose-400"    },
  drq:        { icon: Sparkles,     color: "text-primary"     },
};

function FileCard({ file }: { file: { id: string; name: string; url: string; mimeType: string } }) {
  const isPDF = file.mimeType.includes("pdf");
  const isImg = file.mimeType.includes("image");

  return (
    <a
      href={file.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:border-orange-500/20 hover:shadow-md hover:-translate-y-0.5"
    >
      <div className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors",
        isPDF ? "bg-red-500/10" : isImg ? "bg-sky-500/10" : "bg-orange-500/10"
      )}>
        {isPDF ? <FileText className="h-5 w-5 text-red-500" /> :
         isImg ? <FileImage className="h-5 w-5 text-sky-500" /> :
                 <FolderArchive className="h-5 w-5 text-orange-500" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-bold text-card-foreground group-hover:text-primary transition-colors">
          {file.name}
        </p>
        <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {file.mimeType.split("/")[1] || "File"}
        </p>
      </div>
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all">
        <Download className="h-4 w-4" />
      </div>
    </a>
  );
}

/* ── helpers ── */
function getRecordEmbed(url: string): { type: "youtube" | "spotify" | "other"; embedUrl: string; id?: string } {
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  if (yt) return { type: "youtube", embedUrl: `https://www.youtube.com/embed/${yt[1]}?rel=0&modestbranding=1&enablejsapi=1`, id: yt[1] };

  if (url.includes("spotify.com")) {
    // Convert share URL → embed URL
    const embedUrl = url.replace("open.spotify.com/", "open.spotify.com/embed/").replace(/\?.*$/, "");
    return { type: "spotify", embedUrl };
  }
  return { type: "other", embedUrl: url };
}

function RecordCard({ record }: { record: { id: string; title: string; url: string; sourceType: string } }) {
  const [open, setOpen] = useState(false);
  const embed = getRecordEmbed(record.url);

  const isYT = embed.type === "youtube";
  const isSpotify = embed.type === "spotify";

  return (
    <div className={cn(
      "group rounded-2xl border border-border bg-card shadow-sm transition-all overflow-hidden",
      open ? "shadow-lg" : "hover:shadow-md hover:-translate-y-0.5 hover:border-pink-500/20"
    )}>
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-4 p-4 text-left"
      >
        {/* Icon */}
        <div className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors",
          isYT      ? "bg-red-500/10"   :
          isSpotify ? "bg-green-500/10" : "bg-pink-500/10"
        )}>
          {isYT      ? <Youtube className="h-5 w-5 text-red-500" />   :
           isSpotify ? <Music2  className="h-5 w-5 text-green-500" /> :
                       <Radio   className="h-5 w-5 text-pink-500" />}
        </div>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-bold text-card-foreground group-hover:text-primary transition-colors">
            {record.title}
          </p>
          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {isYT ? "YouTube" : isSpotify ? "Spotify" : record.sourceType}
          </p>
        </div>

        {/* Play pill */}
        <div className={cn(
          "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all",
          open
            ? "bg-primary text-white"
            : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
        )}>
          <Play className="h-3 w-3" />
          {open ? "Playing" : "Play"}
        </div>
      </button>

      {/* Embedded player */}
      {open && (
        <div className="border-t border-border">
          {isYT ? (
            <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
              <iframe
                src={embed.embedUrl}
                className="absolute inset-0 h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={record.title}
              />
            </div>
          ) : isSpotify ? (
            <iframe
              src={embed.embedUrl}
              height="152"
              className="w-full"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              title={record.title}
            />
          ) : (
            <div className="flex items-center justify-center p-6 gap-3">
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
              <a
                href={record.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-bold text-primary hover:underline"
              >
                Open Recording
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function LectureExperienceClient({
  lecture, moduleId, isAdmin = false,
}: { lecture: any; moduleId: string; isAdmin?: boolean }) {
  const [active, setActive] = useState<TabId>("overview");

  const recordCount   = lecture?.records?.length || 0;
  const fileCount     = lecture?.files?.length || 0;
  const flashcardCount = lecture?.flashcards?.length || 0;
  const questionCount  = lecture?.questions?.length  || 0;
  const hasNotes       = !!lecture?.notesMarkdown;

  const tabs: { id: TabId; label: string }[] = [
    { id: "overview",   label: "Overview"   },
    { id: "video",      label: "Video"      },
    { id: "materials",  label: `Materials${fileCount > 0 ? ` (${fileCount})` : ""}` },
    { id: "recordings", label: `Recordings${recordCount > 0 ? ` (${recordCount})` : ""}` },
    { id: "flashcards", label: "Flashcards" },
    { id: "questions",  label: "Quiz"       },
    { id: "notes",      label: "Notes"      },
  ];
  if (isAdmin) tabs.push({ id: "drq", label: "Dr. Q" });

  const base   = `/modules/${moduleId}/lectures/${lecture.id}`;
  const extras = lecture.extras || {};

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">

      {/* ══════════════ HERO ══════════════ */}
      <div className="relative overflow-hidden pt-14">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 left-1/4 h-96 w-96 rounded-full bg-primary/10 blur-[100px]" />
          <div className="absolute -top-12 right-0 h-64 w-64 rounded-full bg-violet-500/8 blur-[80px]" />
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-6 md:px-8">
          {/* Breadcrumb */}
          <Link
            href={`/modules/${moduleId}`}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5 text-[11px] font-bold text-muted-foreground backdrop-blur-sm transition-all hover:border-primary/30 hover:text-primary hover:bg-primary/5"
          >
            <ArrowLeft className="h-3 w-3" /> Back to Module
          </Link>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            {/* Left — Title */}
            <div className="flex-1 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-primary ring-1 ring-primary/20">
                  <BookOpen className="h-3 w-3" />
                  {lecture?.subject?.name || "Academic Lecture"}
                </span>
                {lecture?.order != null && (
                  <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Lecture #{lecture.order}
                  </span>
                )}
              </div>

              <h1 className="font-display text-4xl font-black leading-tight tracking-tight text-foreground md:text-5xl capitalize">
                {lecture.title}
              </h1>

              {/* Stats */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <StatPill icon={Brain}     label="Flashcards" value={flashcardCount} color="text-amber-500" />
                <StatPill icon={CheckCircle2} label="Quiz"    value={questionCount}  color="text-emerald-500" />
                <StatPill icon={FolderArchive} label="Files"   value={fileCount}      color="text-orange-500" />
                <StatPill icon={Mic2}      label="Recordings" value={recordCount}    color="text-pink-500" />
                <StatPill icon={FileText}  label="Notes"      value={hasNotes ? "Yes" : "—"} color="text-rose-400" />
              </div>
            </div>

            {/* Right — Quick actions */}
            <div className="flex flex-col gap-3 lg:w-72 shrink-0">
              <Link
                href={`${base}/video`}
                className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sky-500/30 hover:shadow-sky-500/10"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-500/10">
                  <PlayCircle className="h-5 w-5 text-sky-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">Watch Lecture</p>
                  <p className="text-[11px] text-muted-foreground">Open Video Player</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-sky-500 transition-colors" />
              </Link>

              {recordCount > 0 && (
                <button
                  onClick={() => setActive("recordings")}
                  className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-pink-500/30 hover:shadow-pink-500/10"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-pink-500/10">
                    <Mic2 className="h-5 w-5 text-pink-500" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-bold text-foreground">Recordings</p>
                    <p className="text-[11px] text-muted-foreground">{recordCount} audio/video records</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-pink-500 transition-colors" />
                </button>
              )}

              {questionCount > 0 && (
                <button
                  onClick={() => setActive("questions")}
                  className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-500/30 hover:shadow-emerald-500/10"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                    <Zap className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-bold text-foreground">Quick Quiz</p>
                    <p className="text-[11px] text-muted-foreground">{questionCount} MCQ questions</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-emerald-500 transition-colors" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════ TAB BAR ══════════════ */}
      <div className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => {
              const meta    = TAB_META[tab.id] || TAB_META.overview;
              const active_ = active === tab.id;
              const Icon    = meta.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActive(tab.id)}
                  className={cn(
                    "relative flex shrink-0 items-center gap-2 px-4 py-3 text-[11px] font-bold uppercase tracking-widest transition-all",
                    active_ ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className={cn("h-3.5 w-3.5 transition-colors", active_ ? meta.color : "text-muted-foreground/60")} />
                  {tab.label}
                  {active_ && (
                    <span className={cn("absolute bottom-0 left-0 h-[2px] w-full rounded-full", meta.color, "bg-current")} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ══════════════ CONTENT ══════════════ */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-8">
        <div key={active} className="animate-in fade-in slide-in-from-bottom-2 duration-300">

          {/* Overview */}
          {active === "overview" && (
            <div className="space-y-6">
              {Array.isArray(extras?.overviewCards) && extras.overviewCards.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {extras.overviewCards.map((card: any, i: number) => (
                    <div key={i} className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:border-primary/20 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5">
                      <div className="absolute top-0 right-0 h-20 w-20 rounded-full bg-primary/5 blur-2xl" />
                      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <Star className="h-4 w-4 text-primary" />
                      </div>
                      <h5 className="mb-2 font-display text-sm font-bold text-card-foreground">{card?.title}</h5>
                      <p className="text-sm leading-relaxed text-muted-foreground">{card?.body}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={Layers} title="No Overview Yet" desc="Overview cards will appear here once the lecture is analyzed." color="violet" />
              )}
            </div>
          )}

          {/* Video */}
          {active === "video" && (
            <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-xl">
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-48 w-48 rounded-full bg-sky-500/10 blur-3xl" />
              </div>
              <div className="relative flex flex-col items-center justify-center py-20 text-center px-6">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[28px] bg-sky-500/10 ring-1 ring-sky-500/20 shadow-xl shadow-sky-500/10">
                  <PlayCircle className="h-10 w-10 text-sky-500" />
                </div>
                <h3 className="text-2xl font-black text-card-foreground">Lecture Video Studio</h3>
                <p className="mt-3 max-w-sm text-sm text-muted-foreground leading-relaxed">
                  Access the full interactive player with timestamps, shared notes, and speed controls.
                </p>
                <Link href={`${base}/video`} className="btn-gradient mt-8 inline-flex items-center gap-2 rounded-2xl px-8 py-3.5 text-sm font-bold shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-shadow">
                  <PlayCircle className="h-4 w-4" /> Open Player
                </Link>
              </div>
            </div>
          )}

          {/* ── MATERIALS (FILES) ── */}
          {active === "materials" && (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10">
                  <FolderArchive className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-foreground">Lecture Materials</h2>
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                    {fileCount} {fileCount === 1 ? "document" : "documents"} available
                  </p>
                </div>
              </div>

              {fileCount > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {lecture.files.map((file: any) => (
                    <FileCard key={file.id} file={file} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={FolderArchive}
                  title="No Materials Yet"
                  desc="Downloadable files and PDFs for this lecture haven't been uploaded yet."
                  color="orange"
                />
              )}
            </div>
          )}

          {/* ── RECORDINGS ── */}
          {active === "recordings" && (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500/10">
                  <Mic2 className="h-5 w-5 text-pink-500" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-foreground">Lecture Recordings</h2>
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                    {recordCount} {recordCount === 1 ? "record" : "records"} available
                  </p>
                </div>
              </div>

              {recordCount > 0 ? (
                <div className="space-y-3">
                  {lecture.records.map((record: any) => (
                    <RecordCard key={record.id} record={record} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Mic2}
                  title="No Recordings Yet"
                  desc="Audio and video recordings for this lecture haven't been uploaded yet. Check back soon."
                  color="pink"
                />
              )}
            </div>
          )}

          {/* Flashcards */}
          {active === "flashcards" && (
            <div className="min-h-[400px]">
              {flashcardCount > 0 ? (
                <LectureClient flashcards={lecture.flashcards} questions={[]} mode="flashcards" />
              ) : (
                <EmptyState icon={Brain} title="No Flashcards Yet" desc="Flashcards for this lecture haven't been created yet." color="amber" />
              )}
            </div>
          )}

          {/* Quiz */}
          {active === "questions" && (
            <div className="min-h-[400px]">
              {questionCount > 0 ? (
                <LectureClient flashcards={[]} questions={lecture.questions} mode="questions" />
              ) : (
                <EmptyState icon={CheckCircle2} title="No Quiz Items Yet" desc="MCQ questions for this lecture will appear here once added." color="emerald" />
              )}
            </div>
          )}

          {/* Notes */}
          {active === "notes" && (
            <div className="rounded-3xl border border-border bg-card shadow-xl overflow-hidden">
              {hasNotes ? (
                <div className="p-8 md:p-12">
                  <div className="mb-8 flex items-center gap-3 pb-6 border-b border-border">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-400/10">
                      <AlignLeft className="h-5 w-5 text-rose-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Study Notes</p>
                      <h2 className="text-lg font-black text-foreground">{lecture.title}</h2>
                    </div>
                  </div>
                  <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-display prose-headings:font-bold prose-headings:tracking-tight prose-p:leading-relaxed prose-p:text-muted-foreground">
                    <ReactMarkdown components={markdownComponentsWithImages}>
                      {enhancePlainImageUrls(lecture.notesMarkdown)}
                    </ReactMarkdown>
                  </div>
                </div>
              ) : (
                <EmptyState icon={FileText} title="Notes Not Generated" desc="Study notes haven't been added to this lecture yet." color="rose" />
              )}
            </div>
          )}

          {/* Dr. Q */}
          {active === "drq" && isAdmin && (
            <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-xl">
              <div className="flex items-center gap-3 border-b border-border px-6 py-4 bg-gradient-to-r from-primary/5 to-transparent">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">AI Assistant</p>
                  <h3 className="text-sm font-black text-foreground">Ask Dr. Q</h3>
                </div>
                <span className="ml-auto rounded-full bg-primary/10 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-primary border border-primary/20">Admin</span>
              </div>
              <div className="h-[560px]">
                <AIAssistantPanel embedded fullPage lectureId={lecture.id} lectureTitle={lecture.title} />
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

/* ── Sub-components ── */

function StatPill({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 shadow-sm">
      <Icon className={cn("h-3.5 w-3.5 shrink-0", color)} />
      <div className="flex items-baseline gap-1.5">
        <span className="text-sm font-black text-foreground">{value}</span>
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</span>
      </div>
    </div>
  );
}

const EMPTY_COLORS: Record<string, { bg: string; icon: string; ring: string }> = {
  violet:  { bg: "bg-violet-500/10",  icon: "text-violet-500",  ring: "ring-violet-500/20"  },
  amber:   { bg: "bg-amber-500/10",   icon: "text-amber-500",   ring: "ring-amber-500/20"   },
  emerald: { bg: "bg-emerald-500/10", icon: "text-emerald-500", ring: "ring-emerald-500/20" },
  rose:    { bg: "bg-rose-400/10",    icon: "text-rose-400",    ring: "ring-rose-400/20"    },
  pink:    { bg: "bg-pink-500/10",    icon: "text-pink-500",    ring: "ring-pink-500/20"    },
  sky:     { bg: "bg-sky-500/10",     icon: "text-sky-500",     ring: "ring-sky-500/20"     },
  orange:  { bg: "bg-orange-500/10",  icon: "text-orange-500",  ring: "ring-orange-500/20"  },
};

function EmptyState({ icon: Icon, title, desc, color = "violet" }: { icon: any; title: string; desc: string; color?: string }) {
  const c = EMPTY_COLORS[color] || EMPTY_COLORS.violet;
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-muted/30 py-24 text-center px-6">
      <div className={cn("mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ring-1", c.bg, c.ring)}>
        <Icon className={cn("h-7 w-7", c.icon)} />
      </div>
      <h4 className="text-base font-black text-foreground">{title}</h4>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
