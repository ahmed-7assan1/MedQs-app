"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  FileText,
  Layers,
  HelpCircle,
  Video,
  NotebookPen,
  Search,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LectureClient } from "@/components/content/LectureClient";
import ReactMarkdown from "react-markdown";
import { markdownComponentsWithImages } from "@/components/ui/MarkdownBody";
import { enhancePlainImageUrls } from "@/lib/markdown-helpers";

type TabId =
  | "overview"
  | "video"
  | "attachments"
  | "flashcards"
  | "questions"
  | "notes"
  | "mindmaps"
  | "cases"
  | "mnemonics";

type LectureLike = any;

type MindMapGraph = {
  nodes: { id: string; label: string; detail?: string; level?: number; shape?: "hex" | "circle" | "card" }[];
  edges: { from: string; to: string }[];
};

function hexClip() {
  return "polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%)";
}

function MindMapCanvas({ graph }: { graph: MindMapGraph }) {
  const nodes = Array.isArray(graph?.nodes) ? graph.nodes : [];
  const edges = Array.isArray(graph?.edges) ? graph.edges : [];
  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  // Derive levels if missing, based on edges from a root-ish node.
  const levelById = useMemo(() => {
    const m = new Map<string, number>();
    for (const n of nodes) if (typeof n.level === "number") m.set(n.id, n.level);
    if (m.size > 0) return m;
    const incoming = new Map<string, number>();
    for (const e of edges) incoming.set(e.to, (incoming.get(e.to) ?? 0) + 1);
    const root = nodes.find((n) => (incoming.get(n.id) ?? 0) === 0) ?? nodes[0];
    if (!root) return m;
    m.set(root.id, 0);
    let changed = true;
    while (changed) {
      changed = false;
      for (const e of edges) {
        const a = m.get(e.from);
        if (a == null) continue;
        const b = m.get(e.to);
        if (b == null || b > a + 1) {
          m.set(e.to, a + 1);
          changed = true;
        }
      }
    }
    return m;
  }, [nodes, edges]);

  const layout = useMemo(() => {
    const groups = new Map<number, string[]>();
    for (const n of nodes) {
      const lv = levelById.get(n.id) ?? 0;
      if (!groups.has(lv)) groups.set(lv, []);
      groups.get(lv)!.push(n.id);
    }
    const levels = Array.from(groups.keys()).sort((a, b) => a - b);
    const pos = new Map<string, { x: number; y: number }>();
    const xGap = 240;
    const yGap = 110;
    for (const lv of levels) {
      const ids = groups.get(lv)!;
      ids.sort();
      const totalH = (ids.length - 1) * yGap;
      ids.forEach((id, i) => {
        pos.set(id, { x: lv * xGap, y: i * yGap - totalH / 2 });
      });
    }
    return { pos, levels };
  }, [nodes, levelById]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState<null | { x: number; y: number; px: number; py: number }>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && Math.abs(e.deltaY) < 1) return;
      e.preventDefault();
      const next = Math.max(0.6, Math.min(1.6, scale - e.deltaY * 0.001));
      setScale(next);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel as any);
  }, [scale]);

  const sel = selectedId ? byId.get(selectedId) : null;

  return (
    <div className="grid min-h-[520px] gap-3 lg:grid-cols-[1fr_320px]">
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-2xl border border-border bg-background/40"
        onPointerDown={(e) => {
          if ((e.target as HTMLElement)?.closest?.("[data-node]")) return;
          (e.currentTarget as any).setPointerCapture?.(e.pointerId);
          setDragging({ x: e.clientX, y: e.clientY, px: pan.x, py: pan.y });
        }}
        onPointerMove={(e) => {
          if (!dragging) return;
          setPan({ x: dragging.px + (e.clientX - dragging.x), y: dragging.py + (e.clientY - dragging.y) });
        }}
        onPointerUp={() => setDragging(null)}
      >
        <div
          className="absolute left-1/2 top-1/2 will-change-transform"
          style={{ transform: `translate(${pan.x}px,${pan.y}px) translate(-50%,-50%) scale(${scale})` }}
        >
          <svg className="absolute inset-0 -z-10" width={1600} height={1200} viewBox="-800 -600 1600 1200">
            {edges.map((e, i) => {
              const a = layout.pos.get(e.from);
              const b = layout.pos.get(e.to);
              if (!a || !b) return null;
              const midX = (a.x + b.x) / 2;
              return (
                <path
                  key={`${e.from}-${e.to}-${i}`}
                  d={`M ${a.x} ${a.y} C ${midX} ${a.y}, ${midX} ${b.y}, ${b.x} ${b.y}`}
                  fill="none"
                  stroke="hsl(var(--primary) / 0.30)"
                  strokeWidth="2"
                />
              );
            })}
          </svg>

          {nodes.map((n) => {
            const p = layout.pos.get(n.id) ?? { x: 0, y: 0 };
            const isSel = selectedId === n.id;
            const shape = n.shape ?? ((levelById.get(n.id) ?? 0) === 0 ? "hex" : "circle");
            const baseCls =
              "select-none shadow-sm transition-transform duration-200 hover:-translate-y-0.5";
            const selCls = isSel ? "ring-2 ring-ring" : "";
            const w = shape === "card" ? 220 : 150;
            const h = shape === "card" ? 72 : 64;
            return (
              <button
                key={n.id}
                type="button"
                data-node
                onClick={() => setSelectedId(n.id)}
                className={cn(
                  "absolute flex items-center justify-center border px-4 text-left",
                  baseCls,
                  selCls,
                  shape === "circle" ? "rounded-full" : "rounded-2xl",
                  "bg-card/85 border-border hover:border-primary/40"
                )}
                style={{
                  left: p.x - w / 2,
                  top: p.y - h / 2,
                  width: w,
                  height: h,
                  clipPath: shape === "hex" ? hexClip() : undefined,
                }}
              >
                <span className="text-sm font-semibold">{n.label}</span>
              </button>
            );
          })}
        </div>

        <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="rounded-full border border-border bg-card/70 px-2 py-1">Drag to pan</span>
          <span className="rounded-full border border-border bg-card/70 px-2 py-1">Ctrl + wheel to zoom</span>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card/60 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Node details</p>
        {sel ? (
          <>
            <p className="mt-2 text-lg font-bold">{sel.label}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {sel.detail?.trim() ? sel.detail : "Select a node to see details."}
            </p>
          </>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">Tap a node on the map.</p>
        )}
      </div>
    </div>
  );
}

function safeString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function getTabs(lecture: LectureLike) {
  const ui = (lecture?.uiConfig ?? {}) as any;
  const enabled = (ui?.tabs ?? {}) as Record<string, boolean>;

  // Core tabs default on (if content exists).
  const hasVideo = Boolean((lecture?.videos?.length ?? 0) > 0 || safeString(lecture?.videoUrl).trim());
  const hasFiles = (lecture?.files?.length ?? 0) > 0;
  const hasCards = (lecture?.flashcards?.length ?? 0) > 0;
  const hasQs = (lecture?.questions?.length ?? 0) > 0;
  const hasNotes = Boolean(safeString(lecture?.notesMarkdown).trim());

  const extras = (lecture?.extras ?? {}) as any;
  const hasMindmaps = Boolean(safeString(extras?.mindMapsMarkdown).trim());
  const hasCases = Array.isArray(extras?.cases) && extras.cases.length > 0;
  const hasMnemonics = Array.isArray(extras?.mnemonics) && extras.mnemonics.length > 0;

  const tabs: Array<{ id: TabId; label: string; icon: any; show: boolean }> = [
    { id: "overview", label: "Overview", icon: BookOpen, show: enabled.overview ?? true },
    { id: "video", label: "Video", icon: Video, show: enabled.video ?? hasVideo },
    { id: "attachments", label: "Attachments", icon: FileText, show: enabled.attachments ?? hasFiles },
    { id: "flashcards", label: "Flashcards", icon: Layers, show: enabled.flashcards ?? hasCards },
    { id: "questions", label: "Quiz", icon: HelpCircle, show: enabled.questions ?? hasQs },
    { id: "notes", label: "Notes", icon: NotebookPen, show: enabled.notes ?? hasNotes },
    // Extras appear only if content exists AND doctor didn't hide them.
    { id: "mindmaps", label: "Mind maps", icon: Sparkles, show: (enabled.mindmaps ?? true) && hasMindmaps },
    { id: "cases", label: "Cases", icon: Sparkles, show: (enabled.cases ?? true) && hasCases },
    { id: "mnemonics", label: "Mnemonics", icon: Sparkles, show: (enabled.mnemonics ?? true) && hasMnemonics },
  ];

  return tabs.filter((t) => t.show);
}

export function LectureExperienceClient({
  lecture,
  moduleId,
}: {
  lecture: LectureLike;
  moduleId: string;
}) {
  const ui = (lecture?.uiConfig ?? {}) as any;
  const extras = (lecture?.extras ?? {}) as any;

  const badge = safeString(ui?.badge).trim() || `${lecture?.subject?.module?.name ?? "Module"} · Interactive Lecture`;
  const subtitle =
    safeString(ui?.subtitle).trim() ||
    `${lecture?.subject?.name ?? "Subject"} · Flashcards · Quiz · Notes`;

  const tabs = useMemo(() => getTabs(lecture), [lecture]);
  const [active, setActive] = useState<TabId>((tabs[0]?.id as TabId) ?? "overview");

  useEffect(() => {
    // If the active tab disappeared (doctor disabled it), fall back.
    if (!tabs.find((t) => t.id === active)) setActive((tabs[0]?.id as TabId) ?? "overview");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabs.map((t) => t.id).join("|")]);

  // Search
  const [q, setQ] = useState("");
  const [showResults, setShowResults] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const searchItems = useMemo(() => {
    const items: Array<{ tab: TabId; title: string; text: string }> = [];

    const cards = Array.isArray(extras?.overviewCards) ? extras.overviewCards : [];
    for (const c of cards) {
      items.push({ tab: "overview", title: safeString(c?.title) || "Card", text: safeString(c?.body) });
    }

    const notes = safeString(lecture?.notesMarkdown);
    if (notes.trim()) items.push({ tab: "notes", title: "Notes", text: notes });

    const fcs = Array.isArray(lecture?.flashcards) ? lecture.flashcards : [];
    for (const c of fcs) items.push({ tab: "flashcards", title: safeString(c?.front) || "Flashcard", text: safeString(c?.back) });

    const qs = Array.isArray(lecture?.questions) ? lecture.questions : [];
    for (const qu of qs) items.push({ tab: "questions", title: "Question", text: safeString(qu?.body) });

    const mm = safeString(extras?.mindMapsMarkdown);
    if (mm.trim()) items.push({ tab: "mindmaps", title: "Mind maps", text: mm });

    const mns = Array.isArray(extras?.mnemonics) ? extras.mnemonics : [];
    for (const m of mns) items.push({ tab: "mnemonics", title: safeString(m?.title) || "Mnemonic", text: safeString(m?.word) + " " + safeString(m?.topic) });

    const cases = Array.isArray(extras?.cases) ? extras.cases : [];
    for (const c of cases) items.push({ tab: "cases", title: safeString(c?.title) || "Case", text: safeString(c?.vignette) });

    return items;
  }, [extras, lecture]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (s.length < 2) return [];
    return searchItems
      .map((it) => {
        const blob = `${it.title}\n${it.text}`.toLowerCase();
        const idx = blob.indexOf(s);
        return idx >= 0 ? { ...it, idx } : null;
      })
      .filter(Boolean)
      .slice(0, 10) as Array<{ tab: TabId; title: string; text: string; idx: number }>;
  }, [q, searchItems]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!resultsRef.current) return;
      if (!resultsRef.current.contains(e.target as Node)) setShowResults(false);
    }
    if (!showResults) return;
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [showResults]);

  const base = `/modules/${moduleId}/lectures/${lecture?.id}`;

  return (
    <div className="relative min-h-0 flex-1">
      {/* background orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="medqs-lecture-bg" />
        <div className="medqs-orb medqs-orb--1" />
        <div className="medqs-orb medqs-orb--2" />
        <div className="medqs-orb medqs-orb--3" />
      </div>

      <div className="relative mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col px-3 pb-8 pt-6 sm:px-6">
        {/* header */}
        <div className="mb-4 flex flex-col items-center text-center">
          <div className="rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-[11px] font-semibold tracking-[0.22em] text-primary">
            {badge}
          </div>
          <h1 className="mt-3 bg-gradient-to-br from-foreground via-primary to-foreground bg-clip-text font-display text-3xl font-black tracking-tight text-transparent sm:text-4xl">
            {lecture?.title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
        </div>

        {/* stats + search */}
        <div className="mb-3 grid gap-2 md:grid-cols-[1fr_420px]">
          <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
            <div className="rounded-full border border-border bg-card/70 px-4 py-2 text-xs text-muted-foreground">
              Flashcards{" "}
              <span className="ml-1 font-semibold text-primary">
                {(lecture?.flashcards?.length ?? 0).toString()}
              </span>
            </div>
            <div className="rounded-full border border-border bg-card/70 px-4 py-2 text-xs text-muted-foreground">
              Questions{" "}
              <span className="ml-1 font-semibold text-primary">
                {(lecture?.questions?.length ?? 0).toString()}
              </span>
            </div>
            <div className="rounded-full border border-border bg-card/70 px-4 py-2 text-xs text-muted-foreground">
              Files{" "}
              <span className="ml-1 font-semibold text-primary">
                {(lecture?.files?.length ?? 0).toString()}
              </span>
            </div>
            <Link
              href="/ai-chat"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted/50"
            >
              <Sparkles className="h-4 w-4 text-primary" />
              Ask Dr. Q
            </Link>
          </div>

          <div className="relative" ref={resultsRef}>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setShowResults(true);
                }}
                onFocus={() => setShowResults(true)}
                placeholder="Search inside this lecture…"
                className="w-full rounded-full border border-border bg-card/70 py-2 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            {showResults && filtered.length > 0 ? (
              <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
                {filtered.map((r, idx) => (
                  <button
                    key={`${r.tab}-${idx}`}
                    type="button"
                    onClick={() => {
                      setActive(r.tab);
                      setShowResults(false);
                    }}
                    className="flex w-full flex-col gap-0.5 border-b border-border/60 px-4 py-3 text-left hover:bg-muted/40"
                  >
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-primary">{r.tab}</span>
                    <span className="text-sm font-medium text-foreground">{r.title}</span>
                    <span className="line-clamp-1 text-xs text-muted-foreground">{r.text}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {/* quick access (above tabs) */}
        <div className="mb-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href={`${base}/video`}
            className="group flex items-center justify-between gap-3 rounded-2xl border border-border bg-card/70 px-4 py-3 text-sm transition hover:bg-card hover:border-primary/35"
          >
            <span>
              <span className="block font-semibold">Video</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">Watch lecture videos</span>
            </span>
            <span className="rounded-xl bg-primary/10 p-2 text-primary group-hover:bg-primary/15">
              <Video className="h-4 w-4" />
            </span>
          </Link>
          <Link
            href={`${base}/attachments`}
            className="group flex items-center justify-between gap-3 rounded-2xl border border-border bg-card/70 px-4 py-3 text-sm transition hover:bg-card hover:border-primary/35"
          >
            <span>
              <span className="block font-semibold">Files</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">Slides & attachments</span>
            </span>
            <span className="rounded-xl bg-primary/10 p-2 text-primary group-hover:bg-primary/15">
              <FileText className="h-4 w-4" />
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setActive("questions")}
            className="group flex items-center justify-between gap-3 rounded-2xl border border-border bg-card/70 px-4 py-3 text-left text-sm transition hover:bg-card hover:border-primary/35"
          >
            <span>
              <span className="block font-semibold">Quiz</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">Practice MCQs</span>
            </span>
            <span className="rounded-xl bg-primary/10 p-2 text-primary group-hover:bg-primary/15">
              <HelpCircle className="h-4 w-4" />
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActive("flashcards")}
            className="group flex items-center justify-between gap-3 rounded-2xl border border-border bg-card/70 px-4 py-3 text-left text-sm transition hover:bg-card hover:border-primary/35"
          >
            <span>
              <span className="block font-semibold">Flashcards</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">Active recall</span>
            </span>
            <span className="rounded-xl bg-primary/10 p-2 text-primary group-hover:bg-primary/15">
              <Layers className="h-4 w-4" />
            </span>
          </button>
        </div>

        {/* tabs */}
        <div className="mb-4 flex justify-center md:justify-start">
          <div className="flex max-w-full gap-1 overflow-x-auto rounded-full border border-border bg-card/70 p-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActive(id)}
                className={cn(
                  "inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition",
                  active === id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* content */}
        <div key={active} className="min-h-0 flex-1 medqs-enter">
          {active === "overview" ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {(Array.isArray(extras?.overviewCards) ? extras.overviewCards : []).slice(0, 12).map((c: any, i: number) => (
                  <div key={i} className="rounded-2xl border border-border bg-card/70 p-4 transition hover:bg-card">
                    <p className="text-sm font-semibold">{safeString(c?.title) || "Key concept"}</p>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{safeString(c?.body)}</p>
                  </div>
                ))}
              </div>

            </div>
          ) : null}

          {active === "video" ? (
            <div className="rounded-2xl border border-border bg-card/70 p-4">
              <p className="text-sm font-semibold">Video</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Open the video studio for playlists, likes, and comments.
              </p>
              <div className="mt-4">
                <Link href={`${base}/video`} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">
                  <Video className="h-4 w-4" /> Open video
                </Link>
              </div>
            </div>
          ) : null}

          {active === "attachments" ? (
            <div className="rounded-2xl border border-border bg-card/70 p-4">
              <p className="text-sm font-semibold">Attachments</p>
              <p className="mt-1 text-xs text-muted-foreground">Open lecture files.</p>
              <div className="mt-4">
                <Link href={`${base}/attachments`} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">
                  <FileText className="h-4 w-4" /> View files
                </Link>
              </div>
            </div>
          ) : null}

          {active === "flashcards" ? (
            <div className="rounded-2xl border border-border bg-card/70 p-4">
              {Array.isArray(lecture?.flashcards) && lecture.flashcards.length > 0 ? (
                <LectureClient flashcards={lecture.flashcards} questions={[]} mode="flashcards" />
              ) : (
                <p className="py-10 text-center text-sm text-muted-foreground">No flashcards yet.</p>
              )}
            </div>
          ) : null}

          {active === "questions" ? (
            <div className="rounded-2xl border border-border bg-card/70 p-4">
              {Array.isArray(lecture?.questions) && lecture.questions.length > 0 ? (
                <LectureClient flashcards={[]} questions={lecture.questions} mode="questions" />
              ) : (
                <p className="py-10 text-center text-sm text-muted-foreground">No questions yet.</p>
              )}
            </div>
          ) : null}

          {active === "notes" ? (
            <div className="rounded-2xl border border-border bg-card/70 p-5 md:p-7">
              {safeString(lecture?.notesMarkdown).trim() ? (
                <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-display">
                  <ReactMarkdown components={markdownComponentsWithImages}>
                    {enhancePlainImageUrls(safeString(lecture?.notesMarkdown))}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="py-10 text-center text-sm text-muted-foreground">No notes yet.</p>
              )}
            </div>
          ) : null}

          {active === "mindmaps" ? (
            <div className="rounded-2xl border border-border bg-card/70 p-5 md:p-7">
              {extras?.mindMapGraph && Array.isArray(extras.mindMapGraph.nodes) && extras.mindMapGraph.nodes.length > 0 ? (
                <MindMapCanvas graph={extras.mindMapGraph as MindMapGraph} />
              ) : safeString(extras?.mindMapsMarkdown).trim() ? (
                <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-display">
                  <ReactMarkdown components={markdownComponentsWithImages}>
                    {enhancePlainImageUrls(safeString(extras?.mindMapsMarkdown))}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="py-10 text-center text-sm text-muted-foreground">No mind maps yet.</p>
              )}
            </div>
          ) : null}

          {active === "cases" ? (
            <div className="space-y-3">
              {(Array.isArray(extras?.cases) ? extras.cases : []).map((c: any, i: number) => (
                <div key={i} className="rounded-2xl border border-border bg-card/70 p-4">
                  <p className="text-sm font-semibold">{safeString(c?.title) || `Case ${i + 1}`}</p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{safeString(c?.vignette)}</p>
                </div>
              ))}
              {(!Array.isArray(extras?.cases) || extras.cases.length === 0) && (
                <p className="py-10 text-center text-sm text-muted-foreground">No cases yet.</p>
              )}
            </div>
          ) : null}

          {active === "mnemonics" ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(Array.isArray(extras?.mnemonics) ? extras.mnemonics : []).map((m: any, i: number) => (
                <div key={i} className="rounded-2xl border border-border bg-card/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">{safeString(m?.title) || "Mnemonic"}</p>
                  <p className="mt-2 font-display text-2xl font-black tracking-tight text-foreground">
                    {safeString(m?.word)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{safeString(m?.topic)}</p>
                  {Array.isArray(m?.items) ? (
                    <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                      {m.items.slice(0, 12).map((it: any, j: number) => (
                        <li key={j} className="flex gap-2">
                          <span className="font-mono font-bold text-primary">{safeString(it?.l || it?.letter || "")}</span>
                          <span className="flex-1">{safeString(it?.t || it?.text || "")}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))}
              {(!Array.isArray(extras?.mnemonics) || extras.mnemonics.length === 0) && (
                <p className="col-span-full py-10 text-center text-sm text-muted-foreground">No mnemonics yet.</p>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <style jsx global>{`
        @keyframes medqs-float {
          0%,
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          33% {
            transform: translate3d(24px, -32px, 0) scale(1.04);
          }
          66% {
            transform: translate3d(-18px, 22px, 0) scale(0.96);
          }
        }
        .medqs-lecture-bg {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 55% at 20% -10%, hsl(var(--primary) / 0.16), transparent 55%),
            radial-gradient(ellipse 70% 55% at 110% 10%, hsl(330 90% 60% / 0.12), transparent 55%),
            radial-gradient(ellipse 70% 60% at 50% 120%, hsl(160 84% 40% / 0.10), transparent 55%);
        }
        .medqs-orb {
          position: absolute;
          border-radius: 9999px;
          filter: blur(72px);
          opacity: 0.12;
          animation: medqs-float 18s ease-in-out infinite;
          background: hsl(var(--primary) / 0.55);
        }
        .medqs-orb--1 {
          width: 520px;
          height: 520px;
          top: -140px;
          left: -140px;
          animation-delay: 0s;
        }
        .medqs-orb--2 {
          width: 420px;
          height: 420px;
          bottom: -140px;
          right: -120px;
          background: hsl(330 90% 65% / 0.55);
          animation-delay: -6s;
        }
        .medqs-orb--3 {
          width: 340px;
          height: 340px;
          top: 40%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: hsl(160 84% 45% / 0.45);
          animation-delay: -12s;
        }
        .medqs-enter { animation: medqs-fadeup 260ms ease both; }
        @keyframes medqs-fadeup {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

