"use client";

import { useState, useEffect, memo, useCallback, useMemo } from "react";
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
import { MedqsSelect } from "@/components/ui/MedqsSelect";

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
  const [newPriority, setNewPriority] = useState<"HIGH" | "MEDIUM" | "LOW">("MEDIUM");

  useEffect(() => {
    if (tasks.length === 0) {
      onProgressUpdate(0);
      return;
    }
    const completed = tasks.filter(t => t.completed).length;
    onProgressUpdate((completed / tasks.length) * 100);
  }, [tasks, onProgressUpdate]);

  // Flatten all lectures for selection - memoized for performance
  const allLectures = useMemo(() => {
    const list: any[] = [];
    initialCurriculum.forEach(m => {
      m.subjects.forEach((s: any) => {
        s.lectures.forEach((l: any) => list.push(l));
      });
    });
    initialSubjects.forEach(s => {
      s.lectures.forEach((l: any) => list.push(l));
    });
    return list;
  }, [initialCurriculum, initialSubjects]);

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
      priority: newPriority,
    });

    setIsAdding(false);
    setNewTitle("");
    setNewTime("");
    setSelectedLectureId("");
    setNewPriority("MEDIUM");
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

  const isDayFinished = tasks.length > 0 && tasks.every(t => t.completed);

  return (
    <div className="space-y-8">
      {/* Date Strip Component */}
      <DateStrip selectedDate={selectedDate} onDateChange={onDateChange} />

      {/* Motivational / Status Card */}
      <div className={cn(
        "group relative overflow-hidden rounded-2xl border p-6 md:p-8 shadow-2xl transition-all duration-300",
        isDayFinished
          ? "border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-transparent shadow-amber-500/5"
          : "border-white/[0.07] bg-[#131220]"
      )}>
        {isDayFinished ? (
          <>
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-500/20 blur-3xl" />
            <div className="flex items-center gap-4 md:gap-6">
              <motion.div 
                animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                transition={{ repeat: Infinity, repeatDelay: 5, duration: 1 }}
                className="flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 shadow-2xl shadow-amber-500/30 shrink-0"
              >
                <Trophy className="h-6 w-6 md:h-7 md:w-7 text-white" />
              </motion.div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold font-display text-amber-400 flex items-center gap-2">
                   Perfect Day! <Sparkles className="h-5 w-5 text-yellow-300 animate-pulse" />
                </h3>
                <p className="text-[10px] md:text-[11px] text-amber-500/70 font-bold uppercase tracking-widest mt-1">
                   All {tasks.length} tasks completed · Outstanding job!
                </p>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-3xl transition-all group-hover:bg-primary/20" />
            <div className="flex items-center gap-4 md:gap-6">
              <div className="flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-xl btn-gradient shadow-2xl shadow-primary/30 shrink-0">
                <CalendarDays className="h-6 w-6 md:h-7 md:w-7" />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold font-display text-white">
                   {selectedDate.toDateString() === new Date().toDateString() ? "Today's Agenda" : "Day Schedule"}
                </h3>
                <p className="text-[10px] md:text-[11px] text-white/35 font-bold uppercase tracking-widest mt-1">
                  {tasks.length} tasks planned · Stay focused
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Task Section Header */}
      <div className="flex items-center justify-between px-2 gap-4">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="h-6 md:h-8 w-1 md:w-1.5 rounded-full bg-primary" />
          <h2 className="font-display text-xl md:text-2xl font-bold text-white">Task List</h2>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="group btn-gradient flex items-center gap-2 rounded-xl px-5 py-2.5 text-[11px] md:text-xs font-bold shadow-lg shadow-primary/20 shrink-0"
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
            className="rounded-2xl border border-white/[0.07] bg-[#131220] p-6 md:p-8 shadow-2xl space-y-5"
          >
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setTaskType("general")}
                className={cn(
                  "rounded-xl px-6 py-2 text-[10px] font-bold uppercase tracking-widest transition-all",
                  taskType === "general" 
                    ? "bg-card text-foreground shadow-xl" 
                    : "bg-white/5 text-white/40 hover:bg-white/10"
                )}
              >
                Routine Task
              </button>
              <button
                onClick={() => setTaskType("lecture")}
                className={cn(
                  "rounded-xl px-6 py-2 text-[10px] font-bold uppercase tracking-widest transition-all",
                  taskType === "lecture" 
                    ? "bg-card text-foreground shadow-xl" 
                    : "bg-white/5 text-white/40 hover:bg-white/10"
                )}
              >
                Academic Link
              </button>
            </div>

            <div className="space-y-4">
              {taskType === "general" ? (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/35 ml-2">Task Title</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="E.g. Study Anatomy Chapter 3"
                    className="w-full rounded-xl border border-white/[0.07] bg-white/5 px-5 py-3 text-[13px] text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-all font-medium"
                    autoFocus
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/35 ml-2">Select Course Content</label>
                  <MedqsSelect
                    value={selectedLectureId}
                    onChange={(e) => setSelectedLectureId(e.target.value)}
                    placeholder="Choose a lecture..."
                    className="w-full"
                  >
                    {allLectures.map(l => (
                      <option key={l.id} value={l.id}>{l.title}</option>
                    ))}
                  </MedqsSelect>
                </div>
              )}

              {/* Priority Selector */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/35 ml-2">Priority Level</label>
                <div className="flex gap-2">
                  {(["LOW", "MEDIUM", "HIGH"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setNewPriority(p)}
                      className={cn(
                        "flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all duration-300",
                        newPriority === p
                          ? p === "HIGH"
                            ? "bg-red-500/10 text-red-400 border-red-500/30 shadow-lg shadow-red-500/5"
                            : p === "MEDIUM"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-lg shadow-amber-500/5"
                            : "bg-blue-500/10 text-blue-400 border-blue-500/30 shadow-lg shadow-blue-500/5"
                          : "bg-white/5 text-white/40 border-transparent hover:bg-white/10"
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <div className="relative flex-1">
                  <Clock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" />
                  <input
                    type="text"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    placeholder="Time (e.g. 09:00 AM)"
                    className="w-full rounded-xl border border-white/[0.07] bg-white/5 pl-11 pr-5 py-3 text-[13px] text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-all font-medium"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsAdding(false)}
                    className="rounded-xl bg-white/5 px-6 py-3 text-[11px] font-bold text-white/40 hover:bg-white/10 transition-all"
                  >
                    Discard
                  </button>
                  <button
                    onClick={handleAddTask}
                    className="btn-gradient flex-1 rounded-xl px-8 py-3 text-[11px] font-bold shadow-lg shadow-primary/20"
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
        <AnimatePresence mode="popLayout" initial={false}>
          {tasks.map((task) => (
            <TaskItem 
              key={task.id} 
              task={task} 
              onToggle={handleToggleTask} 
              onDelete={deleteTask} 
            />
          ))}
        </AnimatePresence>

        {!loading && tasks.length === 0 && !isAdding && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-[2.5rem] bg-white/5 text-white/10">
              <ClipboardList className="h-12 w-12" />
            </div>
            <p className="text-xl font-black font-display text-white/40">Nothing here yet</p>
            <p className="text-sm text-white/20 mt-2 font-medium">Ready to chart your course? Add your first task.</p>
          </div>
        )}

        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 w-full animate-pulse rounded-[2.5rem] bg-white/5" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const TaskItem = memo(({ task, onToggle, onDelete }: any) => {
  const pColors = {
    HIGH: "bg-red-500/10 text-red-400 border border-red-500/20",
    MEDIUM: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    LOW: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  };

  const pBorders = {
    HIGH: "border-l-red-500",
    MEDIUM: "border-l-amber-500",
    LOW: "border-l-blue-500",
  };

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn(
          "row-card-new group border-l-[3.5px]",
          task.completed 
            ? "border-white/5 bg-white/5 opacity-50" 
            : pBorders[task.priority as "HIGH" | "MEDIUM" | "LOW"] || "border-l-[#6C5FF0]"
      )}
    >
      <button
        onClick={() => onToggle(task.id)}
        className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-xl transition-all"
      >
        {task.completed ? (
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        ) : (
          <div className="h-7 w-7 rounded-xl border border-white/10 bg-white/5 hover:border-primary transition-colors" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <h4 className={cn(
          "row-title-new transition-all truncate text-[15px] font-bold text-white",
          task.completed && "text-white/20 line-through font-normal"
        )}>
          {task.title}
        </h4>
        <div className="row-meta-new flex items-center gap-2">
          {task.time && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {task.time}
            </div>
          )}
          {task.lectureId && (
            <span className="tag-new">Academic Link</span>
          )}
          {task.priority && !task.completed && (
            <span className={cn("px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider", pColors[task.priority as "HIGH" | "MEDIUM" | "LOW"])}>
              {task.priority}
            </span>
          )}
        </div>
      </div>

      <button
        onClick={() => onDelete(task.id)}
        className="opacity-0 group-hover:opacity-100 p-2 rounded-xl text-white/30 hover:text-red-500 hover:bg-red-500/10 transition-all"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </motion.div>
  );
});

TaskItem.displayName = "TaskItem";


