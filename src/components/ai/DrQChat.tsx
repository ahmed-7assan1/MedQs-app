"use client";

import React, { useState, useRef, useEffect } from "react";
import { useDrQChat, BYOKSettings } from "@/hooks/useDrQChat";
import { Send, Settings, Paperclip, X, Image as ImageIcon, FileText, Trash2, Shield, Zap, Check, AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function DrQChat() {
  const { messages, loading, sendMessage, settings, updateSettings, limits, clearChat } = useDrQChat();
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<Array<{ data: string; mimeType: string; name: string }>>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showProviders, setShowProviders] = useState(false);
  
  const endRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = () => {
    if (!input.trim() && files.length === 0) return;
    sendMessage(input, files);
    setInput("");
    setFiles([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected) return;

    if (files.length + selected.length > 3) {
      alert("You can only attach a maximum of 3 files at a time.");
      return;
    }

    Array.from(selected).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const data = ev.target?.result as string;
        setFiles(prev => [...prev, { data, mimeType: file.type, name: file.name }]);
      };
      reader.readAsDataURL(file);
    });
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className={`flex flex-col relative h-[calc(100dvh-70px)] md:h-[calc(100vh-100px)] w-full mx-auto bg-transparent ${settings.theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
      
      {/* Header */}
      <div className="flex justify-between items-center py-3 md:py-4 px-4 md:px-6 border-b border-gray-200/20 backdrop-blur-md md:rounded-t-3xl bg-white/5 sticky top-0 z-20">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-lg md:text-xl shadow-lg shadow-blue-500/30">
            Q
          </div>
          <div className="min-w-0">
            <h2 className="text-base md:text-xl font-black font-outfit truncate">Dr. Q Assistant</h2>
            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
              Online
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {settings.useCustomKey && (
            <div className="hidden sm:flex items-center gap-1.5 mr-2 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-medium">
              <Shield className="w-3.5 h-3.5" />
              BYOK Active
            </div>
          )}
          
          {/* Quota Dashboard Icon */}
          <div className="relative group">
            <button className="p-2.5 rounded-full hover:bg-gray-500/10 transition-colors text-gray-400">
              <Zap className="w-5 h-5" />
            </button>
            <div className="absolute right-0 top-full mt-2 w-48 p-4 bg-[#1e1d24] border border-white/10 rounded-2xl shadow-2xl invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all z-50">
              <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 tracking-widest">Usage Stats</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                    <span>MESSAGES</span>
                    <span>{limits.used} / {limits.limit === -1 ? '∞' : limits.limit}</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${limits.limit === -1 ? 0 : (limits.used/limits.limit)*100}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                    <span>FILES</span>
                    <span>{limits.filesUsed} / {limits.fileLimit === -1 ? '∞' : limits.fileLimit}</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${limits.fileLimit === -1 ? 0 : (limits.filesUsed/limits.fileLimit)*100}%` }}></div>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-[9px] text-gray-600 text-center italic">Resets daily at 00:00 UTC</p>
            </div>
          </div>

          <button onClick={() => setShowSettings(!showSettings)} className="p-2.5 rounded-full hover:bg-gray-500/10 transition-colors text-gray-400 hover:text-blue-500">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-6 bg-white/10 backdrop-blur-xl border-b border-gray-200/20 shadow-inner z-10">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold font-outfit flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-500" />
              AI Preferences
            </h3>
            <button onClick={clearChat} className="text-xs flex items-center gap-1 text-red-400 hover:text-red-300 transition-colors bg-red-400/10 px-3 py-1.5 rounded-full font-medium">
              <Trash2 className="w-3.5 h-3.5" /> Clear Chat
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-black/20 p-3 rounded-xl border border-white/5">
                <div>
                  <div className="text-sm font-medium flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    Bring Your Own Key (BYOK)
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">Use your own API key to bypass site limits.</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={settings.useCustomKey} onChange={(e) => updateSettings({ ...settings, useCustomKey: e.target.checked })} />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              {settings.useCustomKey && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="relative">
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Provider</label>
                    <div 
                      onClick={() => setShowProviders(!showProviders)}
                      className="w-full flex items-center justify-between bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-sm cursor-pointer hover:bg-black/40 transition-all text-white"
                    >
                      <span>
                        {settings.customProvider === 'gemini' ? 'Google Gemini' : 
                         settings.customProvider === 'openai' ? 'OpenAI (ChatGPT)' : 'Groq (Llama/Grok)'}
                      </span>
                      <svg className={`w-4 h-4 transition-transform ${showProviders ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                    
                    {showProviders && (
                      <div className="absolute z-50 w-full mt-2 bg-[#1e1d24] border border-white/10 rounded-xl shadow-2xl overflow-hidden py-1 animate-in fade-in slide-in-from-top-2">
                        {[
                          { id: 'gemini', name: 'Google Gemini' },
                          { id: 'openai', name: 'OpenAI (ChatGPT)' },
                          { id: 'groq', name: 'Groq (Llama/Grok)' },
                          { id: 'xai', name: 'xAI Grok' }
                        ].map(provider => (
                          <div 
                            key={provider.id}
                            onClick={() => {
                              updateSettings({ ...settings, customProvider: provider.id as any });
                              setShowProviders(false);
                            }}
                            className={`px-4 py-2.5 text-sm cursor-pointer transition-colors flex items-center justify-between
                              ${settings.customProvider === provider.id ? 'bg-blue-500/20 text-blue-400' : 'text-gray-300 hover:bg-white/5'}
                            `}
                          >
                            {provider.name}
                            {settings.customProvider === provider.id && <Zap className="w-3.5 h-3.5" />}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">API Key (Stored locally)</label>
                    <input 
                      type="password" 
                      value={settings.customKey}
                      onChange={(e) => updateSettings({ ...settings, customKey: e.target.value })}
                      placeholder="sk-..."
                      className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Model ID (Optional)</label>
                    <input 
                      type="text" 
                      value={settings.customModel || ""}
                      onChange={(e) => updateSettings({ ...settings, customModel: e.target.value })}
                      placeholder={settings.customProvider === 'groq' ? "e.g. llama-3.3-70b-versatile" : "e.g. gpt-4o"}
                      className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-widest">Font Size</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="range" min="12" max="24" 
                    value={settings.fontSize}
                    onChange={(e) => updateSettings({ ...settings, fontSize: parseInt(e.target.value) })}
                    className="flex-1 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <span className="text-xs text-blue-400 w-8">{settings.fontSize}px</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-widest">User Bubble Color</label>
                <div className="flex flex-wrap gap-2">
                  {['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#10b981', '#64748b'].map(color => (
                    <button 
                      key={color}
                      onClick={() => updateSettings({ ...settings, userBubbleColor: color })}
                      className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${settings.userBubbleColor === color ? 'border-white scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <div className="relative group/color">
                    <input 
                      type="color" 
                      value={settings.userBubbleColor}
                      onChange={(e) => updateSettings({ ...settings, userBubbleColor: e.target.value })}
                      className="opacity-0 absolute inset-0 w-7 h-7 cursor-pointer z-10"
                    />
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-gray-700 to-gray-500 border border-white/20 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-widest">AI Bubble Color</label>
                <div className="flex flex-wrap gap-2">
                  {['#1e1d24', '#2d2b36', '#1a365d', '#1c4532', '#451a03', '#1e293b'].map(color => (
                    <button 
                      key={color}
                      onClick={() => updateSettings({ ...settings, aiBubbleColor: color })}
                      className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${settings.aiBubbleColor === color ? 'border-white scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 md:py-8 space-y-6 md:space-y-8 scroll-smooth pb-40">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-40 space-y-6 px-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-500/10 to-indigo-600/10 flex items-center justify-center border border-white/5 shadow-2xl">
              <Zap className="w-12 h-12 text-blue-500 animate-pulse" />
            </div>
            <div>
              <h3 className="text-2xl font-black tracking-tight text-white html[data-theme='light']:text-slate-900 italic">Clinical Intel Engaged</h3>
              <p className="text-sm font-medium mt-3 leading-relaxed max-w-[280px]">Ask me any medical query, upload labs for analysis, or request a practice exam sequence.</p>
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`flex group ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] relative ${m.role === 'user' ? 'px-5 py-3.5 rounded-2xl rounded-tr-sm shadow-md' : 'rounded-2xl'}`}>
                
                {/* Message Actions */}
                <div className={`absolute top-0 ${m.role === 'user' ? 'right-full mr-2' : 'left-full ml-2'} invisible group-hover:visible flex gap-1 opacity-0 group-hover:opacity-100 transition-all`}>
                  <button 
                    onClick={() => navigator.clipboard.writeText(m.content)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-500 hover:text-blue-400 transition-all"
                    title="Copy"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => setInput(`> ${m.content.slice(0, 50)}...\n\n`)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-500 hover:text-blue-400 transition-all"
                    title="Reply"
                  >
                    <Send className="w-3.5 h-3.5 rotate-180" />
                  </button>
                </div>

                <div 
                  className={`p-4 rounded-2xl ${m.role === 'user' ? '' : 'border border-white/5 shadow-sm'}`}
                  style={{ 
                    backgroundColor: m.role === 'user' ? settings.userBubbleColor : settings.aiBubbleColor,
                    fontSize: `${settings.fontSize}px`,
                    color: m.role === 'user' ? '#fff' : undefined
                  }}
                >
                  {m.files && m.files.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {m.files.map((f, i) => (
                        <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/20 text-[10px] font-medium border border-white/10">
                          {f.mimeType.startsWith("image/") ? <ImageIcon className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                          {f.name}
                        </div>
                      ))}
                    </div>
                  )}
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-black/30 prose-pre:border prose-pre:border-white/5 prose-table:border prose-table:border-white/10 prose-th:px-3 prose-th:py-2 prose-td:px-3 prose-td:py-2"
                    components={{
                      p: ({ children }) => {
                        const content = React.Children.toArray(children).join("");
                        if (content.includes(":::question")) {
                          try {
                            const jsonStr = content.split(":::question")[1].split(":::")[0].trim();
                            const q = JSON.parse(jsonStr);
                            return <QuestionCard q={q} />;
                          } catch (e) {
                            return <p className="mb-2 last:mb-0">{children}</p>;
                          }
                        }
                        return <p className="mb-2 last:mb-0">{children}</p>;
                      },
                      code: ({ node, className, children, ...props }) => {
                        const content = String(children);
                        if (content.includes(':::question')) {
                           try {
                            const jsonStr = content.split(":::question")[1].split(":::")[0].trim();
                            const q = JSON.parse(jsonStr);
                            return <QuestionCard q={q} />;
                          } catch (e) {
                            return <code className={className} {...props}>{children}</code>;
                          }
                        }
                        return <code className={className} {...props}>{children}</code>;
                      }
                    }}
                  >
                    {m.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="text-gray-500 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input Area (Mobile Optimized & Immersive) */}
      <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 w-full max-w-5xl px-3 md:px-8">
        <div className="bg-white/10 dark:bg-[#0f111a]/80 backdrop-blur-3xl border border-gray-200/20 dark:border-white/5 rounded-[28px] md:rounded-3xl p-1.5 md:p-2 shadow-2xl shadow-black/40">
          
          {/* Attached Files Preview */}
          {files.length > 0 && (
            <div className="flex gap-2 p-2 mb-2 overflow-x-auto border-b border-white/5 no-scrollbar">
              {files.map((f, i) => (
                <div key={i} className="relative group flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-black/40 border border-white/10 flex flex-col items-center justify-center shadow-lg">
                  {f.mimeType.startsWith('image/') ? (
                    <img src={f.data} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <FileText className="w-6 h-6 text-blue-400" />
                  )}
                  <button onClick={() => removeFile(i)} className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-1 px-1 pb-1">
            <button onClick={() => fileInputRef.current?.click()} className="p-3.5 rounded-2xl hover:bg-white/5 active:bg-white/10 transition-all text-gray-500 dark:text-gray-400 flex-shrink-0">
              <Paperclip className="w-5 h-5" />
            </button>
            <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*,application/pdf" onChange={handleFileChange} />
            
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Query Dr. Q..."
              className="flex-1 max-h-32 bg-transparent border-none focus:ring-0 resize-none py-3.5 px-2 text-[15px] outline-none text-gray-900 dark:text-white placeholder-gray-500 font-medium"
              rows={1}
              style={{ minHeight: '44px' }}
            />
            
            <button 
              onClick={handleSend}
              disabled={loading || (!input.trim() && files.length === 0)}
              className="p-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white transition-all flex-shrink-0 disabled:opacity-20 disabled:scale-95 mb-0.5 shadow-lg shadow-blue-600/20 active:scale-90"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-Components ──────────────────────────────────────────────────────────

function QuestionCard({ q }: { q: { question: string, options: string[], answer: string, explanation?: string } }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const isCorrect = selected === q.answer;

  return (
    <div className="my-6 p-5 rounded-2xl bg-white/5 border border-white/10 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
          <Zap className="w-4 h-4 text-blue-500" />
        </div>
        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Practice Question</span>
      </div>
      
      <h3 className="text-base font-semibold mb-6 leading-snug">{q.question}</h3>
      
      <div className="space-y-3">
        {q.options.map((opt, i) => (
          <button
            key={i}
            disabled={selected !== null}
            onClick={() => setSelected(opt)}
            className={`w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center justify-between group
              ${selected === null ? 'bg-black/20 border-white/5 hover:border-blue-500/50 hover:bg-blue-500/5' : 
                opt === q.answer ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' :
                selected === opt ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-black/10 border-white/5 opacity-50'}
            `}
          >
            <span className="text-sm">{opt}</span>
            {selected !== null && opt === q.answer && <Check className="w-4 h-4" />}
            {selected === opt && opt !== q.answer && <AlertCircle className="w-4 h-4" />}
          </button>
        ))}
      </div>

      {selected !== null && (
        <div className="mt-6 animate-in slide-in-from-top-2">
          <div className={`p-4 rounded-xl border ${isCorrect ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
            <div className="flex items-center gap-2 mb-2">
              {isCorrect ? <Check className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-red-500" />}
              <span className={`text-sm font-bold ${isCorrect ? 'text-emerald-500' : 'text-red-500'}`}>
                {isCorrect ? 'Correct Answer!' : 'Incorrect'}
              </span>
            </div>
            {q.explanation && (
              <p className="text-xs text-gray-400 leading-relaxed">{q.explanation}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
