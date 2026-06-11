"use client";

import React, { useState } from "react";
import { 
  Bot, Shield, FileText, Image as ImageIcon, 
  BrainCircuit, Database, Link as LinkIcon, Settings
} from "lucide-react";
import { toast } from "react-hot-toast";

type AdminBYOKSettings = {
  useCustomKey: boolean;
  customProvider: "gemini" | "openai" | "groq" | "xai";
  customKey: string;
  customModel?: string;
};

export default function AdminAIAgentsPage() {
  const [settings, setSettings] = useState<AdminBYOKSettings>({
    useCustomKey: false,
    customProvider: "gemini",
    customKey: ""
  });
  const [showSettings, setShowSettings] = useState(false);
  const [showProviders, setShowProviders] = useState(false);

  const updateSettings = (newSettings: AdminBYOKSettings) => {
    setSettings(newSettings);
    toast.success("Admin AI settings saved.");
  };

  const agents = [
    {
      id: "quiz-generator",
      name: "Quiz Architect",
      icon: <BrainCircuit className="w-8 h-8 text-indigo-500" />,
      description: "Generate bulk multiple-choice questions from PDFs, text, or lecture transcripts.",
      bg: "bg-indigo-500/10"
    },
    {
      id: "note-summarizer",
      name: "Note Synthesizer",
      icon: <FileText className="w-8 h-8 text-blue-500" />,
      description: "Condense long medical texts into structured, high-yield summary notes.",
      bg: "bg-blue-500/10"
    },
    {
      id: "image-analyzer",
      name: "Vision Specialist",
      icon: <ImageIcon className="w-8 h-8 text-emerald-500" />,
      description: "Analyze medical images, diagrams, and radiological findings.",
      bg: "bg-emerald-500/10"
    },
    {
      id: "curriculum-extractor",
      name: "Curriculum Scraper",
      icon: <LinkIcon className="w-8 h-8 text-amber-500" />,
      description: "Deep scrape Telegram links or university sites to automatically build modules and semesters.",
      bg: "bg-amber-500/10"
    }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen">
      
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold font-outfit text-gray-900 dark:text-white flex items-center gap-3">
            <Bot className="w-8 h-8 text-blue-500" />
            AI Agents Hub
          </h1>
          <p className="text-gray-500 mt-2 max-w-2xl">
            Centralized command center for all MedQs Artificial Intelligence capabilities. 
            Deploy specialized agents to automate content creation and curriculum management.
          </p>
        </div>

        <button 
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center gap-2 bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
        >
          <Settings className="w-4 h-4" />
          Settings
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="mb-8 p-6 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-500" />
            Admin BYOK (Bring Your Own Key)
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            Override the site's default AI keys for your admin tasks. This is useful for heavy scraping or bulk generation tasks to avoid exhausting the main site quota.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center justify-between bg-gray-50 dark:bg-black/40 p-4 rounded-xl border border-gray-200 dark:border-white/5">
              <span className="text-sm font-medium">Enable Admin BYOK</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={settings.useCustomKey} 
                  onChange={(e) => updateSettings({ ...settings, useCustomKey: e.target.checked })} 
                />
                <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {settings.useCustomKey && (
              <>
                <div className="relative">
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Provider</label>
                  <div 
                    onClick={() => setShowProviders(!showProviders)}
                    className="w-full flex items-center justify-between bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
                  >
                    <span>
                      {settings.customProvider === 'gemini' ? 'Google Gemini' : 
                       settings.customProvider === 'openai' ? 'OpenAI (ChatGPT)' : 'Groq (Llama/Grok)'}
                    </span>
                    <svg className={`w-4 h-4 transition-transform ${showProviders ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                  
                  {showProviders && (
                    <div className="absolute z-50 w-full mt-2 bg-card border border-border rounded-xl shadow-2xl overflow-hidden py-1 animate-in fade-in slide-in-from-top-2">
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
                            ${settings.customProvider === provider.id ? 'bg-blue-50/50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'}
                          `}
                        >
                          {provider.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">API Key</label>
                  <input 
                    type="password" 
                    value={settings.customKey}
                    onChange={(e) => updateSettings({ ...settings, customKey: e.target.value })}
                    placeholder="Enter secret key..."
                    className="w-full bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Model ID (Optional)</label>
                  <input 
                    type="text" 
                    value={settings.customModel || ""}
                    onChange={(e) => updateSettings({ ...settings, customModel: e.target.value })}
                    placeholder={settings.customProvider === 'groq' ? "e.g. llama-3.3-70b-versatile" : "e.g. gpt-4o"}
                    className="w-full bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {agents.map((agent) => (
          <div key={agent.id} className="group relative bg-card border border-border/50 rounded-3xl p-6 hover:shadow-xl hover:shadow-blue-500/5 transition-all cursor-pointer overflow-hidden">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${agent.bg.replace('/10', '/30')} blur-3xl opacity-20 rounded-full translate-x-10 -translate-y-10 group-hover:opacity-50 transition-opacity`} />
            
            <div className={`w-16 h-16 rounded-2xl ${agent.bg} flex items-center justify-center mb-6`}>
              {agent.icon}
            </div>
            
            <h3 className="text-xl font-semibold mb-2 font-outfit">{agent.name}</h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              {agent.description}
            </p>

            <button className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 group-hover:underline">
              Launch Agent <Database className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}
