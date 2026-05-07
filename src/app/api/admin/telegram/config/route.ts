
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const session = await auth();
  const userRole = (session?.user as any)?.role;

  if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await req.json();
    const config = await prisma.telegramConfig.upsert({
      where: { id: 'global' },
      update: {
        welcomeMessage: data.welcomeMessage,
        botStatus: data.botStatus,
        defaultProvider: data.defaultProvider,
        defaultModel: data.defaultModel,
      },
      create: {
        id: 'global',
        welcomeMessage: data.welcomeMessage,
        botStatus: data.botStatus,
        defaultProvider: data.defaultProvider || 'gemini',
        defaultModel: data.defaultModel,
      }
    });

    return NextResponse.json(config);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update config' }, { status: 500 });
  }
}
