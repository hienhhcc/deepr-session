"use client";

import { Target, Clock, Timer, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { AnalyticsSummary } from "../../../shared/types/analytics";

interface SummaryCardsProps {
  summary: AnalyticsSummary | null;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-3">
          <div className="text-primary">{icon}</div>
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const totalSessions = summary?.totalSessions ?? 0;
  const totalFocusHours = summary?.totalFocusHours ?? 0;
  const avgSessionLength = summary?.averageSessionLength ?? 0;
  const avgRating = summary?.averageRating;

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard
        icon={<Target className="h-5 w-5" />}
        label="Total Sessions"
        value={totalSessions.toString()}
      />
      <StatCard
        icon={<Clock className="h-5 w-5" />}
        label="Total Focus Hours"
        value={totalFocusHours.toFixed(1)}
      />
      <StatCard
        icon={<Timer className="h-5 w-5" />}
        label="Avg Session (min)"
        value={avgSessionLength.toFixed(0)}
      />
      <StatCard
        icon={<Star className="h-5 w-5" />}
        label="Avg Rating"
        value={avgRating != null ? avgRating.toFixed(1) : "N/A"}
      />
    </div>
  );
}
