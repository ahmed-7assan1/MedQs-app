import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { UsersTable } from "@/components/admin/UsersTable";
import { getSessionScope, isSuperAdmin } from "@/lib/tenant";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { page?: string; q?: string };
}) {
  const session = await auth();
  const scope = await getSessionScope(session);
  const user = session?.user as any;
  const role = user?.role as string | undefined;
  const isSuper = isSuperAdmin(role);
  const isAdminOrLeader = role === "ADMIN" || role === "LEADER";

  if (!scope || (!isAdminOrLeader && !isSuper)) redirect("/dashboard");
  
  // If not super admin, they must be scoped to at least a university
  if (!isSuper && !scope.universityId) redirect("/admin/settings");

  const page = Number(searchParams.page ?? 1);
  const q = searchParams.q ?? "";
  const limit = 25;

  // Scoping Logic
  const baseWhere: any = {};
  if (!isSuper) {
    baseWhere.universityId = scope.universityId;
    if (scope.semesterId) {
      baseWhere.semesterId = scope.semesterId;
    }
  }

  const where = q
    ? {
        AND: [
          baseWhere,
          { 
            OR: [
              { name: { contains: q, mode: "insensitive" as const } }, 
              { nickname: { contains: q, mode: "insensitive" as const } },
              { telegramPhone: { contains: q, mode: "insensitive" as const } },
              { studentCode: { contains: q, mode: "insensitive" as const } }
            ] 
          },
        ],
      }
    : baseWhere;

  const [users, total, universities] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, name: true, email: true, role: true, points: true,
        createdAt: true, universityId: true,
        rank: { select: { label: true } },
        university: { select: { name: true } },
        semester: { select: { name: true } },
      },
    }),
    prisma.user.count({ where }),
    isSuperAdmin(role) ? prisma.university.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }) : Promise.resolve([]),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Admin Panel</p>
          <h1 className="font-display text-2xl font-bold md:text-3xl">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total.toLocaleString()} total accounts — students, doctors &amp; platform admins
          </p>
        </div>
        <div className="flex gap-2 flex-wrap text-xs font-bold">
          <span className="rounded-2xl bg-emerald-500/10 px-3 py-1.5 text-emerald-600 dark:text-emerald-400">Students</span>
          <span className="rounded-2xl bg-blue-500/10 px-3 py-1.5 text-blue-500">Doctors</span>
          {role === "SUPER_ADMIN" && (
            <span className="rounded-2xl bg-purple-500/10 px-3 py-1.5 text-purple-500">Platform</span>
          )}
        </div>
      </div>
      <UsersTable users={users as any} total={total} page={page} limit={limit} viewerRole={role ?? "STUDENT"} universities={universities as any} />
    </div>
  );
}
