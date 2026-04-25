import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

export async function PUT(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET, salt: "authjs.session-token" });
    
    if (!token?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, bio, image } = body;

    const user = await prisma.user.update({
      where: { id: token.id },
      data: {
        ...(name && { name }),
        ...(bio && { bio }),
        ...(image && { image }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        bio: true,
      }
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Mobile API - Settings Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
