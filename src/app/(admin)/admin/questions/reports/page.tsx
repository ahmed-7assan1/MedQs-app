import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Flag, Trash2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { parseEssayGrade } from "@/lib/essay-grade";

export default async function AdminReportsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Validate SUPER_ADMIN or canManageReports mapping correctly 
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.role !== "SUPER_ADMIN" && !user?.canManageReports) {
    redirect("/admin/dashboard");
  }

  const reports = await prisma.questionReport.findMany({
    include: {
      question: true,
      user: { select: { name: true, email: true } },
      pastPaper: { select: { title: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
          <Flag className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold">Question Reports</h1>
          <p className="text-sm text-muted-foreground">Review feedback and issues reported by students.</p>
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card py-20 text-center shadow-sm">
          <Flag className="mx-auto mb-4 h-10 w-10 text-muted-foreground/30" />
          <h2 className="text-lg font-semibold text-muted-foreground">All clear!</h2>
          <p className="mt-1 text-sm text-muted-foreground">No reports currently pending review.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div key={report.id} className="relative rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                    Reported by {report.user.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(report.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/admin/questions`} // Would link to direct edit ideally if supported via query param
                    className="flex h-8 items-center gap-1.5 rounded-lg bg-primary/10 px-3 text-xs font-semibold text-primary hover:bg-primary/20"
                  >
                    <ExternalLink className="h-3 w-3" /> Edit Question
                  </Link>
                </div>
              </div>
              
              {report.note && (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 pr-8 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                  <p className="font-semibold mb-1">Student Note:</p>
                  <p>{report.note}</p>
                </div>
              )}

              <div className="rounded-xl border border-border bg-muted/20 p-4">
                <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-2">Original Question</p>
                <div className="text-sm font-medium">{report.question.body}</div>
                {report.pastPaper && (
                   <p className="mt-4 text-xs text-muted-foreground">Paper Context: {report.pastPaper.title}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
