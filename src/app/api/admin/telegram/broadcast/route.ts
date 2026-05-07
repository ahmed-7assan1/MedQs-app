
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Telegraf } from 'telegraf';

export async function POST(req: Request) {
  const session = await auth();
  const userRole = (session?.user as any)?.role;

  if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { message } = await req.json();
  if (!message) return NextResponse.json({ error: 'Message required' }, { status: 400 });

  const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);
  
  const linkedUsers = await prisma.user.findMany({
    where: { 
      AND: [
        { telegramId: { not: null } },
        { telegramId: { not: "" } }
      ],
      telegramVerified: true
    },
    select: { telegramId: true }
  });

  let successCount = 0;
  let failCount = 0;

  // We do it in sequence to avoid hitting rate limits too hard, 
  // but for a large user base, a queue system is better.
  for (const user of linkedUsers) {
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
