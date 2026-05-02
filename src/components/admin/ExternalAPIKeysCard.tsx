"use client";

import { useState, useEffect } from "react";
import { KeyRound, Save, Loader2, Sparkles, AudioLines, Image as ImageIcon } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

export function ExternalAPIKeysCard() {
  const [keys, setKeys] = useState({
    stability: "",
    assembly: "",
    uploadcare: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/v1/admin/external-api-keys")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        if (d && typeof d === "object") {
          setKeys({
            stability: d.stability || "",
            assembly: d.assembly || "",
            uploadcare: d.uploadcare || ""
          });
        }
      })
      .catch(() => { /* silently fail — show empty fields */ })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(provider: 'stability' | 'assembly' | 'uploadcare') {
    setSaving(true);
    try {
      const res = await fetch("/api/v1/admin/external-api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, key: keys[provider] }),
      });
      if (!res.ok) throw new Error("Failed to save key");
      toast.success(`${provider.toUpperCase()} key updated!`);
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
    <div className="space-y-4">
      <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-4">External Integrations</h3>
      
      {/* Stability AI */}
      <APIKeyRow 
        icon={Sparkles} 
        label="Stability AI (Visuals)" 
        value={keys.stability} 
        onChange={(v: string) => setKeys(k => ({ ...k, stability: v }))}
        onSave={() => handleSave('stability')}
        busy={saving}
      />

      {/* AssemblyAI */}
      <APIKeyRow 
        icon={AudioLines} 
        label="AssemblyAI (Transcription)" 
        value={keys.assembly} 
        onChange={(v: string) => setKeys(k => ({ ...k, assembly: v }))}
        onSave={() => handleSave('assembly')}
        busy={saving}
      />

      {/* Uploadcare */}
      <APIKeyRow 
        icon={ImageIcon} 
        label="Uploadcare Public Key" 
        value={keys.uploadcare} 
        onChange={(v: string) => setKeys(k => ({ ...k, uploadcare: v }))}
        onSave={() => handleSave('uploadcare')}
        busy={saving}
      />
    </div>
  );
}

function APIKeyRow({ icon: Icon, label, value, onChange, onSave, busy }: any) {
  return (
    <div className="rounded-2xl border border-white/[0.03] bg-white/[0.02] p-4 flex flex-col sm:flex-row sm:items-center gap-4">
       <div className="flex items-center gap-3 min-w-[200px]">
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
             <Icon className="h-5 w-5" />
          </div>
          <span className="text-sm font-bold">{label}</span>
       </div>
       <input 
         type="password"
         value={value}
         onChange={(e) => onChange(e.target.value)}
         placeholder="Enter key..."
         className="flex-1 h-10 rounded-lg bg-background/50 border-white/[0.05] px-4 text-xs font-mono outline-none focus:ring-1 focus:ring-primary/40"
       />
       <button 
         onClick={onSave}
         disabled={busy}
         className="h-10 px-6 rounded-lg bg-primary text-white text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
       >
          {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
          Update
       </button>
    </div>
  );
}
