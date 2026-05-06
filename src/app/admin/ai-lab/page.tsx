"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Zap, Bot, Send, Trash2, Settings, 
  ChevronRight, Check, AlertCircle, 
  Code, Image as ImageIcon, Cpu, 
  Globe, Shield, Sparkles, Terminal,
  MessageSquare, Layers
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";

type Message = {
  role: "user" | "assistant";
  content: string;
  provider?: string;
  time: string;
};

type ProviderInfo = {
  id: string;
  name: string;
  icon: any;
  color: string;
  description: string;
  models: string[];
};

const PROVIDERS: ProviderInfo[] = [
  { 
    id: "internal-proxy", 
    name: "Internal Proxy (Elite)", 
    icon: Shield, 
    color: "emerald", 
    description: "Keyless bypass for Claude & Gemini Pro.",
    models: ["claude-3-5-sonnet", "gemini-1-5-pro"]
  },
  { 
    id: "puter", 
    name: "Puter.js (Official)", 
    icon: Cpu, 
    color: "blue", 
    description: "GPT-4o, Claude 3.5 Sonnet, Llama 3.1 405B.",
    models: ["gpt-4o", "claude-3-5-sonnet", "meta-llama-3.1-405b-instruct"]
  },
  { 
    id: "duckduckgo", 
    name: "DuckDuckGo AI", 
    icon: Globe, 
    color: "orange", 
    description: "Unlimited GPT-4o-mini and Claude 3 Haiku.",
    models: ["gpt-4o-mini", "claude-3-haiku", "llama-3-1-70b"]
  },
  { 
    id: "groq", 
    name: "Groq (Lightning)", 
    icon: Zap, 
    color: "amber", 
    description: "Ultra-fast Llama 3.1 70B & Mixtral.",
    models: ["llama-3.1-70b-versatile", "mixtral-8x7b-32768"]
  },
  { 
    id: "gemini", 
    name: "Google Gemini", 
    icon: Sparkles, 
    color: "indigo", 
    description: "Multi-key rotation for 1.5 Pro/Flash.",
    models: ["gemini-1.5-pro", "gemini-1.5-flash"]
  },
  { 
    id: "openrouter", 
    name: "OpenRouter Free", 
    icon: Layers, 
    color: "purple", 
    description: "Community-driven free AI models.",
    models: ["google/gemini-2.0-flash-exp:free", "meta-llama/llama-3.1-405b:free"]
  }
];

export default function AILabPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(PROVIDERS[0]);
  const [selectedModel, setSelectedModel] = useState(PROVIDERS[0].models[0]);
  const [showSettings, setShowSettings] = useState(false);
  const [strictMode, setStrictMode] = useState(true);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  async function handleSend() {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      role: "user",
      content: input.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/v1/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.content,
          provider: selectedProvider.id,
          model: selectedModel,
          strict: strictMode,
          isLab: true
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lab request failed");

      const botMsg: Message = {
        role: "assistant",
        content: data.text,
        provider: data.provider,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (e: any) {
      toast.error(e.message);
      // Fallback message if strict failed
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `🚨 **Error from ${selectedProvider.name}:** ${e.message}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-200 overflow-hidden font-sans selection:bg-blue-500/30">
      
      {/* Sidebar: Lab Controls */}
      <div className="w-80 flex flex-col border-r border-white/5 bg-slate-900/50 backdrop-blur-3xl shrink-0">
        <div className="p-6 border-b border-white/5 bg-gradient-to-br from-blue-600/10 to-indigo-600/10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)]">
              <Terminal className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="font-display text-xl font-black tracking-tight text-white">AI LAB</h1>
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Experimental Core</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
          <div className="space-y-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-2">Intelligence Sources</h2>
            <div className="grid grid-cols-1 gap-2">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedProvider(p);
                    setSelectedModel(p.models[0]);
                  }}
                  className={cn(
                    "group relative flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 text-left",
                    selectedProvider.id === p.id 
                      ? `border-${p.color}-500/50 bg-${p.color}-500/10 shadow-[0_0_20px_rgba(var(--${p.color}-500),0.1)]` 
                      : "border-white/5 bg-white/[0.02] hover:bg-white/5 hover:border-white/10"
                  )}
                >
                  <div className={cn("h-10 w-10 shrink-0 flex items-center justify-center rounded-xl", selectedProvider.id === p.id ? `bg-${p.color}-500 text-white` : "bg-slate-800 text-slate-400")}>
                    <p.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-xs font-black uppercase tracking-wider truncate", selectedProvider.id === p.id ? `text-${p.color}-400` : "text-slate-300")}>{p.name}</p>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">{p.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-2">Active Model</h2>
            <div className="space-y-2">
              {selectedProvider.models.map((m) => (
                <button
                  key={m}
                  onClick={() => setSelectedModel(m)}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between border",
                    selectedModel === m 
                      ? "bg-blue-600/20 border-blue-500/50 text-blue-400" 
                      : "bg-white/[0.02] border-white/5 text-slate-500 hover:text-white"
                  )}
                >
                  {m.replace(/-/g, ' ').toUpperCase()}
                  {selectedModel === m && <Check className="h-3 w-3" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-white/5 bg-slate-950/50">
          <button 
            onClick={() => setStrictMode(!strictMode)}
            className={cn(
              "w-full flex items-center justify-between p-4 rounded-2xl border transition-all",
              strictMode ? "bg-amber-500/10 border-amber-500/30 text-amber-500" : "bg-slate-800/50 border-white/5 text-slate-400"
            )}
          >
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4" />
              <div className="text-left">
                <p className="text-[10px] font-black uppercase">Strict Model Mode</p>
                <p className="text-[8px] opacity-60">No fallbacks allowed</p>
              </div>
            </div>
            <div className={cn("h-2 w-2 rounded-full", strictMode ? "bg-amber-500 animate-pulse" : "bg-slate-600")} />
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative bg-[radial-gradient(circle_at_50%_0%,rgba(37,99,235,0.05),transparent)]">
        
        {/* Lab Header */}
        <div className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-slate-950/20 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
               <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Experimental Environment</span>
            </div>
            <div className="h-4 w-[1px] bg-white/10" />
            <p className="text-sm font-bold text-slate-400">Model: <span className="text-white">{selectedModel}</span></p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setMessages([])} className="p-2 hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all rounded-lg" title="Clear History">
              <Trash2 className="h-5 w-5" />
            </button>
            <button className="p-2 hover:bg-white/5 text-slate-500 hover:text-white transition-all rounded-lg">
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center gap-6 animate-in fade-in zoom-in-95 duration-700">
               <div className="h-24 w-24 rounded-[2rem] bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-2xl shadow-blue-600/20 relative">
                  <Bot className="h-12 w-12 text-white" />
                  <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-slate-900 border-2 border-slate-950 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-blue-400 animate-pulse" />
                  </div>
               </div>
               <div className="text-center space-y-2">
                  <h3 className="font-display text-2xl font-black text-white">Quantum Laboratory</h3>
                  <p className="text-slate-500 text-sm max-w-sm mx-auto">This environment allows direct communication with multiple AI brains without context restrictions.</p>
               </div>
               <div className="grid grid-cols-2 gap-3 max-w-md w-full mt-4">
                  {["Explain Quantum Entanglement", "Write a Next.js API route", "Plan a trip to Mars", "Solve a clinical case"].map(q => (
                    <button key={q} onClick={() => setInput(q)} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-xs text-slate-400 hover:bg-white/5 hover:border-blue-500/30 transition-all text-left">
                       {q}
                    </button>
                  ))}
               </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={cn("flex flex-col gap-3 group animate-in slide-in-from-bottom-2", m.role === "user" ? "items-end" : "items-start")}>
               <div className={cn("flex items-center gap-3 mb-1", m.role === "user" ? "flex-row-reverse" : "flex-row")}>
                  <div className={cn("h-8 w-8 rounded-full flex items-center justify-center border", m.role === "user" ? "bg-blue-600/20 border-blue-500/50 text-blue-400" : "bg-slate-800 border-white/5 text-slate-400")}>
                    {m.role === "user" ? <MessageSquare className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{m.role === "user" ? "COMMANDER" : m.provider?.toUpperCase() || "INTERNAL_CORE"}</span>
                  <span className="text-[10px] text-slate-700">{m.time}</span>
               </div>
               <div className={cn(
                 "max-w-[85%] rounded-[1.5rem] px-6 py-4 shadow-xl border",
                 m.role === "user" 
                   ? "bg-blue-600 text-white border-blue-500 shadow-blue-900/20" 
                   : "bg-slate-900 border-white/5 text-slate-200"
               )}>
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown
                      components={{
                        code({ node, inline, className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || "");
                          return !inline && match ? (
                            <SyntaxHighlighter
                              style={atomDark}
                              language={match[1]}
                              PreTag="div"
                              className="rounded-xl border border-white/5 my-4"
                              {...props}
                            >
                              {String(children).replace(/\n$/, "")}
                            </SyntaxHighlighter>
                          ) : (
                            <code className={cn("bg-white/10 px-1 rounded", className)} {...props}>
                              {children}
                            </code>
                          );
                        }
                      }}
                    >
                      {m.content}
                    </ReactMarkdown>
                  </div>
               </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex flex-col gap-3 items-start animate-pulse">
               <div className="flex items-center gap-3 mb-1">
                  <div className="h-8 w-8 rounded-full bg-slate-800 border border-white/5 flex items-center justify-center">
                    <div className="h-4 w-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">CONSULTING_BRAIN...</span>
               </div>
               <div className="h-12 w-24 rounded-2xl bg-slate-900 border border-white/5" />
            </div>
          )}
        </div>

        {/* Input Container */}
        <div className="p-8 pt-0">
          <div className="max-w-4xl mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2.5rem] opacity-20 blur-xl group-focus-within:opacity-40 transition-opacity" />
            <div className="relative flex items-end gap-2 p-3 rounded-[2.5rem] bg-slate-900 border border-white/10 shadow-2xl backdrop-blur-2xl">
               <button className="h-12 w-12 rounded-full flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 transition-all">
                  <PlusIcon className="h-6 w-6" />
               </button>
               <textarea 
                  rows={1}
                  placeholder={`Ask ${selectedModel}...`}
                  className="flex-1 max-h-48 bg-transparent border-none focus:ring-0 text-slate-200 p-3 text-sm placeholder:text-slate-600 custom-scrollbar resize-none"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
               />
               <button 
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className={cn(
                    "h-12 w-12 rounded-full flex items-center justify-center transition-all",
                    input.trim() && !isLoading ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]" : "bg-slate-800 text-slate-600"
                  )}
               >
                  {isLoading ? <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="h-5 w-5" />}
               </button>
            </div>
          </div>
          <p className="text-center text-[10px] text-slate-600 mt-4 font-bold uppercase tracking-[0.3em]">AI Lab Experimental Phase 1.0 · Powered by Indestructible Architecture</p>
        </div>
      </div>
    </div>
  );
}

function PlusIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" /><path d="M12 5v14" />
    </svg>
  );
}
