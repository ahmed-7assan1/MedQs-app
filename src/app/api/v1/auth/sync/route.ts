import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, email, name, universityId, facultyId, semesterId, nickname, role, image } = session.user as any;
    const validatedRole = (role === "ADMIN" || role === "SUPER_ADMIN" || role === "TEACHER") ? role : "STUDENT";

    // 1. Check if user already perfectly matches by ID
    const existingById = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, image: true, name: true }
    });

    if (existingById) {
      // If role or image changed in Supabase, update Prisma
      if (existingById.role !== validatedRole || existingById.image !== image || existingById.name !== name) {
        await prisma.user.update({
          where: { id },
          data: { 
            role: validatedRole as any, 
            image: image || existingById.image,
            name: name || existingById.name
          }
        });
        return NextResponse.json({ status: "synced", action: "updated_profile" });
      }
      return NextResponse.json({ status: "synced", action: "none" });
    }

    // 2. Check if user exists by Email (ID mismatch scenario)
    if (email) {
      const existingByEmail = await prisma.user.findUnique({
        where: { email },
        select: { id: true }
      });

      if (existingByEmail) {
        // Update Prisma ID to match Supabase ID and sync profile
        await prisma.user.update({
          where: { id: existingByEmail.id },
          data: { 
            id,
            role: validatedRole as any,
            image: image || undefined,
            name: name || undefined
          }
        });
        return NextResponse.json({ status: "synced", action: "updated_id" });
      }
    }

    // 3. User does not exist at all, create new Prisma profile
    const codeSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const defaultStudentCode = `USR-${Date.now().toString().slice(-6)}-${codeSuffix}`;

    await prisma.user.create({
      data: {
        id,
        email: email || `no-email-${id}@medonex.com`,
        name: name || "Student",
        nickname: nickname || null,
        image: image || null,
        universityId: universityId || null,
        facultyId: facultyId || null,
        semesterId: semesterId || null,
        role: validatedRole as any,
        studentCode: defaultStudentCode,
      }
    });

    return NextResponse.json({ status: "synced", action: "created" });

  } catch (error: any) {
    console.error("[AUTH_SYNC] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
