"use client";
import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  Plus, Trash2, Save, Loader2, ChevronDown, ChevronUp,
  Clock, BookOpen, Image, Check, X, Pencil, ImagePlus, Sparkles, Book, Info, Copy, Settings, Eye, EyeOff, LayoutList
} from "lucide-react";
import { apiErrorMessage } from "@/lib/api-error-client";
import { unwrapApiList } from "@/lib/api-list";
import { MedqsSelect } from "@/components/ui/MedqsSelect";
import { QuickDrawModal } from "@/components/draw/QuickDrawModal";
import { uploadQuestionImageClient } from "@/lib/upload-question-image-client";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface Module   { id: string; name: string }
interface Semester { id: string; name: string }
interface QuizQuestion {
  id?: string;
  questionType?: "MCQ" | "ESSAY";
  body: string;
  imageUrl?: string;
  choices: { key: string; text: string }[];
  answer: string;
  essayReference?: string;
  explanation: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
}

const CHOICE_KEYS = ["A", "B", "C", "D", "E"];

export default function AdminQuizCreatorPage() {
  const search = useSearchParams();
  const editingPaperId = (search?.get("paperId") ?? "").trim() || null;
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [modules, setModules]     = useState<Module[]>([]);
  const [saving, setSaving]       = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [removedQuestionIds, setRemovedQuestionIds] = useState<string[]>([]);

  const [form, setForm] = useState({
    title: "", semesterId: "", moduleId: "",
    timeLimitMin: "", isInteractive: true,
    googleSheetsSyncEnabled: false,
    randomizeQuestions: false,
    isPrivate: false,
  });
  const [quizLectureId, setQuizLectureId] = useState<string>("");

  const [questions, setQuestions] = useState<QuizQuestion[]>([{
    body: "", choices: [
      { key: "A", text: "" }, { key: "B", text: "" },
      { key: "C", text: "" }, { key: "D", text: "" },
    ],
    answer: "A", explanation: "", difficulty: "MEDIUM",
  }]);

  const [expandedQ, setExpandedQ] = useState<number | null>(0);
  const [drawForQi, setDrawForQi] = useState<number | null>(null);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [aiFileBusy, setAiFileBusy] = useState(false);
  const [aiQuestionMode, setAiQuestionMode] = useState<"mcq" | "essay" | "mixed">("mcq");

  useEffect(() => {
    Promise.all([
      fetch("/api/v1/semesters").then((r) => r.json()),
      fetch("/api/v1/modules-all").then((r) => r.json()),
    ]).then(([s, m]) => {
      setSemesters(unwrapApiList<Semester>(s));
      setModules(unwrapApiList<Module>(m));
    });
  }, []);

  useEffect(() => { setQuizLectureId(""); }, [form.moduleId]);

  function addQuestion() {
    setQuestions(qs => [...qs, {
      questionType: "MCQ",
      body: "", choices: [
        { key: "A", text: "" }, { key: "B", text: "" },
        { key: "C", text: "" }, { key: "D", text: "" },
      ],
      answer: "A", explanation: "", difficulty: "MEDIUM",
    }]);
    setExpandedQ(questions.length);
  }

  function removeQuestion(i: number) {
    setQuestions(qs => {
      const q = qs[i];
      if (q?.id) setRemovedQuestionIds((prev) => [...prev, q.id!]);
      return qs.filter((_, idx) => idx !== i);
    });
    setExpandedQ(null);
  }

  function updateQ(i: number, field: string, value: string) {
    setQuestions(qs => qs.map((q, idx) => idx === i ? { ...q, [field]: value } : q));
  }

  async function uploadQuestionImage(qi: number, file: File) {
    setUploadingIdx(qi);
    try {
      const result = await uploadQuestionImageClient(file);
      if (result.ok) {
        updateQ(qi, "imageUrl", result.url);
        toast.success("Image attached");
      } else toast.error(result.error);
    } finally { setUploadingIdx(null); }
  }

  function updateChoice(qi: number, ci: number, value: string) {
    setQuestions(qs => qs.map((q, idx) => idx === qi
      ? { ...q, choices: q.choices.map((c, cidx) => cidx === ci ? { ...c, text: value } : c) }
      : q
    ));
  }

  function addChoice(qi: number) {
    setQuestions(qs => qs.map((q, idx) => {
      if (idx !== qi || q.choices.length >= 5) return q;
      const key = CHOICE_KEYS[q.choices.length];
      return { ...q, choices: [...q.choices, { key, text: "" }] };
    }));
  }

  function removeChoice(qi: number, ci: number) {
    setQuestions(qs => qs.map((q, idx) => {
      if (idx !== qi || q.choices.length <= 2) return q;
      const newChoices = q.choices.filter((_, cidx) => cidx !== ci)
        .map((c, i) => ({ ...c, key: CHOICE_KEYS[i] }));
      return { ...q, choices: newChoices, answer: q.answer === q.choices[ci].key ? newChoices[0].key : q.answer };
    }));
  }

  useEffect(() => {
    if (!editingPaperId) return;
    let cancelled = false;
    (async () => {
      setLoadingEdit(true);
      try {
        const paperRes = await fetch(`/api/v1/past-papers/${editingPaperId}`);
        const paper = await paperRes.json().catch(() => ({}));
        if (!paperRes.ok) return toast.error(await apiErrorMessage(paperRes, "Could not load quiz"));
        
        const lectureId = typeof paper.quizLectureId === "string" ? paper.quizLectureId : "";
        if (!lectureId) return toast.error("Quiz metadata link missing.");
        
        const qsRes = await fetch(`/api/v1/questions?lectureId=${encodeURIComponent(lectureId)}`);
        const qsRaw = await qsRes.json().catch(() => []);
        const qs = unwrapApiList<any>(qsRaw);
        if (!cancelled) {
          setForm({
            title: paper.title || "",
            semesterId: paper.semesterId || "",
            moduleId: paper.moduleId || "",
            timeLimitMin: paper.timeLimitMin != null ? String(paper.timeLimitMin) : "",
            isInteractive: true,
            googleSheetsSyncEnabled: Boolean(paper.googleSheetsSyncEnabled),
            randomizeQuestions: Boolean(paper.randomizeQuestions),
            isPrivate: Boolean(paper.isPrivate),
          });
          setQuizLectureId(lectureId);
          setQuestions(Array.isArray(qs) && qs.length > 0 ? qs.map(q => ({
            id: q.id, questionType: q.questionType ?? "MCQ", body: q.body ?? "",
            imageUrl: q.imageUrl ?? undefined, choices: q.choices ?? [],
            answer: q.answer ?? "A", essayReference: q.essayReference ?? "",
            explanation: q.explanation ?? "", difficulty: q.difficulty ?? "MEDIUM",
          })) : [{ questionType: "MCQ", body: "", choices: [{key:"A",text:""},{key:"B",text:""},{key:"C",text:""},{key:"D",text:""}], answer:"A", explanation:"", difficulty:"MEDIUM" }]);
        }
      } finally { if (!cancelled) setLoadingEdit(false); }
    })();
    return () => { cancelled = true; };
  }, [editingPaperId]);

  async function ensureQuizBankLecture(moduleId: string): Promise<string> {
    const res = await fetch(`/api/v1/modules/${encodeURIComponent(moduleId)}/ensure-quiz-bank-lecture`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.lectureId) throw new Error(await apiErrorMessage(res, "Sync failed"));
    return data.lectureId;
  }

  async function importQuestionsFromFile(file: File) {
    setAiFileBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("questionMode", aiQuestionMode);
      const res = await fetch("/api/v1/ai/extract", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return toast.error(data.error || "AI failed");
      const rows = Array.isArray(data?.questions) ? data.questions : [];
      if (!rows.length) return toast.error("No questions found");
      const mapped: QuizQuestion[] = rows.map((q: any) => ({
        questionType: q.questionType === "ESSAY" ? "ESSAY" : "MCQ",
        body: String(q.body || "").trim(), imageUrl: q.imageUrl,
        choices: (q.choices ?? []).map((c: any, i: number) => ({ key: c.key || CHOICE_KEYS[i], text: c.text || "" })),
        answer: q.questionType === "ESSAY" ? "ESSAY" : (q.answer || "A"),
        essayReference: q.essayReference || q.answer || "",
        explanation: q.explanation || "",
        difficulty: q.difficulty || "MEDIUM",
      }));
      setQuestions(prev => [...prev.filter(q => q.body.trim()), ...mapped]);
      toast.success(`Imported ${mapped.length} items`);
    } finally { setAiFileBusy(false); }
  }

  async function handleSave() {
    if (!form.title || !form.semesterId || !form.moduleId) return toast.error("Required fields missing");
    setSaving(true);
    try {
      const paperRes = await fetch(editingPaperId ? `/api/v1/past-papers/${editingPaperId}` : "/api/v1/past-papers", {
        method: editingPaperId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, kind: "ADMIN_AUTHORED_QUIZ", timeLimitMin: form.timeLimitMin ? parseInt(form.timeLimitMin, 10) : null }),
      });
      const paper = await paperRes.json();
      if (!paperRes.ok) return toast.error("Failed to save meta");
      let qLectureId = paper.quizLectureId;
      if (!qLectureId) qLectureId = await ensureQuizBankLecture(form.moduleId);

      for (const q of questions.filter(x => x.body.trim())) {
        const isUpdate = !!q.id;
        await fetch(isUpdate ? `/api/v1/questions/${q.id}` : "/api/v1/questions", {
          method: isUpdate ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...q, lectureId: qLectureId }),
        });
      }
      toast.success("Quiz synchronized");
      if (!editingPaperId) window.location.reload();
    } finally { setSaving(false); }
  }

  const validCount = questions.filter(q => q.body.trim()).length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-6 space-y-8 pb-32">
      {/* ── Premium Header ── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-violet-500">Curricular Engine</p>
          <h1 className="font-display text-2xl font-bold md:text-3xl">Quiz Forge</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Architect custom assessment modules with multi-media support and AI orchestration.
          </p>
        </div>
        <div className="flex items-center gap-2">
           <div className="hidden items-center gap-1.5 rounded-xl border border-border/60 bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground sm:flex">
             <LayoutList className="h-4 w-4 text-primary" />
             <span>{validCount} Synchronized Nodes</span>
           </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Metadata */}
        <div className="space-y-6 lg:col-span-1">
          <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2 mb-2">
               <BookOpen className="h-4 w-4 text-violet-500" />
               <h2 className="text-sm font-bold tracking-tight uppercase tracking-widest text-muted-foreground">Institutional Mapping</h2>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Quiz Title</label>
              <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Phase 2: Cardiology Block"
                className="w-full h-11 rounded-xl border border-border/60 bg-background/50 px-4 text-sm focus:ring-violet-500/40 focus:outline-none" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
               <div className="space-y-1.5">
                 <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Semester Access</label>
                 <MedqsSelect value={form.semesterId} onChange={e => setForm(f => ({ ...f, semesterId: e.target.value }))} className="h-11 rounded-xl">
                   <option value="">Choose Path…</option>
                   {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                 </MedqsSelect>
               </div>
               <div className="space-y-1.5">
                 <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Academic Module</label>
                 <MedqsSelect value={form.moduleId} onChange={e => setForm(f => ({ ...f, moduleId: e.target.value }))} className="h-11 rounded-xl">
                   <option value="">Scope Filter…</option>
                   {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                 </MedqsSelect>
               </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm space-y-5">
             <div className="flex items-center gap-2 mb-2">
                <Settings className="h-4 w-4 text-violet-500" />
                <h2 className="text-sm font-bold tracking-tight uppercase tracking-widest text-muted-foreground">Session Parameters</h2>
             </div>
             
             <div className="space-y-4">
                <div className="flex items-center justify-between group">
                   <div>
                      <p className="text-xs font-bold">Chronometer Limit</p>
                      <p className="text-[10px] text-muted-foreground uppercase opacity-60">minutes (optional)</p>
                   </div>
                   <input type="number" value={form.timeLimitMin} onChange={e => setForm(f => ({ ...f, timeLimitMin: e.target.value }))}
                      className="w-16 h-10 rounded-xl border border-border/60 bg-background/50 px-2 text-center text-sm font-bold focus:ring-violet-500/40 outline-none" />
                </div>

                <div className="flex items-center justify-between">
                   <p className="text-xs font-bold">Randomize Sequence</p>
                   <button onClick={() => setForm(f => ({ ...f, randomizeQuestions: !f.randomizeQuestions }))}
                      className={cn("relative h-6 w-11 rounded-full transition-all", form.randomizeQuestions ? "bg-violet-600" : "bg-muted")}>
                      <span className={cn("absolute h-4 w-4 rounded-full bg-white shadow-sm transition-transform top-1", form.randomizeQuestions ? "translate-x-6" : "translate-x-1")} />
                   </button>
                </div>

                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-rose-500">Broadcast Status</p>
                   </div>
                   <button onClick={() => setForm(f => ({ ...f, isPrivate: !f.isPrivate }))}
                      className={cn("relative h-6 w-11 rounded-full transition-all", !form.isPrivate ? "bg-emerald-500" : "bg-muted")}>
                      <span className={cn("absolute h-4 w-4 rounded-full bg-white shadow-sm transition-transform top-1", !form.isPrivate ? "translate-x-6" : "translate-x-1")} />
                   </button>
                </div>
                <p className="text-[10px] text-muted-foreground italic leading-relaxed text-center border-t border-border/40 pt-3 opacity-60">
                   {!form.isPrivate ? "Current: Publicly accessible to enrolled cohorts." : "Current: Private / Hidden for administrative audit."}
                </p>
             </div>
          </div>
          
          <div className="rounded-2xl border border-border/60 bg-indigo-500/5 p-6 space-y-4">
             <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-500" />
                <h2 className="text-xs font-bold uppercase tracking-widest">AI Ingestion Tool</h2>
             </div>
             <div className="space-y-4">
                <MedqsSelect value={aiQuestionMode} onChange={e => setAiQuestionMode(e.target.value as any)} className="h-10 text-xs font-bold bg-background/50">
                   <option value="mcq">Extract MCQs Only</option>
                   <option value="essay">Extract Essays Only</option>
                   <option value="mixed">Mixed Extraction</option>
                </MedqsSelect>
                <label className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-indigo-600 text-xs font-bold text-white shadow shadow-indigo-500/20 hover:opacity-90 transition-all">
                   {aiFileBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                   {aiFileBusy ? "Decrypting Bundle…" : "Upload Bundle (PDF/DOCX)"}
                   <input type="file" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) importQuestionsFromFile(f); }} />
                </label>
             </div>
          </div>
        </div>

        {/* Right Column: Question Nodes */}
        <div className="lg:col-span-2 space-y-4">
           {questions.map((q, qi) => (
             <div key={qi} className={cn("group overflow-hidden rounded-2xl border transition-all duration-300", 
               expandedQ === qi ? "border-violet-500/40 bg-card shadow-xl ring-1 ring-violet-500/10" : "border-border/60 bg-card/60 hover:border-border")}>
               
               <div className="flex items-center gap-4 px-5 py-4 cursor-pointer" onClick={() => setExpandedQ(expandedQ === qi ? null : qi)}>
                  <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black shadow-inner transition-all", 
                    q.body.trim() ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30" : "bg-muted text-muted-foreground/40")}>
                    {qi + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                     <p className={cn("text-sm font-bold truncate transition-colors", expandedQ === qi ? "text-violet-500" : "text-foreground/80")}>
                        {q.body.trim() || `Untethered Node — Define Context`}
                     </p>
                  </div>
                  <div className="flex items-center gap-3">
                     <span className={cn("text-[10px] font-black uppercase tracking-widest", 
                        q.difficulty === "HARD" ? "text-rose-500" : q.difficulty === "MEDIUM" ? "text-amber-500" : "text-emerald-500")}>
                        {q.difficulty}
                     </span>
                     <button onClick={e => {e.stopPropagation(); removeQuestion(qi);}} className="p-1.5 rounded-lg text-muted-foreground/30 hover:text-rose-500 hover:bg-rose-500/10 transition-all">
                        <Trash2 className="h-4 w-4" />
                     </button>
                     <ChevronDown className={cn("h-4 w-4 text-muted-foreground/30 transition-transform duration-300", expandedQ === qi && "rotate-180")} />
                  </div>
               </div>

               {expandedQ === qi && (
                 <div className="p-6 pt-0 space-y-6 animate-in slide-in-from-top-2 duration-300">
                    <div className="h-[1px] w-full bg-border/40 mb-6" />
                    
                    <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
                       <div className="space-y-4">
                          <div className="space-y-1.5">
                             <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Complexity</label>
                             <div className="flex gap-2">
                                {["EASY","MEDIUM","HARD"].map(d => (
                                  <button key={d} onClick={() => updateQ(qi, "difficulty", d)} className={cn("flex-1 h-9 rounded-lg text-[10px] font-black tracking-widest border transition-all", 
                                    q.difficulty === d ? "bg-violet-600 border-violet-600 text-white shadow-lg shadow-violet-500/20" : "bg-muted/30 border-border/40 text-muted-foreground hover:bg-muted/50")}>
                                     {d}
                                  </button>
                                ))}
                             </div>
                          </div>
                          <div className="space-y-1.5">
                             <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Node Archetype</label>
                             <MedqsSelect value={q.questionType} onChange={e => updateQ(qi, "questionType", e.target.value)} className="h-10 text-xs font-bold">
                                <option value="MCQ">Closed Option (MCQ)</option>
                                <option value="ESSAY">Open Script (Essay)</option>
                             </MedqsSelect>
                          </div>
                          <div className="space-y-1.5">
                             <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Visual Evidence</label>
                             <div className="flex gap-2">
                                <button onClick={() => setDrawForQi(qi)} className="flex-1 h-10 flex items-center justify-center gap-2 rounded-xl bg-card border border-border/60 text-[10px] font-bold uppercase hover:bg-muted"><Pencil className="h-3.5 w-3.5" /> Draw</button>
                                <label className="flex-1 h-10 flex items-center justify-center gap-2 rounded-xl bg-card border border-border/60 text-[10px] font-bold uppercase hover:bg-muted cursor-pointer">
                                   <ImagePlus className="h-3.5 w-3.5" /> Attach
                                   <input type="file" className="hidden" onChange={e => { const f=e.target.files?.[0]; if(f) uploadQuestionImage(qi, f); }} />
                                </label>
                             </div>
                             {q.imageUrl && <div className="mt-2 relative group aspect-video rounded-xl border border-border/60 overflow-hidden">
                                <img src={q.imageUrl} className="h-full w-full object-cover" />
                                <button onClick={() => updateQ(qi, "imageUrl", "")} className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-3 w-3" /></button>
                             </div>}
                          </div>
                       </div>
                       
                       <div className="space-y-6">
                          <div className="space-y-1.5">
                             <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Question Context / Stem</label>
                             <textarea value={q.body} onChange={e => updateQ(qi, "body", e.target.value)}
                                placeholder="State the clinical scenario or inquiry path…"
                                className="w-full h-32 rounded-2xl border border-border/60 bg-background/50 p-4 text-sm focus:ring-violet-500/40 focus:outline-none resize-none" />
                          </div>

                          {q.questionType === "MCQ" ? (
                             <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                   <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Response Candidates</label>
                                   {q.choices.length < 5 && <button onClick={() => addChoice(qi)} className="text-[10px] font-black text-violet-500 uppercase hover:underline">+ Provision Choice</button>}
                                </div>
                                <div className="grid gap-3">
                                   {q.choices.map((c, ci) => (
                                     <div key={c.key} className="flex gap-2 group/row">
                                        <button onClick={() => updateQ(qi, "answer", c.key)}
                                          className={cn("h-10 w-10 shrink-0 flex items-center justify-center rounded-xl text-xs font-black transition-all border", 
                                            q.answer === c.key ? "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20" : "bg-muted/40 text-muted-foreground border-border/40 hover:border-emerald-500/40")}>
                                           {c.key}
                                        </button>
                                        <input value={c.text} onChange={e => updateChoice(qi, ci, e.target.value)} 
                                          className="flex-1 h-10 rounded-xl border border-border/40 bg-background/30 px-3 text-sm focus:outline-none focus:border-violet-400" />
                                        {q.choices.length > 2 && <button onClick={() => removeChoice(qi, ci)} className="opacity-0 group-hover/row:opacity-100 p-2 text-muted-foreground hover:text-rose-500 transition-all"><X className="h-4 w-4" /></button>}
                                     </div>
                                   ))}
                                </div>
                             </div>
                          ) : (
                             <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Reference Evaluation Model (Essay)</label>
                                <textarea value={q.essayReference} onChange={e => updateQ(qi, "essayReference", e.target.value)}
                                  placeholder="Define the core knowledge points for AI semantic validation…"
                                  className="w-full h-32 rounded-2xl border border-border/60 bg-background/50 p-4 text-sm focus:ring-violet-500/40 focus:outline-none resize-none" />
                             </div>
                          )}

                          <div className="space-y-1.5">
                             <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Rationalized Explanation</label>
                             <textarea value={q.explanation} onChange={e => updateQ(qi, "explanation", e.target.value)}
                                placeholder="Synthesize the logic behind the correct pathway…"
                                className="w-full h-24 bg-muted/20 border border-border/40 rounded-xl p-4 text-xs italic text-muted-foreground focus:outline-none focus:ring-1 focus:ring-violet-400" />
                          </div>
                       </div>
                    </div>
                 </div>
               )}
             </div>
           ))}
           
           <div className="flex items-center justify-between pt-4">
              <button onClick={addQuestion} className="h-12 flex items-center justify-center gap-2 rounded-xl bg-card border border-border/60 px-6 text-sm font-bold shadow-sm hover:bg-muted/50 transition-all font-display">
                 <Plus className="h-4 w-4 text-violet-500" />
                 Allocate New Node
              </button>
              
              <div className="flex items-center gap-4">
                 <p className="hidden sm:block text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Audit Status: {validCount} / {questions.length} Valid
                 </p>
                 <button onClick={handleSave} disabled={saving || !form.title} className="h-12 flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-10 text-sm font-black text-white shadow-xl shadow-violet-500/20 hover:opacity-90 disabled:opacity-40 transition-all font-display">
                    {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                    Deploy Curriculum
                 </button>
              </div>
           </div>
        </div>
      </div>

      <QuickDrawModal
        open={drawForQi !== null}
        onClose={() => setDrawForQi(null)}
        onSaved={(url) => { if (drawForQi !== null) { updateQ(drawForQi, "imageUrl", url); setDrawForQi(null); } }}
        title="Diagnostic Drawing"
        exportBackground="#ffffff"
      />
    </div>
  );
}
