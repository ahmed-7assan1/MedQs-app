import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { name, email, password, universityId, facultyId, semesterId } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: 'STUDENT',
        universityId: universityId || null,
        facultyId: facultyId || null,
        semesterId: semesterId || null,
      },
      select: {
        id: true, name: true, email: true, role: true,
        image: true, universityId: true, facultyId: true, semesterId: true,
        points: true, theme: true, nickname: true, handle: true, bio: true,
      }
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error('[MOBILE_API_REGISTER]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
