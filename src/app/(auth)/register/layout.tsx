import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function RegisterLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role = (session.user as { role?: string }).role;
  if (role === "STUDENT") {
    const u = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { universityId: true, semesterId: true },
    });
    if (u?.universityId && u?.semesterId) redirect("/dashboard-app");
  }

  return <>{children}</>;
}
