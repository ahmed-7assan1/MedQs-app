"use client";

import { useEffect, useState } from "react";
import { Cpu, Check, Eye, EyeOff, ShieldCheck } from "lucide-react";

interface KeyPreview {
  keyPreview: string;
}

export default function AdminAIKeysPage() {
  const [keys, setKeys] = useState<Record<string, KeyPreview>>({});
  const [editKeys, setEditKeys] = useState<Record<string, string>>({});
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/v1/admin/ai-settings").then(r => r.json()).then(data => {
      if (data?.keys) setKeys(data.keys);
    }).catch(() => setMessage("Failed to load")).finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setMessage("");
    const payload: Record<string, { key: string }> = {};
    for (const [provider, key] of Object.entries(editKeys)) {
      if (key.trim()) payload[provider] = { key: key.trim() };
    }
    try {
      const res = await fetch("/api/v1/admin/ai-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keys: payload }),
      });
      if (res.ok) {
        setMessage("Keys saved successfully!");
        setEditKeys({});
        const data = await fetch("/api/v1/admin/ai-settings").then(r => r.json());
        if (data?.keys) setKeys(data.keys);
      } else {
        setMessage("Failed to save");
      }
    } catch {
      setMessage("Network error");
    } finally {
      setSaving(false);
    }
  }

  const allProviders = Object.keys(keys).sort();

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500">
          <Cpu className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Admin AI Keys</h1>
          <p className="text-sm text-muted-foreground">Manage provider API keys for the entire platform</p>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-3 text-xs font-medium text-muted-foreground flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-blue-500" />
        Keys are encrypted at rest. Only masked previews are shown.
      </div>

      {message && (
        <div className={`rounded-2xl border p-4 text-sm font-medium ${message.includes("success") ? "border-green-500/20 bg-green-500/10 text-green-600" : "border-red-500/20 bg-red-500/10 text-red-600"}`}>
          {message}
        </div>
      )}

      <div className="space-y-3">
        {allProviders.map(provider => {
          const preview = keys[provider]?.keyPreview || "";
          const isVisible = visible[provider];
          return (
            <div key={provider} className="rounded-2xl border bg-card p-5">
              <label className="mb-2 block text-sm font-bold uppercase tracking-widest">
                {provider.charAt(0).toUpperCase() + provider.slice(1)}
              </label>
              {preview && !editKeys[provider] && (
                <div className="mb-2 flex items-center gap-2">
                  <span className="font-mono text-sm text-muted-foreground">{preview}</span>
                  <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-bold text-green-500">Saved</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  type={isVisible ? "text" : "password"}
                  value={editKeys[provider] || ""}
                  onChange={(e) => setEditKeys(prev => ({ ...prev, [provider]: e.target.value }))}
                  placeholder={preview ? "Type new key to replace..." : "Enter API key..."}
                  className="flex-1 rounded-xl border bg-background px-4 py-2.5 font-mono text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button onClick={() => setVisible(prev => ({ ...prev, [provider]: !isVisible }))} className="rounded-xl border p-2.5 hover:bg-muted transition">
                  {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={handleSave}
        disabled={saving || Object.keys(editKeys).length === 0}
        className="flex items-center gap-2 rounded-xl bg-blue-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-600 disabled:opacity-40"
      >
        {saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Check className="h-4 w-4" />}
        {saving ? "Saving..." : "Save All Keys"}
      </button>
    </div>
  );
}
