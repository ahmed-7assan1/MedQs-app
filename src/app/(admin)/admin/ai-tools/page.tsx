"use client";
import { useState, useEffect } from "react";
import {
  Wand2, Upload, Loader2, AlertTriangle,
  Trash2, Save, ChevronDown, ChevronUp, Sparkles, BookOpen, Layers, 
  Settings, Cpu, FileText, Check, X, ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { GeminiBanner } from "@/components/admin/GeminiInfo";
import { AiQuestionPlacementPicker } from "@/components/admin/AiQuestionPlacementPicker";
import type { ExtractedQuestion, AISuggestion } from "@/lib/gemini";
import { MedqsSelect } from "@/components/ui/MedqsSelect";
import dynamic from "next/dynamic";
const WordExportModal = dynamic(() => import("@/components/admin/WordExportModal").then((mod) => mod.WordExportModal), { ssr: false });

type AIProviderChoice = "auto" | "gemini" | "openai" | "anthropic" | "deepseek";

export default function AIToolsPage() {
  const [providerChoice, setProviderChoice] = useState<AIProviderChoice>("auto");

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-6 space-y-8 pb-24">
      {/* ── Premium Header ── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-500">Intelligence Hub</p>
          <h1 className="font-display text-2xl font-bold md:text-3xl">AI Diagnostic Suite</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Leverage advanced Large Language Models for automated content auditing and extraction.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1.5 rounded-xl border border-white/[0.02] bg-card px-3.5 py-2 text-sm font-medium text-muted-foreground sm:flex">
            <Cpu className="h-4 w-4 text-primary" />
            <span>Multi-Model Parallel</span>
          </div>
        </div>
      </div>

      {/* ── Model Selector Card ── */}
      <div className="rounded-2xl border border-white/[0.02] bg-card p-5 shadow-sm border-l-4 border-l-blue-500">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-bold tracking-tight">Provider Architecture</span>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Global override for this session</p>
        </div>
        <MedqsSelect
          value={providerChoice}
          onChange={(e) => setProviderChoice(e.target.value as AIProviderChoice)}
          className="w-full h-12 rounded-xl border-white/[0.02] bg-background/50 text-sm font-semibold"
        >
          <option value="auto">Auto-Orchestration (Best Available)</option>
          <option value="gemini">Google Gemini 1.5 Pro</option>
          <option value="openai">OpenAI GPT-4o (Standard)</option>
          <option value="anthropic">Anthropic Claude 3.5 Sonnet</option>
          <option value="deepseek">DeepSeek AI (Specialist)</option>
        </MedqsSelect>
        <p className="mt-3 text-[11px] text-muted-foreground italic leading-relaxed">
           Requests will automatically cascade to secondary providers if the primary choice is rate-limited or non-responsive.
        </p>
      </div>

      <GeminiBanner />

      <div className="grid gap-6 lg:grid-cols-2">
        <ManualAssistPanel providerChoice={providerChoice} />
        <PDFExtractPanel providerChoice={providerChoice} />
        <PDFNotesPanel providerChoice={providerChoice} />
        <LectureEnhancePanel providerChoice={providerChoice} />
      </div>
    </div>
  );
}

// ─── Manual Assist ─────────────────────────────────────────────────────────────

function ManualAssistPanel({ providerChoice }: { providerChoice: AIProviderChoice }) {
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<AISuggestion | null>(null);
  const [edited, setEdited] = useState<AISuggestion | null>(null);
  const [lectureId, setLectureId] = useState("");
  const [placementKey, setPlacementKey] = useState(0);
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    if (suggestion) {
      setEdited({ ...suggestion, choices: suggestion.choices.map((c) => ({ ...c })) });
    } else setEdited(null);
  }, [suggestion]);

  async function handleSuggest() {
    if (!body.trim()) return toast.error("Enter a question context first");
    setLoading(true);
    try {
      const res = await fetch("/api/v1/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, preferredProvider: providerChoice === "auto" ? undefined : providerChoice }),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || "AI Generation failed");
      setSuggestion(data);
      if (data.fallbackFrom) toast(`Switched: ${data.fallbackFrom} → ${data.provider}`);
    } finally { setLoading(false); }
  }

  async function handleSave() {
    const pack = edited ?? suggestion;
    if (!pack || !lectureId) return toast.error("Select a placement target");
    const res = await fetch("/api/v1/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...pack, body, lectureId }),
    });
    if (res.ok) {
      toast.success("Asset saved to database");
      setBody(""); setSuggestion(null); setEdited(null); setLectureId("");
      setPlacementKey((k) => k + 1);
    } else toast.error("Database persistence failed");
  }

  return (
    <div className="rounded-2xl border border-white/[0.02] bg-card p-6 shadow-sm flex flex-col h-full space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
           <Wand2 className="h-5 w-5" />
        </div>
        <div>
           <h2 className="font-display text-lg font-bold">Manual AI Assist</h2>
           <p className="text-xs text-muted-foreground outline-none">Single-entry generation from context.</p>
        </div>
      </div>

      <div className="flex-1 space-y-4">
        <div className="space-y-1.5">
           <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Context / Body</label>
           <textarea
             value={body}
             onChange={(e) => setBody(e.target.value)}
             placeholder="e.g. A 28-year-old female presents with persistent tachycardia..."
             className="w-full min-h-[140px] resize-none rounded-xl border border-white/[0.02] bg-background/50 p-4 text-sm focus:ring-blue-500/40 focus:outline-none"
           />
        </div>

        <button
          onClick={handleSuggest}
          disabled={loading || !body.trim()}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow shadow-blue-500/20 hover:opacity-90 disabled:opacity-50 transition-all font-display"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? "Thinking…" : "Generate Options"}
        </button>

        {suggestion && edited && (
          <div className="space-y-4 rounded-xl border border-white/[0.05] bg-muted/5 p-4 animate-in fade-in zoom-in-95">
             <div className="flex items-center justify-between border-b border-white/[0.05] pb-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Draft Review</span>
                <MedqsSelect
                  value={edited.difficulty}
                  onChange={(e) => setEdited(p => p ? { ...p, difficulty: e.target.value as any } : p)}
                  className="h-8 text-[10px] font-bold"
                >
                  <option value="EASY">EASY</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HARD">HARD</option>
                </MedqsSelect>
             </div>

             <div className="space-y-2">
                {edited.choices.map((c, i) => (
                  <div key={c.key} className="flex gap-2">
                     <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.02] bg-background text-[10px] font-bold font-mono">{c.key}</div>
                     <input
                        value={c.text}
                        onChange={(e) => setEdited(p => {
                           if (!p) return p;
                           const next = [...p.choices];
                           next[i].text = e.target.value;
                           return { ...p, choices: next };
                        })}
                        className="flex-1 rounded-lg border border-white/[0.05] bg-background/50 px-3 py-1.5 text-xs focus:outline-none"
                     />
                     <button
                        onClick={() => setEdited(p => p ? { ...p, answer: c.key } : p)}
                        className={cn("h-9 w-9 shrink-0 flex items-center justify-center rounded-lg border border-white/[0.05] transition-all", edited.answer === c.key ? "bg-emerald-500 text-white border-emerald-500" : "bg-background text-muted-foreground")}
                     >
                        <Check className="h-4 w-4" />
                     </button>
                  </div>
                ))}
             </div>

             <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Rationale</label>
                <textarea
                   value={edited.explanation}
                   onChange={e => setEdited(p => p ? { ...p, explanation: e.target.value } : p)}
                   className="w-full text-xs bg-background/50 border border-white/[0.05] rounded-lg p-3 focus:outline-none min-h-[80px]"
                />
             </div>

             <div className="pt-2">
                <AiQuestionPlacementPicker key={`manual-${placementKey}`} radioGroupName="ai-placement-manual" onChange={setLectureId} disabled={loading} />
             </div>

             <div className="flex gap-2 pt-2">
                <button onClick={() => setExportOpen(true)} className="flex-1 h-10 flex items-center justify-center gap-2 rounded-xl border border-white/[0.02] bg-card text-xs font-bold hover:bg-muted transition-all"><FileText className="h-4 w-4 text-blue-500" /> Export</button>
                <button onClick={handleSave} disabled={!lectureId} className="flex-1 h-10 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 text-xs font-bold text-white shadow shadow-emerald-500/20 disabled:opacity-40"><Save className="h-4 w-4" /> Save Asset</button>
             </div>
          </div>
        )}
      </div>

      {exportOpen && edited && (
        <WordExportModal 
          questions={[{ body, choices: edited.choices, answer: edited.answer, explanation: edited.explanation }]} 
          onClose={() => setExportOpen(false)} 
        />
      )}
    </div>
  );
}

// ─── PDF/DOCX Extractor ────────────────────────────────────────────────────────

function PDFExtractPanel({ providerChoice }: { providerChoice: AIProviderChoice }) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<ExtractedQuestion[]>([]);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [issues, setIssues] = useState<{ index: number; issue: string }[]>([]);
  const [lectureId, setLectureId] = useState("");
  const [placementKey, setPlacementKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [quizTitle, setQuizTitle] = useState("");
  const [duplicates, setDuplicates] = useState<boolean[]>([]);

  async function handleExtract() {
    if (!file) return toast.error("Upload a source document");
    setLoading(true); setQuestions([]); setIssues([]);
    const form = new FormData();
    form.append("file", file);
    if (providerChoice !== "auto") form.append("preferredProvider", providerChoice);
    try {
      const res = await fetch("/api/v1/ai/extract", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || "Batch extraction failed");
      setQuestions(data.questions ?? []);
      setIssues(data.issues ?? []);
      setQuizTitle(data.quizTitle ?? "");
      toast.success(`Parsed ${data.questions?.length ?? 0} questions`);
      if (data.questions?.length > 0) {
        fetch("/api/v1/admin/questions/check-duplicates", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questions: data.questions.map((q: any) => q.body) })
        }).then(r => r.json()).then(d => d.duplicates && setDuplicates(d.duplicates)).catch(() => {});
      }
    } finally { setLoading(false); }
  }

  async function handleSaveAll() {
    if (!lectureId) return toast.error("Choose a sync target");
    setSaving(true);
    try {
      const res = await fetch("/api/v1/questions/bulk", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions: questions.map((q) => ({ ...q, lectureId })) }),
      });
      if (res.ok) {
        toast.success("Bulk upload synchronized");
        setQuestions([]); setFile(null); setLectureId(""); setPlacementKey(k => k+1);
      } else toast.error("Bulk synchronization failed");
    } finally { setSaving(false); }
  }

  return (
    <div className="rounded-2xl border border-white/[0.02] bg-card p-6 shadow-sm flex flex-col h-full space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500">
           <Upload className="h-5 w-5" />
        </div>
        <div>
           <h2 className="font-display text-lg font-bold">Auto Batch Extraction</h2>
           <p className="text-xs text-muted-foreground outline-none">Parses PDF/DOCX into structured data.</p>
        </div>
      </div>

      <div className="flex-1 space-y-4">
        <label className={cn(
          "relative group flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all",
          file ? "border-violet-500/40 bg-violet-500/5 ring-1 ring-violet-500/10" : "border-white/[0.02] hover:bg-muted/50 hover:border-violet-400"
        )}>
           {file ? <FileText className="h-8 w-8 text-violet-500 mb-1" /> : <Upload className="h-8 w-8 text-muted-foreground/30 mb-1" />}
           <p className="text-sm font-bold tracking-tight">{file ? file.name : "Drop document bundle"}</p>
           <p className="text-[10px] text-muted-foreground uppercase font-bold opacity-60">{file ? `${(file.size / 1024).toFixed(0)} KB` : "Click to browser (PDF/DOCX)"}</p>
           <input type="file" accept=".pdf,.docx" className="hidden" onChange={e => setFile(e.target.files?.[0] ?? null)} />
        </label>

        <button
          onClick={handleExtract}
          disabled={!file || loading}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-bold text-white shadow shadow-violet-500/20 hover:opacity-90 disabled:opacity-50 transition-all font-display"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? "Decrypting…" : "Extract Questions"}
        </button>

        {questions.length > 0 && (
          <div className="space-y-4 animate-in fade-in zoom-in-95">
             <div className="flex items-center justify-between border-b border-white/[0.05] pb-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Found {questions.length} Items</p>
                <button onClick={() => setQuestions([])} className="text-[10px] text-red-500 font-bold uppercase hover:underline">Clear</button>
             </div>
             
             <div className="space-y-3">
                <AiQuestionPlacementPicker key={`pdf-${placementKey}`} radioGroupName="ai-placement-pdf" onChange={setLectureId} disabled={saving} />
                <div className="flex gap-2">
                   <button onClick={() => setExportOpen(true)} className="flex-1 h-10 rounded-xl border border-white/[0.02] bg-card text-xs font-bold flex items-center justify-center gap-2">
                      <FileText className="h-4 w-4 text-blue-500" /> Export Bundle
                   </button>
                   <button onClick={handleSaveAll} disabled={saving || !lectureId} className="flex-1 h-10 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow shadow-emerald-500/20 flex items-center justify-center gap-2">
                      {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-4 w-4" />} Commit Batch
                   </button>
                </div>
             </div>

             <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                {questions.map((q, i) => (
                  <div key={i} className={cn("p-3 rounded-xl border text-xs transition-all", expanded.has(i) ? "border-violet-500/30 bg-violet-500/5 ring-1 ring-violet-500/10" : "border-white/[0.05] bg-background/50")}>
                     <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(p => { const n = new Set(p); n.has(i) ? n.delete(i) : n.add(i); return n; })}>
                        <div className="min-w-0 pr-4">
                           <span className="font-bold text-muted-foreground mr-2">#{i+1}</span>
                           <span className="truncate">{q.body}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                           {duplicates[i] && <span className="text-[9px] font-bold text-red-600 uppercase bg-red-100 px-1.5 py-0.5 rounded">Duplicate</span>}
                           <ChevronDown className={cn("h-4 w-4 text-muted-foreground/40 transition-transform", expanded.has(i) && "rotate-180")} />
                        </div>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}
      </div>
      
      {exportOpen && (
        <WordExportModal 
          filename={quizTitle || "Extracted_Bundle"} 
          questions={questions.map(q => ({ body: q.body, choices: q.choices, answer: q.answer, explanation: q.explanation }))} 
          onClose={() => setExportOpen(false)} 
        />
      )}
    </div>
  );
}

// ─── PDF/DOCX AI Notes Generator ──────────────────────────────────────────────

function PDFNotesPanel({ providerChoice }: { providerChoice: AIProviderChoice }) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [instructions, setInstructions] = useState("");
  const [notes, setNotes] = useState<{title: string; content: string} | null>(null);

  async function handleGenerate() {
    if (!file) return toast.error("Choose a lecture source");
    setLoading(true);
    const form = new FormData();
    form.append("file", file);
    if (instructions) form.append("instructions", instructions);
    if (providerChoice !== "auto") form.append("preferredProvider", providerChoice);
    try {
      const res = await fetch("/api/v1/ai/generate-notes", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || "Generation error");
      setNotes({ title: data.title, content: data.content });
      toast.success("Synthesis complete");
    } finally { setLoading(false); }
  }

  return (
    <div className="rounded-2xl border border-white/[0.02] bg-card p-6 shadow-sm flex flex-col h-full space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
           <BookOpen className="h-5 w-5" />
        </div>
        <div>
           <div className="flex items-center gap-2">
              <h2 className="font-display text-lg font-bold">Study Notes Synth</h2>
              <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[9px] font-bold text-indigo-600 uppercase tracking-tighter">Premium</span>
           </div>
           <p className="text-xs text-muted-foreground outline-none">Converts full lectures into formatted summaries.</p>
        </div>
      </div>

      {!notes ? (
        <div className="space-y-4">
           <label className={cn(
            "relative group flex h-28 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all",
            file ? "border-indigo-500/40 bg-indigo-500/5" : "border-white/[0.02] hover:bg-muted/50"
          )}>
             <BookOpen className="h-7 w-7 text-muted-foreground/30 mb-1" />
             <p className="text-xs font-bold tracking-tight">{file ? file.name : "Select Input File"}</p>
             <input type="file" className="hidden" onChange={e => setFile(e.target.files?.[0] ?? null)} />
          </label>
          <div className="space-y-1">
             <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Synthesis Instructions</label>
             <textarea 
               value={instructions} onChange={e => setInstructions(e.target.value)} 
               placeholder="e.g. Focus on mechanism of action and side effects..."
               className="w-full min-h-[70px] bg-background/50 border border-white/[0.02] rounded-xl p-3 text-xs focus:outline-none"
             />
          </div>
          <button
            onClick={handleGenerate}
            disabled={!file || loading}
            className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-bold text-white shadow shadow-indigo-500/20 transition-all hover:opacity-90 disabled:opacity-50 font-display"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? "Synthesizing…" : "Generate Notes"}
          </button>
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in zoom-in-95">
           <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Synthesized Title</label>
              <input value={notes.title} onChange={e => setNotes({...notes, title: e.target.value})} className="w-full bg-background/50 border border-white/[0.05] rounded-lg h-9 px-3 text-sm font-bold" />
           </div>
           <textarea 
             value={notes.content} onChange={e => setNotes({...notes, content: e.target.value})}
             className="w-full min-h-[140px] bg-background/50 border border-white/[0.05] rounded-xl p-3 text-xs font-mono"
           />
           <div className="flex gap-2">
              <button onClick={() => {setNotes(null); setFile(null);}} className="flex-1 h-10 rounded-xl border border-white/[0.02] bg-card text-xs font-bold">Discard</button>
              <button className="flex-1 h-10 rounded-xl bg-blue-600 text-white text-xs font-bold shadow shadow-blue-500/20 flex items-center justify-center gap-2"><FileText className="h-4 w-4" /> Download DOCX</button>
           </div>
        </div>
      )}
    </div>
  );
}

// ─── Lecture Enhance ─────────────────────────────────────────────────────────

function LectureEnhancePanel({ providerChoice }: { providerChoice: AIProviderChoice }) {
  const [lectureId, setLectureId] = useState("");
  const [instructions, setInstructions] = useState("");
  const [wantNotes, setWantNotes] = useState(true);
  const [wantFlashcards, setWantFlashcards] = useState(false);
  const [loading, setLoading] = useState(false);

  async function run() {
    if (!lectureId) return toast.error("Select target session");
    setLoading(true);
    try {
      const res = await fetch("/api/v1/admin/ai/lecture-enhance", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lectureId, instructions, notes: wantNotes, flashcards: wantFlashcards, preferredProvider: providerChoice === "auto" ? undefined : providerChoice }),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || "Enhancement failed");
      toast.success("Assets synchronized to lecture session");
    } finally { setLoading(false); }
  }

  return (
    <div className="rounded-2xl border border-white/[0.02] bg-card p-6 shadow-sm flex flex-col h-full space-y-5 lg:col-span-2">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-500">
           <Layers className="h-5 w-5" />
        </div>
        <div>
           <h2 className="font-display text-lg font-bold">Curriculum Enrichment</h2>
           <p className="text-xs text-muted-foreground outline-none">Populate lecture notes and active-recall cards automatically.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
         <div className="space-y-4">
            <AiQuestionPlacementPicker radioGroupName="ai-lecture-enhance" onChange={setLectureId} disabled={loading} />
            <div className="flex flex-col gap-2 p-3 rounded-xl bg-muted/20 border border-white/[0.05]">
               <label className="flex items-center gap-2.5 cursor-pointer py-1.5">
                  <input type="checkbox" checked={wantNotes} onChange={e => setWantNotes(e.target.checked)} className="h-4 w-4 rounded border-white/[0.02] text-sky-600 focus:ring-sky-500" />
                  <span className="text-xs font-bold text-foreground/80">Populate Summary</span>
               </label>
               <label className="flex items-center gap-2.5 cursor-pointer py-1.5">
                  <input type="checkbox" checked={wantFlashcards} onChange={e => setWantFlashcards(e.target.checked)} className="h-4 w-4 rounded border-white/[0.02] text-sky-600 focus:ring-sky-500" />
                  <span className="text-xs font-bold text-foreground/80">Generate Study Cards</span>
               </label>
            </div>
         </div>
         <div className="space-y-4">
            <div className="space-y-1.5">
               <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Behavioral Directives</label>
               <textarea
                 value={instructions} onChange={e => setInstructions(e.target.value)}
                 placeholder="e.g. Keep notes concise and use clinical case examples where possible..."
                 className="w-full min-h-[140px] bg-background/50 border border-white/[0.02] rounded-2xl p-4 text-sm focus:outline-none"
               />
            </div>
            <button
               onClick={run}
               disabled={loading || !lectureId || (!wantNotes && !wantFlashcards)}
               className="w-full h-12 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 text-white font-bold text-sm shadow shadow-sky-500/20 hover:opacity-90 disabled:opacity-50 transition-all font-display flex items-center justify-center gap-2"
            >
               {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
               {loading ? "Engaging Engines…" : "Enrich Lecture Assets"}
            </button>
         </div>
      </div>
    </div>
  );
}

