import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAdmin } from '@/lib/auth-middleware';
import { Telegraf } from 'telegraf';

export const POST = withAdmin(async ({ session, req }) => {
  const currentUser = session?.user as any;
  const { message, telegramId } = await req.json();
  if (!message) return NextResponse.json({ error: 'Message required' }, { status: 400 });

  const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);
  
  let targetUsers: { telegramId: string | null }[] = [];

  if (telegramId) {
    // Single user target
    targetUsers = [{ telegramId }];
  } else {
    const adminSemesterId = currentUser?.semesterId;
    const isSuper = currentUser?.role === "SUPER_ADMIN";
    
    targetUsers = await prisma.user.findMany({
      where: { 
        telegramId: { not: null },
        telegramVerified: true,
        ...(!isSuper ? {
          universityId: currentUser?.universityId as string,
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
});
