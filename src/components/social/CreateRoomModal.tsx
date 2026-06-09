"use client";

import { useState } from "react";
import { 
  X, 
  Users, 
  Lock, 
  Globe, 
  Hash, 
  Plus, 
  CaretRight,
  SpotifyLogo,
  TelegramLogo,
  Image as ImageIcon
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (room: any) => void;
}

export function CreateRoomModal({ isOpen, onClose, onSuccess }: CreateRoomModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [memberLimit, setMemberLimit] = useState(10);
  const [spotifyUrl, setSpotifyUrl] = useState("");
  const [telegramMediaUrl, setTelegramMediaUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);

  const handleCreate = async () => {
    if (!name.trim()) return toast.error("Room name is required");
    setSaving(true);
    try {
      const res = await fetch("/api/v1/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name, 
          description, 
          isPublic, 
          memberLimit,
          spotifyUrl: spotifyUrl.trim() || undefined,
          telegramMediaUrl: telegramMediaUrl.trim() || undefined
        }),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || "Failed to create room");
      toast.success("Room created successfully!");
      onSuccess(data);
      onClose();
      reset();
    } catch {
      toast.error("An error occurred during handoff");
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setName(""); 
    setDescription(""); 
    setStep(1); 
    setSpotifyUrl(""); 
    setTelegramMediaUrl("");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[500] flex items-end md:items-center justify-center p-0 md:p-4 max-md:overflow-y-auto"
          style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(16px)" }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            className="w-full max-w-lg max-md:max-h-[90dvh] max-md:overflow-y-auto max-md:rounded-t-[32px] md:rounded-[40px] rounded-[40px] overflow-hidden shadow-[0_32px_64px_rgba(0,0,0,0.5)] border border-white/10 relative"
            style={{ background: "linear-gradient(135deg, #161523 0%, #0d0c16 100%)" }}
          >
            {/* Background Glows */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 blur-[80px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 blur-[80px] pointer-events-none" />

            {/* Header */}
            <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between relative z-10">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-inner">
                  <Users size={24} weight="fill" />
                </div>
                <div>
                  <h3 className="font-black text-white text-lg tracking-tight">Create Study Circle</h3>
                  <p className="text-[11px] font-bold text-white/30 uppercase tracking-widest">Signal Hub Initialization</p>
                </div>
              </div>
              <button onClick={() => { onClose(); reset(); }} className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all">
                <X size={20} weight="bold" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 md:p-8 relative z-10 min-h-0 md:min-h-[400px] flex flex-col">
              
              <AnimatePresence mode="wait">
                {step === 1 ? (
                  <motion.div 
                    key="step1"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 20, opacity: 0 }}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">Circle Identity</label>
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Pathology Peer Review"
                        className="w-full px-6 py-4 bg-white/5 border border-white/5 rounded-2xl text-white placeholder-white/10 focus:outline-none focus:border-primary/50 transition-all text-[15px] font-medium"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">Circle Objective</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Define the goals of this group..."
                        rows={3}
                        className="w-full px-6 py-4 bg-white/5 border border-white/5 rounded-2xl text-white placeholder-white/10 focus:outline-none focus:border-primary/50 transition-all text-[15px] font-medium resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">Member Limit</label>
                        <div className="relative">
                           <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                           <input
                             type="number" min={2} max={50} value={memberLimit}
                             onChange={(e) => setMemberLimit(Number(e.target.value))}
                             className="w-full px-12 py-3.5 bg-white/5 border border-white/5 rounded-2xl text-white focus:outline-none focus:border-primary/50 transition-all text-[14px] font-bold"
                           />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">Privacy Mode</label>
                        <button
                          onClick={() => setIsPublic(!isPublic)}
                          className={cn(
                            "w-full flex items-center justify-between px-5 py-3.5 rounded-2xl border transition-all",
                            isPublic ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" : "bg-amber-500/5 border-amber-500/20 text-amber-400"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            {isPublic ? <Globe size={18} weight="fill" /> : <Lock size={18} weight="fill" />}
                            <span className="text-[13px] font-black uppercase tracking-widest">{isPublic ? "Public" : "Private"}</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="step2"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    className="space-y-6"
                  >
                    <div className="p-5 rounded-3xl bg-blue-500/5 border border-blue-500/10 mb-6">
                       <p className="text-[12px] font-medium text-blue-400 leading-relaxed italic">
                         "Optimize your study environment with integrated media signal sync."
                       </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-1 flex items-center gap-2">
                        <SpotifyLogo size={14} className="text-emerald-500" weight="fill" /> Spotify Integration
                      </label>
                      <input
                        value={spotifyUrl}
                        onChange={(e) => setSpotifyUrl(e.target.value)}
                        placeholder="https://open.spotify.com/playlist/..."
                        className="w-full px-6 py-4 bg-white/5 border border-white/5 rounded-2xl text-white placeholder-white/10 focus:outline-none focus:border-emerald-500/50 transition-all text-[14px] font-medium"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-1 flex items-center gap-2">
                        <TelegramLogo size={14} className="text-[#229ED9]" weight="fill" /> Telegram Media Signal
                      </label>
                      <input
                        value={telegramMediaUrl}
                        onChange={(e) => setTelegramMediaUrl(e.target.value)}
                        placeholder="Telegram voice message link..."
                        className="w-full px-6 py-4 bg-white/5 border border-white/5 rounded-2xl text-white placeholder-white/10 focus:outline-none focus:border-[#229ED9]/50 transition-all text-[14px] font-medium"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action Area */}
              <div className="mt-auto pt-10 flex flex-col gap-4">
                 <div className="flex gap-4">
                   {step === 2 && (
                     <button 
                       onClick={() => setStep(1)} 
                       className="flex-1 py-4 text-sm font-black uppercase tracking-widest text-white/30 hover:text-white transition-all rounded-2xl bg-white/5 border border-white/5"
                     >
                        Back
                     </button>
                   )}
                   <button
                     onClick={() => {
                        if (step === 1) setStep(2);
                        else handleCreate();
                     }}
                     disabled={saving}
                     className="flex-[2] py-4 bg-primary text-white text-sm font-black uppercase tracking-widest rounded-2xl shadow-[0_10px_30px_rgba(var(--primary-rgb),0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                   >
                     {saving ? "Initializing Signal..." : (step === 1 ? "Next Step" : "Finalize Room")}
                     {step === 1 && <CaretRight size={18} weight="bold" />}
                   </button>
                 </div>
              </div>
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
