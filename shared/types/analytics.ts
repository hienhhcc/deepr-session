export interface DailyStat {
  date: string;
  totalFocusMinutes: number;
  sessionsCompleted: number;
  averageRating: number | null;
}

export interface WeeklySummary {
  weekStart: string;
  totalFocusHours: number;
  sessionsCompleted: number;
  averageRating: number | null;
  dailyStats: DailyStat[];
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
}

export interface AnalyticsSummary {
  totalSessions: number;
  totalFocusHours: number;
  averageSessionLength: number;
  averageRating: number | null;
  streak: StreakInfo;
}
