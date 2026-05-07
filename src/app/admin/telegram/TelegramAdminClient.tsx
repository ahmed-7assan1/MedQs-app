
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "react-hot-toast";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Send, Settings, Users, MessageSquare, AlertCircle } from "lucide-react";

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
        <Card className="p-6 bg-zinc-900/40 border-white/5 backdrop-blur-md">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-teal-500/20 rounded-lg text-teal-400">
              <MessageSquare size={20} />
            </div>
            <h2 className="text-xl font-semibold text-white">إرسال إشعار جماعي (Broadcast)</h2>
          </div>
          
          <Textarea 
            placeholder="اكتب رسالتك هنا لجميع الطلاب المشتركين في البوت..."
            className="bg-zinc-950/50 border-white/10 min-h-[120px] mb-4 text-white placeholder:text-zinc-600"
            value={broadcastText}
            onChange={(e) => setBroadcastText(e.target.value)}
          />
          
          <div className="flex items-center gap-4">
            <Button 
              onClick={startBroadcast}
              disabled={isBroadcasting}
              className="bg-teal-600 hover:bg-teal-500 text-white rounded-xl px-8"
            >
              {isBroadcasting ? "جاري الإرسال..." : "إرسال الآن"} <Send size={16} className="mr-2 ml-2" />
            </Button>
            <p className="text-xs text-zinc-500">
              سيتم إرسال هذه الرسالة لـ {linkedUsers.length} طالب مربوطين حالياً.
            </p>
          </div>
        </Card>

        <Card className="p-6 bg-zinc-900/40 border-white/5 backdrop-blur-md">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
              <Settings size={20} />
            </div>
            <h2 className="text-xl font-semibold text-white">إعدادات البوت العامة</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-zinc-500 uppercase font-bold mb-1 block">رسالة الترحيب الافتراضية</label>
              <Textarea 
                value={config.welcomeMessage || ""}
                onChange={(e) => setConfig({...config, welcomeMessage: e.target.value})}
                className="bg-zinc-950/50 border-white/10 text-white"
              />
            </div>
            <Button 
              onClick={saveConfig} 
              disabled={isSaving}
              className="bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl border border-white/5"
            >
              {isSaving ? "جاري الحفظ..." : "حفظ التغييرات"}
            </Button>
          </div>
        </Card>
      </div>

      {/* Users List */}
      <div className="space-y-6">
        <Card className="p-6 bg-zinc-900/40 border-white/5 backdrop-blur-md h-full max-h-[800px] flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-orange-500/20 rounded-lg text-orange-400">
              <Users size={20} />
            </div>
            <h2 className="text-xl font-semibold text-white">الطلاب المشتركون</h2>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
            {linkedUsers.map((u) => (
              <div key={u.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 hover:border-teal-500/30 transition-colors group">
                <Avatar className="h-10 w-10 ring-2 ring-zinc-800 group-hover:ring-teal-500/50 transition-all">
                  <AvatarImage src={u.image} />
                  <AvatarFallback className="bg-zinc-800 text-zinc-400">{u.name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{u.name}</p>
                  <p className="text-[10px] text-zinc-500 truncate">{u.university?.name} • {u.semester?.name}</p>
                </div>
                <div className="p-2 bg-teal-500/10 rounded-full text-teal-500">
                  <Send size={12} />
                </div>
              </div>
            ))}
            {linkedUsers.length === 0 && (
              <div className="text-center py-10">
                <AlertCircle size={40} className="mx-auto text-zinc-700 mb-4" />
                <p className="text-zinc-500 text-sm">لا يوجد طلاب مربوطين حالياً.</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
