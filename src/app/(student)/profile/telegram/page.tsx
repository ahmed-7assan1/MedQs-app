
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TelegramLinkClient } from "./TelegramLinkClient";

export default async function TelegramLinkPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { telegramId: true, telegramVerified: true }
  });

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <div className="inline-flex p-4 bg-teal-500/10 rounded-3xl text-teal-500 mb-2">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
        </div>
        <h1 className="text-4xl font-black text-white tracking-tight">MedQs Telegram Link</h1>
        <p className="text-zinc-400">اربط حسابك بتيليجرام لتحصل على إشعارات فورية، وصول سريع للمحاضرات، ودردشة ذكية مع دكتور Q.</p>
      </div>

      <TelegramLinkClient initialLinked={!!user?.telegramId} />
    </div>
  );
}
