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

    // 1. Create User in Supabase Auth
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const supabase = createAdminClient();

    const { data: sbData, error: sbError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: {
        name,
        universityId,
        facultyId,
        semesterId,
        onboarding_completed: true
      }
    });

    if (sbError) {
      console.error('[MOBILE_API_REGISTER] Supabase Error:', sbError);
      return NextResponse.json({ error: sbError.message }, { status: 400 });
    }

    const supabaseUserId = sbData.user.id;
    const hashed = await bcrypt.hash(password, 10);

    // 2. Create User in Prisma
    const user = await prisma.user.create({
      data: {
        id: supabaseUserId,
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

    // 3. Send Custom Confirmation Email
    try {
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: "signup",
        email,
        options: { redirectTo: `https://medonex.app/auth/callback?next=/dashboard-app` }
      });

      if (!linkError && (linkData.properties?.action_link || (linkData as any).action_link)) {
        const { sendVerificationEmail } = await import("@/lib/email");
        await sendVerificationEmail(email, linkData.properties?.action_link || (linkData as any).action_link);
      }
    } catch (err) {
      console.error('[MOBILE_API_REGISTER] Email Error:', err);
    }

    return NextResponse.json({ user, message: "Registered. Please verify your email." }, { status: 201 });
  } catch (error) {
    console.error('[MOBILE_API_REGISTER]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
