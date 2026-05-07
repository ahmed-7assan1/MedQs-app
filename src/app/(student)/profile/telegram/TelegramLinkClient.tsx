
"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { CheckCircle2, Link2, ExternalLink } from "lucide-react";

export function TelegramLinkClient({ initialLinked }: { initialLinked: boolean }) {
  const [isLinked, setIsLinked] = useState(initialLinked);
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLink = async () => {
    if (code.length !== 6) return toast.error("يرجى إدخال الكود المكون من 6 أرقام");
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/auth/link-telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setIsLinked(true);
      } else {
        toast.error(data.error);
      }
    } catch (err) {
      toast.error("حدث خطأ أثناء الربط");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLinked) {
    return (
      <div className="p-8 bg-zinc-900/50 border border-teal-500/20 backdrop-blur-xl text-center space-y-6 rounded-3xl">
        <div className="mx-auto w-20 h-20 bg-teal-500/20 rounded-full flex items-center justify-center text-teal-400">
          <CheckCircle2 size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">حسابك مربوط بنجاح!</h2>
          <p className="text-zinc-400">يمكنك الآن استخدام البوت والحصول على إجابات مخصصة بناءً على بياناتك.</p>
        </div>
        <button 
          className="inline-flex items-center gap-2 rounded-xl border border-white/5 bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 transition-all font-bold"
          onClick={() => window.open('https://t.me/MedQs_Assistant_bot', '_blank')}
        >
          اذهب إلى البوت <ExternalLink size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-8 bg-zinc-900/50 border border-white/5 backdrop-blur-xl rounded-3xl space-y-8">
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-800 text-sm">1</span>
            افتح البوت في تيليجرام
          </h2>
          <button 
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl h-14 font-bold transition-all"
            onClick={() => window.open('https://t.me/MedQs_Assistant_bot', '_blank')}
          >
            فتح @MedQs_Assistant_bot
          </button>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-800 text-sm">2</span>
            أرسل أمر /login في البوت
          </h2>
          <p className="text-sm text-zinc-500 pr-10">سيقوم البوت بتزويدك بكود مكون من 6 أرقام، قم بنسخه ووضعه هنا.</p>
        </div>

        <div className="space-y-4 pt-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-800 text-sm">3</span>
            أدخل كود الربط
          </h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <input 
              value={code}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCode(e.target.value)}
              placeholder="مثال: 123456"
              className="flex-1 h-14 bg-zinc-950/50 border border-white/10 rounded-2xl text-center text-2xl tracking-[0.5em] font-black text-teal-400 placeholder:text-zinc-800 placeholder:tracking-normal placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all"
              maxLength={6}
            />
            <button 
              onClick={handleLink}
              disabled={isLoading || code.length !== 6}
              className="h-14 px-8 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-2xl font-bold transition-all"
            >
              {isLoading ? "جاري التحقق..." : "تفعيل"}
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex gap-3 text-orange-500">
        <Link2 size={20} className="shrink-0" />
        <p className="text-xs font-medium leading-relaxed">
          تأكد من إدخال الكود قبل انتهاء صلاحيته (10 دقائق). إذا انتهت الصلاحية، قم بإرسال /login مجدداً في البوت.
        </p>
      </div>
    </div>
  );
}
