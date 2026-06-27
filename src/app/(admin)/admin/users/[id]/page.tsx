import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, AlertTriangle, Activity, BookOpen,
  MessageSquare, HelpCircle, BadgeCheck,
} from "lucide-react";

export default async function UserProfilePage({ params }: { params: { id: string } }) {
  const session = await auth();
  if ((session?.user as any)?.role !== "SUPER_ADMIN") redirect("/admin/dashboard");

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      university: { select: { name: true, abbr: true } },
      faculty: { select: { name: true } },
      semester: { select: { name: true } },
      rank: { select: { label: true, badge: true } },
      _count: {
        select: {
          posts: true, comments: true, quizAttempts: true,
          questionReports: true, videoComments: true,
          sessionParticipations: true, savedQuestions: true,
          pointsTransactions: true,
        },
      },
    },
  });

  if (!user) redirect("/admin/users");

  const warnings = await prisma.warning.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { issuedBy: { select: { name: true } } },
  });

  const recentActivity = await prisma.adminActionLog.findMany({
    where: { entityId: user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { admin: { select: { name: true } } },
  });

  const roleBadge: Record<string, string> = {
    SUPER_ADMIN: "bg-purple-500/15 text-purple-500",
    ADMIN: "bg-blue-500/15 text-blue-500",
    TEACHER: "bg-amber-500/15 text-amber-500",
    STUDENT: "bg-emerald-500/15 text-emerald-500",
  };

  const statusColor = user.isBanned ? "text-red-500" : "text-emerald-500";
  const statusLabel = user.isBanned ? "Banned" : "Active";

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-6 space-y-6">
      {/* Back button */}
      <Link href="/admin/users"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Users
      </Link>

      {/* Profile header */}
      <div className="rounded-2xl border border-white/[0.02] bg-card overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600/20 to-indigo-600/20 p-6">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-xl font-bold text-white shadow-lg">
              {user.name?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="font-display text-xl font-bold truncate">{user.name}</h1>
                {user.isLeader && <BadgeCheck className="h-5 w-5 text-blue-500" />}
              </div>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${roleBadge[user.role] ?? "bg-muted text-muted-foreground"}`}>
                  {user.role}
                </span>
                <span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  <span className={`h-1.5 w-1.5 rounded-full ${statusColor}`} />
                  {statusLabel}
                </span>
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {user.points} pts
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Student ID</p>
            <p className="text-sm font-medium">{user.studentId ?? "—"}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">University</p>
            <p className="text-sm font-medium">{user.university?.name ?? "—"}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Faculty</p>
            <p className="text-sm font-medium">{user.faculty?.name ?? "—"}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Semester</p>
            <p className="text-sm font-medium">{user.semester?.name ?? "—"}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Joined</p>
            <p className="text-sm font-medium">{new Date(user.createdAt).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Last Seen</p>
            <p className="text-sm font-medium">{user.lastSeenAt ? new Date(user.lastSeenAt).toLocaleDateString() : "—"}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Warnings</p>
            <p className={`text-sm font-medium ${user.warningCount > 0 ? "text-red-500" : ""}`}>{user.warningCount}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Rank</p>
            <p className="text-sm font-medium">{user.rank?.label ?? "—"}</p>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-white/[0.02] bg-card p-3">
          <BookOpen className="mb-1.5 h-4 w-4 text-blue-500" />
          <p className="text-lg font-bold">{user._count.posts}</p>
          <p className="text-[10px] text-muted-foreground">Posts</p>
        </div>
        <div className="rounded-xl border border-white/[0.02] bg-card p-3">
          <MessageSquare className="mb-1.5 h-4 w-4 text-violet-500" />
          <p className="text-lg font-bold">{user._count.comments}</p>
          <p className="text-[10px] text-muted-foreground">Comments</p>
        </div>
        <div className="rounded-xl border border-white/[0.02] bg-card p-3">
          <HelpCircle className="mb-1.5 h-4 w-4 text-emerald-500" />
          <p className="text-lg font-bold">{user._count.quizAttempts}</p>
          <p className="text-[10px] text-muted-foreground">Quiz Attempts</p>
        </div>
        <div className="rounded-xl border border-white/[0.02] bg-card p-3">
          <Activity className="mb-1.5 h-4 w-4 text-amber-500" />
          <p className="text-lg font-bold">{user._count.sessionParticipations}</p>
          <p className="text-[10px] text-muted-foreground">Study Sessions</p>
        </div>
      </div>

      {/* Two-column: Warnings + Recent Activity */}
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/[0.02] bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <p className="font-semibold">Warnings</p>
          </div>
          {warnings.length > 0 ? (
            <div className="space-y-2">
              {warnings.map((w) => (
                <div key={w.id} className="flex items-center justify-between rounded-lg bg-muted/30 p-2.5">
                  <div>
                    <p className="text-xs font-medium">{w.reason}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {w.severity} · {new Date(w.createdAt).toLocaleDateString()} · by {w.issuedBy.name}
                    </p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    w.status === "ACTIVE" ? "bg-red-500/10 text-red-500" : "bg-muted text-muted-foreground"
                  }`}>{w.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No warnings</p>
          )}
        </div>

        <div className="rounded-2xl border border-white/[0.02] bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-500" />
            <p className="font-semibold">Admin Activity</p>
          </div>
          {recentActivity.length > 0 ? (
            <div className="space-y-2">
              {recentActivity.map((log) => (
                <div key={log.id} className="flex items-center justify-between rounded-lg bg-muted/30 p-2.5">
                  <div>
                    <p className="text-xs font-medium">{log.action} · {log.entityType}</p>
                    <p className="text-[10px] text-muted-foreground">{log.description ?? "—"} · by {log.admin.name}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{new Date(log.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No admin activity recorded</p>
          )}
        </div>
      </div>
    </div>
  );
}
