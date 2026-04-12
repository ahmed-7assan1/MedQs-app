"use client";
import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, ChevronLeft, ChevronRight, Shield, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { MedqsSelect } from "@/components/ui/MedqsSelect";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  points: number;
  createdAt: string;
  universityId?: string | null;
  rank?: { label: string } | null;
  university?: { name: string } | null;
  semester?: { name: string } | null;
};

const ROLE_COLORS: Record<string, string> = {
  STUDENT:     "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  ADMIN:       "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  SUPER_ADMIN: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

/** Faculty-facing label in UI (DB role remains ADMIN). */
function roleDisplayLabel(role: string) {
  if (role === "ADMIN") return "Doctor";
  if (role === "SUPER_ADMIN") return "Platform";
  return role;
}

export function UsersTable({
  users,
  total,
  page,
  limit,
  viewerRole,
  universities = [],
}: {
  users: User[];
  total: number;
  page: number;
  limit: number;
  viewerRole: string;
  universities?: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(useSearchParams().get("q") ?? "");
  const [, startTransition] = useTransition();
  const totalPages = Math.ceil(total / limit);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    startTransition(() => {
      router.push(`/admin/users?q=${encodeURIComponent(search)}&page=1`);
    });
  }

  async function changeRole(userId: string, role: string) {
    const res = await fetch(`/api/v1/admin/users/${userId}/role`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (res.ok) {
      toast.success("Role updated");
      router.refresh();
    } else {
      toast.error("Failed to update role");
    }
  }

  async function deleteUser(userId: string, name: string) {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/v1/admin/users/${userId}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("User deleted");
      router.refresh();
    } else {
      toast.error("Failed to delete user");
    }
  }

  async function setUniversity(userId: string, universityId: string) {
    const res = await fetch(`/api/v1/admin/users/${userId}/university`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ universityId: universityId || null }),
    });
    if (res.ok) {
      toast.success("University updated");
      router.refresh();
    } else {
      toast.error("Failed to update university");
    }
  }

  return (
    <div>
      {/* Search */}
      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          Search
        </button>
      </form>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">User</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">University</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Rank</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Points</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Role</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Joined</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  <div>
                    <p>{user.university?.name ?? "—"}</p>
                    <p className="opacity-70">{user.semester?.name ?? ""}</p>
                  </div>
                  {viewerRole === "SUPER_ADMIN" && user.role === "ADMIN" && universities.length > 0 ? (
                    <div className="mt-2">
                      <MedqsSelect
                        className="h-8 text-xs"
                        value={user.universityId ?? ""}
                        onChange={(e) => void setUniversity(user.id, e.target.value)}
                        title="Assign doctor (faculty) to a university"
                      >
                        <option value="">—</option>
                        {universities.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name}
                          </option>
                        ))}
                      </MedqsSelect>
                    </div>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-xs">{user.rank?.label ?? "Newbie"}</td>
                <td className="px-4 py-3 text-xs font-mono">{user.points}</td>
                <td className="px-4 py-3">
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", ROLE_COLORS[user.role] ?? ROLE_COLORS.STUDENT)}>
                    {roleDisplayLabel(user.role)}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => changeRole(user.id, user.role === "STUDENT" ? "ADMIN" : "STUDENT")}
                      title="Toggle doctor hub access (student ↔ doctor)"
                      className="rounded p-1.5 text-muted-foreground hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
                    >
                      <Shield className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => deleteUser(user.id, user.name)}
                      className="rounded p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}</span>
          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={() => router.push(`/admin/users?q=${search}&page=${page - 1}`)}
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2">{page} / {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => router.push(`/admin/users?q=${search}&page=${page + 1}`)}
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
