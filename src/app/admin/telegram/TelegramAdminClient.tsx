
"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { Send, Settings, Users, MessageSquare, AlertCircle, ChevronRight } from "lucide-react";

interface TelegramAdminClientProps {
  linkedUsers: any[];
  initialConfig: any;
}

export function TelegramAdminClient({ linkedUsers, initialConfig }: TelegramAdminClientProps) {
  const [config, setConfig] = useState(initialConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [broadcastText, setBroadcastText] = useState("");
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const saveConfig = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/telegram/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (res.ok) toast.success("تم حفظ الإعدادات بنجاح");
      else toast.error("فشل في حفظ الإعدادات");
    } catch (err) {
      toast.error("خطأ تقني");
    } finally {
      setIsSaving(false);
    }
  };

  const startBroadcast = async () => {
    if (!broadcastText.trim()) return toast.error("يرجى كتابة نص الرسالة");
    setIsBroadcasting(true);
    try {
      const res = await fetch("/api/admin/telegram/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: broadcastText }),
      });
      const data = await res.json();
      if (res.ok) toast.success(`تم الإرسال لـ ${data.successCount} طالب`);
      else toast.error("فشل الإرسال");
    } catch (err) {
      toast.error("خطأ في الاتصال");
    } finally {
      setIsBroadcasting(false);
      setBroadcastText("");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Settings & Broadcast */}
      <div className="lg:col-span-2 space-y-6">
        <div className="p-6 bg-zinc-900/40 border border-white/5 backdrop-blur-md rounded-3xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-teal-500/20 rounded-lg text-teal-400">
              <MessageSquare size={20} />
            </div>
            <h2 className="text-xl font-semibold text-white">إرسال إشعار جماعي (Broadcast)</h2>
          </div>
          
          <textarea 
            placeholder="اكتب رسالتك هنا لجميع الطلاب المشتركين في البوت..."
            className="w-full bg-zinc-950/50 border border-white/10 rounded-2xl p-4 min-h-[120px] mb-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all"
            value={broadcastText}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBroadcastText(e.target.value)}
          />
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button 
              onClick={startBroadcast}
              disabled={isBroadcasting}
              className="w-full sm:w-auto bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-xl px-8 py-3 font-bold transition-all flex items-center justify-center gap-2"
            >
              {isBroadcasting ? "جاري الإرسال..." : "إرسال الآن"} <Send size={16} />
            </button>
            <p className="text-xs text-zinc-500">
              سيتم إرسال هذه الرسالة لـ {linkedUsers.length} طالب مربوطين حالياً.
            </p>
          </div>
        </div>

        <div className="p-6 bg-zinc-900/40 border border-white/5 backdrop-blur-md rounded-3xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
              <Settings size={20} />
            </div>
            <h2 className="text-xl font-semibold text-white">إعدادات البوت العامة</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-zinc-500 uppercase font-bold mb-2 block">رسالة الترحيب الافتراضية</label>
              <textarea 
                value={config.welcomeMessage || ""}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setConfig({...config, welcomeMessage: e.target.value})}
                className="w-full bg-zinc-950/50 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>
            <button 
              onClick={saveConfig} 
              disabled={isSaving}
              className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white rounded-xl border border-white/5 px-6 py-2 transition-all"
            >
              {isSaving ? "جاري الحفظ..." : "حفظ التغييرات"}
            </button>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="space-y-6">
        <div className="p-6 bg-zinc-900/40 border border-white/5 backdrop-blur-md h-full max-h-[800px] flex flex-col rounded-3xl overflow-hidden">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-orange-500/20 rounded-lg text-orange-400">
              <Users size={20} />
            </div>
            <h2 className="text-xl font-semibold text-white">الطلاب المشتركون</h2>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {linkedUsers.map((u) => (
              <div key={u.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5 hover:border-teal-500/30 transition-all group cursor-pointer">
                <div className="h-10 w-10 rounded-full bg-zinc-800 ring-2 ring-zinc-800 group-hover:ring-teal-500/50 overflow-hidden flex items-center justify-center text-zinc-500 font-bold shrink-0">
                  {u.image ? (
                    <img src={u.image} alt={u.name} className="w-full h-full object-cover" />
                  ) : (
                    u.name?.[0]
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{u.name}</p>
                  <p className="text-[10px] text-zinc-500 truncate uppercase tracking-tighter">
                    {u.university?.name || "No University"}
                  </p>
                </div>
                <div className="text-zinc-600 group-hover:text-teal-500 transition-colors">
                  <ChevronRight size={14} />
                </div>
              </div>
            ))}
            {linkedUsers.length === 0 && (
              <div className="text-center py-20">
                <AlertCircle size={40} className="mx-auto text-zinc-800 mb-4 opacity-50" />
                <p className="text-zinc-600 text-sm">لا يوجد طلاب مربوطين حالياً.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
