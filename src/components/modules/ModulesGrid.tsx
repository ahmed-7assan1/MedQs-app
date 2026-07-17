"use client";

import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Brain, Heart, Dna, FlaskConical,
  Layers, Atom, BookOpen,
  ChevronRight, Library, Pencil, X, Check, Sparkles,
} from "lucide-react";
import ModuleCard from "./ModuleCard";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/contexts/SidebarContext";
import toast from "react-hot-toast";
import { apiErrorMessage } from "@/lib/api-error-client";
import ColorPicker from "@/components/ui/ColorPicker";
import { ImageUploadWithCrop } from "@/components/ui/ImageUploadWithCrop";

export interface ModuleWithStats {
  id: string;
  name: string;
  icon: string | null;
  imageUrl?: string | null;
  subjectsCount: number;
  lecturesCount: number;
  questionsCount: number;
  masteredCount: number;
  percentage: number;
  difficulty: { label: string; tone: string; bg: string } | null;
  subjectNames: string[];
}

interface ModulesGridProps {
  modules: ModuleWithStats[];
  isGuest: boolean;
  isAdmin?: boolean;
}

const MODULE_ICONS = [
  { id: "Brain", icon: Brain, label: "Neurology" },
  { id: "Heart", icon: Heart, label: "Cardiology" },
  { id: "Dna", icon: Dna, label: "Genetics" },
  { id: "FlaskConical", icon: FlaskConical, label: "Pathology" },
  { id: "Layers", icon: Layers, label: "General" },
  { id: "Atom", icon: Atom, label: "Microbiology" },
  { id: "BookOpen", icon: BookOpen, label: "Library" },
];

const iconMap: Record<string, any> = { Brain, Heart, Dna, FlaskConical, Layers, Atom, BookOpen };

const iconThemeMap: Record<string, {
  theme: string; icon: any; bar: string; header: string; progressText: string; iconBg: string;
}> = {
  Brain:        { theme: "border-violet-500/20 hover:border-violet-400/40", icon: Brain, bar: "bg-gradient-to-r from-violet-400 to-purple-400 shadow-[0_0_6px_rgba(139,92,246,0.4)]", header: "bg-gradient-to-r from-violet-800/90 to-purple-800/90", progressText: "dark:text-violet-400 text-violet-600", iconBg: "bg-white/20" },
  Heart:        { theme: "border-rose-500/20 hover:border-rose-400/40", icon: Heart, bar: "bg-gradient-to-r from-rose-400 to-pink-400 shadow-[0_0_6px_rgba(244,63,94,0.4)]", header: "bg-gradient-to-r from-rose-800/90 to-pink-800/90", progressText: "dark:text-rose-400 text-rose-600", iconBg: "bg-white/20" },
  Dna:          { theme: "border-blue-500/20 hover:border-blue-400/40", icon: Dna, bar: "bg-gradient-to-r from-blue-400 to-cyan-400 shadow-[0_0_6px_rgba(59,130,246,0.4)]", header: "bg-gradient-to-r from-blue-800/90 to-cyan-800/90", progressText: "dark:text-blue-400 text-blue-600", iconBg: "bg-white/20" },
  FlaskConical: { theme: "border-amber-500/20 hover:border-amber-400/40", icon: FlaskConical, bar: "bg-gradient-to-r from-amber-400 to-orange-400 shadow-[0_0_6px_rgba(245,158,11,0.4)]", header: "bg-gradient-to-r from-amber-800/90 to-orange-800/90", progressText: "dark:text-amber-400 text-amber-600", iconBg: "bg-white/20" },
  Layers:       { theme: "border-emerald-500/20 hover:border-emerald-400/40", icon: Layers, bar: "bg-gradient-to-r from-emerald-400 to-green-400 shadow-[0_0_6px_rgba(16,185,129,0.4)]", header: "bg-gradient-to-r from-emerald-800/90 to-green-800/90", progressText: "dark:text-emerald-400 text-emerald-600", iconBg: "bg-white/20" },
  Atom:         { theme: "border-primary/20 hover:border-primary/40", icon: Atom, bar: "bg-gradient-to-r from-primary to-indigo-400 shadow-[0_0_6px_rgba(79,70,229,0.4)]", header: "bg-gradient-to-r from-[#1e1b4b]/95 to-indigo-800/90", progressText: "dark:text-primary-400 text-primary-600", iconBg: "bg-white/20" },
  BookOpen:     { theme: "border-sky-500/20 hover:border-sky-400/40", icon: BookOpen, bar: "bg-gradient-to-r from-sky-400 to-blue-400 shadow-[0_0_6px_rgba(14,165,233,0.4)]", header: "bg-gradient-to-r from-sky-800/90 to-blue-800/90", progressText: "dark:text-sky-400 text-sky-600", iconBg: "bg-white/20" },
};

interface CustomModuleStyle {
  icon: string;
  bg: string;
  from: string;
  to: string;
  opacity: number;
  cardBg?: string;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function ensureDarkColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  if (lum <= 0.35) return hex;
  const factor = 0.3;
  const toHex = (n: number) => Math.round(n * factor).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function parseCustomIcon(icon: string | null): CustomModuleStyle | null {
  if (!icon || !icon.startsWith("{")) return null;
  try {
    const p = JSON.parse(icon);
    if (p.icon && p.from) return p as CustomModuleStyle;
    return null;
  } catch { return null; }
}

function getModuleStyle(icon: string | null, name: string) {
  const custom = parseCustomIcon(icon);
  if (custom) {
    const IconComp = iconMap[custom.icon] || iconMap.Atom;
      return {
        theme: "border-white/10 hover:border-white/20",
        icon: IconComp,
        bar: "bg-gradient-to-r from-white/60 to-white/40",
        header: "",
        isCustom: true,
        headerBg: custom.bg,
        headerGradient: `linear-gradient(to right, ${hexToRgba(custom.from, custom.opacity)}, ${hexToRgba(custom.to, custom.opacity)})`,
        cardBg: custom.cardBg || undefined,
        progressText: "text-white/70",
        iconBg: "bg-white/20",
      };
  }

  if (icon && iconThemeMap[icon]) return iconThemeMap[icon];

  // Fallback keyword matching
  const n = name.toUpperCase();
  if (n.includes("CNS") || n.includes("NEURO"))                return iconThemeMap.Brain;
  if (n.includes("CARDIO") || n.includes("ECE") || n.includes("ENDO") || n.includes("RESP")) return iconThemeMap.Heart;
  if (n.includes("GENETIC") || n.includes("CELL") || n.includes("GENE") || n.includes("MICRO")) return iconThemeMap.Dna;
  if (n.includes("BIOCHEM") || n.includes("PHARMA") || n.includes("RENAL")) return iconThemeMap.FlaskConical;
  if (n.includes("GIT") || n.includes("GI") || n.includes("NUTRI")) return iconThemeMap.Layers;
  return iconThemeMap.Atom;
}

export default function ModulesGrid({ modules, isGuest, isAdmin }: ModulesGridProps) {
  const { isOpen } = useSidebar();
  const [visibleCount, setVisibleCount] = useState(9);
  const [localModules, setLocalModules] = useState(modules);
  const [editTarget, setEditTarget] = useState<ModuleWithStats | null>(null);
  const [editName, setEditName] = useState("");
  const [editIcon, setEditIcon] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState<"preset" | "custom">("preset");
  const [editBgColor, setEditBgColor] = useState("#1a1a2e");
  const [editGradientFrom, setEditGradientFrom] = useState("#16213e");
  const [editGradientTo, setEditGradientTo] = useState("#0f3460");
  const [editOpacity, setEditOpacity] = useState(85);
  const [editCardBg, setEditCardBg] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");

  const visibleModules = useMemo(() => localModules.slice(0, visibleCount), [localModules, visibleCount]);
  const hasMore = visibleCount < localModules.length;

  const openEditor = useCallback((mod: ModuleWithStats) => {
    setEditTarget(mod);
    setEditName(mod.name);
    setEditImageUrl(mod.imageUrl || "");
    const custom = parseCustomIcon(mod.icon);
    if (custom) {
      setEditMode("custom");
      setEditIcon(custom.icon);
      setEditBgColor(custom.bg);
      setEditGradientFrom(custom.from);
      setEditGradientTo(custom.to);
      setEditOpacity(Math.round(custom.opacity * 100));
      setEditCardBg(custom.cardBg || "");
    } else {
      setEditMode("preset");
      setEditIcon(mod.icon || "Atom");
      setEditBgColor("#1a1a2e");
      setEditGradientFrom("#16213e");
      setEditGradientTo("#0f3460");
      setEditOpacity(85);
      setEditCardBg("");
    }
  }, []);

  const closeEditor = useCallback(() => {
    setEditTarget(null);
    setEditName("");
    setEditIcon("");
    setEditImageUrl("");
    setEditMode("preset");
    setEditBgColor("#1a1a2e");
    setEditGradientFrom("#16213e");
    setEditGradientTo("#0f3460");
    setEditOpacity(85);
    setEditCardBg("");
  }, []);

  async function saveModule() {
    if (!editTarget || !editName.trim() || saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/modules/${editTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          imageUrl: editImageUrl || null,
          icon: editMode === "custom"
            ? JSON.stringify({
                icon: editIcon,
                bg: editBgColor,
                from: ensureDarkColor(editGradientFrom),
                to: editGradientTo,
                opacity: editOpacity / 100,
                ...(editCardBg ? { cardBg: editCardBg } : {}),
              })
            : editIcon,
        }),
      });
      if (!res.ok) {
        toast.error(await apiErrorMessage(res, "Update failed"));
        return;
      }
      const updated = await res.json();
      setLocalModules((prev) =>
        prev.map((m) =>
          m.id === editTarget.id
            ? { ...m, name: updated.name, icon: updated.icon, imageUrl: updated.imageUrl }
            : m
        )
      );
      toast.success("Module updated");
      closeEditor();
    } catch {
      toast.error("Failed to update module");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 md:space-y-12">

      {/* ── CARD GRID ── */}
      {localModules.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[32px] md:rounded-[40px] border border-dashed border-border/30 bg-card/20 py-16 md:py-24 text-center">
          <div className="mb-5 md:mb-6 flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-[16px] md:rounded-[20px] bg-card/40 text-muted-foreground/40">
            <Library className="h-7 w-7 md:h-8 md:w-8" />
          </div>
          <h3 className="text-base md:text-lg font-black text-foreground uppercase tracking-widest">No Modules Found</h3>
          <p className="mt-2 text-muted-foreground text-xs font-semibold max-w-xs mx-auto">
            No modules are available in your current semester.
          </p>
        </div>
      ) : (
        <div className="space-y-6 md:space-y-0">
          <motion.div 
            layout
            className={cn("grid gap-3 md:gap-6 sm:grid-cols-2", isOpen ? "lg:grid-cols-3" : "lg:grid-cols-4")}
          >
            <AnimatePresence mode="popLayout">
              {visibleModules.map((mod, index) => {
                const modStyle = getModuleStyle(mod.icon, mod.name);

                return (
                  <div key={mod.id} className="group relative">
                    <ModuleCard
                      module={mod}
                      moduleStyle={{ progressText: modStyle.progressText, bar: modStyle.bar }}
                      index={index}
                      isGuest={isGuest}
                    />

                    {/* Admin Edit Button */}
                    {isAdmin && (
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEditor(mod); }}
                        className="absolute top-2 right-2 z-10 h-8 w-8 rounded-xl bg-black/40 backdrop-blur-sm border border-white/20 flex items-center justify-center opacity-60 hover:opacity-100 hover:bg-black/60 transition-all active:scale-90"
                        aria-label="Edit module"
                      >
                        <Pencil className="h-4 w-4 text-white" />
                      </button>
                    )}
                  </div>
                );
              })}
            </AnimatePresence>
          </motion.div>

          {/* Show More Button */}
          {hasMore && (
            <div className="flex justify-center pt-1 md:pt-4">
              <button
                onClick={() => setVisibleCount((c) => c + 9)}
                aria-label="Load more modules"
                className="inline-flex items-center gap-2 px-8 py-3 md:px-6 md:py-3 rounded-full bg-card/40 border border-border text-xs font-black text-muted-foreground uppercase tracking-widest hover:bg-card/60 hover:text-foreground active:scale-95 transition-all"
              >
                Show More
                <ChevronRight className="h-3.5 w-3.5 transform rotate-90" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── EDIT MODAL (Bottom Sheet) ── */}
      <AnimatePresence>
        {editTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeEditor} />
            <motion.div
              initial={{ opacity: 0, y: 200 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 200 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="relative w-full sm:max-w-lg max-h-[92vh] sm:max-h-none rounded-t-2xl sm:rounded-2xl border border-border bg-card shadow-2xl overflow-y-auto"
            >
              {/* Drag Handle (mobile) */}
              <div className="flex justify-center pt-2 pb-0 sm:hidden">
                <div className="h-1 w-10 rounded-full bg-muted-foreground/25" />
              </div>

              {/* Modal Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-foreground">Edit Module</h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Customize module appearance</p>
                  </div>
                </div>
                <button
                  onClick={closeEditor}
                  className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/80 transition-all text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="px-5 py-5 space-y-5">
                {/* Module Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Module Name</label>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Enter module name"
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-bold text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                    onKeyDown={(e) => { if (e.key === "Enter") void saveModule(); if (e.key === "Escape") closeEditor(); }}
                  />
                </div>

                {/* Module Image */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Card Image</label>
                  <ImageUploadWithCrop
                    label="Upload module card image"
                    value={editImageUrl}
                    onChange={(url) => setEditImageUrl(url)}
                    cropShape="rect"
                    aspect={16/9}
                  />
                  {editImageUrl && (
                    <button
                      onClick={() => setEditImageUrl("")}
                      className="text-[10px] font-bold text-rose-500 hover:text-rose-400 transition-colors mt-1"
                    >
                      Remove image
                    </button>
                  )}
                </div>

                {/* Preset / Custom Toggle */}
                <div className="flex rounded-xl bg-muted/50 p-1 border border-border">
                  <button
                    onClick={() => setEditMode("preset")}
                    className={cn(
                      "flex-1 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                      editMode === "preset"
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Preset
                  </button>
                  <button
                    onClick={() => setEditMode("custom")}
                    className={cn(
                      "flex-1 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                      editMode === "custom"
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Custom
                  </button>
                </div>

                {/* Icon Picker */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Choose Icon</label>
                  <div className="flex flex-wrap gap-2">
                    {MODULE_ICONS.map((item) => {
                      const IconComp = item.icon;
                      const isActive = editIcon === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setEditIcon(item.id)}
                          className={cn(
                            "h-12 w-12 rounded-xl flex items-center justify-center transition-all border-2",
                            isActive
                              ? "border-primary bg-primary/10 text-primary shadow-lg shadow-primary/20 scale-110"
                              : "border-border bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                          title={item.label}
                        >
                          <IconComp className="h-5 w-5" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Colors */}
                {editMode === "custom" && (
                  <div className="space-y-4 rounded-xl bg-muted/20 border border-border p-4">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Custom Colors</label>

                    <ColorPicker
                      label="Header Background"
                      value={editBgColor}
                      onChange={setEditBgColor}
                    />

                    <ColorPicker
                      label="Gradient Left (auto-darkened)"
                      value={editGradientFrom}
                      onChange={(hex) => setEditGradientFrom(ensureDarkColor(hex))}
                    />

                    <ColorPicker
                      label="Gradient Right"
                      value={editGradientTo}
                      onChange={setEditGradientTo}
                    />

                    <ColorPicker
                      label="Card Body Background"
                      value={editCardBg || "#1a1a2e"}
                      onChange={(hex) => setEditCardBg(hex)}
                    />

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">Gradient Opacity</span>
                        <span className="text-[10px] font-mono font-bold text-muted-foreground">{editOpacity}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={editOpacity}
                        onChange={(e) => setEditOpacity(Number(e.target.value))}
                        className="w-full h-1.5 rounded-full appearance-none bg-muted/50 cursor-pointer accent-primary"
                      />
                    </div>
                  </div>
                )}

                {/* Preview */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Preview</label>
                  <div className="rounded-xl overflow-hidden border border-border">
                    {editMode === "custom" ? (
                      <div
                        className="px-4 py-3 flex items-center gap-3"
                        style={{
                          backgroundColor: editBgColor,
                          backgroundImage: `linear-gradient(to right, ${hexToRgba(editGradientFrom, editOpacity / 100)}, ${hexToRgba(editGradientTo, editOpacity / 100)})`,
                        }}
                      >
                        <div className="h-8 w-8 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                          {React.createElement(iconMap[editIcon] || Layers, { className: "h-[18px] w-[18px] text-white" })}
                        </div>
                        <span className="text-sm font-black text-white truncate">{editName || "Module Name"}</span>
                      </div>
                    ) : (
                      <div className={cn("px-4 py-3 flex items-center gap-3", iconThemeMap[editIcon]?.header)}>
                        <div className="h-8 w-8 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                          {React.createElement(iconMap[editIcon] || Layers, { className: "h-[18px] w-[18px] text-white" })}
                        </div>
                        <span className="text-sm font-black text-white truncate">{editName || "Module Name"}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-border bg-muted/20">
                <button
                  onClick={closeEditor}
                  className="px-5 py-2.5 rounded-xl text-xs font-black text-muted-foreground uppercase tracking-widest hover:bg-muted transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => void saveModule()}
                  disabled={saving || !editName.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-black uppercase tracking-widest hover:bg-primary/90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20"
                >
                  {saving ? (
                    <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
