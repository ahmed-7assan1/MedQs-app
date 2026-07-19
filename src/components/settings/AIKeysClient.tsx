"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Loader2, Eye, EyeOff, Key, Save, TestTube, ChevronRight, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import { PROVIDERS, getAllProviderIds, type ProviderId } from "@/lib/providers";

const PROVIDER_LABELS: Record<string, string> = {
  gemini: "Google Gemini",
  openai: "OpenAI",
  anthropic: "Anthropic",
  deepseek: "DeepSeek",
  groq: "Groq",
  openrouter: "OpenRouter",
  xai: "xAI (Grok)",
  mistral: "Mistral AI",
  together: "Together AI",
  huggingface: "Hugging Face",
  cloudflare: "Cloudflare Workers AI",
  cerebras: "Cerebras",
  github: "GitHub Models",
  proxy: "Proxy (Admin Only)",
};

function maskKey(key: string | null): string {
  if (!key) return "";
  if (key.length < 8) return "••••••••";
  return key.slice(0, 4) + "••••" + key.slice(-4);
}

export function AIKeysClient() {
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [keyPreviews, setKeyPreviews] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, boolean | null>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  // Load existing key previews
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/v1/user/ai-settings");
        if (res.ok) {
          const data = await res.json();
          if (data.keys) {
            const previews: Record<string, string> = {};
            for (const [id, val] of Object.entries(data.keys)) {
              previews[id] = (val as any).keyPreview || "";
            }
            setKeyPreviews(previews);
          }
        }
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const handleChange = useCallback((provider: string, value: string) => {
    setKeys(prev => ({ ...prev, [provider]: value }));
    setTestResults(prev => ({ ...prev, [provider]: null }));
  }, []);

  const handleSave = useCallback(async (provider: string) => {
    const key = keys[provider]?.trim();
    if (!key) {
      toast.error("Enter a key to save");
      return;
    }

    setSaving(prev => ({ ...prev, [provider]: true }));
    try {
      const res = await fetch("/api/v1/user/ai-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keys: { [provider]: { key } } }),
      });
      if (!res.ok) throw new Error("Save failed");
      setKeyPreviews(prev => ({ ...prev, [provider]: maskKey(key) }));
      setKeys(prev => {
        const next = { ...prev };
        delete next[provider];
        return next;
      });
      toast.success(`${PROVIDER_LABELS[provider] || provider} key saved`);
    } catch {
      toast.error("Failed to save key");
    }
    setSaving(prev => ({ ...prev, [provider]: false }));
  }, [keys]);

  const handleTest = useCallback(async (provider: string) => {
    const key = keys[provider]?.trim() || keyPreviews[provider];
    if (!key) {
      toast.error("No key to test");
      return;
    }

    setTesting(prev => ({ ...prev, [provider]: true }));
    setTestResults(prev => ({ ...prev, [provider]: null }));
    try {
      const res = await fetch("/api/v1/user/test-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, key }),
      });
      const data = await res.json();
      setTestResults(prev => ({ ...prev, [provider]: data.ok }));
      if (data.ok) {
        toast.success(`${PROVIDER_LABELS[provider] || provider} key valid`);
      } else {
        toast.error(data.error || "Key test failed");
      }
    } catch {
      setTestResults(prev => ({ ...prev, [provider]: false }));
      toast.error("Key test request failed");
    }
    setTesting(prev => ({ ...prev, [provider]: false }));
  }, [keys, keyPreviews]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const providerIds = getAllProviderIds().filter(p => p !== "proxy");

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-12">
      <div className="p-5 rounded-[28px] border border-border bg-card shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-amber-50 dark:bg-amber-500/10 text-amber-500 shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/30">
              BYOK — Bring Your Own Key
            </h4>
            <p className="text-[9px] font-semibold text-slate-400 dark:text-white/20 mt-0.5">
              Keys are encrypted at rest. Only you can use them.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {providerIds.map((id) => {
            const cfg = PROVIDERS[id];
            const displayKey = keys[id]?.trim() || keyPreviews[id] || "";
            const hasKey = !!displayKey;
            const isShowing = showKeys[id];
            const isSaving = saving[id];
            const isTesting = testing[id];
            const testResult = testResults[id];

            return (
              <div
                key={id}
                className="rounded-2xl border border-border/60 bg-black/10 dark:bg-white/5 p-4 space-y-3"
              >
                {/* Provider header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg flex items-center justify-center bg-primary/10 text-primary text-[10px] font-black uppercase">
                      {cfg.name.charAt(0)}
                    </div>
                    <span className="text-xs font-extrabold text-foreground">
                      {cfg.name}
                    </span>
                  </div>
                  {hasKey && (
                    <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500">
                      <CheckCircle2 className="h-3 w-3" />
                      Key set
                    </div>
                  )}
                </div>

                {/* Key input */}
                <div className="relative">
                  <input
                    type={isShowing ? "text" : "password"}
                    value={keys[id] ?? ""}
                    onChange={(e) => handleChange(id, e.target.value)}
                    placeholder={keyPreviews[id] ? "Type new key to replace..." : "Paste your API key..."}
                    className="w-full rounded-xl border border-white/[0.06] bg-black/20 dark:bg-white/5 px-4 py-2.5 pr-20 text-xs font-mono text-foreground outline-none focus:border-primary/40 transition-all placeholder:text-muted-foreground/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKeys(p => ({ ...p, [id]: !p[id] }))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground p-1"
                  >
                    {isShowing ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>

                {/* Actions row */}
                <div className="flex items-center gap-2">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleSave(id)}
                    disabled={!keys[id]?.trim() || isSaving}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary hover:bg-primary/90 text-white text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-40"
                  >
                    {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                    Save
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleTest(id)}
                    disabled={!hasKey || isTesting}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-foreground text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-40 hover:bg-accent"
                  >
                    {isTesting ? <Loader2 className="h-3 w-3 animate-spin" /> : <TestTube className="h-3 w-3" />}
                    Test
                  </motion.button>

                  {/* Test result indicator */}
                  {testResult === true && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 ml-auto">
                      <CheckCircle2 className="h-3 w-3" /> Valid
                    </span>
                  )}
                  {testResult === false && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 ml-auto">
                      <XCircle className="h-3 w-3" /> Invalid
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
