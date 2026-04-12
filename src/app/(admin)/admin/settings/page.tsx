"use client";
import { useState, useEffect, useRef } from "react";
import { Save, Loader2, Megaphone, Palette, ToggleRight, Upload } from "lucide-react";
import { ExportPanel } from "@/components/admin/ExportPanel";
import { uploadFiles } from "@/lib/uploadthing-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { extractApproximatePrimaryHex } from "@/lib/branding-extract-color";
import { MedqsSelect } from "@/components/ui/MedqsSelect";

function uploadthingAppId(): string {
  return (process.env.NEXT_PUBLIC_UPLOADTHING_APP_ID ?? "").trim();
}

function urlFromUt(file: { url?: string; ufsUrl?: string } | undefined): string | null {
  if (!file) return null;
  const u = file.url ?? file.ufsUrl;
  return typeof u === "string" && u.length > 0 ? u : null;
}

interface SiteConfig {
  siteName: string;
  logoUrl: string;
  /** Browser tab / bookmark (small). */
  faviconUrl: string;
  /** Square asset for PWA install & Apple touch; falls back to favicon if empty. */
  pwaIconUrl: string;
  primaryColor: string; enableAI: boolean; enableForum: boolean;
  enableAds: boolean; enableNotifs: boolean; enableLeaderboard: boolean;
  aiPreferredProvider: "auto" | "gemini" | "openai" | "anthropic" | "deepseek";
  fontSans: string; fontArabic: string;
}

const DEFAULTS: SiteConfig = {
  siteName: "MedQs", logoUrl: "", faviconUrl: "", pwaIconUrl: "", primaryColor: "#0d9488",
  enableAI: true, enableForum: true, enableAds: true, enableNotifs: true, enableLeaderboard: true,
  aiPreferredProvider: "auto",
  fontSans: "Plus Jakarta Sans", fontArabic: "Tajawal",
};

export default function AdminSettingsPage() {
  const [config, setConfig] = useState<SiteConfig>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [iconUploading, setIconUploading] = useState(false);
  const [pwaIconUploading, setPwaIconUploading] = useState(false);
  const [colorFromFileBusy, setColorFromFileBusy] = useState(false);
  const logoFileRef = useRef<HTMLInputElement>(null);
  const iconFileRef = useRef<HTMLInputElement>(null);
  const pwaIconFileRef = useRef<HTMLInputElement>(null);
  const colorPickFileRef = useRef<HTMLInputElement>(null);
  const [broadTitle, setBroadTitle] = useState("");
  const [broadBody, setBroadBody] = useState("");
  const [broadcasting, setBroadcasting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [cfgRes, meRes] = await Promise.all([
          fetch("/api/v1/admin/config"),
          fetch("/api/v1/auth/me"),
        ]);
        const d = await cfgRes.json();
        if (!cancelled && d?.siteName) {
          setConfig({
            ...DEFAULTS,
            ...d,
            pwaIconUrl: typeof d.pwaIconUrl === "string" ? d.pwaIconUrl : "",
          });
        }
        if (meRes.ok) {
          const me = await meRes.json();
          if (!cancelled && typeof me?.role === "string") setUserRole(me.role);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function persistConfig(payload: SiteConfig): Promise<boolean> {
    const res = await fetch("/api/v1/admin/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.ok;
  }

  async function handleSave() {
    setSaving(true);
    const ok = await persistConfig(config);
    setSaving(false);
    ok ? toast.success("Settings saved!") : toast.error("Failed to save");
  }

  async function uploadSiteImage(file: File): Promise<string | null> {
    if (uploadthingAppId()) {
      const uploaded = await uploadFiles("siteLogo", { files: [file] });
      return urlFromUt(uploaded[0]);
    }
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "site");
    const res = await fetch("/api/v1/upload/direct", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(typeof data?.error === "string" ? data.error : "Upload failed");
      return null;
    }
    return typeof data.url === "string" ? data.url : null;
  }

  async function handleSiteLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !canManageBranding) return;
    setLogoUploading(true);
    try {
      const url = await uploadSiteImage(file);
      if (!url) {
        toast.error("Upload finished but no URL was returned");
        return;
      }
      const hex = await extractApproximatePrimaryHex(file);
      const next = { ...config, logoUrl: url, ...(hex ? { primaryColor: hex } : {}) };
      setConfig(next);
      const saved = await persistConfig(next);
      if (saved) toast.success(hex ? "Logo saved — primary color updated from image" : "Site logo updated and saved");
      else toast.error("Logo uploaded but saving settings failed — use Save");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Logo upload failed");
    } finally {
      setLogoUploading(false);
    }
  }

  async function handleSiteIconFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !canManageBranding) return;
    setIconUploading(true);
    try {
      const url = await uploadSiteImage(file);
      if (!url) {
        toast.error("Upload finished but no URL was returned");
        return;
      }
      const hex = await extractApproximatePrimaryHex(file);
      const next = { ...config, faviconUrl: url, ...(hex ? { primaryColor: hex } : {}) };
      setConfig(next);
      const saved = await persistConfig(next);
      if (saved) toast.success(hex ? "Favicon saved — primary color updated from image" : "Favicon updated and saved");
      else toast.error("Icon uploaded but saving failed — use Save");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Icon upload failed");
    } finally {
      setIconUploading(false);
    }
  }

  async function handlePwaIconFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !canManageBranding) return;
    setPwaIconUploading(true);
    try {
      const url = await uploadSiteImage(file);
      if (!url) {
        toast.error("Upload finished but no URL was returned");
        return;
      }
      const next = { ...config, pwaIconUrl: url };
      setConfig(next);
      const saved = await persistConfig(next);
      if (saved) toast.success("PWA / home screen icon saved");
      else toast.error("Upload OK but save failed — click Save");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "PWA icon upload failed");
    } finally {
      setPwaIconUploading(false);
    }
  }

  async function handleColorFromImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setColorFromFileBusy(true);
    try {
      const hex = await extractApproximatePrimaryHex(file);
      if (!hex) {
        toast.error("Could not read a color from this image");
        return;
      }
      setConfig((c) => ({ ...c, primaryColor: hex }));
      toast.success("Primary color set from image — click Save to apply");
    } finally {
      setColorFromFileBusy(false);
    }
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

  const isSuperAdmin = userRole === "SUPER_ADMIN";
  const canManageBranding = userRole === "ADMIN" || userRole === "SUPER_ADMIN";

  const toggles: { key: keyof SiteConfig; label: string; desc: string }[] = [
    { key: "enableAI",          label: "AI Features",   desc: "Student explain button & admin AI tools" },
    { key: "enableForum",       label: "Community",      desc: "Global and semester discussions" },
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
            <div className="flex flex-wrap gap-2">
              <input type="color" value={config.primaryColor} onChange={(e) => setConfig((c) => ({ ...c, primaryColor: e.target.value }))} className="h-9 w-12 cursor-pointer rounded-lg border border-border bg-background p-0.5" />
              <input type="text" value={config.primaryColor} onChange={(e) => setConfig((c) => ({ ...c, primaryColor: e.target.value }))} className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring" />
              <input
                ref={colorPickFileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleColorFromImageFile}
              />
              <button
                type="button"
                disabled={colorFromFileBusy}
                onClick={() => colorPickFileRef.current?.click()}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs font-medium hover:bg-muted disabled:opacity-60"
                title="Pick average color from an image file"
              >
                {colorFromFileBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Palette className="h-3.5 w-3.5" />}
                From image
              </button>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">Uploading a logo or app icon also suggests this color automatically.</p>
          </div>
          <div className="sm:col-span-2 space-y-2">
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Header logo (wide)</label>
            <p className="text-[11px] text-muted-foreground -mt-1 mb-2">
              Shown in the site header and landing page. Admins can upload or paste a URL. Prefer a horizontal logo; PNG or WebP with transparent background works well.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                type="url"
                value={config.logoUrl}
                onChange={(e) => setConfig((c) => ({ ...c, logoUrl: e.target.value }))}
                placeholder="https://..."
                readOnly={!canManageBranding}
                title={!canManageBranding ? "Admin access required" : undefined}
                className={cn(
                  "min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring",
                  !canManageBranding && "cursor-not-allowed bg-muted/40 text-muted-foreground"
                )}
              />
              {canManageBranding ? (
                <>
                  <input
                    ref={logoFileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleSiteLogoFile}
                  />
                  <button
                    type="button"
                    disabled={logoUploading}
                    onClick={() => logoFileRef.current?.click()}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-border bg-muted/40 px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-60"
                  >
                    {logoUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {logoUploading ? "Uploading…" : "Upload"}
                  </button>
                </>
              ) : null}
            </div>
            {config.logoUrl?.trim() ? (
              <div className="flex items-center gap-3 pt-1">
                <span className="text-[11px] text-muted-foreground">Preview</span>
                <img
                  src={config.logoUrl.trim()}
                  alt=""
                  className="h-12 max-h-14 w-auto max-w-[min(100%,12rem)] object-contain object-left"
                />
              </div>
            ) : null}
          </div>
          <div className="sm:col-span-2 space-y-2">
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Favicon (browser tab)</label>
            <p className="text-[11px] text-muted-foreground -mt-1 mb-2">
              Small icon for tabs and bookmarks. Optional if you only set the PWA icon below.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                type="url"
                value={config.faviconUrl}
                onChange={(e) => setConfig((c) => ({ ...c, faviconUrl: e.target.value }))}
                placeholder="https://..."
                readOnly={!canManageBranding}
                className={cn(
                  "min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring",
                  !canManageBranding && "cursor-not-allowed bg-muted/40 text-muted-foreground"
                )}
              />
              {canManageBranding ? (
                <>
                  <input
                    ref={iconFileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleSiteIconFile}
                  />
                  <button
                    type="button"
                    disabled={iconUploading}
                    onClick={() => iconFileRef.current?.click()}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-border bg-muted/40 px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-60"
                  >
                    {iconUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {iconUploading ? "Uploading…" : "Upload favicon"}
                  </button>
                </>
              ) : null}
            </div>
            {config.faviconUrl?.trim() ? (
              <div className="flex items-center gap-3 pt-1">
                <span className="text-[11px] text-muted-foreground">Preview</span>
                <img src={config.faviconUrl.trim()} alt="" className="h-8 w-8 rounded border border-border object-cover bg-muted/30" />
              </div>
            ) : null}
          </div>
          <div className="sm:col-span-2 space-y-2">
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">PWA / install icon (square)</label>
            <p className="text-[11px] text-muted-foreground -mt-1 mb-2">
              Used for <strong className="font-medium text-foreground">Add to Home Screen</strong>, Apple touch icon, and manifest. Prefer{" "}
              <strong className="font-medium text-foreground">512×512</strong> PNG with safe padding (maskable).
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                type="url"
                value={config.pwaIconUrl}
                onChange={(e) => setConfig((c) => ({ ...c, pwaIconUrl: e.target.value }))}
                placeholder="https://..."
                readOnly={!canManageBranding}
                className={cn(
                  "min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring",
                  !canManageBranding && "cursor-not-allowed bg-muted/40 text-muted-foreground"
                )}
              />
              {canManageBranding ? (
                <>
                  <input
                    ref={pwaIconFileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handlePwaIconFile}
                  />
                  <button
                    type="button"
                    disabled={pwaIconUploading}
                    onClick={() => pwaIconFileRef.current?.click()}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-border bg-muted/40 px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-60"
                  >
                    {pwaIconUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {pwaIconUploading ? "Uploading…" : "Upload PWA icon"}
                  </button>
                </>
              ) : null}
            </div>
            {(config.pwaIconUrl || config.faviconUrl)?.trim() ? (
              <div className="flex items-center gap-3 pt-1">
                <span className="text-[11px] text-muted-foreground">Install preview</span>
                <img
                  src={(config.pwaIconUrl || config.faviconUrl).trim()}
                  alt=""
                  className="h-16 w-16 rounded-2xl border border-border object-cover bg-muted/30"
                />
              </div>
            ) : null}
          </div>
          <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">Primary site font</label>
            <MedqsSelect
              value={config.fontSans}
              onChange={(e) => setConfig((c) => ({ ...c, fontSans: e.target.value }))}
              className="w-full"
            >
              {["Plus Jakarta Sans", "Inter", "Roboto", "Lato", "Open Sans", "Poppins"].map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </MedqsSelect></div>
          <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">Arabic font</label>
            <MedqsSelect
              value={config.fontArabic}
              onChange={(e) => setConfig((c) => ({ ...c, fontArabic: e.target.value }))}
              className="w-full"
            >
              {["Cairo", "Tajawal", "Noto Sans Arabic", "Almarai"].map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </MedqsSelect></div>
        </div>
      </div>

      {isSuperAdmin ? (
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-5 flex items-center gap-2"><ToggleRight className="h-5 w-5 text-primary" /><h2 className="font-display text-lg font-semibold">Feature Toggles</h2></div>
        <div className="mb-4 rounded-lg border border-border bg-background p-4">
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Global AI provider preference</label>
          <MedqsSelect
            value={config.aiPreferredProvider}
            onChange={(e) =>
              setConfig((c) => ({
                ...c,
                aiPreferredProvider: e.target.value as SiteConfig["aiPreferredProvider"],
              }))
            }
            className="w-full"
          >
            <option value="auto">Auto (recommended)</option>
            <option value="gemini">Gemini</option>
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
            <option value="deepseek">DeepSeek</option>
          </MedqsSelect>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Applied across all AI features. If unavailable or rate-limited, the app falls back automatically.
          </p>
        </div>
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
      ) : null}

      <button onClick={handleSave} disabled={saving}
        className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {saving ? "Saving..." : "Save Settings"}
      </button>

      {isSuperAdmin ? (
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
      ) : null}

      <ExportPanel />
    </div>
  );
}
