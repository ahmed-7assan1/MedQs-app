import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export const dynamic = "force-dynamic";

// GET /api/mobile/source-books?facultyId=...&semesterId=...&search=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const facultyId = searchParams.get('facultyId');
    const semesterId = searchParams.get('semesterId');
    const search = searchParams.get('search');

    const books = await prisma.sourceBook.findMany({
      where: {
        ...(facultyId ? { facultyId } : {}),
        ...(semesterId ? { semesterId } : {}),
        ...(search ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { author: { contains: search, mode: 'insensitive' } },
          ],
        } : {}),
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, title: true, author: true, fileUrl: true,
        createdAt: true, facultyId: true, semesterId: true,
        faculty: { select: { id: true, name: true, category: true } },
      },
    });

    return NextResponse.json(books);
  } catch (error) {
    console.error('[MOBILE_SOURCE_BOOKS_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
