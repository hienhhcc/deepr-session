"use client";

import { Flame, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StreakInfo } from "../../../shared/types/analytics";

interface StreakCardProps {
  streak: StreakInfo | null;
}

export function StreakCard({ streak }: StreakCardProps) {
  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Card className="card-hover-lift relative overflow-hidden">
      {/* Decorative background element */}
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full opacity-[0.06]"
        style={{ background: "oklch(0.5234 0.1347 144.1672)" }}
      />

      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-base">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Flame className="h-5 w-5 text-primary" />
          </div>
          Streak
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Current Streak
            </p>
            <p className="text-3xl font-bold tracking-tight">
              <span className="font-mono">{streak?.currentStreak ?? 0}</span>
              <span className="ml-1.5 text-sm font-normal text-muted-foreground">
                {streak?.currentStreak === 1 ? "day" : "days"}
              </span>
            </p>
          </div>
          <div className="space-y-1 text-right">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Longest Streak
            </p>
            <p className="text-3xl font-bold tracking-tight">
              <span className="font-mono">{streak?.longestStreak ?? 0}</span>
              <span className="ml-1.5 text-sm font-normal text-muted-foreground">
                {streak?.longestStreak === 1 ? "day" : "days"}
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Last active: {formatDate(streak?.lastActiveDate ?? null)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
