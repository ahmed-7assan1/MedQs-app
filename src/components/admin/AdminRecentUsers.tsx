import Link from "next/link";
import { Star, ArrowUpRight } from "lucide-react";

interface RecentUser {
  id: string;
  name: string | null;
  email: string | null;
  createdAt: Date;
  role: string;
  university: { name: string } | null;
}

const roleBadge: Record<string, string> = {
  SUPER_ADMIN: "bg-purple-500/15 text-purple-500",
  ADMIN: "bg-blue-500/15 text-blue-500",
  STUDENT: "bg-emerald-500/15 text-emerald-500",
};

const roleLabel: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  STUDENT: "Student",
};

export function AdminRecentUsers({ users }: { users: RecentUser[] }) {
  return (
    <div className="rounded-2xl border border-white/[0.02] bg-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/[0.02] bg-muted/20 px-5 py-3.5">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-amber-500" />
          <p className="font-semibold">Recent Sign-ups</p>
        </div>
        <Link href="/admin/users"
          className="flex items-center gap-1 text-xs font-medium text-blue-500 hover:underline">
          View all <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="divide-y divide-border/40">
        {users.map((user) => (
          <div key={user.id} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/20">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-500/20 text-sm font-bold text-blue-500">
              {user.name?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
            {user.university && (
              <span className="hidden rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-flex truncate max-w-[120px]">
                {user.university.name}
              </span>
            )}
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold whitespace-nowrap ${roleBadge[user.role] ?? roleBadge.STUDENT}`}>
              {roleLabel[user.role] ?? user.role}
            </span>
            <span className="flex-shrink-0 text-xs text-muted-foreground whitespace-nowrap">
              {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          </div>
        ))}
        {users.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No users yet — share the signup link to get started.
          </div>
        )}
      </div>
    </div>
  );
}
