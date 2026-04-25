import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const faculties = await prisma.faculty.findMany({
      where: { universityId: params.id },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        category: true,
      }
    });
    
    return NextResponse.json(faculties);
  } catch (error) {
    console.error('[MOBILE_API_FACULTIES_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
