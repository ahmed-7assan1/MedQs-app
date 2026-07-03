"use client";

import Link from "next/link";
import { Play, GraduationCap, BookOpen, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeader } from "@/components/dashboard/shared/SectionHeader";
import type { DashboardData } from "@/types/dashboard";

export function ContinueLearningSection({ data }: { data: DashboardData }) {
 const modules = data.moduleProgress?.slice(0, 4) || [];

 if (modules.length === 0) {
  return (
   <div>
     <SectionHeader icon={BookOpen} title="Continue Learning" />
     <Button variant="outline" asChild className="w-full p-0 h-auto rounded-2xl border-dashed bg-card/30 hover:bg-card/50">
      <Link
       href="/modules"
       className="flex items-center justify-between p-5"
      >
       <div className="flex items-center gap-3">
        <GraduationCap className="h-7 w-7 text-muted-foreground/30" />
        <div>
         <p className="text-sm font-bold text-foreground">No active modules</p>
         <p className="text-xs text-muted-foreground">Enroll to get started</p>
        </div>
       </div>
       <ArrowRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors duration-300" />
      </Link>
     </Button>
    </div>
   );
  }

  return (
   <div>
    <SectionHeader icon={BookOpen} title="Continue Learning" />

    <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth [-webkit-scrollbar]:hidden">
    {modules.map((mod, i) => (
   <div
       key={mod.id}
       className="snap-start shrink-0"
     >
      <Card asChild className="group w-[220px] md:w-[280px] lg:w-[240px] overflow-hidden rounded-2xl border-border/40 bg-card/80 shadow-sm will-change-transform transition-transform transition-colors transition-shadow duration-300 ease-out hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
       <Link href={`/modules/${mod.id}`}>
        <CardContent className="p-5">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />
        <div className="relative">
        <div className="flex items-center gap-3 mb-4">
           <div className="transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-0.5">
            <GraduationCap className="h-6 w-6 text-primary" />
           </div>
           <div className="flex-1 min-w-0">
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest truncate">Module</p>
            <p className="text-xs font-bold text-foreground truncate">{mod.name}</p>
           </div>
          </div>

          <div className="mb-3">
           <div className="flex justify-between text-[10px] font-bold mb-1">
            <span className="text-foreground">{mod.pct}%</span>
            <span className="text-muted-foreground/50">
             {Math.round((100 - mod.pct) / 10) * 5 || 5} min
            </span>
           </div>
           <Progress value={mod.pct} className="h-1.5 bg-muted/40 [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-accent" />
          </div>

         <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase tracking-wider transition-transform duration-300 group-hover:translate-x-1">
          <Play className="h-3 w-3" />
          Continue
         </div>
        </div>
        </CardContent>
       </Link>
      </Card>
      </div>
     ))}
    </div>
   </div>
  );
}
