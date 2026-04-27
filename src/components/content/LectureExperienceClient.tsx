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
  ListTree,
  CircleDot,
  Headphones,
  ChevronRight,
  ArrowRight,
  PlayCircle,
  FileCode,
  GraduationCap,
  X,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LectureClient } from "@/components/content/LectureClient";
import ReactMarkdown from "react-markdown";
import { markdownComponentsWithImages } from "@/components/ui/MarkdownBody";
import { enhancePlainImageUrls } from "@/lib/markdown-helpers";
import { AIAssistantPanel } from "@/components/ai/AIAssistant";
import toast from "react-hot-toast";


type TabId =
  | "overview"
  | "video"
  | "records"
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

function sanitizeMindMapGraph(graph: MindMapGraph): MindMapGraph {
  const rawNodes = Array.isArray(graph?.nodes) ? graph.nodes : [];
  const nodes = rawNodes.filter((n) => n && String(n.id ?? "").trim() && String(n.label ?? "").trim());
  const ids = new Set(nodes.map((n) => n.id));
  const rawEdges = Array.isArray(graph?.edges) ? graph.edges : [];
  const edges = rawEdges.filter((e) => e && ids.has(e.from) && ids.has(e.to) && e.from !== e.to);
  return { nodes, edges };
}

function MindMapCanvas({
  graph,
  selectedId,
  onSelectId,
}: {
  graph: MindMapGraph;
  selectedId: string | null;
  onSelectId: (id: string) => void;
}) {
  const { nodes, edges } = useMemo(() => sanitizeMindMapGraph(graph), [graph]);
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

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative min-h-[min(52vh,520px)] w-full overflow-hidden rounded-3xl backdrop-blur-md shadow-2xl border",
        "bg-white/40 dark:bg-black/20 border-black/5 dark:border-white/[0.03]"
      )}
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
        className="absolute left-1/2 top-1/2 transition-transform duration-300 ease-out"
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
                stroke="currentColor"
                className="text-primary/30"
                strokeWidth="2.5"
                strokeDasharray="5 5"
              />
            );
          })}
        </svg>

        {nodes.map((n) => {
          const p = layout.pos.get(n.id) ?? { x: 0, y: 0 };
          const isSel = selectedId === n.id;
          const shape = n.shape ?? ((levelById.get(n.id) ?? 0) === 0 ? "hex" : "circle");
          const baseCls = "transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl";
          const selCls = isSel 
            ? "ring-2 ring-primary bg-primary/10 dark:bg-primary/20 scale-110" 
            : "bg-white dark:bg-[#1c1c22] dark:bg-card/90";
          const w = shape === "card" ? 220 : 160;
          const h = shape === "card" ? 80 : 64;
          return (
            <button
              key={n.id}
              type="button"
              data-node
              onClick={() => onSelectId(n.id)}
              className={cn(
                "absolute flex items-center justify-center border px-4 text-center backdrop-blur-xl",
                baseCls,
                selCls,
                shape === "circle" ? "rounded-full" : "rounded-2xl",
                "border-black/5 dark:border-white/[0.03] hover:border-primary/50"
              )}
              style={{
                left: p.x - w / 2,
                top: p.y - h / 2,
                width: w,
                height: h,
                clipPath: shape === "hex" ? hexClip() : undefined,
              }}
            >
              <span className="text-sm font-bold tracking-tight text-foreground">{n.label}</span>
            </button>
          );
        })}
      </div>

      <div className="pointer-events-none absolute bottom-4 right-4 flex items-center gap-3">
        <div className="rounded-full bg-black/5 dark:bg-black/40 backdrop-blur-md px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground dark:text-white/50 border border-black/5 dark:border-white/[0.02]">
           Scroll to zoom • Drag to move
        </div>
      </div>
    </div>
  );
}

function MindMapOutline({
  graph,
  selectedId,
  onSelect,
}: {
  graph: MindMapGraph;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const { nodes, edges } = useMemo(() => sanitizeMindMapGraph(graph), [graph]);
  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  const { rootId, childrenMap } = useMemo(() => {
    const incoming = new Map<string, number>();
    for (const e of edges) incoming.set(e.to, (incoming.get(e.to) ?? 0) + 1);
    const root =
      nodes.find((n) => n.id === "root") ||
      nodes.find((n) => typeof n.level === "number" && n.level === 0) ||
      nodes.find((n) => (incoming.get(n.id) ?? 0) === 0) ||
      nodes[0];
    const rootId = root?.id ?? "";
    const childrenMap = new Map<string, string[]>();
    for (const e of edges) {
      if (!childrenMap.has(e.from)) childrenMap.set(e.from, []);
      childrenMap.get(e.from)!.push(e.to);
    }
    for (const [, arr] of childrenMap) arr.sort();
    return { rootId, childrenMap };
  }, [nodes, edges]);

  function Row({ id, depth }: { id: string; depth: number }) {
    const n = byId.get(id);
    if (!n) return null;
    const kids = childrenMap.get(id) ?? [];
    const active = selectedId === id;
    return (
      <li className="list-none">
        <button
          type="button"
          onClick={() => onSelect(id)}
          className={cn(
            "w-full group rounded-2xl px-4 py-3 text-left transition-all",
            depth > 0 && "ml-3 border-l border-primary/20 pl-5",
            active 
              ? "bg-primary/10 dark:bg-primary/20 ring-1 ring-primary/40 shadow-lg shadow-primary/5" 
              : "hover:bg-primary/5 dark:hover:bg-white/5"
          )}
        >
          <span className={cn(
            "block text-sm font-bold transition-colors",
            active ? "text-primary" : "text-foreground group-hover:text-primary/80"
          )}>{n.label}</span>
          {n.detail?.trim() ? (
            <span className="mt-1 block text-xs leading-relaxed opacity-60 font-medium">{n.detail}</span>
          ) : null}
        </button>
        {kids.length > 0 ? (
          <ul className="mt-2 space-y-1">
            {kids.map((cid) => (
              <Row id={cid} depth={depth + 1} />
            ))}
          </ul>
        ) : null}
      </li>
    );
  }

  if (!rootId) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-1 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
        <ListTree className="h-3 w-3" />
        Lecture Map Architecture
      </div>
      <ul className="space-y-2">
        <Row id={rootId} depth={0} />
      </ul>
    </div>
  );
}

function MindMapFocusCard({ graph, selectedId }: { graph: MindMapGraph; selectedId: string | null }) {
  const byId = useMemo(() => {
    const { nodes } = sanitizeMindMapGraph(graph);
    return new Map(nodes.map((n) => [n.id, n]));
  }, [graph]);
  const sel = selectedId ? byId.get(selectedId) : null;
  return (
    <div className={cn(
      "flex h-full min-h-[220px] flex-col gap-4 rounded-[28px] p-6 border shadow-2xl relative overflow-hidden",
      "bg-gradient-to-br from-white to-slate-50 dark:from-white/5 dark:to-transparent border-black/5 dark:border-white/[0.03]"
    )}>
      <div className="absolute top-0 right-0 p-8 opacity-5">
         <Sparkles className="h-24 w-24" />
      </div>
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
        <CircleDot className="h-3.5 w-3.5" />
        Active Topic Insight
      </div>
      {sel ? (
        <div className="relative z-10 animate-in fade-in slide-in-from-right-4">
          <h4 className="font-display text-xl font-black leading-tight text-foreground">{sel.label}</h4>
          <div className="mt-4 prose dark:prose-invert prose-sm">
            <p className={cn(
              "text-sm leading-relaxed font-medium italic",
              "text-muted-foreground dark:text-white/60"
            )}>
              {sel.detail?.trim() ? sel.detail : "Explore the visual map or the structured outline to dive deeper into this medical concept."}
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-col items-center justify-center flex-1 opacity-40">
           <Layers className="h-8 w-8 mb-2" />
           <p className="text-xs font-bold text-center">Tap a node to reveal details</p>
        </div>
      )}
    </div>
  );
}

function MindMapSection({ graph, markdown }: { graph: MindMapGraph; markdown: string }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const safe = useMemo(() => sanitizeMindMapGraph(graph), [graph]);

  useEffect(() => {
    if (safe.nodes.length && selectedId == null) {
      const root = safe.nodes.find((n) => n.id === "root" || n.level === 0) || safe.nodes[0];
      if (root) setSelectedId(root.id);
    }
  }, [safe.nodes, selectedId]);

  const hasGraph = safe.nodes.length > 0;
  const md = safeString(markdown).trim();

  return (
    <div className="flex flex-col gap-10">
      {hasGraph ? (
        <div className="space-y-6">
           <MindMapCanvas graph={safe} selectedId={selectedId} onSelectId={setSelectedId} />
           <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
              <MindMapOutline graph={safe} selectedId={selectedId} onSelect={setSelectedId} />
              <div className="lg:sticky lg:top-24">
                 <MindMapFocusCard graph={safe} selectedId={selectedId} />
              </div>
           </div>
        </div>
      ) : null}

      {md ? (
        <div className="rounded-[32px] bg-card/40 p-8 border border-black/5 dark:border-white/[0.02] shadow-xl">
          <div className="flex items-center gap-2 mb-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
             <NotebookPen className="h-3 w-3" />
             Written Synthesis
          </div>
          <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-display prose-p:leading-relaxed prose-li:my-1">
            <ReactMarkdown components={markdownComponentsWithImages}>{enhancePlainImageUrls(md)}</ReactMarkdown>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function safeString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function getTabs(lecture: LectureLike) {
  const ui = (lecture?.uiConfig ?? {}) as any;
  const enabled = (ui?.tabs ?? {}) as Record<string, boolean>;

  const hasVideo = Boolean((lecture?.videos?.length ?? 0) > 0 || safeString(lecture?.videoUrl).trim());
  const hasFiles = (lecture?.files?.length ?? 0) > 0;
  const hasCards = (lecture?.flashcards?.length ?? 0) > 0;
  const hasQs = (lecture?.questions?.length ?? 0) > 0;
  const hasNotes = Boolean(safeString(lecture?.notesMarkdown).trim());

  const extras = (lecture?.extras ?? {}) as any;
  const hasMindMapGraph = extras?.mindMapGraph && Array.isArray(extras.mindMapGraph.nodes) && extras.mindMapGraph.nodes.length > 0;
  const hasMindmaps = Boolean(safeString(extras?.mindMapsMarkdown).trim()) || Boolean(hasMindMapGraph);
  const hasCases = Array.isArray(extras?.cases) && extras.cases.length > 0;
  const hasMnemonics = Array.isArray(extras?.mnemonics) && extras.mnemonics.length > 0;

  const tabs: Array<{ id: TabId; label: string; icon: any; show: boolean }> = [
    { id: "overview", label: "Overview", icon: BookOpen, show: enabled.overview ?? true },
    { id: "video", label: "Video", icon: Video, show: enabled.video ?? hasVideo },
    { id: "records", label: "Records", icon: Headphones, show: enabled.records ?? Boolean((lecture?.records?.length ?? 0) > 0) },
    { id: "attachments", label: "Files", icon: FileText, show: enabled.attachments ?? hasFiles },
    { id: "flashcards", label: "Flashcards", icon: Layers, show: enabled.flashcards ?? hasCards },
    { id: "questions", label: "Quiz", icon: HelpCircle, show: enabled.questions ?? hasQs },
    { id: "notes", label: "AI Notes", icon: NotebookPen, show: enabled.notes ?? hasNotes },
    { id: "mindmaps", label: "Mind Maps", icon: Sparkles, show: (enabled.mindmaps ?? true) && hasMindmaps },
    { id: "mnemonics", label: "Mnemonics", icon: Sparkles, show: (enabled.mnemonics ?? true) && hasMnemonics },
    { id: "cases", label: "Clinical Cases", icon: Sparkles, show: (enabled.cases ?? true) && hasCases },
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

  const badge = safeString(ui?.badge).trim() || `${lecture?.subject?.module?.name ?? "Module"} • Academic Lecture`;
  const subtitle = safeString(ui?.subtitle).trim() || `${lecture?.subject?.name ?? "Subject"} • Flashcards • Quiz • Notes`;

  const tabs = useMemo(() => getTabs(lecture), [lecture]);
  const [active, setActive] = useState<TabId>((tabs[0]?.id as TabId) ?? "overview");
  const [showAiChat, setShowAiChat] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    const tid = toast.loading("Dr. Q is analyzing the lecture... This may take a minute.");
    try {
      const res = await fetch("/api/v1/ai/analyze-lecture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lectureId: lecture.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      const { generated, sources } = data;
      const summary = `✅ Generated: ${generated?.questions ?? 0} MCQs · ${generated?.flashcards ?? 0} flashcards · ${generated?.mnemonics ?? 0} mnemonics`;
      toast.success(summary, { id: tid, duration: 5000 });
      window.location.reload();

    } catch (err: any) {
      toast.error(err.message, { id: tid });
    } finally {
      setIsAnalyzing(false);
    }
  };


  useEffect(() => {
    if (!tabs.find((t) => t.id === active)) setActive((tabs[0]?.id as TabId) ?? "overview");
  }, [tabs.map((t) => t.id).join("|")]);

  const [q, setQ] = useState("");
  const [showResults, setShowResults] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const searchItems = useMemo(() => {
    const items: Array<{ tab: TabId; title: string; text: string }> = [];
    const cards = Array.isArray(extras?.overviewCards) ? extras.overviewCards : [];
    for (const c of cards) items.push({ tab: "overview", title: safeString(c?.title) || "Card", text: safeString(c?.body) });
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

  const base = `/modules/${moduleId}/lectures/${lecture?.id}`;

  return (
    <div className="relative min-h-screen">
      {/* Dynamic Background */}
      <div className="fixed inset-0 -z-10 bg-background transition-colors duration-500">
         <div className="absolute top-0 right-0 h-[600px] w-[800px] bg-primary/10 dark:bg-primary/5 blur-[160px] rounded-full -translate-y-1/2 translate-x-1/4 opacity-60 dark:opacity-100" />
         <div className="absolute bottom-0 left-0 h-[400px] w-[700px] bg-blue-500/5 dark:bg-blue-900/5 blur-[120px] rounded-full translate-y-1/3 -translate-x-1/4" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav className="mb-6 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/50 dark:text-white/30">
          <Link href="/modules" className="hover:text-primary transition-colors">Lectures</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href={`/modules/${moduleId}`} className="hover:text-primary transition-colors truncate max-w-[120px]">
            {lecture?.subject?.module?.name}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link href={`/modules/${moduleId}/subjects/${lecture?.subjectId}`} className="hover:text-primary transition-colors truncate max-w-[120px]">
            {lecture?.subject?.name}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-muted-foreground dark:text-white/60 truncate max-w-[150px]">{lecture?.title}</span>
        </nav>

        {/* --- PREMIUM HERO SECTION --- */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
           <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.25em] text-primary mb-5">
                 <GraduationCap className="h-3.5 w-3.5" />
                 {badge}
              </div>
              <h1 className="font-display text-4xl font-black tracking-tight text-foreground sm:text-5xl lg:text-6xl mb-4 leading-[1.1]">
                {lecture?.title}
              </h1>
              <p className="text-base font-medium text-muted-foreground dark:text-white/50 max-w-xl">
                {subtitle}
              </p>
           </div>
           
           <div className="flex flex-col gap-4 min-w-[300px]">
              {/* Search Inside Lecture */}
              <div className="relative group" ref={resultsRef}>
                 <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                 <input
                    value={q}
                    onChange={(e) => { setQ(e.target.value); setShowResults(true); }}
                    onFocus={() => setShowResults(true)}
                    placeholder="Search inside lecture..."
                    className={cn(
                      "w-full h-12 rounded-2xl border text-sm transition-all pl-11 pr-4 outline-none",
                      "bg-white/50 border-black/5 dark:bg-white/5 dark:border-white/[0.03] dark:text-white dark:placeholder:text-white/20",
                      "focus:bg-white dark:focus:bg-white/10 focus:border-primary/50"
                    )}
                 />
                 {showResults && filtered.length > 0 && (
                    <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-black/5 dark:border-white/[0.03] bg-white/95 dark:bg-black/90 backdrop-blur-2xl shadow-2xl animate-in fade-in zoom-in-95">
                       {filtered.map((r, idx) => (
                          <button
                             key={`${r.tab}-${idx}`}
                             onClick={() => { setActive(r.tab); setShowResults(false); }}
                             className="flex w-full flex-col gap-1 border-b border-black/5 dark:border-white/[0.02] px-5 py-4 text-left hover:bg-black/5 dark:hover:bg-white/5"
                          >
                             <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black uppercase tracking-wider text-primary border border-primary/40 px-1.5 py-0.5 rounded-md">{r.tab}</span>
                                <span className="text-sm font-bold text-foreground dark:text-white">{r.title}</span>
                             </div>
                             <span className="line-clamp-1 text-xs text-muted-foreground dark:text-white/40">{r.text}</span>
                          </button>
                       ))}
                    </div>
                 )}
              </div>

              {/* Stats & Quick Actions */}
              <div className="flex items-center gap-2">
                 <div className="flex items-center gap-1.5 rounded-xl bg-card border border-black/5 dark:border-white/[0.02] px-3.5 py-2 text-[11px] font-bold text-muted-foreground dark:text-white/60">
                    <Layers className="h-3.5 w-3.5 text-primary" />
                    <span>{(lecture?.flashcards?.length ?? 0)} Cards</span>
                 </div>
                 <div className="flex items-center gap-1.5 rounded-xl bg-card border border-black/5 dark:border-white/[0.02] px-3.5 py-2 text-[11px] font-bold text-muted-foreground dark:text-white/60">
                    <HelpCircle className="h-3.5 w-3.5 text-blue-400" />
                    <span>{(lecture?.questions?.length ?? 0)} Quiz</span>
                 </div>
                 <div className="flex items-center gap-2 ml-auto">
                    <button
                       onClick={handleAnalyze}
                       disabled={isAnalyzing}
                       className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2 text-[11px] font-black uppercase tracking-wider text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
                    >
                       {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                       Analyze Lecture
                    </button>
                    <button
                       onClick={() => setShowAiChat(true)}
                       className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-[11px] font-black uppercase tracking-wider text-white shadow-lg shadow-primary/20 hover:scale-105 transition-transform active:scale-95"
                    >
                       <Sparkles className="h-4 w-4" />
                       Chat with Lecture
                    </button>
                 </div>
              </div>
           </div>
        </div>

        {/* --- CHAT WITH LECTURE MODAL --- */}
        {showAiChat && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowAiChat(false); }}
          >
            <div className="relative w-full max-w-2xl" style={{ height: '80vh' }}>
               <button
                  onClick={() => setShowAiChat(false)}
                  className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white transition-colors"
                  aria-label="Close AI chat"
               >
                  <X className="h-6 w-6" />
               </button>
               <AIAssistantPanel
                  embedded={true}
                  fullPage={true}
                  lectureId={lecture.id}
                  lectureTitle={lecture.title}
               />
            </div>
          </div>
        )}

        {/* --- DYNAMIC DASHBOARD GRID --- */}
        {active === "overview" && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-12">
            {[
              { id: "video", title: "Watch Video", sub: "Visual walk-through", icon: PlayCircle, color: "text-blue-500 dark:text-blue-400", href: `${base}/video` },
              { id: "records", title: "Audio Records", sub: "Listen on the go", icon: Headphones, color: "text-emerald-500 dark:text-emerald-400", href: `${base}/record` },
              { id: "attachments", title: "Lecture Files", sub: "Slides & PDF", icon: FileCode, color: "text-amber-500 dark:text-amber-400", href: `${base}/attachments` },
              { id: "questions", title: "Self Quiz", sub: "Challenge yourself", icon: HelpCircle, color: "text-purple-500 dark:text-purple-400", action: () => setActive("questions") },
              { id: "flashcards", title: "Flashcards", sub: "Active recall", icon: Layers, color: "text-pink-500 dark:text-pink-400", action: () => setActive("flashcards") },
            ].map((item) => (
              item.href ? (
                <Link key={item.id} href={item.href} className="group relative rounded-[32px] bg-card border border-black/5 dark:border-white/[0.03] p-6 transition-all hover:bg-primary/[0.02] dark:hover:bg-white/10 hover:border-primary/40 hover:-translate-y-1 shadow-sm hover:shadow-xl">
                  <div className={cn("mb-4 inline-flex h-12 w-12 items-center justify-center rounded-[18px] bg-primary/5 dark:bg-white/5 transition-colors group-hover:bg-primary/20", item.color)}>
                     <item.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground dark:text-white">{item.title}</h3>
                  <p className="mt-1 text-xs font-medium text-muted-foreground dark:text-white/40">{item.sub}</p>
                  <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                     <ArrowRight className="h-4 w-4 text-primary" />
                  </div>
                </Link>
              ) : (
                <button key={item.id} onClick={item.action} className="group relative rounded-[32px] bg-card border border-black/5 dark:border-white/[0.03] p-6 transition-all hover:bg-primary/[0.02] dark:hover:bg-white/10 hover:border-primary/40 hover:-translate-y-1 shadow-sm hover:shadow-xl text-left">
                  <div className={cn("mb-4 inline-flex h-12 w-12 items-center justify-center rounded-[18px] bg-primary/5 dark:bg-white/5 transition-colors group-hover:bg-primary/20", item.color)}>
                     <item.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground dark:text-white">{item.title}</h3>
                  <p className="mt-1 text-xs font-medium text-muted-foreground dark:text-white/40">{item.sub}</p>
                </button>
              )
            ))}
          </div>
        )}

        {/* --- PREMIUM TABS NAVIGATION --- */}
        <div className="flex justify-center mb-10 overflow-x-auto pb-4 scrollbar-hide">
           <div className="inline-flex gap-1.5 p-1.5 rounded-[24px] bg-white/60 dark:bg-black/40 backdrop-blur-2xl border border-black/5 dark:border-white/[0.03] shadow-2xl">
              {tabs.map((tab) => {
                 const isActive = active === tab.id;
                 return (
                    <button
                       key={tab.id}
                       onClick={() => setActive(tab.id)}
                       className={cn(
                          "relative flex items-center gap-2.5 px-6 py-3 rounded-[18px] text-[13px] font-bold transition-all whitespace-nowrap",
                          isActive 
                            ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105 z-10" 
                            : "text-muted-foreground dark:text-white/40 hover:text-foreground dark:hover:text-white/80 hover:bg-primary/5 dark:hover:bg-white/5"
                       )}
                    >
                       <tab.icon className={cn("h-4 w-4", isActive ? "animate-pulse" : "opacity-70")} />
                       {tab.label}
                    </button>
                 );
              })}
           </div>
        </div>

        {/* --- CONTENT AREA --- */}
        <div className="min-h-[500px] animate-in fade-in slide-in-from-bottom-6 duration-700">
           {active === "overview" && (
             <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
               {(Array.isArray(extras?.overviewCards) ? extras.overviewCards : []).map((card: any, i: number) => (
                 <div key={i} className="group relative rounded-[28px] bg-card border border-black/5 p-7 shadow-sm hover:shadow-xl hover:bg-white dark:hover:bg-card/60 transition-all hover:border-primary/20 overflow-hidden">
                    <div className="absolute -top-10 -left-10 h-24 w-24 bg-primary/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center gap-2 mb-4">
                       <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-primary italic">Key Takeaway</span>
                    </div>
                    <h5 className="text-lg font-black text-foreground dark:text-white leading-snug mb-3">
                       {safeString(card?.title) || "Key concept"}
                    </h5>
                    <p className="text-sm leading-relaxed text-muted-foreground dark:text-white/50 font-medium">
                       {safeString(card?.body)}
                    </p>
                 </div>
               ))}
             </div>
           )}

           {active === "video" && (
              <div className="flex flex-col items-center justify-center py-20 rounded-[40px] bg-white/40 dark:bg-white/5 border border-black/5 dark:border-white/[0.03] text-center">
                 <PlayCircle className="h-16 w-16 text-primary mb-6 animate-pulse" />
                 <h3 className="text-2xl font-black text-foreground dark:text-white">Video Studio</h3>
                 <p className="mt-2 text-muted-foreground dark:text-white/40 max-w-sm font-medium">Open the full video studio to watch, interact, and see timestamps.</p>
                 <Link href={`${base}/video`} className="mt-8 inline-flex items-center gap-3 rounded-2xl bg-primary px-8 py-4 text-base font-black text-white shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                    Open Player <ChevronRight className="h-5 w-5" />
                 </Link>
              </div>
           )}

           {active === "records" && (
              <div className="flex flex-col items-center justify-center py-20 rounded-[40px] bg-white/40 dark:bg-white/5 border border-black/5 dark:border-white/[0.03] text-center">
                 <Headphones className="h-16 w-16 text-emerald-500 dark:text-emerald-400 mb-6" />
                 <h3 className="text-2xl font-black text-foreground dark:text-white">Audio Library</h3>
                 <p className="mt-2 text-muted-foreground dark:text-white/40 max-w-sm font-medium">Listen to recorded audio directly or download for offline review.</p>
                 <Link href={`${base}/record`} className="mt-8 inline-flex items-center gap-3 rounded-2xl bg-emerald-500 px-8 py-4 text-base font-black text-white shadow-xl shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all">
                    Open Records <ChevronRight className="h-5 w-5" />
                 </Link>
              </div>
           )}

           {active === "attachments" && (
              <div className="flex flex-col items-center justify-center py-20 rounded-[40px] bg-white/40 dark:bg-white/5 border border-black/5 dark:border-white/[0.03] text-center">
                 <FileText className="h-16 w-16 text-amber-500 dark:text-amber-400 mb-6" />
                 <h3 className="text-2xl font-black text-foreground dark:text-white">Materials Hub</h3>
                 <p className="mt-2 text-muted-foreground dark:text-white/40 max-w-sm font-medium">All relevant lecture slides, PDFs, and hand-outs for this lesson.</p>
                 <Link href={`${base}/attachments`} className="mt-8 inline-flex items-center gap-3 rounded-2xl bg-amber-500 px-8 py-4 text-base font-black text-white shadow-xl shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all">
                    View Files <ChevronRight className="h-5 w-5" />
                 </Link>
              </div>
           )}

           {active === "flashcards" && (
              <div className="animate-in fade-in zoom-in-95 duration-500 px-1">
                 {Array.isArray(lecture?.flashcards) && lecture.flashcards.length > 0 ? (
                    <LectureClient flashcards={lecture.flashcards} questions={[]} mode="flashcards" />
                 ) : (
                    <div className="py-24 text-center rounded-[40px] border border-dashed border-black/10 dark:border-white/[0.03]">
                       <p className="text-muted-foreground/40 font-bold">No flashcards available yet.</p>
                    </div>
                 )}
              </div>
           )}

           {active === "questions" && (
              <div className="animate-in fade-in zoom-in-95 duration-500 px-1">
                 {Array.isArray(lecture?.questions) && lecture.questions.length > 0 ? (
                    <LectureClient flashcards={[]} questions={lecture.questions} mode="questions" />
                 ) : (
                    <div className="py-24 text-center rounded-[40px] border border-dashed border-black/10 dark:border-white/[0.03]">
                       <p className="text-muted-foreground/40 font-bold">No quiz available for this lecture.</p>
                    </div>
                 )}
              </div>
           )}

           {active === "notes" && (
              <div className="rounded-[40px] border bg-white/40 dark:bg-white/5 border-black/5 dark:border-white/[0.03] p-10 lg:p-14 shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 left-0 p-12 opacity-[0.03] dark:opacity-5 pointer-events-none">
                    <GraduationCap className="h-64 w-64" />
                 </div>
                 {safeString(lecture?.notesMarkdown).trim() ? (
                    <div className="relative z-10 prose dark:prose-invert prose-lg max-w-none prose-p:text-foreground/80 dark:prose-p:text-white/70 prose-headings:text-foreground dark:prose-headings:text-white prose-headings:font-black prose-p:font-medium">
                       <ReactMarkdown components={markdownComponentsWithImages}>
                          {enhancePlainImageUrls(safeString(lecture?.notesMarkdown))}
                       </ReactMarkdown>
                    </div>
                 ) : (
                    <div className="py-24 text-center">
                       <p className="text-muted-foreground/30 font-bold">No AI synthesized notes available.</p>
                    </div>
                 )}
              </div>
           )}

           {active === "mindmaps" && (
              <div className="animate-in fade-in duration-700">
                 <MindMapSection
                    graph={(extras?.mindMapGraph as MindMapGraph) ?? { nodes: [], edges: [] }}
                    markdown={safeString(extras?.mindMapsMarkdown)}
                 />
              </div>
           )}

           {active === "mnemonics" && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                 {(Array.isArray(extras?.mnemonics) ? extras.mnemonics : []).map((m: any, i: number) => (
                    <div key={i} className="rounded-3xl bg-card border border-black/5 p-8 shadow-sm">
                       <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-3 block">Mnemonic Hook</span>
                       <h4 className="text-3xl font-black text-foreground dark:text-white mb-2 leading-none">{safeString(m?.word)}</h4>
                       <p className="text-sm font-bold text-muted-foreground dark:text-white/40 mb-6">{safeString(m?.topic)}</p>
                       {Array.isArray(m?.items) && (
                          <ul className="space-y-3">
                             {m.items.map((it: any, j: number) => (
                                <li key={j} className="flex gap-4 items-center">
                                   <span className="flex shrink-0 h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary text-sm font-black">{safeString(it?.l || it?.letter || "")}</span>
                                   <span className="text-[13px] font-bold text-foreground/80 dark:text-white/70">{safeString(it?.t || it?.text || "")}</span>
                                </li>
                             ))}
                          </ul>
                       )}
                    </div>
                 ))}
              </div>
           )}

           {active === "cases" && (
              <div className="space-y-6">
                 {(Array.isArray(extras?.cases) ? extras.cases : []).map((c: any, i: number) => (
                    <div key={i} className="rounded-[32px] bg-card border border-black/5 p-10 shadow-sm relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
                          <HelpCircle className="h-40 w-40" />
                       </div>
                       <div className="flex items-center gap-3 mb-6">
                          <div className="h-10 w-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
                             <CircleDot className="h-6 w-6" />
                          </div>
                          <h4 className="text-xl font-black text-foreground dark:text-white">{safeString(c?.title) || `Clinical Case Study ${i + 1}`}</h4>
                       </div>
                       <p className="text-base leading-[1.8] text-muted-foreground dark:text-white/60 font-medium">
                          {safeString(c?.vignette)}
                       </p>
                    </div>
                 ))}
              </div>
           )}
        </div>
      </div>

      {/* CSS Utilities for Animations */}
      <style jsx global>{`
        @keyframes medqs-enter {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .medqs-enter {
          animation: medqs-enter 0.5s ease-out forwards;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

