"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import { marked } from "marked";
// @ts-ignore
import html2pdf from "html2pdf.js";
import { cn } from "@/lib/utils";
import {
  Highlighter, Pen, Eraser, StickyNote, Download, Trash2,
  FileText, Sparkles, Undo2, Palette, Plus, Minus,
  ChevronDown, Type, X, RotateCcw, FileEdit, Loader2
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import toast from "react-hot-toast";

const STORAGE_KEY = "notes-annotations";

const HIGHLIGHT_COLORS = [
  "#FFEB3B", "#90EE90", "#87CEEB", "#FFB7B2", "#DDA0DD", "#FFA500",
];

const PEN_COLORS = [
  "#1e293b", "#dc2626", "#ea580c", "#ca8a04", "#16a34a", "#0d9488", "#7c3aed", "#db2777",
];

type Mode = "view" | "highlight" | "pen" | "note" | "eraser";

interface StickyNote {
  id: string;
  x: number;
  y: number;
  content: string;
}

function loadAnnotations(lectureId: string) {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}-${lectureId}`);
    if (raw) return JSON.parse(raw) as { content: string; drawingDataUrl: string; stickyNotes: StickyNote[] };
  } catch {}
  return null;
}

function saveAnnotations(lectureId: string, data: { content: string; drawingDataUrl: string; stickyNotes: StickyNote[] }) {
  try {
    localStorage.setItem(`${STORAGE_KEY}-${lectureId}`, JSON.stringify(data));
  } catch {}
}

export function LectureNotesAnnotator({
  markdown,
  lectureId,
  isAdmin = false,
}: {
  markdown?: string | null;
  lectureId: string;
  isAdmin?: boolean;
}) {
  const [mode, setMode] = useState<Mode>("view");
  const [activeColor, setActiveColor] = useState(HIGHLIGHT_COLORS[0]);
  const [penSize, setPenSize] = useState(3);
  const [stickyNotes, setStickyNotes] = useState<StickyNote[]>([]);
  const [drawingDataUrl, setDrawingDataUrl] = useState<string>("");
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [ready, setReady] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [showSourceEditor, setShowSourceEditor] = useState(false);
  const [draftSourceMarkdown, setDraftSourceMarkdown] = useState("");
  const [savingSource, setSavingSource] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const drawing = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const prevModeRef = useRef<Mode>("view");

  const hasContent = !!markdown?.trim();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Highlight.configure({ multicolor: true }),
    ],
    content: "",
    editable: mode === "highlight",
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      setHtmlContent(html);
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none px-8 py-6 text-sm leading-relaxed",
      },
    },
  });

  // Initialize content from markdown + localStorage
  useEffect(() => {
    if (!editor || !hasContent) return;

    const saved = loadAnnotations(lectureId);

    if (saved?.content) {
      editor.commands.setContent(saved.content);
      setHtmlContent(saved.content);
      setDrawingDataUrl(saved.drawingDataUrl || "");
      setStickyNotes(saved.stickyNotes || []);
    } else {
      const html = marked.parse(markdown!, { async: false }) as string;
      editor.commands.setContent(html);
      setHtmlContent(html);
    }
    setReady(true);
  }, [editor, markdown, lectureId, hasContent]);

  // Save to localStorage on changes
  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => {
      saveAnnotations(lectureId, {
        content: htmlContent,
        drawingDataUrl,
        stickyNotes,
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [htmlContent, drawingDataUrl, stickyNotes, lectureId, ready]);

  // Restore canvas drawing
  useEffect(() => {
    if (!canvasRef.current || !drawingDataUrl) return;
    const img = new Image();
    img.onload = () => {
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) ctx.drawImage(img, 0, 0);
    };
    img.src = drawingDataUrl;
  }, [drawingDataUrl, ready]);

  // Sync editor editable state with mode
  useEffect(() => {
    if (!editor) return;
    editor.setEditable(mode === "highlight" || mode === "note");

    if (mode !== "highlight" && mode !== "note") {
      editor.commands.blur();
    }
  }, [mode, editor]);

  // Canvas resize
  useEffect(() => {
    if (!pageRef.current || !canvasRef.current) return;
    const resize = () => {
      const page = pageRef.current;
      const canvas = canvasRef.current;
      if (!page || !canvas) return;
      canvas.width = page.offsetWidth;
      canvas.height = page.offsetHeight;
    };
    resize();
    const obs = new ResizeObserver(resize);
    if (pageRef.current) obs.observe(pageRef.current);
    return () => obs.disconnect();
  }, [ready]);

  // ── Drawing handlers ──

  const getCanvasPos = useCallback((e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (mode === "pen") {
      const canvas = canvasRef.current;
      if (!canvas) return;
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      drawing.current = true;
      const pos = getCanvasPos(e);
      last.current = pos;
      const ctx = canvas.getContext("2d")!;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, penSize / 2, 0, Math.PI * 2);
      ctx.fillStyle = activeColor;
      ctx.fill();
    } else if (mode === "eraser") {
      const canvas = canvasRef.current;
      if (!canvas) return;
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      drawing.current = true;
      const pos = getCanvasPos(e);
      last.current = pos;
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(pos.x - 10, pos.y - 10, 20, 20);
    }
  }, [mode, penSize, activeColor, getCanvasPos]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!drawing.current || (mode !== "pen" && mode !== "eraser")) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const pos = getCanvasPos(e);

    if (mode === "pen") {
      ctx.beginPath();
      ctx.moveTo(last.current.x, last.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = penSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
    } else {
      ctx.clearRect(pos.x - 10, pos.y - 10, 20, 20);
    }
    last.current = pos;
  }, [mode, penSize, activeColor, getCanvasPos]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (mode === "pen" || mode === "eraser") {
      const canvas = canvasRef.current;
      if (canvas?.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
      drawing.current = false;
      // Save canvas state
      const dataUrl = canvas?.toDataURL();
      if (dataUrl) setDrawingDataUrl(dataUrl);
    }
  }, [mode]);

  const onPageClick = useCallback((e: React.MouseEvent) => {
    if (mode === "note" && pageRef.current) {
      const rect = pageRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const newNote: StickyNote = {
        id: `note-${Date.now()}`,
        x, y,
        content: "",
      };
      setStickyNotes(prev => [...prev, newNote]);
      setTimeout(() => {
        const el = document.getElementById(newNote.id);
        el?.focus();
      }, 50);
    }
  }, [mode]);

  const deleteStickyNote = useCallback((id: string) => {
    setStickyNotes(prev => prev.filter(n => n.id !== id));
  }, []);

  const updateStickyNote = useCallback((id: string, content: string) => {
    setStickyNotes(prev => prev.map(n => n.id === id ? { ...n, content } : n));
  }, []);

  // ── Apply highlight via TipTap ──
  const applyHighlight = useCallback((color?: string) => {
    if (!editor) return;
    const c = color || activeColor;
    editor.chain().focus().toggleHighlight({ color: c }).run();
  }, [editor, activeColor]);

  const removeHighlight = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().toggleHighlight().run();
  }, [editor]);

  // ── Clear canvas drawing ──
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setDrawingDataUrl("");
  }, []);

  // ── Clear all annotations ──
  const clearAll = useCallback(() => {
    if (!editor || !hasContent) return;
    const plainHtml = marked.parse(markdown!, { async: false }) as string;
    editor.commands.setContent(plainHtml);
    setHtmlContent(plainHtml);
    clearCanvas();
    setStickyNotes([]);
    localStorage.removeItem(`${STORAGE_KEY}-${lectureId}`);
  }, [editor, hasContent, markdown, clearCanvas, lectureId]);

  // ── Export PDF ──
  const exportPDF = useCallback(async () => {
    if (!pageRef.current) return;
    const canvas = canvasRef.current;
    // Save canvas state temporarily to show it in PDF
    const canvasData = canvas?.toDataURL();

    // Prepare the export container — clone the page and composite canvas as image
    const clone = pageRef.current.cloneNode(true) as HTMLElement;
    clone.style.position = "fixed";
    clone.style.left = "-9999px";
    clone.style.top = "0";
    clone.style.width = pageRef.current.offsetWidth + "px";
    clone.style.background = "white";
    document.body.appendChild(clone);

    // Composite drawing onto the clone
    if (canvasData && canvasData !== drawingDataUrl) {
      const img = document.createElement("img");
      img.src = canvasData;
      img.style.position = "absolute";
      img.style.top = "0";
      img.style.left = "0";
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.pointerEvents = "none";
      clone.appendChild(img);
    } else if (drawingDataUrl) {
      const img = document.createElement("img");
      img.src = drawingDataUrl;
      img.style.position = "absolute";
      img.style.top = "0";
      img.style.left = "0";
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.pointerEvents = "none";
      clone.appendChild(img);
    }

    const opt = {
      margin: 10,
      filename: `lecture-notes-${lectureId.slice(0, 8)}.pdf`,
      image: { type: "jpeg" as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
      jsPDF: { unit: "mm" as const, format: "a4" as const, orientation: "portrait" as const },
      pagebreak: { mode: ["avoid-all", "css", "legacy"] as any },
    };

    try {
      await html2pdf().set(opt).from(clone).save();
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      document.body.removeChild(clone);
    }
  }, [drawingDataUrl, lectureId]);

  // ── Save source notes (admin) ──
  const saveSourceNotes = useCallback(async () => {
    if (!draftSourceMarkdown.trim()) return;
    setSavingSource(true);
    try {
      const res = await fetch(`/api/v1/lectures/${lectureId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notesMarkdown: draftSourceMarkdown }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        toast.error(typeof (j as any)?.error === "string" ? (j as any).error : "Failed to save notes");
        return;
      }
      const html = marked.parse(draftSourceMarkdown, { async: false }) as string;
      editor?.commands.setContent(html);
      setHtmlContent(html);
      clearCanvas();
      setStickyNotes([]);
      localStorage.removeItem(`${STORAGE_KEY}-${lectureId}`);
      toast.success("Notes source updated");
      setShowSourceEditor(false);
    } catch {
      toast.error("Failed to save notes");
    } finally {
      setSavingSource(false);
    }
  }, [draftSourceMarkdown, lectureId, editor, clearCanvas]);

  // ── Toolbar buttons ──
  const tools: { id: Mode; icon: any; label: string }[] = [
    { id: "highlight", icon: Highlighter, label: "Highlight" },
    { id: "pen", icon: Pen, label: "Draw" },
    { id: "note", icon: StickyNote, label: "Note" },
    { id: "eraser", icon: Eraser, label: "Erase" },
  ];

  if (!hasContent) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-muted/30 py-24 text-center px-6">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
          <FileText className="h-7 w-7 text-primary" />
        </div>
        <h4 className="text-base font-black text-foreground">No Lecture Notes Available</h4>
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          Lecture notes for this session have not been uploaded yet. Check back later.
        </p>
      </div>
    );
  }

  return (
    <>
    <style>{`
      .notes-white-page .prose,
      .notes-white-page .prose * {
        color: #374151 !important;
      }
      .notes-white-page .prose h1,
      .notes-white-page .prose h2,
      .notes-white-page .prose h3,
      .notes-white-page .prose h4,
      .notes-white-page .prose h5,
      .notes-white-page .prose h6,
      .notes-white-page .prose strong,
      .notes-white-page .prose th {
        color: #111827 !important;
      }
      .notes-white-page .prose a {
        color: #2563eb !important;
      }
      .notes-white-page .prose code,
      .notes-white-page .prose pre {
        color: #1f2937 !important;
        background: #f3f4f6 !important;
      }
    `}</style>
    <div className="space-y-4">
      {/* ── Toolbar ── */}
      <div className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="flex flex-wrap items-center gap-1.5 py-2">
          {/* Mode toggles */}
          {tools.map(t => (
            <button
              key={t.id}
              onClick={() => setMode(mode === t.id ? "view" : t.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest transition-all",
                mode === t.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
            >
              <t.icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}

          <span className="mx-1 h-6 w-px bg-border/50" />

          {/* Highlight / Pen colors */}
          {(mode === "highlight" || mode === "pen") && (
            <div className="flex items-center gap-1">
              {(mode === "highlight" ? HIGHLIGHT_COLORS : PEN_COLORS).map(c => (
                <button
                  key={c}
                  onClick={() => setActiveColor(c)}
                  className={cn(
                    "h-5 w-5 rounded-full border-2 transition-all",
                    activeColor === c ? "border-foreground scale-110" : "border-transparent"
                  )}
                  style={{ background: c }}
                />
              ))}
            </div>
          )}

          {/* Pen size */}
          {mode === "pen" && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Minus className="h-3 w-3" />
              <input
                type="range"
                min={1}
                max={12}
                value={penSize}
                onChange={e => setPenSize(Number(e.target.value))}
                className="w-16 h-1"
              />
              <Plus className="h-3 w-3" />
            </div>
          )}

          <span className="mx-1 h-6 w-px bg-border/50" />

          {/* Apply Highlight (visible in highlight mode) */}
          {mode === "highlight" && (
            <button
              onClick={() => applyHighlight()}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-500/20 px-3 py-1.5 text-[10px] font-bold text-indigo-300 uppercase tracking-widest hover:bg-indigo-500/30 transition-all"
            >
              <Highlighter className="h-3 w-3" />
              Apply
            </button>
          )}

          {/* Clear drawing */}
          {mode === "pen" && (
            <button
              onClick={clearCanvas}
              className="flex items-center gap-1.5 rounded-xl bg-red-500/10 px-3 py-1.5 text-[10px] font-bold text-red-400 uppercase tracking-widest hover:bg-red-500/20 transition-all"
            >
              <Trash2 className="h-3 w-3" />
              Clear
            </button>
          )}

          <div className="ml-auto flex items-center gap-1.5">
            {isAdmin && (
              <button
                onClick={() => {
                  setDraftSourceMarkdown(markdown ?? "");
                  setShowSourceEditor(true);
                }}
                className="flex items-center gap-1.5 rounded-xl bg-amber-500/10 px-3 py-1.5 text-[10px] font-bold text-amber-400 uppercase tracking-widest hover:bg-amber-500/20 transition-all"
              >
                <FileEdit className="h-3 w-3" />
                <span className="hidden sm:inline">Edit Source</span>
              </button>
            )}

            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest hover:text-foreground hover:bg-white/5 transition-all"
            >
              <RotateCcw className="h-3 w-3" />
              <span className="hidden sm:inline">Reset</span>
            </button>

            <button
              onClick={exportPDF}
              className="flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-1.5 text-[10px] font-bold text-primary uppercase tracking-widest hover:bg-primary/20 transition-all"
            >
              <Download className="h-3 w-3" />
              <span className="hidden sm:inline">PDF</span>
            </button>
          </div>
        </div>
      </div>
      </div>

      {/* ── White Page ── */}
      <div className="mx-auto w-full max-w-4xl">
        <div
          ref={pageRef}
          onClick={onPageClick}
          className={cn(
            "notes-white-page relative overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5 transition-all",
            mode === "note" && "cursor-cell",
            mode === "pen" && "cursor-crosshair",
          )}
          style={{ minHeight: "600px" }}
        >
          {/* TipTap content */}
          {editor && (
            <div className={cn(mode === "highlight" ? "select-text" : "select-none")}
              onMouseUp={() => {
                if (mode === "highlight") {
                  const sel = window.getSelection();
                  if (sel && !sel.isCollapsed) applyHighlight();
                }
              }}
            >
              <EditorContent editor={editor} />
            </div>
          )}

          {/* Drawing canvas overlay */}
          <canvas
            ref={canvasRef}
            className={cn(
              "pointer-events-none absolute inset-0 h-full w-full",
              (mode === "pen" || mode === "eraser") && "pointer-events-auto",
            )}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          />

          {/* Sticky notes */}
          {stickyNotes.map(note => (
            <div
              key={note.id}
              id={note.id}
              className="absolute z-10 min-w-[150px] max-w-[220px] rounded-lg p-3 shadow-lg"
              style={{
                left: note.x,
                top: note.y,
                background: "#FFF9C4",
                transform: "translate(-50%, -50%)",
              }}
            >
              <textarea
                defaultValue={note.content}
                onChange={e => updateStickyNote(note.id, e.target.value)}
                placeholder="Write note..."
                className="w-full resize-y bg-transparent text-xs text-amber-950 placeholder-amber-800/30 focus:outline-none"
                rows={3}
              />
              <button
                onClick={() => deleteStickyNote(note.id)}
                className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white opacity-0 hover:opacity-100 transition-opacity"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Admin: Edit Source Dialog ── */}
      <Dialog open={showSourceEditor} onOpenChange={setShowSourceEditor}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Notes Source</DialogTitle>
            <DialogDescription>
              Edit the markdown source that all students will see. Changes are saved immediately to the lecture.
            </DialogDescription>
          </DialogHeader>
          <textarea
            value={draftSourceMarkdown}
            onChange={(e) => setDraftSourceMarkdown(e.target.value)}
            className="flex-1 min-h-[300px] rounded-lg border border-border bg-background p-4 text-sm font-mono leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary resize-y"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowSourceEditor(false)}
              className="rounded-lg border border-border px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-muted transition-all"
            >
              Cancel
            </button>
            <button
              onClick={saveSourceNotes}
              disabled={savingSource || !draftSourceMarkdown.trim()}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-[10px] font-bold text-primary-foreground uppercase tracking-widest hover:bg-primary/90 disabled:opacity-50 transition-all"
            >
              {savingSource ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileEdit className="h-3.5 w-3.5" />}
              {savingSource ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </>
  );
}
