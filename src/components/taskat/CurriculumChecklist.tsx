"use client";

import { useState, memo, useCallback, useMemo } from "react";
import { 
  ChevronRight, 
  ChevronDown, 
  BookOpen, 
  GraduationCap, 
  CheckCircle2, 
  Circle,
  FolderOpen
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

interface CurriculumChecklistProps {
  modules: any[];
  subjects: any[];
}

export function CurriculumChecklist({ modules, subjects }: CurriculumChecklistProps) {
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});
  const [completionStates, setCompletionStates] = useState<Record<string, boolean>>(() => {
    const states: Record<string, boolean> = {};
    modules.forEach(m => {
      m.subjects.forEach((s: any) => {
        s.lectures.forEach((l: any) => {
          states[l.id] = l.activities?.[0]?.isCompleted || false;
        });
      });
    });
    subjects.forEach(s => {
      s.lectures.forEach((l: any) => {
        states[l.id] = l.activities?.[0]?.isCompleted || false;
      });
    });
    return states;
  });

  const toggleModule = useCallback((id: string) => {
    setExpandedModules(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const toggleSubject = useCallback((id: string) => {
    setExpandedSubjects(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const toggleLectureCompletion = useCallback(async (lectureId: string) => {
    setCompletionStates(prev => {
      const newState = !prev[lectureId];
      // Side effect inside functional update is generally discouraged but here we need the latest state
      // Better to do it after or use a more robust state management. 
      // For now, let's keep it consistent with original logic but optimized.
      return { ...prev, [lectureId]: newState };
    });

    try {
      // Note: This fetch doesn't wait for state update, which is fine for optimistic UI
      const res = await fetch(`/api/v1/lectures/${lectureId}/complete`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !completionStates[lectureId] }),
      });

      if (!res.ok) throw new Error("Failed to update");
      // We don't need toast every time if it's fast, but original had it
    } catch (err) {
      // Revert state on error
      setCompletionStates(prev => ({ ...prev, [lectureId]: !prev[lectureId] }));
      toast.error("Network synchronization failed");
    }
  }, [completionStates]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6">
        {modules.map((module) => (
          <div 
            key={module.id} 
            className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:border-primary/20"
          >
            <button
              onClick={() => toggleModule(module.id)}
              className="group flex w-full items-center justify-between p-6 text-left transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center gap-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-inner">
                  <FolderOpen className="h-6 w-6 transition-transform group-hover:scale-110" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">{module.name}</h3>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">{module.subjects?.length ?? 0} Major Subjects</p>
                </div>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted transition-all group-hover:bg-primary group-hover:text-primary-foreground">
                <ChevronDown 
                  className={cn(
                    "h-4 w-4 transition-transform duration-500",
                    expandedModules[module.id] && "rotate-180"
                  )} 
                />
              </div>
            </button>

            <AnimatePresence initial={false}>
              {expandedModules[module.id] && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden border-t border-border"
                >
                  <div className="space-y-4 p-4 bg-muted/20">
                    {module.subjects.map((subject: any) => (
                      <SubjectItem 
                        key={subject.id} 
                        subject={subject} 
                        isExpanded={expandedSubjects[subject.id]}
                        toggle={() => toggleSubject(subject.id)}
                        completionStates={completionStates}
                        onToggleLecture={toggleLectureCompletion}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {subjects.length > 0 && (
        <div className="mt-10 space-y-6">
          <div className="flex items-center gap-3 px-4">
            <GraduationCap className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Individual Courses</h2>
          </div>
          <div className="grid gap-4">
            {subjects.map((subject) => (
              <div 
                 key={subject.id} 
                 className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
              >
                <SubjectItem 
                  subject={subject} 
                  isExpanded={expandedSubjects[subject.id]}
                  toggle={() => toggleSubject(subject.id)}
                  completionStates={completionStates}
                  onToggleLecture={toggleLectureCompletion}
                  standalone
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {modules.length === 0 && subjects.length === 0 && (
        <div className="flex flex-col items-center justify-center p-32 text-center">
           <div className="flex h-24 w-24 items-center justify-center rounded-[2.5rem] bg-slate-100 dark:bg-white/5 text-slate-200 dark:text-white/10 mb-8">
             <BookOpen className="h-12 w-12" />
           </div>
           <p className="text-2xl font-black font-display dark:text-white/40 text-slate-400">Curriculum Blank</p>
           <p className="text-sm dark:text-white/20 text-slate-300 mt-2 font-medium">Coordinate with your institution to load your modules.</p>
        </div>
      )}
    </div>
  );
}

const LectureItem = memo(({ lecture, isCompleted, onToggle }: any) => {
  return (
    <button
      onClick={() => onToggle(lecture.id)}
      className="group flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all hover:bg-muted/50"
    >
      <div className="relative flex h-5 w-5 shrink-0 items-center justify-center">
        {isCompleted ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
        ) : (
          <Circle className="h-5 w-5 text-muted-foreground/30 group-hover:text-primary" />
        )}
      </div>
      <span className={cn(
        "text-[13px] font-medium transition-all",
        isCompleted ? "text-muted-foreground/40 line-through" : "text-foreground/80"
      )}>
        {lecture.title}
      </span>
    </button>
  );
});

LectureItem.displayName = "LectureItem";

const SubjectItem = memo(({ subject, isExpanded, toggle, completionStates, onToggleLecture, standalone }: any) => {
  const completedCount = useMemo(() => 
    subject.lectures.filter((l: any) => completionStates[l.id]).length,
    [subject.lectures, completionStates]
  );
  const totalCount = subject.lectures.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className={cn(
        "rounded-xl transition-all duration-300", 
        !standalone && "border border-border/50 bg-card/50 hover:border-primary/20"
    )}>
      <button
        onClick={toggle}
        className="flex w-full items-center justify-between p-5"
      >
        <div className="flex items-center gap-4">
          <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
              progress === 100 ? "bg-emerald-500 text-white" : "bg-primary/10 text-primary"
          )}>
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="text-left">
            <h4 className="text-[14px] font-bold text-foreground">{subject.name}</h4>
            <div className="flex items-center gap-2 mt-1">
                 <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{completedCount} / {totalCount} Topics</p>
                 {progress > 0 && (
                    <span className="text-[10px] font-bold text-primary">{Math.round(progress)}%</span>
                 )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {totalCount > 0 && (
            <div className="hidden sm:block h-1 w-16 overflow-hidden rounded-full bg-muted">
              <motion.div 
                className="h-full bg-primary" 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: "circOut" }}
              />
            </div>
          )}
          <div className="p-1.5 rounded-lg bg-muted text-muted-foreground">
            <ChevronRight 
                className={cn(
                "h-3.5 w-3.5 transition-transform duration-300",
                isExpanded && "rotate-90"
                )} 
            />
          </div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="space-y-2 p-4 pt-0">
              {subject.lectures.map((lecture: any) => (
                <LectureItem 
                  key={lecture.id}
                  lecture={lecture}
                  isCompleted={completionStates[lecture.id]}
                  onToggle={onToggleLecture}
                />
              ))}
              {subject.lectures.length === 0 && (
                 <p className="p-8 text-center text-xs font-bold uppercase tracking-widest text-slate-300 dark:text-white/10">Zero content items found.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

SubjectItem.displayName = "SubjectItem";


