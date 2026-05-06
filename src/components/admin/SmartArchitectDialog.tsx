"use client";

import { useState, useRef } from "react";
import { 
  X, Zap, FileText, Loader2, Check, AlertCircle, 
  Trash2, Plus, ChevronRight, Layout, BookOpen, Layers,
  Save, RefreshCw, Bot, Sparkles, Settings, Download
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface SmartArchitectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  semester: { id: string; name: string } | null;
  onSuccess: () => void;
}

type Step = "input" | "loading" | "preview" | "automation" | "success";

interface Structure {
  modules: {
    name: string;
    subjects: {
      name: string;
      lectures: {
         title: string;
         videoUrl?: string | null;
         fileUrl?: string | null;
      }[];
    }[];
  }[];
}

export function SmartArchitectDialog({ isOpen, onClose, semester, onSuccess }: SmartArchitectDialogProps) {
  const [step, setStep] = useState<Step>("input");
  const [textInput, setTextInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loadingMsg, setLoadingMsg] = useState("Architecting...");
  const [structure, setStructure] = useState<Structure | null>(null);
  const [isCommitting, setIsCommitting] = useState(false);
  const [wipeMode, setWipeMode] = useState(false);
  const [enableSmartImages, setEnableSmartImages] = useState(false);
  const [scope, setScope] = useState<"semester"|"module">("semester");
  
  // Advanced Settings
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customProvider, setCustomProvider] = useState("puter");
  const [customApiKey, setCustomApiKey] = useState("");
  
  // MANUS Agent State
  const [agentTasks, setAgentTasks] = useState<any[]>([]);
  const [agentIndex, setAgentIndex] = useState(0);
  const [agentLogs, setAgentLogs] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [showProviderDropdown, setShowProviderDropdown] = useState(false);

  if (!isOpen || !semester) return null;

  async function handleAnalyze() {
    if (!textInput.trim() && !file) {
      return toast.error("Please provide text or a file");
    }

    setStep("loading");
    setLoadingMsg("AI is parsing the curriculum...");
    
    try {
      const fd = new FormData();
      fd.append("semesterId", semester!.id);
      fd.append("mode", "analyze");
      fd.append("scope", scope);
      if (file) fd.append("file", file);
      if (textInput) fd.append("text", textInput);
      
      // Pass custom API details
      fd.append("provider", customProvider);
      if (customApiKey.trim()) {
        fd.append("apiKey", customApiKey.trim());
      }

      const res = await fetch("/api/v1/admin/ai/architect", {
        method: "POST",
        body: fd
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");

      setStructure(data.structure);
      setStep("preview");
    } catch (e: any) {
      toast.error(e.message);
      setStep("input");
    }
  }

  async function handleDownloadContent() {
    setDownloading(true);
    try {
      const res = await fetch(`/api/v1/ai/download-semester?semesterId=${semester!.id}`);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `MedOneX_${semester!.name.replace(/\s+/g, "_")}_Content.docx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Content downloaded successfully!");
    } catch (e) {
      toast.error("Download failed");
    } finally {
      setDownloading(false);
    }
  }

  async function handleCommit() {
    if (!structure) return;
    setIsCommitting(true);
    
    try {
      const fd = new FormData();
      fd.append("semesterId", semester!.id);
      fd.append("mode", "commit");
      fd.append("structure", JSON.stringify(structure));
      fd.append("wipe", wipeMode ? "1" : "0");

      const res = await fetch("/api/v1/admin/ai/architect", {
        method: "POST",
        body: fd
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Commit failed");

      if (data.agentTasks && data.agentTasks.length > 0) {
        setAgentTasks(data.agentTasks);
        setStep("automation");
        startAgentAutomation(data.agentTasks);
      } else {
        toast.success("Semester curriculum built successfully!");
        setStep("success");
        onSuccess();
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsCommitting(false);
    }
  }

  async function startAgentAutomation(tasks: any[]) {
    const CONCURRENCY = 3;
    const queue = [...tasks];
    let completedCount = 0;
    
    setAgentLogs(prev => [...prev, `[MANUS] Starting High-Speed Pipeline (Concurrency: ${CONCURRENCY})...`]);

    const worker = async () => {
      while (queue.length > 0) {
        const task = queue.shift();
        if (!task) break;

        const logMsg = `[MANUS] Fetching "${task.lectureTitle}" from URL...`;
        setAgentLogs(prev => [...prev, logMsg]);
        
        try {
          const res = await fetch("/api/v1/admin/ai/manus-agent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              lectureId: task.lectureId, 
              url: task.url,
              enableSmartImages,
              apiKey: customApiKey,
              provider: customProvider
            })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Agent failed");
          
          const successMsg = `[MANUS] Success on "${task.lectureTitle}": Generated ${data.generatedResults?.questions || 0} MCQs, ${data.generatedResults?.flashcards || 0} Flashcards.`;
          setAgentLogs(prev => [...prev, successMsg]);
        } catch (e: any) {
          setAgentLogs(prev => [...prev, `[ERROR] Failed to process "${task.lectureTitle}": ${e.message}`]);
        } finally {
          completedCount++;
          setAgentIndex(completedCount);
        }
      }
    };

    const workers = Array(CONCURRENCY).fill(null).map(() => worker());
    await Promise.all(workers);
    
    setAgentLogs(prev => [...prev, `[MANUS] Autonomous pipeline complete! All ${tasks.length} tasks finished.`]);
    setTimeout(() => {
      toast.success("Semester curriculum and MANUS Population built successfully!");
      setStep("success");
      onSuccess();
    }, 2000);
  }

  // --- Editing Handlers ---
  const updateModuleName = (mIdx: number, val: string) => {
    if (!structure) return;
    const n = { ...structure };
    n.modules[mIdx]!.name = val;
    setStructure(n);
  };

  const updateSubjectName = (mIdx: number, sIdx: number, val: string) => {
    if (!structure) return;
    const n = { ...structure };
    n.modules[mIdx]!.subjects[sIdx]!.name = val;
    setStructure(n);
  };

  const updateLectureName = (mIdx: number, sIdx: number, lIdx: number, val: string) => {
    if (!structure) return;
    const n = { ...structure };
    if (typeof n.modules[mIdx]!.subjects[sIdx]!.lectures[lIdx] === 'string') {
        n.modules[mIdx]!.subjects[sIdx]!.lectures[lIdx] = { title: val };
    } else {
        (n.modules[mIdx]!.subjects[sIdx]!.lectures[lIdx] as any).title = val;
    }
    setStructure(n);
  };

  const deleteModule = (mIdx: number) => {
    if (!structure) return;
    const n = { ...structure };
    n.modules.splice(mIdx, 1);
    setStructure(n);
  };

  const deleteSubject = (mIdx: number, sIdx: number) => {
    if (!structure) return;
    const n = { ...structure };
    n.modules[mIdx]!.subjects.splice(sIdx, 1);
    setStructure(n);
  };

  const deleteLecture = (mIdx: number, sIdx: number, lIdx: number) => {
    if (!structure) return;
    const n = { ...structure };
    n.modules[mIdx]!.subjects[sIdx]!.lectures.splice(lIdx, 1);
    setStructure(n);
  };

  const removeLectureVideo = (mIdx: number, sIdx: number, lIdx: number) => {
    if (!structure) return;
    const n = { ...structure };
    const lec = n.modules[mIdx]!.subjects[sIdx]!.lectures[lIdx] as any;
    if (lec && typeof lec === 'object') {
       lec.videoUrl = null;
       lec.videoUrls = [];
    }
    setStructure(n);
  };

  const removeLectureFile = (mIdx: number, sIdx: number, lIdx: number) => {
    if (!structure) return;
    const n = { ...structure };
    const lec = n.modules[mIdx]!.subjects[sIdx]!.lectures[lIdx] as any;
    if (lec && typeof lec === 'object') {
       lec.fileUrl = null;
       lec.fileUrls = [];
    }
    setStructure(n);
  };

  const removeLectureRecord = (mIdx: number, sIdx: number, lIdx: number) => {
    if (!structure) return;
    const n = { ...structure };
    const lec = n.modules[mIdx]!.subjects[sIdx]!.lectures[lIdx] as any;
    if (lec && typeof lec === 'object') {
       lec.recordUrls = [];
    }
    setStructure(n);
  };

  const addModule = () => {
    if (!structure) return;
    setStructure({ 
      ...structure, 
      modules: [...structure.modules, { name: "New Module", subjects: [] }] 
    });
  };

  const addSubject = (mIdx: number) => {
    if (!structure) return;
    const n = { ...structure };
    n.modules[mIdx]!.subjects.push({ name: "New Subject", lectures: [] });
    setStructure(n);
  };

  const addLecture = (mIdx: number, sIdx: number) => {
    if (!structure) return;
    const n = { ...structure };
    n.modules[mIdx]!.subjects[sIdx]!.lectures.push({ title: "New Lecture", videoUrl: null, fileUrl: null });
    setStructure(n);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={!isCommitting ? onClose : undefined} />
      
      <div className="relative flex h-[90vh] max-h-[900px] w-full max-w-6xl flex-col overflow-hidden rounded-[2.5rem] border border-white/[0.05] bg-slate-950/40 backdrop-blur-3xl text-white shadow-[0_32px_128px_-16px_rgba(0,0,0,0.7)] animate-in zoom-in-95 duration-500">
        
        {/* Floating Island Header */}
        <div className="mx-auto mt-6 mb-2 flex w-fit items-center gap-6 rounded-full border border-white/[0.08] bg-white/5 px-8 py-4 shadow-xl backdrop-blur-2xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.5)]">
             <Zap className="h-6 w-6" />
          </div>
          <div className="flex flex-col pr-4 border-r border-white/10">
            <h2 className="font-display text-xl font-black tracking-tight bg-gradient-to-r from-white via-white to-blue-400 bg-clip-text text-transparent">AI Academic Architect</h2>
            <p className="font-sans text-[10px] font-bold text-blue-400/80 uppercase tracking-[0.3em]">{semester.name} System</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              disabled={isCommitting}
              onClick={onClose} 
              className="group flex h-10 w-10 items-center justify-center rounded-full bg-white/5 hover:bg-red-500/20 hover:text-red-400 transition-all duration-300 disabled:opacity-30"
            >
              <X className="h-5 w-5 group-hover:rotate-90 transition-transform" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
          
          {/* STEP 1: INPUT */}
          {step === "input" && (
            <div className="max-w-4xl mx-auto space-y-10 animate-in slide-in-from-bottom-8 duration-700">
               <div className="text-center space-y-4">
                 <h3 className="font-display text-4xl font-black tracking-tight text-white">Architect Your Success</h3>
                 <p className="font-sans text-slate-400 max-w-xl mx-auto leading-relaxed">Upload your Student Guide or paste the schedule. Our AI Architect will map out every module, subject, and lecture autonomously.</p>
               </div>

               <div className="flex bg-white/5 p-2 rounded-[2rem] border border-white/[0.05] mx-auto max-w-md shadow-2xl backdrop-blur-md">
                 <button
                   onClick={() => setScope("semester")}
                   className={cn("flex-1 py-4 text-xs font-black uppercase tracking-widest rounded-[1.5rem] transition-all duration-500", scope === "semester" ? "bg-blue-600 text-white shadow-lg shadow-blue-500/40 scale-[1.02]" : "text-slate-500 hover:text-white hover:bg-white/5")}
                 >
                   Full Semester
                 </button>
                 <button
                   onClick={() => setScope("module")}
                   className={cn("flex-1 py-4 text-xs font-black uppercase tracking-widest rounded-[1.5rem] transition-all duration-500", scope === "module" ? "bg-blue-600 text-white shadow-lg shadow-blue-500/40 scale-[1.02]" : "text-slate-500 hover:text-white hover:bg-white/5")}
                 >
                   Single Module
                 </button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div 
                   onClick={() => fileInputRef.current?.click()}
                   className={cn(
                     "group relative flex flex-col items-center justify-center cursor-pointer rounded-[2.5rem] border-2 border-dashed p-12 text-center transition-all duration-500",
                     file ? "border-blue-500 bg-blue-500/5 shadow-[0_0_40px_rgba(59,130,246,0.1)]" : "border-white/10 bg-white/[0.02] hover:border-blue-500/50 hover:bg-white/5"
                   )}
                 >
                   <input 
                     ref={fileInputRef}
                     type="file" 
                     accept=".pdf" 
                     className="hidden" 
                     onChange={(e) => setFile(e.target.files?.[0] || null)}
                   />
                   <div className={cn("flex h-20 w-20 items-center justify-center rounded-3xl shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3", file ? "bg-blue-600 text-white" : "bg-white/5 text-slate-500")}>
                     <FileText className="h-10 w-10" />
                   </div>
                   <div className="mt-6">
                     <p className="font-display text-lg font-bold text-white">{file ? file.name : "Student Guide PDF"}</p>
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-2">Max 20MB · PDF Only</p>
                   </div>
                 </div>

                 <div className="flex flex-col gap-4">
                   <textarea 
                      placeholder="Or paste schedule text here..."
                      className="w-full h-full min-h-[200px] rounded-[2.5rem] bg-white/[0.03] border border-white/10 p-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all font-mono placeholder:text-slate-600 text-slate-200"
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                   />
                 </div>
               </div>

               {/* Advanced Settings */}
               <div className="pt-4 border-t border-white/[0.05]">
                 <button 
                   onClick={() => setShowAdvanced(!showAdvanced)}
                   className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 hover:text-blue-400 transition-all mx-auto bg-white/5 px-6 py-2 rounded-full border border-white/5"
                 >
                   <Settings className={cn("h-3 w-3", showAdvanced && "animate-spin-slow")} />
                   {showAdvanced ? "Hide AI Parameters" : "AI Provider & Parameters"}
                 </button>

                 {showAdvanced && (
                   <div className="mt-6 p-8 rounded-[2.5rem] bg-blue-600/5 border border-blue-500/10 space-y-6 animate-in slide-in-from-top-4 duration-500">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">                         <div className="space-y-3 relative">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400/80 ml-2">Intelligence Source</label>
                            
                            {/* Custom Dropdown */}
                            <div className="relative group">
                              <button 
                                onClick={(e) => { e.preventDefault(); setShowProviderDropdown(!showProviderDropdown); }}
                                className="w-full flex items-center justify-between bg-slate-900/50 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:ring-2 ring-blue-500/50 outline-none transition-all hover:bg-slate-800/80 shadow-inner"
                              >
                                <span className="flex items-center gap-2">
                                  <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                                  {customProvider === "puter" ? "Puter.js (Default)" : 
                                   customProvider === "internal-proxy" ? "Internal Proxy (Keyless Elite)" :
                                   customProvider === "duckduckgo" ? "DuckDuckGo (Free & Keyless)" :
                                   customProvider === "openrouter" ? "OpenRouter (Free Models)" :
                                   customProvider === "claude-3.5-sonnet" ? "Puter: Claude 3.5 Sonnet" :
                                   customProvider === "gpt-4o" ? "Puter: GPT-4o" :
                                   customProvider === "meta-llama-3.1-405b-instruct" ? "Puter: Llama 3.1 (405B)" :
                                   customProvider === "gemini" ? "Google Gemini" :
                                   customProvider === "openai" ? "OpenAI (Direct)" :
                                   customProvider === "deepseek" ? "DeepSeek (Direct)" :
                                   customProvider === "anthropic" ? "Anthropic (Direct)" : customProvider}
                                </span>
                                <ChevronRight className={cn("h-4 w-4 text-slate-500 transition-transform", showProviderDropdown ? "rotate-90" : "rotate-0")} />
                              </button>

                              {showProviderDropdown && (
                                <>
                                  <div className="fixed inset-0 z-[10]" onClick={() => setShowProviderDropdown(false)} />
                                  <div className="absolute top-full left-0 right-0 mt-2 z-[20] max-h-[300px] overflow-y-auto rounded-[1.5rem] border border-white/10 bg-slate-900/90 backdrop-blur-2xl shadow-2xl p-2 custom-scrollbar animate-in fade-in slide-in-from-top-2">
                                    {[
                                      { id: "puter", name: "Puter.js (Default)" },
                                      { id: "internal-proxy", name: "Internal Proxy (Keyless Elite)" },
                                      { id: "duckduckgo", name: "DuckDuckGo (Free & Keyless)" },
                                      { id: "openrouter", name: "OpenRouter (Free Models)" },
                                      { id: "claude-3.5-sonnet", name: "Puter: Claude 3.5 Sonnet" },
                                      { id: "gpt-4o", name: "Puter: GPT-4o" },
                                      { id: "meta-llama-3.1-405b-instruct", name: "Puter: Llama 3.1 (405B)" },
                                      { id: "gemini", name: "Google Gemini" },
                                      { id: "openai", name: "OpenAI (Direct)" },
                                      { id: "deepseek", name: "DeepSeek (Direct)" },
                                      { id: "anthropic", name: "Anthropic (Direct)" }
                                    ].map((opt) => (
                                      <button
                                        key={opt.id}
                                        onClick={() => { setCustomProvider(opt.id); setShowProviderDropdown(false); }}
                                        className={cn(
                                          "w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between",
                                          customProvider === opt.id ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
                                        )}
                                      >
                                        {opt.name}
                                        {customProvider === opt.id && <Check className="h-3 w-3" />}
                                      </button>
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>
                         </div>
                         <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400/80 ml-2">Private Access Key</label>
                            <input 
                              type="password"
                              placeholder="sk-..."
                              value={customApiKey}
                              onChange={(e) => setCustomApiKey(e.target.value)}
                              className="w-full bg-slate-900/50 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:ring-2 ring-blue-500/50 outline-none transition-all font-mono"
                            />
                         </div>
                      </div>
                   </div>
                 )}
               </div>

               <button 
                 onClick={handleAnalyze}
                 className="group relative w-full py-6 rounded-[2rem] bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 bg-[length:200%_auto] font-display font-black text-xl uppercase tracking-[0.2em] shadow-[0_24px_60px_-12px_rgba(59,130,246,0.4)] hover:bg-right transition-all duration-700 active:scale-[0.98] flex items-center justify-center gap-4 overflow-hidden"
               >
                 <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                 <Zap className="h-6 w-6 group-hover:scale-125 transition-transform" />
                 Analyze Curriculum
               </button>
            </div>
          )}

          {/* STEP 2: LOADING */}
          {step === "loading" && (
            <div className="flex h-full flex-col items-center justify-center gap-6 py-20">
               <div className="relative h-24 w-24">
                  <div className="absolute inset-0 rounded-full border-4 border-blue-500/20" />
                  <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
                  <Zap className="absolute inset-0 m-auto h-8 w-8 text-blue-400 animate-pulse" />
               </div>
               <div className="text-center space-y-2">
                 <p className="text-xl font-bold tracking-tight">{loadingMsg}</p>
                 <p className="text-sm text-slate-500 animate-pulse">Consulting the AI Architect to map your curriculum...</p>
               </div>
            </div>
          )}

          {/* STEP 3: PREVIEW */}
          {step === "preview" && structure && (
            <div className="space-y-8 animate-in slide-in-from-right-4">
               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 bg-slate-900/90 backdrop-blur-md pb-4 pt-2 z-10 border-b border-white/[0.02]">
                  <div>
                    <h3 className="text-2xl font-bold tracking-tight">Review & Refine</h3>
                    <p className="text-sm text-slate-400">The AI identified <b>{structure.modules.length} modules</b>. You can customize them before building.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={handleDownloadContent}
                      disabled={downloading}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-sm font-bold transition-all disabled:opacity-50"
                    >
                      {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                      Download Content
                    </button>
                    <button 
                      onClick={() => setStep("input")}
                      disabled={isCommitting}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-bold transition-all disabled:opacity-50"
                    >
                      <RefreshCw className="h-4 w-4" /> Start Over
                    </button>
                    <button 
                      onClick={handleCommit}
                      disabled={isCommitting}
                      className="flex items-center gap-2 px-6 py-2 rounded-xl bg-blue-600 font-bold text-sm shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-all disabled:opacity-50"
                    >
                      {isCommitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Build Semester
                    </button>
                  </div>
               </div>

               <div className="space-y-6">
                  {structure.modules.map((mod, mIdx) => (
                    <div key={mIdx} className="group rounded-[2rem] border border-white/[0.03] bg-white/5 overflow-hidden transition-all hover:bg-white/10">
                       <div className="flex items-center justify-between bg-white/5 p-4 px-6">
                          <div className="flex items-center gap-4 flex-1">
                             <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                                <Layout className="h-5 w-5" />
                             </div>
                             <input 
                                value={mod.name} 
                                onChange={(e) => updateModuleName(mIdx, e.target.value)}
                                className="bg-transparent text-lg font-bold focus:outline-none focus:ring-1 ring-blue-500/50 rounded px-1 flex-1" 
                             />
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={() => addSubject(mIdx)} className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"><Plus className="h-4 w-4" /></button>
                             <button onClick={() => deleteModule(mIdx)} className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20"><Trash2 className="h-4 w-4" /></button>
                          </div>
                       </div>

                       <div className="p-6 space-y-4">
                          {mod.subjects.map((subj, sIdx) => (
                            <div key={sIdx} className="pl-6 border-l-2 border-white/[0.03] space-y-3">
                               <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                     <BookOpen className="h-4 w-4 text-blue-400" />
                                     <input 
                                       value={subj.name} 
                                       onChange={(e) => updateSubjectName(mIdx, sIdx, e.target.value)}
                                       className="bg-transparent text-sm font-bold focus:outline-none focus:ring-1 ring-blue-500/50 rounded px-1" 
                                     />
                                  </div>
                                  <div className="flex items-center gap-2">
                                     <button onClick={() => addLecture(mIdx, sIdx)} className="text-[10px] font-bold uppercase text-blue-500 hover:underline">+ Lecture</button>
                                     <button onClick={() => deleteSubject(mIdx, sIdx)} className="h-6 w-6 flex items-center justify-center rounded bg-red-500/5 text-red-500/50 hover:text-red-500"><X className="h-3.5 w-3.5" /></button>
                                  </div>
                               </div>

                               <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-4">
                                  {subj.lectures.map((lec: any, lIdx) => {
                                    const titleStr = typeof lec === 'string' ? lec : lec.title;
                                    const videoCount = typeof lec === 'object' ? (Array.isArray(lec.videoUrls) && lec.videoUrls.length > 0 ? lec.videoUrls.length : (lec.videoUrl ? 1 : 0)) : 0;
                                    const fileCount = typeof lec === 'object' ? (Array.isArray(lec.fileUrls) && lec.fileUrls.length > 0 ? lec.fileUrls.length : (lec.fileUrl ? 1 : 0)) : 0;
                                    const recordCount = typeof lec === 'object' ? (Array.isArray(lec.recordUrls) ? lec.recordUrls.length : 0) : 0;
                                    return (
                                     <div key={lIdx} className="group/lec flex items-center justify-between gap-2 p-2 px-3 rounded-xl bg-white/5 border border-white/[0.02] hover:border-blue-500/30 transition-all">
                                        <div className="flex items-center gap-2 flex-1">
                                           <Layers className="h-3 w-3 text-slate-500 shrink-0" />
                                           <input 
                                              value={titleStr} 
                                              onChange={(e) => updateLectureName(mIdx, sIdx, lIdx, e.target.value)}
                                              className="bg-transparent text-xs text-slate-300 focus:outline-none w-full"
                                           />
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                           {videoCount > 0 && (
                                              <div className="flex h-5 items-center rounded bg-blue-500/10 text-[9px] font-bold text-blue-400 group/pill">
                                                <span className="px-1.5">{videoCount > 1 ? `${videoCount} VIDEOS` : 'VIDEO'}</span>
                                                <button onClick={() => removeLectureVideo(mIdx, sIdx, lIdx)} className="h-5 w-4 flex items-center justify-center hover:bg-blue-500/20 text-blue-400/50 hover:text-blue-400 rounded-r transition-colors">
                                                   <X className="h-2.5 w-2.5" />
                                                </button>
                                              </div>
                                           )}
                                           {recordCount > 0 && (
                                              <div className="flex h-5 items-center rounded bg-[#1DB954]/10 text-[9px] font-bold text-[#1DB954] group/pill">
                                                <span className="px-1.5">{recordCount > 1 ? `${recordCount} RECORDS` : 'RECORD'}</span>
                                                <button onClick={() => removeLectureRecord(mIdx, sIdx, lIdx)} className="h-5 w-4 flex items-center justify-center hover:bg-[#1DB954]/20 text-[#1DB954]/50 hover:text-[#1DB954] rounded-r transition-colors">
                                                   <X className="h-2.5 w-2.5" />
                                                </button>
                                              </div>
                                           )}
                                           {fileCount > 0 && (
                                              <div className="flex h-5 items-center rounded bg-emerald-500/10 text-[9px] font-bold text-emerald-400 group/pill">
                                                <span className="px-1.5">{fileCount > 1 ? `${fileCount} FILES` : 'FILE'}</span>
                                                <button onClick={() => removeLectureFile(mIdx, sIdx, lIdx)} className="h-5 w-4 flex items-center justify-center hover:bg-emerald-500/20 text-emerald-400/50 hover:text-emerald-400 rounded-r transition-colors">
                                                   <X className="h-2.5 w-2.5" />
                                                </button>
                                              </div>
                                           )}
                                           <button onClick={() => deleteLecture(mIdx, sIdx, lIdx)} className="ml-1 opacity-0 group-hover/lec:opacity-100 p-1 rounded hover:bg-red-500/10 text-red-500 transition-opacity"><X className="h-3 w-3" /></button>
                                        </div>
                                     </div>
                                    );
                                  })}
                                  {subj.lectures.length === 0 && <p className="text-[10px] italic text-slate-500">No lectures identified.</p>}
                               </div>
                            </div>
                          ))}
                          {mod.subjects.length === 0 && <p className="text-xs italic text-slate-500 pl-6">No subjects found in this module.</p>}
                       </div>
                    </div>
                  ))}
                  
                  <button 
                    onClick={addModule}
                    className="w-full py-4 border-2 border-dashed border-white/[0.03] rounded-[1.5rem] text-slate-500 hover:bg-white/5 hover:border-blue-500/20 hover:text-blue-500 transition-all text-sm font-bold flex items-center justify-center gap-2"
                  >
                    <Plus className="h-4 w-4" /> Add Custom Module
                  </button>
               </div>

               {/* Bulk Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-3xl bg-amber-500/5 border border-amber-500/20 p-6 flex items-center gap-4">
                    <div className="h-12 w-12 shrink-0 flex items-center justify-center rounded-2xl bg-amber-500/20 text-amber-500">
                       <AlertCircle className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                       <h4 className="text-sm font-bold text-amber-500">Curriculum Overwrite</h4>
                       <p className="text-[10px] text-amber-500/70">Wiping existing data will remove all current modules and lectures.</p>
                    </div>
                    <button 
                      onClick={() => setWipeMode(!wipeMode)}
                      className={cn(
                        "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                        wipeMode ? "bg-amber-500" : "bg-slate-700"
                      )}
                    >
                      <div className={cn("absolute top-1 h-4 w-4 rounded-full bg-white transition-all", wipeMode ? "left-6" : "left-1")} />
                    </button>
                  </div>

                  <div className="rounded-3xl bg-blue-500/5 border border-blue-500/20 p-6 flex items-center gap-4">
                    <div className="h-12 w-12 shrink-0 flex items-center justify-center rounded-2xl bg-blue-500/20 text-blue-500">
                       <Sparkles className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                       <h4 className="text-sm font-bold text-blue-500">Smart Illustrations</h4>
                       <p className="text-[10px] text-blue-500/70">Use Open-i AI to find relevant medical images for generated questions.</p>
                    </div>
                    <button 
                      onClick={() => setEnableSmartImages(!enableSmartImages)}
                      className={cn(
                        "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                        enableSmartImages ? "bg-blue-500" : "bg-slate-700"
                      )}
                    >
                      <div className={cn("absolute top-1 h-4 w-4 rounded-full bg-white transition-all", enableSmartImages ? "left-6" : "left-1")} />
                    </button>
                  </div>
               </div>
             </div>
          )}

          {/* STEP 4: AUTOMATION (MANUS) */}
          {step === "automation" && (
            <div className="flex h-full flex-col items-center justify-center gap-6 py-10 animate-in fade-in">
              <div className="w-full max-w-xl bg-card border border-primary/20 p-8 rounded-3xl space-y-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" />
                
                <div className="flex items-center gap-4 border-b border-white/[0.02] pb-6">
                  <div className="h-14 w-14 rounded-2xl bg-primary/20 flex items-center justify-center shadow-[0_0_20px_rgba(var(--primary),0.3)]">
                    <Bot className="h-7 w-7 text-primary animate-bounce" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold tracking-tight">MANUS Smart Agent</h3>
                    <p className="text-sm text-muted-foreground font-medium">Autonomously fetching links and generating academic content...</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pipeline Status</span>
                    <span className="text-xl font-bold text-primary">{Math.min(agentIndex + 1, agentTasks.length)} <span className="text-muted-foreground text-sm">/ {agentTasks.length}</span></span>
                  </div>
                  <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden border border-white/[0.02]">
                    <div 
                      className="h-full bg-primary transition-all duration-500 ease-out" 
                      style={{ width: `${Math.max(2, ((agentIndex) / Math.max(1, agentTasks.length)) * 100)}%` }} 
                    />
                  </div>
                </div>

                <div className="bg-black/60 rounded-xl p-5 font-mono text-xs overflow-y-auto h-[220px] flex flex-col gap-2 max-w-full">
                  {agentLogs.map((log, i) => (
                    <div key={i} className={cn("transition-all flex gap-3", i === agentLogs.length - 1 ? "text-primary font-bold" : "text-muted-foreground opacity-60")}>
                      <span className="text-slate-600 shrink-0">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                      <span>{log}</span>
                    </div>
                  ))}
                  {agentIndex < agentTasks.length && (
                    <div className="flex gap-1 items-center mt-2 opacity-50 pl-[64px]">
                       <span className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce" />
                       <span className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                       <span className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: SUCCESS */}
          {step === "success" && (
            <div className="flex h-full flex-col items-center justify-center gap-6 py-20 animate-in zoom-in-95">
               <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500 shadow-lg shadow-emerald-500/20">
                  <Check className="h-12 w-12" />
               </div>
               <div className="text-center space-y-2">
                 <h3 className="text-3xl font-bold tracking-tight">Mission Accomplished!</h3>
                 <p className="text-slate-400">The academic skeleton for <b>{semester.name}</b> was successfully built.</p>
               </div>
               <div className="flex gap-4">
                  <button 
                    onClick={handleDownloadContent}
                    disabled={downloading}
                    className="mt-4 px-8 py-3 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 font-bold hover:bg-emerald-600/30 transition-all flex items-center gap-2"
                  >
                    {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    Download Word Content
                  </button>
                  <button 
                    onClick={onClose}
                    className="mt-4 px-10 py-3 rounded-2xl bg-emerald-600 font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-emerald-600/20"
                  >
                    Go to Dashboard
                  </button>
                </div>
            </div>
          )}

        </div>

        {/* Footer info */}
        <div className="border-t border-white/[0.02] bg-slate-950 p-4 px-10 flex items-center justify-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">
              MedQs Intelligence Engine · Powered by Puter.js
            </p>
        </div>
      </div>
    </div>
  );
}
