export interface ModuleProgressItem {
  id: string;
  name: string;
  pct: number;
  imageUrl?: string | null;
}

export interface ActivityItem {
  day: string;
  count: number;
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
  activityArr: ActivityItem[];
  progressToNext: number;
  isProfileIncomplete: boolean;
  userImage?: string | null;
  ads?: DashboardAd[];
  lastLecture?: LastLectureInfo | null;
  recentQuizzes: QuizCardData[];
}
