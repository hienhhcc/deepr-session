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
import type { DailyStat } from "../../../shared/types/analytics";

interface FocusChartProps {
  data: DailyStat[];
}

function formatXAxisDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function FocusChart({ data }: FocusChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Daily Focus (Last 30 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No focus data yet. Complete a session to see your chart.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--muted-foreground) / 0.2)"
              />
              <XAxis
                dataKey="date"
                tickFormatter={formatXAxisDate}
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
                  value: "Minutes",
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
                labelFormatter={formatXAxisDate}
                formatter={(value: number) => [`${value} min`, "Focus"]}
              />
              <Bar
                dataKey="totalFocusMinutes"
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
