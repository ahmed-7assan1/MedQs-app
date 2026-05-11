import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export const dynamic = "force-dynamic";

// GET /api/mobile/site-config — returns primary color, feature flags, logo etc.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const universityId = searchParams.get('universityId');

    const [siteConfig, featureFlags] = await Promise.all([
      prisma.siteConfig.findFirst({
        select: {
          siteName: true, logoUrl: true, primaryColor: true,
          enableAI: true, enableForum: true, enableAds: true,
          enableNotifs: true, enableLeaderboard: true, fontArabic: true, fontSans: true,
          pwaIconUrl: true, facebookUrl: true, instagramUrl: true, youtubeUrl: true,
          telegramUrl: true, whatsappUrl: true, twitterUrl: true,
        },
      }),
      universityId ? prisma.featureFlag.findMany({
        where: { universityId },
        select: { key: true, enabled: true, payload: true },
      }) : Promise.resolve([]),
    ]);

    // Convert featureFlags array to map
    const flags = featureFlags.reduce((acc: Record<string, any>, f: { key: string; enabled: boolean; payload: any }) => {
      acc[f.key] = { enabled: f.enabled, payload: f.payload };
      return acc;
    }, {});

    return NextResponse.json({ ...siteConfig, featureFlags: flags });
  } catch (error) {
    console.error('[MOBILE_SITE_CONFIG_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
