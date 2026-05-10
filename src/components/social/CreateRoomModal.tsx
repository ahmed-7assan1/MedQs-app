"use client";

import { useState } from "react";
import { X, Users, Lock, Globe, Hash } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

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
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return toast.error("اسم الروم مطلوب");
    setSaving(true);
    try {
      const res = await fetch("/api/v1/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, isPublic, memberLimit }),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || "فشل إنشاء الروم");
      toast.success("تم إنشاء الروم بنجاح! 🎉");
      onSuccess(data);
      onClose();
      setName(""); setDescription("");
    } catch {
      toast.error("حدث خطأ ما");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[500] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)" }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
            style={{
              background: "rgba(22, 21, 35, 0.95)",
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(20px)",
            }}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
                  <Users size={20} weight="fill" />
                </div>
                <div>
                  <h3 className="font-black text-white text-sm">إنشاء روم جديدة</h3>
                  <p className="text-[11px] text-white/30">ابدأ مجموعة مذاكرة خاصة بيك</p>
                </div>
              </div>
              <button onClick={onClose} className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30">اسم الروم *</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: مذاكرة Anatomy Year 2"
                  className="w-full px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-primary/50 transition-colors text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30">وصف (اختياري)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="اكتب وصف مختصر للروم..."
                  rows={2}
                  className="w-full px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-primary/50 transition-colors text-sm resize-none"
                />
              </div>

              {/* Member limit */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/30">
                  حد الأعضاء: <span className="text-primary">{memberLimit}</span> طالب
                </label>
                <input
                  type="range" min={2} max={50} value={memberLimit}
                  onChange={(e) => setMemberLimit(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-[10px] text-white/20">
                  <span>2</span><span>50</span>
                </div>
              </div>

              {/* Public / Private toggle */}
              <button
                onClick={() => setIsPublic(!isPublic)}
                className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl hover:border-primary/30 transition-all"
              >
                <div className="flex items-center gap-3">
                  {isPublic ? <Globe size={18} className="text-emerald-400" /> : <Lock size={18} className="text-amber-400" />}
                  <div className="text-left">
                    <p className="text-sm font-bold text-white">{isPublic ? "روم عامة" : "روم خاصة"}</p>
                    <p className="text-[10px] text-white/30">{isPublic ? "أي طالب في جامعتك يقدر يشوفها وينضم" : "بس عن طريق الكود السري"}</p>
                  </div>
                </div>
                <div className={`w-11 h-6 rounded-full flex items-center px-1 transition-colors ${isPublic ? "bg-emerald-500" : "bg-amber-500"}`}>
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isPublic ? "translate-x-5" : "translate-x-0"}`} />
                </div>
              </button>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/5 flex gap-3">
              <button onClick={onClose} className="flex-1 py-3 text-sm font-bold text-white/40 hover:text-white transition-colors rounded-xl hover:bg-white/5">
                إلغاء
              </button>
              <button
                onClick={handleCreate}
                disabled={saving}
                className="flex-[2] py-3 bg-primary text-white text-sm font-black rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50"
              >
                {saving ? "جارٍ الإنشاء..." : "إنشاء الروم 🚀"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
