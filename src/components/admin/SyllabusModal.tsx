"use client";

import { X, BookOpen, CheckCircle2 } from "lucide-react";

interface SyllabusModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: {
    title: string;
    analysisJson: {
      subjects?: { name: string; topics: string[] }[];
    };
  } | null;
}

export function SyllabusModal({ isOpen, onClose, book }: SyllabusModalProps) {
  if (!isOpen || !book) return null;

  const subjects = book.analysisJson?.subjects || [];

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-[3rem] border border-white/10 bg-slate-900 text-white shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col">
        <div className="flex items-center justify-between border-b border-white/5 p-8">
          <div className="flex items-center gap-4">
             <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 text-primary">
                <BookOpen className="h-6 w-6" />
             </div>
             <div>
                <h3 className="font-display text-xl font-bold">{book.title}</h3>
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Extracted Academic Syllabus</p>
             </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-white/10 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 space-y-8 scrollbar-thin scrollbar-thumb-white/10">
          {subjects.length === 0 ? (
            <div className="py-20 text-center opacity-40 italic">No subjects extracted from this document.</div>
          ) : (
            subjects.map((subject, idx) => (
              <div key={idx} className="space-y-4">
                 <div className="flex items-center gap-3">
                    <span className="text-sm font-black text-primary/60">0{idx + 1}</span>
                    <h4 className="text-xl font-black tracking-tight">{subject.name}</h4>
                 </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-8">
                    {subject.topics.map((topic, tIdx) => (
                      <div key={tIdx} className="flex items-center gap-2 p-3 rounded-2xl bg-white/5 border border-white/5 text-sm font-medium text-slate-300">
                         <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500/60 shrink-0" />
                         {topic}
                      </div>
                    ))}
                 </div>
              </div>
            ))
          )}
        </div>

        <div className="p-8 border-t border-white/5 bg-slate-950/40">
           <p className="text-[10px] text-center font-bold text-muted-foreground uppercase tracking-[0.2em]">
             MedQs Syllabus Intelligence Engine
           </p>
        </div>
      </div>
    </div>
  );
}
