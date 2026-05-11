"use client";

import React, { useState, useRef, useEffect } from "react";
import { useDrQChat, PROVIDER_CONFIGS, FileAttachment } from "@/hooks/useDrQChat";
import { 
  Plus, 
  Sparkle, 
  ShieldCheck, 
  Lightning, 
  DotsThreeVertical,
  Trash,
  Export,
  Gear,
  ChatCircle,
  X,
  List,
  ShareNetwork,
  CaretDown,
  Image as ImageIcon,
  FileText,
  CheckCircle
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { DrQSidebar } from "./DrQSidebar";
import { DrQConfigPanel } from "./DrQConfigPanel";
import { DrQComposer } from "./DrQComposer";
import { DrQMessage } from "./DrQMessage";
import { DRQ_PERSONAS, DrQPersonaId } from "./DrQPersonas";
import toast from "react-hot-toast";

const GLASS = "bg-white/[0.03] dark:bg-[#11101d]/60 backdrop-blur-3xl border border-white/10";

export function DrQChat() {
  const {
    threads,
    activeThread,
    activeThreadId,
    messages,
    loading,
    streamingId,
    settings,
    limits,
    newThread,
    switchThread,
    deleteThread,
    renameThread,
    clearThread,
    sendMessage,
    stopGeneration,
    regenerate,
    setReaction,
    updateSettings,
    exportThread
  } = useDrQChat();

  const [input, setInput] = useState("");
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [showConfig, setShowConfig] = useState(false);
  const [replyContext, setReplyContext] = useState<{ id: string; text: string } | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  
  const endRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages or streaming
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingId]);

  const handleShareToForum = (text: string) => {
    // Implement sharing logic - maybe copy to composer of social feed
    navigator.clipboard.writeText(text);
    toast.success("Content copied! You can now paste it in the Discuss Forum.");
  };

  return (
    <div className="flex h-[calc(100vh-80px)] w-full overflow-hidden bg-[#0a0910] text-white">
      
      {/* ── SIDEBAR ── */}
      <div className="hidden md:block h-full">
        <DrQSidebar 
          threads={threads}
          activeThreadId={activeThreadId}
          onNewThread={newThread}
          onSwitchThread={switchThread}
          onDeleteThread={deleteThread}
          onRenameThread={renameThread}
          onShowConfig={() => setShowConfig(true)}
          onExport={exportThread}
        />
      </div>

      {/* ── MAIN CHAT AREA ── */}
      <main className="flex-1 flex flex-col relative min-w-0 bg-[#0f0e1a]">
        
        {/* Softened Deep Purple Gradient Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(88,28,135,0.08)_0%,rgba(10,9,16,0)_70%)]" />
           <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-purple-600/05 rounded-full blur-[120px] animate-pulse" />
           <div className="absolute bottom-[10%] right-[20%] w-[400px] h-[400px] bg-blue-600/03 rounded-full blur-[100px] animate-pulse [animation-delay:2s]" />
        </div>

        {/* Top Navigation / Header */}
        <header className="h-20 flex items-center justify-between px-8 relative z-30">
          <div className="flex items-center gap-6 overflow-x-auto no-scrollbar max-w-[70%]">
            <button 
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 hover:bg-white/5 rounded-xl text-white/50 flex-shrink-0"
            >
              <List size={24} weight="bold" />
            </button>
            
            {/* Persona Selector (Image 1/2 Match) */}
            <div className="flex items-center gap-2 p-1.5 rounded-full bg-white/[0.03] border border-white/5 backdrop-blur-xl">
               {(Object.values(DRQ_PERSONAS)).map((p) => (
                 <button
                   key={p.id}
                   onClick={() => updateSettings({ activePersona: p.id })}
                   className={cn(
                     "px-4 py-2 rounded-full text-[12px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap",
                     settings.activePersona === p.id 
                       ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)] scale-105" 
                       : "text-white/40 hover:text-white/60"
                   )}
                 >
                   <span className={cn(settings.activePersona === p.id ? "text-black" : "text-white/30")}>
                      {React.cloneElement(p.icon as React.ReactElement, { size: 16 })}
                   </span>
                   {p.shortName}
                 </button>
               ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
             {/* Provider & Configuration */}
             <div className="hidden lg:flex items-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-4 py-2.5 gap-3 transition-all cursor-pointer group" onClick={() => setShowConfig(true)}>
                <span className="text-[12px] font-black uppercase tracking-widest text-white/40 group-hover:text-white">{PROVIDER_CONFIGS[settings.activeProvider].label}</span>
                <Gear size={16} weight="bold" className="text-white/20" />
             </div>
             
             <button 
               onClick={() => exportThread("markdown")}
               className="h-11 w-11 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all border border-white/10"
               title="Export Chat"
             >
               <Export size={20} weight="bold" />
             </button>
          </div>
        </header>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto no-scrollbar relative z-10">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center max-w-4xl mx-auto">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative mb-12"
              >
                {/* The Orb from image */}
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-400 via-pink-500 to-indigo-600 blur-[2px] shadow-[0_0_50px_rgba(168,85,247,0.5)] animate-bounce duration-[3000ms]" />
                <div className="absolute inset-0 w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm border border-white/30" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white/80 rounded-full blur-[4px]" />
              </motion.div>

              <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 text-white">
                Experience Dr. Q Overhaul
              </h2>
              <p className="text-white/40 text-[15px] font-medium mb-12 max-w-lg">
                 Choose a specialized AI persona to help you master your medical journey.
              </p>
              
              {/* Persona Grid (Image 1 Match) */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 w-full max-w-4xl mx-auto">
                 {(Object.values(DRQ_PERSONAS)).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        updateSettings({ activePersona: p.id });
                        // Optionally trigger a suggested prompt or just show selection
                        toast.success(`${p.name} activated`);
                      }}
                      className={cn(
                        "p-6 rounded-[32px] bg-white/[0.03] border border-white/10 text-left group hover:bg-white/[0.08] transition-all relative overflow-hidden",
                        settings.activePersona === p.id && "bg-white/[0.08] border-white/20 ring-2 ring-primary/30"
                      )}
                    >
                       <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 blur-[40px] -translate-y-1/2 translate-x-1/2" />
                       <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-lg", `bg-gradient-to-br ${p.gradient}`)}>
                          {React.cloneElement(p.icon as React.ReactElement, { size: 24, weight: "fill", className: "text-white" })}
                       </div>
                       <h3 className="text-[17px] font-black mb-2 text-white">{p.name}</h3>
                       <p className="text-[12px] text-white/40 leading-relaxed font-medium">{p.description}</p>
                    </button>
                 ))}
              </div>

              {/* Bottom Suggestions */}
              <div className="mt-12 flex flex-wrap justify-center gap-2">
                 {DRQ_PERSONAS[settings.activePersona as DrQPersonaId]?.suggestedPrompts.map((txt, i) => (
                    <button 
                      key={i}
                      onClick={() => sendMessage(txt)}
                      className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-[12px] font-bold text-white/50 hover:bg-white/10 hover:text-white transition-all"
                    >
                       {txt}
                    </button>
                 ))}
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto px-4 md:px-6 py-10 space-y-10">
              {messages.map((m) => (
                <DrQMessage 
                  key={m.id}
                  message={m}
                  fontSize={settings.fontSize}
                  userBubbleColor={settings.userBubbleColor}
                  aiBubbleColor={settings.aiBubbleColor}
                  onReaction={setReaction}
                  onRegenerate={m.role === 'assistant' ? regenerate : undefined}
                  onReply={(id, text) => setReplyContext({ id, text })}
                  onShare={handleShareToForum}
                  activePersona={settings.activePersona}
                />
              ))}
              <div ref={endRef} className="h-32" />
            </div>
          )}
        </div>

        {/* Composer Bar */}
        <div className="relative z-20 pb-4">
           <DrQComposer 
             input={input}
             setInput={setInput}
             files={files}
             setFiles={setFiles}
             onSend={sendMessage}
             onStop={stopGeneration}
             loading={loading}
             activeProvider={settings.activeProvider}
             onProviderChange={(p) => updateSettings({ activeProvider: p, activeModel: PROVIDER_CONFIGS[p].defaultModel })}
             replyContext={replyContext}
             onClearReply={() => setReplyContext(null)}
             smartEngineEnabled={settings.smartEngineEnabled}
             onToggleSmartEngine={() => updateSettings({ smartEngineEnabled: !settings.smartEngineEnabled })}
           />
        </div>
      </main>

      {/* ── CONFIG PANEL (DRAWER) ── */}
      <DrQConfigPanel 
        isOpen={showConfig}
        onClose={() => setShowConfig(false)}
        settings={settings}
        onUpdate={updateSettings}
      />

      {/* ── MOBILE SIDEBAR DRAWER (Image 4 Match) ── */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] md:hidden"
            />
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-full max-w-[320px] bg-[#161523] border-r border-white/5 shadow-2xl z-[101] flex flex-col md:hidden"
            >
              <div className="p-4 flex items-center justify-between border-b border-white/5 mt-4">
                <span className="text-[16px] font-bold text-white tracking-tight">All conversations</span>
                <button onClick={() => setMobileSidebarOpen(false)} className="p-2 hover:bg-white/5 rounded-xl text-white/50">
                  <X size={20} weight="bold" />
                </button>
              </div>
              
              <div className="p-4">
                <div className="relative">
                  <input type="text" placeholder="Search..." className="w-full bg-black/40 border border-white/5 rounded-xl px-10 py-3 text-[14px] text-white placeholder:text-white/30 outline-none focus:border-purple-500/50" />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-white/30 flex items-center justify-center"><div className="w-1.5 h-1.5 bg-white/30 rounded-full" /></div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-6">
                
                {/* Custom AI Assistants (Providers) */}
                <div>
                   <h4 className="text-[11px] font-bold text-white/40 mb-3 pl-1">Custom AI Assistants</h4>
                   <div className="space-y-1">
                      {Object.entries(PROVIDER_CONFIGS).map(([key, config]) => (
                        <button key={key} onClick={() => { updateSettings({ activeProvider: key as any }); setMobileSidebarOpen(false); }} className="w-full flex items-center gap-4 p-2 rounded-2xl hover:bg-white/5 transition-all text-left group">
                          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white/70 group-hover:scale-110 group-hover:bg-purple-500 group-hover:text-white transition-all shadow-sm">
                             {config.icon}
                          </div>
                          <div className="flex flex-col flex-1">
                             <div className="flex items-center gap-1.5">
                               <span className="text-[15px] font-bold text-white">{config.label}</span>
                               <CheckCircle size={14} weight="fill" className="text-emerald-500" />
                             </div>
                             <span className="text-[12px] text-white/40 truncate">Connect to ecosystem</span>
                          </div>
                        </button>
                      ))}
                   </div>
                </div>

                {/* Previous 7 Days */}
                <div>
                   <h4 className="text-[11px] font-bold text-white/40 mb-3 pl-1">Previous 7 Days</h4>
                   <div className="space-y-1">
                      {threads.map(t => (
                        <button key={t.id} onClick={() => { switchThread(t.id); setMobileSidebarOpen(false); }} className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 transition-all text-left group">
                          <div className="flex items-center gap-3 min-w-0">
                             <ChatCircle size={20} className="text-white/30 flex-shrink-0 group-hover:text-purple-400" />
                             <span className="text-[15px] font-medium text-white/70 group-hover:text-white truncate">{t.title}</span>
                          </div>
                          <span className="text-[12px] text-white/20 whitespace-nowrap ml-2">Shared &gt;</span>
                        </button>
                      ))}
                   </div>
                </div>
              </div>

              {/* Bottom Profile Area */}
              <div className="p-4 border-t border-white/5 flex items-center justify-between bg-black/20 pb-8">
                 <div className="flex items-center gap-3">
                    <div className="relative">
                       <img src="/avatars/default.png" alt="User" className="w-10 h-10 rounded-full border-2 border-white/10" onError={(e) => { e.currentTarget.src = "https://ui-avatars.com/api/?name=User&background=random"; }} />
                       <div className="absolute -top-1 -right-2 bg-white text-black text-[9px] font-black px-1.5 py-0.5 rounded-full border border-[#161523]">Pro</div>
                    </div>
                    <div className="flex flex-col ml-1">
                       <span className="text-[14px] font-bold text-white">Student</span>
                       <span className="text-[11px] text-white/40">Premium Account</span>
                    </div>
                 </div>
                 <button onClick={() => { newThread(); setMobileSidebarOpen(false); }} className="flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-full font-bold text-[14px] hover:scale-105 active:scale-95 transition-all">
                    <Plus size={16} weight="bold" />
                    New chat
                 </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
