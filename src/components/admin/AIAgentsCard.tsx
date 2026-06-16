"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, Cpu, KeyRound } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

export function AIAgentsCard() {
  const [config, setConfig] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/v1/admin/ai-agents")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        if (d && typeof d === "object") {
          setConfig(d);
        }
      })
      .catch(() => { /* silently fail */ })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/v1/admin/ai-agents", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error("Failed to save AI Agents config");
      const d = await res.json();
      // Mask keys in UI
      const masked = {
        ...d,
        siliconFlowKey: d.siliconFlowKey ? "••••••••" : null,
        geminiKeyOverride: d.geminiKeyOverride ? "••••••••" : null,
        deepseekKeyOverride: d.deepseekKeyOverride ? "••••••••" : null,
        groqKeyOverride: d.groqKeyOverride ? "••••••••" : null,
        openRouterKeyOverride: d.openRouterKeyOverride ? "••••••••" : null,
        xaiKeyOverride: d.xaiKeyOverride ? "••••••••" : null,
        proxyKeyOverride: d.proxyKeyOverride ? "••••••••" : null,
        anthropicKeyOverride: d.anthropicKeyOverride ? "••••••••" : null,
        openAIKeyOverride: d.openAIKeyOverride ? "••••••••" : null,
      };
      setConfig(masked);
      toast.success("AI Agents configuration updated!");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div className="flex h-32 items-center justify-center">
       <Loader2 className="h-5 w-5 animate-spin text-primary/30" />
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
         <h3 className="text-sm font-bold uppercase tracking-widest text-primary">AI Agents Configuration</h3>
         <button 
           onClick={handleSave}
           disabled={saving}
           className="h-10 px-6 rounded-lg bg-primary text-white text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
         >
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            Save All Agent Settings
         </button>
      </div>

      <div className="space-y-6">
        {/* Preferred Provider */}
        <div className="rounded-2xl border border-border/10 bg-card p-6 space-y-4 shadow-sm border-l-4 border-l-blue-500">
           <div>
              <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">Intelligence Hub</span>
              <h3 className="font-display text-lg font-bold">Preferred AI Provider</h3>
           </div>
           <select
             value={config.aiPreferredProvider || "auto"}
             onChange={(e) => setConfig((c: any) => ({ ...c, aiPreferredProvider: e.target.value }))}
             className="w-full h-11 rounded-xl border border-border/10 bg-background/50 px-4 font-semibold outline-none focus:ring-1 focus:ring-blue-500/40"
           >
              <option value="auto">Auto-Select (Optimized)</option>
              <option value="gemini">Google Gemini Pro</option>
              <option value="openai">OpenAI GPT-4o</option>
              <option value="anthropic">Anthropic Claude</option>
              <option value="deepseek">DeepSeek AI</option>
              <option value="siliconflow">SiliconFlow (DeepSeek-R1)</option>
              <option value="groq">Groq</option>
              <option value="openrouter">OpenRouter</option>
              <option value="xai">xAI Grok</option>
           </select>
           <p className="text-[11px] text-muted-foreground italic leading-relaxed">
              System will automatically fallback if the primary provider is rate-limited or unavailable. Make sure you configure its key below.
           </p>
        </div>

        {/* SiliconFlow */}
        <AgentConfigGroup title="SiliconFlow (DeepSeek-R1)" icon={Cpu}>
           <ConfigRow label="API Key" value={config.siliconFlowKey || ""} onChange={(v: string) => setConfig({ ...config, siliconFlowKey: v })} isPassword />
           <ConfigRow label="Custom URL" value={config.siliconFlowUrl || ""} onChange={(v: string) => setConfig({ ...config, siliconFlowUrl: v })} placeholder="https://api.siliconflow.cn/v1" />
           <ConfigRow label="Model Override" value={config.siliconFlowModel || ""} onChange={(v: string) => setConfig({ ...config, siliconFlowModel: v })} placeholder="deepseek-ai/DeepSeek-R1" />
        </AgentConfigGroup>

        {/* Gemini */}
        <AgentConfigGroup title="Google Gemini" icon={Cpu}>
           <ConfigRow label="API Key Override" value={config.geminiKeyOverride || ""} onChange={(v: string) => setConfig({ ...config, geminiKeyOverride: v })} isPassword />
        </AgentConfigGroup>

        {/* DeepSeek */}
        <AgentConfigGroup title="DeepSeek Official" icon={Cpu}>
           <ConfigRow label="API Key Override" value={config.deepseekKeyOverride || ""} onChange={(v: string) => setConfig({ ...config, deepseekKeyOverride: v })} isPassword />
           <ConfigRow label="Custom URL" value={config.deepseekUrlOverride || ""} onChange={(v: string) => setConfig({ ...config, deepseekUrlOverride: v })} placeholder="https://api.deepseek.com/chat/completions" />
           <ConfigRow label="Model Override" value={config.deepseekModelOverride || ""} onChange={(v: string) => setConfig({ ...config, deepseekModelOverride: v })} placeholder="deepseek-chat" />
        </AgentConfigGroup>

        {/* OpenAI */}
        <AgentConfigGroup title="OpenAI" icon={Cpu}>
           <ConfigRow label="API Key Override" value={config.openAIKeyOverride || ""} onChange={(v: string) => setConfig({ ...config, openAIKeyOverride: v })} isPassword />
           <ConfigRow label="Model Override" value={config.openAIModelOverride || ""} onChange={(v: string) => setConfig({ ...config, openAIModelOverride: v })} placeholder="gpt-4o" />
        </AgentConfigGroup>

        {/* Groq */}
        <AgentConfigGroup title="Groq" icon={Cpu}>
           <ConfigRow label="API Key Override" value={config.groqKeyOverride || ""} onChange={(v: string) => setConfig({ ...config, groqKeyOverride: v })} isPassword />
           <ConfigRow label="Model Override" value={config.groqModelOverride || ""} onChange={(v: string) => setConfig({ ...config, groqModelOverride: v })} placeholder="llama-3.1-70b-versatile" />
        </AgentConfigGroup>

        {/* OpenRouter */}
        <AgentConfigGroup title="OpenRouter" icon={Cpu}>
           <ConfigRow label="API Key Override" value={config.openRouterKeyOverride || ""} onChange={(v: string) => setConfig({ ...config, openRouterKeyOverride: v })} isPassword />
           <ConfigRow label="Model Override" value={config.openRouterModelOverride || ""} onChange={(v: string) => setConfig({ ...config, openRouterModelOverride: v })} placeholder="meta-llama/llama-3.1-8b-instruct:free" />
        </AgentConfigGroup>

        {/* xAI */}
        <AgentConfigGroup title="xAI (Grok)" icon={Cpu}>
           <ConfigRow label="API Key Override" value={config.xaiKeyOverride || ""} onChange={(v: string) => setConfig({ ...config, xaiKeyOverride: v })} isPassword />
           <ConfigRow label="Model Override" value={config.xaiModelOverride || ""} onChange={(v: string) => setConfig({ ...config, xaiModelOverride: v })} placeholder="grok-beta" />
        </AgentConfigGroup>
        
        {/* Anthropic */}
        <AgentConfigGroup title="Anthropic (Claude)" icon={Cpu}>
           <ConfigRow label="API Key Override" value={config.anthropicKeyOverride || ""} onChange={(v: string) => setConfig({ ...config, anthropicKeyOverride: v })} isPassword />
           <ConfigRow label="Model Override" value={config.anthropicModelOverride || ""} onChange={(v: string) => setConfig({ ...config, anthropicModelOverride: v })} placeholder="claude-3-5-sonnet-20241022" />
        </AgentConfigGroup>

      </div>
    </div>
  );
}

function AgentConfigGroup({ title, icon: Icon, children }: any) {
  return (
    <div className="rounded-2xl border border-border/10 bg-white/[0.02] p-5 space-y-4">
      <div className="flex items-center gap-3">
              <div className="h-8 w-1.5 rounded-full bg-primary" />
              <div>
                <h2 className="text-2xl font-black text-foreground tracking-tight">Curriculum</h2>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Available Disciplines</p>
              </div>
            </div>
            {/* @ts-ignore */}
            {children.length === 0 && (
              <p className="text-center text-muted-foreground mt-4">No subjects available for this module.</p>
            )}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
               {children}
            </div>
    </div>
  );
}

function ConfigRow({ label, value, onChange, isPassword, placeholder }: any) {
  return (
    <div className="space-y-1.5">
       <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">{label}</label>
       <input 
         type={isPassword ? "password" : "text"}
         value={value}
         onChange={(e) => onChange(e.target.value)}
         placeholder={placeholder || "Enter value..."}
         className="w-full h-10 rounded-lg bg-background/50 border border-border/10 px-4 text-xs font-mono outline-none focus:ring-1 focus:ring-primary/40"
       />
    </div>
  );
}
