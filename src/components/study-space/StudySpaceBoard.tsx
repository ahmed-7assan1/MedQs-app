"use client";

/**
 * Infinite-feel study board: viewport-tiled background, huge panning world, widgets only on the world layer.
 * Drawing lives inside an optional Sketch widget so ink never covers other widgets.
 */

import { useState, useEffect, useRef, useCallback, useLayoutEffect } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  Plus, X, Music, Clock, CheckSquare, FileText, Eraser, Play, Pause, RotateCcw,
  Minimize2, Maximize2, ChevronDown, ChevronRight, Download, Sparkles, Expand, Upload,
  Youtube, File, PenLine, Pencil, Highlighter, Minus, Square, Circle as CircleIcon,
  ArrowRight, GitBranch, LayoutGrid, Workflow,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

/** Large logical canvas for placing widgets; background grid is infinite in the viewport. */
export const WORLD_W = 20000;
export const WORLD_H = 14000;

type WidgetType = "pomodoro" | "timer" | "spotify" | "tasks" | "notes" | "draw" | "pdf" | "youtube";
type BgMode = "solid" | "grid" | "dots" | "gradient" | "motion" | "image";

interface Widget {
  id: string;
  type: WidgetType;
  x: number;
  y: number;
  w: number;
  h: number;
  minimized?: boolean;
  /** PDF URL or blob URL — used by pdf widget or sketch (annotate mode) */
  pdfSrc?: string | null;
  /** YouTube video id */
  youtubeId?: string | null;
}

interface Task {
  id: string;
  text: string;
  done: boolean;
}

export interface BoardStateV2 {
  widgets: Widget[];
  panX: number;
  panY: number;
  bgMode: BgMode;
  bgColor: string;
  bgColor2: string;
  /** Background blur radius in px; 0 = off */
  bgBlurPx: number;
  /** Custom board background from device (data URL). */
  bgImageDataUrl: string | null;
  accentColor: string;
  tasks: Task[];
  spotifyUrl: string;
}

const DEFAULT_STATE: BoardStateV2 = {
  widgets: [],
  panX: 80,
  panY: 60,
  bgMode: "grid",
  bgColor: "#0c0e14",
  bgColor2: "#1a1f2e",
  bgBlurPx: 0,
  bgImageDataUrl: null,
  accentColor: "#6366f1",
  tasks: [],
  spotifyUrl: "",
};

type BgPreset = {
  id: string;
  label: string;
  bgMode: Exclude<BgMode, "image">;
  bgColor: string;
  bgColor2: string;
};

/** Ready-made static / solid-style boards */
const BG_STATIC_PRESETS: BgPreset[] = [
  { id: "st-midnight", label: "Midnight", bgMode: "solid", bgColor: "#0c0e14", bgColor2: "#0c0e14" },
  { id: "st-paper", label: "Warm paper", bgMode: "solid", bgColor: "#f0ebe3", bgColor2: "#f0ebe3" },
  { id: "st-slate", label: "Slate grid", bgMode: "grid", bgColor: "#1e293b", bgColor2: "#0f172a" },
  { id: "st-mint-dots", label: "Mint dots", bgMode: "dots", bgColor: "#042f2e", bgColor2: "#134e4a" },
];

const BG_GRADIENT_PRESETS: BgPreset[] = [
  { id: "gr-indigo", label: "Indigo", bgMode: "gradient", bgColor: "#3730a3", bgColor2: "#0f172a" },
  { id: "gr-sunset", label: "Sunset", bgMode: "gradient", bgColor: "#ea580c", bgColor2: "#7f1d1d" },
  { id: "gr-ocean", label: "Ocean", bgMode: "gradient", bgColor: "#0e7490", bgColor2: "#164e63" },
  { id: "gr-rose", label: "Rose", bgMode: "gradient", bgColor: "#be123c", bgColor2: "#4c0519" },
  { id: "gr-lilac", label: "Lilac", bgMode: "gradient", bgColor: "#6d28d9", bgColor2: "#312e81" },
];

const BG_MOTION_PRESETS: BgPreset[] = [
  { id: "mo-aurora", label: "Aurora", bgMode: "motion", bgColor: "#312e81", bgColor2: "#115e59" },
  { id: "mo-violet", label: "Violet drift", bgMode: "motion", bgColor: "#5b21b6", bgColor2: "#1e1b4b" },
  { id: "mo-emerald", label: "Emerald flow", bgMode: "motion", bgColor: "#065f46", bgColor2: "#134e4a" },
  { id: "mo-cosmic", label: "Cosmic", bgMode: "motion", bgColor: "#1e3a8a", bgColor2: "#581c87" },
  { id: "mo-dusk", label: "Dusk", bgMode: "motion", bgColor: "#9d174d", bgColor2: "#312e81" },
];

const MAX_BG_IMAGE_BYTES = 2.6 * 1024 * 1024;

function presetPreviewStyle(preset: BgPreset): CSSProperties {
  if (preset.bgMode === "gradient" || preset.bgMode === "motion") {
    return { background: `linear-gradient(135deg, ${preset.bgColor}, ${preset.bgColor2})` };
  }
  if (preset.bgMode === "solid") {
    return { backgroundColor: preset.bgColor };
  }
  if (preset.bgMode === "grid") {
    return {
      backgroundColor: preset.bgColor,
      backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
      backgroundSize: "10px 10px",
    };
  }
  return {
    backgroundColor: preset.bgColor,
    backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.18) 1px, transparent 1px)",
    backgroundSize: "10px 10px",
  };
}

const WIDGET_LABELS: Record<WidgetType, string> = {
  pomodoro: "Pomodoro",
  timer: "Custom Timer",
  spotify: "Spotify",
  tasks: "Tasks",
  notes: "Notes",
  draw: "Sketch pad",
  pdf: "PDF viewer",
  youtube: "YouTube",
};

const BRUSH_PALETTE = [
  "#f8fafc", "#e2e8f0", "#94a3b8", "#475569", "#1e293b",
  "#fecaca", "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#3b82f6", "#6366f1", "#a855f7", "#ec4899", "#f43f5e",
  "#0ea5e9", "#06b6d4", "#ffffff", "#000000",
] as const;

type DrawTool =
  | "pen"
  | "pencil"
  | "brush"
  | "highlighter"
  | "marker"
  | "eraser"
  | "line"
  | "rect"
  | "circle"
  | "arrow";

function parseYoutubeId(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  try {
    const u = new URL(t.includes("://") ? t : `https://${t}`);
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace(/^\//, "").split("/")[0];
      return id && /^[\w-]{11}$/.test(id) ? id : null;
    }
    if (u.hostname.includes("youtube")) {
      const v = u.searchParams.get("v");
      if (v && /^[\w-]{11}$/.test(v)) return v;
      const m = u.pathname.match(/\/(embed|shorts|live)\/([\w-]{11})/);
      if (m?.[2]) return m[2];
    }
  } catch {
    if (/^[\w-]{11}$/.test(t)) return t;
  }
  return null;
}

function PomodoroMini({ accent }: { accent: string }) {
  type Mode = "focus" | "short" | "long";
  const DUR = { focus: 25 * 60, short: 5 * 60, long: 15 * 60 };
  const [mode, setMode] = useState<Mode>("focus");
  const [time, setTime] = useState(DUR.focus);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);

  useEffect(() => {
    setRunning(false);
    setTime(DUR[mode]);
  }, [mode]);

  useEffect(() => {
    if (!running) return;
    if (time <= 0) {
      setRunning(false);
      if (mode === "focus") {
        setSessions((s) => s + 1);
        toast.success("Focus done!");
      } else toast("Break over");
      return;
    }
    const t = setTimeout(() => setTime((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [running, time, mode]);

  const pct = 1 - time / DUR[mode];
  const r = 48;
  const circ = 2 * Math.PI * r;
  const mins = String(Math.floor(time / 60)).padStart(2, "0");
  const secs = String(time % 60).padStart(2, "0");

  return (
    <div className="flex flex-col items-center gap-2 p-3">
      <div className="flex gap-1 rounded-full p-0.5" style={{ background: "rgba(255,255,255,0.06)" }}>
        {(["focus", "short", "long"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className="rounded-full px-2 py-0.5 text-[10px] font-medium capitalize"
            style={{
              background: mode === m ? accent : "transparent",
              color: mode === m ? "white" : "rgba(255,255,255,0.45)",
            }}
          >
            {m === "focus" ? "Focus" : m === "short" ? "Short" : "Long"}
          </button>
        ))}
      </div>
      <div className="relative">
        <svg width={120} height={120} style={{ transform: "rotate(-90deg)" }}>
          <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
          <circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke={accent}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - pct)}
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-2xl font-bold tabular-nums text-white">{mins}:{secs}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setRunning((r) => !r)}
          className="flex h-9 w-9 items-center justify-center rounded-full text-white"
          style={{ background: accent }}
        >
          {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 pl-0.5" />}
        </button>
        <button
          type="button"
          onClick={() => {
            setRunning(false);
            setTime(DUR[mode]);
          }}
          className="rounded-full border border-white/10 p-1.5 text-white/50"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>
      <p className="text-[9px] text-white/35">{sessions} sessions</p>
    </div>
  );
}

function TimerMini({ accent }: { accent: string }) {
  const [inputM, setInputM] = useState("25");
  const [time, setTime] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const total = (parseInt(inputM, 10) || 0) * 60;

  useEffect(() => {
    if (!running || time === null) return;
    if (time <= 0) {
      setRunning(false);
      toast.success("Timer done");
      return;
    }
    const t = setTimeout(() => setTime((s) => (s ?? 0) - 1), 1000);
    return () => clearTimeout(t);
  }, [running, time]);

  const display = time ?? total;
  const m = Math.floor(display / 60);
  const s = display % 60;

  return (
    <div className="flex flex-col items-center gap-2 p-3">
      {time === null ? (
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            value={inputM}
            onChange={(e) => setInputM(e.target.value)}
            className="w-16 rounded-lg border border-white/10 bg-white/5 py-1.5 text-center text-sm text-white"
          />
          <span className="text-xs text-white/40">min</span>
        </div>
      ) : (
        <span className="font-mono text-3xl font-bold text-white">
          {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
        </span>
      )}
      <div className="flex gap-2">
        {time === null ? (
          <button
            type="button"
            disabled={total <= 0}
            onClick={() => {
              setTime(total);
              setRunning(true);
            }}
            className="rounded-full px-4 py-1.5 text-xs font-medium text-white disabled:opacity-40"
            style={{ background: accent }}
          >
            Start
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setRunning((r) => !r)}
              className="rounded-full p-2 text-white"
              style={{ background: accent }}
            >
              {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 pl-0.5" />}
            </button>
            <button
              type="button"
              onClick={() => {
                setTime(null);
                setRunning(false);
              }}
              className="rounded-full border border-white/10 p-2 text-white/50"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function SpotifyMini() {
  const [url, setUrl] = useState("");
  const [embedId, setEmbedId] = useState("");
  function load() {
    const m = url.match(/playlist\/([a-zA-Z0-9]+)/);
    if (m) {
      setEmbedId(m[1]);
      setUrl("");
    } else toast.error("Paste a Spotify playlist URL");
  }
  return (
    <div className="p-2">
      {embedId ? (
        <>
          <iframe
            title="sp"
            src={`https://open.spotify.com/embed/playlist/${embedId}`}
            width="100%"
            height={180}
            className="rounded-xl border-0"
            loading="lazy"
          />
          <button type="button" onClick={() => setEmbedId("")} className="mt-1 text-[10px] text-white/40">
            Change
          </button>
        </>
      ) : (
        <div className="flex gap-1">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Playlist URL…"
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white"
          />
          <button type="button" onClick={load} className="rounded-lg bg-emerald-600 px-2 py-1 text-xs text-white">
            Load
          </button>
        </div>
      )}
    </div>
  );
}

function TasksMini({
  tasks,
  setTasks,
  accent,
}: {
  tasks: Task[];
  setTasks: (t: Task[]) => void;
  accent: string;
}) {
  const [input, setInput] = useState("");
  return (
    <div className="flex flex-col gap-2 p-2">
      <div className="max-h-36 space-y-1 overflow-y-auto">
        {tasks.map((task) => (
          <div key={task.id} className="flex items-center gap-2 rounded-lg bg-white/[0.04] px-2 py-1">
            <button
              type="button"
              onClick={() =>
                setTasks(tasks.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t)))
              }
              className="h-4 w-4 rounded border"
              style={{
                borderColor: task.done ? accent : "rgba(255,255,255,0.2)",
                background: task.done ? accent : "transparent",
              }}
            />
            <span
              className={cn("flex-1 text-xs", task.done ? "text-white/35 line-through" : "text-white/75")}
            >
              {task.text}
            </span>
            <button type="button" onClick={() => setTasks(tasks.filter((t) => t.id !== task.id))}>
              <X className="h-3 w-3 text-white/30" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-1">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && input.trim()) {
              setTasks([...tasks, { id: Date.now().toString(), text: input.trim(), done: false }]);
              setInput("");
            }
          }}
          placeholder="Task…"
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white"
        />
        <button
          type="button"
          onClick={() => {
            if (!input.trim()) return;
            setTasks([...tasks, { id: Date.now().toString(), text: input.trim(), done: false }]);
            setInput("");
          }}
          className="rounded-lg px-2 text-white"
          style={{ background: accent }}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function NotesMini() {
  const [text, setText] = useState(() => {
    try {
      return localStorage.getItem("medqs-notes-widget") ?? "";
    } catch {
      return "";
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("medqs-notes-widget", text);
    } catch {}
  }, [text]);
  return (
    <textarea
      value={text}
      onChange={(e) => setText(e.target.value)}
      placeholder="Notes…"
      className="h-36 w-full resize-none bg-transparent p-2 text-xs text-white/80 placeholder:text-white/25 focus:outline-none"
    />
  );
}

function PdfMini({
  pdfSrc,
  onSetSrc,
}: {
  pdfSrc: string | null | undefined;
  onSetSrc: (url: string | null) => void;
}) {
  const [input, setInput] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const blobRef = useRef<string | null>(null);
  useEffect(() => {
    return () => {
      if (blobRef.current) URL.revokeObjectURL(blobRef.current);
    };
  }, []);
  function loadUrl() {
    const u = input.trim();
    if (!u) {
      toast.error("Paste a PDF link");
      return;
    }
    onSetSrc(u);
    setInput("");
    toast.success("PDF loaded");
  }
  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f || f.type !== "application/pdf") {
      toast.error("Choose a PDF file");
      return;
    }
    if (blobRef.current) URL.revokeObjectURL(blobRef.current);
    const url = URL.createObjectURL(f);
    blobRef.current = url;
    onSetSrc(url);
    toast.success("Local PDF (this tab only)");
  }
  const src = pdfSrc ?? null;
  return (
    <div className="flex h-full min-h-[200px] flex-col p-2">
      <div className="mb-2 flex flex-col gap-1.5">
        <div className="flex gap-1">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="PDF URL…"
            className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white"
          />
          <button
            type="button"
            onClick={loadUrl}
            className="shrink-0 rounded-lg bg-violet-600 px-2 py-1.5 text-xs text-white"
          >
            Open
          </button>
        </div>
        <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={onFile} />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="rounded-lg border border-white/15 py-1.5 text-[11px] text-white/70 hover:bg-white/5"
        >
          Or open PDF from device
        </button>
      </div>
      {src ? (
        <iframe
          title="pdf"
          src={src}
          className="min-h-0 flex-1 w-full rounded-lg border border-white/10 bg-white/[0.04]"
        />
      ) : (
        <p className="text-center text-[11px] text-white/35">No document</p>
      )}
    </div>
  );
}

function YoutubeMini({
  videoId,
  onSetId,
}: {
  videoId: string | null | undefined;
  onSetId: (id: string | null) => void;
}) {
  const [input, setInput] = useState("");
  function load() {
    const id = parseYoutubeId(input);
    if (!id) {
      toast.error("Paste a valid YouTube link or video ID");
      return;
    }
    onSetId(id);
    setInput("");
    toast.success("Video loaded");
  }
  const id = videoId ?? null;
  return (
    <div className="flex h-full min-h-[200px] flex-col p-2">
      <div className="mb-2 flex gap-1">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="YouTube URL or ID…"
          className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white"
        />
        <button type="button" onClick={load} className="rounded-lg bg-red-600 px-2 py-1.5 text-xs text-white">
          Load
        </button>
      </div>
      {id ? (
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-lg border border-white/10 bg-black/40 pt-[56.25%]">
          <iframe
            title="yt"
            className="absolute inset-0 h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${id}?rel=0`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <p className="text-center text-[11px] text-white/35">No video</p>
      )}
    </div>
  );
}

const DRAW_EXPORT_SCALE = 2;

function applyDrawToolStyle(
  ctx: CanvasRenderingContext2D,
  tool: DrawTool,
  color: string,
  size: number
) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.globalAlpha = 1;
  ctx.lineJoin = "round";
  switch (tool) {
    case "pencil":
      ctx.lineWidth = Math.max(0.5, size * 0.52);
      ctx.lineCap = "butt";
      break;
    case "brush":
      ctx.lineWidth = Math.max(1, size);
      ctx.lineCap = "round";
      break;
    case "highlighter":
      ctx.lineWidth = Math.max(5, size * 2.5);
      ctx.lineCap = "square";
      ctx.globalAlpha = 0.3;
      ctx.strokeStyle = color;
      break;
    case "marker":
      ctx.lineWidth = Math.max(2, size * 1.25);
      ctx.lineCap = "round";
      break;
    default:
      ctx.lineWidth = Math.max(1, size);
      ctx.lineCap = "round";
  }
}

function drawShapeStroke(
  ctx: CanvasRenderingContext2D,
  tool: DrawTool,
  x0: number,
  y0: number,
  x1: number,
  y1: number
) {
  ctx.beginPath();
  if (tool === "line" || tool === "arrow") {
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    if (tool === "arrow") {
      const ang = Math.atan2(y1 - y0, x1 - x0);
      const L = Math.max(12, ctx.lineWidth * 4);
      const spread = 0.42;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x1 - L * Math.cos(ang - spread), y1 - L * Math.sin(ang - spread));
      ctx.moveTo(x1, y1);
      ctx.lineTo(x1 - L * Math.cos(ang + spread), y1 - L * Math.sin(ang + spread));
      ctx.stroke();
    }
    return;
  }
  if (tool === "rect") {
    ctx.strokeRect(
      Math.min(x0, x1),
      Math.min(y0, y1),
      Math.abs(x1 - x0),
      Math.abs(y1 - y0)
    );
    return;
  }
  if (tool === "circle") {
    const r = Math.hypot(x1 - x0, y1 - y0);
    if (r > 0.5) {
      ctx.beginPath();
      ctx.arc(x0, y0, r, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

function stampMindMapGuide(ctx: CanvasRenderingContext2D, cw: number, ch: number) {
  const cx = cw / 2;
  const cy = ch / 2;
  const s = Math.min(cw, ch);
  const r = s * 0.065;
  const d = s * 0.22;
  ctx.strokeStyle = "rgba(148, 163, 184, 0.48)";
  ctx.lineWidth = Math.max(1, s * 0.0018);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  const nodes: [number, number][] = [
    [cx, cy - d],
    [cx + d * 0.95, cy],
    [cx, cy + d],
    [cx - d * 0.95, cy],
  ];
  for (const [nx, ny] of nodes) {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(nx, ny);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(nx, ny, r * 0.85, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function stampFlowGuide(ctx: CanvasRenderingContext2D, cw: number, ch: number) {
  const s = Math.min(cw, ch);
  const w = s * 0.2;
  const h = s * 0.1;
  let x = cw * 0.18;
  const y = ch * 0.42;
  const gap = s * 0.1;
  ctx.strokeStyle = "rgba(148, 163, 184, 0.48)";
  ctx.lineWidth = Math.max(1, s * 0.0018);
  for (let i = 0; i < 3; i++) {
    ctx.strokeRect(x, y, w, h);
    if (i < 2) {
      const ax = x + w + gap * 0.35;
      ctx.beginPath();
      ctx.moveTo(x + w, y + h / 2);
      ctx.lineTo(ax + gap * 0.45, y + h / 2);
      ctx.stroke();
      const tip = ax + gap * 0.45;
      const mid = y + h / 2;
      ctx.beginPath();
      ctx.moveTo(tip, mid);
      ctx.lineTo(tip - 10, mid - 5);
      ctx.moveTo(tip, mid);
      ctx.lineTo(tip - 10, mid + 5);
      ctx.stroke();
    }
    x += w + gap;
  }
}

function stampGridGuide(ctx: CanvasRenderingContext2D, cw: number, ch: number) {
  const step = Math.max(28, Math.min(cw, ch) * 0.055);
  ctx.strokeStyle = "rgba(100, 116, 139, 0.2)";
  ctx.lineWidth = 1;
  for (let x = step; x < cw; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, ch);
    ctx.stroke();
  }
  for (let y = step; y < ch; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(cw, y);
    ctx.stroke();
  }
}

function DrawPadWidget({
  widgetId,
  pdfSrc,
  onPdfSrc,
}: {
  widgetId: string;
  pdfSrc?: string | null;
  onPdfSrc?: (url: string | null) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const backupCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [brushColor, setBrushColor] = useState("#a5b4fc");
  const [brushSize, setBrushSize] = useState(5);
  const [tool, setTool] = useState<DrawTool>("pen");
  const [exportBg, setExportBg] = useState("#ffffff");
  const drawing = useRef(false);
  const lastPt = useRef({ x: 0, y: 0 });
  const shapeStart = useRef({ x: 0, y: 0 });
  const shapeEnd = useRef({ x: 0, y: 0 });
  const isShapeDrag = useRef(false);
  const hydrated = useRef(false);
  const strokeRef = useRef({ brushColor, brushSize, tool });
  strokeRef.current = { brushColor, brushSize, tool };

  const shapeTools: DrawTool[] = ["line", "rect", "circle", "arrow"];
  const isShapeTool = (t: DrawTool) => shapeTools.includes(t);

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [guidesOpen, setGuidesOpen] = useState(false);
  const [scrollPdf, setScrollPdf] = useState(false);
  const [sheetScale, setSheetScale] = useState(118);
  const [pdfUrlInput, setPdfUrlInput] = useState("");
  const pdfFileRef = useRef<HTMLInputElement>(null);
  const pdfBlobRef = useRef<string | null>(null);

  const src = pdfSrc ?? null;

  useEffect(() => {
    return () => {
      if (pdfBlobRef.current) URL.revokeObjectURL(pdfBlobRef.current);
    };
  }, []);

  function loadPdfFromUrl() {
    const u = pdfUrlInput.trim();
    if (!u) {
      toast.error("Paste a PDF link");
      return;
    }
    onPdfSrc?.(u);
    setPdfUrlInput("");
    toast.success("PDF loaded");
  }

  function onPdfFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f || f.type !== "application/pdf") {
      toast.error("Choose a PDF file");
      return;
    }
    if (pdfBlobRef.current) URL.revokeObjectURL(pdfBlobRef.current);
    const url = URL.createObjectURL(f);
    pdfBlobRef.current = url;
    onPdfSrc?.(url);
    toast.success("PDF ready — draw on top or use Pan to scroll");
  }

  function ensureBackup(w: number, h: number) {
    let b = backupCanvasRef.current;
    if (!b || b.width !== w || b.height !== h) {
      b = document.createElement("canvas");
      b.width = w;
      b.height = h;
      backupCanvasRef.current = b;
    }
    return b;
  }

  const storageKey = `medqs-draw-widget-${widgetId}`;

  const fitCanvas = useCallback(() => {
    const wrap = wrapRef.current;
    const c = canvasRef.current;
    if (!wrap || !c) return;
    const cssW = Math.max(1, Math.floor(wrap.clientWidth));
    const cssH = Math.max(1, Math.floor(wrap.clientHeight));
    if (cssW < 4 || cssH < 4) return;
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const q = Math.min(2.75, Math.max(1.6, dpr * 2));
    const w = Math.round(cssW * q);
    const h = Math.round(cssH * q);
    if (c.width === w && c.height === h) return;

    const hadBitmap = c.width > 0 && c.height > 0;
    const prevData = hadBitmap ? c.toDataURL("image/png") : null;
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d")!;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const applySnapshot = (url: string) => {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
      };
      img.src = url;
    };

    if (prevData) {
      applySnapshot(prevData);
    } else if (!hydrated.current) {
      try {
        const snap = localStorage.getItem(storageKey);
        if (snap) {
          hydrated.current = true;
          applySnapshot(snap);
          return;
        }
      } catch {}
      ctx.clearRect(0, 0, w, h);
    } else {
      ctx.clearRect(0, 0, w, h);
    }
  }, [storageKey]);

  useLayoutEffect(() => {
    fitCanvas();
  }, [fitCanvas]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const ro = new ResizeObserver(() => fitCanvas());
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [fitCanvas]);

  function saveSnap() {
    const c = canvasRef.current;
    if (!c || c.width < 1) return;
    try {
      localStorage.setItem(storageKey, c.toDataURL("image/png"));
    } catch {}
  }

  function pos(e: React.PointerEvent) {
    const c = canvasRef.current!;
    const rect = c.getBoundingClientRect();
    const sx = c.width / rect.width;
    const sy = c.height / rect.height;
    return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy };
  }

  function applyStamp(kind: "mind" | "flow" | "grid") {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    ctx.save();
    if (kind === "mind") stampMindMapGuide(ctx, c.width, c.height);
    else if (kind === "flow") stampFlowGuide(ctx, c.width, c.height);
    else stampGridGuide(ctx, c.width, c.height);
    ctx.restore();
    saveSnap();
    toast.success("Guide added");
  }

  function onDown(e: React.PointerEvent) {
    e.stopPropagation();
    const c = canvasRef.current!;
    c.setPointerCapture(e.pointerId);
    const p = pos(e);
    lastPt.current = p;
    const { brushColor: col, brushSize: sz, tool: t } = strokeRef.current;

    if (isShapeTool(t)) {
      const b = ensureBackup(c.width, c.height);
      b.getContext("2d")!.drawImage(c, 0, 0);
      shapeStart.current = p;
      shapeEnd.current = p;
      isShapeDrag.current = true;
      drawing.current = true;
      return;
    }

    drawing.current = true;
    const ctx = c.getContext("2d")!;
    if (t === "eraser") {
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(p.x, p.y, sz / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }
    ctx.save();
    applyDrawToolStyle(ctx, t, col, sz);
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(0.5, ctx.lineWidth / 2), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function onMove(e: React.PointerEvent) {
    if (!drawing.current) return;
    const c = canvasRef.current!;
    const ctx = c.getContext("2d")!;
    const p = pos(e);
    const { brushColor: col, brushSize: sz, tool: t } = strokeRef.current;

    if (isShapeDrag.current && isShapeTool(t)) {
      shapeEnd.current = p;
      const b = backupCanvasRef.current;
      if (!b) return;
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.drawImage(b, 0, 0);
      ctx.save();
      ctx.strokeStyle = col;
      ctx.lineWidth = Math.max(1, sz);
      ctx.globalAlpha = 0.55;
      ctx.setLineDash([6, 4]);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      drawShapeStroke(ctx, t, shapeStart.current.x, shapeStart.current.y, p.x, p.y);
      ctx.restore();
      return;
    }

    if (t === "eraser") {
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.moveTo(lastPt.current.x, lastPt.current.y);
      ctx.lineTo(p.x, p.y);
      ctx.strokeStyle = "rgba(0,0,0,1)";
      ctx.lineWidth = sz;
      ctx.lineCap = "round";
      ctx.stroke();
      ctx.restore();
    } else {
      ctx.save();
      applyDrawToolStyle(ctx, t, col, sz);
      ctx.beginPath();
      ctx.moveTo(lastPt.current.x, lastPt.current.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      ctx.restore();
    }
    lastPt.current = p;
  }

  function onUp(e: React.PointerEvent) {
    const c = canvasRef.current;
    if (c?.hasPointerCapture(e.pointerId)) c.releasePointerCapture(e.pointerId);

    if (isShapeDrag.current) {
      isShapeDrag.current = false;
      const { brushColor: col, brushSize: sz, tool: t } = strokeRef.current;
      const b = backupCanvasRef.current;
      if (b && isShapeTool(t)) {
        const ctx = c!.getContext("2d")!;
        ctx.clearRect(0, 0, c!.width, c!.height);
        ctx.drawImage(b, 0, 0);
        const x0 = shapeStart.current.x;
        const y0 = shapeStart.current.y;
        const x1 = shapeEnd.current.x;
        const y1 = shapeEnd.current.y;
        if (Math.hypot(x1 - x0, y1 - y0) > 2) {
          ctx.save();
          ctx.strokeStyle = col;
          ctx.fillStyle = col;
          ctx.globalAlpha = 1;
          ctx.lineWidth = Math.max(1, sz);
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.setLineDash([]);
          drawShapeStroke(ctx, t, x0, y0, x1, y1);
          ctx.restore();
        }
      }
      drawing.current = false;
      saveSnap();
      return;
    }

    drawing.current = false;
    saveSnap();
  }

  function exportHiRes() {
    const c = canvasRef.current;
    if (!c || c.width < 1) return;
    const out = document.createElement("canvas");
    out.width = Math.round(c.width * DRAW_EXPORT_SCALE);
    out.height = Math.round(c.height * DRAW_EXPORT_SCALE);
    const ctx = out.getContext("2d")!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.fillStyle = exportBg;
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.drawImage(c, 0, 0, out.width, out.height);
    out.toBlob(
      (blob) => {
        if (!blob) return;
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `sketch-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(a.href);
        toast.success("Exported (PNG, high quality)");
      },
      "image/png",
      1
    );
  }

  const toolBtn = (tid: DrawTool, icon: ReactNode, label: string) => (
    <button
      key={tid}
      type="button"
      title={label}
      onClick={() => setTool(tid)}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-md border text-white/70 transition-colors",
        tool === tid
          ? "border-violet-500/60 bg-violet-600/35 text-white"
          : "border-white/10 bg-white/[0.04] hover:bg-white/10"
      )}
    >
      {icon}
    </button>
  );

  const collapseBtn = (open: boolean, label: string, onToggle: () => void) => (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center gap-1 py-0.5 text-left text-[9px] font-medium uppercase tracking-wide text-white/45 hover:text-white/70"
    >
      {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      {label}
    </button>
  );

  return (
    <div className="flex h-full min-h-[120px] min-w-0 flex-col">
      <div className="max-h-[38vh] space-y-1 overflow-y-auto border-b border-white/10 bg-black/25 px-1.5 py-1.5">
        {onPdfSrc && (
          <div className="mb-1 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1.5">
            <span className="mb-1 block text-[9px] font-medium uppercase tracking-wide text-white/40">
              PDF in sketch
            </span>
            <div className="flex flex-wrap gap-1">
              <input
                value={pdfUrlInput}
                onChange={(e) => setPdfUrlInput(e.target.value)}
                placeholder="PDF URL…"
                className="min-w-0 flex-1 rounded border border-white/10 bg-white/5 px-1.5 py-1 text-[10px] text-white"
                data-widget-no-drag
              />
              <button
                type="button"
                onClick={loadPdfFromUrl}
                className="rounded bg-violet-600 px-2 py-1 text-[10px] text-white"
                data-widget-no-drag
              >
                Open
              </button>
              <input
                ref={pdfFileRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={onPdfFile}
              />
              <button
                type="button"
                onClick={() => pdfFileRef.current?.click()}
                className="rounded border border-white/15 px-2 py-1 text-[10px] text-white/70"
                data-widget-no-drag
              >
                Device
              </button>
              {src ? (
                <button
                  type="button"
                  onClick={() => {
                    onPdfSrc(null);
                    if (pdfBlobRef.current) {
                      URL.revokeObjectURL(pdfBlobRef.current);
                      pdfBlobRef.current = null;
                    }
                    setScrollPdf(false);
                  }}
                  className="text-[10px] text-red-300/80 hover:text-red-200"
                  data-widget-no-drag
                >
                  Remove PDF
                </button>
              ) : null}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-0.5">
          <span className="w-full text-[9px] font-medium uppercase tracking-wide text-white/35">Tools</span>
          {toolBtn("pen", <PenLine className="h-3.5 w-3.5" />, "Pen")}
          {toolBtn("pencil", <Pencil className="h-3.5 w-3.5" />, "Pencil")}
          {toolBtn("brush", <span className="text-[11px] font-semibold">B</span>, "Brush")}
          {toolBtn("highlighter", <Highlighter className="h-3.5 w-3.5" />, "Highlighter")}
          {toolBtn("marker", <span className="text-[10px] font-bold">M</span>, "Marker")}
          {toolBtn("eraser", <Eraser className="h-3.5 w-3.5" />, "Eraser")}
          {toolBtn("line", <Minus className="h-3.5 w-3.5" />, "Line")}
          {toolBtn("rect", <Square className="h-3.5 w-3.5" />, "Rectangle")}
          {toolBtn("circle", <CircleIcon className="h-3.5 w-3.5" />, "Circle")}
          {toolBtn("arrow", <ArrowRight className="h-3.5 w-3.5" />, "Arrow")}
        </div>

        {collapseBtn(paletteOpen, "Colors", () => setPaletteOpen((o) => !o))}
        {paletteOpen && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {BRUSH_PALETTE.map((hex) => (
              <button
                key={hex}
                type="button"
                title={hex}
                onClick={() => setBrushColor(hex)}
                className={cn(
                  "h-5 w-5 rounded-md border-2 ring-offset-1 ring-offset-[#0b0d14] transition-transform hover:scale-110",
                  brushColor === hex ? "border-white ring-2 ring-violet-400" : "border-white/20"
                )}
                style={{ backgroundColor: hex }}
              />
            ))}
            <input
              type="color"
              value={brushColor}
              onChange={(e) => setBrushColor(e.target.value)}
              disabled={tool === "eraser"}
              className="h-5 w-7 cursor-pointer rounded border border-white/20 bg-transparent disabled:opacity-30"
              title="Custom"
              data-widget-no-drag
            />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[9px] text-white/35">Size</span>
          <input
            type="range"
            min={1}
            max={40}
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="h-1 w-24 accent-violet-400"
            data-widget-no-drag
          />
        </div>

        {!src && (
          <div className="flex flex-wrap items-center gap-2 border-t border-white/5 pt-1">
            <span className="text-[9px] text-white/35">Sheet</span>
            <input
              type="range"
              min={100}
              max={175}
              value={sheetScale}
              onChange={(e) => setSheetScale(Number(e.target.value))}
              className="h-1 flex-1 accent-violet-400"
              data-widget-no-drag
            />
            <span className="w-8 text-[9px] text-white/45">{sheetScale}%</span>
          </div>
        )}

        {collapseBtn(guidesOpen, "Diagram guides", () => setGuidesOpen((o) => !o))}
        {guidesOpen && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            <button
              type="button"
              onClick={() => applyStamp("mind")}
              className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-white/75 hover:bg-white/10"
            >
              <GitBranch className="h-3 w-3" /> Mind map
            </button>
            <button
              type="button"
              onClick={() => applyStamp("flow")}
              className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-white/75 hover:bg-white/10"
            >
              <Workflow className="h-3 w-3" /> Flow
            </button>
            <button
              type="button"
              onClick={() => applyStamp("grid")}
              className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-white/75 hover:bg-white/10"
            >
              <LayoutGrid className="h-3 w-3" /> Grid
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 border-t border-white/5 pt-1.5">
          <span className="text-[9px] text-white/35">Export BG</span>
          <input
            type="color"
            value={exportBg}
            onChange={(e) => setExportBg(e.target.value)}
            className="h-5 w-7 cursor-pointer rounded border border-white/15 bg-transparent"
            title="PNG background"
            data-widget-no-drag
          />
          <button
            type="button"
            onClick={exportHiRes}
            className="inline-flex items-center gap-0.5 rounded border border-white/15 bg-white/5 px-2 py-1 text-[10px] text-white/80"
          >
            <Download className="h-3 w-3" /> Export ink
          </button>
          <button
            type="button"
            onClick={() => {
              const cv = canvasRef.current;
              if (!cv) return;
              cv.getContext("2d")!.clearRect(0, 0, cv.width, cv.height);
              try {
                localStorage.removeItem(storageKey);
              } catch {}
              toast.success("Cleared");
            }}
            className="text-[10px] text-white/35 hover:text-red-400"
          >
            Clear
          </button>
        </div>
      </div>

      {src ? (
        <div className="flex min-h-0 flex-1 flex-col gap-1 p-1">
          <div className="flex items-center justify-between gap-1 rounded-lg border border-amber-900/30 bg-gradient-to-r from-[#2a2419]/90 to-[#1a1610]/90 px-2 py-1">
            <span className="text-[9px] font-medium uppercase tracking-wide text-amber-200/70">
              Notes+ style · ink over page
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setScrollPdf((s) => !s)}
                className={cn(
                  "rounded-md px-2 py-0.5 text-[10px] font-medium",
                  scrollPdf ? "bg-amber-500/25 text-amber-100" : "bg-white/10 text-white/80"
                )}
                data-widget-no-drag
              >
                {scrollPdf ? "Pan PDF" : "Draw"}
              </button>
            </div>
          </div>
          <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl border border-black/20 bg-[#e8e4dc] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]">
            <div className="relative h-full min-h-[200px] overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm">
              <iframe
                title="pdf-sketch"
                src={src}
                className="absolute inset-0 h-full w-full rounded-md bg-white"
                style={{ pointerEvents: scrollPdf ? "auto" : "none" }}
              />
              <div
                ref={wrapRef}
                className="absolute inset-0 z-[1] touch-none"
                style={{
                  touchAction: "none",
                  pointerEvents: scrollPdf ? "none" : "auto",
                }}
              >
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 block h-full w-full"
                  onPointerDown={onDown}
                  onPointerMove={onMove}
                  onPointerUp={onUp}
                  onPointerCancel={onUp}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="min-h-0 flex-1 overflow-auto rounded-b-lg bg-[#050608] [background-size:28px_28px] [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)]"
          data-widget-no-drag
        >
          <div
            ref={wrapRef}
            className="relative touch-none"
            style={{
              touchAction: "none",
              width: `${sheetScale}%`,
              height: `${sheetScale}%`,
              minWidth: "100%",
              minHeight: "100%",
            }}
          >
            <canvas
              ref={canvasRef}
              className="absolute inset-0 block h-full w-full"
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerCancel={onUp}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function StudySpaceBoard() {
  const [state, setState] = useState<BoardStateV2>(DEFAULT_STATE);
  const [showAdd, setShowAdd] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [boardFullscreen, setBoardFullscreen] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);
  const panDrag = useRef<{ ox: number; oy: number; sx: number; sy: number } | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const merge = useCallback((fn: (prev: BoardStateV2) => BoardStateV2) => {
    setState((prev) => {
      const next = fn(prev);
      try {
        localStorage.setItem("medqs-study-space-v2", JSON.stringify(next));
      } catch (err) {
        const name = err instanceof DOMException ? err.name : "";
        if (name === "QuotaExceededError") {
          toast.error("Storage full — try a smaller image or reset the board");
        }
      }
      return next;
    });
  }, []);

  function applyBgPreset(preset: BgPreset) {
    merge((p) => ({
      ...p,
      bgMode: preset.bgMode,
      bgColor: preset.bgColor,
      bgColor2: preset.bgColor2,
    }));
  }

  function onBoardImageSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file");
      input.value = "";
      return;
    }
    if (file.size > MAX_BG_IMAGE_BYTES) {
      toast.error("Image too large (max ~2.5 MB)");
      input.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      merge((p) => ({ ...p, bgMode: "image", bgImageDataUrl: url }));
      toast.success("Photo background applied");
    };
    reader.readAsDataURL(file);
    input.value = "";
  }

  useEffect(() => {
    try {
      const raw = localStorage.getItem("medqs-study-space-v2");
      if (raw) {
        const p = JSON.parse(raw) as Partial<BoardStateV2> & {
          tool?: string;
          brushColor?: string;
          brushSize?: number;
        };
        setState((prev) => {
          const leg = p as Partial<BoardStateV2> & { bgBlur?: boolean; tool?: string };
          const {
            tool: _t,
            brushColor: _bc,
            brushSize: _bs,
            bgBlur: legacyBlur,
            bgBlurPx: rawPx,
            widgets,
            bgImageDataUrl: imgFromP,
            ...restSpread
          } = leg as Record<string, unknown> & Partial<BoardStateV2>;
          let blurPx = 0;
          if (typeof rawPx === "number" && !Number.isNaN(rawPx)) {
            blurPx = Math.max(0, Math.min(40, rawPx));
          } else if (legacyBlur === true) {
            blurPx = 22;
          }
          delete (restSpread as { bgBlurPx?: unknown }).bgBlurPx;
          delete (restSpread as { bgBlur?: unknown }).bgBlur;
          return {
            ...prev,
            ...(restSpread as Partial<BoardStateV2>),
            bgBlurPx: blurPx,
            bgImageDataUrl: imgFromP !== undefined ? (imgFromP ?? null) : prev.bgImageDataUrl,
            widgets: widgets ?? prev.widgets,
          };
        });
      }
    } catch {}
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowSettings(false);
        setShowAdd(false);
        setBoardFullscreen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function onViewportPointerDown(e: React.PointerEvent) {
    if ((e.target as HTMLElement).closest("[data-widget-root]")) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const { panX, panY } = stateRef.current;
    panDrag.current = { ox: e.clientX, oy: e.clientY, sx: panX, sy: panY };
  }

  function onViewportPointerMove(e: React.PointerEvent) {
    if (!panDrag.current) return;
    const { ox, oy, sx, sy } = panDrag.current;
    merge((prev) => ({
      ...prev,
      panX: sx + (e.clientX - ox),
      panY: sy + (e.clientY - oy),
    }));
  }

  function clearAllDrawSnapshots() {
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k?.startsWith("medqs-draw-widget-")) keys.push(k);
      }
      keys.forEach((k) => localStorage.removeItem(k));
      localStorage.removeItem("medqs-study-draw-snapshot");
    } catch {}
  }

  function onViewportPointerUp(e: React.PointerEvent) {
    if (viewportRef.current?.hasPointerCapture(e.pointerId))
      viewportRef.current.releasePointerCapture(e.pointerId);
    panDrag.current = null;
  }

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (ev: WheelEvent) => {
      ev.preventDefault();
      setState((prev) => {
        const next = { ...prev, panX: prev.panX - ev.deltaX, panY: prev.panY - ev.deltaY };
        try {
          localStorage.setItem("medqs-study-space-v2", JSON.stringify(next));
        } catch {}
        return next;
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  function addWidget(type: WidgetType) {
    const d: Record<WidgetType, { w: number; h: number }> = {
      pomodoro: { w: 200, h: 280 },
      timer: { w: 200, h: 220 },
      spotify: { w: 280, h: 260 },
      tasks: { w: 260, h: 260 },
      notes: { w: 260, h: 200 },
      draw: { w: 480, h: 360 },
      pdf: { w: 380, h: 460 },
      youtube: { w: 420, h: 340 },
    };
    const { w, h } = d[type];
    const vp = viewportRef.current;
    merge((prev) => {
      let x = 200 - prev.panX;
      let y = 160 - prev.panY;
      if (vp && vp.clientWidth > 0 && vp.clientHeight > 0) {
        const cx = vp.clientWidth / 2 - w / 2;
        const cy = vp.clientHeight / 2 - h / 2;
        x = cx - prev.panX;
        y = cy - prev.panY;
      }
      const pad = 12;
      x = Math.max(-8000 + pad, Math.min(WORLD_W - w - pad, x));
      y = Math.max(-8000 + pad, Math.min(WORLD_H - h - pad, y));
      return {
        ...prev,
        widgets: [
          ...prev.widgets,
          {
            id: Date.now().toString(),
            type,
            x,
            y,
            w,
            h,
            pdfSrc: type === "pdf" || type === "draw" ? null : undefined,
            youtubeId: type === "youtube" ? null : undefined,
          },
        ],
      };
    });
    setShowAdd(false);
  }

  function removeWidget(id: string) {
    merge((prev) => ({ ...prev, widgets: prev.widgets.filter((w) => w.id !== id) }));
  }

  function patchWidget(id: string, patch: Partial<Widget>) {
    merge((prev) => ({
      ...prev,
      widgets: prev.widgets.map((w) => (w.id === id ? { ...w, ...patch } : w)),
    }));
  }

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden bg-[#07080c]",
        boardFullscreen ? "fixed inset-0 z-[280] h-[100dvh]" : "h-[100dvh]"
      )}
    >
      <input
        ref={bgFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onBoardImageSelected}
      />
      <header className="z-[60] flex flex-shrink-0 flex-wrap items-center gap-2 border-b border-white/10 px-3 py-2 backdrop-blur-md bg-[#07080c]/90">
        <span className="font-display text-sm font-semibold text-white/90">Study Space</span>
        <span className="hidden text-[10px] text-white/35 sm:inline">Drag empty space to pan · infinite board</span>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowAdd((s) => !s)}
            className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs text-white/80"
          >
            <Plus className="h-3.5 w-3.5" /> Widgets <ChevronDown className="h-3 w-3 opacity-60" />
          </button>
          {showAdd && (
            <div className="absolute left-0 top-full z-[70] mt-1 min-w-[160px] rounded-xl border border-white/10 bg-zinc-900 py-1 shadow-2xl">
              {(Object.keys(WIDGET_LABELS) as WidgetType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => addWidget(t)}
                  className="block w-full px-3 py-2 text-left text-xs text-white/70 hover:bg-white/10"
                >
                  {WIDGET_LABELS[t]}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1" />

        <button
          type="button"
          onClick={() => setBoardFullscreen((f) => !f)}
          className={cn(
            "rounded-lg border p-1.5 transition-colors",
            boardFullscreen
              ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-200"
              : "border-white/10 text-white/50 hover:border-white/20 hover:text-white"
          )}
          aria-pressed={boardFullscreen}
          title={boardFullscreen ? "Exit full screen" : "Full screen board"}
          aria-label={boardFullscreen ? "Exit full screen" : "Full screen board"}
        >
          {boardFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={() => setShowSettings((s) => !s)}
          className={cn(
            "rounded-lg border p-1.5 transition-colors",
            showSettings
              ? "border-violet-500/50 bg-violet-500/15 text-violet-200"
              : "border-white/10 text-white/50 hover:border-white/20 hover:text-white"
          )}
          aria-expanded={showSettings}
          aria-label="Customize board"
        >
          <Sparkles className="h-4 w-4" />
        </button>
      </header>

      {showSettings && (
        <div className="pointer-events-auto fixed inset-0 z-[80] flex justify-end">
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            aria-label="Close settings"
            onClick={() => setShowSettings(false)}
          />
          <aside
            className="relative flex h-full w-full max-w-[420px] flex-col border-l border-white/[0.08] bg-[#0a0c11] shadow-[-12px_0_48px_rgba(0,0,0,0.45)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="study-space-customize-title"
          >
            <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] px-4 py-3.5">
              <div>
                <h2 id="study-space-customize-title" className="font-display text-sm font-semibold text-white">
                  Customize board
                </h2>
                <p className="mt-0.5 text-[11px] text-white/40">Background, colors, and reset</p>
              </div>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="rounded-lg border border-white/10 p-2 text-white/50 transition-colors hover:border-white/20 hover:bg-white/5 hover:text-white"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
              <div className="mb-5 rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-white/[0.02] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/50">
                  Background & presets
                </h3>
                <p className="mb-4 text-[11px] leading-relaxed text-white/38">
                  Modes, curated examples, and your photo — grouped in one place.
                </p>

                <div className="mb-4">
                  <span className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-white/35">
                    Mode
                  </span>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {(["solid", "grid", "dots", "gradient", "motion", "image"] as BgMode[]).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          if (m === "image") {
                            if (state.bgImageDataUrl) merge((p) => ({ ...p, bgMode: "image" }));
                            else bgFileInputRef.current?.click();
                          } else {
                            merge((p) => ({ ...p, bgMode: m }));
                          }
                        }}
                        className={cn(
                          "rounded-xl border px-3 py-2.5 text-left text-xs font-medium capitalize transition-all",
                          state.bgMode === m
                            ? "border-violet-500/60 bg-violet-500/20 text-white shadow-[0_0_0_1px_rgba(139,92,246,0.25)]"
                            : "border-white/[0.08] bg-black/25 text-white/55 hover:border-white/15 hover:bg-white/[0.06] hover:text-white/80"
                        )}
                      >
                        {m === "image" ? "Photo" : m}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4 rounded-xl border border-white/[0.07] bg-black/30 p-3">
                  <span className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-white/40">
                    Example themes
                  </span>
                  <p className="mb-3 text-[10px] text-white/35">One tap sets colors + style. Saved photo stays until removed.</p>
                  <div className="space-y-4">
                    <div>
                      <h4 className="mb-2 text-[9px] font-semibold uppercase tracking-wider text-white/30">Static</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {BG_STATIC_PRESETS.map((pr) => (
                          <button
                            key={pr.id}
                            type="button"
                            onClick={() => applyBgPreset(pr)}
                            className="group flex flex-col gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.03] p-2 text-left transition-colors hover:border-violet-500/40"
                          >
                            <div
                              className="h-10 w-full overflow-hidden rounded-md ring-1 ring-white/10"
                              style={presetPreviewStyle(pr)}
                            />
                            <span className="text-[10px] text-white/65 group-hover:text-white/90">{pr.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="mb-2 text-[9px] font-semibold uppercase tracking-wider text-white/30">Gradient</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {BG_GRADIENT_PRESETS.map((pr) => (
                          <button
                            key={pr.id}
                            type="button"
                            onClick={() => applyBgPreset(pr)}
                            className="group flex flex-col gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.03] p-2 text-left transition-colors hover:border-violet-500/40"
                          >
                            <div
                              className="h-10 w-full overflow-hidden rounded-md ring-1 ring-white/10"
                              style={presetPreviewStyle(pr)}
                            />
                            <span className="text-[10px] text-white/65 group-hover:text-white/90">{pr.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="mb-2 text-[9px] font-semibold uppercase tracking-wider text-white/30">Motion</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {BG_MOTION_PRESETS.map((pr) => (
                          <button
                            key={pr.id}
                            type="button"
                            onClick={() => applyBgPreset(pr)}
                            className="group flex flex-col gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.03] p-2 text-left transition-colors hover:border-violet-500/40"
                          >
                            <div
                              className={cn(
                                "h-10 w-full overflow-hidden rounded-md ring-1 ring-white/10",
                                pr.bgMode === "motion" && "study-space-aurora"
                              )}
                              style={presetPreviewStyle(pr)}
                            />
                            <span className="text-[10px] text-white/65 group-hover:text-white/90">{pr.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-white/[0.07] bg-black/30 p-3">
                  <span className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-white/40">
                    Photo from device
                  </span>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <button
                      type="button"
                      onClick={() => bgFileInputRef.current?.click()}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-violet-500/40 bg-violet-500/15 px-4 py-2.5 text-sm font-medium text-violet-100 transition-colors hover:bg-violet-500/25"
                    >
                      <Upload className="h-4 w-4" />
                      Upload image
                    </button>
                    {state.bgImageDataUrl ? (
                      <button
                        type="button"
                        onClick={() =>
                          merge((p) => ({
                            ...p,
                            bgImageDataUrl: null,
                            bgMode: p.bgMode === "image" ? "grid" : p.bgMode,
                          }))
                        }
                        className="text-sm text-white/45 hover:text-red-300"
                      >
                        Remove photo
                      </button>
                    ) : null}
                  </div>
                  <p className="mt-2 text-[10px] text-white/35">PNG or JPG, ~2.5 MB max.</p>
                  {state.bgImageDataUrl ? (
                    <div className="mt-3 flex items-center gap-3">
                      <img
                        src={state.bgImageDataUrl}
                        alt=""
                        className="h-14 w-24 rounded-lg border border-white/10 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => merge((p) => ({ ...p, bgMode: "image" }))}
                        className={cn(
                          "text-xs font-medium",
                          state.bgMode === "image" ? "text-violet-300" : "text-white/50 hover:text-white/75"
                        )}
                      >
                        {state.bgMode === "image" ? "Photo mode active" : "Use as board background"}
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mb-5 rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-white/[0.02] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/50">
                  Board colors
                </h3>
                <div className="space-y-2">
                  {(
                    [
                      { key: "bgColor" as const, label: "Primary" },
                      { key: "bgColor2" as const, label: "Secondary" },
                      { key: "accentColor" as const, label: "Accent" },
                    ] as const
                  ).map(({ key, label }) => (
                    <div
                      key={key}
                      className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-black/30 px-4 py-3"
                    >
                      <span className="text-sm text-white/70">{label}</span>
                      <input
                        type="color"
                        value={state[key]}
                        onChange={(e) =>
                          merge((prev) => ({ ...prev, [key]: e.target.value } as BoardStateV2))
                        }
                        className="h-9 w-12 cursor-pointer overflow-hidden rounded-lg border border-white/10 bg-transparent"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-5 rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-white/[0.02] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/50">
                  Effects
                </h3>
                <p className="mb-3 text-[11px] text-white/38">Background blur strength (0 = off).</p>
                <div className="rounded-xl border border-white/[0.07] bg-black/30 px-4 py-3">
                  <div className="mb-2 flex items-center justify-between text-sm text-white/75">
                    <span>Blur</span>
                    <span className="font-mono text-xs text-white/45">{state.bgBlurPx}px</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={36}
                    value={state.bgBlurPx}
                    onChange={(e) => merge((prev) => ({ ...prev, bgBlurPx: Number(e.target.value) }))}
                    className="h-2 w-full accent-violet-500"
                  />
                </div>
              </div>

              <section className="rounded-xl border border-red-500/20 bg-red-500/[0.06] p-4">
                <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-red-300/80">
                  Danger zone
                </h3>
                <p className="mb-3 text-xs text-white/45">
                  Removes all widgets, pan position, and sketch data saved on this device.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem("medqs-study-space-v2");
                    clearAllDrawSnapshots();
                    setState(DEFAULT_STATE);
                    setShowSettings(false);
                    toast.success("Board reset");
                  }}
                  className="w-full rounded-lg border border-red-500/35 bg-red-500/10 px-3 py-2.5 text-sm font-medium text-red-200 transition-colors hover:bg-red-500/20"
                >
                  Reset everything
                </button>
              </section>
            </div>
          </aside>
        </div>
      )}

      <div
        ref={viewportRef}
        className="relative min-h-0 flex-1 cursor-default touch-none"
        style={{ overflow: "hidden" }}
        onPointerDown={onViewportPointerDown}
        onPointerMove={onViewportPointerMove}
        onPointerUp={onViewportPointerUp}
        onPointerCancel={onViewportPointerUp}
      >
        {state.bgMode === "image" && state.bgImageDataUrl ? (
          <div
            className="pointer-events-none absolute inset-0 z-0"
            style={{
              backgroundImage: `url(${state.bgImageDataUrl})`,
              backgroundSize: "cover",
              backgroundRepeat: "no-repeat",
              backgroundPosition: `calc(50% + ${state.panX * 0.1}px) calc(50% + ${state.panY * 0.1}px)`,
              filter: state.bgBlurPx > 0 ? `blur(${state.bgBlurPx}px)` : undefined,
            }}
          />
        ) : null}
        {/* Infinite tiling: pattern scrolls with pan; not clipped to world size */}
        {state.bgMode !== "gradient" && state.bgMode !== "motion" && state.bgMode !== "image" && (
          <div
            className="pointer-events-none absolute inset-0 z-0"
            style={{
              backgroundColor: state.bgColor,
              backgroundImage:
                state.bgMode === "grid"
                  ? `linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)`
                  : state.bgMode === "dots"
                    ? "radial-gradient(circle, rgba(255,255,255,0.14) 1px, transparent 1px)"
                    : undefined,
              backgroundSize: state.bgMode === "grid" ? "40px 40px" : state.bgMode === "dots" ? "22px 22px" : undefined,
              backgroundPosition: `${state.panX}px ${state.panY}px`,
              filter: state.bgBlurPx > 0 ? `blur(${state.bgBlurPx}px)` : undefined,
            }}
          />
        )}
        {(state.bgMode === "gradient" || state.bgMode === "motion") && (
          <div
            className={cn(
              "pointer-events-none absolute inset-0 z-0",
              state.bgMode === "motion" && "study-space-aurora"
            )}
            style={{
              background: `linear-gradient(135deg, ${state.bgColor}, ${state.bgColor2})`,
              filter: state.bgBlurPx > 0 ? `blur(${state.bgBlurPx}px)` : undefined,
              opacity: 1,
            }}
          />
        )}
        <div
          className="pointer-events-none absolute z-10 will-change-transform"
          style={{
            width: WORLD_W,
            height: WORLD_H,
            transform: `translate(${state.panX}px, ${state.panY}px)`,
          }}
        >
          {state.widgets.map((w) => (
            <FloatingWidget
              key={w.id}
              widget={w}
              accent={state.accentColor}
              tasks={state.tasks}
              setTasks={(t) => merge((prev) => ({ ...prev, tasks: t }))}
              onRemove={() => removeWidget(w.id)}
              onPatch={(p) => patchWidget(w.id, p)}
              onFillViewport={
                w.type === "draw"
                  ? () => {
                      const vp = viewportRef.current;
                      if (!vp) return;
                      const pad = 12;
                      merge((prev) => ({
                        ...prev,
                        widgets: prev.widgets.map((q) =>
                          q.id === w.id
                            ? {
                                ...q,
                                x: Math.max(0, -prev.panX + pad),
                                y: Math.max(0, -prev.panY + pad),
                                w: Math.min(WORLD_W - pad * 2, vp.clientWidth - pad * 2),
                                h: Math.min(WORLD_H - pad * 2, vp.clientHeight - pad * 2),
                              }
                            : q
                        ),
                      }));
                    }
                  : undefined
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function FloatingWidget({
  widget,
  accent,
  tasks,
  setTasks,
  onRemove,
  onPatch,
  onFillViewport,
}: {
  widget: Widget;
  accent: string;
  tasks: Task[];
  setTasks: (t: Task[]) => void;
  onRemove: () => void;
  onPatch: (p: Partial<Widget>) => void;
  onFillViewport?: () => void;
}) {
  const drag = useRef<{ id: number; ox: number; oy: number; sx: number; sy: number } | null>(null);
  const resize = useRef<{ id: number; ox: number; oy: number; sw: number; sh: number } | null>(null);

  function onHeaderPointerDown(e: React.PointerEvent) {
    const t = e.target as HTMLElement;
    if (t.closest("button, a, input, textarea, select, [data-widget-no-drag]")) return;
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = {
      id: e.pointerId,
      ox: e.clientX,
      oy: e.clientY,
      sx: widget.x,
      sy: widget.y,
    };
  }

  function onHeaderPointerMove(e: React.PointerEvent) {
    if (!drag.current || drag.current.id !== e.pointerId) return;
    const dx = e.clientX - drag.current.ox;
    const dy = e.clientY - drag.current.oy;
    const nx = drag.current.sx + dx;
    const ny = drag.current.sy + dy;
    const minEdge = 24;
    onPatch({
      x: Math.max(-8000, Math.min(WORLD_W - minEdge, nx)),
      y: Math.max(-8000, Math.min(WORLD_H - minEdge, ny)),
    });
  }

  function onHeaderPointerUp(e: React.PointerEvent) {
    if (drag.current?.id === e.pointerId) drag.current = null;
  }

  function onResizePointerDown(e: React.PointerEvent) {
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    resize.current = {
      id: e.pointerId,
      ox: e.clientX,
      oy: e.clientY,
      sw: widget.w,
      sh: widget.h,
    };
  }

  function onResizePointerMove(e: React.PointerEvent) {
    if (!resize.current || resize.current.id !== e.pointerId) return;
    const dx = e.clientX - resize.current.ox;
    const dy = e.clientY - resize.current.oy;
    const minW =
      widget.type === "draw" ? 240 : widget.type === "pdf" || widget.type === "youtube" ? 280 : 160;
    const minH =
      widget.type === "draw" ? 180 : widget.type === "pdf" || widget.type === "youtube" ? 240 : 120;
    const maxW = WORLD_W - widget.x - 8;
    const maxH = WORLD_H - widget.y - 8;
    onPatch({
      w: Math.min(Math.max(minW, resize.current.sw + dx), Math.max(minW, maxW)),
      h: Math.min(Math.max(minH, resize.current.sh + dy), Math.max(minH, maxH)),
    });
  }

  function onResizePointerUp(e: React.PointerEvent) {
    if (resize.current?.id === e.pointerId) resize.current = null;
  }

  return (
    <div
      data-widget-root
      className="pointer-events-auto absolute flex flex-col overflow-hidden rounded-2xl border border-white/[0.12] shadow-2xl"
      style={{
        left: widget.x,
        top: widget.y,
        width: widget.minimized ? "auto" : widget.w,
        height: widget.minimized ? "auto" : widget.h,
        zIndex: 40,
        background: "rgba(12,14,20,0.92)",
        backdropFilter: "blur(16px)",
      }}
    >
      <div
        className="flex cursor-move touch-none select-none items-center gap-2 border-b border-white/10 px-2 py-1.5"
        onPointerDown={onHeaderPointerDown}
        onPointerMove={onHeaderPointerMove}
        onPointerUp={onHeaderPointerUp}
        onPointerCancel={onHeaderPointerUp}
      >
        <span className="flex flex-1 items-center gap-1.5 text-[11px] font-medium text-white/65">
          {widget.type === "pdf" && <File className="h-3 w-3 shrink-0 opacity-60" />}
          {widget.type === "youtube" && <Youtube className="h-3 w-3 shrink-0 text-red-400/90" />}
          {WIDGET_LABELS[widget.type]}
        </span>
        {widget.type === "draw" && onFillViewport && !widget.minimized && (
          <button
            type="button"
            className="no-drag cursor-pointer rounded p-1 text-white/35 hover:text-violet-300"
            title="Fill visible area"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onFillViewport();
            }}
          >
            <Expand className="h-3 w-3" />
          </button>
        )}
        <button
          type="button"
          className="no-drag cursor-pointer rounded p-1 text-white/35 hover:text-white"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onPatch({ minimized: !widget.minimized });
          }}
        >
          {widget.minimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
        </button>
        <button
          type="button"
          className="no-drag cursor-pointer rounded p-1 text-white/35 hover:text-red-400"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <X className="h-3 w-3" />
        </button>
      </div>
      {!widget.minimized && (
        <>
          <div
            className={cn(
              "min-h-0 flex-1",
              widget.type === "draw" || widget.type === "pdf" || widget.type === "youtube"
                ? "flex flex-col overflow-hidden"
                : "overflow-auto"
            )}
          >
            {widget.type === "pomodoro" && <PomodoroMini accent={accent} />}
            {widget.type === "timer" && <TimerMini accent={accent} />}
            {widget.type === "spotify" && <SpotifyMini />}
            {widget.type === "tasks" && <TasksMini tasks={tasks} setTasks={setTasks} accent={accent} />}
            {widget.type === "notes" && <NotesMini />}
            {widget.type === "draw" && (
              <DrawPadWidget
                widgetId={widget.id}
                pdfSrc={widget.pdfSrc ?? null}
                onPdfSrc={(url) => onPatch({ pdfSrc: url })}
              />
            )}
            {widget.type === "pdf" && (
              <PdfMini pdfSrc={widget.pdfSrc} onSetSrc={(url) => onPatch({ pdfSrc: url })} />
            )}
            {widget.type === "youtube" && (
              <YoutubeMini
                videoId={widget.youtubeId}
                onSetId={(id) => onPatch({ youtubeId: id })}
              />
            )}
          </div>
          <div
            className="absolute bottom-0 right-0 h-4 w-4 cursor-nwse-resize rounded-tl border-l border-t border-white/20 bg-white/10"
            onPointerDown={onResizePointerDown}
            onPointerMove={onResizePointerMove}
            onPointerUp={onResizePointerUp}
            onPointerCancel={onResizePointerUp}
          />
        </>
      )}
    </div>
  );
}
