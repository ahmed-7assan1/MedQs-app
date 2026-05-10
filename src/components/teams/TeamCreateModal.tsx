"use client";

import { useState } from "react";
import { X, Users, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

interface TeamCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newTeam: any) => void;
  universityId: string;
}

export function TeamCreateModal({ isOpen, onClose, onSuccess, universityId }: TeamCreateModalProps) {
  const [name, setName] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return toast.error("Please enter a room name");
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, isPublic, universityId }),
      });
      const data = await res.json();
      if (res.ok) {
        onSuccess(data);
        toast.success("Room created successfully!");
        onClose();
      } else {
        toast.error(data.error || "Failed to create room");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="w-full max-w-md bg-white dark:bg-[#161523] border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50 dark:bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Users size={20} />
              </div>
              <div>
                <h3 className="font-black text-slate-800 dark:text-white">Create New Room</h3>
                <p className="text-xs text-slate-500 dark:text-white/40 font-medium">Start a new study group</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 dark:text-white/40 hover:text-slate-800 dark:hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-white/40">
                Room Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., USMLE Step 1 Prep"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/20 focus:outline-none focus:border-primary/50 transition-colors font-medium text-sm"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl cursor-pointer" onClick={() => setIsPublic(!isPublic)}>
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-white">Public Room</h4>
                <p className="text-xs text-slate-500 dark:text-white/40">Anyone in your university can join</p>
              </div>
              <div className={`w-10 h-6 rounded-full flex items-center px-1 transition-colors ${isPublic ? 'bg-primary' : 'bg-slate-300 dark:bg-white/10'}`}>
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isPublic ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/5 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 text-sm font-bold text-slate-600 dark:text-white/60 hover:text-slate-800 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={saving}
              className="flex-[2] py-3 bg-primary text-white text-sm font-black rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all flex justify-center items-center gap-2"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              {saving ? "Creating..." : "Create Room"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
