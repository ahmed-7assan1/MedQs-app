"use client";

import { X, Play, FileText, CheckCircle2, Globe, Clock, MessageSquare, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface PreviewResource {
  id: string;
  title: string;
  type: "VIDEO" | "QUESTION" | "FILE";
  url?: string;
  university?: string;
  moduleName?: string;
  createdAt: string;
  originType: string;
}

interface ResourcePreviewModalProps {
  resource: PreviewResource | null;
  isOpen: boolean;
  onClose: () => void;
  onImport: (resource: PreviewResource) => void;
}

export function ResourcePreviewModal({ resource, isOpen, onClose, onImport }: ResourcePreviewModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
  }, [isOpen]);

  if (!mounted || !isOpen || !resource) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-8 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-4xl overflow-hidden rounded-[2.5rem] border border-white/[0.02] bg-card/90 shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.02] px-8 py-6">
          <div className="flex items-center gap-4">
            <div className={cn(
              "flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ring-border/50 shadow-inner",
              resource.type === "VIDEO" ? "bg-blue-500/10 text-blue-500" : "bg-green-500/10 text-green-500"
            )}>
              {resource.type === "VIDEO" ? <Play className="h-6 w-6" /> : <ListChecks className="h-6 w-6" />}
            </div>
            <div>
              <h2 className="font-display text-xl font-bold tracking-tight text-foreground line-clamp-1">
                {resource.title}
              </h2>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                  <Globe className="h-3 w-3" />
                  {resource.university || "Shared Discovery"}
                </span>
                <span className="h-1 w-1 rounded-full bg-border" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                  {resource.moduleName || "General Topic"}
                </span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          {resource.type === "VIDEO" ? (
            <div className="space-y-6">
              <div className="aspect-video w-full overflow-hidden rounded-3xl bg-black shadow-2xl">
                {resource.url ? (
                  <iframe 
                    src={resource.url.replace("watch?v=", "embed/")} 
                    className="h-full w-full"
                    allowFullScreen
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground italic">
                    Video asset not available for preview
                  </div>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                 <div className="rounded-2xl border border-white/[0.05] bg-muted/30 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Metadata</p>
                    <div className="space-y-2">
                       <div className="flex justify-between text-xs font-semibold">
                          <span className="text-muted-foreground/60">Shared on</span>
                          <span>{new Date(resource.createdAt).toLocaleDateString()}</span>
                       </div>
                       <div className="flex justify-between text-xs font-semibold">
                          <span className="text-muted-foreground/60">Type</span>
                          <span className="text-blue-500">Video Session</span>
                       </div>
                    </div>
                 </div>
                 <div className="rounded-2xl border border-white/[0.05] bg-muted/30 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Content Includes</p>
                    <ul className="space-y-1.5">
                       <li className="flex items-center gap-2 text-xs font-bold text-foreground/80">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          Full Video Lecture
                       </li>
                       <li className="flex items-center gap-2 text-xs font-bold text-foreground/80">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          Linked Handouts
                       </li>
                    </ul>
                 </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/[0.02] bg-muted/20 p-8 text-center">
                 <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/10 text-green-500 mb-4 shadow-inner">
                    <ListChecks className="h-8 w-8" />
                 </div>
                 <h3 className="font-display text-lg font-bold">Question Set Preview</h3>
                 <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
                    This resource contains multiple interactive questions and answers. Previews for individual questions are currently limited to prevent spoilers.
                 </p>
              </div>
              
              <div className="grid gap-4 sm:grid-cols-3">
                 <PreviewStat icon={Clock} label="Duration" value="~15 min" />
                 <PreviewStat icon={MessageSquare} label="Questions" value="Varies" />
                 <PreviewStat icon={FileText} label="Type" value="Assessment" />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/[0.02] bg-muted/30 px-8 py-6 flex items-center justify-between">
           <p className="text-xs text-muted-foreground font-medium hidden sm:block">
             Verify that this content aligns with your curriculum before importing.
           </p>
           <div className="flex items-center gap-3 w-full sm:w-auto">
              <button 
                onClick={onClose}
                className="flex-1 sm:flex-none px-6 py-2.5 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => onImport(resource)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-2xl bg-primary px-8 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Import to My Modules
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}

function PreviewStat({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.05] bg-card p-4 text-center">
      <Icon className="h-5 w-5 text-muted-foreground/40 mx-auto mb-2" />
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{label}</p>
      <p className="text-sm font-black mt-1">{value}</p>
    </div>
  );
}


