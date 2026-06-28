export interface ModuleProgressItem {
  id: string;
  name: string;
  pct: number;
}

export interface ActivityItem {
  day: string;
  count: number;
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
}
