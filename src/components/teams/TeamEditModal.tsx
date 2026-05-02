"use client";

import { useState } from "react";
import { X, Camera, Image as ImageIcon, Loader2, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ImageUploadWithCrop } from "../ui/ImageUploadWithCrop";
import toast from "react-hot-toast";

interface TeamEditModalProps {
  team: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedTeam: any) => void;
}

export function TeamEditModal({ team, isOpen, onClose, onUpdate }: TeamEditModalProps) {
  const [formData, setFormData] = useState({
    name: team.name,
    description: team.description || "",
    imageUrl: team.imageUrl || "",
    coverUrl: team.coverUrl || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/teams/${team.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        onUpdate(data);
        toast.success("Team updated successfully!");
        onClose();
      } else {
        toast.error(data.error || "Failed to update team");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-[#131220] border border-white/5 rounded-[40px] shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-8 border-b border-white/5">
               <div>
                  <h2 className="text-2xl font-black text-white">Edit Team Profile</h2>
                  <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-1">Customize your team's visual identity</p>
               </div>
               <button onClick={onClose} className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors">
                  <X className="h-5 w-5" />
               </button>
            </div>

            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto no-scrollbar">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <ImageUploadWithCrop 
                    label="Team Logo"
                    value={formData.imageUrl}
                    onChange={(url) => setFormData(prev => ({ ...prev, imageUrl: url }))}
                    cropShape="round"
                    aspect={1}
                  />
                  <ImageUploadWithCrop 
                    label="Cover Banner"
                    value={formData.coverUrl}
                    onChange={(url) => setFormData(prev => ({ ...prev, coverUrl: url }))}
                    cropShape="rect"
                    aspect={21/9}
                  />
               </div>

               <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-3">Team Name</label>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl px-6 text-white font-bold focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-3">About the Team</label>
                    <textarea 
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full bg-white/5 border border-white/5 rounded-2xl p-6 text-white font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                      placeholder="Tell students what this team is about..."
                    />
                  </div>
               </div>
            </div>

            <div className="p-8 border-t border-white/5 flex gap-4">
               <button onClick={onClose} className="flex-1 h-14 rounded-2xl border border-white/5 text-white font-black uppercase tracking-widest hover:bg-white/5 transition-all">
                  Cancel
               </button>
               <button 
                onClick={handleSave}
                disabled={saving}
                className="flex-[2] h-14 rounded-2xl btn-gradient text-white font-black uppercase tracking-widest shadow-xl shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-50 transition-all"
               >
                  {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                  {saving ? "Saving Changes..." : "Update Team"}
               </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
