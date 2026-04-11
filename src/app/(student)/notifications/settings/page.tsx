"use client";
import { useState, useEffect } from "react";
import { Bell, BellOff, MessageSquare, Loader2, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface MuteSettings {
  muteAll: boolean;
  muteForum: boolean;
}

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState<MuteSettings>({ muteAll: false, muteForum: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/v1/notifications/mute")
      .then(r => r.json())
      .then(data => {
        if (data) setSettings({ muteAll: data.muteAll ?? false, muteForum: data.muteForum ?? false });
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/v1/notifications/mute", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    if (res.ok) toast.success("Notification settings saved!");
    else toast.error("Failed to save");
  }

  function Toggle({
    label, desc, icon: Icon, value, onChange,
  }: {
    label: string; desc: string; icon: React.ElementType;
    value: boolean; onChange: (v: boolean) => void;
  }) {
    return (
      <div className={cn(
        "flex items-center justify-between rounded-xl border px-5 py-4 transition-colors",
        value ? "border-border bg-muted/30" : "border-border bg-card"
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg",
            value ? "bg-muted" : "bg-primary/10"
          )}>
            <Icon className={cn("h-4 w-4", value ? "text-muted-foreground" : "text-primary")} />
          </div>
          <div>
            <p className="text-sm font-medium">{label}</p>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </div>
        </div>
        <button
          onClick={() => onChange(!value)}
          className={cn(
            "relative flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors",
            value ? "bg-muted-foreground/40" : "bg-primary"
          )}
        >
          <span className={cn(
            "absolute h-4 w-4 rounded-full bg-white shadow transition-transform",
            value ? "translate-x-6" : "translate-x-1"
          )} />
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8 md:px-6">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">Notification Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Control which notifications you receive.</p>
      </div>

      <div className="space-y-3">
        <Toggle
          label="Mute all notifications"
          desc="Turn off all in-app notifications"
          icon={settings.muteAll ? BellOff : Bell}
          value={settings.muteAll}
          onChange={v => setSettings(s => ({ ...s, muteAll: v }))}
        />

        <Toggle
          label="Mute forum notifications"
          desc="Stop getting notified about forum activity"
          icon={MessageSquare}
          value={settings.muteForum}
          onChange={v => setSettings(s => ({ ...s, muteForum: v }))}
        />
      </div>

      {settings.muteAll && (
        <div className="mt-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          All notifications are muted. You won&apos;t see any alerts until you turn this off.
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-6 flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-all active:scale-[0.98]"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {saving ? "Saving..." : "Save Settings"}
      </button>
    </div>
  );
}
