import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TaskatClient } from "../../../components/taskat/TaskatClient";
import { prisma } from "@/lib/prisma";

export default async function TaskatPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/taskat");
  }

  const userId = session.user.id;

  // Fetch student info for curriculum
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      semesterId: true,
      universityId: true,
    },
  });

  if (!user?.semesterId) {
    return (
      <div className="flex h-screen items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-4 rounded-3xl border border-white/10 bg-slate-900/50 p-8 shadow-2xl backdrop-blur-xl">
          <h1 className="text-2xl font-bold font-display">Semster not set</h1>
          <p className="text-muted-foreground">Please complete your profile setup to access your curriculum checklist.</p>
        </div>
      </div>
    );
  }

  // Fetch Modules/Subjects/Lectures
  // Optimization: only fetch what's needed for the initial render or pass to client
  const curriculum = await prisma.module.findMany({
    where: { semesterId: user.semesterId },
    orderBy: { name: "asc" },
    include: {
      subjects: {
        include: {
          lectures: {
            orderBy: { order: "asc" },
            include: {
              activities: {
                where: { userId },
                select: { isCompleted: true },
              },
            },
          },
        },
      },
    },
  });

  // Fetch subjects that don't belong to a module (if any)
  const standaloneSubjects = await prisma.subject.findMany({
    where: {
      semesterId: user.semesterId,
      moduleId: null,
    },
    include: {
      lectures: {
        orderBy: { order: "asc" },
        include: {
          activities: {
            where: { userId },
            select: { isCompleted: true },
          },
        },
      },
    },
  });

  return (
    <TaskatClient 
      userId={userId}
      initialCurriculum={curriculum} 
      initialSubjects={standaloneSubjects}
    />
  );
}
