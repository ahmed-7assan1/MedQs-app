"use client";

import { useState } from "react";
import { X, Hash, ArrowRight } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface JoinRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (roomId: string) => void;
}

export function JoinRoomModal({ isOpen, onClose, onSuccess }: JoinRoomModalProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleJoin = async () => {
    if (code.trim().length < 4) return toast.error("أدخل الكود الصحيح");
    setLoading(true);
    try {
      const res = await fetch("/api/v1/rooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || "فشل الانضمام");
      toast.success("انضممت للروم بنجاح!");
      onSuccess?.(data.roomId);
      onClose();
      router.push(`/rooms/${data.roomId}`);
    } catch {
      toast.error("حدث خطأ ما");
    } finally {
      setLoading(false);
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
            className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
            style={{ background: "rgba(22,21,35,0.95)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)" }}
          >
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Hash size={20} weight="bold" />
                </div>
                <div>
                  <h3 className="font-black text-white text-sm">انضم بالكود</h3>
                  <p className="text-[11px] text-white/30">أدخل كود الدعوة</p>
                </div>
              </div>
              <button onClick={onClose} className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                placeholder="مثال: MED4XZ"
                maxLength={8}
                className="w-full px-4 py-4 bg-white/5 border border-white/5 rounded-xl text-white text-center text-2xl font-black tracking-[0.3em] placeholder-white/10 focus:outline-none focus:border-primary/50 transition-colors uppercase"
              />
              <p className="text-center text-[11px] text-white/30">اطلب الكود من صاحب الروم</p>
            </div>

            <div className="p-4 border-t border-white/5 flex gap-3">
              <button onClick={onClose} className="flex-1 py-3 text-sm font-bold text-white/40 hover:text-white transition-colors rounded-xl hover:bg-white/5">إلغاء</button>
              <button
                onClick={handleJoin}
                disabled={loading || code.length < 4}
                className="flex-[2] py-3 bg-blue-500 text-white text-sm font-black rounded-xl hover:opacity-90 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {loading ? "جارٍ الانضمام..." : (<>انضم <ArrowRight size={16} weight="bold" /></>)}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
