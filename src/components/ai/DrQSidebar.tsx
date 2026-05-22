"use client";

import React from "react";
import { 
  Plus, 
  ChatCircle, 
  Gear, 
  Export, 
  Trash, 
  CaretLeft,
  CaretRight,
  DotsThreeVertical,
  PencilSimple
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Thread } from "@/hooks/useDrQChat";
import { motion, AnimatePresence } from "framer-motion";

interface SidebarProps {
  threads: Thread[];
  activeThreadId: string | null;
  onNewThread: () => void;
  onSwitchThread: (id: string) => void;
  onDeleteThread: (id: string) => void;
  onRenameThread: (id: string, title: string) => void;
  onShowConfig: () => void;
  onExport: (format: "markdown" | "json" | "txt") => void;
}

export function DrQSidebar({
  threads,
  activeThreadId,
  onNewThread,
  onSwitchThread,
  onDeleteThread,
  onRenameThread,
  onShowConfig,
  onExport
}: SidebarProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editTitle, setEditTitle] = React.useState("");

  const handleRename = (id: string) => {
    if (editTitle.trim()) {
      onRenameThread(id, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <div 
      className={cn(
        "h-full flex flex-col bg-white/80 dark:bg-[#0d0c16]/80 backdrop-blur-3xl border-r border-slate-200/50 dark:border-white/5 transition-all duration-500 relative z-40 group/sidebar w-16 hover:w-72 shadow-lg shadow-slate-200/20 dark:shadow-none"
      )}
    >
      {/* Top Section */}
      <div className="p-3 flex flex-col gap-4 mt-2">
        <button 
          onClick={onNewThread}
          className="flex items-center gap-3 h-10 w-full rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20 hover:scale-[1.05] active:scale-95 transition-all overflow-hidden px-0 justify-center group-hover/sidebar:px-4 group-hover/sidebar:justify-start"
          title="New Chat"
        >
          <Plus size={20} weight="bold" className="flex-shrink-0" />
          <span className="text-[12px] font-black uppercase tracking-widest whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300">
            New Chat
          </span>
        </button>
      </div>

      {/* Threads List */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-2 flex flex-col gap-2 py-4">
        {threads.map((thread) => (
          <div key={thread.id} className="relative group">
            <button
              onClick={() => onSwitchThread(thread.id)}
              className={cn(
                "w-full flex items-center gap-3 h-11 rounded-xl transition-all relative overflow-hidden group justify-center group-hover/sidebar:justify-start group-hover/sidebar:px-3",
                activeThreadId === thread.id 
                  ? "bg-indigo-50 dark:bg-white/10 text-indigo-600 dark:text-white border border-indigo-200 dark:border-white/10 shadow-sm" 
                  : "text-slate-500 dark:text-white/40 hover:text-indigo-600 dark:hover:text-white/70 hover:bg-slate-50 dark:hover:bg-white/5"
              )}
            >
              <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center">
                <ChatCircle size={20} weight={activeThreadId === thread.id ? "fill" : "bold"} />
              </div>
              
              <div className="flex-1 text-left min-w-0 pr-2 opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300">
                {editingId === thread.id ? (
                  <input 
                    autoFocus
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={() => handleRename(thread.id)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRename(thread.id)}
                    className="w-full bg-slate-100 dark:bg-black/40 border border-indigo-500/50 rounded px-1.5 py-0.5 text-[12px] outline-none text-slate-800 dark:text-white"
                  />
                ) : (
                  <span className="text-[13px] font-bold truncate block">
                    {thread.title}
                  </span>
                )}
              </div>

              {/* Thread Actions (Visible on sidebar hover) */}
              {activeThreadId === thread.id && editingId !== thread.id && (
                <div className="absolute right-2 flex items-center gap-1 opacity-0 group-hover/sidebar:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setEditingId(thread.id); setEditTitle(thread.title); }}
                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg text-slate-400 dark:text-white/40 hover:text-indigo-600 dark:hover:text-white"
                  >
                    <PencilSimple size={14} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteThread(thread.id); }}
                    className="p-1.5 hover:bg-rose-100 dark:hover:bg-red-500/20 rounded-lg text-slate-400 dark:text-white/40 hover:text-rose-600 dark:hover:text-red-400"
                  >
                    <Trash size={14} />
                  </button>
                </div>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Bottom Section */}
      <div className="p-3 border-t border-slate-200/50 dark:border-white/5 flex flex-col gap-2">
        <button 
          onClick={onShowConfig}
          className="flex items-center gap-3 h-11 rounded-xl text-slate-500 dark:text-white/50 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-all justify-center group-hover/sidebar:justify-start group-hover/sidebar:px-4"
          title="Configuration"
        >
          <Gear size={20} weight="bold" className="flex-shrink-0" />
          <span className="text-[13px] font-bold whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300">Settings</span>
        </button>

        <div className="relative group/export">
          <button 
            className="w-full flex items-center gap-3 h-11 rounded-xl text-slate-500 dark:text-white/50 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-all justify-center group-hover/sidebar:justify-start group-hover/sidebar:px-4"
            title="Export"
          >
            <Export size={20} weight="bold" className="flex-shrink-0" />
            <span className="text-[13px] font-bold whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300">Export Chat</span>
          </button>
          
          {/* Export Dropdown */}
          <div className="absolute bottom-full left-0 mb-2 w-48 bg-white dark:bg-[#1e1d24] border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl invisible group-hover/export:visible opacity-0 group-hover/export:opacity-100 transition-all p-2 z-[60]">
             <button onClick={() => onExport("markdown")} className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 text-[12px] font-bold text-slate-600 dark:text-white/70 hover:text-indigo-600 dark:hover:text-white transition-all flex items-center gap-2">
                Markdown (.md)
             </button>
             <button onClick={() => onExport("json")} className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 text-[12px] font-bold text-slate-600 dark:text-white/70 hover:text-indigo-600 dark:hover:text-white transition-all flex items-center gap-2">
                JSON Data (.json)
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
