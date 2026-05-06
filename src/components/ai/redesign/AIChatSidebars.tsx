"use client";

import { MessageSquare, Clock, Plus, Zap, BookOpen, ScrollText, LayoutDashboard, Book, Target, Video, Users, Check, RefreshCw, Settings } from "lucide-react";
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
    <aside className="hidden lg:flex w-[220px] flex-col border-r border-drq-border bg-drq-panel fixed inset-y-0 left-0 py-6 px-4">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8 px-2">
         <div className="h-8 w-8 rounded-[10px] grad-1 flex items-center justify-center text-white font-bold text-base">M</div>
         <span className="font-syne text-[20px] font-bold text-white">MedOneX</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 mb-8">
        {[
          { name: "Dashboard", icon: <LayoutDashboard className="w-[18px] h-[18px]" /> },
          { name: "Lectures", icon: <Book className="w-[18px] h-[18px]" /> },
          { name: "Study Tools", icon: <Target className="w-[18px] h-[18px]" /> },
          { name: "Quizzes", icon: <Zap className="w-[18px] h-[18px]" />, badge: 12 },
          { name: "Videos", icon: <Video className="w-[18px] h-[18px]" /> },
          { name: "Community", icon: <Users className="w-[18px] h-[18px]" /> },
          { name: "Dr. Q Coach", icon: <MessageSquare className="w-[18px] h-[18px]" />, active: true }
        ].map(item => (
          <button
            key={item.name}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all w-full",
              item.active 
                ? "bg-drq-surface text-drq-secondary" 
                : "text-drq-secondary hover:bg-drq-surface hover:text-white"
            )}
          >
            {item.icon}
            <span>{item.name}</span>
            {item.badge && (
              <span className="ml-auto bg-drq-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="text-[11px] font-bold text-drq-secondary uppercase tracking-widest ml-3 mb-3">Past Topics</div>

      {/* Past Topics */}
      <div className="flex-1 min-h-0 flex flex-col gap-[2px] overflow-y-auto scrollbar-thin scrollbar-thumb-drq-border scrollbar-track-transparent">
        {threads.map(t => (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            className={cn(
              "text-left px-3 py-2 rounded-lg text-[13px] truncate transition-all",
              t.id === activeId 
                ? "bg-drq-surface text-white" 
                : "text-drq-secondary hover:bg-drq-surface hover:text-white"
            )}
          >
            {t.title}
          </button>
        ))}
      </div>

      <button
        onClick={onNew}
        className="flex items-center justify-center gap-2 p-3 mt-4 w-full border border-dashed border-white/20 rounded-lg text-[14px] font-medium text-white transition-all hover:border-drq-primary hover:text-drq-primary hover:bg-drq-primary/5"
      >
        <Plus className="w-4 h-4" /> New conversation
      </button>

      {/* User Row */}
      <div className="mt-6 p-3 bg-drq-surface rounded-xl flex items-center gap-3">
         <div className="h-9 w-9 rounded-full bg-drq-elevated flex items-center justify-center text-white font-bold">
           {user?.name?.[0] || "A"}
         </div>
         <div className="min-w-0 flex-1">
           <p className="text-[14px] font-bold text-white truncate">{user?.name || "Ahmed Hassan"}</p>
           <p className="text-[10px] font-bold text-drq-secondary uppercase tracking-[0.5px]">
             {user?.rank || "Elite Plan"}
           </p>
         </div>
         <button className="text-drq-secondary hover:text-white transition-colors">
           <Settings className="w-4 h-4" />
         </button>
      </div>
    </aside>
  );
}

export function RightSidebar({ 
  sessionContext, 
  activeAgent,
  onOpenAgentModal,
  onQuickAction
}: { 
  sessionContext?: any;
  activeAgent?: any;
  onOpenAgentModal?: () => void;
  onQuickAction?: (text: string) => void;
}) {
  return (
    <aside className="hidden xl:flex w-[260px] flex-col gap-6 fixed inset-y-0 right-0 p-6 bg-drq-panel border-l border-drq-border overflow-y-auto scrollbar-thin scrollbar-thumb-drq-border scrollbar-track-transparent">
      
      {/* Session Context */}
      <div className="flex flex-col gap-3">
        <h3 className="text-[11px] font-bold text-drq-secondary uppercase tracking-widest">Session Context</h3>
        <div className="bg-drq-surface border border-drq-border rounded-xl p-4">
          <div className="text-[12px] font-bold text-drq-primary mb-1">{sessionContext?.subject || "CNS / PHYSIO"}</div>
          <div className="text-[14px] font-medium text-white">{sessionContext?.lastLecture || "Synaptic Transmission"}</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-col gap-3">
        <h3 className="text-[11px] font-bold text-drq-secondary uppercase tracking-widest">Quick Actions</h3>
        {[
          { text: "Start a quiz on this topic", icon: <Target className="w-5 h-5" /> },
          { text: "Summarize the key points of this lecture", icon: <BookOpen className="w-5 h-5" /> },
          { text: "Create 5 flashcards for this topic", icon: <Zap className="w-5 h-5" /> },
          { text: "What are the core concepts here?", icon: <MessageSquare className="w-5 h-5" /> }
        ].map(action => (
          <button
            key={action.text}
            onClick={() => onQuickAction?.(action.text)}
            className="flex items-center gap-3 w-full p-3 bg-drq-surface border border-drq-border rounded-[10px] text-[13px] font-medium text-left text-white transition-all hover:bg-drq-elevated hover:border-drq-primary hover:text-drq-primary"
          >
            {action.icon}
            <span className="truncate">{action.text.replace(" on this topic", "").replace(" for this topic", "")}</span>
          </button>
        ))}
      </div>

      {/* Active Agent Display */}
      <div className="flex flex-col gap-3">
        <h3 className="text-[11px] font-bold text-drq-secondary uppercase tracking-widest">Active Agent</h3>
        <div className="bg-drq-surface border border-drq-primary rounded-xl p-3 flex items-center gap-3 relative">
          <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-base", activeAgent?.gradClass || "grad-1")}>
            {activeAgent?.icon || "🧠"}
          </div>
          <div>
            <div className="text-[14px] font-bold text-white leading-tight">{activeAgent?.name || "Dr. Q Coach"}</div>
            <div className="text-[10px] font-bold text-drq-secondary uppercase tracking-[0.5px] mt-0.5">{activeAgent?.subtitle || "Full Medical Tutor"}</div>
          </div>
          <Check className="absolute top-2 right-2 w-4 h-4 text-drq-primary" />
        </div>
        <button 
          onClick={onOpenAgentModal}
          className="w-full p-2.5 border border-dashed border-white/20 rounded-lg text-[12px] font-medium text-center text-white transition-all hover:border-white hover:bg-drq-surface"
        >
          Switch to another agent
        </button>
      </div>

      {/* Progress Card */}
      <div className="flex flex-col gap-3">
        <h3 className="text-[11px] font-bold text-drq-secondary uppercase tracking-widest">Your Progress</h3>
        <div className="bg-drq-surface border border-drq-border rounded-xl p-4">
          <div className="font-syne text-[32px] font-extrabold text-white leading-none mb-3">{sessionContext?.mastery || 68}%</div>
          <div className="h-1.5 bg-drq-elevated rounded-full overflow-hidden mb-4">
            <div className="h-full w-[68%] grad-1 rounded-full" />
          </div>
          <div className="flex justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-drq-secondary font-bold uppercase">Correct</span>
              <span className="text-[14px] font-bold text-drq-secondary">{sessionContext?.questionsToday ? sessionContext.questionsToday - 4 : 42}</span>
            </div>
            <div className="flex flex-col gap-0.5 text-right">
              <span className="text-[10px] text-drq-secondary font-bold uppercase">Wrong</span>
              <span className="text-[14px] font-bold text-[#FF6B6B]">14</span>
            </div>
          </div>
        </div>
      </div>

      {/* Customize Toggles */}
      <div className="flex flex-col gap-3">
        <h3 className="text-[11px] font-bold text-drq-secondary uppercase tracking-widest">Customize</h3>
        <div className="flex flex-col gap-1">
          {[
            { label: "Typing indicators", defaultActive: true },
            { label: "Sound effects", defaultActive: true },
            { label: "Compact mode", defaultActive: false },
            { label: "Arabic first", defaultActive: false }
          ].map((toggle, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <span className="text-[13px] font-medium text-white">{toggle.label}</span>
              <div className={cn("w-9 h-5 rounded-full relative cursor-pointer transition-all", toggle.defaultActive ? "bg-drq-primary" : "bg-drq-elevated")}>
                <div className={cn("absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-all", toggle.defaultActive ? "translate-x-4" : "")} />
              </div>
            </div>
          ))}
        </div>
      </div>

    </aside>
  );
}
