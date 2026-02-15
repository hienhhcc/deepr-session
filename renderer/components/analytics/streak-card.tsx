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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Flame className="h-5 w-5 text-primary" />
          Streak
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Current Streak</p>
            <p className="text-3xl font-bold">
              {streak?.currentStreak ?? 0}
              <span className="text-base font-normal text-muted-foreground ml-1">
                {streak?.currentStreak === 1 ? "day" : "days"}
              </span>
            </p>
          </div>
          <div className="space-y-1 text-right">
            <p className="text-sm text-muted-foreground">Longest Streak</p>
            <p className="text-3xl font-bold">
              {streak?.longestStreak ?? 0}
              <span className="text-base font-normal text-muted-foreground ml-1">
                {streak?.longestStreak === 1 ? "day" : "days"}
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Last active: {formatDate(streak?.lastActiveDate ?? null)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
