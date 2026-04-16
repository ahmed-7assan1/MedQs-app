"use client";
import { useState, useEffect, useRef } from "react";
import { Save, Loader2, Megaphone, Palette, ToggleRight, Upload, Settings, Globe, Layers, Plus } from "lucide-react";
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
  logoUrlDark: string;
  /** Browser tab / bookmark (small). */
  faviconUrl: string;
  /** Square asset for PWA install & Apple touch; falls back to favicon if empty. */
  pwaIconUrl: string;
  primaryColor: string; enableAI: boolean; enableForum: boolean;
  enableAds: boolean; enableNotifs: boolean; enableLeaderboard: boolean;
  aiPreferredProvider: "auto" | "gemini" | "openai" | "anthropic" | "deepseek";
  fontSans: string; fontArabic: string;
  facebookUrl?: string; twitterUrl?: string; youtubeUrl?: string;
  instagramUrl?: string; telegramUrl?: string; whatsappUrl?: string;
  hulkLogoUrl?: string;
}

const DEFAULTS: SiteConfig = {
  siteName: "MedQs", logoUrl: "", logoUrlDark: "", faviconUrl: "", pwaIconUrl: "", primaryColor: "#0d9488",
  enableAI: true, enableForum: true, enableAds: true, enableNotifs: true, enableLeaderboard: true,
  aiPreferredProvider: "auto",
  fontSans: "Plus Jakarta Sans", fontArabic: "Tajawal",
  facebookUrl: "", twitterUrl: "", youtubeUrl: "",
  instagramUrl: "", telegramUrl: "", whatsappUrl: "", hulkLogoUrl: "",
};

export default function AdminSettingsPage() {
  const [tab, setTab] = useState<"branding"|"social"|"features"|"export">("branding");
  const [config, setConfig] = useState<SiteConfig>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoDarkUploading, setLogoDarkUploading] = useState(false);
  const [iconUploading, setIconUploading] = useState(false);
  const [pwaIconUploading, setPwaIconUploading] = useState(false);
  const [colorFromFileBusy, setColorFromFileBusy] = useState(false);
  const [hulkLogoUploading, setHulkLogoUploading] = useState(false);
  const logoFileRef = useRef<HTMLInputElement>(null);
  const logoDarkFileRef = useRef<HTMLInputElement>(null);
  const iconFileRef = useRef<HTMLInputElement>(null);
  const pwaIconFileRef = useRef<HTMLInputElement>(null);
  const colorPickFileRef = useRef<HTMLInputElement>(null);
  const hulkLogoFileRef = useRef<HTMLInputElement>(null);
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

  async function handleSiteLogoDarkFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !canManageBranding) return;
    setLogoDarkUploading(true);
    try {
      const url = await uploadSiteImage(file);
      if (!url) {
        toast.error("Upload finished but no URL was returned");
        return;
      }
      const next = { ...config, logoUrlDark: url };
      setConfig(next);
      const saved = await persistConfig(next);
      if (saved) toast.success("Dark mode logo updated and saved");
      else toast.error("Logo uploaded but saving settings failed — use Save");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Dark logo upload failed");
    } finally {
      setLogoDarkUploading(false);
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

  async function handleHulkLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !canManageBranding) return;
    setHulkLogoUploading(true);
    try {
      const url = await uploadSiteImage(file);
      if (!url) { toast.error("Upload finished but no URL was returned"); return; }
      const next = { ...config, hulkLogoUrl: url };
      setConfig(next);
      const saved = await persistConfig(next);
      if (saved) toast.success("Dr. Hulk logo updated and saved");
      else toast.error("Upload OK but save failed — click Save");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally { setHulkLogoUploading(false); }
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

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );

  const isSuperAdmin = userRole === "SUPER_ADMIN";
  const canManageBranding = userRole === "ADMIN" || userRole === "SUPER_ADMIN";

  const TABS: { id: typeof tab; label: string; icon: typeof Settings }[] = [
    { id: "branding",  label: "Branding",     icon: Palette },
    { id: "social",   label: "Social",        icon: Globe },
    { id: "features", label: "Features",      icon: ToggleRight },
    { id: "export",   label: "Export & Notif", icon: Megaphone },
  ];

  const toggles: { key: keyof SiteConfig; label: string; desc: string }[] = [
    { key: "enableAI",          label: "AI Features",   desc: "Student explain button & admin AI tools" },
    { key: "enableForum",       label: "Community",      desc: "Global and semester discussions" },
    { key: "enableAds",         label: "Advertisements", desc: "Show ad banners to students" },
    { key: "enableNotifs",      label: "Notifications",  desc: "In-app notifications" },
    { key: "enableLeaderboard", label: "Leaderboard",    desc: "Student rankings and points" },
  ];

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
       <Loader2 className="h-8 w-8 animate-spin text-blue-500/20" />
       <p className="text-xs font-bold text-muted-foreground/40 uppercase tracking-widest">Waking Configuration Nodes…</p>
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-6 pb-32">
      {/* ── Premium Header ── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between mb-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-500">Platform Control</p>
          <h1 className="font-display text-2xl font-bold md:text-3xl">System Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure platform branding, social integrations, and feature toggles.
          </p>
        </div>
        <div className="flex items-center gap-2">
           <div className="items-center gap-1.5 rounded-xl border border-border/60 bg-card px-3.5 py-2 text-sm font-medium text-muted-foreground flex">
              <Settings className="h-4 w-4 text-primary" />
              <span>v2.5.0</span>
           </div>
        </div>
      </div>

      {/* ── Glassmorphic Tabs ── */}
      <div className="mb-8 flex gap-1.5 overflow-x-auto rounded-2xl border border-border/60 bg-card/50 p-1.5 backdrop-blur-md">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2.5 rounded-xl px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-all duration-300",
              tab === id
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* ── Branding Tab ── */}
        {tab === "branding" && (
          <div className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4 shadow-sm">
                 <div className="flex items-center gap-2 mb-2">
                    <Palette className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-bold tracking-tight">Identity & Style</span>
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Platform Name</label>
                    <input
                      type="text"
                      value={config.siteName}
                      onChange={(e) => setConfig((c) => ({ ...c, siteName: e.target.value }))}
                      className="w-full h-11 rounded-xl border-border/60 bg-background/50 px-4 text-sm focus:ring-blue-500/40 focus:outline-none"
                    />
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Primary Color</label>
                    <div className="flex gap-2">
                       <input
                         type="color"
                         value={config.primaryColor}
                         onChange={(e) => setConfig((c) => ({ ...c, primaryColor: e.target.value }))}
                         className="h-11 w-12 cursor-pointer rounded-xl border border-border/60 bg-background/50 p-1"
                       />
                       <input
                         type="text"
                         value={config.primaryColor}
                         onChange={(e) => setConfig((c) => ({ ...c, primaryColor: e.target.value }))}
                         className="flex-1 h-11 rounded-xl border border-border/60 bg-background/50 px-4 text-sm font-mono focus:ring-blue-500/40 focus:outline-none"
                       />
                       <input ref={colorPickFileRef} type="file" accept="image/*" className="hidden" onChange={handleColorFromImageFile} />
                       <button
                         onClick={() => colorPickFileRef.current?.click()}
                         disabled={colorFromFileBusy}
                         className="h-11 px-4 rounded-xl border border-border/60 bg-muted/30 text-xs font-bold hover:bg-muted transition-all"
                       >
                         {colorFromFileBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Extract"}
                       </button>
                    </div>
                 </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4 shadow-sm">
                 <div className="flex items-center gap-2 mb-2">
                    <Globe className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-bold tracking-tight">Typography</span>
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Interface Font (Sans)</label>
                    <MedqsSelect
                      value={config.fontSans}
                      onChange={(e) => setConfig((c) => ({ ...c, fontSans: e.target.value }))}
                      className="w-full h-11 rounded-xl border-border/60 bg-background/50"
                    >
                      {["Plus Jakarta Sans", "Inter", "Outfit", "Lexend", "Space Grotesk"].map(f => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </MedqsSelect>
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Arabic Typeface</label>
                    <MedqsSelect
                      value={config.fontArabic}
                      onChange={(e) => setConfig((c) => ({ ...c, fontArabic: e.target.value }))}
                      className="w-full h-11 rounded-xl border-border/60 bg-background/50"
                    >
                      {["Cairo", "Tajawal", "Noto Sans Arabic", "Almarai", "Beirut"].map(f => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </MedqsSelect>
                 </div>
              </div>

              {/* Logo Settings */}
              <div className="sm:col-span-2 rounded-2xl border border-border/60 bg-card p-6 space-y-6 shadow-sm">
                 <div className="flex items-center gap-2 mb-2">
                    <Layers className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-bold tracking-tight">Asset Management</span>
                 </div>
                 
                 <div className="grid gap-6 sm:grid-cols-2">
                    {[
                      { id: "light", label: "Logo (Light)", url: config.logoUrl, busy: logoUploading, ref: logoFileRef, handler: handleSiteLogoFile, desc: "Main brand logo for light themes" },
                      { id: "dark", label: "Logo (Dark)", url: config.logoUrlDark, busy: logoDarkUploading, ref: logoDarkFileRef, handler: handleSiteLogoDarkFile, desc: "Visible on deep backgrounds" },
                      { id: "favicon", label: "Browser Icon", url: config.faviconUrl, busy: iconUploading, ref: iconFileRef, handler: handleSiteIconFile, desc: "Tab and bookmark icon" },
                      { id: "pwa", label: "Home Screen Icon", url: config.pwaIconUrl, busy: pwaIconUploading, ref: pwaIconFileRef, handler: handlePwaIconFile, desc: "Squarish icon for app installation" }
                    ].map(asset => (
                      <div key={asset.id} className="space-y-3">
                         <div className="flex items-center justify-between">
                            <div>
                               <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">{asset.label}</p>
                               <p className="text-[10px] text-muted-foreground/60 ml-1">{asset.desc}</p>
                            </div>
                            <button
                               onClick={() => asset.ref.current?.click()}
                               className="h-8 shadow-sm flex items-center gap-1.5 rounded-lg border border-border/60 bg-background/50 px-3 text-[10px] font-bold uppercase tracking-tighter hover:bg-muted transition-all"
                            >
                               {asset.busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                               Upload
                               <input ref={asset.ref} type="file" accept="image/*" className="hidden" onChange={asset.handler} />
                            </button>
                         </div>
                         <div className="relative group overflow-hidden rounded-xl border border-border/40 bg-muted/5 h-24 flex items-center justify-center">
                            {asset.url ? (
                              <img src={asset.url} alt={asset.label} className="max-h-[80%] max-w-[80%] object-contain drop-shadow-sm transition-transform group-hover:scale-105" />
                            ) : (
                              <div className="flex flex-col items-center gap-1 opacity-20">
                                 <Plus className="h-5 w-5" />
                                 <span className="text-[9px] font-bold">Unset</span>
                              </div>
                            )}
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Social Tab ── */}
        {tab === "social" && (
          <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-6 shadow-sm">
             <div className="flex items-center gap-2 mb-2">
                <Globe className="h-4 w-4 text-indigo-500" />
                <span className="text-sm font-bold tracking-tight">Social Connect</span>
             </div>
             <div className="grid gap-5 sm:grid-cols-2">
                {[
                  { key: "facebookUrl", label: "Facebook" }, { key: "whatsappUrl", label: "WhatsApp" },
                  { key: "instagramUrl", label: "Instagram" }, { key: "telegramUrl", label: "Telegram" },
                  { key: "twitterUrl", label: "X / Twitter" }, { key: "youtubeUrl", label: "YouTube" }
                ].map(social => (
                  <div key={social.key} className="space-y-1.5">
                     <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">{social.label}</label>
                     <input
                        type="url"
                        value={(config as any)[social.key] || ""}
                        onChange={(e) => setConfig(c => ({ ...c, [social.key]: e.target.value }))}
                        className="w-full h-11 rounded-xl border border-border/60 bg-background/50 px-4 text-sm focus:ring-blue-500/40 focus:outline-none"
                        placeholder="https://…"
                     />
                  </div>
                ))}
                
                <div className="sm:col-span-2 pt-4 border-t border-border/40 space-y-3">
                   <div className="flex items-center justify-between">
                      <div>
                         <p className="text-[11px] font-bold uppercase tracking-widest text-blue-500 ml-1">Dr. Hulk Character Logo</p>
                         <p className="text-[10px] text-muted-foreground/60 ml-1">Custom avatar for the global tutor bot</p>
                      </div>
                      <button 
                        onClick={() => hulkLogoFileRef.current?.click()}
                        className="h-9 shadow-sm flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 text-[11px] font-bold text-white shadow-blue-500/20 hover:opacity-90"
                      >
                         {hulkLogoUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                         Upload Sprite
                         <input ref={hulkLogoFileRef} type="file" accept="image/*" className="hidden" onChange={handleHulkLogoFile} />
                      </button>
                   </div>
                   {config.hulkLogoUrl && (
                      <div className="p-4 rounded-xl border border-border/40 bg-muted/5 flex justify-center">
                         <img src={config.hulkLogoUrl} alt="Hulk" className="h-16 object-contain drop-shadow-lg" />
                      </div>
                   )}
                </div>
             </div>
          </div>
        )}

        {/* ── Features Tab ── */}
        {tab === "features" && (
           <div className="space-y-6">
              <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-5 shadow-sm">
                 <div className="flex items-center gap-2 mb-2">
                    <ToggleRight className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm font-bold tracking-tight">Active Components</span>
                 </div>
                 <div className="grid gap-3">
                    {toggles.map(({ key, label, desc }) => {
                       const enabled = config[key] as boolean;
                       return (
                          <div key={key} className="flex items-center justify-between rounded-xl border border-border/60 bg-background/30 p-4 transition-all hover:bg-background/50">
                             <div>
                                <p className="text-sm font-bold">{label}</p>
                                <p className="text-[10px] text-muted-foreground/70">{desc}</p>
                             </div>
                             <button
                                onClick={() => setConfig(c => ({ ...c, [key]: !enabled }))}
                                className={cn(
                                   "relative flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors",
                                   enabled ? "bg-emerald-600 shadow-sm shadow-emerald-500/30" : "bg-muted"
                                )}
                             >
                                <span className={cn("h-4 w-4 rounded-full bg-white shadow transition-transform", enabled ? "translate-x-6" : "translate-x-1")} />
                             </button>
                          </div>
                       );
                    })}
                 </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-4 shadow-sm border-l-4 border-l-blue-500">
                 <div>
                    <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">Intelligence Hub</span>
                    <h3 className="font-display text-lg font-bold">Preferred AI Provider</h3>
                 </div>
                 <MedqsSelect
                   value={config.aiPreferredProvider}
                   onChange={(e) => setConfig(c => ({ ...c, aiPreferredProvider: e.target.value as any }))}
                   className="w-full h-11 rounded-xl border-border/60 bg-background/50 font-semibold"
                 >
                    <option value="auto">Auto-Select (Optimized)</option>
                    <option value="gemini">Google Gemini Pro</option>
                    <option value="openai">OpenAI GPT-4o</option>
                    <option value="anthropic">Anthropic Claude</option>
                    <option value="deepseek">DeepSeek AI</option>
                 </MedqsSelect>
                 <p className="text-[11px] text-muted-foreground italic leading-relaxed">
                    System will automatically fallback if the primary provider is rate-limited or unavailable.
                 </p>
              </div>
           </div>
        )}

        {/* ── Export Tab ── */}
        {tab === "export" && (
           <div className="space-y-6">
              {isSuperAdmin && (
                 <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 space-y-4 shadow-sm">
                    <div className="flex items-center gap-2">
                       <Megaphone className="h-4 w-4 text-amber-500" />
                       <span className="text-sm font-bold tracking-tight text-amber-600 dark:text-amber-400">Global Broadcast</span>
                    </div>
                    <div className="space-y-3">
                       <input
                          type="text"
                          value={broadTitle}
                          onChange={(e) => setBroadTitle(e.target.value)}
                          placeholder="Notification Alert Title…"
                          className="w-full h-11 rounded-xl border-amber-500/20 bg-background/50 px-4 text-sm focus:ring-amber-500/40 focus:outline-none"
                       />
                       <textarea
                          value={broadBody}
                          onChange={(e) => setBroadBody(e.target.value)}
                          placeholder="Message detail to broadcast to all students…"
                          className="w-full min-h-[100px] rounded-xl border-amber-500/20 bg-background/50 p-4 text-sm focus:ring-amber-500/40 focus:outline-none resize-none"
                       />
                       <button
                          onClick={handleBroadcast}
                          disabled={broadcasting}
                          className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-amber-500 text-sm font-bold text-white shadow shadow-amber-500/30 hover:bg-amber-600 disabled:opacity-50 transition-all font-display"
                       >
                          {broadcasting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Megaphone className="h-4 w-4" />}
                          Blast Notification
                       </button>
                    </div>
                 </div>
              )}
              <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
                 <ExportPanel />
              </div>
           </div>
        )}
      </div>

      {/* ── Fixed Sticky Save Bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/40 bg-background/80 px-4 py-4 backdrop-blur-xl md:left-64">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-6">
          <div className="hidden sm:block">
             <p className="text-xs font-bold text-foreground opacity-80 uppercase tracking-tighter">Live Updates Enabled</p>
             <p className="text-[10px] text-muted-foreground">Persisting changes to production environment.</p>
          </div>
          <div className="flex flex-1 justify-end">
             <button
               onClick={handleSave}
               disabled={saving}
               className="flex h-12 min-w-[160px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 text-sm font-bold text-white shadow-xl shadow-blue-500/30 hover:opacity-90 disabled:opacity-60 transition-all font-display"
             >
               {saving ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Save className="h-4 w-4 text-white" />}
               {saving ? "Deploying…" : "Save Settings"}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
