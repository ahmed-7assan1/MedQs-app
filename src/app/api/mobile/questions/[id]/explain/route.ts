import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { generateExplanationWithMeta } from '@/lib/gemini';
import { cacheGet, cacheSet } from '@/lib/redis';

// POST /api/mobile/questions/[id]/explain
export const POST = withAuth(async ({ params: rawParams }) => {
  try {
    const params = await rawParams;
    const cacheKey = `explain:${params.id}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return NextResponse.json({ explanation: cached, cached: true });

    const question = await prisma.question.findUnique({
      where: { id: params.id },
      select: { body: true, choices: true, answer: true, explanation: true, aiExplanation: true },
    });
    if (!question) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (question.explanation) {
      await cacheSet(cacheKey, question.explanation, 3600);
      return NextResponse.json({ explanation: question.explanation, source: 'admin' });
    }

    if (question.aiExplanation) {
      await cacheSet(cacheKey, question.aiExplanation, 3600);
      return NextResponse.json({ explanation: question.aiExplanation, source: 'ai_cached' });
    }

    const { getSiteConfig: getCfg } = await import('@/lib/get-site-config');
    const site = await getCfg().catch(() => null);
    const { aiOptionsFromSiteProvider } = await import('@/lib/site-ai-options');
    const aiOpts = aiOptionsFromSiteProvider(site?.aiPreferredProvider);

    const out = await generateExplanationWithMeta(
      question.body,
      question.choices as any,
      question.answer,
      aiOpts,
    );
    const explanation = out.data;

    await prisma.question.update({ where: { id: params.id }, data: { aiExplanation: explanation } });
    await cacheSet(cacheKey, explanation, 3600);

    return NextResponse.json({ explanation, source: 'ai_generated', provider: out.meta.provider });
  } catch (error) {
    console.error('[MOBILE_QUESTION_EXPLAIN]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
