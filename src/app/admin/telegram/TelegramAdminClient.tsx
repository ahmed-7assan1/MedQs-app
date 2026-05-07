
"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { 
  Send, Settings, Users, MessageSquare, AlertCircle, 
  ChevronRight, Search, X, Mail, Phone, Facebook, 
  Instagram, BarChart3, Clock, Fingerprint
} from "lucide-react";

interface TelegramAdminClientProps {
  linkedUsers: any[];
  initialConfig: any;
}

export function TelegramAdminClient({ linkedUsers, initialConfig }: TelegramAdminClientProps) {
  const [config, setConfig] = useState(initialConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [broadcastText, setBroadcastText] = useState("");
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [broadcastTarget, setBroadcastTarget] = useState<"all" | "selected">("all");

  const filteredUsers = linkedUsers.filter(u => 
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.telegramId?.includes(searchQuery)
  );

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
      const payload = broadcastTarget === "selected" && selectedUser 
        ? { message: broadcastText, telegramId: selectedUser.telegramId }
        : { message: broadcastText };

      const res = await fetch("/api/admin/telegram/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) toast.success(broadcastTarget === "selected" ? "تم إرسال الرسالة الخاصة" : `تم الإرسال لـ ${data.successCount} طالب`);
      else toast.error(data.error || "فشل الإرسال");
    } catch (err) {
      toast.error("خطأ في الاتصال");
    } finally {
      setIsBroadcasting(false);
      setBroadcastText("");
    }
  };

  const getActivityLevel = (count: number) => {
    if (count > 50) return { label: "High Activity", color: "text-teal-400", bg: "bg-teal-500/10" };
    if (count > 10) return { label: "Active", color: "text-blue-400", bg: "bg-blue-500/10" };
    if (count > 0) return { label: "Occasional", color: "text-zinc-400", bg: "bg-zinc-500/10" };
    return { label: "Inactive", color: "text-red-400", bg: "bg-red-500/10" };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
      {/* Settings & Broadcast */}
      <div className="lg:col-span-2 space-y-6">
        <div className="p-6 bg-zinc-900/40 border border-white/5 backdrop-blur-md rounded-3xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-500/20 rounded-lg text-teal-400">
                <MessageSquare size={20} />
              </div>
              <h2 className="text-xl font-semibold text-white">نظام المراسلة والبرودكاست</h2>
            </div>
            
            <div className="flex bg-zinc-950/50 p-1 rounded-xl border border-white/5">
               <button 
                onClick={() => setBroadcastTarget("all")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${broadcastTarget === 'all' ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/20' : 'text-zinc-500 hover:text-zinc-300'}`}
               >
                 الكل
               </button>
               <button 
                onClick={() => {
                  if (!selectedUser) toast.error("اختر طالباً أولاً من القائمة");
                  else setBroadcastTarget("selected");
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${broadcastTarget === 'selected' ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/20' : 'text-zinc-500 hover:text-zinc-300'}`}
               >
                 خاص
               </button>
            </div>
          </div>
          
          <div className="relative group">
            {broadcastTarget === "selected" && selectedUser && (
              <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-teal-500/10 text-teal-400 px-3 py-1 rounded-full border border-teal-500/20 text-[10px] font-bold">
                إلى: {selectedUser.name} <X size={10} className="cursor-pointer" onClick={() => setBroadcastTarget("all")} />
              </div>
            )}
            <textarea 
              placeholder={broadcastTarget === 'all' ? "اكتب رسالتك لجميع طلاب السيمستر..." : `اكتب رسالة خاصة لـ ${selectedUser?.name || 'الطالب'}...`}
              className="w-full bg-zinc-950/50 border border-white/10 rounded-2xl p-4 min-h-[140px] mb-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all pt-10"
              value={broadcastText}
              onChange={(e) => setBroadcastText(e.target.value)}
            />
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button 
              onClick={startBroadcast}
              disabled={isBroadcasting}
              className="w-full sm:w-auto bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-xl px-8 py-3 font-bold transition-all flex items-center justify-center gap-2"
            >
              {isBroadcasting ? "جاري الإرسال..." : "إرسال الآن"} <Send size={16} />
            </button>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
              {broadcastTarget === 'all' ? `سيصل لـ ${linkedUsers.length} طالب في سيمسترك` : `سيصل للطالب ${selectedUser?.name} بشكل خاص`}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="text-[10px] text-zinc-500 uppercase font-bold mb-2 block tracking-widest">المحرك الافتراضي</label>
              <select 
                value={config.defaultProvider || "gemini"}
                onChange={(e) => setConfig({...config, defaultProvider: e.target.value})}
                className="w-full bg-zinc-950/50 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 appearance-none cursor-pointer"
              >
                <option value="gemini">Google Gemini</option>
                <option value="groq">Groq (Llama 3)</option>
                <option value="xai">xAI Grok</option>
                <option value="openai">OpenAI (GPT-4o)</option>
                <option value="duckduckgo">DuckDuckGo (Free)</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 uppercase font-bold mb-2 block tracking-widest">الحالة العامة للبوت</label>
              <select 
                value={config.botStatus || "ACTIVE"}
                onChange={(e) => setConfig({...config, botStatus: e.target.value})}
                className="w-full bg-zinc-950/50 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 appearance-none cursor-pointer"
              >
                <option value="ACTIVE">نشط (Active)</option>
                <option value="MAINTENANCE">صيانة (Maintenance)</option>
                <option value="DISABLED">معطل (Disabled)</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-zinc-500 uppercase font-bold mb-2 block tracking-widest">رسالة الترحيب</label>
              <textarea 
                value={config.welcomeMessage || ""}
                onChange={(e) => setConfig({...config, welcomeMessage: e.target.value})}
                className="w-full bg-zinc-950/50 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 min-h-[100px]"
              />
            </div>
            <button 
              onClick={saveConfig} 
              disabled={isSaving}
              className="w-full sm:w-auto bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white rounded-xl border border-white/5 px-8 py-3 transition-all font-bold text-sm"
            >
              {isSaving ? "جاري الحفظ..." : "حفظ التغييرات"}
            </button>
          </div>
        </div>
      </div>

      {/* Users List & Search */}
      <div className="space-y-6">
        <div className="p-6 bg-zinc-900/40 border border-white/5 backdrop-blur-md h-full max-h-[850px] flex flex-col rounded-3xl overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/20 rounded-lg text-orange-400">
                <Users size={20} />
              </div>
              <h2 className="text-xl font-semibold text-white">الطلاب</h2>
            </div>
            <span className="text-[10px] bg-white/5 px-2 py-1 rounded-md text-zinc-500 font-mono">
              {filteredUsers.length}
            </span>
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
            <input 
              type="text" 
              placeholder="ابحث بالاسم، الإيميل، أو الـ ID..."
              className="w-full bg-zinc-950/50 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {filteredUsers.map((u) => (
              <div 
                key={u.id} 
                onClick={() => setSelectedUser(u)}
                className={`flex items-center gap-3 p-3 rounded-2xl border transition-all group cursor-pointer ${selectedUser?.id === u.id ? 'bg-teal-500/10 border-teal-500/40' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
              >
                <div className="h-11 w-11 rounded-2xl bg-zinc-800 ring-2 ring-zinc-800 group-hover:ring-teal-500/50 overflow-hidden flex items-center justify-center text-zinc-500 font-bold shrink-0 transition-all">
                  {u.image ? (
                    <img src={u.image} alt={u.name} className="w-full h-full object-cover" />
                  ) : (
                    u.name?.[0]
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{u.name}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-zinc-500 uppercase tracking-tighter truncate max-w-[80px]">
                      {u.semester?.name || "No Semester"}
                    </span>
                    <span className={`h-1 w-1 rounded-full ${u._count.aiUsageLogs > 10 ? 'bg-teal-500' : 'bg-zinc-700'}`} />
                    <span className="text-[9px] text-zinc-600">ID: {u.id.slice(0, 5)}</span>
                  </div>
                </div>
                <div className="text-zinc-700 group-hover:text-teal-500 transition-colors">
                  <ChevronRight size={14} />
                </div>
              </div>
            ))}
            
            {filteredUsers.length === 0 && (
              <div className="text-center py-20">
                <AlertCircle size={40} className="mx-auto text-zinc-800 mb-4 opacity-50" />
                <p className="text-zinc-600 text-sm">لا يوجد نتائج لهذا البحث.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Student Detail Modal (Overlay) */}
      {selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedUser(null)} />
          <div className="relative bg-zinc-950 border border-white/10 w-full max-w-2xl rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header / Banner */}
            <div className="h-32 bg-gradient-to-r from-teal-600 to-blue-700 relative">
               <button 
                onClick={() => setSelectedUser(null)}
                className="absolute top-6 right-6 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-all"
               >
                 <X size={20} />
               </button>
            </div>
            
            <div className="px-8 pb-8 -mt-16">
              <div className="flex flex-col sm:flex-row items-end gap-6 mb-8">
                <div className="h-32 w-32 rounded-[32px] bg-zinc-900 border-4 border-zinc-950 overflow-hidden shadow-xl">
                   {selectedUser.image ? (
                     <img src={selectedUser.image} alt={selectedUser.name} className="w-full h-full object-cover" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-4xl text-zinc-700 font-black">{selectedUser.name?.[0]}</div>
                   )}
                </div>
                <div className="flex-1 pb-2">
                  <h3 className="text-2xl font-black text-white mb-1">{selectedUser.name}</h3>
                  <div className="flex flex-wrap gap-3">
                    <span className="flex items-center gap-1.5 text-zinc-400 text-xs">
                      <Mail size={12} /> {selectedUser.email}
                    </span>
                    <span className="flex items-center gap-1.5 text-zinc-400 text-xs">
                      <Fingerprint size={12} /> {selectedUser.id}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  {/* Activity Stats */}
                  <div className="p-6 bg-zinc-900/50 rounded-3xl border border-white/5">
                    <div className="flex items-center gap-2 mb-4">
                      <BarChart3 size={16} className="text-teal-400" />
                      <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">إحصائيات البوت</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-zinc-950 rounded-2xl border border-white/5">
                        <p className="text-2xl font-black text-white">{selectedUser._count.aiUsageLogs}</p>
                        <p className="text-[10px] text-zinc-600 uppercase">AI Queries</p>
                      </div>
                      <div className="p-4 bg-zinc-950 rounded-2xl border border-white/5">
                        <p className="text-2xl font-black text-white">{selectedUser.points}</p>
                        <p className="text-[10px] text-zinc-600 uppercase">Points</p>
                      </div>
                    </div>
                    <div className={`mt-4 p-3 rounded-xl flex items-center justify-between ${getActivityLevel(selectedUser._count.aiUsageLogs).bg}`}>
                      <span className="text-[10px] font-bold text-zinc-500 uppercase">Status</span>
                      <span className={`text-xs font-bold ${getActivityLevel(selectedUser._count.aiUsageLogs).color}`}>
                        {getActivityLevel(selectedUser._count.aiUsageLogs).label}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 bg-zinc-900/50 rounded-3xl border border-white/5">
                    <div className="flex items-center gap-2 mb-4">
                      <Clock size={16} className="text-orange-400" />
                      <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">تاريخ الانضمام</h4>
                    </div>
                    <p className="text-sm text-white font-medium">
                      {new Date(selectedUser.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Contact Info */}
                  <div className="p-6 bg-zinc-900/50 rounded-3xl border border-white/5">
                    <div className="flex items-center gap-2 mb-6">
                      <Phone size={16} className="text-blue-400" />
                      <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">معلومات التواصل</h4>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-white">
                          <Phone size={14} className="text-zinc-600" />
                          <span className="text-sm font-medium">{selectedUser.phone || "لا يوجد"}</span>
                        </div>
                        {selectedUser.phone && (
                          <a href={`https://wa.me/${selectedUser.phone}`} target="_blank" className="text-[10px] bg-teal-500/10 text-teal-400 px-3 py-1 rounded-lg font-bold">WhatsApp</a>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3 text-white">
                        <Facebook size={14} className={selectedUser.facebookUrl ? "text-blue-500" : "text-zinc-600"} />
                        <span className="text-sm font-medium truncate max-w-[200px]">{selectedUser.facebookUrl ? "حساب الفيسبوك" : "غير مربوط"}</span>
                      </div>
                      
                      <div className="flex items-center gap-3 text-white">
                        <Instagram size={14} className={selectedUser.instagramUrl ? "text-pink-500" : "text-zinc-600"} />
                        <span className="text-sm font-medium truncate max-w-[200px]">{selectedUser.instagramUrl ? "حساب انستجرام" : "غير مربوط"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={() => {
                        setBroadcastTarget("selected");
                        setBroadcastText("");
                        setSelectedUser(null);
                        toast.success("اكتب رسالتك الآن في لوحة المراسلة");
                      }}
                      className="w-full bg-teal-600 hover:bg-teal-500 text-white rounded-2xl py-4 font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-teal-900/20"
                    >
                      إرسال رسالة خاصة <Send size={16} />
                    </button>
                    <button 
                      onClick={() => setSelectedUser(null)}
                      className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 rounded-2xl py-4 font-bold text-sm transition-all"
                    >
                      إغلاق
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
