"use client";

import React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { InstallPWA } from "./InstallPWA";
import {
  HomeIcon, BookOpenIcon, UserGroupIcon,
  ClipboardDocumentListIcon, Cog6ToothIcon, ChevronDoubleRightIcon,
  BookmarkIcon,
} from "@heroicons/react/24/outline";
import {
  Plus, MagnifyingGlass, Sun, Moon, ChatCircle, List, Clock, ChatDots,
  Book, Robot,
} from "@phosphor-icons/react";

const THREAD_TABS = [
  { id: "recent", label: "Recent", icon: Clock },
  { id: "pinned", label: "Starred", icon: ChatDots },
  { id: "all", label: "All Chats", icon: List },
];

type Props = {
  showSidebar: boolean;
  onClose: () => void;
  desktop?: boolean;
  isDark: boolean;
  siteName: string;
  logoUrl: string | null;
  filteredThreads: { id: string; title: string | null }[];
  activeThreadId: string | null;
  onSwitchThread: (id: string) => void;
  onNewThread: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onThemeToggle: () => void;
  onOpenConfig: () => void;
  onOpenSaved: () => void;
  onOpenLibrary: () => void;
  onOpenAgentGallery: () => void;
};

function MobileSidebarInner({
  showSidebar,
  onClose,
  desktop,
  isDark,
  siteName,
  logoUrl,
  filteredThreads,
  activeThreadId,
  onSwitchThread,
  onNewThread,
  searchQuery,
  onSearchChange,
  activeTab,
  onTabChange,
  onThemeToggle,
  onOpenConfig,
  onOpenSaved,
  onOpenLibrary,
  onOpenAgentGallery,
}: Props) {
  const content = (
    <>
      {/* Sidebar Header */}
      <div className={cn("flex items-center justify-between px-4 py-3 border-b transition-colors duration-200 ease-out", isDark ? "border-white/10" : "border-gray-200")}>
        <div className="flex items-center">
          {logoUrl ? (
            <img src={logoUrl} alt={siteName} className={cn("h-7 w-7 object-contain", isDark ? "brightness-0 invert opacity-60" : "brightness-0 opacity-40")} />
          ) : (
            <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold", isDark ? "bg-white/10 text-white" : "bg-gray-100 text-gray-900")}>
              {siteName?.charAt(0) || "M"}
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className={cn("p-1.5 rounded-lg transition-colors", isDark ? "text-gray-400 hover:bg-white/10" : "text-gray-500 hover:bg-gray-100")}
        >
          <ChevronDoubleRightIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* ─── Navigation Section ─── */}
        <div className="p-3">
          <p className={cn("text-[10px] font-bold uppercase tracking-widest px-3 mb-2", isDark ? "text-gray-500" : "text-gray-400")}>Navigation</p>
          <div className="space-y-0.5">
            {[
              { icon: HomeIcon, label: "Home", href: "/dashboard-app" },
              { icon: BookOpenIcon, label: "Modules", href: "/modules" },
              { icon: UserGroupIcon, label: "Social", href: "/social" },
              { icon: ClipboardDocumentListIcon, label: "Quizzes", href: "/quiz" },
              { icon: BookmarkIcon, label: "Saved", href: null, action: onOpenSaved },
              { icon: null, label: "Library", href: null, action: onOpenLibrary, customIcon: Book },
              { icon: null, label: "Custom MedOneX", href: null, action: onOpenAgentGallery, customIcon: Robot },
            ].map((item: any) => (
              item.href ? (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                    isDark ? "text-gray-300 hover:bg-white/10" : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", isDark ? "text-gray-400" : "text-gray-500")} />
                  {item.label}
                </Link>
              ) : (
                <button
                  key={item.label}
                  onClick={() => { onClose(); item.action?.(); }}
                  className={cn(
                    "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                    isDark ? "text-gray-300 hover:bg-white/10" : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  {item.customIcon ? (
                    <item.customIcon size={20} weight="regular" className={cn("flex-shrink-0", isDark ? "text-gray-400" : "text-gray-500")} />
                  ) : (
                    <item.icon className={cn("w-5 h-5", isDark ? "text-gray-400" : "text-gray-500")} />
                  )}
                  {item.label}
                </button>
              )
            ))}
          </div>
        </div>

        <div className={cn("mx-4 my-1 h-px transition-colors duration-200 ease-out", isDark ? "bg-white/10" : "bg-gray-200")} />

        {/* ─── Chats Section ─── */}
        <div className="p-3">
          <p className={cn("text-[10px] font-bold uppercase tracking-widest px-3 mb-2", isDark ? "text-gray-500" : "text-gray-400")}>Chats</p>
          <div className={cn("flex items-center gap-0.5 p-0.5 rounded-xl mb-3 transition-colors duration-200 ease-out", isDark ? "bg-white/5" : "bg-gray-100")}>
            {THREAD_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-[10px] text-xs font-medium transition-all duration-200 flex-1",
                  activeTab === tab.id
                    ? isDark ? "bg-white/10 text-white shadow-sm" : "bg-white text-gray-900 shadow-sm"
                    : isDark ? "text-white/40 hover:text-white/70" : "text-gray-400 hover:text-gray-700"
                )}
              >
                <tab.icon size={14} weight="regular" />
                {tab.label}
              </button>
            ))}
          </div>
          <div className="relative mb-3">
            <MagnifyingGlass size={14} className={cn("absolute left-3 top-1/2 -translate-y-1/2", isDark ? "text-gray-500" : "text-gray-400")} />
            <input
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Search conversations..."
              className={cn(
                "w-full rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none transition-colors duration-200 ease-out",
                isDark ? "bg-white/5 text-white placeholder-gray-500 border border-white/10" : "bg-gray-50 text-gray-900 placeholder-gray-400 border border-gray-200"
              )}
            />
          </div>
          <div className="space-y-0.5 max-h-[200px] overflow-y-auto no-scrollbar">
            {filteredThreads.length === 0 ? (
              <div className={cn("text-xs text-center py-8", isDark ? "text-gray-500" : "text-gray-400")}>No conversations</div>
            ) : (
              filteredThreads.map(t => (
                <button
                  key={t.id}
                  onClick={() => { onSwitchThread(t.id); if (!desktop) onClose(); }}
                  className={cn(
                    "w-full text-start px-3 py-2.5 rounded-xl text-sm transition-all duration-200",
                    t.id === activeThreadId
                      ? isDark ? "bg-indigo-500/10 text-indigo-400" : "bg-indigo-50 text-indigo-600"
                      : isDark ? "text-gray-300 hover:bg-white/5" : "text-gray-700 hover:bg-gray-50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <ChatCircle size={14} weight="regular" className={cn("flex-shrink-0", isDark ? "text-white" : "text-gray-900")} />
                    <span className="truncate">{t.title || "New Chat"}</span>
                  </div>
                </button>
              ))
            )}
          </div>
          <button
            onClick={() => { onNewThread(); if (!desktop) onClose(); }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium mt-2 transition-all duration-200",
              isDark ? "text-gray-300 hover:bg-white/10" : "text-gray-700 hover:bg-gray-100"
            )}
          >
            <Plus size={16} weight="regular" className={cn(isDark ? "text-white" : "text-gray-900")} />
            New Chat
          </button>
        </div>
      </div>

      {/* ─── Settings at Bottom ─── */}
      <div className={cn("border-t p-3 space-y-1 transition-colors duration-200 ease-out", isDark ? "border-white/10" : "border-gray-200")}>
        <button
          onClick={onThemeToggle}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full transition-all duration-200",
            isDark ? "text-gray-300 hover:bg-white/10" : "text-gray-700 hover:bg-gray-100"
          )}
        >
          {isDark ? <Sun size={18} className="text-gray-400" /> : <Moon size={18} className="text-gray-500" />}
          {isDark ? "Light Mode" : "Dark Mode"}
        </button>
        <button
          onClick={() => { onOpenConfig(); if (!desktop) onClose(); }}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full transition-all duration-200",
            isDark ? "text-gray-300 hover:bg-white/10" : "text-gray-700 hover:bg-gray-100"
          )}
        >
          <Cog6ToothIcon className={cn("w-5 h-5", isDark ? "text-gray-400" : "text-gray-500")} />
          Settings
        </button>
        <InstallPWA isDark={isDark} />
      </div>
    </>
  );

  if (desktop) {
    return (
      <div className={cn(
        "w-[260px] min-w-[260px] h-full min-h-0 flex flex-col overflow-hidden transition-colors duration-200 ease-out",
        isDark ? "bg-[#0a0a0a] border-r border-white/[0.06]" : "bg-[#F9F9F9] border-r border-gray-200/60"
      )}>
        {content}
      </div>
    );
  }

  return (
    <AnimatePresence>
      {showSidebar && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10010] bg-black/40 md:hidden"
          onClick={onClose}
        >
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "absolute left-0 top-0 bottom-0 w-[85vw] max-w-[85vw] flex flex-col shadow-[4px_0_32px_rgba(0,0,0,0.4)] transition-colors duration-200 ease-out",
              isDark ? "bg-[#0a0a0a] border-r border-white/[0.06]" : "bg-[#F9F9F9] border-r border-gray-200/60"
            )}
            style={{ willChange: "transform" }}
          >
            {/* Extending top edge */}
            <div className={cn(
              "absolute top-0 right-0 h-px pointer-events-none",
              isDark ? "bg-gradient-to-r from-white/10 to-transparent" : "bg-gradient-to-r from-gray-200 to-transparent"
            )} style={{ width: "15vw" }} />
            {/* Extending bottom edge */}
            <div className={cn(
              "absolute bottom-0 right-0 h-px pointer-events-none",
              isDark ? "bg-gradient-to-r from-white/10 to-transparent" : "bg-gradient-to-r from-gray-200 to-transparent"
            )} style={{ width: "15vw" }} />
            {content}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export const MobileChatSidebar = React.memo(MobileSidebarInner);
