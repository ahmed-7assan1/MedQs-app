import { Play, BrainCircuit, GraduationCap, ArrowRight, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { LastLectureInfo } from "@/types/dashboard";

interface FocusPlanCardProps {
  lastLecture: LastLectureInfo | null;
  firstName: string;
}

export function FocusPlanCard({ lastLecture, firstName }: FocusPlanCardProps) {
  if (!lastLecture) {
    return (
      <Card className="focus-plan-card border border-border/30 shadow-md">
        <CardContent className="p-6 md:p-8 text-center flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <GraduationCap className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Welcome to MedOneX, Dr. {firstName}!</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-md">
            Start your learning journey by selecting your first curriculum module or practicing with past papers.
          </p>
          <div className="flex gap-3 mt-6 w-full max-w-xs">
            <Button asChild className="flex-1 bg-primary text-primary-foreground font-bold rounded-xl shadow-sm hover:opacity-90">
              <Link href="/modules">
                Explore Modules <ArrowRight className="h-4 w-4 ml-1.5" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="focus-plan-card border border-border/30 shadow-md">
      <CardContent className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] bg-primary/10 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Focus Plan
              </span>
              <span className="text-[10px] font-bold text-muted-foreground/60">Estimated: 45 min</span>
            </div>
            
            <h2 className="text-xl md:text-2xl font-black text-foreground tracking-tight leading-tight line-clamp-2">
              {lastLecture.lectureTitle}
            </h2>
            <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest mt-1">
              {lastLecture.subjectName} &middot; {lastLecture.channelName || "MedOneX"}
            </p>

            <div className="flex items-center gap-3 mt-4">
              <div className="h-1.5 w-32 bg-muted/40 rounded-full overflow-hidden relative">
                <div className="h-full bg-primary rounded-full w-[35%]" />
              </div>
              <span className="text-[10px] font-black text-muted-foreground/50">35% completed</span>
            </div>
          </div>

          <div className="flex flex-wrap md:flex-nowrap gap-2.5 shrink-0">
            <Button asChild className="h-12 px-6 rounded-xl bg-primary text-primary-foreground font-black shadow-md shadow-primary/20 hover:opacity-95 flex items-center gap-2 group transition-all">
              <Link href={`/modules/${lastLecture.moduleId}/lectures/${lastLecture.lectureId}`}>
                <Play className="h-4 w-4 fill-current group-hover:scale-110 transition-transform" />
                Resume Lecture
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="h-12 px-4 rounded-xl border-border/60 hover:bg-muted/40 font-bold flex items-center gap-2">
              <Link href={`/ai-chat?lectureId=${lastLecture.lectureId}`}>
                <BrainCircuit className="h-4.5 w-4.5 text-primary" />
                Ask Dr. Q
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
