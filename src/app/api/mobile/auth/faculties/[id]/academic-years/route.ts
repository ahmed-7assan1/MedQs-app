import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const years = await prisma.academicYear.findMany({
      where: { facultyId: params.id },
      orderBy: { yearNumber: 'asc' },
      select: {
        id: true,
        yearNumber: true,
      }
    });
    
    return NextResponse.json(years);
  } catch (error) {
    console.error('[MOBILE_API_YEARS_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
