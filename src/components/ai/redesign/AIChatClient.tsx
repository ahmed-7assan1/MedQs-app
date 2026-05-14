"use client";

import { useAIChat, PUTER_AGENTS, PUTER_MODELS } from "@/hooks/useAIChat";
import { AIChatBubble } from "@/components/ai/redesign/AIChatBubble";
import { AIChatInput } from "@/components/ai/redesign/AIChatInput";
import { LeftSidebar, RightSidebar } from "@/components/ai/redesign/AIChatSidebars";
import { AIChatMobileHeader } from "@/components/ai/redesign/AIChatMobileHeader";
import { SuggestionPills } from "@/components/ai/redesign/SuggestionPills";
import { useEffect, useRef, useState } from "react";
import { X, Search, Download, MoreVertical, RefreshCw, Check, Image, Cpu, Lock, UserPlus, GraduationCap, Layout, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import Link from "next/link";

interface AIChatClientProps {
  user: {
    name: string;
    rank: string;
    role?: string;
  };
}

export function AIChatClient({ user }: AIChatClientProps) {
  const { data: session, status } = useSession();
  const { 
    messages, loading, threads, activeThreadId, sendMessage, generateImage, selectThread, newTopic,
    bgImage, userBubbleColor, puterModel, setBgImage, setUserBubbleColor, setPuterModel,
    bgBlur, setBgBlur, bgOpacity, setBgOpacity,
    activeMode, activeAgent, setActiveMode, setActiveAgent
  } = useAIChat();
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [modelFilter, setModelFilter] = useState("");
  const isAdmin = user.role === "ADMIN";

  // ─ NEW: Professional Registration UI for Guests
  if (status === "unauthenticated") {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#07080f] p-6">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="relative inline-block">
             <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
             <div className="relative w-20 h-20 mx-auto rounded-[24px] bg-gradient-to-br from-primary to-[#7b5fff] flex items-center justify-center shadow-2xl">
                <Lock className="text-white w-10 h-10" />
             </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-white tracking-tight">Identity Required</h1>
            <p className="text-drq-secondary text-sm leading-relaxed">
              Dr. Q is an exclusive AI resource for MedOneX members. 
              Please register or login to unlock medical intelligence.
            </p>
          </div>
          <div className="flex flex-col gap-3">
             <Link href="/register" className="w-full h-14 rounded-2xl bg-primary text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-primary/20">
                <UserPlus size={18} /> Join MedOneX Now
             </Link>
             <Link href="/login" className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 text-white font-bold flex items-center justify-center hover:bg-white/10 transition-all">
                Login to your account
             </Link>
          </div>
          <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest pt-4">© 2026 MedOneX Platform</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  return (
    <div className="drq-redesign-root flex h-screen w-full flex-col bg-drq-base font-dm-sans overflow-hidden">
      {/* 1. Mobile Header (Fixed/Sticky) */}
      <div className="lg:hidden">
        <AIChatMobileHeader onNewTopic={newTopic} onBack={() => window.history.back()} />
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {bgImage && (
          <div 
            className="absolute inset-0 z-0 pointer-events-none transition-all duration-700" 
            style={{ 
              backgroundImage: `url(${bgImage})`, 
              backgroundSize: 'cover', 
              backgroundPosition: 'center',
              filter: `blur(${bgBlur}px)`,
              opacity: bgOpacity / 100
            }} 
          />
        )}
        <div className="absolute inset-0 bg-drq-base/40 z-[1] pointer-events-none" />

        
        {/* 2. Desktop Left Sidebar (Fixed width) */}
        <LeftSidebar 
          threads={threads} 
          activeId={activeThreadId} 
          onSelect={selectThread} 
          onNew={newTopic}
          user={user} 
        />

        {/* 3. Main Chat Column (Flex: 1, Centered Content) */}
        <main className="flex-1 flex flex-col min-w-0 bg-drq-base relative z-10">
          
          {/* Floating Island Header */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-4xl px-6 py-3 bg-drq-panel/60 backdrop-blur-2xl border border-white/10 rounded-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-lg relative shadow-lg", activeAgent.gradClass)}>
                {activeAgent.icon}
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-drq-panel rounded-full shadow-sm" />
              </div>
              <div className="flex flex-col">
                <div className="font-syne text-[16px] font-bold text-white leading-none mb-0.5">{activeAgent.name}</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-drq-primary/80">{activeAgent.subtitle}</div>
              </div>
              <button
                onClick={() => setShowAgentModal(true)}
                className="ml-4 bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-full text-[10px] font-bold text-white uppercase tracking-wider transition-all"
              >
                Switch Agent
              </button>
            </div>

            <div className="flex gap-3">
              <button className="w-10 h-10 rounded-full flex items-center justify-center bg-drq-surface border border-drq-border text-drq-secondary hover:bg-drq-elevated hover:text-white transition-all">
                <Search className="w-5 h-5" />
              </button>
              <button className="w-10 h-10 rounded-full flex items-center justify-center bg-drq-surface border border-drq-border text-drq-secondary hover:bg-drq-elevated hover:text-white transition-all">
                <Download className="w-5 h-5" />
              </button>
              <div className="relative">
                <button 
                  onClick={() => setShowSettings(!showSettings)}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-drq-surface border border-drq-border text-drq-secondary hover:bg-drq-elevated hover:text-white transition-all"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>

                {/* Settings Dropdown */}
                {showSettings && (
                  <div className="absolute top-[52px] right-0 z-50 w-80 bg-drq-panel border border-drq-border rounded-2xl shadow-2xl p-5 animate-pop-in origin-top-right">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-white font-bold tracking-wide">Chat Settings</h3>
                      <button onClick={() => setShowSettings(false)} className="text-drq-secondary hover:text-white">
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Model Picker — available to all users */}
                    <div className="mb-5">
                      <label className="block text-[10px] font-black text-drq-secondary uppercase tracking-widest mb-3">
                        <Cpu className="inline w-3 h-3 mr-1" />AI Model — {PUTER_MODELS.find(m => m.id === puterModel)?.label ?? puterModel}
                      </label>
                      <button
                        onClick={() => setShowModelPicker(true)}
                        className="w-full flex items-center justify-between bg-drq-base border border-drq-border rounded-xl px-4 py-2.5 text-sm hover:border-drq-primary transition-all"
                      >
                        <span className="text-white font-medium">{PUTER_MODELS.find(m => m.id === puterModel)?.label ?? puterModel}</span>
                        <span className="text-drq-secondary text-xs">{PUTER_MODELS.find(m => m.id === puterModel)?.provider}</span>
                      </button>
                    </div>

                    {/* API Key Manager */}
                    <div className="mb-5 p-4 rounded-xl bg-drq-surface border border-drq-border">
                      <h4 className="text-[10px] font-black text-drq-primary uppercase tracking-widest mb-3">BioC API Connectivity</h4>
                      <p className="text-[11px] text-drq-secondary mb-3">Connect directly to AI providers for maximum speed.</p>
                      <div className="space-y-2">
                        {["OpenAI", "Google", "Groq"].map(prov => (
                          <div key={prov} className="flex items-center justify-between">
                            <span className="text-xs text-white">{prov} API</span>
                            <button 
                              onClick={() => {
                                const key = prompt(`Enter your ${prov} API Key:`);
                                if (key) {
                                  localStorage.setItem(`medonex-api-key-${prov.toLowerCase()}`, key);
                                  toast.success(`${prov} Key saved!`);
                                }
                              }}
                              className="text-[10px] font-bold text-drq-primary hover:underline"
                            >
                              {localStorage.getItem(`medonex-api-key-${prov.toLowerCase()}`) ? "Update Key" : "Set Key"}
                            </button>
                          </div>
                        ))}
                      </div>
                      <a href="https://platform.openai.com/api-keys" target="_blank" className="mt-4 block text-[10px] text-center font-bold text-drq-secondary hover:text-white transition-colors">
                        Get API Keys →
                      </a>
                    </div>

                    {/* API Key Manager */}
                    <div className="mb-5 p-4 rounded-xl bg-drq-surface border border-drq-border">
                      <h4 className="text-[10px] font-black text-drq-primary uppercase tracking-widest mb-3">BioC API Connectivity</h4>
                      <p className="text-[11px] text-drq-secondary mb-3">Connect directly to AI providers for maximum speed.</p>
                      <div className="space-y-2">
                        {["OpenAI", "Google", "Groq"].map(prov => (
                          <div key={prov} className="flex items-center justify-between">
                            <span className="text-xs text-white">{prov} API</span>
                            <button 
                              onClick={() => {
                                const key = prompt(`Enter your ${prov} API Key:`);
                                if (key) {
                                  localStorage.setItem(`medonex-api-key-${prov.toLowerCase()}`, key);
                                  toast.success(`${prov} Key saved!`);
                                }
                              }}
                              className="text-[10px] font-bold text-drq-primary hover:underline"
                            >
                              {localStorage.getItem(`medonex-api-key-${prov.toLowerCase()}`) ? "Update Key" : "Set Key"}
                            </button>
                          </div>
                        ))}
                      </div>
                      <a href="https://platform.openai.com/api-keys" target="_blank" className="mt-4 block text-[10px] text-center font-bold text-drq-secondary hover:text-white transition-colors">
                        Get API Keys →
                      </a>
                    </div>

                    <div className="mb-6 space-y-4">
                      <div>
                        <label className="block text-[10px] font-black text-drq-secondary uppercase tracking-widest mb-2">Background Blur</label>
                        <input 
                          type="range" min="0" max="40" value={bgBlur} 
                          onChange={(e) => setBgBlur(Number(e.target.value))}
                          className="w-full accent-drq-primary h-1.5 bg-drq-base rounded-lg cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-drq-secondary uppercase tracking-widest mb-2">Background Opacity</label>
                        <input 
                          type="range" min="0" max="100" value={bgOpacity} 
                          onChange={(e) => setBgOpacity(Number(e.target.value))}
                          className="w-full accent-drq-primary h-1.5 bg-drq-base rounded-lg cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-drq-secondary uppercase tracking-widest mb-3">Bubble Style</label>
                        <div className="flex items-center gap-3">
                          {["grad-1", "grad-2", "grad-3", "grad-4", "bg-drq-surface"].map(col => (
                            <button
                              key={col}
                              onClick={() => setUserBubbleColor(col)}
                              className={cn("w-8 h-8 rounded-full border-2 shadow-lg transition-transform hover:scale-110", col, userBubbleColor === col ? "border-white ring-2 ring-drq-primary/50" : "border-transparent opacity-70")}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Scrollable Chat Area */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-8 py-8 flex flex-col gap-6"
          >
            {messages.length === 0 && (
              <div className="mt-10 animate-slide-up">
                <SuggestionPills onSelect={sendMessage} />
              </div>
            )}

            {/* Message Thread */}
            {messages.map((m, idx) => (
              <AIChatBubble key={idx} message={m} userBubbleColor={userBubbleColor} activeAgent={activeAgent} />
            ))}
            
            {loading && (
              <div className="flex gap-4 max-w-[85%] self-start animate-fade-up">
                <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0", activeAgent.gradClass)}>
                  {activeAgent.icon}
                </div>
                <div className="flex flex-col gap-1">
                  <div className="bg-drq-surface border border-drq-border rounded-2xl rounded-tl-sm px-[18px] py-[14px] flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-drq-secondary rounded-full animate-bounce" style={{ animationDelay: '-0.32s' }} />
                    <div className="w-1.5 h-1.5 bg-drq-secondary rounded-full animate-bounce" style={{ animationDelay: '-0.16s' }} />
                    <div className="w-1.5 h-1.5 bg-drq-secondary rounded-full animate-bounce" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Fixed Input Bar */}
          <div className="px-8 pb-8">
            {/* Quick Action Dock */}
            <div className="flex items-center gap-2 mb-4 overflow-x-auto no-scrollbar pb-2">
              <button 
                onClick={() => sendMessage("Give me the structure of my semester lectures")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-drq-surface border border-drq-border text-[11px] font-bold text-drq-secondary hover:text-white hover:border-drq-primary transition-all active:scale-95 whitespace-nowrap"
              >
                <Layout size={14} className="text-drq-primary" /> Lectures Structure
              </button>
              <button 
                onClick={() => sendMessage("Show me my data for this semester")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-drq-surface border border-drq-border text-[11px] font-bold text-drq-secondary hover:text-white hover:border-drq-primary transition-all active:scale-95 whitespace-nowrap"
              >
                <GraduationCap size={14} className="text-emerald-500" /> Semester Data
              </button>
              <button 
                onClick={() => sendMessage("Tell me about the founder of MedOneX")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-drq-surface border border-drq-border text-[11px] font-bold text-drq-secondary hover:text-white hover:border-drq-primary transition-all active:scale-95 whitespace-nowrap"
              >
                <Sparkles size={14} className="text-amber-500" /> MedOneX Founder
              </button>
            </div>

            <AIChatInput 
              onSend={sendMessage}
              onGenerateImage={generateImage}
              disabled={loading} 
              activeMode={activeMode}
              setActiveMode={setActiveMode}
            />
          </div>
        </main>

        {/* 4. Desktop Right Sidebar (Fixed width) */}
        <RightSidebar 
          sessionContext={{
            subject: "CNS / PHYSIO",
            lastLecture: "Synaptic Transmission",
            mastery: 68,
            questionsToday: 12
          }} 
          activeAgent={activeAgent}
          onOpenAgentModal={() => setShowAgentModal(true)}
          onQuickAction={(text: string) => sendMessage(text)}
        />
      </div>

      {/* AGENT SWITCHER MODAL */}
      <div className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center transition-all duration-300",
        showAgentModal ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )}>
        <div className="absolute inset-0 bg-drq-base/80 backdrop-blur-md" onClick={() => setShowAgentModal(false)} />
        <div className={cn(
          "relative bg-drq-panel border border-drq-border rounded-[24px] w-[600px] max-w-[90vw] p-8 shadow-[0_20px_40px_rgba(0,0,0,0.5)] transition-all duration-300",
          showAgentModal ? "scale-100" : "scale-95"
        )}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-syne text-2xl font-bold text-white">Select AI Agent</h2>
            <button onClick={() => setShowAgentModal(false)} className="text-drq-secondary hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PUTER_AGENTS.map((agent) => (
              <div 
                key={agent.name}
                onClick={() => {
                  setActiveAgent(agent);
                  setShowAgentModal(false);
                }}
                className={cn(
                  "bg-drq-surface border border-drq-border rounded-2xl p-5 cursor-pointer transition-all hover:-translate-y-0.5",
                  activeAgent.name === agent.name ? "border-drq-primary bg-drq-primary/5" : "hover:border-drq-primary hover:bg-drq-primary/5"
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-2xl", agent.gradClass)}>
                    {agent.icon}
                  </div>
                  {activeAgent.name === agent.name && <Check className="w-5 h-5 text-drq-primary" />}
                </div>
                <h4 className="font-syne text-base font-bold text-white mb-1">{agent.name}</h4>
                <p className="text-[11px] text-drq-secondary leading-relaxed mb-3">{agent.desc}</p>
                <span className="text-[10px] font-bold text-drq-primary/80 uppercase tracking-wider">{agent.subtitle}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODEL PICKER MODAL */}
      <div className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center transition-all duration-300",
        showModelPicker ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )}>
        <div className="absolute inset-0 bg-drq-base/80 backdrop-blur-md" onClick={() => setShowModelPicker(false)} />
        <div className={cn(
          "relative bg-drq-panel border border-drq-border rounded-[24px] w-[640px] max-w-[95vw] max-h-[85vh] flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.6)] transition-all duration-300",
          showModelPicker ? "scale-100" : "scale-95"
        )}>
          <div className="flex justify-between items-center p-6 border-b border-drq-border">
            <div>
              <h2 className="font-syne text-2xl font-bold text-white">Choose AI Model</h2>
              <p className="text-drq-secondary text-sm mt-1">Select from high-performance models (Puter, Groq, Gemini) for your study.</p>
            </div>
            <button onClick={() => setShowModelPicker(false)} className="text-drq-secondary hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Search */}
          <div className="px-6 pt-4">
            <input
              type="text"
              value={modelFilter}
              onChange={e => setModelFilter(e.target.value)}
              placeholder="Search models..."
              className="w-full bg-drq-surface border border-drq-border rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-drq-secondary focus:outline-none focus:border-drq-primary transition-all"
            />
          </div>

          {/* Model List */}
          <div className="overflow-y-auto flex-1 p-6 space-y-1">
            {Object.entries(
              PUTER_MODELS
                .filter(m => m.label.toLowerCase().includes(modelFilter.toLowerCase()) || m.provider.toLowerCase().includes(modelFilter.toLowerCase()))
                .reduce((acc, m) => { (acc[m.provider] ??= []).push(m); return acc; }, {} as Record<string, typeof PUTER_MODELS>)
            ).map(([provider, models]) => (
              <div key={provider} className="mb-4">
                <div className="text-[10px] font-black text-drq-secondary uppercase tracking-widest mb-2 px-1">{provider}</div>
                {models.map(m => (
                  <button
                    key={m.id}
                    onClick={() => { setPuterModel(m.id); setShowModelPicker(false); }}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all mb-1",
                      puterModel === m.id
                        ? "bg-drq-primary/15 border border-drq-primary text-white"
                        : "hover:bg-drq-surface border border-transparent text-drq-secondary hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-base">{m.icon}</span>
                      <span className="font-medium">{m.label}</span>
                      {m.badge && <span className="text-[10px] font-bold bg-drq-primary/20 text-drq-primary px-2 py-0.5 rounded-full">{m.badge}</span>}
                    </div>
                    {puterModel === m.id && <Check className="w-4 h-4 text-drq-primary" />}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
