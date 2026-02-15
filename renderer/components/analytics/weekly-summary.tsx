"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WeeklySummary as WeeklySummaryType } from "../../../shared/types/analytics";

interface WeeklySummaryChartProps {
  data: WeeklySummaryType[];
}

function formatWeekStart(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function WeeklySummaryChart({ data }: WeeklySummaryChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Weekly Focus (Last 12 Weeks)</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No weekly data yet. Keep focusing to build your history.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--muted-foreground) / 0.2)"
              />
              <XAxis
                dataKey="weekStart"
                tickFormatter={formatWeekStart}
                fontSize={12}
                tickLine={false}
                axisLine={false}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis
                fontSize={12}
                tickLine={false}
                axisLine={false}
                stroke="hsl(var(--muted-foreground))"
                label={{
                  value: "Hours",
                  angle: -90,
                  position: "insideLeft",
                  style: {
                    fontSize: 12,
                    fill: "hsl(var(--muted-foreground))",
                  },
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: 13,
                }}
                labelFormatter={formatWeekStart}
                formatter={(value: number) => [
                  `${value.toFixed(1)} hrs`,
                  "Focus",
                ]}
              />
              <Bar
                dataKey="totalFocusHours"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
