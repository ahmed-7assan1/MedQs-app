
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Telegraf } from 'telegraf';

export async function POST(req: Request) {
  const session = await auth();
  const currentUser = session?.user as any;
  const userRole = currentUser?.role;

  if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN' && userRole !== 'LEADER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { message, telegramId } = await req.json();
  if (!message) return NextResponse.json({ error: 'Message required' }, { status: 400 });

  const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);
  
  let targetUsers: { telegramId: string | null }[] = [];

  if (telegramId) {
    // Single user target
    targetUsers = [{ telegramId }];
  } else {
    const adminSemesterId = currentUser?.semesterId;
    const isSuper = userRole === "SUPER_ADMIN";
    
    targetUsers = await prisma.user.findMany({
      where: { 
        telegramId: { not: null },
        telegramVerified: true,
        // Scoping: If not SUPER_ADMIN, filter by university AND semester if available
        ...(!isSuper ? {
          universityId: currentUser?.universityId,
          ...(adminSemesterId ? { semesterId: adminSemesterId } : {})
        } : {})
      },
      select: { telegramId: true }
    });
  }

  let successCount = 0;
  let failCount = 0;

  for (const user of targetUsers) {
    try {
      if (user.telegramId) {
        await bot.telegram.sendMessage(user.telegramId, message, { parse_mode: 'Markdown' });
        successCount++;
      }
    } catch (err) {
      console.error(`Failed to send to ${user.telegramId}:`, err);
      failCount++;
    }
  }

  return NextResponse.json({ success: true, successCount, failCount });
}
