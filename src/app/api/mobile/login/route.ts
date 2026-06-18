import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createMobileToken } from "@/lib/supabase/auth-helpers";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email().optional(),
  studentId: z.string().optional(),
  password: z.string().min(6),
});

async function generateToken(user: any) {
  const token = await createMobileToken(user);

  return NextResponse.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      image: user.image,
      universityId: user.universityId,
      semesterId: user.semesterId,
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { email, studentId, password } = parsed.data;

    if (!email && !studentId) {
      return NextResponse.json({ error: "Email or Student ID is required" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: email ? { email } : { studentId },
    });

    // Try 1: bcrypt — fast path for mobile-registered users
    if (user?.password) {
      const valid = await bcrypt.compare(password, user.password);
      if (valid) return generateToken(user);
    }

    // Try 2: Supabase Auth — for web-registered users
    if (email) {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!authError && authData.user) {
        const hashed = await bcrypt.hash(password, 10);
        const prismaUser = await prisma.user.upsert({
          where: { id: authData.user.id },
          create: {
            id: authData.user.id,
            email,
            name: authData.user.user_metadata?.name || email.split("@")[0],
            password: hashed,
            role: "STUDENT",
          },
          update: { password: hashed },
          select: {
            id: true, name: true, email: true, role: true,
            image: true, universityId: true, semesterId: true,
            nickname: true, studentId: true,
          },
        });

        return generateToken(prismaUser);
      }
    }

    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  } catch (error) {
    console.error("Mobile Login Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
