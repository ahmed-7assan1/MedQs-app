"use client";

import { useState } from "react";
import { X, Upload, Loader2, Book, Sparkles, CheckCircle2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface SourceBookUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  facultyId: string;
}

export function SourceBookUploadModal({ isOpen, onClose, onSuccess, facultyId }: SourceBookUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"upload" | "analyzing" | "success">("upload");

  if (!isOpen) return null;

  async function handleAnalyze() {
    if (!file || !facultyId) return;
    setLoading(true);
    setStep("analyzing");
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("facultyId", facultyId);

    try {
      const res = await fetch("/api/v1/admin/library/book-analyze", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setStep("success");
        toast.success("Textbook analyzed and modules extracted!");
        setTimeout(() => {
          onSuccess();
          onClose();
          setStep("upload");
          setFile(null);
        }, 2000);
      } else {
        const err = await res.json();
        toast.error(err.error || "Analysis failed");
        setStep("upload");
      }
    } catch (e) {
      toast.error("Network error during analysis");
      setStep("upload");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg overflow-hidden rounded-[2.5rem] border border-border/50 bg-card shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between border-b border-white/5 p-6 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
             <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20">
                <Book className="h-5 w-5 text-blue-400" />
             </div>
             <div>
                <h3 className="font-display font-bold">Curriculum Analyzer</h3>
                <p className="text-[10px] uppercase tracking-widest text-blue-400/60 font-black">AI Multi-Model Engine</p>
             </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-white/10 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-8">
          {step === "upload" && (
            <div className="space-y-6">
              <div className="text-center">
                <h4 className="text-lg font-bold">Upload Your Syllabus</h4>
                <p className="text-sm text-muted-foreground mt-1">Upload the PDF textbook or syllabus for your college to extract its module structure.</p>
              </div>

              <label className={cn(
                "group relative flex h-48 w-full cursor-pointer flex-col items-center justify-center rounded-[2rem] border-2 border-dashed transition-all",
                file ? "border-primary/40 bg-primary/5 shadow-inner" : "border-border/60 hover:border-primary/40 hover:bg-muted/50"
              )}>
                <div className="flex flex-col items-center gap-2">
                  {file ? (
                    <CheckCircle2 className="h-10 w-10 text-primary animate-in zoom-in" />
                  ) : (
                    <Upload className="h-10 w-10 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                  )}
                  <p className="text-sm font-bold tracking-tight">{file ? file.name : "Select Textbook PDF"}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Max density: 32MB</p>
                </div>
                <input type="file" accept=".pdf" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
              </label>

              <button
                disabled={!file || loading}
                onClick={handleAnalyze}
                className="w-full flex items-center justify-center gap-3 rounded-2xl bg-slate-900 py-4 text-sm font-black text-white shadow-xl shadow-slate-900/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 transition-all uppercase tracking-widest"
              >
                Start Analysis
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {step === "analyzing" && (
            <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in duration-500">
               <div className="relative mb-8">
                  <div className="h-24 w-24 rounded-full border-4 border-primary/10" />
                  <div className="absolute inset-0 h-24 w-24 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                  <Sparkles className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-primary animate-pulse" />
               </div>
               <h4 className="text-xl font-bold">Mapping Knowledge Nodes</h4>
               <p className="text-sm text-muted-foreground mt-2 max-w-[280px]"> Our AI is currently parsing the table of contents and extracting module hierarchies...</p>
               
               <div className="mt-8 w-full space-y-2">
                  <AnalysisLoaderItem label="Extracting PDF Text" status="done" />
                  <AnalysisLoaderItem label="Structural Reasoning (Gemini)" status="active" />
                  <AnalysisLoaderItem label="Validating Academic Modules" status="pending" />
               </div>
            </div>
          )}

          {step === "success" && (
            <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in duration-500">
               <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500 text-white shadow-2xl shadow-emerald-500/30">
                  <CheckCircle2 className="h-10 w-10" />
               </div>
               <h4 className="text-2xl font-black">Analysis Complete!</h4>
               <p className="text-sm text-muted-foreground mt-2">Your curriculum has been mapped. Discovery results will now prioritize these modules.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AnalysisLoaderItem({ label, status }: { label: string, status: "done" | "active" | "pending" }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-muted/30 px-4 py-3 border border-border/10">
      <span className={cn("text-xs font-bold", status === "pending" ? "text-muted-foreground/40" : "text-foreground")}>{label}</span>
      {status === "done" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
      {status === "active" && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
      {status === "pending" && <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/20" />}
    </div>
  );
}
