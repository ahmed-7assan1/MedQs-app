"use client";

import { useState, useEffect } from "react";
import { KeyRound, Save, Trash2, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { useConfirm } from "@/contexts/ConfirmContext";
import { cn } from "@/lib/utils";

export function PersonalAIKeyCard() {
  const confirm = useConfirm();
  const [maskedKey, setMaskedKey] = useState<string | null>(null);
  const [hasKey, setHasKey] = useState(false);
  const [inputKey, setInputKey] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/v1/admin/personal-ai-key")
      .then((r) => r.json())
      .then((d) => {
        setHasKey(d.hasKey);
        setMaskedKey(d.maskedKey);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    if (!inputKey.trim()) return toast.error("Please enter an API key");
    if (!inputKey.trim().startsWith("AIza")) return toast.error("Gemini keys usually start with AIza");
    setSaving(true);
    try {
      const res = await fetch("/api/v1/admin/personal-ai-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: inputKey.trim() }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      toast.success("Personal API key saved successfully ✅");
      setHasKey(true);
      setMaskedKey(`${"•".repeat(Math.max(0, inputKey.trim().length - 6))}${inputKey.trim().slice(-6)}`);
      setInputKey("");
      setShowInput(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to save key");
    } finally {
      setSaving(false);
    }
  }

  async function handleClear() {
    const ok = await confirm({
      title: "Remove API Key",
      message: "Are you sure you want to remove your personal API key? The system will revert to the default shared key.",
      confirmLabel: "Remove",
      variant: "danger"
    });
    if (!ok) return;
    setSaving(true);
    try {
      const res = await fetch("/api/v1/admin/personal-ai-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "" }),
      });
      if (!res.ok) throw new Error("Failed to delete key");
      toast.success("Personal API key removed");
      setHasKey(false);
      setMaskedKey(null);
      setInputKey("");
      setShowInput(false);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={cn(
      "rounded-2xl border p-6 space-y-4 backdrop-blur-sm shadow-sm",
      "bg-card border-black/5 dark:bg-white/5 dark:border-white/10"
    )}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-violet-500/10 ring-1 ring-violet-500/20">
          <KeyRound className="h-5 w-5 text-violet-500 dark:text-violet-400" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground dark:text-white text-[15px]">Personal Gemini API Key</h3>
          <p className="text-xs text-muted-foreground dark:text-white/50 mt-0.5">
            Your key will be prioritized over the system default key.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground dark:text-white/40 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading...
        </div>
      ) : hasKey ? (
        /* Key exists — show status */
        <div className="space-y-3">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
            <span className="text-sm text-emerald-600 dark:text-emerald-300 font-mono flex-1 truncate">{maskedKey}</span>
            <span className="text-[11px] text-emerald-500/70 shrink-0">Active</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowInput(!showInput)}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium bg-muted hover:bg-muted/80 dark:bg-white/8 dark:hover:bg-white/12 text-foreground dark:text-white transition-all"
            >
              <KeyRound className="h-4 w-4" />
              Change Key
            </button>
            <button
              onClick={handleClear}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 transition-all"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        /* No key — show add prompt */
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/30 dark:bg-white/5 border border-black/5 dark:border-white/10">
          <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
          <span className="text-sm text-muted-foreground dark:text-white/50">No personal key - using default system key</span>
          <button
            onClick={() => setShowInput(true)}
            className="ml-auto text-xs text-violet-500 hover:text-violet-400 font-bold transition-colors"
          >
            Add
          </button>
        </div>
      )}

      {/* Input Section */}
      {showInput && (
        <div className="space-y-3 pt-1 animate-in slide-in-from-top-2 duration-300">
          <div className="relative">
            <input
              type={visible ? "text" : "password"}
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="AIzaSy..."
              className={cn(
                "w-full rounded-xl px-4 py-3 text-sm outline-none font-mono transition-all pr-12 border",
                "bg-muted/50 border-black/5 dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder:text-white/30",
                "focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30"
              )}
            />
            <button
              type="button"
              onClick={() => setVisible(!visible)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground dark:hover:text-white/70 transition-colors"
            >
              {visible ? <EyeOff className="h-4 w-4" /> : <KeyRound className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground/60 dark:text-white/30">
            Get a free key from{" "}
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-violet-500 hover:underline font-bold"
            >
              Google AI Studio
            </a>
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !inputKey.trim()}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white transition-all shadow-md shadow-violet-500/20"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Key
            </button>
            <button
              onClick={() => { setShowInput(false); setInputKey(""); }}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:text-white dark:hover:bg-white/8 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
