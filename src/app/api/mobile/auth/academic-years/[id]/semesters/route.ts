import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const semesters = await prisma.semester.findMany({
      where: { academicYearId: params.id },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
      }
    });
    
    return NextResponse.json(semesters);
  } catch (error) {
    console.error('[MOBILE_API_SEMESTERS_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
