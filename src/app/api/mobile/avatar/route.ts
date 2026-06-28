import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';

export const POST = withAuth(async ({ req, userId }) => {
  try {
    const formData = await req.formData();
    const file = formData.get('avatar') as File | null;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF' }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Max 5MB' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { uploadToCloudinary } = await import('@/lib/cloudinary');
    const uploadResult = await uploadToCloudinary(buffer, `avatars/${userId}`);
    const imageUrl = typeof uploadResult === 'string' ? uploadResult : (uploadResult as any).secure_url ?? (uploadResult as any).url ?? String(uploadResult);

    const user = await prisma.user.update({
      where: { id: userId },
      data: { image: imageUrl },
      select: { id: true, name: true, image: true },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('[MOBILE_AVATAR_POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
