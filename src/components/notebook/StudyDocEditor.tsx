"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw";
import { TiptapEditor } from "./TiptapEditor";
import { cn } from "@/lib/utils";
import {
  Save, FileText, Pen, Loader2, Maximize2, Minimize2, Trash2, Sparkles, Wand2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

const Excalidraw = dynamic(
  () => import("@/vendor/excalidraw/vendor").then((m) => m.Excalidraw),
  { ssr: false, loading: () => (
    <div className="flex items-center justify-center h-64 bg-white/[0.02] rounded-2xl border border-white/[0.06]">
      <Loader2 className="h-6 w-6 animate-spin text-white/30" />
    </div>
  )}
);

interface StudyDocEditorProps {
  lectureId: string;
}

export function StudyDocEditor({ lectureId }: StudyDocEditorProps) {
  const [textContent, setTextContent] = useState("");
  const [noteId, setNoteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [drawingExpanded, setDrawingExpanded] = useState(false);
  const [initialDrawingData, setInitialDrawingData] = useState<any>(null);
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const drawingDataRef = useRef<any>(null);

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
          setNoteId(data.note.id);
          const parsed = parseNoteContent(data.note.content);
          setTextContent(parsed.text);
          if (parsed.drawing) {
            setInitialDrawingData(parsed.drawing);
            drawingDataRef.current = parsed.drawing;
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch note:", err);
    } finally {
      setLoading(false);
    }
  }

  function parseNoteContent(raw: string): { text: string; drawing: any } {
    try {
      const lines = raw.split("\n---DRAWING---\n");
      if (lines.length === 2) {
        return { text: lines[0], drawing: JSON.parse(lines[1]) };
      }
    } catch {}
    return { text: raw, drawing: null };
  }

  function buildContent(text: string, drawing: any): string {
    if (drawing) {
      return text + "\n---DRAWING---\n" + JSON.stringify(drawing);
    }
    return text;
  }

  async function handleSave() {
    setSaving(true);
    try {
      let drawingData = drawingDataRef.current;
      if (apiRef.current) {
        const elements = apiRef.current.getSceneElements();
        const appState = apiRef.current.getAppState();
        if (elements.length > 0) {
          drawingData = { elements, appState: { ...appState, collaborators: [] } };
          drawingDataRef.current = drawingData;
        }
      }
      const content = buildContent(textContent, drawingData);
      const res = await fetch(noteId ? "/api/v1/notebook" : "/api/v1/notebook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lectureId, content, id: noteId }),
      });
      if (res.ok) {
        const data = await res.json();
        setNoteId(data.note?.id || noteId);
        toast.success("Document saved");
      } else {
        toast.error("Failed to save");
      }
    } catch {
      toast.error("Error saving");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-white/30" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <FileText size={14} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white/80">Study Document</h3>
            <p className="text-[9px] text-white/30 uppercase tracking-wider">Rich Text + Drawings</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setDrawingExpanded(!drawingExpanded)}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[9px] font-bold uppercase tracking-wider transition-all",
              drawingExpanded
                ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                : "bg-white/5 border-white/10 text-white/50 hover:text-white"
            )}>
            <Pen size={12} />
            {drawingExpanded ? "Hide Drawing" : "Drawing"}
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20 transition-all text-[9px] font-bold uppercase tracking-wider">
            <Save size={12} />
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Tiptap Rich Text Editor */}
      <TiptapEditor
        content={textContent}
        onChange={setTextContent}
        placeholder="Write your study notes here..."
      />

      {/* Excalidraw Drawing Canvas */}
      <AnimatePresence>
        {drawingExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]"
          >
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.04]">
              <div className="flex items-center gap-2">
                <Pen size={12} className="text-indigo-400" />
                <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Drawing Canvas</span>
              </div>
              <button onClick={() => {
                apiRef.current?.resetScene();
                drawingDataRef.current = null;
                toast.success("Canvas cleared");
              }}
                className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-white/5 transition-all">
                <Trash2 size={12} />
              </button>
            </div>
            <div className="h-[400px] md:h-[500px]">
              <Excalidraw
                excalidrawAPI={(api: ExcalidrawImperativeAPI) => { apiRef.current = api; }}
                initialData={initialDrawingData}
                onChange={(elements: any[], appState: any) => {
                  if (elements.length > 0) {
                    drawingDataRef.current = { elements, appState: { ...appState, collaborators: [] } };
                  }
                }}
                theme="dark"
                viewModeEnabled={false}
                zenModeEnabled={false}
                gridModeEnabled={false}
                UIOptions={{ canvasActions: { toggleTheme: false } }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Actions */}
      <div className="flex items-center gap-2 pt-2">
        <span className="text-[8px] font-bold text-white/20 uppercase tracking-[0.2em]">AI Tools</span>
        <button className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-medium text-white/40 hover:text-indigo-300 transition-all">
          <Wand2 size={10} />
          Summarize
        </button>
        <button className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-medium text-white/40 hover:text-indigo-300 transition-all">
          <Sparkles size={10} />
          Flashcards
        </button>
      </div>
    </div>
  );
}
