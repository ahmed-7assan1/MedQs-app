import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export const dynamic = "force-dynamic";

// GET /api/mobile/library-resources?category=...&type=...&search=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') as any;
    const type = searchParams.get('type');
    const search = searchParams.get('search');

    const resources = await prisma.libraryResource.findMany({
      where: {
        ...(category ? { category } : {}),
        ...(type ? { type } : {}),
        ...(search ? { title: { contains: search, mode: 'insensitive' } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, type: true, title: true, url: true,
        category: true, sourceBookId: true, createdAt: true,
        sourceBook: { select: { id: true, title: true, author: true } },
      },
    });

    return NextResponse.json(resources);
  } catch (error) {
    console.error('[MOBILE_LIBRARY_RESOURCES_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
