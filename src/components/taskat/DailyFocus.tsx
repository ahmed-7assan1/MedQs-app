"use client";

import { useState, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  Circle, 
  BookOpen, 
  Sparkles,
  Trophy,
  Target,
  CalendarDays,
  ClipboardList
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useTaskPersistence } from "./useTaskPersistence";
import { DateStrip } from "./DateStrip";

interface DailyFocusProps {
  userId: string;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onProgressUpdate: (pct: number) => void;
  initialCurriculum: any[];
  initialSubjects: any[];
}

export function DailyFocus({ 
  userId,
  selectedDate, 
  onDateChange, 
  onProgressUpdate, 
  initialCurriculum, 
  initialSubjects 
}: DailyFocusProps) {
  
  const { tasks, loading, addTask, toggleTask, deleteTask } = useTaskPersistence(userId, selectedDate);
  
  const [isAdding, setIsAdding] = useState(false);
  const [taskType, setTaskType] = useState<"general" | "lecture">("general");

  // New task form state
  const [newTitle, setNewTitle] = useState("");
  const [newTime, setNewTime] = useState("");
  const [selectedLectureId, setSelectedLectureId] = useState("");

  useEffect(() => {
    if (tasks.length === 0) {
      onProgressUpdate(0);
      return;
    }
    const completed = tasks.filter(t => t.completed).length;
    onProgressUpdate((completed / tasks.length) * 100);
  }, [tasks, onProgressUpdate]);

  const handleAddTask = async () => {
    if (taskType === "general" && !newTitle.trim()) return;
    if (taskType === "lecture" && !selectedLectureId) return;

    let title = newTitle;
    if (taskType === "lecture") {
      const lecture = allLectures.find(l => l.id === selectedLectureId);
      title = `Study: ${lecture?.title || "Lecture"}`;
    }

    addTask({
      title,
      time: newTime,
      lectureId: taskType === "lecture" ? selectedLectureId : null,
    });

    setIsAdding(false);
    setNewTitle("");
    setNewTime("");
    setSelectedLectureId("");
    toast.success("Task added to your plan!");
  };

  const handleToggleTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updatedTask = toggleTask(taskId);
    
    // If it's a lecture task, sync with DB
    if (task.lectureId && updatedTask) {
      try {
        await fetch(`/api/v1/lectures/${task.lectureId}/complete`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completed: updatedTask.completed }),
        });
      } catch (err) {
        console.error("Failed to sync lecture progress to DB");
      }
    }
  };

  // Flatten all lectures for selection
  const allLectures: any[] = [];
  initialCurriculum.forEach(m => {
    m.subjects.forEach((s: any) => {
      s.lectures.forEach((l: any) => allLectures.push(l));
    });
  });
  initialSubjects.forEach(s => {
    s.lectures.forEach((l: any) => allLectures.push(l));
  });

  return (
    <div className="space-y-8">
      {/* Date Strip Component */}
      <DateStrip selectedDate={selectedDate} onDateChange={onDateChange} />

      {/* Motivational / Status Card */}
      <div className="group relative overflow-hidden rounded-[2rem] border border-sky-500/20 bg-gradient-to-br from-sky-500/10 via-indigo-500/5 to-transparent p-5 md:p-8 shadow-inner backdrop-blur-xl">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-sky-500/10 blur-3xl transition-all group-hover:bg-sky-500/20" />
        <div className="flex items-center gap-4 md:gap-6">
          <div className="flex h-12 w-12 md:h-16 md:w-16 items-center justify-center rounded-xl md:rounded-[1.5rem] bg-white dark:bg-sky-500 text-sky-600 dark:text-white shadow-2xl shadow-sky-500/20 shrink-0">
            <CalendarDays className="h-6 w-6 md:h-8 md:w-8" />
          </div>
          <div>
            <h3 className="text-xl md:text-2xl font-black font-display dark:text-white text-slate-800">
               {selectedDate.toDateString() === new Date().toDateString() ? "Today's Agenda" : "Day Schedule"}
            </h3>
            <p className="text-[10px] md:text-sm dark:text-sky-100/60 text-slate-500 font-bold uppercase tracking-widest mt-0.5">
              {tasks.length} tasks planned
            </p>
          </div>
        </div>
      </div>

      {/* Task Section Header */}
      <div className="flex items-center justify-between px-2 gap-4">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="h-6 md:h-8 w-1 md:w-1.5 rounded-full bg-sky-500" />
          <h2 className="font-display text-xl md:text-3xl font-black dark:text-white text-slate-900">Task List</h2>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="group flex items-center gap-2 rounded-xl md:rounded-2xl bg-sky-500 px-4 md:px-6 py-2.5 md:py-3 text-[11px] md:text-sm font-black text-white shadow-xl shadow-sky-500/30 transition-all hover:scale-105 active:scale-95 shrink-0"
          >
            <Plus className="h-3.5 w-3.5 md:h-4 md:w-4 transition-transform group-hover:rotate-90" />
            New Task
          </button>
        )}
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="rounded-[2rem] md:rounded-[2.5rem] border border-slate-200/60 dark:border-white/10 bg-white dark:bg-slate-900/60 p-6 md:p-10 shadow-3xl backdrop-blur-3xl"
          >
            <div className="mb-8 flex justify-center gap-3">
              <button
                onClick={() => setTaskType("general")}
                className={cn(
                  "rounded-2xl px-6 py-2.5 text-xs font-black uppercase tracking-widest transition-all",
                  taskType === "general" 
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl" 
                    : "bg-slate-100 dark:bg-white/5 dark:text-white/40 text-slate-400 hover:bg-slate-200"
                )}
              >
                Routine Task
              </button>
              <button
                onClick={() => setTaskType("lecture")}
                className={cn(
                  "rounded-2xl px-6 py-2.5 text-xs font-black uppercase tracking-widest transition-all",
                  taskType === "lecture" 
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl" 
                    : "bg-slate-100 dark:bg-white/5 dark:text-white/40 text-slate-400 hover:bg-slate-200"
                )}
              >
                Academic Link
              </button>
            </div>

            <div className="space-y-6">
              {taskType === "general" ? (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Task Title</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="E.g. Study Anatomy Chapter 3"
                    className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-black/40 px-6 py-4 dark:text-white text-slate-900 placeholder:text-slate-300 dark:placeholder:text-white/10 focus:outline-none focus:ring-4 focus:ring-sky-500/20 transition-all font-medium"
                    autoFocus
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Select Course Content</label>
                  <select
                    value={selectedLectureId}
                    onChange={(e) => setSelectedLectureId(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-black/40 px-6 py-4 dark:text-white text-slate-900 focus:outline-none focus:ring-4 focus:ring-sky-500/20 appearance-none font-medium"
                  >
                    <option value="" disabled className="bg-white dark:bg-slate-900">Choose a lecture from your degree...</option>
                    {allLectures.map(l => (
                      <option key={l.id} value={l.id} className="bg-white dark:bg-slate-900">{l.title}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Clock className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-300 dark:text-white/20" />
                  <input
                    type="text"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    placeholder="Set Time (e.g. 09:00 AM)"
                    className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-black/40 pl-14 pr-6 py-4 dark:text-white text-slate-900 placeholder:text-slate-300 dark:placeholder:text-white/10 focus:outline-none focus:ring-4 focus:ring-sky-500/20 transition-all font-medium"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsAdding(false)}
                    className="rounded-2xl bg-slate-100 dark:bg-white/5 px-8 py-4 text-sm font-black dark:text-white/60 text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
                  >
                    Discard
                  </button>
                  <button
                    onClick={handleAddTask}
                    className="flex-1 rounded-2xl bg-sky-500 px-10 py-4 text-sm font-black text-white shadow-2xl shadow-sky-500/40 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    Plan It
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tasks List */}
      <div className="grid gap-4">
        {tasks.map((task) => (
          <motion.div
            layout
            key={task.id}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
               "group relative flex items-center gap-6 rounded-[2rem] border p-6 transition-all duration-300 shadow-sm",
               task.completed 
                ? "border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]" 
                : "border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/[0.06] hover:shadow-xl hover:border-sky-500/30 dark:hover:border-white/20"
            )}
          >
            <button
              onClick={() => handleToggleTask(task.id)}
              className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all"
            >
              {task.completed ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/40">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              ) : (
                <div className="h-8 w-8 rounded-xl border-2 border-slate-200 dark:border-white/20 bg-white/50 dark:bg-black/20 hover:border-sky-500 transition-colors" />
              )}
            </button>

            <div className="flex-1 min-w-0">
              <h4 className={cn(
                "text-lg font-black transition-all truncate",
                task.completed ? "dark:text-white/20 text-slate-300 line-through" : "dark:text-white text-slate-900"
              )}>
                {task.title}
              </h4>
              <div className="flex items-center gap-4 mt-2">
                {task.time && (
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-sky-600/70 dark:text-sky-400/70">
                    <Clock className="h-3.5 w-3.5" />
                    {task.time}
                  </div>
                )}
                {task.lectureId && (
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-600/70 dark:text-indigo-400/70">
                    <BookOpen className="h-3.5 w-3.5" />
                    Academic Goal
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => deleteTask(task.id)}
              className="opacity-0 group-hover:opacity-100 p-3 rounded-2xl dark:text-white/20 text-slate-300 hover:text-red-500 hover:bg-red-500/10 transition-all"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </motion.div>
        ))}

        {!loading && tasks.length === 0 && !isAdding && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-[2.5rem] bg-slate-100 dark:bg-white/5 dark:text-white/10 text-slate-200">
              <ClipboardList className="h-12 w-12" />
            </div>
            <p className="text-xl font-black font-display dark:text-white/40 text-slate-400">Nothing here yet</p>
            <p className="text-sm dark:text-white/20 text-slate-300 mt-2 font-medium">Ready to chart your course? Add your first task.</p>
          </div>
        )}

        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 w-full animate-pulse rounded-[2.5rem] bg-slate-100 dark:bg-white/5" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
