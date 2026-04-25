import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET, salt: "authjs.session-token" });
    
    if (!token?.id || (token.role !== 'ADMIN' && token.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get statistics for the dashboard
    const [
      totalUsers,
      totalQuizzes,
      totalModules,
      recentUsers
    ] = await Promise.all([
      db.user.count(),
      db.quiz.count(),
      db.module.count(),
      db.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          createdAt: true
        }
      })
    ]);

    // System health mock (can be replaced with real metrics later)
    const systemHealth = {
      cpuUsage: Math.floor(Math.random() * 40) + 10,
      memoryUsage: Math.floor(Math.random() * 30) + 40,
      activeConnections: Math.floor(Math.random() * 100) + 50,
      status: 'Healthy'
    };

    return NextResponse.json({
      stats: {
        totalUsers,
        totalQuizzes,
        totalModules,
      },
      recentUsers,
      systemHealth
    });

  } catch (error) {
    console.error('Mobile API - Admin Dashboard Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
