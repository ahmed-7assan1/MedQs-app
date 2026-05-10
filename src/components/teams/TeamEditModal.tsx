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
  const [activeTab, setActiveTab] = useState<"profile" | "telegram">("profile");
  const [formData, setFormData] = useState({
    name: team.name,
    description: team.description || "",
    imageUrl: team.imageUrl || "",
    coverUrl: team.coverUrl || "",
    telegramGroupId: team.telegramGroupId || "",
    telegramTemplate: team.telegramTemplate || "🎓 *New Material Added*\n\n📚 *Subject:* {{subject}}\n📖 *Lecture:* {{lecture}}\n📝 *Title:* {{title}}\n\n🔗 [Access on Site]({{link}})\n\n#{{subject_tag}} #MedOneX",
    summaryFrequency: team.summaryFrequency || "NONE",
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
        toast.success("Team settings updated!");
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

  const renderPreview = () => {
    let preview = formData.telegramTemplate
      .replace(/{{subject}}/g, "Biochemistry")
      .replace(/{{lecture}}/g, "Protein Synthesis")
      .replace(/{{title}}/g, "Lecture Video - Part 1")
      .replace(/{{link}}/g, "https://medonex.com/lectures/...")
      .replace(/{{subject_tag}}/g, "Biochemistry");

    return (
      <div className="bg-[#1c1b2e] rounded-2xl p-6 border border-white/5 relative group">
        <div className="absolute top-4 right-4 h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
            <Save className="h-4 w-4 text-blue-500 opacity-40" />
        </div>
        <p className="text-white/80 whitespace-pre-wrap font-medium text-sm leading-relaxed">
          {preview}
        </p>
        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Telegram Preview</span>
            <span className="text-[10px] text-blue-400 font-bold">12:00 PM</span>
        </div>
      </div>
    );
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
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-3xl bg-[#0d0c14] border border-white/5 rounded-[48px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="flex items-center justify-between p-10 border-b border-white/5">
               <div>
                  <h2 className="text-3xl font-black text-white">Team Management</h2>
                  <div className="flex items-center gap-6 mt-4">
                     <button 
                        onClick={() => setActiveTab("profile")}
                        className={`text-[11px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === "profile" ? "text-primary border-b-2 border-primary pb-1" : "text-white/30 hover:text-white/60"}`}
                     >
                        Identity & Profile
                     </button>
                     <button 
                        onClick={() => setActiveTab("telegram")}
                        className={`text-[11px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === "telegram" ? "text-primary border-b-2 border-primary pb-1" : "text-white/30 hover:text-white/60"}`}
                     >
                        Telegram Sync
                     </button>
                  </div>
               </div>
               <button onClick={onClose} className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors">
                  <X className="h-6 w-6" />
               </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 no-scrollbar">
               {activeTab === "profile" ? (
                  <div className="space-y-10">
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
                           className="w-full h-16 bg-white/5 border border-white/5 rounded-3xl px-8 text-white font-bold focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                         />
                       </div>

                       <div>
                         <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-3">About the Team</label>
                         <textarea 
                           rows={4}
                           value={formData.description}
                           onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                           className="w-full bg-white/5 border border-white/5 rounded-3xl p-8 text-white font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                           placeholder="Tell students what this team is about..."
                         />
                       </div>
                    </div>
                  </div>
               ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                     <div className="space-y-8">
                        <div>
                           <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-3">Telegram Group ID</label>
                           <input 
                              type="text" 
                              value={formData.telegramGroupId}
                              onChange={(e) => setFormData(prev => ({ ...prev, telegramGroupId: e.target.value }))}
                              placeholder="-100xxxxxxxxx"
                              className="w-full h-16 bg-white/5 border border-white/5 rounded-3xl px-8 text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                           />
                           <p className="text-[10px] text-white/30 mt-2 font-bold uppercase">Add our bot to your group and paste its ID here.</p>
                        </div>

                        <div>
                           <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-3">Summary Frequency</label>
                           <select 
                              value={formData.summaryFrequency}
                              onChange={(e) => setFormData(prev => ({ ...prev, summaryFrequency: e.target.value }))}
                              className="w-full h-16 bg-white/5 border border-white/5 rounded-3xl px-8 text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none transition-all"
                           >
                              <option value="NONE">No Automated Summaries</option>
                              <option value="DAILY">Daily Summary</option>
                              <option value="WEEKLY">Weekly Summary</option>
                              <option value="MONTHLY">Monthly Summary</option>
                           </select>
                        </div>

                        <div>
                           <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-3">Custom Message Template</label>
                           <textarea 
                              rows={8}
                              value={formData.telegramTemplate}
                              onChange={(e) => setFormData(prev => ({ ...prev, telegramTemplate: e.target.value }))}
                              className="w-full bg-white/5 border border-white/5 rounded-3xl p-8 text-white font-medium font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none"
                              placeholder="🎓 *New Material*..."
                           />
                           <div className="flex flex-wrap gap-2 mt-3">
                              {['subject', 'lecture', 'title', 'link', 'subject_tag'].map(tag => (
                                 <span key={tag} className="px-2 py-1 bg-white/5 rounded-md text-[9px] text-white/40 font-bold tracking-tighter">{"{{"}{tag}{"}}"}</span>
                              ))}
                           </div>
                        </div>
                     </div>

                     <div className="space-y-6">
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Live Broadcast Preview</label>
                        {renderPreview()}
                        
                        <div className="p-6 rounded-3xl bg-blue-500/5 border border-blue-500/10">
                           <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Pro Tip</p>
                           <p className="text-[11px] text-white/60 leading-relaxed font-medium">
                              Use Markdown (like *bold* or _italic_) to make your messages stand out. The bot will automatically replace tags with actual data.
                           </p>
                        </div>
                     </div>
                  </div>
               )}
            </div>

            <div className="p-10 border-t border-white/5 bg-white/[0.02] flex gap-4">
               <button onClick={onClose} className="flex-1 h-16 rounded-[24px] border border-white/5 text-white font-black uppercase tracking-widest hover:bg-white/5 transition-all">
                  Discard
               </button>
               <button 
                onClick={handleSave}
                disabled={saving}
                className="flex-[2] h-16 rounded-[24px] btn-gradient text-white font-black uppercase tracking-widest shadow-2xl shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-50 transition-all"
               >
                  {saving ? <Loader2 className="h-6 w-6 animate-spin" /> : <Save className="h-6 w-6" />}
                  {saving ? "Processing..." : "Commit Changes"}
               </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
