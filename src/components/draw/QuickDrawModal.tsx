"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { X, Pencil, Eraser, Download, Loader2, Check, Type } from "lucide-react";
import toast from "react-hot-toast";
import { uploadQuestionImageClient } from "@/lib/upload-question-image-client";

const PRESET_COLORS = [
  "#1e293b",
  "#dc2626",
  "#ea580c",
  "#ca8a04",
  "#16a34a",
  "#2563eb",
  "#7c3aed",
  "#db2777",
  "#ffffff",
];

type Props = {
  open: boolean;
  onClose: () => void;
  /** Called with public URL after upload, or data URL if upload skipped */
  onSaved: (url: string) => void;
  title?: string;
  /** Canvas background for export (e.g. white for clean figures) */
  exportBackground?: string;
};

export function QuickDrawModal({
  open,
  onClose,
  onSaved,
  title = "Sketch",
  exportBackground = "#ffffff",
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<"pen" | "eraser" | "text">("pen");
  const [color, setColor] = useState("#1e293b");
  const [size, setSize] = useState(4);
  const [textBuffer, setTextBuffer] = useState("");
  const [textSize, setTextSize] = useState(22);
  const drawing = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const [uploading, setUploading] = useState(false);

  const W = 720;
  const H = 480;

  const clear = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = exportBackground;
    ctx.fillRect(0, 0, c.width, c.height);
  }, [exportBackground]);

  useEffect(() => {
    if (!open) return;
    const t = requestAnimationFrame(() => clear());
    return () => cancelAnimationFrame(t);
  }, [open, clear]);

  function getPos(e: React.PointerEvent | PointerEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function stampTextAt(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const raw = textBuffer.trim();
    if (!raw) {
      toast.error("Type text in the box below, then click on the canvas to place it");
      return;
    }
    const lines = raw.split(/\r?\n/);
    const lineHeight = textSize * 1.25;
    ctx.save();
    ctx.font = `${textSize}px ui-sans-serif, system-ui, sans-serif`;
    ctx.fillStyle = color;
    ctx.textBaseline = "top";
    lines.forEach((line, i) => {
      ctx.fillText(line, x, y + i * lineHeight);
    });
    ctx.restore();
  }

  function onPointerDown(e: React.PointerEvent) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    const pos = getPos(e, canvas);

    if (tool === "text") {
      const ctx = canvas.getContext("2d")!;
      stampTextAt(ctx, pos.x, pos.y);
      return;
    }

    canvas.setPointerCapture(e.pointerId);
    drawing.current = true;
    last.current = pos;
    const ctx = canvas.getContext("2d")!;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, (tool === "eraser" ? size * 3 : size) / 2, 0, Math.PI * 2);
    ctx.fillStyle = tool === "eraser" ? exportBackground : color;
    ctx.fill();
  }

  function onPointerMove(e: React.PointerEvent) {
    if (tool === "text") return;
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = tool === "eraser" ? exportBackground : color;
    ctx.lineWidth = tool === "eraser" ? size * 5 : size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    last.current = pos;
  }

  function onPointerUp(e: React.PointerEvent) {
    if (tool === "text") return;
    const canvas = canvasRef.current;
    if (canvas?.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    drawing.current = false;
  }

  function downloadPng() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const out = document.createElement("canvas");
    out.width = canvas.width;
    out.height = canvas.height;
    const ctx = out.getContext("2d")!;
    ctx.fillStyle = exportBackground;
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.drawImage(canvas, 0, 0);
    out.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `medqs-draw-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success("Download started");
    }, "image/png");
  }

  async function saveToQuestion() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setUploading(true);
    try {
      const out = document.createElement("canvas");
      out.width = canvas.width;
      out.height = canvas.height;
      const ctx = out.getContext("2d")!;
      ctx.fillStyle = exportBackground;
      ctx.fillRect(0, 0, out.width, out.height);
      ctx.drawImage(canvas, 0, 0);

      const blob = await new Promise<Blob | null>((res) => out.toBlob(res, "image/png"));
      if (!blob) throw new Error("No image");

      const pngFile = new File([blob], "draw.png", { type: "image/png" });
      const result = await uploadQuestionImageClient(pngFile);
      if (!result.ok) {
        const dataUrl = out.toDataURL("image/png");
        onSaved(dataUrl);
        toast.success("Cloud upload failed — using embedded image for this question");
        onClose();
        return;
      }
      onSaved(result.url);
      toast.success("Image attached");
      onClose();
    } catch {
      toast.error("Could not save drawing");
    } finally {
      setUploading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[95vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="font-display text-lg font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/30 px-4 py-2">
          <button
            type="button"
            onClick={() => setTool("pen")}
            className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium ${
              tool === "pen" ? "bg-primary text-primary-foreground" : "bg-background"
            }`}
          >
            <Pencil className="h-3.5 w-3.5" /> Pen
          </button>
          <button
            type="button"
            onClick={() => setTool("eraser")}
            className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium ${
              tool === "eraser" ? "bg-primary text-primary-foreground" : "bg-background"
            }`}
          >
            <Eraser className="h-3.5 w-3.5" /> Eraser
          </button>
          <button
            type="button"
            onClick={() => setTool("text")}
            className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium ${
              tool === "text" ? "bg-primary text-primary-foreground" : "bg-background"
            }`}
            title="اكتب النص في الحقل ثم انقر على اللوحة"
          >
            <Type className="h-3.5 w-3.5" /> Text
          </button>
          {tool === "text" ? (
            <>
              <label className="flex min-w-[200px] flex-[1_1_220px] flex-col gap-1 text-xs text-muted-foreground">
                <span>Text (several lines ok) — then click on canvas</span>
                <textarea
                  value={textBuffer}
                  onChange={(e) => setTextBuffer(e.target.value)}
                  placeholder="Type here, then tap where to place…"
                  rows={2}
                  className="w-full resize-y rounded border border-border bg-background px-2 py-1.5 text-sm text-foreground"
                />
              </label>
              <label className="flex items-center gap-1 text-xs text-muted-foreground">
                حجم
                <input
                  type="range"
                  min={12}
                  max={42}
                  value={textSize}
                  onChange={(e) => setTextSize(Number(e.target.value))}
                  className="w-20"
                />
                <span className="w-6">{textSize}</span>
              </label>
            </>
          ) : (
            <input
              type="range"
              min={1}
              max={24}
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="w-24"
            />
          )}
          <div className="flex flex-wrap gap-1">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                title={c}
                onClick={() => setColor(c)}
                className="h-6 w-6 rounded-full border-2 border-border ring-offset-2"
                style={{ background: c, boxShadow: color === c ? "0 0 0 2px var(--ring)" : undefined }}
              />
            ))}
          </div>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-8 w-10 cursor-pointer rounded border-0" />
          <button type="button" onClick={clear} className="ml-auto text-xs text-muted-foreground hover:text-destructive">
            Clear
          </button>
        </div>

        <div className="relative flex-1 overflow-auto bg-muted/20 p-4">
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            className="mx-auto max-w-full touch-none rounded-xl border border-border shadow-inner"
            style={{
              cursor: tool === "text" ? "text" : tool === "pen" ? "crosshair" : "cell",
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          />
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border px-4 py-3">
          <button
            type="button"
            onClick={downloadPng}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            <Download className="h-4 w-4" />
            Export PNG
          </button>
          <button
            type="button"
            onClick={() => void saveToQuestion()}
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Use for question
          </button>
        </div>
      </div>
    </div>
  );
}
