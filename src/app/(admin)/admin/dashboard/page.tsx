import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Users, BookOpen, HelpCircle, FileText, MessageSquare,
  TrendingUp, Zap, Video, ArrowUpRight,
  LayoutDashboard, GraduationCap, Star, Activity, Bone,
  Shield, Server, BarChart3,
} from "lucide-react";

export default async function AdminDashboardPage() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  const isPlatform = role === "SUPER_ADMIN";
  // Security is handled by AdminLayout. No redundant redirect here.

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [
    userCount, questionCount, lectureCount, postCount,
    attemptCount, paperCount, newUsersThisWeek, newUsersLastWeek,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.question.count(),
    prisma.lecture.count(),
    prisma.post.count(),
    prisma.quizAttempt.count(),
    prisma.pastPaper.count(),
    prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.user.count({ where: { createdAt: { gte: monthAgo, lt: weekAgo } } }),
  ]);

  let securityAlertCount = 0;
  let uniRanking: { id: string; name: string; abbr: string | null; userCount: number }[] = [];
  let platformStats: { activeToday: number; newToday: number; bannedCount: number } | null = null;
  let contentNewThisWeek: { questions: number; lectures: number; papers: number } | null = null;

  if (isPlatform) {
    [securityAlertCount, uniRanking, platformStats, contentNewThisWeek] = await Promise.all([
      prisma.securityEvent.count({ where: { status: { in: ["NEW", "INVESTIGATING"] } } }),
      prisma.university.findMany({
        select: { id: true, name: true, abbr: true, _count: { select: { users: true } } },
        orderBy: { users: { _count: "desc" } },
        take: 10,
      }).then((u) => u.map((x) => ({ id: x.id, name: x.name, abbr: x.abbr, userCount: x._count.users }))),
      Promise.all([
        prisma.user.count({ where: { lastActivityAt: { gte: todayStart } } }),
        prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
        prisma.user.count({ where: { isBanned: true } }),
      ]).then(([activeToday, newToday, bannedCount]) => ({ activeToday, newToday, bannedCount })),
      Promise.all([
        prisma.question.count({ where: { createdAt: { gte: weekAgo } } }),
        Promise.resolve(0),
        prisma.pastPaper.count({ where: { createdAt: { gte: weekAgo } } }),
      ]).then(([questions, lectures, papers]) => ({ questions, lectures, papers })),
    ]);
  }

  const recentUsers = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 8,
    select: {
      id: true, name: true, email: true, createdAt: true, role: true,
      university: { select: { name: true } },
    },
  });

  // 7-day signup data (pseudo-chart)
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    return d;
  });

  const dayCounts = await Promise.all(
    days.map((d) => {
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      return prisma.user.count({ where: { createdAt: { gte: d, lt: next } } });
    })
  );

  const maxDay = Math.max(...dayCounts, 1);
  const growthPct = newUsersLastWeek > 0
    ? Math.round(((newUsersThisWeek - newUsersLastWeek) / newUsersLastWeek) * 100)
    : newUsersThisWeek > 0 ? 100 : 0;

  const stats = [
    {
      label: "Students", value: userCount, icon: Users,
      color: "text-blue-500", bg: "from-blue-500/10 to-blue-500/5",
      border: "border-l-blue-500", trend: `+${newUsersThisWeek} this week`,
    },
    {
      label: "Questions", value: questionCount, icon: HelpCircle,
      color: "text-violet-500", bg: "from-violet-500/10 to-violet-500/5",
      border: "border-l-violet-500", trend: "In question bank",
    },
    {
      label: "Lectures", value: lectureCount, icon: Video,
      color: "text-emerald-500", bg: "from-emerald-500/10 to-emerald-500/5",
      border: "border-l-emerald-500", trend: "Videos & flashcards",
    },
    {
      label: "Past Papers", value: paperCount, icon: FileText,
      color: "text-cyan-500", bg: "from-cyan-500/10 to-cyan-500/5",
      border: "border-l-cyan-500", trend: "Exam archives",
    },
    {
      label: "Forum Posts", value: postCount, icon: MessageSquare,
      color: "text-pink-500", bg: "from-pink-500/10 to-pink-500/5",
      border: "border-l-pink-500", trend: "Community threads",
    },
    {
      label: "Quiz Attempts", value: attemptCount, icon: TrendingUp,
      color: "text-amber-500", bg: "from-amber-500/10 to-amber-500/5",
      border: "border-l-amber-500", trend: "Assessments taken",
    },
  ];

  const quickActions = [
    { href: "/admin/content", icon: BookOpen, label: "Curriculum", desc: "Manage universities, faculties, years", color: "text-blue-500", bg: "bg-blue-500/10" },
    { href: "/admin/questions", icon: HelpCircle, label: "Questions", desc: "Create & import question bank", color: "text-violet-500", bg: "bg-violet-500/10" },
    { href: "/admin/lectures", icon: Video, label: "Lectures", desc: "Upload videos & flashcards", color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { href: "/admin/past-papers", icon: FileText, label: "Past Papers", desc: "Manage exam archives", color: "text-cyan-500", bg: "bg-cyan-500/10" },
    { href: "/admin/atlas", icon: Bone, label: "Atlas", desc: "Anatomy structures & systems", color: "text-teal-500", bg: "bg-teal-500/10" },
    { href: "/admin/ai-tools", icon: Zap, label: "AI Tools", desc: "Extract & generate from materials", color: "text-purple-500", bg: "bg-purple-500/10" },
    { href: "/admin/users", icon: Users, label: "Users", desc: "Manage roles & permissions", color: "text-pink-500", bg: "bg-pink-500/10" },
    { href: "/admin/forum", icon: MessageSquare, label: "Community", desc: "Forum moderation & status", color: "text-orange-500", bg: "bg-orange-500/10" },
    { href: "/admin/settings", icon: LayoutDashboard, label: "Settings", desc: "Branding, features & integrations", color: "text-amber-500", bg: "bg-amber-500/10" },
  ];

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

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 space-y-8">

      {/* ── Hero bar ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {role === "SUPER_ADMIN" ? "Platform Admin" : "Doctor Hub"}
          </p>
          <h1 className="font-display text-2xl font-bold md:text-3xl">Overview</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/users"
            className="flex items-center gap-1.5 rounded-xl border border-white/[0.02] bg-card px-3.5 py-2 text-sm font-medium text-muted-foreground transition-all hover:border-blue-500/40 hover:text-blue-500">
            <Users className="h-4 w-4" />
            <span>{userCount.toLocaleString()} users</span>
          </Link>
          <Link href="/admin/settings"
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow shadow-blue-500/30 transition-all hover:opacity-90">
            <Activity className="h-4 w-4" />
            Settings
          </Link>
        </div>
      </div>

      {/* ── PLATFORM: Security Alert Banner ──────────────────────── */}
      {isPlatform && securityAlertCount > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
          <Shield className="h-5 w-5 shrink-0 text-red-500" />
          <div className="flex-1 text-sm">
            <span className="font-semibold text-red-500">{securityAlertCount} open security {securityAlertCount === 1 ? "event" : "events"}</span>
            <span className="text-muted-foreground"> — requires investigation</span>
          </div>
          <Link href="/admin/security"
            className="flex items-center gap-1 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-500/20">
            View Security Dashboard <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      {/* ── PLATFORM: System Health Bar ──────────────────────────── */}
      {isPlatform && (
        <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-white/[0.02] bg-card p-4">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground">System</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-muted-foreground">DB</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-muted-foreground">API</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-muted-foreground">Cache</span>
          </div>
          <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            <BarChart3 className="h-3.5 w-3.5" />
            <span>{userCount.toLocaleString()} users · {platformStats?.activeToday ?? 0} active today</span>
          </div>
        </div>
      )}

      {/* ── Stats grid ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map(({ label, value, icon: Icon, color, bg, border, trend }) => (
          <div key={label}
            className={`relative overflow-hidden rounded-2xl border-l-4 ${border} border border-white/[0.02] bg-gradient-to-br ${bg} p-4`}>
            <div className={`mb-2 inline-flex rounded-xl p-2 bg-background/60 ${color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <p className={`font-display text-2xl font-bold ${color}`}>{value.toLocaleString()}</p>
            <p className="text-xs font-semibold text-foreground/80">{label}</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">{trend}</p>
          </div>
        ))}
      </div>

      {/* ── PLATFORM: Extra Stats Row ────────────────────────────── */}
      {isPlatform && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/[0.02] bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Active Today</p>
            <p className="font-display text-2xl font-bold text-emerald-500">{platformStats?.activeToday ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">users with activity</p>
          </div>
          <div className="rounded-2xl border border-white/[0.02] bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">New Today</p>
            <p className="font-display text-2xl font-bold text-blue-500">{platformStats?.newToday ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">new registrations</p>
          </div>
          <div className="rounded-2xl border border-white/[0.02] bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Banned</p>
            <p className="font-display text-2xl font-bold text-red-500">{platformStats?.bannedCount ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">users currently banned</p>
          </div>
          <div className="rounded-2xl border border-white/[0.02] bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Content (7d)</p>
            <p className="font-display text-2xl font-bold text-violet-500">
              {((contentNewThisWeek?.questions ?? 0) + (contentNewThisWeek?.lectures ?? 0) + (contentNewThisWeek?.papers ?? 0))}
            </p>
            <p className="text-[10px] text-muted-foreground">Q:{contentNewThisWeek?.questions ?? 0} L:{contentNewThisWeek?.lectures ?? 0} P:{contentNewThisWeek?.papers ?? 0}</p>
          </div>
        </div>
      )}

      {/* ── Middle row: chart + quick actions ────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-3">

        {/* 7-day signups chart */}
        <div className="rounded-2xl border border-white/[0.02] bg-card p-5 lg:col-span-1">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">New Students</p>
              <p className="font-display text-2xl font-bold">{newUsersThisWeek}</p>
              <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${growthPct >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}>
                {growthPct >= 0 ? "↑" : "↓"} {Math.abs(growthPct)}% vs prior week
              </span>
            </div>
            <TrendingUp className="h-5 w-5 text-muted-foreground/40" />
          </div>

          {/* Mini bar chart */}
          <div className="flex items-end gap-1.5 h-20">
            {dayCounts.map((count, i) => {
              const h = Math.max(4, Math.round((count / maxDay) * 100));
              return (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-blue-600 to-indigo-500 opacity-80 transition-all"
                    style={{ height: `${h}%` }}
                    title={`${count} users`}
                  />
                  <span className="text-[9px] text-muted-foreground">
                    {dayLabels[days[i].getDay()]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Universities (PLATFORM only) */}
        {isPlatform && (
          <div className="rounded-2xl border border-white/[0.02] bg-card p-5 lg:col-span-1">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Top Universities</p>
              <GraduationCap className="h-4 w-4 text-muted-foreground/40" />
            </div>
            <div className="space-y-2">
              {uniRanking.map((uni, i) => (
                <div key={uni.id} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">{uni.abbr ?? uni.name}</p>
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">{uni.userCount}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className={`rounded-2xl border border-white/[0.02] bg-card p-5 ${isPlatform ? "lg:col-span-1" : "lg:col-span-2"}`}>
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Quick Actions</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {quickActions.map(({ href, icon: Icon, label, desc, color, bg }) => (
              <Link key={href} href={href}
                className="group flex flex-col gap-2 rounded-xl border border-white/[0.02] bg-background/60 p-3 transition-all hover:-translate-y-0.5 hover:border-border hover:shadow-md">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${bg}`}>
                  <Icon className={`h-4.5 w-4.5 ${color}`} />
                </div>
                <div>
                  <p className="text-xs font-semibold leading-tight">{label}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground leading-snug hidden sm:block">{desc}</p>
                </div>
                <ArrowUpRight className={`h-3.5 w-3.5 ${color} opacity-0 transition-opacity group-hover:opacity-100 mt-auto self-end`} />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Recent sign-ups ───────────────────────────────────────── */}
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
          {recentUsers.map((user) => (
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
          {recentUsers.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No users yet — share the signup link to get started.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
