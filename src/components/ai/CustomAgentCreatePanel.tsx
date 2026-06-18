"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { X, Spinner, Upload, Link as LinkIcon, Trash, Plus } from "@phosphor-icons/react";
import toast from "react-hot-toast";

interface CustomAgentCreatePanelProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  editAgent?: any;
  onSaved?: () => void;
}

export function CustomAgentCreatePanel({ isOpen, onClose, isDark, editAgent, onSaved }: CustomAgentCreatePanelProps) {
  const [name, setName] = useState(editAgent?.name || "");
  const [description, setDescription] = useState(editAgent?.description || "");
  const [instructions, setInstructions] = useState(editAgent?.instructions || "");
  const [files, setFiles] = useState<{ name: string; type: string; data: string }[]>(editAgent?.files || []);
  const [links, setLinks] = useState<string[]>(editAgent?.links || []);
  const [newLink, setNewLink] = useState("");
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected) return;
    for (const file of Array.from(selected)) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`"${file.name}" exceeds 10MB limit`);
        continue;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        setFiles(prev => [...prev, { name: file.name, type: file.type, data: ev.target?.result as string }]);
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const addLink = () => {
    if (newLink.trim() && (newLink.startsWith("http://") || newLink.startsWith("https://"))) {
      setLinks(prev => [...prev, newLink.trim()]);
      setNewLink("");
    } else {
      toast.error("Enter a valid URL (http:// or https://)");
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !instructions.trim()) {
      toast.error("Name and instructions are required");
      return;
    }
    setSaving(true);
    try {
      const url = editAgent ? `/api/v1/ai/agents/${editAgent.id}` : "/api/v1/ai/agents";
      const method = editAgent ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, instructions, files, links }),
      });
      if (!res.ok) throw new Error();
      toast.success(editAgent ? "Agent updated!" : "Agent created!");
      onSaved?.();
      onClose();
    } catch {
      toast.error("Failed to save agent");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[10030]"
          onClick={onClose}
        >
          <div className={cn("absolute inset-0", isDark ? "bg-black/60 backdrop-blur-sm" : "bg-black/40 backdrop-blur-sm")} />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            onClick={e => e.stopPropagation()}
            className={cn(
              "absolute bottom-0 left-0 right-0 max-h-[92vh] rounded-t-3xl shadow-2xl flex flex-col overflow-hidden",
              isDark ? "bg-[#121212] border-t border-white/10" : "bg-white border-t border-gray-200"
            )}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className={cn("w-10 h-1 rounded-full", isDark ? "bg-white/20" : "bg-gray-300")} />
            </div>

            <div className={cn("flex items-center justify-between px-5 py-3 border-b", isDark ? "border-white/10" : "border-gray-200")}>
              <h2 className={cn("text-sm font-bold", isDark ? "text-white" : "text-gray-900")}>
                {editAgent ? "Edit Agent" : "Create Custom MedOneX"}
              </h2>
              <button onClick={onClose} className={cn("p-2 rounded-xl", isDark ? "text-gray-400 hover:bg-white/10" : "text-gray-500 hover:bg-gray-100")}>
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-5 space-y-4">
              <div>
                <label className={cn("text-xs font-bold mb-1.5 block", isDark ? "text-gray-400" : "text-gray-500")}>Name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Anatomy Expert" className={cn("w-full px-3 py-2.5 rounded-xl text-sm border outline-none transition-all", isDark ? "bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-gray-500" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-gray-300")} />
              </div>

              <div>
                <label className={cn("text-xs font-bold mb-1.5 block", isDark ? "text-gray-400" : "text-gray-500")}>Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description of what this agent does" rows={2} className={cn("w-full px-3 py-2.5 rounded-xl text-sm border outline-none resize-none transition-all", isDark ? "bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-gray-500" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-gray-300")} />
              </div>

              <div>
                <label className={cn("text-xs font-bold mb-1.5 block", isDark ? "text-gray-400" : "text-gray-500")}>Instructions (System Prompt)</label>
                <textarea value={instructions} onChange={e => setInstructions(e.target.value)} placeholder="Define how this AI should behave, what to focus on, what to avoid..." rows={5} className={cn("w-full px-3 py-2.5 rounded-xl text-sm border outline-none resize-none transition-all", isDark ? "bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-gray-500" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-gray-300")} />
              </div>

              <div>
                <label className={cn("text-xs font-bold mb-1.5 block", isDark ? "text-gray-400" : "text-gray-500")}>Files (PDF, max 10MB each)</label>
                <input ref={fileInputRef} type="file" multiple accept=".pdf,.txt,.md,.doc,.docx" onChange={handleFileSelect} className="hidden" />
                <div className="flex flex-wrap gap-2 mb-2">
                  {files.map((f, i) => (
                    <div key={i} className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs", isDark ? "bg-white/5 text-gray-300" : "bg-gray-100 text-gray-700")}>
                      <span className="truncate max-w-[120px]">{f.name}</span>
                      <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} className="text-rose-400 hover:text-rose-300"><X size={12} weight="bold" /></button>
                    </div>
                  ))}
                </div>
                <button onClick={() => fileInputRef.current?.click()} className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all", isDark ? "bg-white/5 text-gray-300 hover:bg-white/10" : "bg-gray-100 text-gray-700 hover:bg-gray-200")}>
                  <Upload size={14} /> Upload Files
                </button>
              </div>

              <div>
                <label className={cn("text-xs font-bold mb-1.5 block", isDark ? "text-gray-400" : "text-gray-500")}>Reference Links</label>
                <div className="flex gap-2 mb-2">
                  <input value={newLink} onChange={e => setNewLink(e.target.value)} onKeyDown={e => e.key === "Enter" && addLink()} placeholder="https://..." className={cn("flex-1 px-3 py-2 rounded-xl text-sm border outline-none transition-all", isDark ? "bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-gray-500" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-gray-300")} />
                  <button onClick={addLink} className={cn("px-3 py-2 rounded-xl text-sm font-bold transition-all", isDark ? "bg-white/10 text-white hover:bg-white/20" : "bg-gray-100 text-gray-700 hover:bg-gray-200")}><Plus size={16} weight="bold" /></button>
                </div>
                {links.map((l, i) => (
                  <div key={i} className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs mb-1", isDark ? "bg-white/5 text-gray-300" : "bg-gray-100 text-gray-700")}>
                    <LinkIcon size={12} />
                    <span className="truncate flex-1">{l}</span>
                    <button onClick={() => setLinks(prev => prev.filter((_, j) => j !== i))} className="text-rose-400 hover:text-rose-300"><X size={12} weight="bold" /></button>
                  </div>
                ))}
              </div>
            </div>

            <div className={cn("flex gap-3 px-5 py-4 border-t", isDark ? "border-white/10" : "border-gray-200")}>
              <button onClick={onClose} className={cn("flex-1 py-2.5 rounded-xl text-sm font-bold transition-all", isDark ? "text-gray-400 hover:bg-white/10" : "text-gray-500 hover:bg-gray-100")}>Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/20">
                {saving ? <Spinner size={16} className="animate-spin mx-auto" /> : editAgent ? "Update Agent" : "Create Agent"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
