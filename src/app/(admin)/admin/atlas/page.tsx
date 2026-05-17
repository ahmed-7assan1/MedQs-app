"use client";

import { useState, useEffect, useCallback } from "react";
import { Bone, Dumbbell, Brain, Wind, Utensils, FlaskConical, Droplets, Shield, Eye, Heart, Plus, Pencil, Trash2, Search, X, ChevronRight, Upload, Link, Info, Zap, Activity, Save, AlertCircle, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const ICON_MAP: Record<string, React.ElementType> = {
  Bone, Dumbbell, Brain, Wind, Utensils, FlaskConical, Droplets, Shield, Eye, Heart, Activity,
};

type AtlasSystem = {
  id: string; systemId: string; label: string; color: string; border: string;
  iconColor: string; iconName: string; desc: string;
  _count?: { structures: number };
};

type AtlasStructure = {
  id: string; slug: string; name: string; latin?: string; type: string; desc: string;
  region?: string; systemId: string; fn?: string; blood?: string; nerve?: string;
  relations?: string[]; clinical?: string; memo?: string; imageUrl?: string; modelUrl?: string;
  system?: { label: string; iconColor: string };
};

const EMPTY_STRUCTURE: Omit<AtlasStructure, "id"> = {
  slug: "", name: "", latin: "", type: "organ", desc: "", region: "", systemId: "",
  fn: "", blood: "", nerve: "", relations: [], clinical: "", memo: "", imageUrl: "", modelUrl: "",
};

const EMPTY_SYSTEM: Omit<AtlasSystem, "id"> = {
  systemId: "", label: "", color: "from-cyan-500/20 to-cyan-500/5", border: "border-cyan-500/20",
  iconColor: "text-cyan-400", iconName: "Activity", desc: "",
};

const TYPES = ["bone","muscle","nerve","organ","vessel","joint","ligament","gland","special"];

function Badge({ text, className }: { text: string; className?: string }) {
  return (
    <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border", className)}>
      {text}
    </span>
  );
}

function FieldGroup({ label, icon: Icon, children }: { label: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
        <Icon className="w-3.5 h-3.5" /> {label}
      </label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, className }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn("w-full h-10 bg-[#1a1a1a] border border-white/5 rounded-xl px-3 text-sm font-medium text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-500/20", className)}
    />
  );
}

function Textarea({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl px-3 py-2.5 text-sm font-medium text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 resize-none"
    />
  );
}

export default function AdminAtlasPage() {
  const [systems, setSystems] = useState<AtlasSystem[]>([]);
  const [structures, setStructures] = useState<AtlasStructure[]>([]);
  const [activeSystem, setActiveSystem] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Structure forms
  const [editingStructure, setEditingStructure] = useState<AtlasStructure | null>(null);
  const [isNewStructure, setIsNewStructure] = useState(false);
  const [formData, setFormData] = useState<Omit<AtlasStructure, "id">>(EMPTY_STRUCTURE);

  // System forms
  const [editingSystem, setEditingSystem] = useState<AtlasSystem | null>(null);
  const [isNewSystem, setIsNewSystem] = useState(false);
  const [systemFormData, setSystemFormData] = useState<Omit<AtlasSystem, "id">>(EMPTY_SYSTEM);

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; type: "structure" | "system" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchSystems = useCallback(async () => {
    const res = await fetch("/api/v1/admin/atlas/systems");
    if (res.ok) setSystems(await res.json());
  }, []);

  const fetchStructures = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeSystem) params.set("systemId", activeSystem);
    if (search) params.set("q", search);
    const res = await fetch(`/api/v1/admin/atlas/structures?${params}`);
    if (res.ok) setStructures(await res.json());
    setLoading(false);
  }, [activeSystem, search]);

  useEffect(() => { fetchSystems(); }, [fetchSystems]);
  useEffect(() => { fetchStructures(); }, [fetchStructures]);

  // Structure actions
  const openNewStructure = () => {
    setFormData({ ...EMPTY_STRUCTURE, systemId: activeSystem || "" });
    setIsNewStructure(true);
    setEditingStructure(null);
  };

  const openEditStructure = (s: AtlasStructure) => {
    setFormData({ ...s });
    setEditingStructure(s);
    setIsNewStructure(false);
  };

  // System actions
  const openNewSystem = () => {
    setSystemFormData(EMPTY_SYSTEM);
    setIsNewSystem(true);
    setEditingSystem(null);
  };

  const openEditSystem = (sys: AtlasSystem) => {
    setSystemFormData({ ...sys });
    setEditingSystem(sys);
    setIsNewSystem(false);
  };

  const closeForm = () => {
    setEditingStructure(null);
    setIsNewStructure(false);
    setEditingSystem(null);
    setIsNewSystem(false);
  };

  const handleSaveStructure = async () => {
    if (!formData.name || !formData.slug || !formData.systemId) {
      showToast("Please fill all required structure fields", "error");
      return;
    }
    setSaving(true);
    try {
      const url = isNewStructure
        ? "/api/v1/admin/atlas/structures"
        : `/api/v1/admin/atlas/structures/${editingStructure!.id}`;
      const method = isNewStructure ? "POST" : "PUT";
      const payload = {
        ...formData,
        relations: Array.isArray(formData.relations) ? formData.relations : String(formData.relations).split(",").map(s => s.trim()).filter(Boolean)
      };
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(await res.text());
      showToast(isNewStructure ? "Structure created!" : "Structure updated!");
      closeForm();
      fetchStructures();
      fetchSystems();
    } catch (e: any) {
      showToast(e.message || "Error saving structure", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSystem = async () => {
    if (!systemFormData.systemId || !systemFormData.label) {
      showToast("Please fill all required system fields", "error");
      return;
    }
    setSaving(true);
    try {
      const url = isNewSystem
        ? "/api/v1/admin/atlas/systems"
        : `/api/v1/admin/atlas/systems/${editingSystem!.id}`;
      const method = isNewSystem ? "POST" : "PUT";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(systemFormData) });
      if (!res.ok) throw new Error(await res.text());
      showToast(isNewSystem ? "System created successfully!" : "System updated successfully!");
      closeForm();
      fetchSystems();
      fetchStructures();
    } catch (e: any) {
      showToast(e.message || "Error saving system", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!deleteConfirm) return;
    try {
      const { id, type } = deleteConfirm;
      const url = type === "structure"
        ? `/api/v1/admin/atlas/structures/${id}`
        : `/api/v1/admin/atlas/systems/${id}`;
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      showToast(`${type === "structure" ? "Structure" : "System"} deleted successfully!`);
      if (type === "system" && activeSystem === id) {
        setActiveSystem(null);
      }
      fetchStructures();
      fetchSystems();
    } catch (e: any) {
      showToast(e.message || "Delete failed", "error");
    } finally {
      setDeleteConfirm(null);
    }
  };

  const updateStructureField = (key: keyof typeof formData) => (v: string) =>
    setFormData(prev => ({ ...prev, [key]: v }));

  const updateSystemField = (key: keyof typeof systemFormData) => (v: string) =>
    setSystemFormData(prev => ({ ...prev, [key]: v }));

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={cn("fixed top-6 right-6 z-[100] flex items-center gap-2 px-4 py-3 rounded-2xl shadow-2xl text-sm font-bold border border-white/5",
              toast.type === "success" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white")}>
            {toast.type === "success" ? <Save className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-[#1a1a1a] border border-white/10 rounded-3xl p-6 max-w-sm w-full shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <h3 className="font-black text-white">Delete {deleteConfirm.type === "structure" ? "Structure" : "System"}?</h3>
                  <p className="text-xs text-white/40">This will remove it permanently.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 h-11 rounded-xl border border-white/10 text-sm font-bold text-white/60 hover:text-white transition-colors">Cancel</button>
                <button onClick={handleDeleteItem} className="flex-1 h-11 rounded-xl bg-rose-500 text-sm font-bold text-white hover:bg-rose-600 transition-colors">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 py-8 md:px-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500 mb-1">Admin Panel</p>
            <h1 className="text-3xl font-black tracking-tighter">Atlas Control Center</h1>
            <p className="text-sm text-white/40 mt-1">Manage anatomical systems, organs, systems and curriculum data</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button onClick={openNewSystem}
              className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 border border-white/5 hover:bg-zinc-800 text-white font-black text-sm rounded-2xl transition-colors shadow-lg">
              <Settings className="w-4 h-4 text-cyan-400" /> Add System
            </button>
            <button onClick={openNewStructure}
              className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white font-black text-sm rounded-2xl transition-colors shadow-lg shadow-cyan-500/20">
              <Plus className="w-4 h-4" /> Add Structure
            </button>
          </div>
        </div>

        {/* Systems Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-black uppercase tracking-widest text-white/40">Anatomical Systems</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            <button onClick={() => setActiveSystem(null)}
              className={cn("flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-sm font-black transition-all shrink-0",
                !activeSystem ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400" : "bg-[#1a1a1a] border-white/5 text-white/50 hover:text-white")}>
              All Systems
              <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded-md">{structures.length}</span>
            </button>
            {systems.map(sys => {
              const Icon = ICON_MAP[sys.iconName] ?? Activity;
              const isActive = activeSystem === sys.systemId;
              return (
                <div key={sys.id} className="relative group/sys shrink-0 flex items-center">
                  <button onClick={() => setActiveSystem(sys.systemId)}
                    className={cn("flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-sm font-black transition-all",
                      isActive ? `bg-cyan-500/10 border-cyan-500/30 ${sys.iconColor}` : "bg-[#1a1a1a] border-white/5 text-white/50 hover:text-white")}>
                    <Icon className="w-4 h-4 stroke-[2.5]" />
                    {sys.label}
                    <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded-md">{sys._count?.structures ?? 0}</span>
                  </button>
                  <div className="absolute -top-1 -right-1 flex gap-1 opacity-0 group-hover/sys:opacity-100 transition-opacity z-10">
                    <button onClick={() => openEditSystem(sys)} className="p-1 rounded-full bg-zinc-800 border border-white/10 text-white/60 hover:text-cyan-400 transition-colors"><Pencil className="w-3 h-3" /></button>
                    <button onClick={() => setDeleteConfirm({ id: sys.id, type: "system" })} className="p-1 rounded-full bg-zinc-800 border border-white/10 text-white/60 hover:text-rose-400 transition-colors"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search structures, clinical notes, mnemonics..."
            className="w-full h-12 bg-[#1a1a1a] border border-white/5 rounded-2xl pl-11 pr-11 text-sm font-medium text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-500/20" />
          {search && <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-white/30 hover:text-white" /></button>}
        </div>

        {/* Structures Table */}
        <div className="bg-[#111] border border-white/5 rounded-3xl overflow-hidden shadow-xl">
          <div className="grid grid-cols-[1fr_150px_120px_100px_120px] gap-4 px-5 py-3 border-b border-white/5 text-[10px] font-black uppercase tracking-widest text-white/30 bg-white/[0.01]">
            <span>Structure</span>
            <span>System</span>
            <span>Type</span>
            <span>Region</span>
            <span className="text-right">Actions</span>
          </div>
          {loading ? (
            <div className="py-20 text-center text-white/30 text-sm flex items-center justify-center gap-2"><Activity className="w-4 h-4 animate-spin text-cyan-400" /> Loading database structures...</div>
          ) : structures.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4"><Search className="w-6 h-6 text-white/20" /></div>
              <p className="text-white/40 font-bold">No structures found</p>
              <p className="text-white/20 text-xs mt-1">Try changing filters or add a new structure</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {structures.map(s => (
                <div key={s.id} className="grid grid-cols-[1fr_150px_120px_100px_120px] gap-4 px-5 py-4 items-center hover:bg-white/[0.02] transition-colors group">
                  <div className="min-w-0">
                    <p className="font-black text-white truncate">{s.name}</p>
                    {s.latin && <p className="text-[11px] text-white/40 font-serif italic truncate">{s.latin}</p>}
                  </div>
                  <span className={cn("text-[10px] font-black truncate", s.system?.iconColor ?? "text-white/40")}>{s.system?.label}</span>
                  <Badge text={s.type} className="bg-white/5 text-white/50 border-white/10 w-fit" />
                  <span className="text-xs text-white/40 truncate">{s.region || "N/A"}</span>
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEditStructure(s)} className="p-1.5 rounded-lg hover:bg-cyan-500/10 text-white/40 hover:text-cyan-400 transition-colors"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => setDeleteConfirm({ id: s.id, type: "structure" })} className="p-1.5 rounded-lg hover:bg-rose-500/10 text-white/40 hover:text-rose-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit / Create System Drawer */}
      <AnimatePresence>
        {(editingSystem || isNewSystem) && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeForm} className="fixed inset-0 bg-black/70 z-40" />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-[#111] border-l border-white/10 z-50 flex flex-col shadow-2xl">
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 shrink-0">
                <div>
                  <h2 className="font-black text-xl tracking-tight">{isNewSystem ? "Add New System" : `Edit System: ${editingSystem?.label}`}</h2>
                  <p className="text-xs text-white/40 mt-0.5">{isNewSystem ? "Define anatomical category details" : `ID: ${editingSystem?.systemId}`}</p>
                </div>
                <button onClick={closeForm} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"><X className="w-4 h-4" /></button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                <FieldGroup label="System Code (systemId) *" icon={Activity}>
                  <Input value={systemFormData.systemId} onChange={updateSystemField("systemId")} placeholder="e.g. respiratory" />
                  <p className="text-[10px] text-white/30 mt-1">Must be unique, lowercase, single word.</p>
                </FieldGroup>

                <FieldGroup label="Label *" icon={Activity}>
                  <Input value={systemFormData.label} onChange={updateSystemField("label")} placeholder="e.g. Respiratory System" />
                </FieldGroup>

                <FieldGroup label="Icon Name" icon={Settings}>
                  <select value={systemFormData.iconName} onChange={e => setSystemFormData(p => ({ ...p, iconName: e.target.value }))}
                    className="w-full h-10 bg-[#1a1a1a] border border-white/5 rounded-xl px-3 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20">
                    {Object.keys(ICON_MAP).map(icon => <option key={icon} value={icon}>{icon}</option>)}
                  </select>
                </FieldGroup>

                <FieldGroup label="Icon Color (Tailwind class)" icon={Settings}>
                  <Input value={systemFormData.iconColor} onChange={updateSystemField("iconColor")} placeholder="e.g. text-cyan-400" />
                </FieldGroup>

                <FieldGroup label="Background Gradient (from/to)" icon={Settings}>
                  <Input value={systemFormData.color} onChange={updateSystemField("color")} placeholder="e.g. from-cyan-500/20 to-cyan-500/5" />
                </FieldGroup>

                <FieldGroup label="Border Style" icon={Settings}>
                  <Input value={systemFormData.border} onChange={updateSystemField("border")} placeholder="e.g. border-cyan-500/20" />
                </FieldGroup>

                <FieldGroup label="System Description" icon={Info}>
                  <Textarea value={systemFormData.desc} onChange={updateSystemField("desc")} placeholder="Provide detailed scope of the system..." rows={3} />
                </FieldGroup>
              </div>

              <div className="px-6 py-4 border-t border-white/5 flex gap-3 shrink-0">
                <button onClick={closeForm} className="flex-1 h-11 rounded-xl border border-white/10 text-sm font-bold text-white/60 hover:text-white transition-colors">Cancel</button>
                <button onClick={handleSaveSystem} disabled={saving}
                  className="flex-1 h-11 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-sm font-black text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : isNewSystem ? "Create System" : "Save Changes"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Edit / Create Structure Drawer */}
      <AnimatePresence>
        {(editingStructure || isNewStructure) && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeForm} className="fixed inset-0 bg-black/70 z-40" />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full max-w-2xl bg-[#111] border-l border-white/10 z-50 flex flex-col shadow-2xl">
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 shrink-0">
                <div>
                  <h2 className="font-black text-xl tracking-tight">{isNewStructure ? "Add New Structure" : `Edit: ${editingStructure?.name}`}</h2>
                  <p className="text-xs text-white/40 mt-0.5">{isNewStructure ? "Fill in the details below" : `ID: ${editingStructure?.id}`}</p>
                </div>
                <button onClick={closeForm} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"><X className="w-4 h-4" /></button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                {/* Basic Info */}
                <div className="bg-white/[0.03] rounded-2xl p-4 space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-white/30 flex items-center gap-1.5"><Info className="w-3.5 h-3.5" /> Basic Info</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FieldGroup label="Name *" icon={Activity}>
                      <Input value={formData.name} onChange={updateStructureField("name")} placeholder="e.g. Frontal Bone" />
                    </FieldGroup>
                    <FieldGroup label="Latin Name" icon={Activity}>
                      <Input value={formData.latin ?? ""} onChange={updateStructureField("latin")} placeholder="e.g. Os frontale" />
                    </FieldGroup>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FieldGroup label="Slug *" icon={Activity}>
                      <Input value={formData.slug} onChange={updateStructureField("slug")} placeholder="e.g. frontal-bone" />
                    </FieldGroup>
                    <FieldGroup label="Region" icon={Activity}>
                      <Input value={formData.region ?? ""} onChange={updateStructureField("region")} placeholder="e.g. Head, Thorax" />
                    </FieldGroup>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FieldGroup label="System *" icon={Activity}>
                      <select value={formData.systemId} onChange={e => setFormData(p => ({ ...p, systemId: e.target.value }))}
                        className="w-full h-10 bg-[#1a1a1a] border border-white/5 rounded-xl px-3 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20">
                        <option value="">Select system...</option>
                        {systems.map(s => <option key={s.id} value={s.systemId}>{s.label}</option>)}
                      </select>
                    </FieldGroup>
                    <FieldGroup label="Type *" icon={Activity}>
                      <select value={formData.type} onChange={e => setFormData(p => ({ ...p, type: e.target.value }))}
                        className="w-full h-10 bg-[#1a1a1a] border border-white/5 rounded-xl px-3 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20">
                        {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                      </select>
                    </FieldGroup>
                  </div>
                  <FieldGroup label="Description *" icon={Activity}>
                    <Textarea value={formData.desc} onChange={updateStructureField("desc")} placeholder="Detailed anatomical description..." rows={3} />
                  </FieldGroup>
                </div>

                {/* Anatomical Details */}
                <div className="bg-white/[0.03] rounded-2xl p-4 space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-white/30 flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> Anatomical Details</h3>
                  <FieldGroup label="Function" icon={Activity}>
                    <Textarea value={formData.fn ?? ""} onChange={updateStructureField("fn")} placeholder="Primary anatomical function..." rows={2} />
                  </FieldGroup>
                  <div className="grid grid-cols-2 gap-4">
                    <FieldGroup label="Blood Supply" icon={Heart}>
                      <Textarea value={formData.blood ?? ""} onChange={updateStructureField("blood")} placeholder="Arterial supply, venous drainage..." rows={2} />
                    </FieldGroup>
                    <FieldGroup label="Innervation" icon={Zap}>
                      <Textarea value={formData.nerve ?? ""} onChange={updateStructureField("nerve")} placeholder="Nerve supply, dermatomes..." rows={2} />
                    </FieldGroup>
                  </div>
                  <FieldGroup label="Relations (comma-separated)" icon={ChevronRight}>
                    <Input value={Array.isArray(formData.relations) ? formData.relations.join(", ") : (formData.relations ?? "")}
                      onChange={v => setFormData(p => ({ ...p, relations: v.split(",").map(s => s.trim()).filter(Boolean) }))}
                      placeholder="Heart, Aorta, Pericardium..." />
                  </FieldGroup>
                </div>

                {/* Clinical & Mnemonics */}
                <div className="bg-rose-500/5 border border-rose-500/10 rounded-2xl p-4 space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-rose-500/60 flex items-center gap-1.5"><Info className="w-3.5 h-3.5" /> Clinical & Memory</h3>
                  <FieldGroup label="Clinical Significance" icon={Info}>
                    <Textarea value={formData.clinical ?? ""} onChange={updateStructureField("clinical")} placeholder="Clinical correlations, pathologies, high-yield facts..." rows={3} />
                  </FieldGroup>
                  <FieldGroup label="Mnemonic" icon={Zap}>
                    <Textarea value={formData.memo ?? ""} onChange={updateStructureField("memo")} placeholder="Memory aid or mnemonic..." rows={2} />
                  </FieldGroup>
                </div>

                {/* Media */}
                <div className="bg-white/[0.03] rounded-2xl p-4 space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-white/30 flex items-center gap-1.5"><Upload className="w-3.5 h-3.5" /> Media & Links</h3>
                  <FieldGroup label="Image URL" icon={Upload}>
                    <Input value={formData.imageUrl ?? ""} onChange={updateStructureField("imageUrl")} placeholder="https://..." />
                  </FieldGroup>
                  <FieldGroup label="3D Model URL" icon={Link}>
                    <Input value={formData.modelUrl ?? ""} onChange={updateStructureField("modelUrl")} placeholder="https://..." />
                  </FieldGroup>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-white/5 flex gap-3 shrink-0">
                <button onClick={closeForm} className="flex-1 h-11 rounded-xl border border-white/10 text-sm font-bold text-white/60 hover:text-white transition-colors">Cancel</button>
                <button onClick={handleSaveStructure} disabled={saving}
                  className="flex-1 h-11 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-sm font-black text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : isNewStructure ? "Create Structure" : "Save Changes"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
