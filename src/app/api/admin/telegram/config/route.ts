
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAdmin } from '@/lib/auth-middleware';

export const POST = withAdmin(async ({ req }) => {

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
});
