import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Users, BookOpen, HelpCircle, FileText,
  MessageSquare, TrendingUp, Megaphone, Zap, Video,
} from "lucide-react";
import { PLATFORM_COPY } from "@/lib/platform-copy";

export default async function AdminDashboardPage() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") redirect("/dashboard");

  const [userCount, questionCount, lectureCount, postCount, attemptCount, moduleCount, paperCount] =
    await Promise.all([
      prisma.user.count(),
      prisma.question.count(),
      prisma.lecture.count(),
      prisma.post.count(),
      prisma.quizAttempt.count(),
      prisma.module.count(),
      prisma.pastPaper.count(),
    ]);

  const recentUsers = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true, name: true, email: true, createdAt: true,
      rank: { select: { label: true } },
    },
  });

  const stats = [
    { label: "Students",     value: userCount,     icon: Users,         color: "text-blue-500",    bg: "bg-blue-50 dark:bg-blue-900/20" },
    { label: "Questions",    value: questionCount, icon: HelpCircle,    color: "text-violet-500",  bg: "bg-violet-50 dark:bg-violet-900/20" },
    { label: "Lectures",     value: lectureCount,  icon: Video,         color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
    { label: "Past Papers",  value: paperCount,    icon: FileText,      color: "text-cyan-500",    bg: "bg-cyan-50 dark:bg-cyan-900/20" },
    { label: "Forum Posts",  value: postCount,     icon: MessageSquare, color: "text-pink-500",    bg: "bg-pink-50 dark:bg-pink-900/20" },
    { label: "Quiz Attempts",value: attemptCount,  icon: TrendingUp,    color: "text-amber-500",   bg: "bg-amber-50 dark:bg-amber-900/20" },
  ];

  const quickLinks = [
    { href: "/admin/content",      label: "Courses & curriculum", icon: BookOpen,     desc: "University → semester → module → subject tree" },
    { href: "/admin/lectures",     label: "Lectures",          icon: Video,        desc: "Videos, flashcards, files" },
    { href: "/admin/past-papers",  label: "Past Papers",       icon: FileText,     desc: "Upload + manage exam papers" },
    { href: "/admin/questions",    label: "Questions",         icon: HelpCircle,   desc: "CRUD + bulk import" },
    { href: "/admin/ai-tools",     label: "AI Tools",          icon: Zap,          desc: "Extract & generate questions" },
    { href: "/admin/forum",        label: "Forum",             icon: MessageSquare,desc: "Open, close, moderate" },
    { href: "/admin/users",        label: "Users",             icon: Users,        desc: "Roles, bans, data" },
    { href: "/admin/ads",          label: "Ads",               icon: Megaphone,    desc: "Create & target banners" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <div className="mb-8">
        <p className="text-sm text-muted-foreground">{PLATFORM_COPY.doctorHub}</p>
        <h1 className="font-display text-3xl font-bold">Overview</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Manage curriculum, assessments, forums, and AI tools for your students — all in one place.
        </p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4">
            <div className={`mb-3 inline-flex rounded-lg p-2 ${bg}`}>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <p className="font-display text-2xl font-bold">{value.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick links */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 font-display text-lg font-semibold">Quick Navigation</h2>
          <div className="grid grid-cols-2 gap-2">
            {quickLinks.map(({ href, label, icon: Icon, desc }) => (
              <Link
                key={href}
                href={href}
                className="flex flex-col gap-1 rounded-lg border border-border p-3 hover:bg-muted hover:border-primary/30 transition-all"
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{label}</span>
                </div>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent users */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Recent Sign-ups</h2>
            <Link href="/admin/users" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {recentUsers.map((user) => (
              <div key={user.id} className="flex items-center gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {user.name?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{user.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
                <span className="flex-shrink-0 text-xs text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
