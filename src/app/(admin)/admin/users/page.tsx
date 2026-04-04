import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { UsersTable } from "@/components/admin/UsersTable";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { page?: string; q?: string };
}) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") redirect("/dashboard");

  const page = Number(searchParams.page ?? 1);
  const q = searchParams.q ?? "";
  const limit = 25;

  const where = q
    ? { OR: [{ name: { contains: q, mode: "insensitive" as const } }, { email: { contains: q, mode: "insensitive" as const } }] }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, name: true, email: true, role: true, points: true,
        createdAt: true,
        rank: { select: { label: true } },
        university: { select: { name: true } },
        semester: { select: { name: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold">Users</h1>
        <p className="text-sm text-muted-foreground">{total.toLocaleString()} total students</p>
      </div>
      <UsersTable users={users as any} total={total} page={page} limit={limit} />
    </div>
  );
}
