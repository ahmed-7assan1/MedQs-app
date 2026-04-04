"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus, X, Music, Clock, CheckSquare, FileText,
  Palette, Grid3x3, Layers, Pencil, Eraser,
  Play, Pause, RotateCcw, Settings, Minimize2, Maximize2,
  GripVertical, Check, Trash2, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

type WidgetType = "pomodoro" | "timer" | "spotify" | "tasks" | "notes";
type BgType = "solid" | "grid" | "dots" | "blur";

interface Widget {
  id: string;
  type: WidgetType;
  x: number;
  y: number;
  w: number;
  h: number;
  minimized?: boolean;
}

interface Task {
  id: string;
  text: string;
  done: boolean;
}

interface BoardState {
  widgets: Widget[];
  bgType: BgType;
  bgColor: string;
  accentColor: string;
  tasks: Task[];
  spotifyUrl: string;
  drawings: string | null; // base64 canvas
}

const DEFAULT_STATE: BoardState = {
  widgets: [],
  bgType: "grid",
  bgColor: "#0f1117",
  accentColor: "#3b82f6",
  tasks: [],
  spotifyUrl: "",
  drawings: null,
};

const WIDGET_LABELS: Record<WidgetType, string> = {
  pomodoro: "Pomodoro",
  timer:    "Custom Timer",
  spotify:  "Spotify",
  tasks:    "Tasks",
  notes:    "Notes",
};

const WIDGET_ICONS: Record<WidgetType, React.ElementType> = {
  pomodoro: Clock,
  timer:    Clock,
  spotify:  Music,
  tasks:    CheckSquare,
  notes:    FileText,
};

// ─── Pomodoro Widget ──────────────────────────────────────────────────────────

function PomodoroWidget({ accent }: { accent: string }) {
  type Mode = "focus" | "short" | "long";
  const DURATIONS = { focus: 25*60, short: 5*60, long: 15*60 };
  const [mode, setMode] = useState<Mode>("focus");
  const [time, setTime] = useState(DURATIONS.focus);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);

  useEffect(() => {
    setRunning(false); setTime(DURATIONS[mode]);
  }, [mode]);

  useEffect(() => {
    if (!running) return;
    if (time <= 0) {
      setRunning(false);
      if (mode === "focus") { setSessions(s => s + 1); toast.success("Focus session done! 🎉"); }
      else toast("Break over!", { icon: "🧠" });
      return;
    }
    const t = setTimeout(() => setTime(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [running, time, mode]);

  const pct = 1 - time / DURATIONS[mode];
  const r = 54;
  const circ = 2 * Math.PI * r;
  const mins = String(Math.floor(time / 60)).padStart(2, "0");
  const secs = String(time % 60).padStart(2, "0");

  return (
    <div className="flex flex-col items-center gap-3 p-4">
      <div className="flex gap-1 rounded-full p-1" style={{ background: "rgba(255,255,255,0.06)" }}>
        {(["focus","short","long"] as Mode[]).map(m => (
          <button key={m} onClick={() => setMode(m)}
            className="rounded-full px-3 py-1 text-xs font-medium capitalize transition-all"
            style={{
              background: mode === m ? accent : "transparent",
              color: mode === m ? "white" : "rgba(255,255,255,0.4)",
            }}>
            {m === "focus" ? "Focus" : m === "short" ? "Short" : "Long"}
          </button>
        ))}
      </div>

      <div className="relative">
        <svg width="136" height="136" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="68" cy="68" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7"/>
          <circle cx="68" cy="68" r={r} fill="none" stroke={accent} strokeWidth="7"
            strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
            style={{ transition: "stroke-dashoffset 1s linear" }}/>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-3xl font-bold text-white tabular-nums">{mins}:{secs}</span>
          <span className="text-[10px] text-white/40 capitalize">{mode === "focus" ? "Focus" : "Break"}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={() => { setRunning(false); setTime(DURATIONS[mode]); }}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/40 hover:text-white/70 transition-colors">
          <RotateCcw style={{ width: 13, height: 13 }} />
        </button>
        <button onClick={() => setRunning(r => !r)}
          className="flex h-11 w-11 items-center justify-center rounded-full font-medium text-white transition-all"
          style={{ background: accent }}>
          {running ? <Pause style={{ width: 18, height: 18 }} /> : <Play style={{ width: 18, height: 18, marginLeft: 2 }} />}
        </button>
        <div className="flex gap-1">
          {Array.from({length: 4}).map((_, i) => (
            <div key={i} className="h-2 w-2 rounded-full transition-colors"
              style={{ background: i < sessions % 4 ? accent : "rgba(255,255,255,0.1)" }} />
          ))}
        </div>
      </div>
      <p className="text-[10px] text-white/30">{sessions} session{sessions !== 1 ? "s" : ""} today</p>
    </div>
  );
}

// ─── Custom Timer Widget ───────────────────────────────────────────────────────

function TimerWidget({ accent }: { accent: string }) {
  const [inputH, setInputH] = useState("0");
  const [inputM, setInputM] = useState("25");
  const [inputS, setInputS] = useState("0");
  const [time, setTime] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [started, setStarted] = useState(false);

  const totalSet = parseInt(inputH)*3600 + parseInt(inputM)*60 + parseInt(inputS);

  useEffect(() => {
    if (!running || time === null) return;
    if (time <= 0) { setRunning(false); toast.success("Timer done! ⏱️"); return; }
    const t = setTimeout(() => setTime(s => (s ?? 0) - 1), 1000);
    return () => clearTimeout(t);
  }, [running, time]);

  function start() {
    const total = totalSet;
    if (total <= 0) return;
    setTime(total); setRunning(true); setStarted(true);
  }

  function reset() { setRunning(false); setTime(null); setStarted(false); }

  const display = time ?? totalSet;
  const h = Math.floor(display / 3600);
  const m = Math.floor((display % 3600) / 60);
  const s = display % 60;
  const pct = time !== null && totalSet > 0 ? time / totalSet : 0;
  const r = 50; const circ = 2 * Math.PI * r;

  return (
    <div className="flex flex-col items-center gap-3 p-4">
      {!started ? (
        <div className="flex items-center gap-1">
          {[["H", inputH, setInputH], ["M", inputM, setInputM], ["S", inputS, setInputS]].map(([label, val, setVal]) => (
            <div key={label as string} className="flex flex-col items-center gap-1">
              <span className="text-[10px] text-white/30">{label as string}</span>
              <input type="number" value={val as string} min="0" max={label === "H" ? "23" : "59"}
                onChange={e => (setVal as any)(e.target.value)}
                className="w-12 rounded-lg text-center font-mono text-lg font-bold text-white bg-white/5 border border-white/10 py-1.5 focus:outline-none focus:border-white/30"
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="relative">
          <svg width="120" height="120" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6"/>
            <circle cx="60" cy="60" r={r} fill="none" stroke={accent} strokeWidth="6"
              strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
              style={{ transition: "stroke-dashoffset 1s linear" }}/>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-mono text-2xl font-bold text-white">
              {h > 0 ? `${h}:` : ""}{String(m).padStart(2,"0")}:{String(s).padStart(2,"0")}
            </span>
          </div>
        </div>
      )}
      <div className="flex gap-2">
        {!started ? (
          <button onClick={start} disabled={totalSet <= 0}
            className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
            style={{ background: accent }}>
            <Play style={{ width: 13, height: 13, marginLeft: 1 }} /> Start
          </button>
        ) : (
          <>
            <button onClick={() => setRunning(r => !r)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-white"
              style={{ background: accent }}>
              {running ? <Pause style={{ width: 14, height: 14 }} /> : <Play style={{ width: 14, height: 14, marginLeft: 1 }} />}
            </button>
            <button onClick={reset}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/40 hover:text-white/70">
              <RotateCcw style={{ width: 13, height: 13 }} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Spotify Widget ────────────────────────────────────────────────────────────

function SpotifyWidget() {
  const [url, setUrl] = useState("");
  const [embedId, setEmbedId] = useState("");

  function load() {
    const match = url.match(/playlist\/([a-zA-Z0-9]+)/);
    if (match) { setEmbedId(match[1]); setUrl(""); }
    else toast.error("Paste a valid Spotify playlist URL");
  }

  return (
    <div className="flex flex-col gap-2 p-3">
      {embedId ? (
        <>
          <iframe src={`https://open.spotify.com/embed/playlist/${embedId}?utm_source=generator`}
            width="100%" height="200" allowFullScreen allow="autoplay; clipboard-write; encrypted-media"
            className="rounded-xl border-0" loading="lazy"/>
          <button onClick={() => setEmbedId("")}
            className="text-[10px] text-white/30 hover:text-white/60 transition-colors">
            Change playlist
          </button>
        </>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex h-24 items-center justify-center rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
            <Music style={{ width: 28, height: 28, color: "rgba(255,255,255,0.15)" }} />
          </div>
          <div className="flex gap-1.5">
            <input value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key === "Enter" && load()}
              placeholder="Spotify playlist URL..."
              className="flex-1 rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-white/25"/>
            <button onClick={load} className="rounded-lg px-3 py-1.5 text-xs font-medium text-white"
              style={{ background: "#1DB954" }}>
              Load
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tasks Widget ──────────────────────────────────────────────────────────────

function TasksWidget({ tasks, setTasks, accent }: {
  tasks: Task[];
  setTasks: (t: Task[]) => void;
  accent: string;
}) {
  const [input, setInput] = useState("");

  function add() {
    if (!input.trim()) return;
    setTasks([...tasks, { id: Date.now().toString(), text: input.trim(), done: false }]);
    setInput("");
  }

  function toggle(id: string) {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  }

  function remove(id: string) {
    setTasks(tasks.filter(t => t.id !== id));
  }

  const done = tasks.filter(t => t.done).length;

  return (
    <div className="flex flex-col gap-2 p-3">
      {tasks.length > 0 && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-white/30">{done}/{tasks.length} done</span>
          <div className="flex-1 mx-3 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${tasks.length > 0 ? (done/tasks.length)*100 : 0}%`, background: accent }}/>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
        {tasks.map(task => (
          <div key={task.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 group"
            style={{ background: "rgba(255,255,255,0.03)" }}>
            <button onClick={() => toggle(task.id)}
              className="flex h-4.5 w-4.5 flex-shrink-0 items-center justify-center rounded border transition-all"
              style={{
                width: 18, height: 18,
                borderColor: task.done ? accent : "rgba(255,255,255,0.15)",
                background: task.done ? accent : "transparent",
              }}>
              {task.done && <Check style={{ width: 10, height: 10, color: "white" }} />}
            </button>
            <span className="flex-1 text-xs transition-colors"
              style={{ color: task.done ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.75)",
                textDecoration: task.done ? "line-through" : "none" }}>
              {task.text}
            </span>
            <button onClick={() => remove(task.id)}
              className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all">
              <X style={{ width: 11, height: 11 }} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-1.5 mt-1">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && add()}
          placeholder="Add task..."
          className="flex-1 rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-white/25"/>
        <button onClick={add} disabled={!input.trim()}
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-white disabled:opacity-30"
          style={{ background: accent }}>
          <Plus style={{ width: 13, height: 13 }} />
        </button>
      </div>
    </div>
  );
}

// ─── Notes Widget ──────────────────────────────────────────────────────────────

function NotesWidget() {
  const [text, setText] = useState(() => {
    try { return localStorage.getItem("medqs-notes") ?? ""; } catch { return ""; }
  });

  function handleChange(v: string) {
    setText(v);
    try { localStorage.setItem("medqs-notes", v); } catch {}
  }

  return (
    <div className="p-2 h-full">
      <textarea value={text} onChange={e => handleChange(e.target.value)}
        placeholder="Quick notes..."
        className="w-full h-full min-h-[120px] resize-none bg-transparent text-xs text-white/70 placeholder-white/20 focus:outline-none leading-relaxed"
      />
    </div>
  );
}

// ─── Drawing Canvas ────────────────────────────────────────────────────────────

function DrawingCanvas({ color, bgColor }: { color: string; bgColor: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [size, setSize] = useState(3);
  const drawing = useRef(false);
  const last = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const saved = localStorage.getItem("medqs-drawing");
    if (saved) {
      const img = new Image();
      img.onload = () => canvas.getContext("2d")?.drawImage(img, 0, 0);
      img.src = saved;
    }
  }, []);

  function save() {
    try { localStorage.setItem("medqs-drawing", canvasRef.current?.toDataURL() ?? ""); } catch {}
  }

  function getPos(e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  }

  function onDown(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    drawing.current = true;
    const canvas = canvasRef.current!;
    const pos = getPos(e, canvas);
    last.current = pos;
    const ctx = canvas.getContext("2d")!;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, (tool === "eraser" ? size * 4 : size) / 2, 0, Math.PI * 2);
    ctx.fillStyle = tool === "eraser" ? bgColor : color;
    ctx.fill();
  }

  function onMove(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    if (!drawing.current) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = tool === "eraser" ? bgColor : color;
    ctx.lineWidth = tool === "eraser" ? size * 4 : size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    last.current = pos;
  }

  function onUp() { drawing.current = false; save(); }

  function clear() {
    const canvas = canvasRef.current!;
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
    try { localStorage.removeItem("medqs-drawing"); } catch {}
  }

  return (
    <div className="flex flex-col gap-2 p-2 h-full">
      <div className="flex items-center gap-2">
        <button onClick={() => setTool("pen")}
          className="flex items-center gap-1 rounded px-2 py-1 text-xs transition-all"
          style={{ background: tool === "pen" ? color + "33" : "rgba(255,255,255,0.05)", color: tool === "pen" ? color : "rgba(255,255,255,0.4)" }}>
          <Pencil style={{ width: 11, height: 11 }} /> Pen
        </button>
        <button onClick={() => setTool("eraser")}
          className="flex items-center gap-1 rounded px-2 py-1 text-xs transition-all"
          style={{ background: tool === "eraser" ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)" }}>
          <Eraser style={{ width: 11, height: 11 }} /> Eraser
        </button>
        <input type="range" min="1" max="20" value={size} onChange={e => setSize(Number(e.target.value))} className="w-20" style={{ accentColor: color }} />
        <button onClick={clear} className="ml-auto text-[10px] text-white/25 hover:text-red-400 transition-colors">Clear</button>
      </div>
      <canvas ref={canvasRef} width={800} height={500}
        className="flex-1 rounded-lg cursor-crosshair touch-none"
        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
        onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
        onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}
      />
    </div>
  );
}

// ─── Widget Container ──────────────────────────────────────────────────────────

function WidgetContainer({
  widget, onRemove, onMinimize, onDrag, accent, tasks, setTasks, bgColor, drawColor,
}: {
  widget: Widget;
  onRemove: (id: string) => void;
  onMinimize: (id: string) => void;
  onDrag: (id: string, x: number, y: number) => void;
  accent: string;
  tasks: Task[];
  setTasks: (t: Task[]) => void;
  bgColor: string;
  drawColor: string;
}) {
  const dragStart = useRef<{ mx: number; my: number; wx: number; wy: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  function onMouseDown(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest(".no-drag")) return;
    dragStart.current = { mx: e.clientX, my: e.clientY, wx: widget.x, wy: widget.y };
    const onMove = (ev: MouseEvent) => {
      if (!dragStart.current) return;
      const dx = ev.clientX - dragStart.current.mx;
      const dy = ev.clientY - dragStart.current.my;
      onDrag(widget.id, Math.max(0, dragStart.current.wx + dx), Math.max(0, dragStart.current.wy + dy));
    };
    const onUp = () => { dragStart.current = null; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  const Icon = WIDGET_ICONS[widget.type];

  return (
    <div ref={containerRef}
      className="absolute rounded-2xl overflow-hidden select-none"
      style={{
        left: widget.x, top: widget.y,
        width: widget.minimized ? "auto" : widget.w,
        height: widget.minimized ? "auto" : widget.h,
        background: "rgba(15, 17, 23, 0.88)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
        zIndex: 10,
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 cursor-grab active:cursor-grabbing border-b border-white/5"
        style={{ background: "rgba(255,255,255,0.02)" }}
        onMouseDown={onMouseDown}>
        <Icon style={{ width: 12, height: 12, color: accent }} />
        <span className="text-xs font-medium flex-1" style={{ color: "rgba(255,255,255,0.6)" }}>
          {WIDGET_LABELS[widget.type]}
        </span>
        <div className="flex items-center gap-1 no-drag">
          <button onClick={() => onMinimize(widget.id)}
            className="flex h-5 w-5 items-center justify-center rounded text-white/20 hover:text-white/60 transition-colors">
            {widget.minimized ? <Maximize2 style={{ width: 10, height: 10 }} /> : <Minimize2 style={{ width: 10, height: 10 }} />}
          </button>
          <button onClick={() => onRemove(widget.id)}
            className="flex h-5 w-5 items-center justify-center rounded text-white/20 hover:text-red-400 transition-colors">
            <X style={{ width: 10, height: 10 }} />
          </button>
        </div>
      </div>

      {/* Body */}
      {!widget.minimized && (
        <div className="overflow-auto no-drag" style={{ height: widget.h - 36 }}>
          {widget.type === "pomodoro" && <PomodoroWidget accent={accent} />}
          {widget.type === "timer"    && <TimerWidget accent={accent} />}
          {widget.type === "spotify"  && <SpotifyWidget />}
          {widget.type === "tasks"    && <TasksWidget tasks={tasks} setTasks={setTasks} accent={accent} />}
          {widget.type === "notes"    && <NotesWidget />}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function StudySpacePage() {
  const [state, setState] = useState<BoardState>(DEFAULT_STATE);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [drawMode, setDrawMode] = useState(false);
  const [drawColor, setDrawColor] = useState("#60a5fa");
  const boardRef = useRef<HTMLDivElement>(null);

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("medqs-study-space");
      if (saved) {
        const parsed = JSON.parse(saved);
        setState(prev => ({ ...prev, ...parsed }));
      }
    } catch {}
  }, []);

  // Save to localStorage
  function save(newState: BoardState) {
    setState(newState);
    try { localStorage.setItem("medqs-study-space", JSON.stringify(newState)); } catch {}
  }

  function addWidget(type: WidgetType) {
    const defaults: Record<WidgetType, { w: number; h: number }> = {
      pomodoro: { w: 220, h: 260 },
      timer:    { w: 220, h: 230 },
      spotify:  { w: 280, h: 270 },
      tasks:    { w: 260, h: 300 },
      notes:    { w: 260, h: 200 },
    };
    const newWidget: Widget = {
      id: Date.now().toString(),
      type,
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 100,
      ...defaults[type],
    };
    save({ ...state, widgets: [...state.widgets, newWidget] });
    setShowAddMenu(false);
  }

  function removeWidget(id: string) {
    save({ ...state, widgets: state.widgets.filter(w => w.id !== id) });
  }

  function minimizeWidget(id: string) {
    save({ ...state, widgets: state.widgets.map(w => w.id === id ? { ...w, minimized: !w.minimized } : w) });
  }

  function dragWidget(id: string, x: number, y: number) {
    save({ ...state, widgets: state.widgets.map(w => w.id === id ? { ...w, x, y } : w) });
  }

  function setBg(key: keyof BoardState, val: string) {
    save({ ...state, [key]: val });
  }

  const BG_PATTERNS: Record<BgType, string> = {
    solid: "",
    grid: `repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 32px),
           repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 32px)`,
    dots: `radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)`,
    blur: "",
  };

  const boardStyle: React.CSSProperties = {
    background: state.bgColor,
    backgroundImage: state.bgType === "dots"
      ? `radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)`
      : BG_PATTERNS[state.bgType],
    backgroundSize: state.bgType === "dots" ? "20px 20px" : "32px 32px",
    position: "relative",
    overflow: "hidden",
    flex: 1,
    minHeight: "calc(100vh - 0px)",
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5 flex-shrink-0"
        style={{ background: "rgba(10,11,15,0.95)", backdropFilter: "blur(10px)" }}>

        <span className="font-display text-sm font-semibold text-white/80 mr-2">Study Space</span>

        {/* Add widget */}
        <div className="relative">
          <button onClick={() => setShowAddMenu(p => !p)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white border border-white/10 hover:border-white/20 transition-all"
            style={{ background: "rgba(255,255,255,0.04)" }}>
            <Plus style={{ width: 13, height: 13 }} />
            Add Widget
            <ChevronDown style={{ width: 11, height: 11 }} />
          </button>
          {showAddMenu && (
            <div className="absolute top-full left-0 mt-1 rounded-xl overflow-hidden z-50 animate-fade-in"
              style={{ background: "rgba(15,17,23,0.98)", border: "1px solid rgba(255,255,255,0.08)", minWidth: 160, boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
              {(Object.entries(WIDGET_LABELS) as [WidgetType, string][]).map(([type, label]) => {
                const Icon = WIDGET_ICONS[type];
                return (
                  <button key={type} onClick={() => addWidget(type)}
                    className="flex w-full items-center gap-2.5 px-3 py-2.5 text-xs text-white/60 hover:text-white hover:bg-white/5 transition-colors">
                    <Icon style={{ width: 13, height: 13, color: state.accentColor }} />
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Draw mode toggle */}
        <button onClick={() => setDrawMode(d => !d)}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium border transition-all",
            drawMode
              ? "text-white border-white/20"
              : "text-white/50 border-white/10 hover:text-white/70"
          )}
          style={{ background: drawMode ? state.accentColor + "33" : "rgba(255,255,255,0.04)" }}>
          <Pencil style={{ width: 13, height: 13 }} />
          {drawMode ? "Drawing" : "Draw"}
        </button>

        {drawMode && (
          <input type="color" value={drawColor} onChange={e => setDrawColor(e.target.value)}
            title="Pen color"
            className="h-7 w-7 cursor-pointer rounded border-0 bg-transparent p-0" />
        )}

        <div className="flex-1" />

        {/* Settings */}
        <button onClick={() => setShowSettings(p => !p)}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-white/40 hover:text-white/70 border border-white/8 transition-all"
          style={{ background: "rgba(255,255,255,0.03)" }}>
          <Palette style={{ width: 13, height: 13 }} />
        </button>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="flex items-center gap-4 px-4 py-2 border-b border-white/5 flex-shrink-0 flex-wrap"
          style={{ background: "rgba(10,11,15,0.9)" }}>
          <span className="text-[10px] text-white/30 uppercase tracking-wider">Background</span>
          {(["solid","grid","dots","blur"] as BgType[]).map(t => (
            <button key={t} onClick={() => setBg("bgType", t)}
              className={cn("rounded px-2.5 py-1 text-[11px] capitalize transition-all",
                state.bgType === t ? "text-white" : "text-white/35 hover:text-white/60")}
              style={{ background: state.bgType === t ? state.accentColor + "33" : "rgba(255,255,255,0.04)", border: `1px solid ${state.bgType === t ? state.accentColor + "55" : "rgba(255,255,255,0.07)"}` }}>
              {t}
            </button>
          ))}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-white/30">Color</span>
            <input type="color" value={state.bgColor} onChange={e => setBg("bgColor", e.target.value)}
              className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-white/30">Accent</span>
            <input type="color" value={state.accentColor} onChange={e => setBg("accentColor", e.target.value)}
              className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0" />
          </div>
          <button onClick={() => { setState(DEFAULT_STATE); try { localStorage.removeItem("medqs-study-space"); } catch {} }}
            className="ml-auto text-[10px] text-white/20 hover:text-red-400 transition-colors">
            Reset board
          </button>
        </div>
      )}

      {/* Board */}
      <div ref={boardRef} style={boardStyle}>
        {/* Drawing canvas overlay */}
        {drawMode && (
          <div className="absolute inset-0 z-20">
            <DrawingCanvas color={drawColor} bgColor={state.bgColor} />
          </div>
        )}

        {/* Empty state */}
        {state.widgets.length === 0 && !drawMode && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 pointer-events-none">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px dashed rgba(255,255,255,0.1)" }}>
                <Layers style={{ width: 24, height: 24, color: "rgba(255,255,255,0.15)" }} />
              </div>
              <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.25)" }}>Your study board is empty</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.12)" }}>Click "Add Widget" to get started</p>
            </div>
          </div>
        )}

        {/* Widgets */}
        {!drawMode && state.widgets.map(widget => (
          <WidgetContainer
            key={widget.id}
            widget={widget}
            onRemove={removeWidget}
            onMinimize={minimizeWidget}
            onDrag={dragWidget}
            accent={state.accentColor}
            tasks={state.tasks}
            setTasks={(t) => save({ ...state, tasks: t })}
            bgColor={state.bgColor}
            drawColor={drawColor}
          />
        ))}
      </div>
    </div>
  );
}
