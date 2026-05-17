"use client";
import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, ChevronLeft, ChevronRight, Shield, Trash2, Users, UserCheck, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { MedqsSelect } from "@/components/ui/MedqsSelect";

type User = {
  id: string; name: string; email: string; role: string;
  points: number; createdAt: string; universityId?: string | null;
  isLeader?: boolean; leaderId?: string | null;
  rank?: { label: string } | null;
  university?: { name: string } | null;
  semester?: { name: string } | null;
};

const ROLE_STYLE: Record<string, { cls: string; label: string; icon: typeof Crown }> = {
  SUPER_ADMIN: { cls: "bg-purple-500/15 text-purple-500 ring-1 ring-purple-500/20", label: "Platform (Super)", icon: Crown },
  ADMIN:       { cls: "bg-blue-500/15 text-blue-500 ring-1 ring-blue-500/20",       label: "Doctor (Admin)",   icon: UserCheck },
  TEAM_LEADER: { cls: "bg-amber-500/15 text-amber-500 ring-1 ring-amber-500/20",     label: "Team Leader",     icon: Crown },
  TEAM_ADMIN:  { cls: "bg-cyan-500/15 text-cyan-500 ring-1 ring-cyan-500/20",       label: "Team Admin",      icon: Shield },
  STUDENT:     { cls: "bg-emerald-500/15 text-emerald-500 ring-1 ring-emerald-500/20", label: "Student",      icon: Users },
};

export function getUserClassification(user: User): string {
  if (user.role === "SUPER_ADMIN") return "SUPER_ADMIN";
  if (user.role === "ADMIN") return "ADMIN";
  if (user.isLeader) return "TEAM_LEADER";
  if (user.leaderId) return "TEAM_ADMIN";
  return "STUDENT";
}

export function UsersTable({
  users, total, page, limit, viewerRole, universities = [], teamLeaders = [],
}: {
  users: User[]; total: number; page: number; limit: number;
  viewerRole: string; universities?: Array<{ id: string; name: string }>;
  teamLeaders?: Array<{ id: string; name: string }>;
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

  async function updateClassification(userId: string, classification: string, leaderId: string | null = null) {
    const res = await fetch(`/api/v1/admin/users/${userId}/role`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ classification, leaderId }),
    });
    if (res.ok) { toast.success("User classification updated"); router.refresh(); }
    else toast.error("Failed to update user classification");
  }

  async function deleteUser(userId: string, name: string) {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/v1/admin/users/${userId}`, { method: "DELETE" });
    if (res.ok) { toast.success("User deleted"); router.refresh(); }
    else toast.error("Failed to delete user");
  }

  async function setUniversity(userId: string, universityId: string) {
    const res = await fetch(`/api/v1/admin/users/${userId}/university`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ universityId: universityId || null }),
    });
    if (res.ok) { toast.success("University updated"); router.refresh(); }
    else toast.error("Failed to update university");
  }

  const students = users.filter(u => getUserClassification(u) === "STUDENT").length;
  const admins   = users.filter(u => getUserClassification(u) === "ADMIN").length;
  const leaders  = users.filter(u => getUserClassification(u) === "TEAM_LEADER").length;
  const teamAdmins = users.filter(u => getUserClassification(u) === "TEAM_ADMIN").length;
  const supers   = users.filter(u => getUserClassification(u) === "SUPER_ADMIN").length;

  return (
    <div className="space-y-4">
      {/* ── Filter bar ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form onSubmit={handleSearch} className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or email…"
              className="w-full rounded-xl border border-white/[0.03] bg-card py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>
          <button type="submit"
            className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow shadow-blue-500/20 hover:opacity-90 transition-opacity">
            Search
          </button>
        </form>

        {/* Stat pills */}
        <div className="flex gap-2 text-[10px] sm:text-xs font-semibold flex-wrap">
          <span className="flex items-center gap-1 rounded-full bg-muted/60 px-3 py-1.5">
            <Users className="h-3 w-3" /> {total.toLocaleString()} total
          </span>
          <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1.5 text-emerald-600 dark:text-emerald-400">
            {students} students
          </span>
          <span className="flex items-center gap-1 rounded-full bg-cyan-500/10 px-3 py-1.5 text-cyan-600 dark:text-cyan-400">
            {teamAdmins} team admins
          </span>
          <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1.5 text-amber-500">
            {leaders} leaders
          </span>
          <span className="flex items-center gap-1 rounded-full bg-blue-500/10 px-3 py-1.5 text-blue-500">
            {admins} admins
          </span>
          {supers > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-purple-500/10 px-3 py-1.5 text-purple-500">
              {supers} supers
            </span>
          )}
        </div>
      </div>

      {/* ── Desktop table ── */}
      <div className="hidden overflow-hidden rounded-2xl border border-white/[0.02] bg-card sm:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.02] bg-muted/30">
              <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground">User</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground">University</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Rank</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Pts</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Role Badge</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Manage Role</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Joined</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.02]">
            {users.map((user) => {
              const classification = getUserClassification(user);
              const roleInfo = ROLE_STYLE[classification] ?? ROLE_STYLE.STUDENT;
              const RoleIcon = roleInfo.icon;
              const leaderName = teamLeaders.find(l => l.id === user.leaderId)?.name;

              return (
                <tr key={user.id} className="transition-colors hover:bg-muted/20">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-500/20 text-sm font-bold text-blue-500">
                        {user.name?.[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{user.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                        {leaderName && (
                          <p className="text-[10px] text-cyan-500 font-bold mt-0.5">Leader: {leaderName}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs">{user.university?.name ?? <span className="text-muted-foreground">—</span>}</p>
                    {user.semester && <p className="text-[10px] text-muted-foreground">{user.semester.name}</p>}
                    {viewerRole === "SUPER_ADMIN" && user.role === "ADMIN" && universities.length > 0 && (
                      <MedqsSelect className="mt-1 h-7 text-xs" value={user.universityId ?? ""}
                        onChange={(e) => void setUniversity(user.id, e.target.value)}>
                        <option value="">— Unassigned —</option>
                        {universities.map((u) => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                      </MedqsSelect>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{user.rank?.label ?? "Newbie"}</td>
                  <td className="px-4 py-3 text-xs font-mono tabular-nums">{user.points.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold", roleInfo.cls)}>
                      <RoleIcon className="h-3 w-3" />
                      {roleInfo.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <MedqsSelect 
                        className="h-8 text-xs font-bold w-36" 
                        value={classification}
                        onChange={(e) => void updateClassification(user.id, e.target.value, user.leaderId)}
                      >
                        <option value="STUDENT">Student</option>
                        <option value="TEAM_ADMIN">Team Admin</option>
                        <option value="TEAM_LEADER">Team Leader</option>
                        <option value="ADMIN">Doctor (Admin)</option>
                        {viewerRole === "SUPER_ADMIN" && <option value="SUPER_ADMIN">Platform (Super)</option>}
                      </MedqsSelect>

                      {classification === "TEAM_ADMIN" && teamLeaders.length > 0 && (
                        <MedqsSelect 
                          className="h-8 text-xs w-36" 
                          value={user.leaderId ?? ""}
                          onChange={(e) => void updateClassification(user.id, "TEAM_ADMIN", e.target.value || null)}
                        >
                          <option value="">— Select Leader —</option>
                          {teamLeaders.map((leader) => (
                            <option key={leader.id} value={leader.id}>{leader.name}</option>
                          ))}
                        </MedqsSelect>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => deleteUser(user.id, user.name)}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {users.length === 0 && (
              <tr><td colSpan={8} className="py-16 text-center text-sm text-muted-foreground">No users found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Mobile cards ── */}
      <div className="space-y-3 sm:hidden">
        {users.map((user) => {
          const classification = getUserClassification(user);
          const roleInfo = ROLE_STYLE[classification] ?? ROLE_STYLE.STUDENT;
          const RoleIcon = roleInfo.icon;
          const leaderName = teamLeaders.find(l => l.id === user.leaderId)?.name;

          return (
            <div key={user.id} className="rounded-2xl border border-white/[0.02] bg-card p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-500/20 text-sm font-bold text-blue-500">
                  {user.name?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm truncate">{user.name}</p>
                    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold", roleInfo.cls)}>
                      <RoleIcon className="h-2.5 w-2.5" />{roleInfo.label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  {user.university && <p className="mt-1 text-xs text-muted-foreground">{user.university.name}</p>}
                  {leaderName && (
                    <p className="text-[10px] text-cyan-500 font-bold mt-0.5">Leader: {leaderName}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => deleteUser(user.id, user.name)}
                    className="rounded-lg p-2 text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Mobile Role Controls */}
              <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-muted/20 border border-white/[0.01]">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Classification</p>
                <div className="flex flex-wrap gap-2">
                  <MedqsSelect 
                    className="h-8 text-xs font-bold w-full" 
                    value={classification}
                    onChange={(e) => void updateClassification(user.id, e.target.value, user.leaderId)}
                  >
                    <option value="STUDENT">Student</option>
                    <option value="TEAM_ADMIN">Team Admin</option>
                    <option value="TEAM_LEADER">Team Leader</option>
                    <option value="ADMIN">Doctor (Admin)</option>
                    {viewerRole === "SUPER_ADMIN" && <option value="SUPER_ADMIN">Platform (Super)</option>}
                  </MedqsSelect>

                  {classification === "TEAM_ADMIN" && teamLeaders.length > 0 && (
                    <MedqsSelect 
                      className="h-8 text-xs w-full" 
                      value={user.leaderId ?? ""}
                      onChange={(e) => void updateClassification(user.id, "TEAM_ADMIN", e.target.value || null)}
                    >
                      <option value="">— Select Leader —</option>
                      {teamLeaders.map((leader) => (
                        <option key={leader.id} value={leader.id}>{leader.name}</option>
                      ))}
                    </MedqsSelect>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                <span>{user.rank?.label ?? "Newbie"}</span>
                <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                <span className="font-mono">{user.points} pts</span>
                <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                <span>{new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
              </div>
            </div>
          );
        })}
        {users.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">No users found</p>
        )}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-xs text-muted-foreground">
            {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total.toLocaleString()}
          </span>
          <div className="flex items-center gap-1">
            <button disabled={page <= 1}
              onClick={() => router.push(`/admin/users?q=${search}&page=${page - 1}`)}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.03] hover:bg-muted disabled:opacity-40 transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 text-xs font-medium">{page} / {totalPages}</span>
            <button disabled={page >= totalPages}
              onClick={() => router.push(`/admin/users?q=${search}&page=${page + 1}`)}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.03] hover:bg-muted disabled:opacity-40 transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
