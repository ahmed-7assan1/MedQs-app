
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { code } = await req.json();
    if (!code) return NextResponse.json({ error: 'Code is required' }, { status: 400 });

    const authEntry = await prisma.botAuth.findUnique({
      where: { code }
    });

    if (!authEntry) {
      return NextResponse.json({ error: 'كود غير صحيح' }, { status: 400 });
    }

    if (new Date() > authEntry.expiresAt) {
      await prisma.botAuth.delete({ where: { id: authEntry.id } });
      return NextResponse.json({ error: 'انتهت صلاحية الكود' }, { status: 400 });
    }

    // Link user
    try {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { 
          telegramId: authEntry.telegramId,
          telegramVerified: true 
        }
      });
    } catch (err: any) {
      if (err.code === 'P2002') {
        return NextResponse.json({ error: 'حساب التيليجرام هذا مرتبط بالفعل بمستخدم آخر' }, { status: 400 });
      }
      throw err;
    }

    // Cleanup
    await prisma.botAuth.delete({ where: { id: authEntry.id } });

    return NextResponse.json({ success: true, message: 'تم ربط حساب تيليجرام بنجاح!' });
  } catch (error) {
    console.error('Link Telegram Error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء الربط. حاول مرة أخرى' }, { status: 500 });
  }
}
