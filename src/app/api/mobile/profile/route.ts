import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';
import { z } from 'zod';

const ProfileUpdateSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  nickname: z.string().max(30).regex(/^[a-zA-Z0-9._-]+$/).optional().nullable(),
  handle: z.string().max(30).regex(/^[a-zA-Z0-9._-]+$/).optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  phoneVisible: z.boolean().optional(),
  isPrivate: z.boolean().optional(),
  hideRank: z.boolean().optional(),
  instagramUrl: z.string().url().optional().nullable(),
  facebookUrl: z.string().url().optional().nullable(),
  universityId: z.string().optional().nullable(),
  facultyId: z.string().optional().nullable(),
  semesterId: z.string().optional().nullable(),
  studentId: z.string().min(4).max(24).optional(),
  coverImage: z.string().optional().nullable(),
  theme: z.enum(['SYSTEM', 'LIGHT', 'DARK']).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const userId = (token?.sub || token?.id) as string | undefined;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, nickname: true, email: true, image: true,
        bio: true, phone: true, phoneVisible: true, theme: true,
        role: true, points: true, handle: true, coverImage: true,
        isPrivate: true, hideRank: true, studentId: true,
        instagramUrl: true, facebookUrl: true,
        universityId: true, facultyId: true, semesterId: true,
        rank: { select: { label: true, badge: true } },
        university: { select: { id: true, name: true } },
        faculty: { select: { id: true, name: true } },
        semester: { select: { id: true, name: true } },
        _count: { select: { posts: true, quizAttempts: true, followers: true, following: true } },
      },
    });

    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('[MOBILE_PROFILE_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const userId = (token?.sub || token?.id) as string | undefined;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parsed = ProfileUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });
    }

    if (parsed.data.nickname) {
      const existing = await prisma.user.findFirst({
        where: { id: { not: userId }, nickname: { equals: parsed.data.nickname, mode: 'insensitive' } },
        select: { id: true },
      });
      if (existing) return NextResponse.json({ error: 'Nickname already taken' }, { status: 409 });
    }

    const updateData: any = {};
    for (const [key, value] of Object.entries(parsed.data)) {
      if (value !== undefined) updateData[key] = value;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true, name: true, nickname: true, email: true, image: true,
        bio: true, phone: true, phoneVisible: true, theme: true,
        handle: true, coverImage: true, isPrivate: true, hideRank: true,
        studentId: true, instagramUrl: true, facebookUrl: true,
        universityId: true, facultyId: true, semesterId: true,
        rank: { select: { label: true, badge: true } },
        university: { select: { id: true, name: true } },
        faculty: { select: { id: true, name: true } },
        semester: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('[MOBILE_PROFILE_PUT]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
