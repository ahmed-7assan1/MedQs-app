"use client";

import { useState } from "react";
import { 
  Plus, Save, Trash2, X, Check, Search, 
  Stethoscope, HeartPulse, Activity, Microscope, Pill, FlaskConical, 
  Dna, Atom, Brain, Bone, Syringe, Tablets, 
  ClipboardList, Thermometer, Eye, Ear, Hand, Biohazard,
  Layers, ChevronDown, CheckCircle2
} from "lucide-react";
import toast from "react-hot-toast";
import { apiErrorMessage } from "@/lib/api-error-client";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type SubjectItem = { id: string; name: string; icon?: string | null };

const MEDICAL_ICONS = [
  { id: "Brain", icon: Brain, label: "Neurology" },
  { id: "Bone", icon: Bone, label: "Orthopedics" },
  { id: "HeartPulse", icon: HeartPulse, label: "Cardiology" },
  { id: "Activity", icon: Activity, label: "Physiology" },
  { id: "Microscope", icon: Microscope, label: "Histology" },
  { id: "Pill", icon: Pill, label: "Pharmacology" },
  { id: "FlaskConical", icon: FlaskConical, label: "Pathology" },
  { id: "Dna", icon: Dna, label: "Genetics" },
  { id: "Atom", icon: Atom, label: "Microbiology" },
  { id: "Stethoscope", icon: Stethoscope, label: "General Med" },
  { id: "Syringe", icon: Syringe, label: "Immunology" },
  { id: "CheckCircle2", icon: CheckCircle2, label: "Surgery" },
  { id: "Tablets", icon: Tablets, label: "Pharma" },
  { id: "ClipboardList", icon: ClipboardList, label: "Notes" },
  { id: "Thermometer", icon: Thermometer, label: "Internal Med" },
  { id: "Eye", icon: Eye, label: "Ophthalmology" },
  { id: "Ear", icon: Ear, label: "ENT" },
  { id: "Hand", icon: Hand, label: "Anatomy" },
  { id: "Biohazard", icon: Biohazard, label: "Infection" },
  { id: "Layers", icon: Layers, label: "General" },
];

function IconPicker({ selected, onSelect }: { selected: string | null; onSelect: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const SelectedIcon = MEDICAL_ICONS.find(i => i.id === selected)?.icon || Layers;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="h-10 w-10 rounded-xl bg-muted border border-border flex items-center justify-center hover:bg-muted/80 transition-all text-muted-foreground hover:text-primary"
        title="Select Icon"
      >
        <SelectedIcon className="h-5 w-5" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-[60]" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="absolute left-0 bottom-full mb-2 z-[70] w-[280px] bg-card border border-border rounded-2xl p-4 shadow-2xl grid grid-cols-5 gap-2"
            >
              {MEDICAL_ICONS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { onSelect(item.id); setOpen(false); }}
                  className={cn(
                    "h-10 w-10 rounded-lg flex items-center justify-center transition-all",
                    selected === item.id ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  title={item.label}
                >
                  <item.icon className="h-5 w-5" />
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export function SubjectInlineManager({
  moduleId,
  initialSubjects,
}: {
  moduleId: string;
  initialSubjects: SubjectItem[];
}) {
  const [subjects, setSubjects] = useState(initialSubjects);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState<string>("Layers");
  const [open, setOpen] = useState(false);

  async function addSubject() {
    if (!newName.trim()) return;
    const res = await fetch(`/api/v1/modules/${moduleId}/subjects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), icon: newIcon }),
    });
    if (!res.ok) return toast.error(await apiErrorMessage(res, "Failed to add subject"));
    const row = await res.json();
    setSubjects((prev) => [...prev, row]);
    setNewName("");
    setNewIcon("Layers");
    toast.success("Subject added");
  }

  async function updateSubject(id: string, name: string, icon: string | null) {
    const res = await fetch(`/api/v1/subjects/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, icon }),
    });
    if (!res.ok) {
      toast.error(await apiErrorMessage(res, "Update failed"));
      return;
    }
    setSubjects((prev) => prev.map((s) => (s.id === id ? { ...s, name, icon } : s)));
    toast.success("Subject updated");
  }

  async function deleteSubject(id: string) {
    if (!confirm("Delete this subject and all its lectures/questions?")) return;
    const res = await fetch(`/api/v1/subjects/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error(await apiErrorMessage(res, "Delete failed"));
      return;
    }
    setSubjects((prev) => prev.filter((s) => s.id !== id));
    toast.success("Subject deleted");
  }

  return (
    <div className="mb-12 rounded-[32px] border border-border bg-card/50 backdrop-blur-xl p-6 md:p-8 shadow-sm">
      <div className="mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-foreground tracking-tight">Curriculum Studio</h3>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Manage module disciplines</p>
          </div>
        </div>
        <button 
          onClick={() => setOpen((v) => !v)} 
          className={cn(
            "w-full sm:w-auto rounded-xl px-5 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all",
            open ? "bg-muted text-muted-foreground hover:text-foreground" : "btn-gradient text-white shadow-lg"
          )}
        >
          {open ? "Close Editor" : "Open Editor"}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mb-8 flex flex-col sm:flex-row gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
              <div className="flex gap-3 flex-1">
                <IconPicker selected={newIcon} onSelect={setNewIcon} />
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="New discipline name..."
                  className="flex-1 bg-transparent border-none focus:ring-0 text-foreground placeholder:text-muted-foreground/40 text-sm font-bold"
                />
              </div>
              <button 
                onClick={() => void addSubject()} 
                className="btn-gradient inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-primary/20 hover:scale-105 transition-all"
              >
                <Plus className="h-4 w-4" /> Add Discipline
              </button>
            </div>

            <div className="grid gap-3">
              {subjects.map((s) => (
                <SubjectRow key={s.id} subject={s} onUpdate={updateSubject} onDelete={deleteSubject} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SubjectRow({
  subject,
  onUpdate,
  onDelete,
}: {
  subject: SubjectItem;
  onUpdate: (id: string, name: string, icon: string | null) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [name, setName] = useState(subject.name);
  const [icon, setIcon] = useState<string | null>(subject.icon || null);
  const [isEditing, setIsEditing] = useState(false);

  const hasChanges = name !== subject.name || icon !== subject.icon;

  return (
    <div className="group flex items-center gap-4 rounded-2xl bg-muted/20 border border-border p-3 hover:bg-muted/40 transition-all">
      <IconPicker selected={icon} onSelect={(id) => { setIcon(id); setIsEditing(true); }} />
      
      <input 
        value={name} 
        onChange={(e) => { setName(e.target.value); setIsEditing(true); }} 
        className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-bold text-foreground group-hover:text-primary transition-colors" 
      />

      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {isEditing && hasChanges && (
          <button 
            onClick={() => { void onUpdate(subject.id, name.trim(), icon); setIsEditing(false); }} 
            className="h-8 w-8 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all"
          >
            <Check className="h-4 w-4" />
          </button>
        )}
        <button 
          onClick={() => void onDelete(subject.id)} 
          className="h-8 w-8 rounded-lg bg-red-500/10 text-red-500/60 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
