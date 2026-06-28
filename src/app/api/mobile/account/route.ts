import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';

export const DELETE = withAuth(async ({ userId, req }) => {
  try {
    const { searchParams } = new URL(req.url);
    const reason = searchParams.get('reason') || 'User requested';

    await prisma.engagementLog.create({
      data: { userId, action: 'ACCOUNT_DELETED', points: 0 },
    });

    await prisma.user.delete({ where: { id: userId } });

    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      await supabase.auth.admin.deleteUser(userId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[MOBILE_ACCOUNT_DELETE]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
