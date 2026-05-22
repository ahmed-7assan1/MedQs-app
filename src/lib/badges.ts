export interface Badge {
  id: string;
  label: string;
  description: string;
  icon: string;
  check: (data: BadgeData) => boolean;
}

export interface BadgeData {
  totalSessionsCompleted: number;
  totalFocusSeconds: number;
  totalPointsFromSessions: number;
  sessionsThisWeek: number;
  daysStudiedThisWeek: number;
  sessionsToday: number;
  hostSessionsCompleted: number;
  lecturesStudied: number;
  longestStreak: number;
  currentStreak: number;
}

export const ALL_BADGES: Badge[] = [
  {
    id: "first_session",
    label: "First Steps",
    description: "Complete your first study session",
    icon: "🎯",
    check: (d) => d.totalSessionsCompleted >= 1,
  },
  {
    id: "ten_sessions",
    label: "Dedicated",
    description: "Complete 10 study sessions",
    icon: "💪",
    check: (d) => d.totalSessionsCompleted >= 10,
  },
  {
    id: "twenty_five_sessions",
    label: "Study Machine",
    description: "Complete 25 study sessions",
    icon: "⚡",
    check: (d) => d.totalSessionsCompleted >= 25,
  },
  {
    id: "fifty_sessions",
    label: "Fifty Club",
    description: "Complete 50 study sessions",
    icon: "🏆",
    check: (d) => d.totalSessionsCompleted >= 50,
  },
  {
    id: "week_warrior",
    label: "Week Warrior",
    description: "Study 5 days in a single week",
    icon: "🔥",
    check: (d) => d.daysStudiedThisWeek >= 5,
  },
  {
    id: "speed_focus",
    label: "Speed Focus",
    description: "Complete 3 sessions in one day",
    icon: "⏱️",
    check: (d) => d.sessionsToday >= 3,
  },
  {
    id: "host_10",
    label: "Captain",
    description: "Host 10 study sessions",
    icon: "👑",
    check: (d) => d.hostSessionsCompleted >= 10,
  },
  {
    id: "scholar",
    label: "Scholar",
    description: "Complete a session with a lecture selected",
    icon: "📚",
    check: (d) => d.lecturesStudied >= 1,
  },
  {
    id: "centurion",
    label: "Centurion",
    description: "Earn 1,000 points from sessions",
    icon: "💎",
    check: (d) => d.totalPointsFromSessions >= 1000,
  },
  {
    id: "streak_7",
    label: "7-Day Streak",
    description: "Study for 7 consecutive days",
    icon: "🔥",
    check: (d) => d.longestStreak >= 7,
  },
  {
    id: "streak_30",
    label: "Monthly Legend",
    description: "Study for 30 consecutive days",
    icon: "🌟",
    check: (d) => d.longestStreak >= 30,
  },
  {
    id: "double_focus",
    label: "Deep Focus",
    description: "Accumulate 10 hours of total focus time",
    icon: "🧠",
    check: (d) => d.totalFocusSeconds >= 36000,
  },
];

export function getEarnedBadges(data: BadgeData): Badge[] {
  return ALL_BADGES.filter((b) => b.check(data));
}

export function getBadgeProgress(badge: Badge, data: BadgeData): { earned: boolean; progress?: { current: number; target: number } } {
  const earned = badge.check(data);
  const progressMap: Record<string, { current: number; target: number }> = {
    first_session: { current: data.totalSessionsCompleted, target: 1 },
    ten_sessions: { current: data.totalSessionsCompleted, target: 10 },
    twenty_five_sessions: { current: data.totalSessionsCompleted, target: 25 },
    fifty_sessions: { current: data.totalSessionsCompleted, target: 50 },
    week_warrior: { current: data.daysStudiedThisWeek, target: 5 },
    speed_focus: { current: data.sessionsToday, target: 3 },
    host_10: { current: data.hostSessionsCompleted, target: 10 },
    centurion: { current: data.totalPointsFromSessions, target: 1000 },
    streak_7: { current: data.longestStreak, target: 7 },
    streak_30: { current: data.longestStreak, target: 30 },
    double_focus: { current: data.totalFocusSeconds, target: 36000 },
  };

  if (earned) return { earned };
  return { earned, progress: progressMap[badge.id] };
}
