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
            className="overflow-hidden rounded-[2.5rem] border border-slate-200/60 dark:border-white/[0.03] bg-white dark:bg-slate-900/40 shadow-xl backdrop-blur-3xl transition-all duration-300 hover:border-sky-500/20"
          >
            <button
              onClick={() => toggleModule(module.id)}
              className="group flex w-full items-center justify-between p-8 text-left transition-colors hover:bg-slate-50/50 dark:hover:bg-white/5"
            >
              <div className="flex items-center gap-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 shadow-inner">
                  <FolderOpen className="h-8 w-8 transition-transform group-hover:scale-110" />
                </div>
                <div>
                  <h3 className="text-2xl font-black font-display dark:text-white text-slate-900">{module.name}</h3>
                  <p className="text-sm dark:text-white/40 text-slate-400 font-bold uppercase tracking-widest mt-1">{module.subjects?.length ?? 0} Major Subjects</p>
                </div>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-white/5 transition-all group-hover:bg-sky-500 group-hover:text-white">
                <ChevronDown 
                  className={cn(
                    "h-5 w-5 transition-transform duration-500",
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
                  className="overflow-hidden border-t border-slate-100 dark:border-white/[0.02]"
                >
                  <div className="space-y-4 p-6 bg-slate-50/30 dark:bg-black/20">
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
        <div className="mt-12 space-y-6">
          <div className="flex items-center gap-4 px-4">
            <GraduationCap className="h-6 w-6 text-sky-500" />
            <h2 className="font-display text-2xl font-black dark:text-white/80 text-slate-800">Individual Courses</h2>
          </div>
          <div className="grid gap-6">
            {subjects.map((subject) => (
              <div 
                 key={subject.id} 
                 className="overflow-hidden rounded-[2.5rem] border border-slate-200/60 dark:border-white/[0.03] bg-white dark:bg-slate-900/40 shadow-xl"
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
      className="group flex w-full items-center gap-4 rounded-2xl p-4 text-left transition-all hover:bg-white dark:hover:bg-white/5 hover:shadow-lg hover:shadow-slate-200/5 dark:hover:shadow-none"
    >
      <div className="relative flex h-6 w-6 shrink-0 items-center justify-center">
        {isCompleted ? (
          <CheckCircle2 className="h-6 w-6 text-emerald-500" />
        ) : (
          <Circle className="h-6 w-6 text-slate-300 dark:text-white/20 group-hover:text-sky-500" />
        )}
      </div>
      <span className={cn(
        "font-bold transition-all",
        isCompleted ? "dark:text-white/20 text-slate-300 line-through" : "dark:text-white/80 text-slate-600"
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
        "rounded-[1.5rem] transition-all duration-300", 
        !standalone && "border border-slate-200/50 dark:border-white/[0.02] bg-white/50 dark:bg-white/[0.03] hover:border-sky-500/30"
    )}>
      <button
        onClick={toggle}
        className="flex w-full items-center justify-between p-6"
      >
        <div className="flex items-center gap-5">
          <div className={cn(
              "flex h-12 w-12 items-center justify-center rounded-2xl transition-colors",
              progress === 100 ? "bg-emerald-500 text-white" : "bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400"
          )}>
            <BookOpen className="h-6 w-6" />
          </div>
          <div className="text-left">
            <h4 className="text-lg font-black dark:text-white/90 text-slate-800">{subject.name}</h4>
            <div className="flex items-center gap-3 mt-1">
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{completedCount} / {totalCount} Topics</p>
                 {progress > 0 && (
                    <span className="text-[10px] font-black dark:text-indigo-400 text-indigo-600">{Math.round(progress)}%</span>
                 )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {totalCount > 0 && (
            <div className="hidden sm:block h-2 w-24 overflow-hidden rounded-full bg-slate-200 dark:bg-white/5 shadow-inner">
              <motion.div 
                className="h-full bg-indigo-500 shadow-lg shadow-indigo-500/50" 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: "circOut" }}
              />
            </div>
          )}
          <div className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-400">
            <ChevronRight 
                className={cn(
                "h-4 w-4 transition-transform duration-300",
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


