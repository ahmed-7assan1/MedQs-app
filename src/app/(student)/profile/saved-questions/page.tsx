import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Bookmark, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function SavedQuestionsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const saved = await prisma.savedQuestion.findMany({
    where: { userId: session.user.id },
    include: {
      question: {
        include: {
          lecture: {
            include: {
              subject: {
                include: {
                  module: true
                }
              }
            }
          }
        }
      }
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
      <Link href="/dashboard" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </Link>
      
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Bookmark className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold">Saved Questions</h1>
          <p className="text-sm text-muted-foreground">Review questions you've bookmarked for later study.</p>
        </div>
      </div>

      {saved.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card py-20 text-center">
          <Bookmark className="mx-auto mb-4 h-10 w-10 text-muted-foreground/30" />
          <h2 className="text-lg font-semibold text-muted-foreground">No saved questions</h2>
          <p className="mt-1 text-sm text-muted-foreground">Bookmark questions during quizzes to see them here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {saved.map((item) => {
            const q = item.question;
            const contextStr = q.lecture?.subject?.module?.name 
              ? `${q.lecture.subject.module.name} • ${q.lecture.title}` 
              : "Question Bank";
              
            return (
              <div key={item.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
                <div className="mb-3 flex items-center justify-between">
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                    {q.questionType}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Saved {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="mb-2 line-clamp-3 text-sm font-medium">{q.body}</h3>
                
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                  <p className="text-xs text-muted-foreground">{contextStr}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
