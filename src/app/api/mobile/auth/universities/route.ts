import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const universities = await prisma.university.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        logoUrl: true,
      }
    });
    
    return NextResponse.json(universities);
  } catch (error) {
    console.error('[MOBILE_API_UNIVERSITIES_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
