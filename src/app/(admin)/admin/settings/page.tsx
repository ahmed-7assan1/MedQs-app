"use client";
import { useState, useEffect } from "react";
import { Save, Loader2, Megaphone, Palette, ToggleRight } from "lucide-react";
import { ExportPanel } from "@/components/admin/ExportPanel";
import toast from "react-hot-toast";

interface SiteConfig {
  siteName: string; logoUrl: string; faviconUrl: string;
  primaryColor: string; enableAI: boolean; enableForum: boolean;
  enableAds: boolean; enableNotifs: boolean; enableLeaderboard: boolean;
  fontSans: string; fontArabic: string;
}

const DEFAULTS: SiteConfig = {
  siteName: "MedQs", logoUrl: "", faviconUrl: "", primaryColor: "#1a7ef0",
  enableAI: true, enableForum: true, enableAds: true, enableNotifs: true, enableLeaderboard: true,
  fontSans: "Inter", fontArabic: "Cairo",
};

export default function AdminSettingsPage() {
  const [config, setConfig] = useState<SiteConfig>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [broadTitle, setBroadTitle] = useState("");
  const [broadBody, setBroadBody] = useState("");
  const [broadcasting, setBroadcasting] = useState(false);

  useEffect(() => {
    fetch("/api/v1/admin/config").then((r) => r.json())
      .then((d) => { if (d?.siteName) setConfig(d); }).finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/v1/admin/config", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(config) });
    setSaving(false);
    res.ok ? toast.success("Settings saved!") : toast.error("Failed to save");
  }

  async function handleBroadcast() {
    if (!broadTitle || !broadBody) return toast.error("Fill in title and message");
    setBroadcasting(true);
    const res = await fetch("/api/v1/notifications/read-all", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: broadTitle, body: broadBody }) });
    setBroadcasting(false);
    if (res.ok) { const { sent } = await res.json(); toast.success(`Sent to ${sent} users`); setBroadTitle(""); setBroadBody(""); }
    else toast.error("Broadcast failed");
  }

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  const toggles: { key: keyof SiteConfig; label: string; desc: string }[] = [
    { key: "enableAI",          label: "AI Features",   desc: "Student explain button & admin AI tools" },
    { key: "enableForum",       label: "Forum",          desc: "Global and semester forums" },
    { key: "enableAds",         label: "Advertisements", desc: "Show ad banners to students" },
    { key: "enableNotifs",      label: "Notifications",  desc: "In-app notifications" },
    { key: "enableLeaderboard", label: "Leaderboard",    desc: "Student rankings and points board" },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6 space-y-6">
      <div><h1 className="font-display text-3xl font-bold">Site Settings</h1><p className="mt-1 text-sm text-muted-foreground">Branding, features, and integrations</p></div>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-5 flex items-center gap-2"><Palette className="h-5 w-5 text-primary" /><h2 className="font-display text-lg font-semibold">Branding</h2></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">Site name</label>
            <input type="text" value={config.siteName} onChange={(e) => setConfig((c) => ({ ...c, siteName: e.target.value }))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" /></div>
          <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">Primary color</label>
            <div className="flex gap-2">
              <input type="color" value={config.primaryColor} onChange={(e) => setConfig((c) => ({ ...c, primaryColor: e.target.value }))} className="h-9 w-12 cursor-pointer rounded-lg border border-border bg-background p-0.5" />
              <input type="text" value={config.primaryColor} onChange={(e) => setConfig((c) => ({ ...c, primaryColor: e.target.value }))} className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring" />
            </div></div>
          <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">Logo URL</label>
            <input type="url" value={config.logoUrl} onChange={(e) => setConfig((c) => ({ ...c, logoUrl: e.target.value }))} placeholder="https://..." className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" /></div>
          <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">Favicon URL</label>
            <input type="url" value={config.faviconUrl} onChange={(e) => setConfig((c) => ({ ...c, faviconUrl: e.target.value }))} placeholder="https://..." className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" /></div>
          <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">Primary site font</label>
            <select value={config.fontSans} onChange={(e) => setConfig((c) => ({ ...c, fontSans: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              {["Inter", "Roboto", "Lato", "Open Sans", "Poppins"].map((f) => <option key={f} value={f}>{f}</option>)}
            </select></div>
          <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">Arabic font</label>
            <select value={config.fontArabic} onChange={(e) => setConfig((c) => ({ ...c, fontArabic: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              {["Cairo", "Tajawal", "Noto Sans Arabic", "Almarai"].map((f) => <option key={f} value={f}>{f}</option>)}
            </select></div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-5 flex items-center gap-2"><ToggleRight className="h-5 w-5 text-primary" /><h2 className="font-display text-lg font-semibold">Feature Toggles</h2></div>
        <div className="space-y-3">
          {toggles.map(({ key, label, desc }) => {
            const enabled = config[key] as boolean;
            return (
              <div key={key} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                <div><p className="text-sm font-medium">{label}</p><p className="text-xs text-muted-foreground">{desc}</p></div>
                <button onClick={() => setConfig((c) => ({ ...c, [key]: !enabled }))}
                  className={`relative flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? "bg-primary" : "bg-muted"}`}>
                  <span className={`absolute h-4 w-4 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <button onClick={handleSave} disabled={saving}
        className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {saving ? "Saving..." : "Save Settings"}
      </button>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-2"><Megaphone className="h-5 w-5 text-amber-500" /><h2 className="font-display text-lg font-semibold">Broadcast Notification</h2></div>
        <div className="space-y-3">
          <input type="text" value={broadTitle} onChange={(e) => setBroadTitle(e.target.value)} placeholder="Notification title"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          <textarea value={broadBody} onChange={(e) => setBroadBody(e.target.value)} placeholder="Message body..." rows={3}
            className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          <button onClick={handleBroadcast} disabled={broadcasting}
            className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-60 transition-colors">
            {broadcasting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Megaphone className="h-4 w-4" />}
            {broadcasting ? "Sending..." : "Send Broadcast"}
          </button>
        </div>
      </div>

      <ExportPanel />
    </div>
  );
}
