"use client";

import React, { useState, useRef, useEffect } from "react";
import { useDrQChat, PROVIDER_CONFIGS, FileAttachment } from "@/hooks/useDrQChat";
import { useAuth } from "@/components/providers/SupabaseAuthProvider";
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
  CheckCircle,
  Stethoscope,
  SquaresFour,
  BookOpen,
  Users,
  CalendarCheck,
  Clock
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { DrQConfigPanel } from "./DrQConfigPanel";
import { DrQComposer } from "./DrQComposer";
import { DrQMessage } from "./DrQMessage";
import { DRQ_PERSONAS, DrQPersonaId } from "./DrQPersonas";
import toast from "react-hot-toast";

// Animated Background Component and Global Premium Dark Custom Rules
const MeshGradient = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
    <style>{`
      @keyframes morph {
        0% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
        50% { border-radius: 30% 60% 70% 30% / 50% 60% 30% 60%; }
        100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
      }
      @keyframes float {
        0% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-15px) rotate(3deg); }
        100% { transform: translateY(0px) rotate(0deg); }
      }
      .morphing-blob {
        animation: morph 8s ease-in-out infinite, float 6s ease-in-out infinite;
        background: linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(20, 184, 166, 0.15) 100%);
        box-shadow: 0 0 60px rgba(6, 182, 212, 0.2), inset 0 0 20px rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(6, 182, 212, 0.25);
      }
      .grid-bg {
        background-size: 32px 32px;
        background-image: linear-gradient(to right, rgba(255, 255, 255, 0.015) 1px, transparent 1px),
                          linear-gradient(to bottom, rgba(255, 255, 255, 0.015) 1px, transparent 1px);
      }
      @media (max-width: 767px) {
        .grid-bg { background-image: none; }
      }
    `}</style>
    <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-cyan-600/5 blur-[120px] rounded-full mix-blend-screen animate-pulse" style={{ animationDuration: '8s' }} />
    <div className="absolute top-[40%] -right-[10%] w-[40%] h-[60%] bg-teal-600/5 blur-[120px] rounded-full mix-blend-screen animate-pulse" style={{ animationDuration: '12s', animationDelay: '1s' }} />
    <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[50%] bg-cyan-800/5 blur-[120px] rounded-full mix-blend-screen animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
  </div>
);

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

  const { user } = useAuth();
  const userName = user?.user_metadata?.name || "Raf";
  const userAvatar = user?.user_metadata?.avatar_url || "";

  const [input, setInput] = useState("");
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [showConfig, setShowConfig] = useState(false);
  const [replyContext, setReplyContext] = useState<{ id: string; text: string } | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showHistorySidebar, setShowHistorySidebar] = useState(true);
  
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: streamingId ? "auto" : "smooth" });
  }, [messages, streamingId]);

  const handleShareToForum = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Content copied! You can now paste it in the Discuss Forum.");
  };

  const activePersonaObj = DRQ_PERSONAS[settings.activePersona as DrQPersonaId] || DRQ_PERSONAS.explainer;

  const navItems = [
    { icon: <SquaresFour size={22} />, label: "Dashboard", href: "/dashboard-app" },
    { icon: <BookOpen size={22} />, label: "Modules", href: "/modules" },
    { icon: <Users size={22} />, label: "Discuss", href: "/social" },
    { icon: <CalendarCheck size={22} />, label: "Taskat", href: "/taskat" },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#09090b] text-white font-sans selection:bg-cyan-500/30">
      
      {/* ── NARROW VERTICAL NAVIGATION SIDEBAR (PLATFORM MAIN) ── */}
      <div className="hidden md:flex w-16 flex-shrink-0 bg-[#09090b] border-r border-white/10 flex-col items-center py-5 justify-between relative z-50">
        
        {/* Top: Branded Cyan Logo Button */}
        <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 group cursor-pointer hover:scale-105 transition-all">
          <Stethoscope size={22} weight="bold" className="text-black" />
          <Sparkle size={10} weight="fill" className="absolute -top-1 -right-1 text-cyan-200 animate-pulse" />
        </div>

        {/* Middle: Main Platform Navigation */}
        <div className="flex flex-col gap-5">
          {navItems.map((item, idx) => (
              <a 
                key={idx}
                href={item.href}
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-white/40 hover:text-cyan-400 hover:bg-white/5 transition-all group relative border border-transparent"
                title={item.label}
              >
              {item.icon}
              {/* Tooltip */}
              <div className="absolute left-14 px-2.5 py-1 rounded bg-[#0d0d12] border border-white/10 text-[10px] font-bold text-white uppercase tracking-wider scale-0 group-hover:scale-100 transition-all origin-left whitespace-nowrap shadow-xl z-50">
                {item.label}
              </div>
            </a>
          ))}

          {/* Separator */}
          <div className="w-8 h-px bg-white/10 my-2 self-center" />

          {/* Toggle History Button */}
          <button 
            onClick={() => setShowHistorySidebar(!showHistorySidebar)}
            className={cn(
              "w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center transition-all group relative border",
              showHistorySidebar 
                ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" 
                : "text-white/40 hover:text-cyan-400 hover:bg-white/5 border-transparent"
            )}
            title="Chat History"
          >
            <Clock size={22} />
            <div className="absolute left-14 px-2.5 py-1 rounded bg-[#0d0d12] border border-white/10 text-[10px] font-bold text-white uppercase tracking-wider scale-0 group-hover:scale-100 transition-all origin-left whitespace-nowrap shadow-xl z-50">
              Chat History
            </div>
          </button>
        </div>

        {/* Bottom: Settings / Help */}
        <div className="flex flex-col gap-4">
              <button 
                onClick={() => setShowConfig(true)}
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-white/40 hover:text-cyan-400 hover:bg-white/5 transition-all group relative border border-transparent"
                title="MedOneX Expert Settings"
              >
                <Gear size={22} />
            <div className="absolute left-14 px-2.5 py-1 rounded bg-[#0d0d12] border border-white/10 text-[10px] font-bold text-white uppercase tracking-wider scale-0 group-hover:scale-100 transition-all origin-left whitespace-nowrap shadow-xl z-50">
              AI Settings
            </div>
          </button>
        </div>

      </div>

      {/* ── COLLAPSIBLE CHAT HISTORY SIDEBAR (DESKTOP) ── */}
      <AnimatePresence>
        {showHistorySidebar && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="hidden md:flex flex-col h-full bg-[#0c0c12] border-r border-white/5 overflow-hidden flex-shrink-0"
          >
            {/* Header */}
            <div className="p-4 flex items-center justify-between border-b border-white/5 h-20">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Conversations</span>
              <button 
                onClick={newThread}
                className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-cyan-400 hover:text-cyan-300 transition-all active:scale-95"
                title="New Chat"
              >
                <Plus size={16} weight="bold" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-1">
              {threads.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-center p-4">
                  <p className="text-xs text-white/20 font-medium">No active chats yet.<br />Click "+" to start!</p>
                </div>
              ) : (
                threads.map(t => (
                  <div 
                    key={t.id} 
                    className={cn(
                      "group w-full flex items-center justify-between p-2.5 rounded-xl transition-all text-left",
                      activeThreadId === t.id 
                        ? "bg-white/5 text-white" 
                        : "text-white/40 hover:text-white/80 hover:bg-white/[0.02]"
                    )}
                  >
                    <button 
                      onClick={() => switchThread(t.id)}
                      className="flex items-center gap-2.5 min-w-0 flex-1 text-left"
                    >
                      <ChatCircle size={15} className={cn("flex-shrink-0", activeThreadId === t.id ? "text-cyan-400" : "text-white/20 group-hover:text-white/40")} />
                      <span className="text-xs font-medium truncate">{t.title || "New Chat"}</span>
                    </button>
                    
                      <button 
                      onClick={(e) => { e.stopPropagation(); deleteThread(t.id); }}
                      className="opacity-0 group-hover:opacity-100 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-white/10 rounded text-white/40 hover:text-red-400 transition-all ml-1"
                      title="Delete conversation"
                    >
                      <Trash size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Bottom active persona status card */}
            <div className="p-4 border-t border-white/5 bg-[#09090b]/50">
              <div className="flex items-center gap-3">
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white shadow-inner", `bg-gradient-to-br ${activePersonaObj.gradient}`)}>
                  {React.cloneElement(activePersonaObj.icon as React.ReactElement, { size: 14, weight: "bold" })}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-bold text-white truncate">MedOneX Expert: {activePersonaObj.name}</span>
                  <span className="text-[10px] text-cyan-400 uppercase tracking-widest font-semibold">{activePersonaObj.shortName}</span>
                </div>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MAIN CHAT AREA ── */}
      <main className="flex-1 flex flex-col relative min-w-0 bg-[#09090b] grid-bg z-10">
        
        <MeshGradient />

        {/* Top Navigation / Header */}
        <header className="h-20 flex items-center justify-between px-6 border-b border-white/10 bg-[#09090b]/50 backdrop-blur-xl relative z-30 shadow-sm">
          <div className="flex items-center gap-4 max-w-[70%]">
            <button 
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2.5 bg-white/5 border border-white/10 rounded-xl text-white/70 shadow-sm hover:shadow-md transition-all active:scale-95"
            >
              <List size={20} weight="bold" />
            </button>
            
            {/* Thread Title or Active Persona Status */}
            <div className="flex items-center gap-3">
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white shadow-inner", `bg-gradient-to-br ${activePersonaObj.gradient}`)}>
                {React.cloneElement(activePersonaObj.icon as React.ReactElement, { size: 14, weight: "bold" })}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-white truncate max-w-[180px] md:max-w-[300px]">
                  {activeThread?.title || "MedOneX Expert"}
                </span>
                <span className="text-[9px] text-cyan-400 font-semibold uppercase tracking-widest leading-none">
                  {activePersonaObj.name}
                </span>
              </div>
            </div>
          </div>

          {/* Right Action Controls: Profile / Settings */}
          <div className="flex items-center gap-3">
             
             {/* Model Indicator */}
             <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 bg-white/5 border border-white/10 rounded-full">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">
                  {PROVIDER_CONFIGS[settings.activeProvider].label}
                </span>
             </div>

             {/* Settings Action Gear */}
             <button 
               onClick={() => setShowConfig(true)}
               className="h-11 w-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all shadow-sm hover:shadow-md group"
               title="AI Configuration"
             >
                <Gear size={18} weight="fill" className="text-white/40 group-hover:text-cyan-400 transition-colors" />
             </button>
             
             {/* Export Action */}
             <button 
               onClick={() => exportThread("markdown")}
               className="h-11 w-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all shadow-sm hover:shadow-md group"
               title="Export Chat"
             >
               <Export size={18} weight="bold" className="text-white/40 group-hover:text-cyan-400 transition-colors" />
             </button>

             {/* Profile Card (Supabase User Profile) */}
             <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-full pl-2.5 pr-3.5 py-1.5 shadow-md ml-1 select-none">
               <img 
                 src={userAvatar || "/avatars/default.png"} 
                 alt="Profile" 
                 className="w-7 h-7 rounded-full border border-cyan-500/30 object-cover flex-shrink-0" 
                 onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=06b6d4&color=000000&bold=true`; }}
               />
               <div className="flex flex-col min-w-0">
                 <span className="text-[11px] font-bold text-white leading-none truncate max-w-[80px]">{userName.split(" ")[0]}</span>
                  <span className="text-[10px] text-cyan-400 font-semibold tracking-wider uppercase leading-none mt-0.5">Student</span>
               </div>
             </div>

          </div>
        </header>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto no-scrollbar relative z-20 scroll-smooth">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-6 md:p-12 text-center max-w-4xl mx-auto z-20">
              
              {/* Luminous floating fluid morphing bubble */}
              <div className="flex flex-col items-center justify-center mb-8 relative">
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <div className="morphing-blob absolute inset-0" />
                  <div className="relative z-10 flex items-center justify-center text-cyan-400">
                    <Sparkle size={44} weight="fill" className="animate-pulse drop-shadow-[0_0_15px_rgba(6,182,212,0.8)]" />
                  </div>
                </div>
              </div>

              {/* Greeting headers */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-10"
              >
                <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-2 text-white">
                  Hey! <span className="text-cyan-400">{userName.split(" ")[0]}</span>
                </h2>
                <h3 className="text-xl md:text-2xl font-bold text-white/50">
                  What can I help with today?
                </h3>
              </motion.div>
              
              {/* Quick Action Grid */}
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl"
              >
                {[
                  {
                    title: "Content Help",
                    desc: "Draft clinical notes, summarize papers, or rewrite lectures.",
                    prompt: "Can you help me summarize this medical article and explain the primary clinical pathways in simple terms?",
                    icon: <FileText size={20} className="text-cyan-400" />
                  },
                  {
                    title: "Suggestions",
                    desc: "Get study guidelines and recommendations for modules.",
                    prompt: "Give me some suggestions on how to study for my upcoming module exams on MedQs.",
                    icon: <Sparkle size={20} className="text-cyan-400" />
                  },
                  {
                    title: "Job Application",
                    desc: "Create resumes, cover letters, or CV revisions.",
                    prompt: "Draft a premium cover letter for a junior resident position at a leading medical university hospital.",
                    icon: <ShieldCheck size={20} className="text-cyan-400" />
                  }
                ].map((action, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInput(action.prompt);
                    }}
                    className="p-5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-cyan-500/20 transition-all duration-300 text-left group flex flex-col justify-between h-36 relative overflow-hidden"
                  >
                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />
                    
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-3">
                      {action.icon}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white mb-1 group-hover:text-cyan-400 transition-colors">{action.title}</h4>
                      <p className="text-[11px] text-white/40 leading-relaxed font-medium">{action.desc}</p>
                    </div>
                  </button>
                ))}
              </motion.div>

              {/* Persona Pill selector for ease of switching */}
              <div className="mt-8 flex flex-wrap justify-center gap-2 max-w-2xl">
                {Object.values(DRQ_PERSONAS).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      updateSettings({ activePersona: p.id });
                      toast.success(`Switched to ${p.name}`);
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-full border text-[10px] font-semibold uppercase tracking-wider transition-all",
                      settings.activePersona === p.id 
                        ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400" 
                        : "bg-white/5 border-white/5 text-white/40 hover:text-white/80 hover:bg-white/10"
                    )}
                  >
                    {p.name}
                  </button>
                ))}
              </div>

            </div>
          ) : (
            <div className="max-w-4xl mx-auto px-4 md:px-6 py-10 pb-40 space-y-10">
              <AnimatePresence initial={false}>
                {messages.map((m) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                  >
                    <DrQMessage 
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
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={endRef} className="h-10" />
            </div>
          )}
        </div>

        {/* Composer Bar */}
        <div className="absolute bottom-0 left-0 w-full z-40 bg-gradient-to-t from-[#09090b] via-[#09090b]/90 to-transparent pt-16 px-4 md:px-8 pointer-events-none" style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom, 0px))" }}>
           <div className="max-w-4xl mx-auto pointer-events-auto">
             <DrQComposer 
               input={input}
               setInput={setInput}
               files={files}
               setFiles={setFiles}
               onSend={sendMessage}
               onStop={stopGeneration}
               loading={loading}
               activeProvider={settings.activeProvider}
                onProviderChange={(p) => updateSettings({ activeProvider: p, activeModels: { ...settings.activeModels, [p]: [PROVIDER_CONFIGS[p].defaultModel] } })}
               replyContext={replyContext}
               onClearReply={() => setReplyContext(null)}
               smartEngineEnabled={settings.smartEngineEnabled}
               onToggleSmartEngine={() => updateSettings({ smartEngineEnabled: !settings.smartEngineEnabled })}
             />
           </div>
        </div>

      </main>

      {/* ── MOBILE SIDEBAR DRAWER ── */}
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
              className="fixed top-0 left-0 bottom-0 w-full max-w-[320px] bg-[#0d0d12] border-r border-white/5 shadow-2xl z-[101] flex flex-col md:hidden"
            >
              <div className="p-4 flex items-center justify-between border-b border-white/5 mt-4">
                <span className="text-[14px] font-bold text-white tracking-tight uppercase tracking-wider">All conversations</span>
                <button onClick={() => setMobileSidebarOpen(false)} className="p-2 hover:bg-white/5 rounded-xl text-white/50">
                  <X size={20} weight="bold" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-6">
                
                {/* Custom AI Assistants (Providers) */}
                <div>
                   <h4 className="text-[10px] font-bold text-white/40 mb-3 pl-1 uppercase tracking-wider">Custom AI Assistants</h4>
                   <div className="space-y-1">
                      {Object.entries(PROVIDER_CONFIGS).map(([key, config]) => (
                        <button key={key} onClick={() => { updateSettings({ activeProvider: key as any }); setMobileSidebarOpen(false); }} className="w-full flex items-center gap-4 p-2.5 rounded-2xl hover:bg-white/5 transition-all text-left group">
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/70 group-hover:scale-105 group-hover:bg-cyan-500 group-hover:text-black transition-all shadow-sm">
                             {config.icon}
                          </div>
                          <div className="flex flex-col flex-1">
                             <div className="flex items-center gap-1.5">
                               <span className="text-[13px] font-bold text-white">{config.label}</span>
                               <CheckCircle size={14} weight="fill" className="text-cyan-400 animate-pulse" />
                             </div>
                             <span className="text-[10px] text-white/40 truncate">Connect to ecosystem</span>
                          </div>
                        </button>
                      ))}
                   </div>
                </div>

                {/* Previous 7 Days */}
                <div>
                   <h4 className="text-[10px] font-bold text-white/40 mb-3 pl-1 uppercase tracking-wider">Chat History</h4>
                   <div className="space-y-1">
                      {threads.map(t => (
                        <button key={t.id} onClick={() => { switchThread(t.id); setMobileSidebarOpen(false); }} className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 transition-all text-left group">
                          <div className="flex items-center gap-3 min-w-0">
                             <ChatCircle size={18} className="text-white/30 flex-shrink-0 group-hover:text-cyan-400" />
                             <span className="text-[13px] font-medium text-white/70 group-hover:text-white truncate">{t.title || "New Chat"}</span>
                          </div>
                          <span className="text-[10px] text-white/20 whitespace-nowrap ml-2">Open &gt;</span>
                        </button>
                      ))}
                   </div>
                </div>
              </div>

              {/* Bottom Profile Area */}
              <div className="p-4 border-t border-white/5 flex items-center justify-between bg-[#09090b]" style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom, 0px))" }}>
                 <div className="flex items-center gap-3">
                    <div className="relative">
                       <img src={userAvatar || "/avatars/default.png"} alt="User" className="w-9 h-9 rounded-full border-2 border-white/10 object-cover" onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=06b6d4&color=000000&bold=true`; }} />
                    </div>
                    <div className="flex flex-col ml-1">
                       <span className="text-[13px] font-bold text-white leading-tight">{userName.split(" ")[0]}</span>
                       <span className="text-[10px] text-cyan-400 uppercase tracking-widest font-semibold leading-none mt-0.5">Student</span>
                    </div>
                 </div>
                 <button onClick={() => { newThread(); setMobileSidebarOpen(false); }} className="flex items-center gap-1.5 px-4 py-2 bg-cyan-500 text-black rounded-full font-bold text-[12px] hover:scale-105 active:scale-95 transition-all">
                    <Plus size={14} weight="bold" />
                    New chat
                 </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Configuration Slide Drawer / Modal Overlay ── */}
      <DrQConfigPanel 
        isOpen={showConfig}
        settings={settings}
        onUpdate={updateSettings}
        onClose={() => setShowConfig(false)}
      />

    </div>
  );
}
