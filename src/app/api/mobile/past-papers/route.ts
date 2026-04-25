import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

// GET /api/mobile/past-papers?semesterId=...&moduleId=...&kind=...
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const { searchParams } = new URL(req.url);
    const semesterId = searchParams.get('semesterId');
    const moduleId = searchParams.get('moduleId');
    const kind = searchParams.get('kind') as any;
    const limit = parseInt(searchParams.get('limit') || '50');
    const sort = searchParams.get('sort') === 'recent' ? 'desc' : 'asc';

    if (!semesterId) {
      return NextResponse.json({ error: 'semesterId is required' }, { status: 400 });
    }

    const pastPapers = await prisma.pastPaper.findMany({
      where: {
        semesterId,
        ...(moduleId ? { moduleId } : {}),
        ...(kind ? { kind } : {}),
        ...(token ? {} : { isPrivate: false }),
      },
      orderBy: { createdAt: sort },
      take: limit,
      include: {
        module: { select: { id: true, name: true } },
        _count: { select: { attempts: true } },
      },
    });

    // For each paper, compute user's avgScore if logged in
    const userId = token?.sub || token?.id as string | undefined;
    const enriched = await Promise.all(
      pastPapers.map(async (pp) => {
        let userAvgScore: number | null = null;
        if (userId) {
          const agg = await prisma.quizAttempt.aggregate({
            where: { pastPaperId: pp.id, userId },
            _avg: { score: true },
            _count: true,
          });
          userAvgScore = agg._avg.score;
        }
        return { ...pp, userAvgScore };
      })
    );

    return NextResponse.json(enriched);
  } catch (error) {
    console.error('[MOBILE_PAST_PAPERS_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
