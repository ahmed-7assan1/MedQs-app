
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TelegramAdminClient } from "./TelegramAdminClient";

export default async function TelegramAdminPage() {
  const session = await auth();
  const user = session?.user as any;
  const userRole = user?.role;

  if (userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
    redirect("/");
  }

  // Get admin's semester to filter students
  const adminSemesterId = user?.semesterId;

  const [linkedUsers, botConfig, stats] = await Promise.all([
    prisma.user.findMany({
      where: { 
        telegramId: { not: null },
        // If it's a regular ADMIN, filter by their semester. SUPER_ADMIN sees everyone.
        ...(userRole === "ADMIN" && adminSemesterId ? { semesterId: adminSemesterId } : {})
      },
      select: {
        id: true,
        name: true,
        email: true,
        telegramId: true,
        image: true,
        phone: true,
        facebookUrl: true,
        instagramUrl: true,
        points: true,
        createdAt: true,
        university: { select: { name: true } },
        semester: { select: { id: true, name: true } },
        _count: {
          select: { aiUsageLogs: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    }),
    prisma.telegramConfig.findUnique({ where: { id: "global" } }),
    prisma.user.count({ 
      where: { 
        telegramId: { not: null },
        ...(userRole === "ADMIN" && adminSemesterId ? { semesterId: adminSemesterId } : {})
      } 
    })
  ]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center bg-zinc-900/50 p-6 rounded-2xl border border-white/5 backdrop-blur-xl">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Telegram Bot Center 🤖</h1>
          <p className="text-zinc-400">إدارة الربط الذكي، الإشعارات، وإحصائيات الطلاب.</p>
        </div>
        <div className="text-right">
          <div className="text-4xl font-black text-teal-400">{stats}</div>
          <div className="text-xs text-zinc-500 uppercase tracking-widest">Linked Students</div>
        </div>
      </div>

      <TelegramAdminClient 
        linkedUsers={linkedUsers} 
        initialConfig={botConfig || { id: "global", welcomeMessage: "", broadcastMessage: "", botStatus: "ACTIVE" }} 
      />
    </div>
  );
}
