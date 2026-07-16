export interface ModuleProgressItem {
  id: string;
  name: string;
  pct: number;
  imageUrl?: string | null;
}

export interface DashboardAd {
  id: string;
  imageUrl: string;
  linkUrl?: string | null;
}

export interface LastLectureInfo {
  lectureId: string;
  lectureTitle: string;
  videoUrl: string | null;
  moduleId: string;
  subjectName: string;
  channelName: string;
  channelAvatar: string | null;
}

export interface QuizCardData {
  id: string;
  title: string;
  moduleName: string;
  bestScore: number | null;
  attemptCount: number;
}

export interface DashboardData {
  firstName: string;
  greeting: string;
  currentStreak: number;
  rankPoints: number;
  rankLabel: string;
  dailyPct: number;
  overallPct: number;
  todayItemCount: number;
  dailyTarget: number;
  totalQuestions: number;
  moduleProgress: ModuleProgressItem[];
  progressToNext: number;
  isProfileIncomplete: boolean;
  userImage?: string | null;
  ads?: DashboardAd[];
  lastLecture?: LastLectureInfo | null;
  recentQuizzes: QuizCardData[];
}

// ── Today Dashboard Architecture ──────────────────────────────────────────────
// Deep module: converts raw DashboardData into intent-driven task list.
// Seam: TodayTask[] is the interface; deriveTodayTasks() is the implementation.

export interface TodayTask {
  id: string;
  kind: "lecture" | "quiz" | "flashcards" | "review" | "module";
  title: string;
  subtitle?: string;
  href: string;
  estimateMin?: number;
  priority: "primary" | "recommended" | "optional";
  status: "ready" | "in_progress" | "done";
}

export interface LearningHealth {
  streakDays: number;
  masteryPct: number;
  questionsToday: number;
  rankLabel: string;
  rankPoints: number;
  progressToNext: number;
}

// AI Context contract — used when prefilling AI assistant prompts.
// Enables contextual AI entry points across the dashboard.
export type AiContext =
  | { kind: "dashboard"; weakTopics: string[]; recentLectureId?: string }
  | { kind: "lecture"; lectureId: string; selectedText?: string }
  | { kind: "quizAttempt"; attemptId: string; missedQuestionIds: string[] }
  | { kind: "search"; query: string };

/**
 * Derives a prioritised Today task list from raw dashboard data.
 * Deep module: all derivation logic is behind this one seam.
 * Callers never compute tasks inline — they call deriveTodayTasks(data).
 */
export function deriveTodayTasks(data: DashboardData): TodayTask[] {
  const tasks: TodayTask[] = [];

  // P1 — Primary: resume last lecture
  if (data.lastLecture) {
    tasks.push({
      id: `lecture-${data.lastLecture.lectureId}`,
      kind: "lecture",
      title: data.lastLecture.lectureTitle,
      subtitle: data.lastLecture.subjectName,
      href: `/modules/${data.lastLecture.moduleId}/lectures/${data.lastLecture.lectureId}`,
      estimateMin: 40,
      priority: "primary",
      status: "in_progress",
    });
  }

  // P2 — Recommended: quiz on weakest module
  if (data.moduleProgress.length > 0) {
    const weakest = [...data.moduleProgress].sort((a, b) => a.pct - b.pct)[0];
    if (weakest && weakest.pct < 80) {
      tasks.push({
        id: `quiz-${weakest.id}`,
        kind: "quiz",
        title: `Practice: ${weakest.name}`,
        subtitle: `${weakest.pct}% complete — test your knowledge`,
        href: `/quiz?moduleId=${weakest.id}`,
        estimateMin: 15,
        priority: "recommended",
        status: "ready",
      });
    }
  }

  // P3 — Recommended: continue learning modules
  const inProgress = data.moduleProgress.filter(m => m.pct > 0 && m.pct < 100);
  for (const mod of inProgress.slice(0, 2)) {
    if (tasks.some(t => t.id === `quiz-${mod.id}`)) continue;
    tasks.push({
      id: `module-${mod.id}`,
      kind: "module",
      title: `Continue: ${mod.name}`,
      subtitle: `${mod.pct}% complete`,
      href: `/modules/${mod.id}`,
      estimateMin: 30,
      priority: "recommended",
      status: "in_progress",
    });
  }

  // P4 — Optional: flashcards (always available)
  tasks.push({
    id: "flashcards-today",
    kind: "flashcards",
    title: "Flashcard Review",
    subtitle: "AI-generated from your notes",
    href: "/study-tools/flashcards-from-text",
    estimateMin: 10,
    priority: "optional",
    status: "ready",
  });

  // P5 — Optional: today's quiz from recent papers
  if (data.recentQuizzes.length > 0) {
    const q = data.recentQuizzes[0];
    tasks.push({
      id: `recent-quiz-${q.id}`,
      kind: "quiz",
      title: q.title,
      subtitle: q.bestScore !== null ? `Best: ${q.bestScore}%` : q.moduleName,
      href: `/quiz/${q.id}`,
      estimateMin: 20,
      priority: "optional",
      status: q.bestScore !== null ? "done" : "ready",
    });
  }

  return tasks.slice(0, 6);
}

/**
 * Derives LearningHealth compact metrics from DashboardData.
 * Single seam: callers never compute metrics inline.
 */
export function deriveLearningHealth(data: DashboardData): LearningHealth {
  return {
    streakDays: data.currentStreak,
    masteryPct: data.overallPct,
    questionsToday: data.todayItemCount,
    rankLabel: data.rankLabel,
    rankPoints: data.rankPoints,
    progressToNext: data.progressToNext,
  };
}
