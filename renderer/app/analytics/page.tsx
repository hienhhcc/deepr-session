"use client";

import { useEffect, useState } from "react";
import { BarChart3, Loader2 } from "lucide-react";
import { getElectronAPI } from "@/lib/electron-api";
import { SummaryCards } from "@/components/analytics/summary-cards";
import { StreakCard } from "@/components/analytics/streak-card";
import { FocusChart } from "@/components/analytics/focus-chart";
import { WeeklySummaryChart } from "@/components/analytics/weekly-summary";
import type {
  AnalyticsSummary,
  StreakInfo,
  DailyStat,
  WeeklySummary,
} from "../../../shared/types/analytics";

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [streak, setStreak] = useState<StreakInfo | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<WeeklySummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      const api = getElectronAPI();
      if (!api) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const now = new Date();
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);

        const startDate = thirtyDaysAgo.toISOString().split("T")[0];
        const endDate = now.toISOString().split("T")[0];

        const [summaryData, streakData, dailyData, weeklyData] =
          await Promise.all([
            api.analytics.summary(),
            api.analytics.streak(),
            api.analytics.daily(startDate, endDate),
            api.analytics.weekly(12),
          ]);

        setSummary(summaryData ?? null);
        setStreak(streakData ?? null);
        setDailyStats(dailyData ?? []);
        setWeeklyStats(weeklyData ?? []);
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, []);

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
          <BarChart3 className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Track your focus patterns and progress
          </p>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground animate-fade-in">
          <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary/50" />
          <p className="text-sm">Loading analytics...</p>
        </div>
      )}

      {!loading && (
        <div className="stagger-children space-y-6">
          {/* Summary cards row */}
          <SummaryCards summary={summary} />

          {/* Streak + Focus chart side by side */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <StreakCard streak={streak} />
            </div>
            <div className="lg:col-span-2">
              <FocusChart data={dailyStats} />
            </div>
          </div>

          {/* Weekly summary full width */}
          <WeeklySummaryChart data={weeklyStats} />
        </div>
      )}
    </div>
  );
}
