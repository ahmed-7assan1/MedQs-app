"use client";
import { useState, useRef, useCallback } from "react";
import {
  FileText, Scissors, GitMerge, Archive, Eye, Lock, Unlock,
  RotateCw, Stamp, Wrench, Image, FileImage, Layers, AlignCenter,
  Shield, FileCheck, Globe, Crop, ZoomIn, Eraser, RefreshCw,
  Sparkles, Upload, Download, Loader2, X, MessageSquare, Send,
  ChevronRight, AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface PDFTool {
  id: string;
  label: string;
  desc: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  acceptsMultiple?: boolean;
  acceptsImages?: boolean;
}

const PDF_TOOLS: PDFTool[] = [
  { id: "compress", label: "Compress PDF", desc: "Reduce file size without losing quality", icon: Archive, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  { id: "merge", label: "Merge PDF", desc: "Combine multiple PDFs into one", icon: GitMerge, color: "text-violet-500", bg: "bg-violet-500/10", border: "border-violet-500/20", acceptsMultiple: true },
  { id: "split", label: "Split PDF", desc: "Divide a PDF into separate pages", icon: Scissors, color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20" },
  { id: "pdfjpg", label: "PDF to JPG", desc: "Convert each page to an image", icon: Image, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  { id: "imagepdf", label: "JPG to PDF", desc: "Convert images to a PDF document", icon: FileImage, color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20", acceptsImages: true },
  { id: "unlock", label: "Unlock PDF", desc: "Remove password protection", icon: Unlock, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  { id: "protect", label: "Protect PDF", desc: "Add a password to your PDF", icon: Lock, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20" },
  { id: "rotate", label: "Rotate PDF", desc: "Rotate pages to any angle", icon: RotateCw, color: "text-cyan-500", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
  { id: "watermark", label: "Watermark", desc: "Add text or image watermarks", icon: Stamp, color: "text-indigo-500", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
  { id: "repair", label: "Repair PDF", desc: "Fix corrupted PDF files", icon: Wrench, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" },
  { id: "pagenumber", label: "Page Numbers", desc: "Add page numbers automatically", icon: AlignCenter, color: "text-teal-500", bg: "bg-teal-500/10", border: "border-teal-500/20" },
  { id: "pdfa", label: "PDF to PDF/A", desc: "Convert to archival format", icon: FileCheck, color: "text-lime-500", bg: "bg-lime-500/10", border: "border-lime-500/20" },
  { id: "officepdf", label: "Office to PDF", desc: "Convert Word, Excel, PPT", icon: Layers, color: "text-sky-500", bg: "bg-sky-500/10", border: "border-sky-500/20" },
  { id: "htmlpdf", label: "HTML to PDF", desc: "Convert web pages to PDF", icon: Globe, color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  { id: "ocr", label: "PDF OCR", desc: "Extract text from scanned PDFs", icon: Eye, color: "text-pink-500", bg: "bg-pink-500/10", border: "border-pink-500/20" },
  { id: "validatepdfa", label: "Validate PDF/A", desc: "Check PDF/A compliance", icon: Shield, color: "text-fuchsia-500", bg: "bg-fuchsia-500/10", border: "border-fuchsia-500/20" },
];

const AI_TOOLS = [
  { id: "ai-summary", label: "AI Summary", desc: "Generate a smart summary of your PDF content", icon: Sparkles },
  { id: "ai-qa", label: "AI Q&A", desc: "Ask questions about your document", icon: MessageSquare },
];

export default function PDFToolsPage() {
  const [activeTool, setActiveTool] = useState<PDFTool | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultName, setResultName] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI panel
  const [aiMode, setAiMode] = useState<"summary" | "qa" | null>(null);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // Tool-specific options
  const [password, setPassword] = useState("");
  const [rotationDeg, setRotationDeg] = useState("90");
  const [watermarkText, setWatermarkText] = useState("CONFIDENTIAL");
  const [splitRanges, setSplitRanges] = useState("1-5,6-end");
  const [htmlUrl, setHtmlUrl] = useState("");

  const acceptAttr = useCallback(() => {
    if (!activeTool) return ".pdf";
    if (activeTool.acceptsImages) return "image/*";
    return ".pdf,.PDF";
  }, [activeTool]);

  function handleFiles(newFiles: File[]) {
    if (!activeTool?.acceptsMultiple) {
      setFiles([newFiles[0]].filter(Boolean) as File[]);
    } else {
      setFiles(prev => [...prev, ...newFiles]);
    }
    setResultUrl(null);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    handleFiles(dropped);
  }

  function removefile(idx: number) {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  }

  async function handleProcess() {
    console.log("[PDF Tools] handleProcess triggered");
    if (!activeTool) return;
    if (activeTool.id !== "htmlpdf" && files.length === 0) {
      return toast.error("Please upload at least one file");
    }
    setProcessing(true);
    setResultUrl(null);
    try {
      const fd = new FormData();
      fd.append("tool", activeTool.id);

      // Build tool-specific options
      const options: Record<string, unknown> = {};
      if (activeTool.id === "protect") options.password = password;
      if (activeTool.id === "rotate") options.rotate = parseInt(rotationDeg);
      if (activeTool.id === "watermark") {
        options.mode = "text";
        options.text = watermarkText;
        options.pages = "all";
        options.vertical_position = "middle";
        options.horizontal_position = "center";
        options.transparency = 50;
        options.font_size = 40;
      }
      if (activeTool.id === "split") {
        options.split_mode = "ranges";
        options.ranges = splitRanges;
      }
      if (activeTool.id === "htmlpdf") {
        options.html_url = htmlUrl;
      }
      if (Object.keys(options).length) fd.append("options", JSON.stringify(options));

      console.log("[PDF Tools] Starting process for tool:", activeTool.id);
      files.forEach((file, i) => {
        console.log(`[PDF Tools] Attaching file ${i+1}: ${file.name} (${(file.size/1024).toFixed(1)} KB)`);
        fd.append(`file${i}`, file);
      });

      const toastId = toast.loading("Connecting to PDF engine...");

      const res = await fetch("/api/v1/admin/pdf-tools", { method: "POST", body: fd });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("[PDF Tools] Server Error:", err);
        return toast.error(err.error || "Processing failed", { id: toastId });
      }

      console.log("[PDF Tools] Success! Downloading result...");
      toast.loading("Downloading result...", { id: toastId });

      const blob = await res.blob();
      console.log(`[PDF Tools] Received blob: ${blob.size} bytes`);
      if (blob.size === 0) throw new Error("The received file is empty (0 bytes). Please try again.");

      const url = window.URL.createObjectURL(blob);
      
      // Read filename from custom header to bypass IDM interception
      const xFilename = res.headers.get("X-Filename");
      const finalFilename = xFilename ? decodeURIComponent(xFilename) : `result_${activeTool.id}.pdf`;
      
      setResultUrl(url);
      setResultName(finalFilename);
      toast.success("Success! Ready to download.", { id: toastId });

      // Native download trigger
      const a = document.createElement("a");
      a.href = url;
      a.download = finalFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      console.log("[PDF Tools] Flow complete.");
    } catch (err: any) {
      console.error("[PDF Tools] Fatal Client Error:", err);
      toast.error("Network or processing error occurred");
    } finally { setProcessing(false); }
  }

  async function handleAI() {
    if (files.length === 0) return toast.error("Upload a PDF first");
    setAiLoading(true);
    setAiResult("");
    try {
      const fd = new FormData();
      fd.append("file", files[0]);
      if (aiMode === "qa") fd.append("question", aiQuestion);
      fd.append("mode", aiMode ?? "summary");

      const res = await fetch("/api/v1/ai/extract", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || "AI failed");
      setAiResult(aiMode === "summary" ? (data.summary ?? data.content ?? JSON.stringify(data)) : (data.answer ?? data.text ?? JSON.stringify(data)));
    } finally { setAiLoading(false); }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 space-y-8 pb-24">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-rose-500">Document Intelligence</p>
        <h1 className="font-display text-2xl font-bold md:text-3xl">PDF Tools Studio</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Complete PDF toolkit powered by ilovepdf API — 20+ tools with AI integration.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Left: Tool Grid */}
        <div className="space-y-6">
          {/* PDF Tools Grid */}
          <div className="rounded-2xl border border-white/[0.02] bg-card p-5 space-y-4 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">PDF Tools</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {PDF_TOOLS.map(tool => (
                <button
                  key={tool.id}
                  onClick={() => {
                    setActiveTool(tool);
                    setFiles([]);
                    setResultUrl(null);
                    setAiMode(null);
                  }}
                  className={cn(
                    "group flex flex-col items-start gap-2 rounded-xl border p-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg",
                    activeTool?.id === tool.id
                      ? `${tool.bg} ${tool.border} ring-1 ring-current shadow-md`
                      : "border-white/[0.02] bg-background/30 hover:border-white/[0.06]"
                  )}
                >
                  <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", tool.bg)}>
                    <tool.icon className={cn("h-4 w-4", tool.color)} />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold leading-tight">{tool.label}</p>
                    <p className="text-[9px] text-muted-foreground/60 leading-tight mt-0.5 hidden group-hover:block">{tool.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* AI Tools */}
          <div className="rounded-2xl border border-white/[0.02] bg-card p-5 space-y-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-violet-500" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">AI-Powered</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {AI_TOOLS.map(tool => (
                <button
                  key={tool.id}
                  onClick={() => {
                    setAiMode(tool.id === "ai-summary" ? "summary" : "qa");
                    setActiveTool(null);
                    setResultUrl(null);
                  }}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5",
                    (aiMode === "summary" && tool.id === "ai-summary") || (aiMode === "qa" && tool.id === "ai-qa")
                      ? "border-violet-500/30 bg-violet-500/10 ring-1 ring-violet-500/20"
                      : "border-white/[0.02] bg-background/30 hover:border-violet-500/10"
                  )}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 shrink-0">
                    <tool.icon className="h-4 w-4 text-violet-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold">{tool.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{tool.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Workspace */}
        <div className="space-y-4">
          {(!activeTool && !aiMode) ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.05] bg-card/40 p-12 text-center h-full min-h-[400px]">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/20 mb-4">
                <FileText className="h-8 w-8 text-muted-foreground/30" />
              </div>
              <p className="font-bold text-muted-foreground">Select a tool to begin</p>
              <p className="text-xs text-muted-foreground/50 mt-1">Choose from PDF tools or AI features on the left</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/[0.02] bg-card shadow-sm overflow-hidden">
              {/* Tool Header */}
              <div className={cn("p-5 border-b border-white/[0.05]", activeTool ? activeTool.bg : "bg-violet-500/5")}>
                <div className="flex items-center gap-3">
                  {activeTool ? (
                    <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", activeTool.bg)}>
                      <activeTool.icon className={cn("h-5 w-5", activeTool.color)} />
                    </div>
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
                      <Sparkles className="h-5 w-5 text-violet-500" />
                    </div>
                  )}
                  <div>
                    <p className="font-bold">{activeTool?.label ?? (aiMode === "summary" ? "AI Summary" : "AI Q&A")}</p>
                    <p className="text-xs text-muted-foreground">{activeTool?.desc ?? "AI-powered document analysis"}</p>
                  </div>
                  <button
                    onClick={() => { setActiveTool(null); setAiMode(null); setFiles([]); setResultUrl(null); setAiResult(""); }}
                    className="ml-auto p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* File Upload Zone */}
                {(activeTool?.id !== "htmlpdf") && (
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1 block mb-2">
                      {activeTool?.acceptsImages ? "Image Files" : "PDF File(s)"}
                      {activeTool?.acceptsMultiple && " (multiple allowed)"}
                    </label>
                    <div
                      onDragOver={e => { e.preventDefault(); setDragging(true); }}
                      onDragLeave={() => setDragging(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed cursor-pointer transition-all min-h-[120px]",
                        dragging ? "border-rose-500/50 bg-rose-500/5" : "border-white/[0.08] hover:border-white/[0.15] hover:bg-muted/30"
                      )}
                    >
                      <Upload className="h-7 w-7 text-muted-foreground/40 mb-2" />
                      <p className="text-sm font-bold text-muted-foreground">Drop file{activeTool?.acceptsMultiple ? "s" : ""} here</p>
                      <p className="text-[10px] text-muted-foreground/50 uppercase font-bold">or click to browse</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept={acceptAttr()}
                        multiple={activeTool?.acceptsMultiple}
                        onChange={e => { if (e.target.files) handleFiles(Array.from(e.target.files)); }}
                      />
                    </div>

                    {/* File list */}
                    {files.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {files.map((f, i) => (
                          <div key={i} className="flex items-center gap-2 rounded-xl border border-white/[0.05] bg-muted/10 px-3 py-2">
                            <FileText className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                            <span className="text-xs font-medium truncate flex-1">{f.name}</span>
                            <span className="text-[10px] text-muted-foreground/50">{(f.size / 1024).toFixed(0)} KB</span>
                            <button onClick={() => removefile(i)} className="p-0.5 hover:text-rose-500 text-muted-foreground/30 transition-colors">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Tool-Specific Options */}
                {activeTool?.id === "protect" && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Enter password to protect PDF…"
                      className="w-full h-10 rounded-xl border border-white/[0.05] bg-background/50 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-red-500/40"
                    />
                  </div>
                )}
                {activeTool?.id === "rotate" && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Rotation</label>
                    <div className="flex gap-2">
                      {["90", "180", "270"].map(deg => (
                        <button key={deg} onClick={() => setRotationDeg(deg)}
                          className={cn("flex-1 h-10 rounded-xl border text-xs font-bold transition-all",
                            rotationDeg === deg ? "bg-cyan-600 border-cyan-600 text-white" : "border-white/[0.05] bg-muted/20 text-muted-foreground"
                          )}>
                          {deg}°
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {activeTool?.id === "watermark" && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Watermark Text</label>
                    <input
                      value={watermarkText}
                      onChange={e => setWatermarkText(e.target.value)}
                      placeholder="e.g. CONFIDENTIAL"
                      className="w-full h-10 rounded-xl border border-white/[0.05] bg-background/50 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
                    />
                  </div>
                )}
                {activeTool?.id === "split" && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Page Ranges</label>
                    <input
                      value={splitRanges}
                      onChange={e => setSplitRanges(e.target.value)}
                      placeholder="e.g. 1-5,6-end"
                      className="w-full h-10 rounded-xl border border-white/[0.05] bg-background/50 px-3 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-rose-500/40"
                    />
                    <p className="text-[10px] text-muted-foreground/60 ml-1">Format: 1-5,6-10,11-end</p>
                  </div>
                )}
                {activeTool?.id === "htmlpdf" && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Website URL</label>
                    <input
                      value={htmlUrl}
                      onChange={e => setHtmlUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="w-full h-10 rounded-xl border border-white/[0.05] bg-background/50 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500/40"
                    />
                  </div>
                )}

                {/* AI Q&A Input */}
                {aiMode === "qa" && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Your Question</label>
                    <textarea
                      value={aiQuestion}
                      onChange={e => setAiQuestion(e.target.value)}
                      placeholder="What does this document say about…?"
                      className="w-full h-20 rounded-xl border border-white/[0.05] bg-background/50 p-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-violet-500/40"
                    />
                  </div>
                )}

                {/* Action Button */}
                {activeTool && (
                  <button
                    onClick={handleProcess}
                    disabled={processing || (activeTool.id !== "htmlpdf" && files.length === 0)}
                    className={cn(
                      "w-full h-12 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 shadow transition-all disabled:opacity-50",
                      activeTool.bg.replace("/10", "/90"),
                      "hover:opacity-90"
                    )}
                    style={{ background: processing ? undefined : undefined }}
                  >
                    {processing
                      ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</>
                      : <><ChevronRight className="h-4 w-4" /> Run {activeTool.label}</>}
                  </button>
                )}

                {aiMode && (
                  <button
                    onClick={handleAI}
                    disabled={aiLoading || files.length === 0}
                    className="w-full h-12 rounded-xl bg-violet-600 text-sm font-bold text-white flex items-center justify-center gap-2 shadow shadow-violet-500/20 hover:opacity-90 disabled:opacity-50 transition-all"
                  >
                    {aiLoading
                      ? <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing…</>
                      : <><Sparkles className="h-4 w-4" /> {aiMode === "summary" ? "Generate Summary" : "Get Answer"}</>}
                  </button>
                )}

                {/* Result Download */}
                {resultUrl && (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3 animate-in fade-in zoom-in-95">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Processing Complete!</p>
                        <p className="text-[10px] text-muted-foreground truncate">{resultName}</p>
                      </div>
                    </div>
                    <a
                      href={resultUrl}
                      download={resultName}
                      className="flex items-center justify-center gap-2 w-full h-10 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:opacity-90 transition-all"
                    >
                      <Download className="h-4 w-4" /> Download Result
                    </a>
                  </div>
                )}

                {/* AI Result */}
                {aiResult && (
                  <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 space-y-2 animate-in fade-in">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-violet-500">AI Result</p>
                    <div className="text-xs text-foreground/80 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                      {aiResult}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Info Banner */}
          <div className="rounded-xl border border-white/[0.04] bg-muted/10 p-4 flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-muted-foreground/40 shrink-0 mt-0.5" />
            <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
              PDF processing is handled server-side via ilovepdf API. Files are processed securely and never stored. Each operation uses your account's processing credits.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
