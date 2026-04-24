"use client";

import { MessageSquare, Clock, Plus, Zap, BookOpen, ScrollText } from "lucide-react";
import { cn } from "@/lib/utils";

interface Thread {
  id: string;
  title: string;
  updatedAt: number;
}

interface LeftSidebarProps {
  threads: Thread[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  user?: { name: string; rank: string };
}

export function LeftSidebar({ threads, activeId, onSelect, onNew, user }: LeftSidebarProps) {
  return (
    <aside className="hidden lg:flex w-[240px] flex-col border-r border-drq-border bg-drq-bg fixed inset-y-0 left-0">
      {/* Logo & Nav */}
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center gap-2">
           <div className="h-8 w-8 rounded-lg bg-drq-primary flex items-center justify-center text-white font-bold">Q</div>
           <span className="font-display text-xl font-bold text-white">MedOneX</span>
        </div>

        <nav className="flex flex-col gap-1">
          {["Dashboard", "Lectures", "Study Tools", "Quizzes", "Videos", "Community", "Taskat"].map(item => (
            <button
              key={item}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                item === "Dr. Q Coach" 
                  ? "bg-drq-primary text-white font-semibold" 
                  : "text-white/40 hover:bg-white/5 hover:text-white"
              )}
            >
              {item === "Dr. Q Coach" ? <Zap className="h-4 w-4" /> : <div className="h-4 w-4 rounded bg-white/10" />}
              {item}
            </button>
          ))}
          {/* Active item for this page */}
          <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm bg-drq-primary/10 text-drq-primary font-bold border border-drq-primary/20">
            <Zap className="h-4 w-4" />
            Dr. Q Coach
          </button>
        </nav>
      </div>

      {/* Past Topics */}
      <div className="flex-1 min-h-0 flex flex-col gap-2 p-6 pt-0">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Past topics</h3>
        <div className="flex flex-col gap-1 overflow-y-auto scrollbar-thin scrollbar-thumb-drq-border scrollbar-track-transparent pr-2">
          {threads.map(t => (
            <button
              key={t.id}
              onClick={() => onSelect(t.id)}
              className={cn(
                "group flex flex-col gap-1 px-3 py-2.5 rounded-xl text-left transition-all",
                t.id === activeId 
                  ? "bg-drq-surface border border-drq-border shadow-inner" 
                  : "hover:bg-white/[0.03]"
              )}
            >
              <span className={cn("text-[13px] font-medium truncate", t.id === activeId ? "text-white" : "text-white/60 group-hover:text-white/80")}>
                {t.title}
              </span>
              <span className="text-[10px] text-white/20 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(t.updatedAt).toLocaleDateString()}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* User Row */}
      <div className="p-4 border-t border-drq-border flex items-center gap-3">
         <div className="h-10 w-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/30">
           {user?.name?.[0] || "A"}
         </div>
         <div className="min-w-0">
           <p className="text-sm font-bold text-white truncate">{user?.name || "Dr. Alex"}</p>
           <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-drq-primary text-[9px] font-black uppercase tracking-wider text-white">
             {user?.rank || "Elite"}
           </span>
         </div>
      </div>
    </aside>
  );
}

export function RightSidebar({ sessionContext }: { sessionContext?: any }) {
  return (
    <aside className="hidden xl:flex w-[280px] flex-col gap-6 fixed inset-y-0 right-0 p-6 bg-drq-bg border-l border-drq-border">
      {/* Session Context */}
      <div className="rounded-[1.2rem] bg-drq-surface border border-drq-border p-5 space-y-4">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-drq-purple-light">Session Context</label>
          <div className="flex items-center gap-2 text-white font-bold">
            <BookOpen className="h-4 w-4 text-drq-primary" />
            <span className="truncate">{sessionContext?.subject || "CNS / PHYSIO"}</span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Last Lecture</label>
          <p className="text-xs text-white/60 leading-relaxed truncate">{sessionContext?.lastLecture || "Synaptic Transmission"}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2">Quick Actions</label>
        <div className="flex flex-col gap-2">
          {["Start a quiz on this topic", "Summarize this lecture", "Make flashcards"].map(action => (
            <button
              key={action}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-drq-surface border border-drq-border text-[12px] font-bold text-white hover:bg-white/10 transition-colors"
            >
              {action}
            </button>
          ))}
        </div>
      </div>

      {/* Progress */}
      <div className="rounded-[1.2rem] bg-drq-surface border border-drq-border p-5 space-y-4">
        <div className="flex items-center justify-between">
           <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Your Progress</label>
           <span className="text-[10px] text-drq-primary font-black">{sessionContext?.mastery || 68}%</span>
        </div>
        <div className="space-y-3">
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
             <div className="h-full bg-drq-primary rounded-full transition-all" style={{ width: `${sessionContext?.mastery || 68}%` }} />
          </div>
          <p className="text-[10px] font-bold text-white/40">{sessionContext?.questionsToday || 12} questions answered today</p>
        </div>
      </div>
    </aside>
  );
}
