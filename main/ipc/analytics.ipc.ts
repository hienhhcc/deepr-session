import { ipcMain } from "electron";
import { IPC_CHANNELS } from "../../shared/types/ipc.js";
import { getDatabase } from "../services/database.js";

export function registerAnalyticsHandlers() {
  ipcMain.handle(
    IPC_CHANNELS.ANALYTICS_DAILY,
    async (_event, startDate: string, endDate: string) => {
      const db = getDatabase();
      const rows = db
        .prepare(
          `SELECT
            date(started_at) as date,
            SUM(total_focus_time) / 60 as total_focus_minutes,
            COUNT(*) as sessions_completed,
            AVG(CASE WHEN focus_rating IS NOT NULL THEN focus_rating END) as average_rating
          FROM sessions
          WHERE status = 'completed'
            AND date(started_at) >= ? AND date(started_at) <= ?
          GROUP BY date(started_at)
          ORDER BY date`
        )
        .all(startDate, endDate) as Record<string, unknown>[];
      return rows.map((r) => ({
        date: r.date as string,
        totalFocusMinutes: r.total_focus_minutes as number,
        sessionsCompleted: r.sessions_completed as number,
        averageRating: r.average_rating as number | null,
      }));
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.ANALYTICS_WEEKLY,
    async (_event, weeksBack: number) => {
      const db = getDatabase();
      const rows = db
        .prepare(
          `SELECT
            strftime('%Y-W%W', started_at) as week,
            date(started_at, 'weekday 0', '-6 days') as week_start,
            SUM(total_focus_time) / 3600.0 as total_focus_hours,
            COUNT(*) as sessions_completed,
            AVG(CASE WHEN focus_rating IS NOT NULL THEN focus_rating END) as average_rating
          FROM sessions
          WHERE status = 'completed'
            AND started_at >= date('now', '-' || ? || ' days')
          GROUP BY strftime('%Y-W%W', started_at)
          ORDER BY week`
        )
        .all(weeksBack * 7) as Record<string, unknown>[];
      return rows.map((r) => ({
        week: r.week as string,
        weekStart: r.week_start as string,
        totalFocusHours: r.total_focus_hours as number,
        sessionsCompleted: r.sessions_completed as number,
        averageRating: r.average_rating as number | null,
      }));
    }
  );

  ipcMain.handle(IPC_CHANNELS.ANALYTICS_STREAK, async () => {
    const db = getDatabase();

    // Get distinct dates with completed sessions, ordered descending
    const dates = db
      .prepare(
        `SELECT DISTINCT date(started_at) as d
         FROM sessions WHERE status = 'completed'
         ORDER BY d DESC`
      )
      .all() as { d: string }[];

    if (dates.length === 0) {
      return { currentStreak: 0, longestStreak: 0, lastActiveDate: null };
    }

    const today = new Date().toISOString().split("T")[0];
    const dateSet = new Set(dates.map((r) => r.d));

    // Calculate current streak
    let currentStreak = 0;
    let checkDate = new Date(today);
    // If today has no session, start from yesterday
    if (!dateSet.has(today)) {
      checkDate.setDate(checkDate.getDate() - 1);
    }
    while (dateSet.has(checkDate.toISOString().split("T")[0])) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // Calculate longest streak
    let longestStreak = 0;
    let streak = 1;
    const sortedDates = dates.map((r) => r.d).sort();
    for (let i = 1; i < sortedDates.length; i++) {
      const prev = new Date(sortedDates[i - 1]);
      const curr = new Date(sortedDates[i]);
      const diffDays =
        (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays === 1) {
        streak++;
      } else {
        longestStreak = Math.max(longestStreak, streak);
        streak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, streak);

    return {
      currentStreak,
      longestStreak,
      lastActiveDate: dates[0].d,
    };
  });

  ipcMain.handle(IPC_CHANNELS.ANALYTICS_SUMMARY, async () => {
    const db = getDatabase();
    const summary = db
      .prepare(
        `SELECT
          COUNT(*) as total_sessions,
          COALESCE(SUM(total_focus_time), 0) / 3600.0 as total_focus_hours,
          COALESCE(AVG(total_focus_time), 0) / 60.0 as average_session_length,
          AVG(CASE WHEN focus_rating IS NOT NULL THEN focus_rating END) as average_rating
        FROM sessions
        WHERE status = 'completed'`
      )
      .get() as Record<string, unknown>;

    return {
      totalSessions: summary.total_sessions as number,
      totalFocusHours: Math.round((summary.total_focus_hours as number) * 10) / 10,
      averageSessionLength:
        Math.round((summary.average_session_length as number) * 10) / 10,
      averageRating: summary.average_rating
        ? Math.round((summary.average_rating as number) * 10) / 10
        : null,
    };
  });
}
