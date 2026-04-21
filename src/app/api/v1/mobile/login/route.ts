import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { encode } from "next-auth/jwt";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email().optional(),
  studentId: z.string().optional(),
  password: z.string().min(6),
});

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

    if (!user || !user.password) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Generate JWT via NextAuth
    const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
    if (!secret) {
      throw new Error("Missing AUTH_SECRET environment variable");
    }

    const tokenPayload = {
      id: user.id,
      role: user.role,
      semesterId: user.semesterId,
      universityId: user.universityId,
      nickname: user.nickname,
      studentId: user.studentId,
    };

    const token = await encode({
      token: tokenPayload,
      secret,
      salt: "authjs.session-token", // standard iron-session salt if needed, but not strictly needed for basic usage, NextAuth encode might require specific salt depending on v5.
    });

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
      }
    });

  } catch (error) {
    console.error("Mobile Login Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
