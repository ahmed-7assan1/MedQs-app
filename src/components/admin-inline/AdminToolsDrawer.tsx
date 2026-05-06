"use client";

import { ReactNode, useState } from "react";
import { Shield, ChevronDown, ChevronUp } from "lucide-react";

export function AdminToolsDrawer({ title = "Doctor tools", children }: { title?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-8 border border-blue-500/20 bg-blue-500/5 dark:bg-blue-500/10 rounded-2xl overflow-hidden transition-all duration-300">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-xl">
            <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900 dark:text-white font-outfit">{title}</h3>
            <p className="text-xs text-gray-500">Manage content, generate quizzes, and edit AI settings</p>
          </div>
        </div>
        <div className="p-2 rounded-full bg-black/5 dark:bg-white/5 text-gray-500">
          {open ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      {open && (
        <div className="px-6 py-6 border-t border-blue-500/10 animate-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  );
}
