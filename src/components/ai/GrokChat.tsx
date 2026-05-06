"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useDrQChat } from "@/hooks/useDrQChat";
import { cn } from "@/lib/utils";
import { MedQsLogoMark } from "@/components/branding/MedQsLogo";
import { Tooltip } from "antd";
import { toast } from "react-hot-toast";
import {
  PlusOutlined, ShareAltOutlined, EditOutlined, EllipsisOutlined,
  CopyOutlined, LikeOutlined, DislikeOutlined, ReloadOutlined,
  AudioOutlined, CheckCircleOutlined, ExclamationCircleOutlined,
  FileTextOutlined, CloseOutlined, MenuOutlined, SettingOutlined,
  HistoryOutlined
} from "@ant-design/icons";

// ─── Types ──────────────────────────────────────────────────────────────────
type FileData = { data: string; mimeType: string; name: string };

// ─── Star Background ─────────────────────────────────────────────────────────
function StarField() {
  const stars = Array.from({ length: 80 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 1.5 + 0.5,
    delay: Math.random() * 4,
    duration: Math.random() * 3 + 2,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((s) => (
        <motion.div
          key={s.id}
          className="absolute rounded-full bg-white"
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size }}
          animate={{ opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: s.duration, delay: s.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

// ─── Voice Button ─────────────────────────────────────────────────────────────
function VoiceButton({ active }: { active: boolean }) {
  return (
    <motion.div
      className="relative w-10 h-10 rounded-full flex items-center justify-center cursor-pointer flex-shrink-0"
      animate={active ? { scale: [1, 1.08, 1] } : {}}
      transition={{ duration: 1.2, repeat: Infinity }}
    >
      <div className={cn(
        "absolute inset-0 rounded-full",
        active ? "bg-gradient-to-br from-purple-600 to-indigo-600" : "bg-gradient-to-br from-purple-700/60 to-indigo-700/60"
      )} />
      {active && (
        <motion.div
          className="absolute inset-0 rounded-full bg-purple-500/30"
          animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      )}
      <AudioOutlined className="relative z-10 text-white text-sm" />
    </motion.div>
  );
}

// ─── Suggestion Chips ─────────────────────────────────────────────────────────
const SUGGESTIONS = [
  "اشرح هذا المفهوم الطبي بالتفصيل",
  "اعطني أسئلة تدريبية على هذا الموضوع",
  "ما هي الأعراض الشائعة؟",
  "Show me a clinical case study",
];

function SuggestionChips({ onSelect }: { onSelect: (s: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2 mt-5">
      {SUGGESTIONS.map((s, i) => (
        <motion.button
          key={s}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, duration: 0.3 }}
          onClick={() => onSelect(s)}
          className="px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.04] text-gray-400 text-xs hover:border-white/25 hover:text-white hover:bg-white/[0.08] transition-all"
        >
          {s}
        </motion.button>
      ))}
    </div>
  );
}

// ─── Question Card ────────────────────────────────────────────────────────────
function QuestionCard({ q }: { q: { question: string; options: string[]; answer: string; explanation?: string } }) {
  const [selected, setSelected] = useState<string | null>(null);
  const isCorrect = selected === q.answer;
  return (
    <div className="my-6 p-5 rounded-2xl bg-white/[0.04] border border-white/10">
      <div className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-3">Practice Question</div>
      <p className="text-white font-semibold mb-4 text-sm leading-relaxed">{q.question}</p>
      <div className="space-y-2">
        {q.options.map((opt, i) => (
          <button key={i} disabled={!!selected} onClick={() => setSelected(opt)}
            className={cn("w-full text-left px-4 py-2.5 rounded-xl border text-sm transition-all flex items-center justify-between",
              !selected ? "border-white/8 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06] text-gray-300" :
              opt === q.answer ? "border-green-500/40 bg-green-500/10 text-green-400" :
              selected === opt ? "border-red-500/40 bg-red-500/10 text-red-400" : "border-white/5 text-gray-600 opacity-50"
            )}>
            <span>{opt}</span>
            {selected && opt === q.answer && <CheckCircleOutlined className="text-green-500" />}
            {selected === opt && opt !== q.answer && <ExclamationCircleOutlined className="text-red-500" />}
          </button>
        ))}
      </div>
      <AnimatePresence>
        {selected && q.explanation && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4 pt-4 border-t border-white/8">
            <p className="text-xs text-gray-400 leading-relaxed">{q.explanation}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function GrokChat() {
  const { messages, loading, sendMessage, settings, updateSettings, limits, clearChat } = useDrQChat();
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<FileData[]>([]);
  const [mounted, setMounted] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [fontSize, setFontSize] = useState(settings.fontSize || 15);
  const [bubbleColor, setBubbleColor] = useState(settings.userBubbleColor || "#1a1a1a");
  const [customKey, setCustomKey] = useState(settings.customKey || "");
  const [provider, setProvider] = useState(settings.customProvider || "gemini");
  const [useCustom, setUseCustom] = useState(settings.useCustomKey || false);

  const endRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  // Sync settings when they change externally or internally
  const saveSettings = () => {
    updateSettings({
      ...settings,
      fontSize,
      userBubbleColor: bubbleColor,
      customKey,
      customProvider: provider as any,
      useCustomKey: useCustom
    });
  };

  const isStart = messages.length === 0;

  const send = (msg?: string) => {
    const text = msg ?? input;
    if ((!text.trim() && files.length === 0) || loading) return;
    sendMessage(text, files);
    setInput("");
    setFiles([]);
  };

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files || []).slice(0, 3 - files.length).forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => setFiles(p => [...p, { data: ev.target?.result as string, mimeType: file.type, name: file.name }]);
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const isRTL = (text: string) => /[\u0600-\u06FF]/.test(text);

  const parseContent = (content: string) => {
    try {
      if (content.trim().startsWith("{")) {
        const data = JSON.parse(content);
        return data.reply || data.content || content;
      }
    } catch (e) {}
    return content;
  };

  if (!mounted) return <div className="w-full h-screen bg-[#0a0a0a]" />;

  return (
    <div className="relative w-full h-[calc(100vh-10px)] bg-[#0a0a0a] overflow-hidden flex flex-col">

      {/* Star Background - only on start screen */}
      <AnimatePresence>
        {isStart && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1 }} className="absolute inset-0 z-0">
            <StarField />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Drawer */}
      <AnimatePresence>
        {showSettings && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-[60]" onClick={() => setShowSettings(false)} />
            <motion.div initial={{ x: 320 }} animate={{ x: 0 }} exit={{ x: 320 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 h-full w-80 bg-[#111] border-l border-white/8 z-[70] flex flex-col p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-white font-bold text-lg">Chat Settings</h3>
                <button onClick={() => setShowSettings(false)} className="text-gray-500 hover:text-white"><CloseOutlined /></button>
              </div>
              
              <div className="space-y-8 overflow-y-auto pr-2 grok-scroll">
                {/* API Configuration */}
                <div>
                  <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-4 block">AI Engine Configuration</label>
                  <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 text-xs">Use Custom API Key</span>
                      <button onClick={() => setUseCustom(!useCustom)}
                        className={cn("w-10 h-5 rounded-full transition-all relative", useCustom ? "bg-purple-600" : "bg-white/10")}>
                        <div className={cn("absolute top-1 w-3 h-3 rounded-full bg-white transition-all", useCustom ? "left-6" : "left-1")} />
                      </button>
                    </div>
                    
                    {useCustom && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                          {["gemini", "groq", "openai", "xai"].map(p => (
                            <button key={p} onClick={() => setProvider(p as any)}
                              className={cn("px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all", 
                                provider === p ? "bg-white text-black" : "bg-white/5 text-gray-500 hover:text-white")}>
                              {p}
                            </button>
                          ))}
                        </div>
                        <input type="password" placeholder="Enter API Key" value={customKey} onChange={e => setCustomKey(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-purple-500/50 transition-all" />
                      </motion.div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-3 block">System Quota</label>
                  <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4">
                    <div className="flex justify-between text-[10px] mb-2">
                      <span className="text-gray-500 uppercase">Messages Used</span>
                      <span className="text-white font-mono">{limits.used} / {limits.limit === -1 ? "∞" : limits.limit}</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${limits.limit === -1 ? 0 : Math.min((limits.used / limits.limit) * 100, 100)}%` }}
                        className="h-full bg-gradient-to-r from-purple-600 to-indigo-500" />
                    </div>
                    <div className="mt-3 text-[10px] text-purple-400 font-bold uppercase tracking-tighter">Rank: {limits.rankLabel}</div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-3 block">Font Size</label>
                  <div className="flex items-center gap-4">
                    <input type="range" min="12" max="20" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} 
                      className="flex-1 accent-purple-600 bg-white/5 h-1 rounded-full appearance-none cursor-pointer" />
                    <span className="text-white text-sm font-mono w-8">{fontSize}px</span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-3 block">Bubble Color</label>
                  <div className="flex flex-wrap gap-3">
                    {["#1a1a1a", "#262626", "#1e1b4b", "#064e3b", "#701a75"].map(color => (
                      <button key={color} onClick={() => setBubbleColor(color)}
                        className={cn("w-8 h-8 rounded-full border-2 transition-all", bubbleColor === color ? "border-white scale-110" : "border-transparent opacity-60 hover:opacity-100")}
                        style={{ backgroundColor: color }} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-6 flex flex-col gap-3">
                <button onClick={() => { saveSettings(); setShowSettings(false); }}
                  className="w-full py-3 rounded-2xl bg-white text-black font-bold text-sm hover:bg-gray-100 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                  Save Changes
                </button>
                <p className="text-[10px] text-gray-700 text-center uppercase tracking-widest">Grok UI v2.5 • MedOneX</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Sidebar Overlay (mobile) */}
      <AnimatePresence>
        {showSidebar && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-40 md:hidden" onClick={() => setShowSidebar(false)} />
            <motion.div initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 h-full w-72 bg-[#111] border-r border-white/8 z-50 flex flex-col p-6">
              <button onClick={() => { clearChat(); setShowSidebar(false); }}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-semibold text-sm mb-8 transition-all">
                <PlusOutlined /> New Chat
              </button>
              <div className="text-[10px] font-black text-gray-700 uppercase tracking-widest mb-3">History</div>
              <div className="text-xs text-gray-700 italic text-center mt-8">No previous sessions</div>
              <div className="mt-auto pt-4 border-t border-white/8">
                <div className="bg-white/5 rounded-xl p-3 text-xs text-gray-500">
                  <div className="flex justify-between mb-1"><span>Messages</span><span>{limits.used}/{limits.limit === -1 ? "∞" : limits.limit}</span></div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-white/30 rounded-full transition-all" style={{ width: `${limits.limit === -1 ? 0 : Math.min((limits.used / limits.limit) * 100, 100)}%` }} />
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Layout */}
      <div className="relative z-10 flex flex-col w-full h-full">

      {/* Top Bar - Integrated & Minimal */}
      <div className="absolute top-4 right-6 z-[40] flex items-center gap-2">
        <TopBtn icon={<EditOutlined className="text-xs" />} onClick={clearChat} />
        <TopBtn icon={<ShareAltOutlined className="text-xs" />} />
        <TopBtn icon={<EllipsisOutlined className="text-xs" />} />
      </div>

      <div className="absolute top-4 left-6 z-[40]">
        <button onClick={() => setShowSidebar(true)} 
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-gray-400 hover:text-white transition-all">
          <HistoryOutlined className="text-sm" />
          <span className="text-[10px] font-bold uppercase tracking-widest">History</span>
        </button>
      </div>

        {/* Message Area */}
        <div className={cn("flex-1 overflow-y-auto grok-scroll", isStart ? "flex items-center justify-center" : "px-4 md:px-8 pt-4 pb-40")}>

          {/* Start Screen */}
          {isStart && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className="w-full max-w-xl mx-auto px-6 flex flex-col items-center text-center">
              <div className="flex items-center gap-3 mb-12">
                <div className="p-3 bg-white rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                  <MedQsLogoMark className="h-10 w-10 text-black" interactiveColor={false} />
                </div>
                <span className="text-4xl font-black text-white tracking-tighter">MedOneX</span>
              </div>
              <p className="text-gray-500 text-base mb-10">Your personal AI medical study assistant. Ask anything.</p>
              {/* Start Input Inline */}
              <InputBar
                input={input} setInput={setInput} files={files} setFiles={setFiles}
                onSend={send} voiceActive={voiceActive} setVoiceActive={setVoiceActive}
                fileInputRef={fileInputRef} handleFiles={handleFiles} isStart
                onOpenSettings={() => setShowSettings(true)}
              />
              <SuggestionChips onSelect={(s) => { setInput(s); setTimeout(() => send(s), 50); }} />
            </motion.div>
          )}

          {/* Messages */}
          {!isStart && (
            <div className="max-w-3xl mx-auto space-y-8">
              {messages.map((m, idx) => (
                <motion.div key={m.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
                  className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                  {m.role === "user" ? (
                    <div className="max-w-[85%] md:max-w-[65%] px-5 py-3 rounded-[24px] border border-white/10 text-white text-[15px] leading-relaxed shadow-lg"
                      style={{ direction: isRTL(m.content) ? "rtl" : "ltr", backgroundColor: bubbleColor, fontSize: `${fontSize}px` }}>
                      {m.files && m.files.length > 0 && (
                        <div className="flex gap-2 mb-2 flex-wrap">
                          {m.files.map((f, i) => (
                            <span key={i} className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg bg-white/10 border border-white/10">
                              <FileTextOutlined /> {f.name}
                            </span>
                          ))}
                        </div>
                      )}
                      {m.content}
                    </div>
                  ) : (
                    <div className="w-full max-w-[90%] md:max-w-[80%]">
                      {/* Thinking indicator */}
                      {idx === messages.length - 1 && loading && (
                        <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }}
                          className="flex items-center gap-2 text-gray-600 text-xs mb-4">
                          <span>💡</span><span>Thought for 2s</span>
                        </motion.div>
                      )}
                      <div className="prose prose-invert prose-sm max-w-none text-gray-200 text-[16px] leading-relaxed tracking-wide"
                        style={{ direction: isRTL(parseContent(m.content)) ? "rtl" : "ltr" }}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ children }) => {
                              const text = React.Children.toArray(children).join("");
                              if (text.includes(":::question")) {
                                try {
                                  const q = JSON.parse(text.split(":::question")[1].split(":::")[0].trim());
                                  return <QuestionCard q={q} />;
                                } catch { return <p>{children}</p>; }
                              }
                              return <p className="mb-4 last:mb-0">{children}</p>;
                            }
                          }}>
                          {parseContent(m.content)}
                        </ReactMarkdown>
                      </div>
                      {/* Action Bar */}
                      <div className="flex items-center gap-3 mt-3">
                        <Tooltip title="Copy Message">
                          <button onClick={() => { navigator.clipboard.writeText(parseContent(m.content)); toast.success("Copied!"); }}
                            className="text-gray-700 hover:text-gray-400 transition-colors"><CopyOutlined /></button>
                        </Tooltip>
                        <button className="text-gray-700 hover:text-gray-400 transition-colors hover:text-green-500"><LikeOutlined /></button>
                        <button className="text-gray-700 hover:text-gray-400 transition-colors hover:text-red-500"><DislikeOutlined /></button>
                        <button onClick={() => sendMessage(messages[idx-1]?.content || "")}
                          className="text-gray-700 hover:text-gray-400 transition-colors hover:text-purple-500"><ReloadOutlined /></button>
                        <span className="text-[10px] text-gray-800 font-mono ml-2">700ms</span>
                      </div>
                      {/* Follow-up suggestions - only on last AI message */}
                      {idx === messages.length - 1 && (
                        <SuggestionChips onSelect={(s) => { setInput(s); setTimeout(() => send(s), 50); }} />
                      )}
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Loading */}
              {loading && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-gray-600 text-xs flex items-center gap-2">
                    <span>💡</span><span>Thinking...</span>
                  </motion.div>
                  <div className="flex gap-1 ml-2">
                    {[0, 1, 2].map(i => (
                      <motion.div key={i} className="w-1 h-1 bg-gray-600 rounded-full"
                        animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity }} />
                    ))}
                  </div>
                </motion.div>
              )}
              <div ref={endRef} />
            </div>
          )}
        </div>

        {/* Fixed Bottom Input (chat mode only) */}
        {!isStart && (
          <div className="absolute bottom-0 left-0 right-0 px-4 md:px-8 pb-6 pt-10 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/95 to-transparent">
            <div className="max-w-3xl mx-auto">
              <InputBar
                input={input} setInput={setInput} files={files} setFiles={setFiles}
                onSend={send} voiceActive={voiceActive} setVoiceActive={setVoiceActive}
                fileInputRef={fileInputRef} handleFiles={handleFiles}
                onOpenSettings={() => setShowSettings(true)}
              />
            </div>
          </div>
        )}
      </div>

      <input ref={fileInputRef} type="file" className="hidden" multiple accept="image/*,application/pdf" onChange={handleFiles} />

      <style jsx global>{`
        .grok-scroll::-webkit-scrollbar { width: 0px; }
        .prose p { margin-bottom: 0.6rem; }
        .prose h1,.prose h2,.prose h3 { color: white; font-weight: 700; margin-top: 1.2rem; }
        .prose code { background: rgba(255,255,255,0.06); padding: 2px 6px; border-radius: 4px; font-size: 0.8em; }
        .prose pre { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 16px; }
        .prose table { border-collapse: collapse; width: 100%; }
        .prose th, .prose td { border: 1px solid rgba(255,255,255,0.1); padding: 8px 12px; text-align: left; }
        .prose th { background: rgba(255,255,255,0.05); font-weight: 600; }
        [dir="rtl"] { text-align: right; }
      `}</style>
    </div>
  );
}

// ─── Top Bar Button ────────────────────────────────────────────────────────────
function TopBtn({ icon, onClick }: { icon: React.ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick}
      className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/8 text-gray-500 hover:text-white transition-all">
      {icon}
    </button>
  );
}

// ─── Input Bar ────────────────────────────────────────────────────────────────
function InputBar({ input, setInput, files, setFiles, onSend, voiceActive, setVoiceActive, fileInputRef, handleFiles, isStart, onOpenSettings }:
  { input: string; setInput: (v: string) => void; files: FileData[]; setFiles: React.Dispatch<React.SetStateAction<FileData[]>>; onSend: () => void; voiceActive: boolean; setVoiceActive: (v: boolean) => void; fileInputRef: React.RefObject<HTMLInputElement>; handleFiles: (e: React.ChangeEvent<HTMLInputElement>) => void; isStart?: boolean; onOpenSettings?: () => void }) {

  const hasContent = input.trim().length > 0 || files.length > 0;

  return (
    <div className="w-full">
      {/* File Previews */}
      {files.length > 0 && (
        <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
          {files.map((f, i) => (
            <div key={i} className="relative w-14 h-14 rounded-xl overflow-hidden border border-white/10 flex-shrink-0 bg-white/5">
              {f.mimeType.startsWith("image/") ? <img src={f.data} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><FileTextOutlined className="text-blue-400" /></div>}
              <button onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}
                className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <CloseOutlined className="text-[7px] text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Box */}
      <div className="flex items-end gap-2 px-3 py-2 bg-[#1a1a1a] rounded-[50px] border border-white/10 backdrop-blur-xl transition-all focus-within:border-white/20 shadow-2xl">
        <button onClick={() => fileInputRef.current?.click()}
          className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full hover:bg-white/10 text-gray-500 hover:text-white transition-all mb-0.5">
          <PlusOutlined />
        </button>

        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } }}
          placeholder="Ask anything"
          rows={1}
          style={{ resize: "none", minHeight: 36, maxHeight: 120, direction: /[\u0600-\u06FF]/.test(input) ? "rtl" : "ltr" }}
          className="flex-1 bg-transparent border-none outline-none text-white text-[15px] placeholder-gray-600 py-1.5 grok-scroll leading-relaxed overflow-y-auto"
          onInput={e => {
            const el = e.currentTarget;
            el.style.height = "auto";
            el.style.height = Math.min(el.scrollHeight, 120) + "px";
          }}
        />

        <div className="flex items-center gap-1 mb-0.5 flex-shrink-0">
          <button onClick={onOpenSettings} className="px-2 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-gray-500 hover:text-white transition-all gap-1">
            <SettingOutlined className="text-xs" />
            <span className="text-[10px] font-bold uppercase tracking-tight">Settings</span>
          </button>
          <div className="w-[1px] h-4 bg-white/10 mx-1" />
          <button onClick={() => setVoiceActive(!voiceActive)}>
            <VoiceButton active={voiceActive} />
          </button>
          <button onClick={onSend}
            className={cn("w-9 h-9 rounded-full flex items-center justify-center transition-all", 
              hasContent ? "bg-white text-black scale-100" : "bg-white/5 text-gray-700 scale-90")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}


